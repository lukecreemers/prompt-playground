import { memo, useMemo, useCallback, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '@/store';
import { X } from 'lucide-react';
import { detectVariables } from '@/lib/interpolate';

function PromptNodeComponent({ id, data }: { id: string; data: any }) {
  const prompts = useStore((s) => s.prompts);
  const updateConfig = useStore((s) => s.updateChainNodeConfig);
  const removeNode = useStore((s) => s.removeChainNode);
  const nodeState = useStore((s) => s.chainNodeStates[id]);

  const config = data.config || { promptId: '' };
  const selectedPrompt = prompts.find((p) => p.id === config.promptId);

  const variables = useMemo(() => {
    if (!selectedPrompt) return [];
    return detectVariables(selectedPrompt.content);
  }, [selectedPrompt]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const promptId = e.target.value;
    const prompt = prompts.find((p) => p.id === promptId);
    if (prompt) {
      updateConfig(id, {
        ...config,
        promptId,
        modelName: prompt.modelName,
        temperature: prompt.temperature,
        maxTokens: prompt.maxTokens,
        thinkingEnabled: prompt.thinkingEnabled,
        thinkingBudget: prompt.thinkingBudget,
      });
    } else {
      updateConfig(id, { ...config, promptId });
    }
  }, [id, config, prompts, updateConfig]);

  // Resizable output area
  const [outputHeight, setOutputHeight] = useState(100);
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

  const statusClass = nodeState?.status === 'completed' ? 'border-green-500'
    : nodeState?.status === 'running' ? 'border-purple-500'
    : nodeState?.status === 'error' ? 'border-red-500'
    : 'border-border';

  return (
    <div className={`bg-card rounded-lg border-2 ${statusClass} shadow-sm w-[300px] flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50 rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</span>
        <button onClick={() => removeNode(id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Prompt selector */}
      <div className="px-3 py-2 border-b border-border">
        <select
          value={config.promptId}
          onChange={handlePromptChange}
          className="w-full text-sm bg-background border border-border rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a prompt...</option>
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
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
        {/* Resize handle */}
        <div
          className="h-2 cursor-row-resize flex items-center justify-center"
          onMouseDown={handleResizeStart}
        >
          <div className="w-8 h-0.5 bg-border rounded" />
        </div>
      </div>

      {/* Variable input handles */}
      {variables.length > 0 && (
        <div className="relative">
          {variables.map((varName, i) => (
            <div key={varName} className="flex items-center px-3 py-1 text-xs text-muted-foreground relative">
              <Handle
                type="target"
                position={Position.Left}
                id={varName}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background !left-[-6px]"
                style={{ top: '50%', position: 'absolute' }}
              />
              <span className="ml-2">{varName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
      />
    </div>
  );
}

export const PromptNode = memo(PromptNodeComponent);
