import { useCallback } from 'react';
import { useStore } from '@/store';
import { InputOutputEditor } from './InputOutputEditor';
import { CodeEditor } from './CodeEditor';
import { TestPanel } from './TestPanel';

export function CodeFunctionsPage() {
  const activeCodeFunction = useStore((s) => s.activeCodeFunction);
  const updateCodeFunction = useStore((s) => s.updateCodeFunction);

  const handleInputsChange = useCallback((items: string[]) => {
    updateCodeFunction({ inputs: JSON.stringify(items) });
  }, [updateCodeFunction]);

  const handleOutputsChange = useCallback((items: string[]) => {
    updateCodeFunction({ outputs: JSON.stringify(items) });
  }, [updateCodeFunction]);

  const handleCodeChange = useCallback((code: string) => {
    updateCodeFunction({ code });
  }, [updateCodeFunction]);

  if (!activeCodeFunction) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create a code function to get started
      </div>
    );
  }

  const inputs: string[] = JSON.parse(activeCodeFunction.inputs || '[]');
  const outputs: string[] = JSON.parse(activeCodeFunction.outputs || '[]');

  return (
    <div className="h-full p-3">
      <div className="h-full flex min-h-0 surface-panel overflow-hidden">
        {/* Left: Editor */}
        <div className="w-[60%] flex flex-col min-h-0 border-r border-border">
          {/* Inputs & Outputs */}
          <div className="px-4 py-2.5 space-y-2 shrink-0 border-b border-border">
            <InputOutputEditor
              label="Inputs"
              items={inputs}
              onChange={handleInputsChange}
              color="bg-accent text-accent-foreground"
            />
            <InputOutputEditor
              label="Outputs"
              items={outputs}
              onChange={handleOutputsChange}
              color="bg-accent text-accent-foreground"
            />
          </div>

          {/* Monaco editor - takes all remaining space */}
          <div className="flex-1 min-h-0 flex flex-col">
            <CodeEditor
              functionId={activeCodeFunction.id}
              value={activeCodeFunction.code}
              onChange={handleCodeChange}
            />
          </div>
        </div>

        {/* Right: Test panel */}
        <div className="w-[40%] flex flex-col min-h-0">
          <TestPanel />
        </div>
      </div>
    </div>
  );
}
