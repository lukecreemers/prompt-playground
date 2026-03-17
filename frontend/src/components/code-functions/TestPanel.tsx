import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';

export function TestPanel() {
  const activeCodeFunction = useStore((s) => s.activeCodeFunction);
  const testInputs = useStore((s) => s.codeFunctionTestInputs);
  const testResult = useStore((s) => s.codeFunctionTestResult);
  const testError = useStore((s) => s.codeFunctionTestError);
  const testStatus = useStore((s) => s.codeFunctionTestStatus);
  const setTestInput = useStore((s) => s.setCodeFunctionTestInput);
  const runTest = useStore((s) => s.runCodeFunctionTest);

  if (!activeCodeFunction) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select a function to test
      </div>
    );
  }

  const inputs: string[] = JSON.parse(activeCodeFunction.inputs || '[]');
  const outputs: string[] = JSON.parse(activeCodeFunction.outputs || '[]');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Test Runner</span>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={runTest}
            disabled={testStatus === 'running'}
          >
            {testStatus === 'running' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Run Test
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input fields */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inputs</span>
          {inputs.length === 0 ? (
            <p className="text-xs text-muted-foreground/50">No inputs defined</p>
          ) : (
            inputs.map((name) => (
              <div key={name} className="space-y-1">
                <label className="text-xs font-mono text-blue-500">{name}</label>
                <textarea
                  value={testInputs[name] || ''}
                  onChange={(e) => setTestInput(name, e.target.value)}
                  placeholder={`Enter value for ${name}...`}
                  rows={3}
                  className="w-full text-sm font-mono bg-background border border-border rounded-md p-2 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))
          )}
        </div>

        {/* Output display */}
        {testResult && (
          <div className="space-y-3">
            <span className="text-xs font-medium text-green-500 uppercase tracking-wider">Outputs</span>
            {outputs.map((name) => (
              <div key={name} className="space-y-1">
                <label className="text-xs font-mono text-green-500">{name}</label>
                <div className="text-sm font-mono bg-muted/30 border border-border rounded-md p-2 whitespace-pre-wrap break-words min-h-[2rem]">
                  {testResult.outputs[name] ?? ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error display */}
        {testError && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Error</span>
            <div className="text-sm font-mono bg-red-500/10 border border-red-500/30 rounded-md p-2 text-red-500 whitespace-pre-wrap break-words">
              {testError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
