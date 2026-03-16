import { useCallback } from 'react';
import { useStore } from '@/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDetectedVariables } from '@/hooks/useDetectedVariables';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Settings, FileText } from 'lucide-react';

export function PromptEditor() {
  const activePrompt = useStore((s) => s.activePrompt);
  const updatePrompt = useStore((s) => s.updatePrompt);
  const syncVariables = useStore((s) => s.syncVariables);
  const setDrawerOpen = useStore((s) => s.setDrawerOpen);
  const detectedVars = useDetectedVariables();

  const handleContentChange = useCallback(
    async (content: string) => {
      await updatePrompt({ content });
      await syncVariables();
    },
    [updatePrompt, syncVariables],
  );

  useAutoSave(activePrompt?.content, () => {
    // Content is already saved via handleContentChange
  }, 2000);

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
        <h3 className="section-label">Prompt Template</h3>
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
      <Textarea
        value={activePrompt.content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Write your prompt here. Use {{variableName}} for variables..."
        className="flex-1 resize-none font-mono text-sm min-h-[300px] bg-muted/40 border-border/50 focus:bg-muted/60 focus:border-primary/30 placeholder:text-muted-foreground/40"
      />
      {detectedVars.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {detectedVars.map((v) => (
            <Badge key={v} variant="outline" className="bg-primary/10 text-accent-foreground border-primary/20 font-mono text-xs px-2 py-0.5">
              {`{{${v}}}`}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
