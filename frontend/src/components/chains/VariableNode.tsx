import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '@/store';
import { X } from 'lucide-react';

function VariableNodeComponent({ id, data }: { id: string; data: any }) {
  const updateConfig = useStore((s) => s.updateChainNodeConfig);
  const removeNode = useStore((s) => s.removeChainNode);
  const nodeState = useStore((s) => s.chainNodeStates[id]);

  const selectedChainNodeId = useStore((s) => s.selectedChainNodeId);

  const config = data.config || { text: '' };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateConfig(id, { ...config, text: e.target.value });
  }, [id, config, updateConfig]);

  const isSelected = selectedChainNodeId === id;
  const statusClass = isSelected ? 'border-primary ring-2 ring-primary/30'
    : nodeState?.status === 'completed' ? 'border-green-500'
    : nodeState?.status === 'running' ? 'border-purple-500'
    : nodeState?.status === 'error' ? 'border-red-500'
    : 'border-border';

  return (
    <div className={`bg-card rounded-lg border-2 ${statusClass} shadow-sm min-w-[220px]`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50 rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variable</span>
        <button onClick={() => removeNode(id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3">
        <textarea
          value={config.text}
          onChange={handleChange}
          placeholder="Enter text..."
          className="nodrag w-full min-h-[60px] text-sm bg-background border border-border rounded p-2 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          rows={3}
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
}

export const VariableNode = memo(VariableNodeComponent);
