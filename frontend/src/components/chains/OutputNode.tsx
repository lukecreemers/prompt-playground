import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '@/store';
import { X, Flag } from 'lucide-react';

function OutputNodeComponent({ id }: { id: string; data: any }) {
  const removeNode = useStore((s) => s.removeChainNode);
  const nodeState = useStore((s) => s.chainNodeStates[id]);
  const selectedChainNodeId = useStore((s) => s.selectedChainNodeId);

  const isSelected = selectedChainNodeId === id;
  const statusClass = isSelected ? 'border-green-500 ring-2 ring-green-500/30'
    : nodeState?.status === 'completed' ? 'border-green-500'
    : nodeState?.status === 'running' ? 'border-purple-500'
    : nodeState?.status === 'error' ? 'border-red-500'
    : 'border-border';

  const output = nodeState?.output || '';

  return (
    <div className={`bg-card rounded-lg border-2 ${statusClass} shadow-sm min-w-[200px] max-w-[300px]`}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
      />
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-green-500/10 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <Flag className="h-3 w-3 text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Output</span>
        </div>
        <button onClick={() => removeNode(id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {output ? (
        <div className="p-3 max-h-[200px] overflow-y-auto">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{output}</p>
        </div>
      ) : (
        <div className="p-3">
          <p className="text-xs text-muted-foreground/50 italic">Chain output will appear here</p>
        </div>
      )}
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
