import { ChainSidebar } from './ChainSidebar';
import { ChainCanvas } from './ChainCanvas';
import { ChainTabBar } from './ChainTabBar';
import { ChainTestCasesTab } from './ChainTestCasesTab';
import { useStore } from '@/store';

export function ChainsPage() {
  const activeChainSubTab = useStore((s) => s.activeChainSubTab);
  const activeChainId = useStore((s) => s.activeChainId);

  return (
    <div className="flex h-full">
      <ChainSidebar />
      <div className="flex-1 flex flex-col">
        {activeChainId && <ChainTabBar />}
        {activeChainSubTab === 'canvas' ? <ChainCanvas /> : <ChainTestCasesTab />}
      </div>
    </div>
  );
}
