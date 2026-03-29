import { useStore } from '@/store';
import { useMemo } from 'react';

export function ChainTabBar() {
  const activeChainSubTab = useStore((s) => s.activeChainSubTab);
  const setActiveChainSubTab = useStore((s) => s.setActiveChainSubTab);
  const chainNodes = useStore((s) => s.chainNodes);

  const canShowTestCases = useMemo(() => {
    const hasOutput = chainNodes.some((n) => n.type === 'output');
    const hasVariable = chainNodes.some((n) => n.type === 'variable');
    return hasOutput && hasVariable;
  }, [chainNodes]);

  return (
    <div className="flex items-center border-b border-border px-4 bg-card">
      <button
        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
          activeChainSubTab === 'canvas'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => setActiveChainSubTab('canvas')}
      >
        Canvas
      </button>
      {canShowTestCases && (
        <button
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeChainSubTab === 'test-cases'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveChainSubTab('test-cases')}
        >
          Test Cases
        </button>
      )}
    </div>
  );
}
