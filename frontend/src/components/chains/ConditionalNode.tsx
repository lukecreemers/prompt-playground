import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '@/store';
import { X } from 'lucide-react';

function ConditionalNodeComponent({ id, data }: { id: string; data: any }) {
  const removeNode = useStore((s) => s.removeChainNode);
  const nodeState = useStore((s) => s.chainNodeStates[id]);
  const selectedChainNodeId = useStore((s) => s.selectedChainNodeId);

  const config = data.config || { conditions: [] };
  const conditions: { label: string; operator: string; value: string }[] = config.conditions || [];

  const isSelected = selectedChainNodeId === id;
  const statusClass = isSelected ? 'border-primary ring-2 ring-primary/30'
    : nodeState?.status === 'completed' ? 'border-green-500'
    : nodeState?.status === 'running' ? 'border-purple-500'
    : nodeState?.status === 'error' ? 'border-red-500'
    : 'border-border';

  return (
    <div className={`bg-card rounded-lg border-2 ${statusClass} shadow-sm min-w-[200px]`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50 rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conditional</span>
        <button onClick={() => removeNode(id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
      />

      {/* Condition output handles */}
      <div className="relative py-1">
        {conditions.map((cond) => (
          <div key={cond.label} className="flex items-center justify-end pl-3 pr-4 py-1.5 text-muted-foreground relative hover:bg-muted/30 transition-colors">
            <span className="font-mono text-[11px]">{cond.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={cond.label}
              className="!w-3 !h-3 !bg-primary !border-2 !border-background !right-[-4px]"
              style={{ top: '50%', position: 'absolute' }}
            />
          </div>
        ))}
        {/* Else handle always present */}
        <div className="flex items-center justify-end pl-3 pr-4 py-1.5 text-muted-foreground relative hover:bg-muted/30 transition-colors">
          <span className="font-mono text-[11px] italic">else</span>
          <Handle
            type="source"
            position={Position.Right}
            id="else"
            className="!w-3 !h-3 !bg-orange-500 !border-2 !border-background !right-[-4px]"
            style={{ top: '50%', position: 'absolute' }}
          />
        </div>
      </div>

      {conditions.length === 0 && (
        <div className="px-3 pb-2 text-[10px] text-muted-foreground/60">
          Select node to add conditions
        </div>
      )}
    </div>
  );
}

export const ConditionalNode = memo(ConditionalNodeComponent);
