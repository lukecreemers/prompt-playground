import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Settings, FileText } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { TokenUsage, ModelInfo } from '@/types';
import { detectVariables } from '@/lib/interpolate';
import { PromptBox } from '@/components/prompt-box/PromptBox';

function calcCosts(usage: TokenUsage, model: ModelInfo) {
  const inputCost = (usage.input_tokens * model.inputTokenCost) / 1_000_000;
  const outputCost = (usage.output_tokens * model.outputTokenCost) / 1_000_000;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function formatCost(cost: number) {
  if (cost < 0.0001) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

export function PromptEditor() {
  const activePrompt = useStore((s) => s.activePrompt);
  const updatePrompt = useStore((s) => s.updatePrompt);
  const syncVariables = useStore((s) => s.syncVariables);
  const setDrawerOpen = useStore((s) => s.setDrawerOpen);
  const setFocusVariable = useStore((s) => s.setFocusVariable);
  const testerVariables = useStore((s) => s.testerVariables);
  const testerUsage = useStore((s) => s.testerUsage);
  const testerStatus = useStore((s) => s.testerStatus);
  const models = useStore((s) => s.models);
  const [text, setText] = useState(activePrompt?.content ?? '');
  const detectedVars = useMemo(() => detectVariables(text), [text]);

  const inputCostInfo = useMemo(() => {
    if (!testerUsage || testerStatus !== 'completed' || !activePrompt) return null;
    const model = models.find((m) => m.id === activePrompt.modelName);
    if (!model) return null;
    const { inputCost } = calcCosts(testerUsage, model);
    return { tokens: testerUsage.input_tokens, cost: inputCost };
  }, [testerUsage, testerStatus, activePrompt, models]);

  const prevContent = useRef(activePrompt?.content);
  useEffect(() => {
    if (activePrompt?.content !== prevContent.current) {
      prevContent.current = activePrompt?.content;
      setText(activePrompt?.content ?? '');
    }
  }, [activePrompt?.content]);

  const handleChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleBlur = useCallback(async () => {
    if (text !== activePrompt?.content) {
      await updatePrompt({ content: text });
      await syncVariables();
    }
  }, [text, activePrompt?.content, updatePrompt, syncVariables]);

  const handleEditVariable = useCallback((varName: string) => {
    setFocusVariable(varName);
    setDrawerOpen(true);
  }, [setFocusVariable, setDrawerOpen]);

  if (!activePrompt) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 border border-dashed border-border rounded-xl p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground">No prompt selected</h3>
          <p className="text-xs text-muted-foreground">Select or create a prompt to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <h3 className="section-label">Prompt Template</h3>
          <CopyButton text={text} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => setDrawerOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
          Variables ({detectedVars.length})
        </Button>
      </div>
      <div className="relative flex-1 min-h-[300px]">
        <PromptBox
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Write your prompt here. Use {{variableName}} for variables..."
          existingVariables={detectedVars}
          variableValues={testerVariables}
          hasEditableVariables={true}
          onEditVariable={handleEditVariable}
          allowNewVariables={true}
          className="absolute inset-0"
        />
      </div>
      {inputCostInfo && (
        <p className="text-xs text-muted-foreground mt-2">
          Input: {inputCostInfo.tokens.toLocaleString()} tokens · {formatCost(inputCostInfo.cost)}
        </p>
      )}
    </div>
  );
}
