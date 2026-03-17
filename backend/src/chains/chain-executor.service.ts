import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PromptsService } from '../prompts/prompts.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';
import { ChainNode } from '../database/entities/chain-node.entity';
import { ChainEdge } from '../database/entities/chain-edge.entity';

type SendFn = (event: string, data: any) => void;

@Injectable()
export class ChainExecutorService {
  private activeRuns = new Map<string, AbortController>();

  constructor(
    private readonly ai: AiService,
    private readonly promptsService: PromptsService,
  ) {}

  stop(chainId: string): void {
    const controller = this.activeRuns.get(chainId);
    if (controller) {
      controller.abort();
      this.activeRuns.delete(chainId);
    }
  }

  async execute(
    chainId: string,
    nodes: ChainNode[],
    edges: ChainEdge[],
    send: SendFn,
    isClosed: () => boolean,
  ): Promise<void> {
    // Abort any previous run for this chain
    this.stop(chainId);

    const abortController = new AbortController();
    this.activeRuns.set(chainId, abortController);
    const signal = abortController.signal;

    const cancelled = () => signal.aborted || isClosed();
    // Build adjacency maps
    const inbound = new Map<string, ChainEdge[]>(); // targetNodeId -> edges
    const outbound = new Map<string, ChainEdge[]>(); // sourceNodeId -> edges
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

    // Kahn's algorithm for cycle detection
    const inDegree = new Map<string, number>();
    for (const node of nodes) {
      inDegree.set(node.id, inbound.get(node.id)!.length);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId);
    }

    let visited = 0;
    const topoOrder: string[] = [];
    const tempQueue = [...queue];
    while (tempQueue.length > 0) {
      const nodeId = tempQueue.shift()!;
      topoOrder.push(nodeId);
      visited++;
      for (const edge of outbound.get(nodeId) || []) {
        const newDeg = inDegree.get(edge.targetNodeId)! - 1;
        inDegree.set(edge.targetNodeId, newDeg);
        if (newDeg === 0) tempQueue.push(edge.targetNodeId);
      }
    }

    if (visited !== nodes.length) {
      send('chain_error', { error: 'Cycle detected in chain graph' });
      return;
    }

    send('chain_start', { totalNodes: nodes.length });

    // Ready-fire execution
    const nodeInputs = new Map<string, Map<string, string>>(); // nodeId -> (handle -> value)
    const nodeOutputs = new Map<string, string>(); // nodeId -> output value
    const completed = new Set<string>();
    const running = new Map<string, Promise<void>>();

    // Initialize input maps
    for (const node of nodes) {
      nodeInputs.set(node.id, new Map());
    }

    // Find initially ready nodes (no inbound edges)
    const ready = new Set<string>();
    for (const node of nodes) {
      if (inbound.get(node.id)!.length === 0) {
        ready.add(node.id);
      }
    }

    const fireNode = async (nodeId: string): Promise<void> => {
      if (cancelled()) return;

      const node = nodeMap.get(nodeId)!;
      const config = JSON.parse(node.config || '{}');

      send('node_start', { nodeId, type: node.type });

      try {
        if (node.type === 'variable') {
          const output = config.text || '';
          nodeOutputs.set(nodeId, output);
          send('node_done', { nodeId, output });
        } else if (node.type === 'prompt') {
          const prompt = await this.promptsService.findOne(config.promptId);

          // Gather inputs for variable interpolation
          const inputs = nodeInputs.get(nodeId)!;
          const variables: Record<string, string> = {};
          for (const [handle, value] of inputs) {
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
          let fullThinking = '';

          await new Promise<void>((resolve, reject) => {
            if (cancelled()) { resolve(); return; }

            let settled = false;
            const settle = (fn: () => void) => {
              if (!settled) { settled = true; cleanup(); fn(); }
            };

            const sub = this.ai.stream(request).subscribe({
              next: (chunk) => {
                if (cancelled()) { settle(() => resolve()); return; }
                switch (chunk.type) {
                  case 'text_delta':
                    fullText += chunk.content;
                    send('node_text', { nodeId, content: chunk.content });
                    break;
                  case 'thinking_delta':
                    fullThinking += chunk.content;
                    send('node_thinking', { nodeId, content: chunk.content });
                    break;
                  case 'error':
                    settle(() => reject(new Error(chunk.content)));
                    break;
                }
              },
              complete: () => settle(() => resolve()),
              error: (err) => settle(() => reject(err)),
            });

            // Abort signal listener — fires immediately when stop() is called
            const onAbort = () => {
              sub.unsubscribe();
              settle(() => resolve());
            };
            signal.addEventListener('abort', onAbort);

            const cleanup = () => {
              signal.removeEventListener('abort', onAbort);
              sub.unsubscribe();
            };
          });

          nodeOutputs.set(nodeId, fullText);
          send('node_done', {
            nodeId,
            output: fullText,
            thinking: fullThinking || undefined,
          });
        }

        completed.add(nodeId);

        // Propagate output to downstream nodes
        const output = nodeOutputs.get(nodeId) || '';
        for (const edge of outbound.get(nodeId) || []) {
          nodeInputs.get(edge.targetNodeId)?.set(edge.targetHandle, output);

          // Check if target is now ready
          const targetInbound = inbound.get(edge.targetNodeId)!;
          const targetInputMap = nodeInputs.get(edge.targetNodeId)!;
          const allReady = targetInbound.every((e) => targetInputMap.has(e.targetHandle));

          if (allReady && !completed.has(edge.targetNodeId) && !running.has(edge.targetNodeId)) {
            ready.add(edge.targetNodeId);
          }
        }
      } catch (err: any) {
        send('node_error', { nodeId, error: err.message });
      }
    };

    // Main execution loop: fire ready nodes in parallel
    while (ready.size > 0 || running.size > 0) {
      if (cancelled()) return;

      // Launch all ready nodes
      for (const nodeId of ready) {
        ready.delete(nodeId);
        const promise = fireNode(nodeId).then(() => {
          running.delete(nodeId);
        });
        running.set(nodeId, promise);
      }

      // Wait for any running node to complete
      if (running.size > 0) {
        await Promise.race(running.values());
      }
    }

    this.activeRuns.delete(chainId);

    if (!cancelled()) {
      send('chain_done', { totalNodes: nodes.length });
    }
  }
}
