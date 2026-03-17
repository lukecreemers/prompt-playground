import { SystemPromptEditor } from './SystemPromptEditor';
import { MessageChain } from './MessageChain';
import { AgentResponsePanel } from './AgentResponsePanel';
import { AgentVariableDrawer } from './AgentVariableDrawer';

export function AgentTesterTab() {
  return (
    <div className="flex h-full gap-3">
      <div className="w-1/2 flex flex-col surface-panel overflow-auto">
        <SystemPromptEditor />
        <MessageChain />
      </div>
      <div className="w-1/2 flex flex-col surface-panel overflow-hidden">
        <AgentResponsePanel />
      </div>
      <AgentVariableDrawer />
    </div>
  );
}
