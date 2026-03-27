import { useMemo } from 'react';
import { useStore } from '@/store';
import { ThinkingBlock } from '@/components/prompt-tester/ThinkingBlock';
import { MarkdownOutput } from '@/components/prompt-tester/MarkdownOutput';
import { Button } from '@/components/ui/button';
import { Loader2, Play, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { TokenUsage, ModelInfo } from '@/types';

function calcCosts(usage: TokenUsage, model: ModelInfo) {
  const inputCost = ((usage.input_tokens || 0) * model.inputTokenCost) / 1_000_000;
  const outputCost = ((usage.output_tokens || 0) * model.outputTokenCost) / 1_000_000;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function formatCost(cost: number) {
  if (cost < 0.0001) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

export function AgentResponsePanel() {
  const response = useStore((s) => s.agentResponse);
  const thinking = useStore((s) => s.agentThinking);
  const status = useStore((s) => s.agentStatus);
  const usage = useStore((s) => s.agentUsage);
  const activeAgent = useStore((s) => s.activeAgent);
  const models = useStore((s) => s.models);
  const generations = useStore((s) => s.agentGenerations);
  const generationIndex = useStore((s) => s.agentGenerationIndex);
  const setAgentGenerationIndex = useStore((s) => s.setAgentGenerationIndex);
  const acceptAgentResponse = useStore((s) => s.acceptAgentResponse);

  const costInfo = useMemo(() => {
    if (!usage || status !== 'completed' || !activeAgent) return null;
    const model = models.find((m) => m.id === activeAgent.modelName);
    if (!model) return null;
    const { outputCost, totalCost } = calcCosts(usage, model);
    return { outputTokens: usage.output_tokens, outputCost, totalCost };
  }, [usage, status, activeAgent, models]);

  const hasGenerations = generations.length > 1;

  return (
    <div className="flex-1 flex flex-col p-5 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <h3 className="section-label">Response</h3>
          {response && <CopyButton text={response} />}
        </div>
        <div className="flex items-center gap-2">
          {hasGenerations && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={generationIndex === 0}
                onClick={() => setAgentGenerationIndex(generationIndex - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="tabular-nums">{generationIndex + 1}/{generations.length}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={generationIndex === generations.length - 1}
                onClick={() => setAgentGenerationIndex(generationIndex + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {status === 'running' && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </div>
          )}
        </div>
      </div>

      {!response && !thinking && status === 'idle' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 border border-dashed border-border rounded-xl p-8 text-center">
            <Play className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-sm font-medium text-foreground">No response yet</h3>
            <p className="text-xs text-muted-foreground">Run the agent to see the response here</p>
          </div>
        </div>
      )}

      <div className="space-y-3 flex-1">
        {thinking && <ThinkingBlock content={thinking} />}
        {response && <MarkdownOutput content={response} />}
      </div>

      {(status === 'completed' && generations.length > 0) && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5"
            onClick={acceptAgentResponse}
          >
            <Plus className="h-3.5 w-3.5" /> Add to Chain
          </Button>
        </div>
      )}

      {costInfo && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
          Output: {costInfo.outputTokens.toLocaleString()} tokens · {formatCost(costInfo.outputCost)} | Total: {formatCost(costInfo.totalCost)}
        </p>
      )}
    </div>
  );
}
