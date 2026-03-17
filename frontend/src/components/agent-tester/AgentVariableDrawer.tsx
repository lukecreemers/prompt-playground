import { useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { detectVariables } from '@/lib/interpolate';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAutoSave } from '@/hooks/useAutoSave';

export function AgentVariableDrawer() {
  const drawerOpen = useStore((s) => s.agentDrawerOpen);
  const setDrawerOpen = useStore((s) => s.setAgentDrawerOpen);
  const agentVariables = useStore((s) => s.agentVariables);
  const setAgentVariable = useStore((s) => s.setAgentVariable);
  const saveAgentVariables = useStore((s) => s.saveAgentVariables);
  const focusVariable = useStore((s) => s.agentFocusVariable);
  const setFocusVariable = useStore((s) => s.setAgentFocusVariable);
  const activeAgent = useStore((s) => s.activeAgent);
  const agentMessages = useStore((s) => s.agentMessages);

  const detectedVars = useMemo(() => {
    const parts = [activeAgent?.systemPrompt || ''];
    for (const msg of agentMessages) {
      parts.push(msg.content);
    }
    return detectVariables(parts.join('\n'));
  }, [activeAgent?.systemPrompt, agentMessages]);

  useAutoSave(agentVariables, saveAgentVariables, 1000);

  useEffect(() => {
    if (!drawerOpen || !focusVariable) return;
    const timeout = setTimeout(() => {
      const el = document.querySelector<HTMLTextAreaElement>(
        `[data-agent-variable-input="${focusVariable}"]`
      );
      if (el) {
        el.focus();
        el.scrollIntoView({ block: 'nearest' });
      }
      setFocusVariable(null);
    }, 150);
    return () => clearTimeout(timeout);
  }, [drawerOpen, focusVariable, setFocusVariable]);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="w-[28rem] bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground">Variables</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {detectedVars.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No variables detected. Use {"{{variableName}}"} in your system prompt or messages.
            </p>
          ) : (
            detectedVars.map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <Label className="text-xs text-accent-foreground font-mono">{`{{${key}}}`}</Label>
                <Textarea
                  data-agent-variable-input={key}
                  value={agentVariables[key] || ''}
                  onChange={(e) => setAgentVariable(key, e.target.value)}
                  placeholder={`Value for ${key}`}
                  className="text-sm bg-muted/40 border-border/50 focus:border-primary/30 h-[120px] resize-none"
                />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
