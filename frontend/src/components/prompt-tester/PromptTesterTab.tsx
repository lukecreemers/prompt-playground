import { PromptEditor } from './PromptEditor';
import { ResponseDisplay } from './ResponseDisplay';
import { VariableDrawer } from './VariableDrawer';

export function PromptTesterTab() {
  return (
    <div className="flex h-full gap-3">
      <div className="w-1/2 flex flex-col surface-panel overflow-hidden">
        <PromptEditor />
      </div>
      <div className="w-1/2 flex flex-col surface-panel overflow-hidden">
        <ResponseDisplay />
      </div>
      <VariableDrawer />
    </div>
  );
}
