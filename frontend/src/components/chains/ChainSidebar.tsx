import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PanelLeftClose, PanelLeftOpen, Type, MessageSquare, ArrowLeft, Search, GitBranch, Merge, Trash2 } from 'lucide-react';
import { detectVariables } from '@/lib/interpolate';

const NODE_CATEGORIES = [
  {
    label: 'Inputs',
    items: [{ type: 'variable', label: 'Variable', icon: Type }],
  },
  {
    label: 'AI',
    items: [{ type: 'prompt', label: 'Prompt', icon: MessageSquare }],
  },
  {
    label: 'Logic',
    items: [
      { type: 'conditional', label: 'Conditional', icon: GitBranch },
      { type: 'merge', label: 'Merge', icon: Merge },
    ],
  },
];

export function ChainSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const selectedNodeId = useStore((s) => s.selectedChainNodeId);
  const chainNodes = useStore((s) => s.chainNodes);
  const addChainNode = useStore((s) => s.addChainNode);
  const updateConfig = useStore((s) => s.updateChainNodeConfig);
  const setSelectedNodeId = useStore((s) => s.setSelectedChainNodeId);
  const prompts = useStore((s) => s.prompts);
  const models = useStore((s) => s.models);

  const selectedNode = useMemo(
    () => chainNodes.find((n) => n.id === selectedNodeId),
    [chainNodes, selectedNodeId],
  );

  const config = selectedNode ? (selectedNode.data as any).config || {} : {};

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === config.promptId),
    [prompts, config.promptId],
  );

  const promptVariables = useMemo(() => {
    if (!selectedPrompt) return [];
    return detectVariables(selectedPrompt.content);
  }, [selectedPrompt]);

  const handleAddNode = useCallback(
    (type: string) => {
      addChainNode(type, { x: 200 + Math.random() * 100, y: 100 + Math.random() * 200 });
    },
    [addChainNode],
  );

  const updateNodeConfig = useCallback(
    (updates: Record<string, any>) => {
      if (!selectedNodeId) return;
      updateConfig(selectedNodeId, { ...config, ...updates });
    },
    [selectedNodeId, config, updateConfig],
  );

  const handlePromptSelect = useCallback(
    (promptId: string) => {
      const prompt = prompts.find((p) => p.id === promptId);
      if (prompt) {
        updateNodeConfig({
          promptId,
          modelName: prompt.modelName,
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens,
          thinkingEnabled: prompt.thinkingEnabled,
          thinkingBudget: prompt.thinkingBudget,
        });
      } else {
        updateNodeConfig({ promptId });
      }
    },
    [prompts, updateNodeConfig],
  );

  if (collapsed) {
    return (
      <div className="w-10 border-r border-border bg-card flex flex-col items-center pt-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(false)}>
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const filteredCategories = search.trim()
    ? NODE_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.label.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((cat) => cat.items.length > 0)
    : NODE_CATEGORIES;

  return (
    <div className="w-56 border-r border-border flex flex-col bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {selectedNode
            ? selectedNode.type === 'variable' ? 'Variable Config'
            : selectedNode.type === 'conditional' ? 'Conditional Config'
            : selectedNode.type === 'merge' ? 'Merge Config'
            : 'Prompt Config'
            : 'Nodes'}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCollapsed(true)}>
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <div className="p-3 space-y-3">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedNodeId(null)}
            >
              <ArrowLeft className="h-3 w-3" /> Back to nodes
            </button>

            {selectedNode.type === 'variable' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Text Value</Label>
                <textarea
                  value={config.text || ''}
                  onChange={(e) => updateNodeConfig({ text: e.target.value })}
                  placeholder="Enter text..."
                  className="w-full min-h-[100px] text-sm bg-background border border-border rounded p-2 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={5}
                />
              </div>
            )}

            {selectedNode.type === 'prompt' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Prompt</Label>
                  <Select value={config.promptId || ''} onValueChange={handlePromptSelect}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select a prompt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {promptVariables.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Variables</Label>
                    <div className="text-xs text-muted-foreground/70">
                      {promptVariables.map((v) => (
                        <span key={v} className="inline-block bg-muted rounded px-1.5 py-0.5 mr-1 mb-1">{v}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Model</Label>
                  <Select
                    value={config.modelName || ''}
                    onValueChange={(v) => updateNodeConfig({ modelName: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Temperature</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">{config.temperature ?? 1}</span>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[config.temperature ?? 1]}
                    onValueChange={([v]) => updateNodeConfig({ temperature: v })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.maxTokens || ''}
                    placeholder="4096"
                    onChange={(e) => updateNodeConfig({ maxTokens: parseInt(e.target.value) || 4096 })}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <Label className="text-xs text-muted-foreground">Extended Thinking</Label>
                  <Switch
                    checked={!!config.thinkingEnabled}
                    onCheckedChange={(v) =>
                      updateNodeConfig({
                        thinkingEnabled: v ? 1 : 0,
                        temperature: v ? 1 : config.temperature,
                      })
                    }
                  />
                </div>

                {!!config.thinkingEnabled && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Thinking Budget</Label>
                    <Input
                      type="number"
                      value={config.thinkingBudget || ''}
                      placeholder="Auto"
                      onChange={(e) => updateNodeConfig({ thinkingBudget: parseInt(e.target.value) || null })}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'conditional' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Conditions</Label>
                {(config.conditions || []).map((cond: any, i: number) => (
                  <div key={i} className="space-y-1 p-2 border border-border rounded bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Input
                        value={cond.label}
                        onChange={(e) => {
                          const conditions = [...(config.conditions || [])];
                          conditions[i] = { ...conditions[i], label: e.target.value };
                          updateNodeConfig({ conditions });
                        }}
                        placeholder="Label"
                        className="h-6 text-xs flex-1 mr-1"
                      />
                      <button
                        onClick={() => {
                          const conditions = (config.conditions || []).filter((_: any, j: number) => j !== i);
                          updateNodeConfig({ conditions });
                        }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <Select
                      value={cond.operator}
                      onValueChange={(v) => {
                        const conditions = [...(config.conditions || [])];
                        conditions[i] = { ...conditions[i], operator: v };
                        updateNodeConfig({ conditions });
                      }}
                    >
                      <SelectTrigger className="h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="startsWith">startsWith</SelectItem>
                        <SelectItem value="endsWith">endsWith</SelectItem>
                        <SelectItem value="regex">regex</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={cond.value}
                      onChange={(e) => {
                        const conditions = [...(config.conditions || [])];
                        conditions[i] = { ...conditions[i], value: e.target.value };
                        updateNodeConfig({ conditions });
                      }}
                      placeholder="Value"
                      className="h-6 text-xs"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => {
                    const conditions = [...(config.conditions || []), { label: `cond_${(config.conditions || []).length}`, operator: 'contains', value: '' }];
                    updateNodeConfig({ conditions });
                  }}
                >
                  Add Condition
                </Button>
              </div>
            )}

            {selectedNode.type === 'merge' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Input Count</Label>
                <Input
                  type="number"
                  min={2}
                  value={config.inputCount || 2}
                  onChange={(e) => updateNodeConfig({ inputCount: Math.max(2, parseInt(e.target.value) || 2) })}
                  className="h-7 text-xs"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="h-7 text-xs pl-7"
              />
            </div>
            {filteredCategories.map((cat) => (
              <div key={cat.label}>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                  {cat.label}
                </span>
                <div className="mt-1 space-y-0.5">
                  {cat.items.map((item) => (
                    <button
                      key={item.type}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left"
                      onClick={() => handleAddNode(item.type)}
                    >
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
