import { useRef, useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store';
import { detectVariables } from '@/lib/interpolate';
import { cn } from '@/lib/utils';
import { PromptBox } from '@/components/prompt-box/PromptBox';

const BUILTIN_VARS = ['output', 'prompt', 'variables'];

interface EvalPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EvalPromptInput({ value, onChange, placeholder, className }: EvalPromptInputProps) {
  const testerVariables = useStore((s) => s.testerVariables);
  const activePrompt = useStore((s) => s.activePrompt);

  const [text, setText] = useState(value);

  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setText(value);
    }
  }, [value]);

  const availableVars = useMemo(() => {
    const detected = activePrompt ? detectVariables(activePrompt.content) : [];
    const all = new Set([...BUILTIN_VARS, ...detected, ...Object.keys(testerVariables)]);
    return Array.from(all);
  }, [activePrompt, testerVariables]);

  const handleChange = (newText: string) => {
    setText(newText);
  };

  const handleBlur = () => {
    if (text !== value) onChange(text);
  };

  return (
    <div className={cn('relative', className)}>
      <PromptBox
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        existingVariables={availableVars}
        hasEditableVariables={false}
        minHeight="100px"
        className="resize-y"
      />
    </div>
  );
}
