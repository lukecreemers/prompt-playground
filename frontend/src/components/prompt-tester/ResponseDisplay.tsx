import { useMemo } from 'react';
import { useStore } from '@/store';
import { ThinkingBlock } from './ThinkingBlock';
import { MarkdownOutput } from './MarkdownOutput';
import { Loader2, Play } from 'lucide-react';
import { TokenUsage, ModelInfo } from '@/types';

function calcCosts(usage: TokenUsage, model: ModelInfo) {
  const inputCost = (usage.input_tokens * model.inputTokenCost) / 1_000_000;
  const outputCost = (usage.output_tokens * model.outputTokenCost) / 1_000_000;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function formatCost(cost: number) {
  if (cost < 0.0001) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

export function ResponseDisplay() {
  const response = useStore((s) => s.testerResponse);
  const thinking = useStore((s) => s.testerThinking);
  const status = useStore((s) => s.testerStatus);
  const testerUsage = useStore((s) => s.testerUsage);
  const activePrompt = useStore((s) => s.activePrompt);
  const models = useStore((s) => s.models);

  const costInfo = useMemo(() => {
    if (!testerUsage || status !== 'completed' || !activePrompt) return null;
    const model = models.find((m) => m.id === activePrompt.modelName);
    if (!model) return null;
    const { outputCost, totalCost } = calcCosts(testerUsage, model);
    return { outputTokens: testerUsage.output_tokens, outputCost, totalCost };
  }, [testerUsage, status, activePrompt, models]);

  return (
    <div className="flex-1 flex flex-col p-5 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-label">Response</h3>
        {status === 'running' && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </div>
        )}
      </div>

      {!response && !thinking && status === 'idle' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 border border-dashed border-border rounded-xl p-8 text-center">
            <Play className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-sm font-medium text-foreground">No response yet</h3>
            <p className="text-xs text-muted-foreground">Run the prompt to see the response here</p>
          </div>
        </div>
      )}

      <div className="space-y-3 flex-1">
        {thinking && <ThinkingBlock content={thinking} />}
        {response && <MarkdownOutput content={response} />}
      </div>
      {costInfo && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
          Output: {costInfo.outputTokens.toLocaleString()} tokens · {formatCost(costInfo.outputCost)} | Total: {formatCost(costInfo.totalCost)}
        </p>
      )}
    </div>
  );
}
