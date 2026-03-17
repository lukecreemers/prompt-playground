import { useRef, useMemo, useCallback, useState, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from prop when the external value changes (e.g. switching functions)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const lineCount = useMemo(() => {
    const lines = localValue.split('\n').length;
    return Math.max(lines, 20);
  }, [localValue]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [lineCount]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = localValue.substring(0, start) + '  ' + localValue.substring(end);
      handleChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [localValue, handleChange]);

  return (
    <div className="flex-1 flex border border-border rounded-md overflow-hidden bg-zinc-950 min-h-0">
      <div className="select-none text-right pr-2 pl-2 pt-3 pb-3 text-xs font-mono text-zinc-600 bg-zinc-900/50 border-r border-border leading-[1.5rem] overflow-hidden">
        {lineNumbers.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-zinc-200 text-sm font-mono p-3 resize-none focus:outline-none leading-[1.5rem] min-h-0"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}
