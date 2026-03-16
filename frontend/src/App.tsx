import { useEffect } from "react";
import "./App.css";
import { useStore } from "@/store";
import { AppHeader } from "@/components/layout/AppHeader";
import { PromptTesterTab } from "@/components/prompt-tester/PromptTesterTab";
import { TestCasesTab } from "@/components/test-cases/TestCasesTab";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const activeTab = useStore((s) => s.activeTab);
  const loadPrompts = useStore((s) => s.loadPrompts);
  const loadModels = useStore((s) => s.loadModels);
  const prompts = useStore((s) => s.prompts);
  const activePromptId = useStore((s) => s.activePromptId);
  const setActivePrompt = useStore((s) => s.setActivePrompt);

  useEffect(() => {
    loadPrompts();
    loadModels();
  }, []);

  // Auto-select first prompt if none active
  useEffect(() => {
    if (prompts.length > 0 && !activePromptId) {
      setActivePrompt(prompts[0].id);
    }
  }, [prompts, activePromptId]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-hidden p-3 pt-3">
        {activeTab === "tester" ? <PromptTesterTab /> : <TestCasesTab />}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
