import { ChainTestCaseToolbar } from './ChainTestCaseToolbar';
import { ChainTestCaseTable } from './ChainTestCaseTable';
import { ChainEvalHarnessEditor } from './ChainEvalHarnessEditor';
import { useStore } from '@/store';

export function ChainTestCasesTab() {
  const activeChain = useStore((s) => s.activeChain);

  if (!activeChain) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create a chain to manage test cases
      </div>
    );
  }

  const evalEnabled = activeChain.evalPrompt !== null && activeChain.evalPrompt !== undefined;

  return (
    <div className="flex flex-col h-full surface-panel overflow-hidden">
      <ChainTestCaseToolbar />
      {evalEnabled && <ChainEvalHarnessEditor />}
      <div className="flex-1 overflow-auto">
        <ChainTestCaseTable />
      </div>
    </div>
  );
}
