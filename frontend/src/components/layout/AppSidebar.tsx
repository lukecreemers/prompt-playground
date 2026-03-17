import { FlaskConical, Bot, BarChart3, Workflow } from "lucide-react"
import { useStore } from "@/store"
import { ThemeToggle } from "./ThemeToggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type PageValue = 'prompt-tester' | 'agent-tester' | 'chains' | 'benchmarks'

const navSections = [
  {
    label: "Test",
    items: [
      { title: "Prompt Tester", icon: FlaskConical, value: "prompt-tester" as PageValue },
      { title: "Agent Tester", icon: Bot, value: "agent-tester" as PageValue },
      { title: "Chains", icon: Workflow, value: "chains" as PageValue },
    ],
  },
  {
    label: "Evaluate",
    items: [
      { title: "Benchmarks", icon: BarChart3, value: "benchmarks" as PageValue },
    ],
  },
]

export function AppSidebar() {
  const activePage = useStore((s) => s.activePage)
  const setActivePage = useStore((s) => s.setActivePage)

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <span className="text-base font-semibold tracking-tight">
          Lukes Dungeon
        </span>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activePage === item.value}
                    onClick={() => setActivePage(item.value)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
