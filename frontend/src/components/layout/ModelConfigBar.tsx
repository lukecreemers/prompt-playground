import { useStore } from '@/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';

export function ModelConfigBar() {
  const activePage = useStore((s) => s.activePage);
  const activePrompt = useStore((s) => s.activePrompt);
  const activeAgent = useStore((s) => s.activeAgent);
  const models = useStore((s) => s.models);
  const updatePrompt = useStore((s) => s.updatePrompt);
  const updateAgent = useStore((s) => s.updateAgent);

  const isAgent = activePage === 'agent-tester';
  const config = isAgent ? activeAgent : activePrompt;
  const update = isAgent ? updateAgent : updatePrompt;

  if (!config) return null;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={config.modelName}
        onValueChange={(v) => update({ modelName: v })}
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Model settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-72 p-0" align="end">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium">Model Settings</p>
          </div>

          <div className="p-3 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Temperature</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{config.temperature}</span>
              </div>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[config.temperature]}
                onValueChange={([v]) => update({ temperature: v })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Tokens</Label>
              <Input
                type="number"
                value={config.maxTokens}
                onChange={(e) => update({ maxTokens: parseInt(e.target.value) || 4096 })}
                className="h-7 text-xs"
              />
            </div>

            <div className="flex items-center justify-between py-0.5">
              <Label className="text-xs text-muted-foreground">Extended Thinking</Label>
              <Switch
                checked={!!config.thinkingEnabled}
                onCheckedChange={(v) => update({
                  thinkingEnabled: v ? 1 : 0,
                  temperature: v ? 1 : config.temperature,
                })}
              />
            </div>

            {!!config.thinkingEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Thinking Budget</Label>
                <Input
                  type="number"
                  value={config.thinkingBudget || ''}
                  placeholder="Auto"
                  onChange={(e) => update({ thinkingBudget: parseInt(e.target.value) || null })}
                  className="h-7 text-xs"
                />
              </div>
            )}

            {!isAgent && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Concurrency Limit</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={(config as any).concurrencyLimit}
                  onChange={(e) => update({ concurrencyLimit: parseInt(e.target.value) || 5 } as any)}
                  className="h-7 text-xs"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
