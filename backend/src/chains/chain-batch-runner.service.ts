import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { PromptsService } from '../prompts/prompts.service';
import { CodeFunctionsService } from '../code-functions/code-functions.service';
import { CodeExecutionService } from '../code-functions/code-execution.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';
import { getModelInfo } from '../ai/config/model-catalog';
import { ChainTestCase } from '../database/entities/chain-test-case.entity';
import { ChainNode } from '../database/entities/chain-node.entity';
import { ChainEdge } from '../database/entities/chain-edge.entity';
import pLimit from 'p-limit';

type SendFn = (event: string, data: any) => void;

interface BatchOptions {
  chainId: string;
  nodes: ChainNode[];
  edges: ChainEdge[];
  testCases: ChainTestCase[];
  concurrencyLimit: number;
}

function evaluateCondition(input: string, operator: string, value: string): boolean {
  switch (operator) {
    case 'equals': return input === value;
    case 'contains': return input.includes(value);
    case 'startsWith': return input.startsWith(value);
    case 'endsWith': return input.endsWith(value);
    case 'regex': return new RegExp(value).test(input);
    default: return false;
  }
}

@Injectable()
export class ChainBatchRunnerService {
  private aborted = false;

  constructor(
    private readonly ai: AiService,
    private readonly promptsService: PromptsService,
    private readonly codeFunctionsService: CodeFunctionsService,
    private readonly codeExecutionService: CodeExecutionService,
    @InjectRepository(ChainTestCase)
    private readonly tcRepo: Repository<ChainTestCase>,
  ) {}

  stopAll(): void {
    this.aborted = true;
  }

  async runBatch(options: BatchOptions, send: SendFn, isClosed: () => boolean): Promise<void> {
    const { nodes, edges, testCases, concurrencyLimit } = options;
    this.aborted = false;
    const limit = pLimit(concurrencyLimit || 5);

    send('batch_start', { totalCases: testCases.length });

    const outputNodeId = nodes.find((n) => n.type === 'output')?.id;

    const tasks = testCases.map((tc) =>
      limit(async () => {
        if (isClosed() || this.aborted) return;

        const variableOverrides = JSON.parse(tc.variables || '{}');

        send('case_start', { testCaseId: tc.id });
        await this.tcRepo.update(tc.id, { status: 'running', output: null, thinking: null, evalResult: null, durationMs: null, cost: null });

        try {
          // Deep-clone every node's config, applying variable overrides
          const nodeConfigs = new Map<string, any>();
          for (const node of nodes) {
            const config = JSON.parse(node.config || '{}');
            if (node.type === 'variable') {
              const varName = config.name;
              if (varName && variableOverrides[varName] !== undefined) {
                config.text = variableOverrides[varName];
              }
            }
            nodeConfigs.set(node.id, config);
          }

          const result = await this.executeChain(nodes, edges, nodeConfigs, isClosed);

          const capturedOutput = outputNodeId ? (result.outputs.get(outputNodeId) || '') : '';
          const { durationMs, cost } = result;

          await this.tcRepo.update(tc.id, {
            output: capturedOutput,
            status: 'completed',
            durationMs,
            cost,
          });

          send('case_done', { testCaseId: tc.id, output: capturedOutput, durationMs, cost });
        } catch (err: any) {
          await this.tcRepo.update(tc.id, { status: 'failed', output: err.message });
          send('case_error', { testCaseId: tc.id, error: err.message });
        }
      }),
    );

    await Promise.all(tasks);
  }

  /**
   * Self-contained DAG executor for a single test case.
   * All state is local — no shared mutation, safe for parallel calls.
   */
  private async executeChain(
    nodes: ChainNode[],
    edges: ChainEdge[],
    nodeConfigs: Map<string, any>,
    isClosed: () => boolean,
  ): Promise<{ outputs: Map<string, string>; durationMs: number; cost: number | null }> {
    const startTime = Date.now();
    const cancelled = () => isClosed() || this.aborted;
    let totalCost = 0;
    let hasCost = false;

    // Build adjacency
    const inbound = new Map<string, ChainEdge[]>();
    const outbound = new Map<string, ChainEdge[]>();
    const nodeMap = new Map<string, ChainNode>();

    for (const node of nodes) {
      nodeMap.set(node.id, node);
      inbound.set(node.id, []);
      outbound.set(node.id, []);
    }
    for (const edge of edges) {
      inbound.get(edge.targetNodeId)?.push(edge);
      outbound.get(edge.sourceNodeId)?.push(edge);
    }

    // Cycle detection (Kahn's)
    const inDegree = new Map<string, number>();
    for (const node of nodes) {
      inDegree.set(node.id, inbound.get(node.id)!.length);
    }
    const tempQueue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) tempQueue.push(id);
    }
    let visited = 0;
    const q = [...tempQueue];
    while (q.length > 0) {
      const id = q.shift()!;
      visited++;
      for (const edge of outbound.get(id) || []) {
        const nd = inDegree.get(edge.targetNodeId)! - 1;
        inDegree.set(edge.targetNodeId, nd);
        if (nd === 0) q.push(edge.targetNodeId);
      }
    }
    if (visited !== nodes.length) {
      throw new Error('Cycle detected in chain graph');
    }

    // Execution state — all local, no mutation of shared objects
    const nodeInputs = new Map<string, Map<string, string>>();
    const nodeOutputs = new Map<string, string>();
    const nodeOutputMap = new Map<string, Record<string, string>>();
    const matchedHandles = new Map<string, string>(); // conditional node results
    const completed = new Set<string>();
    const running = new Map<string, Promise<void>>();

    for (const node of nodes) {
      nodeInputs.set(node.id, new Map());
    }

    const ready = new Set<string>();
    for (const node of nodes) {
      if (inbound.get(node.id)!.length === 0) ready.add(node.id);
    }

    const fireNode = async (nodeId: string): Promise<void> => {
      if (cancelled()) return;

      const node = nodeMap.get(nodeId)!;
      const config = nodeConfigs.get(nodeId);

      try {
        if (node.type === 'variable' || node.type === 'constants') {
          nodeOutputs.set(nodeId, config.text || '');

        } else if (node.type === 'output') {
          const input = nodeInputs.get(nodeId)?.get('input') || '';
          nodeOutputs.set(nodeId, input);

        } else if (node.type === 'prompt') {
          const prompt = await this.promptsService.findOne(config.promptId);
          const inputs = nodeInputs.get(nodeId)!;
          const variables: Record<string, string> = {};
          for (const [handle, value] of inputs) {
            if (handle === 'trigger') continue;
            variables[handle] = value;
          }
          const interpolated = prompt.content.replace(
            /\{\{(\w+)\}\}/g,
            (_, key) => variables[key] || '',
          );

          const modelName = config.modelName || prompt.modelName;
          const temperature = config.temperature ?? prompt.temperature;
          const maxTokens = config.maxTokens ?? prompt.maxTokens;
          const thinkingEnabled = config.thinkingEnabled ?? prompt.thinkingEnabled;
          const thinkingBudget = config.thinkingBudget !== undefined ? config.thinkingBudget : prompt.thinkingBudget;

          const request: LlmRequest = {
            model: modelName,
            prompt: interpolated,
            temperature,
            maxTokens,
            thinking: thinkingEnabled
              ? { enabled: true, budgetTokens: thinkingBudget || undefined }
              : undefined,
          };

          let fullText = '';
          let usage: any = null;
          await new Promise<void>((resolve, reject) => {
            if (cancelled()) { resolve(); return; }
            const sub = this.ai.stream(request).subscribe({
              next: (chunk) => {
                if (cancelled()) { sub.unsubscribe(); resolve(); return; }
                if (chunk.type === 'text_delta') fullText += chunk.content;
                else if (chunk.type === 'done') usage = chunk.metadata?.usage || null;
                else if (chunk.type === 'error') { sub.unsubscribe(); reject(new Error(chunk.content)); }
              },
              complete: () => resolve(),
              error: (err) => reject(err),
            });
          });

          // Accumulate cost from this prompt node
          if (usage) {
            const model = getModelInfo(modelName);
            if (model) {
              totalCost += ((usage.input_tokens || 0) * model.inputTokenCost + (usage.output_tokens || 0) * model.outputTokenCost) / 1_000_000;
              hasCost = true;
            }
          }

          nodeOutputs.set(nodeId, fullText);

        } else if (node.type === 'conditional') {
          const input = nodeInputs.get(nodeId)?.get('input') || '';
          const conditions: { label: string; operator: string; value: string }[] = config.conditions || [];
          let matched = 'else';
          for (const cond of conditions) {
            if (evaluateCondition(input, cond.operator, cond.value)) {
              matched = cond.label;
              break;
            }
          }
          nodeOutputs.set(nodeId, input);
          matchedHandles.set(nodeId, matched); // local map, not mutation

        } else if (node.type === 'code') {
          const codeFn = await this.codeFunctionsService.findOne(config.codeFunctionId);
          const inputs = nodeInputs.get(nodeId)!;
          const inputMap: Record<string, string> = {};
          for (const [handle, value] of inputs) {
            if (handle === 'trigger') continue;
            inputMap[handle] = value;
          }
          const outputNames: string[] = JSON.parse(codeFn.outputs || '[]');
          const result = await this.codeExecutionService.execute(codeFn.code, inputMap, outputNames);
          nodeOutputs.set(nodeId, JSON.stringify(result));
          nodeOutputMap.set(nodeId, result);

        } else if (node.type === 'merge') {
          const inputs = nodeInputs.get(nodeId)!;
          let mergeOutput = '';
          for (let i = 0; i < (config.inputCount || 2); i++) {
            const val = inputs.get(`input_${i}`);
            if (val !== undefined) { mergeOutput = val; break; }
          }
          nodeOutputs.set(nodeId, mergeOutput);
        }

        completed.add(nodeId);

        // Propagate to downstream nodes
        const output = nodeOutputs.get(nodeId) || '';
        const mh = matchedHandles.get(nodeId);

        for (const edge of outbound.get(nodeId) || []) {
          if (node.type === 'conditional' && edge.sourceHandle !== mh) continue;

          const perHandle = nodeOutputMap.get(nodeId);
          const value = perHandle && edge.sourceHandle && edge.sourceHandle in perHandle
            ? perHandle[edge.sourceHandle]
            : output;
          nodeInputs.get(edge.targetNodeId)?.set(edge.targetHandle, value);

          const targetNode = nodeMap.get(edge.targetNodeId)!;
          const targetInbound = inbound.get(edge.targetNodeId)!;
          const targetInputMap = nodeInputs.get(edge.targetNodeId)!;

          const allReady = targetNode.type === 'merge'
            ? true
            : targetInbound.every((e) => targetInputMap.has(e.targetHandle));

          if (allReady && !completed.has(edge.targetNodeId) && !running.has(edge.targetNodeId)) {
            ready.add(edge.targetNodeId);
          }
        }
      } catch (err: any) {
        // Node failed — mark completed so we don't block the DAG
        completed.add(nodeId);
      }
    };

    // Main loop
    while (ready.size > 0 || running.size > 0) {
      if (cancelled()) break;
      for (const nodeId of ready) {
        ready.delete(nodeId);
        const p = fireNode(nodeId).then(() => { running.delete(nodeId); });
        running.set(nodeId, p);
      }
      if (running.size > 0) {
        await Promise.race(running.values());
      }
    }

    return { outputs: nodeOutputs, durationMs: Date.now() - startTime, cost: hasCost ? totalCost : null };
  }
}
