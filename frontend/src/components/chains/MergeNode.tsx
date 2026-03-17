import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '@/store';
import { X } from 'lucide-react';

function MergeNodeComponent({ id, data }: { id: string; data: any }) {
  const removeNode = useStore((s) => s.removeChainNode);
  const nodeState = useStore((s) => s.chainNodeStates[id]);
  const selectedChainNodeId = useStore((s) => s.selectedChainNodeId);

  const config = data.config || { inputCount: 2 };
  const inputCount = config.inputCount || 2;

  const isSelected = selectedChainNodeId === id;
  const statusClass = isSelected ? 'border-primary ring-2 ring-primary/30'
    : nodeState?.status === 'completed' ? 'border-green-500'
    : nodeState?.status === 'running' ? 'border-purple-500'
    : nodeState?.status === 'error' ? 'border-red-500'
    : 'border-border';

  return (
    <div className={`bg-card rounded-lg border-2 ${statusClass} shadow-sm min-w-[160px]`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50 rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Merge</span>
        <button onClick={() => removeNode(id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Input handles */}
      <div className="relative py-1">
        {Array.from({ length: inputCount }, (_, i) => (
          <div key={i} className="flex items-center pl-4 pr-3 py-1.5 text-muted-foreground relative hover:bg-muted/30 transition-colors">
            <Handle
              type="target"
              position={Position.Left}
              id={`input_${i}`}
              className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background !left-[-4px]"
              style={{ top: '50%', position: 'absolute' }}
            />
            <span className="font-mono text-[11px]">input_{i}</span>
          </div>
        ))}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
}

export const MergeNode = memo(MergeNodeComponent);
