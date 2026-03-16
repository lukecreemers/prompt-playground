import { useMemo } from 'react';
import { useStore } from '../store';
import { detectVariables } from '../lib/interpolate';

export function useDetectedVariables(): string[] {
  const content = useStore((s) => s.activePrompt?.content || '');
  return useMemo(() => detectVariables(content), [content]);
}
