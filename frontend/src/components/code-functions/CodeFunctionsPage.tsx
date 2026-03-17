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
    <div className="flex-1 flex min-h-0">
      {/* Left: Editor */}
      <div className="w-1/2 flex flex-col min-h-0 border-r border-border">
        <div className="p-4 space-y-4 overflow-y-auto shrink-0">
          <InputOutputEditor
            label="Inputs"
            items={inputs}
            onChange={handleInputsChange}
            color="bg-blue-500/10 text-blue-500"
          />
          <InputOutputEditor
            label="Outputs"
            items={outputs}
            onChange={handleOutputsChange}
            color="bg-green-500/10 text-green-500"
          />
        </div>
        <div className="px-4 pb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</span>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Access inputs via <code className="text-zinc-400">inputs.name</code>. Return an object with output keys.
          </p>
        </div>
        <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col">
          <CodeEditor value={activeCodeFunction.code} onChange={handleCodeChange} />
        </div>
      </div>

      {/* Right: Test panel */}
      <div className="w-1/2 flex flex-col min-h-0">
        <TestPanel />
      </div>
    </div>
  );
}
