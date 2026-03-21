import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { detectVariables } from '@/lib/interpolate';
import { PromptBox } from '@/components/prompt-box/PromptBox';

export function SystemPromptEditor() {
  const activeAgent = useStore((s) => s.activeAgent);
  const updateAgent = useStore((s) => s.updateAgent);
  const syncAgentVariables = useStore((s) => s.syncAgentVariables);
  const setAgentDrawerOpen = useStore((s) => s.setAgentDrawerOpen);
  const setAgentFocusVariable = useStore((s) => s.setAgentFocusVariable);
  const agentVariables = useStore((s) => s.agentVariables);
  const agentMessages = useStore((s) => s.agentMessages);
  const [text, setText] = useState(activeAgent?.systemPrompt ?? '');

  // Detect variables across system prompt + all messages
  const allContent = useMemo(() => {
    const parts = [text];
    for (const msg of agentMessages) {
      parts.push(msg.content);
    }
    return parts.join('\n');
  }, [text, agentMessages]);

  const detectedVars = useMemo(() => detectVariables(allContent), [allContent]);

  const prevSystemPrompt = useRef(activeAgent?.systemPrompt);
  useEffect(() => {
    if (activeAgent?.systemPrompt !== prevSystemPrompt.current) {
      prevSystemPrompt.current = activeAgent?.systemPrompt;
      setText(activeAgent?.systemPrompt ?? '');
    }
  }, [activeAgent?.systemPrompt]);

  const handleChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleBlur = useCallback(async () => {
    if (text !== activeAgent?.systemPrompt) {
      await updateAgent({ systemPrompt: text });
      await syncAgentVariables();
    }
  }, [text, activeAgent?.systemPrompt, updateAgent, syncAgentVariables]);

  const handleEditVariable = useCallback((varName: string) => {
    setAgentFocusVariable(varName);
    setAgentDrawerOpen(true);
  }, [setAgentFocusVariable, setAgentDrawerOpen]);

  if (!activeAgent) return null;

  return (
    <div className="p-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <h3 className="section-label">System Prompt</h3>
          <CopyButton text={text} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => setAgentDrawerOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
          Variables ({detectedVars.length})
        </Button>
      </div>
      <PromptBox
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="System prompt (optional). Use {{variableName}} for variables..."
        existingVariables={detectedVars}
        variableValues={agentVariables}
        hasEditableVariables={true}
        onEditVariable={handleEditVariable}
        allowNewVariables={true}
        minHeight="12em"
        className="resize-y overflow-auto"
      />
    </div>
  );
}
