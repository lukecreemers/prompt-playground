import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { segmentText } from '@/lib/interpolate';
import { Badge } from '@/components/ui/badge';
import { useDetectedVariables } from '@/hooks/useDetectedVariables';
import { Settings, FileText } from 'lucide-react';

export function PromptEditor() {
  const activePrompt = useStore((s) => s.activePrompt);
  const updatePrompt = useStore((s) => s.updatePrompt);
  const syncVariables = useStore((s) => s.syncVariables);
  const setDrawerOpen = useStore((s) => s.setDrawerOpen);
  const detectedVars = useDetectedVariables();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayInnerRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState(activePrompt?.content ?? '');

  // Sync from store when it changes externally (e.g. switching prompts)
  const prevContent = useRef(activePrompt?.content);
  useEffect(() => {
    if (activePrompt?.content !== prevContent.current) {
      prevContent.current = activePrompt?.content;
      setText(activePrompt?.content ?? '');
    }
  }, [activePrompt?.content]);

  const segments = useMemo(() => segmentText(text), [text]);

  const syncScroll = useCallback(() => {
    if (overlayInnerRef.current && textareaRef.current) {
      const ta = textareaRef.current;
      overlayInnerRef.current.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    }
  }, []);

  // Keep overlay width matched to textarea's content width (excludes scrollbar)
  useEffect(() => {
    const ta = textareaRef.current;
    const inner = overlayInnerRef.current;
    if (!ta || !inner) return;
    const sync = () => { inner.style.width = ta.clientWidth + 'px'; };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(ta);
    return () => ro.disconnect();
  }, []);

  const handleBlur = useCallback(async () => {
    if (text !== activePrompt?.content) {
      await updatePrompt({ content: text });
      await syncVariables();
    }
  }, [text, activePrompt?.content, updatePrompt, syncVariables]);

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
      <div className="relative flex-1 bg-muted/40 rounded-md">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onScroll={syncScroll}
          placeholder=""
          className="relative z-[2] w-full h-full resize-none font-mono text-sm text-transparent caret-foreground selection:bg-primary/20 bg-transparent min-h-[300px] p-3 rounded-md border border-border/50 focus:border-primary/30 focus:outline-none leading-[1.5]"
        />
        <div
          aria-hidden
          className="absolute inset-px z-[1] overflow-hidden pointer-events-none rounded-md"
        >
          <div
            ref={overlayInnerRef}
            className="font-mono text-sm p-3 whitespace-pre-wrap break-words leading-[1.5]"
          >
            {text ? segments.map((seg, i) =>
              seg.isVariable ? (
                <span key={i} className="text-primary">{seg.text}</span>
              ) : (
                <span key={i} className="text-foreground">{seg.text}</span>
              ),
            ) : (
              <span className="text-muted-foreground/40">Write your prompt here. Use {'{{variableName}}'} for variables...</span>
            )}
          </div>
        </div>
      </div>
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
