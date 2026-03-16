import { useStore } from '@/store';
import { PromptNameEditor } from './PromptNameEditor';
import { ModelConfigBar } from './ModelConfigBar';
import { RunButton } from './RunButton';
import { ThemeToggle } from './ThemeToggle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AppHeader() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-5 py-2.5 flex items-center gap-4">
      <PromptNameEditor />
      <div className="flex-1 flex justify-center">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="tester">Prompt Tester</TabsTrigger>
            <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex items-center gap-2">
        <ModelConfigBar />
        <ThemeToggle />
        <RunButton />
      </div>
    </header>
  );
}
