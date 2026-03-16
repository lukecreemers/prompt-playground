import { useStore } from "@/store";
import { useDetectedVariables } from "@/hooks/useDetectedVariables";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAutoSave } from "@/hooks/useAutoSave";

export function VariableDrawer() {
  const drawerOpen = useStore((s) => s.drawerOpen);
  const setDrawerOpen = useStore((s) => s.setDrawerOpen);
  const testerVariables = useStore((s) => s.testerVariables);
  const setTesterVariable = useStore((s) => s.setTesterVariable);
  const saveTesterVariables = useStore((s) => s.saveTesterVariables);
  const detectedVars = useDetectedVariables();

  useAutoSave(testerVariables, saveTesterVariables, 1000);

  return (
    <Sheet
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
    >
      <SheetContent
        side="right"
        className="w-[28rem] bg-card border-border"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">Variables</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {detectedVars.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No variables detected. Use {"{{variableName}}"} in your prompt.
            </p>
          ) : (
            detectedVars.map((key) => (
              <div
                key={key}
                className="flex flex-col gap-2"
              >
                <Label className="text-xs text-accent-foreground font-mono">{`{{${key}}}`}</Label>
                <Textarea
                  value={testerVariables[key] || ""}
                  onChange={(e) => setTesterVariable(key, e.target.value)}
                  placeholder={`Value for ${key}`}
                  className="text-sm bg-muted/40 border-border/50 focus:border-primary/30 h-[120px] resize-none"
                />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
