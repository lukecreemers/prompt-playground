import { useEffect } from "react";
import "./App.css";
import { useStore } from "@/store";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PromptTesterTab } from "@/components/prompt-tester/PromptTesterTab";
import { TestCasesTab } from "@/components/test-cases/TestCasesTab";
import { AgentTesterTab } from "@/components/agent-tester/AgentTesterTab";
import { ChainsPage } from "@/components/chains/ChainsPage";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function App() {
  const activePage = useStore((s) => s.activePage);
  const activeSubTab = useStore((s) => s.activeSubTab);
  const loadPrompts = useStore((s) => s.loadPrompts);
  const loadModels = useStore((s) => s.loadModels);
  const loadAgents = useStore((s) => s.loadAgents);
  const prompts = useStore((s) => s.prompts);
  const activePromptId = useStore((s) => s.activePromptId);
  const setActivePrompt = useStore((s) => s.setActivePrompt);
  const agents = useStore((s) => s.agents);
  const activeAgentId = useStore((s) => s.activeAgentId);
  const setActiveAgent = useStore((s) => s.setActiveAgent);
  const loadChains = useStore((s) => s.loadChains);
  const chains = useStore((s) => s.chains);
  const activeChainId = useStore((s) => s.activeChainId);
  const setActiveChain = useStore((s) => s.setActiveChain);

  useEffect(() => {
    loadPrompts();
    loadModels();
    loadAgents();
    loadChains();
  }, []);

  // Auto-select first prompt if none active
  useEffect(() => {
    if (prompts.length > 0 && !activePromptId) {
      setActivePrompt(prompts[0].id);
    }
  }, [prompts, activePromptId]);

  // Auto-select first agent when switching to agent page if none active
  useEffect(() => {
    if (activePage === 'agent-tester' && agents.length > 0 && !activeAgentId) {
      setActiveAgent(agents[0].id);
    }
  }, [activePage, agents, activeAgentId]);

  // Auto-select first chain when switching to chains page if none active
  useEffect(() => {
    if (activePage === 'chains' && chains.length > 0 && !activeChainId) {
      setActiveChain(chains[0].id);
    }
  }, [activePage, chains, activeChainId]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 overflow-hidden relative">
          {activePage === "prompt-tester" && (
            <>
              <div className={activeSubTab === "tester"
                ? "absolute inset-0 p-3"
                : "absolute inset-0 p-3 invisible"}>
                <PromptTesterTab />
              </div>
              <div className={activeSubTab === "test-cases"
                ? "absolute inset-0 p-3"
                : "absolute inset-0 p-3 invisible"}>
                <TestCasesTab />
              </div>
            </>
          )}
          {activePage === "agent-tester" && (
            <div className="absolute inset-0 p-3">
              <AgentTesterTab />
            </div>
          )}
          {activePage === "chains" && (
            <div className="absolute inset-0">
              <ChainsPage />
            </div>
          )}
          {activePage !== "prompt-tester" && activePage !== "agent-tester" && activePage !== "chains" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Coming soon</p>
            </div>
          )}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

export default App;
