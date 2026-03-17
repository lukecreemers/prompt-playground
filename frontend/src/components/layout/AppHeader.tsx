import { useStore } from '@/store';
import { PromptNameEditor } from './PromptNameEditor';
import { AgentNameEditor } from './AgentNameEditor';
import { ChainNameEditor } from '@/components/chains/ChainNameEditor';
import { ModelConfigBar } from './ModelConfigBar';
import { RunButton } from './RunButton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AppHeader() {
  const activePage = useStore((s) => s.activePage);
  const activeSubTab = useStore((s) => s.activeSubTab);
  const setActiveSubTab = useStore((s) => s.setActiveSubTab);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-3 py-2.5 flex items-center gap-3">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      {activePage === 'agent-tester' ? <AgentNameEditor /> : activePage === 'chains' ? <ChainNameEditor /> : <PromptNameEditor />}
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
      {activePage !== 'chains' && (
        <div className="flex items-center gap-2">
          <ModelConfigBar />
          <RunButton />
        </div>
      )}
    </header>
  );
}
