import { useState } from 'react';
import { useStore } from '@/store';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, FlaskConical } from 'lucide-react';

export function EvalHarnessEditor() {
  const activePrompt = useStore((s) => s.activePrompt);
  const updatePrompt = useStore((s) => s.updatePrompt);
  const [open, setOpen] = useState(false);

  if (!activePrompt) return null;

  return (
    <div className="border-b border-border">
      <button
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium hover:bg-muted/50 text-left text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        <FlaskConical className="h-3.5 w-3.5" />
        <span className="text-xs">Eval Prompt</span>
        {activePrompt.evalPrompt && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            Available placeholders: {'{{output}}'}, {'{{prompt}}'}, {'{{variables}}'}, or any variable name like {'{{name}}'}.
          </p>
          <Textarea
            value={activePrompt.evalPrompt || ''}
            onChange={(e) => updatePrompt({ evalPrompt: e.target.value })}
            placeholder="Rate the following output on a scale of 1-10:\n\nPrompt: {{prompt}}\nOutput: {{output}}"
            className="font-mono text-sm min-h-[100px] bg-muted/40 border-border/50 focus:border-primary/30"
          />
        </div>
      )}
    </div>
  );
}
