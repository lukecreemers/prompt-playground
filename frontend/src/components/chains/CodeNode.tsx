import { memo, useMemo, useCallback, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '@/store';
import { X } from 'lucide-react';

function CodeNodeComponent({ id, data }: { id: string; data: any }) {
  const codeFunctions = useStore((s) => s.codeFunctions);
  const updateConfig = useStore((s) => s.updateChainNodeConfig);
  const removeNode = useStore((s) => s.removeChainNode);
  const nodeState = useStore((s) => s.chainNodeStates[id]);
  const selectedChainNodeId = useStore((s) => s.selectedChainNodeId);

  const config = data.config || { codeFunctionId: '' };
  const selectedFn = codeFunctions.find((f) => f.id === config.codeFunctionId);

  const inputs: string[] = useMemo(() => {
    if (!selectedFn) return [];
    return JSON.parse(selectedFn.inputs || '[]');
  }, [selectedFn]);

  const outputs: string[] = useMemo(() => {
    if (!selectedFn) return [];
    return JSON.parse(selectedFn.outputs || '[]');
  }, [selectedFn]);

  const handleFunctionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const codeFunctionId = e.target.value;
    updateConfig(id, { ...config, codeFunctionId });

    // Remove edges targeting handles that no longer exist
    const fn = codeFunctions.find((f) => f.id === codeFunctionId);
    const newInputs = fn ? new Set(JSON.parse(fn.inputs || '[]') as string[]) : new Set<string>();
    const { chainEdges, setChainEdges } = useStore.getState();
    setChainEdges(chainEdges.filter((e) => e.target !== id || newInputs.has(e.targetHandle ?? '')));
  }, [id, config, codeFunctions, updateConfig]);

  // Resizable output area
  const [outputHeight, setOutputHeight] = useState(80);
  const resizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startY.current = e.clientY;
    startHeight.current = outputHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = ev.clientY - startY.current;
      setOutputHeight(Math.max(40, startHeight.current + delta));
    };
    const handleMouseUp = () => {
      resizing.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [outputHeight]);

  const isSelected = selectedChainNodeId === id;
  const statusClass = isSelected ? 'border-primary ring-2 ring-primary/30'
    : nodeState?.status === 'completed' ? 'border-green-500'
    : nodeState?.status === 'running' ? 'border-purple-500'
    : nodeState?.status === 'error' ? 'border-red-500'
    : 'border-border';

  return (
    <div className={`bg-card rounded-lg border-2 ${statusClass} shadow-sm w-[280px] flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-emerald-500/10 rounded-t-lg">
        <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Code</span>
        <button onClick={() => removeNode(id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Function selector */}
      <div className="px-3 py-2 border-b border-border">
        <select
          value={config.codeFunctionId}
          onChange={handleFunctionChange}
          className="w-full text-sm bg-background border border-border rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a function...</option>
          {codeFunctions.map((fn) => (
            <option key={fn.id} value={fn.id}>{fn.name}</option>
          ))}
        </select>
      </div>

      {/* Output area */}
      <div className="px-3 pt-2 pb-0 border-b border-border">
        <div
          className="bg-muted/30 rounded overflow-y-auto text-xs font-mono whitespace-pre-wrap break-words p-2"
          style={{ height: outputHeight }}
        >
          {nodeState?.status === 'running' && !nodeState.output && (
            <span className="text-purple-500 animate-pulse">Running...</span>
          )}
          {nodeState?.output || ''}
          {nodeState?.error && (
            <span className="text-red-500">{nodeState.error}</span>
          )}
        </div>
        <div
          className="nodrag h-2 cursor-row-resize flex items-center justify-center"
          onMouseDown={handleResizeStart}
        >
          <div className="w-8 h-0.5 bg-border rounded" />
        </div>
      </div>

      {/* Input handles */}
      {inputs.length > 0 && (
        <div className="relative pb-1">
          {inputs.map((name) => (
            <div key={name} className="flex items-center pl-4 pr-3 py-1.5 text-muted-foreground relative hover:bg-muted/30 transition-colors">
              <Handle
                type="target"
                position={Position.Left}
                id={name}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background !left-[-4px]"
                style={{ top: '50%', position: 'absolute' }}
              />
              <span className="font-mono text-[11px]">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output handles */}
      {outputs.length > 0 && (
        <div className="relative pb-1 border-t border-border">
          {outputs.map((name) => (
            <div key={name} className="flex items-center justify-end pl-3 pr-4 py-1.5 text-muted-foreground relative hover:bg-muted/30 transition-colors">
              <span className="font-mono text-[11px] text-green-500">{name}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={name}
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-background !right-[-4px]"
                style={{ top: '50%', position: 'absolute' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const CodeNode = memo(CodeNodeComponent);
