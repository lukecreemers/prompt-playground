import { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import type { OnSelectionChangeFunc } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store';
import { VariableNode } from './VariableNode';
import { PromptNode } from './PromptNode';

const nodeTypes = {
  variable: VariableNode,
  prompt: PromptNode,
};

export function ChainCanvas() {
  const chainNodes = useStore((s) => s.chainNodes);
  const chainEdges = useStore((s) => s.chainEdges);
  const onChainNodesChange = useStore((s) => s.onChainNodesChange);
  const onChainEdgesChange = useStore((s) => s.onChainEdgesChange);
  const onChainConnect = useStore((s) => s.onChainConnect);
  const activeChainId = useStore((s) => s.activeChainId);
  const saveChainGraph = useStore((s) => s.saveChainGraph);
  const setSelectedChainNodeId = useStore((s) => s.setSelectedChainNodeId);

  const [spaceHeld, setSpaceHeld] = useState(false);

  // Spacebar tracking for pan mode
  useEffect(() => {
    const isInput = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isInput(e.target)) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Debounced auto-save
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNodesRef = useRef(chainNodes);
  const prevEdgesRef = useRef(chainEdges);

  useEffect(() => {
    if (!activeChainId) return;
    if (prevNodesRef.current === chainNodes && prevEdgesRef.current === chainEdges) return;
    prevNodesRef.current = chainNodes;
    prevEdgesRef.current = chainEdges;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveChainGraph();
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [chainNodes, chainEdges, activeChainId, saveChainGraph]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes }) => {
    if (nodes.length === 1) {
      setSelectedChainNodeId(nodes[0].id);
    } else {
      setSelectedChainNodeId(null);
    }
  }, [setSelectedChainNodeId]);

  if (!activeChainId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create a chain to get started
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <ReactFlow
          nodes={chainNodes}
          edges={chainEdges}
          onNodesChange={onChainNodesChange}
          onEdgesChange={onChainEdgesChange}
          onConnect={onChainConnect}
          nodeTypes={nodeTypes}
          onDragOver={handleDragOver}
          onSelectionChange={handleSelectionChange}
          panOnDrag={spaceHeld}
          selectionOnDrag={!spaceHeld}
          fitView
          deleteKeyCode="Delete"
          className="bg-background"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
