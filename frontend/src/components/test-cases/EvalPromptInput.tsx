import { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store';
import { detectVariables } from '@/lib/interpolate';
import { cn } from '@/lib/utils';

const BUILTIN_VARS: Record<string, string> = {
  output: 'The model output for this test case',
  prompt: 'The full prompt template content',
  variables: 'JSON string of all variable values',
};

interface AcState {
  matchStart: number;
  partial: string;
  index: number;
}

interface EvalPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EvalPromptInput({ value, onChange, placeholder, className }: EvalPromptInputProps) {
  const testerVariables = useStore((s) => s.testerVariables);
  const activePrompt = useStore((s) => s.activePrompt);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local state -- typing never hits the network
  const [text, setText] = useState(value);
  const [ac, setAc] = useState<AcState | null>(null);

  // Sync from parent when the prop changes externally (e.g. switching prompts)
  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setText(value);
    }
  }, [value]);

  const availableVars = useMemo(() => {
    const detected = activePrompt ? detectVariables(activePrompt.content) : [];
    const all = new Set([...Object.keys(BUILTIN_VARS), ...detected, ...Object.keys(testerVariables)]);
    return Array.from(all);
  }, [activePrompt, testerVariables]);

  const suggestions = useMemo(() => {
    if (!ac) return [];
    const partial = ac.partial.toLowerCase();
    return availableVars.filter((v) => v.toLowerCase().startsWith(partial));
  }, [ac, availableVars]);

  const getDropdownPosition = () => {
    const ta = textareaRef.current;
    if (!ta || !ac) return { top: 0, left: 0 };
    const rect = ta.getBoundingClientRect();
    const style = window.getComputedStyle(ta);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const paddingTop = parseFloat(style.paddingTop);
    const textBeforeCursor = text.slice(0, ac.matchStart + ac.partial.length + 2);
    const lines = textBeforeCursor.split('\n');
    const row = lines.length - 1;
    return {
      top: rect.top + paddingTop + (row + 1) * lineHeight - ta.scrollTop,
      left: rect.left + parseFloat(style.paddingLeft),
    };
  };

  const selectSuggestion = (varName: string) => {
    if (!ac) return;
    const before = text.slice(0, ac.matchStart);
    const cursorPos = textareaRef.current?.selectionStart ?? text.length;
    const after = text.slice(cursorPos);
    const newText = before + '{{' + varName + '}}' + after;
    const newCursorPos = before.length + varName.length + 4;
    setText(newText);
    setAc(null);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const onKeyUp = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = text.slice(0, ta.selectionStart);
    const match = before.match(/\{\{(\w*)$/);
    if (match) {
      const matchStart = ta.selectionStart - match[0].length;
      const partial = match[1];
      setAc((prev) => {
        if (prev && prev.matchStart === matchStart && prev.partial === partial) return prev;
        return { matchStart, partial, index: 0 };
      });
    } else {
      setAc(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!ac || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAc((prev) => prev ? { ...prev, index: (prev.index + 1) % suggestions.length } : null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAc((prev) => prev ? { ...prev, index: (prev.index - 1 + suggestions.length) % suggestions.length } : null);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectSuggestion(suggestions[ac.index]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAc(null);
    }
  };

  const handleBlur = () => {
    if (text !== value) onChange(text);
  };

  const dropdownPos = ac && suggestions.length > 0 ? getDropdownPosition() : null;

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
        onBlur={handleBlur}
        onClick={onKeyUp}
        placeholder={placeholder}
        className={cn("block w-full font-mono text-sm resize-y min-h-[100px] p-3 rounded-md border border-border/50 focus:border-primary/30 focus:outline-none leading-[1.5]", className)}
      />

      {ac && suggestions.length > 0 && dropdownPos && createPortal(
        <div
          className="fixed z-[9999] bg-popover border border-border rounded-md shadow-lg overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: 160 }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s}
              className={cn(
                'px-3 py-1.5 text-sm font-mono cursor-pointer hover:bg-accent/50',
                i === ac.index && 'bg-accent text-accent-foreground',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              onMouseEnter={() => setAc((prev) => prev ? { ...prev, index: i } : null)}
            >
              {s}
              {BUILTIN_VARS[s] && (
                <span className="ml-2 text-xs text-muted-foreground">{BUILTIN_VARS[s].slice(0, 30)}</span>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
