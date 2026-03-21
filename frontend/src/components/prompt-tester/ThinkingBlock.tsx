import { useState } from 'react';
import { ChevronRight, Brain } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-primary/20 rounded-lg bg-primary/5">
      <button
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-primary/10 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        <Brain className="h-3.5 w-3.5" />
        Thinking
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="flex justify-end mb-1">
            <CopyButton text={content} />
          </div>
          <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono overflow-auto max-h-96 leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
