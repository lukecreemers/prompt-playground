import { useState } from 'react';
import { useStore } from '@/store';
import { ChevronRight, FlaskConical, Settings2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ChainEvalHarnessEditor() {
  const activeChain = useStore((s) => s.activeChain);
  const updateChain = useStore((s) => s.updateChain);
  const models = useStore((s) => s.models);
  const [open, setOpen] = useState(false);

  if (!activeChain) return null;

  const evalModelValue = activeChain.evalModelName || '__inherit__';
  const evalTemp = activeChain.evalTemperature ?? 0;
  const evalMaxTok = activeChain.evalMaxTokens ?? 2048;

  return (
    <div className="border-b border-border">
      <button
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium hover:bg-muted/50 text-left text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        <FlaskConical className="h-3.5 w-3.5" />
        <span className="text-xs">Eval Prompt</span>
        {activeChain.evalPrompt && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1" />
        )}

        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={evalModelValue}
            onValueChange={(v) => updateChain({ evalModelName: v === '__inherit__' ? null : v } as any)}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__inherit__">
                Default model
              </SelectItem>
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
                <TooltipContent>Eval model settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-72 p-0" align="end">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">Eval Model Settings</p>
              </div>
              <div className="p-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Temperature</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">{evalTemp}</span>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[evalTemp]}
                    onValueChange={([v]) => updateChain({ evalTemperature: v } as any)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                  <Input
                    type="number"
                    value={evalMaxTok}
                    onChange={(e) => updateChain({ evalMaxTokens: parseInt(e.target.value) || 2048 } as any)}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs text-muted-foreground">Extended Thinking</Label>
                  <Switch
                    checked={!!activeChain.evalThinkingEnabled}
                    onCheckedChange={(v) => updateChain({
                      evalThinkingEnabled: v ? 1 : 0,
                      evalTemperature: v ? 1 : activeChain.evalTemperature,
                    } as any)}
                  />
                </div>

                {!!activeChain.evalThinkingEnabled && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Thinking Budget</Label>
                    <Input
                      type="number"
                      value={activeChain.evalThinkingBudget || ''}
                      placeholder="Auto"
                      onChange={(e) => updateChain({ evalThinkingBudget: parseInt(e.target.value) || null } as any)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            Available placeholders: {'{{output}}'}, {'{{variables}}'}, or any variable name like {'{{name}}'}.
          </p>
          <Textarea
            value={activeChain.evalPrompt || ''}
            onChange={(e) => updateChain({ evalPrompt: e.target.value })}
            placeholder="Rate the following output on a scale of 1-10:&#10;&#10;Output: {{output}}"
            className="min-h-[100px] text-sm bg-muted/40"
          />
        </div>
      )}
    </div>
  );
}
