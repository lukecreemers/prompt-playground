import { TestCaseToolbar } from './TestCaseToolbar';
import { EvalHarnessEditor } from './EvalHarnessEditor';
import { TestCaseTable } from './TestCaseTable';
import { useStore } from '@/store';

export function TestCasesTab() {
  const activePrompt = useStore((s) => s.activePrompt);

  if (!activePrompt) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create a prompt to manage test cases
      </div>
    );
  }

  const evalEnabled = activePrompt.evalPrompt !== null && activePrompt.evalPrompt !== undefined;

  return (
    <div className="flex flex-col h-full surface-panel overflow-hidden">
      <TestCaseToolbar />
      {evalEnabled && <EvalHarnessEditor />}
      <div className="flex-1 overflow-auto">
        <TestCaseTable />
      </div>
    </div>
  );
}
