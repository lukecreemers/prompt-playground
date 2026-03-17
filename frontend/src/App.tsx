import { useEffect } from "react";
import "./App.css";
import { useStore } from "@/store";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PromptTesterTab } from "@/components/prompt-tester/PromptTesterTab";
import { TestCasesTab } from "@/components/test-cases/TestCasesTab";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function App() {
  const activePage = useStore((s) => s.activePage);
  const activeSubTab = useStore((s) => s.activeSubTab);
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
          {activePage !== "prompt-tester" && (
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
