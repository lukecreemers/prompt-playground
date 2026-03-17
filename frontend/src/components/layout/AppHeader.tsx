import { useCallback } from 'react';
import { useStore } from '@/store';
import { useChainExecution } from '@/hooks/useChainExecution';
import { PromptNameEditor } from './PromptNameEditor';
import { AgentNameEditor } from './AgentNameEditor';
import { ChainNameEditor } from '@/components/chains/ChainNameEditor';
import { CodeFunctionNameEditor } from './CodeFunctionNameEditor';
import { ModelConfigBar } from './ModelConfigBar';
import { RunButton } from './RunButton';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Save } from 'lucide-react';

export function AppHeader() {
  const activePage = useStore((s) => s.activePage);
  const activeSubTab = useStore((s) => s.activeSubTab);
  const setActiveSubTab = useStore((s) => s.setActiveSubTab);
  const chainStatus = useStore((s) => s.chainStatus);
  const activeChainId = useStore((s) => s.activeChainId);
  const saveChainGraph = useStore((s) => s.saveChainGraph);
  const { runChain, stopChain } = useChainExecution();

  const handleSave = useCallback(() => {
    saveChainGraph();
  }, [saveChainGraph]);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-3 py-2.5 flex items-center gap-3">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      {activePage === 'code-functions' ? <CodeFunctionNameEditor /> : activePage === 'agent-tester' ? <AgentNameEditor /> : activePage === 'chains' ? <ChainNameEditor /> : <PromptNameEditor />}
      {activePage === 'prompt-tester' && (
        <div className="flex-1 flex justify-center">
          <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)}>
            <TabsList>
              <TabsTrigger value="tester">Prompt Tester</TabsTrigger>
              <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      {activePage !== 'prompt-tester' && <div className="flex-1" />}
      {activePage === 'code-functions' ? (
        <div />
      ) : activePage === 'chains' ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          {chainStatus === 'running' ? (
            <Button variant="destructive" size="sm" onClick={stopChain} className="gap-1.5" disabled={!activeChainId}>
              <Square className="h-3.5 w-3.5 animate-pulse" /> Stop
            </Button>
          ) : (
            <Button size="sm" onClick={runChain} className="gap-1.5" disabled={!activeChainId}>
              <Play className="h-3.5 w-3.5" /> Run
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <ModelConfigBar />
          <RunButton />
        </div>
      )}
    </header>
  );
}
