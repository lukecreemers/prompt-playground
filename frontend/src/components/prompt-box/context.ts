import { createContext, useContext } from 'react';

export interface PromptBoxContextValue {
  variableValues: Record<string, string>;
  hasEditableVariables: boolean;
  onEditVariable?: (varName: string) => void;
}

export const PromptBoxContext = createContext<PromptBoxContextValue>({
  variableValues: {},
  hasEditableVariables: false,
});

export function usePromptBoxContext() {
  return useContext(PromptBoxContext);
}
