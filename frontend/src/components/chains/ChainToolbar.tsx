import { useStore } from '@/store';
import { useChainExecution } from '@/hooks/useChainExecution';
import { Button } from '@/components/ui/button';
import { Play, Square, Type, MessageSquare, Save } from 'lucide-react';
import { useCallback } from 'react';

export function ChainToolbar() {
  const chainStatus = useStore((s) => s.chainStatus);
  const activeChainId = useStore((s) => s.activeChainId);
  const addChainNode = useStore((s) => s.addChainNode);
  const saveChainGraph = useStore((s) => s.saveChainGraph);
  const { runChain, stopChain } = useChainExecution();

  const handleAddVariable = useCallback(() => {
    addChainNode('variable', { x: 100, y: 100 + Math.random() * 200 });
  }, [addChainNode]);

  const handleAddPrompt = useCallback(() => {
    addChainNode('prompt', { x: 400, y: 100 + Math.random() * 200 });
  }, [addChainNode]);

  const handleSave = useCallback(() => {
    saveChainGraph();
  }, [saveChainGraph]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
      <Button variant="outline" size="sm" onClick={handleAddVariable} className="gap-1.5">
        <Type className="h-3.5 w-3.5" /> Variable
      </Button>
      <Button variant="outline" size="sm" onClick={handleAddPrompt} className="gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" /> Prompt
      </Button>

      <div className="flex-1" />

      <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
        <Save className="h-3.5 w-3.5" /> Save
      </Button>

      {chainStatus === 'running' ? (
        <Button variant="destructive" size="sm" onClick={stopChain} className="gap-1.5" disabled={!activeChainId}>
          <Square className="h-3.5 w-3.5 animate-pulse" /> Stop
        </Button>
      ) : (
        <Button size="sm" onClick={runChain} className="gap-1.5" disabled={!activeChainId}>
          <Play className="h-3.5 w-3.5" /> Run
        </Button>
      )}
    </div>
  );
}
