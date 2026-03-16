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
  const activePrompt = useStore((s) => s.activePrompt);
  const models = useStore((s) => s.models);
  const updatePrompt = useStore((s) => s.updatePrompt);

  if (!activePrompt) return null;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activePrompt.modelName}
        onValueChange={(v) => updatePrompt({ modelName: v })}
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
        <PopoverContent className="w-72 space-y-4" align="end">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Temperature: {activePrompt.temperature}</Label>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[activePrompt.temperature]}
              onValueChange={([v]) => updatePrompt({ temperature: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Max Tokens</Label>
            <Input
              type="number"
              value={activePrompt.maxTokens}
              onChange={(e) => updatePrompt({ maxTokens: parseInt(e.target.value) || 4096 })}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Extended Thinking</Label>
            <Switch
              checked={!!activePrompt.thinkingEnabled}
              onCheckedChange={(v) => updatePrompt({
                thinkingEnabled: v ? 1 : 0,
                temperature: v ? 1 : activePrompt.temperature,
              })}
            />
          </div>

          {!!activePrompt.thinkingEnabled && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Thinking Budget (tokens)</Label>
              <Input
                type="number"
                value={activePrompt.thinkingBudget || ''}
                placeholder="Auto"
                onChange={(e) => updatePrompt({ thinkingBudget: parseInt(e.target.value) || null })}
                className="h-8 text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Concurrency Limit</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={activePrompt.concurrencyLimit}
              onChange={(e) => updatePrompt({ concurrencyLimit: parseInt(e.target.value) || 5 })}
              className="h-8 text-sm"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
