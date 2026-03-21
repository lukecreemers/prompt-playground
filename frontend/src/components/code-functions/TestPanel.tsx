import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, AlertCircle } from 'lucide-react';

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

  const statusClass = testStatus === 'running'
    ? 'status-running'
    : testError
      ? 'status-failed'
      : testResult
        ? 'status-completed'
        : 'status-idle';

  const statusLabel = testStatus === 'running'
    ? 'Running'
    : testError
      ? 'Error'
      : testResult
        ? 'Completed'
        : 'Idle';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
        <span className="section-label">Test</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusClass}`}>
          {statusLabel}
        </Badge>
        <div className="flex-1" />
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
          Run
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input fields */}
        {inputs.length === 0 ? (
          <p className="text-xs text-muted-foreground/50">No inputs defined</p>
        ) : (
          <div className="space-y-2">
            {inputs.map((name) => (
              <div key={name} className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">{name}</label>
                <textarea
                  value={testInputs[name] || ''}
                  onChange={(e) => setTestInput(name, e.target.value)}
                  placeholder={`Enter value for ${name}...`}
                  rows={2}
                  className="w-full text-sm font-mono bg-background border border-border rounded-md p-2 resize-y focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            ))}
          </div>
        )}

        {/* Output display */}
        {testResult && (
          <div className="space-y-2">
            <span className="section-label">Outputs</span>
            {outputs.map((name) => (
              <div key={name} className="border-l-2 border-primary/30 pl-3 space-y-1">
                <label className="text-xs font-mono text-accent-foreground">{name}</label>
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
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="section-label text-destructive">Error</span>
            </div>
            <div className="text-sm font-mono status-failed border rounded-md p-2 whitespace-pre-wrap break-words">
              {testError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
