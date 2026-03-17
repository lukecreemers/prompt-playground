import { useStore } from '@/store';
import { createSSEStream } from '@/lib/sse';

export function useChainExecution() {
  const activeChainId = useStore((s) => s.activeChainId);

  const runChain = () => {
    if (!activeChainId) return;

    const store = useStore.getState();
    store.resetChainExecution();
    store.setChainStatus('running');

    const controller = new AbortController();
    store.setChainAbortController(controller);

    createSSEStream(
      `/api/chains/${activeChainId}/run`,
      {},
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'chain_start':
              break;
            case 'node_start':
              s.setChainNodeStatus(data.nodeId, 'running');
              break;
            case 'node_text':
              s.appendChainNodeOutput(data.nodeId, data.content);
              break;
            case 'node_thinking':
              s.appendChainNodeThinking(data.nodeId, data.content);
              break;
            case 'node_done':
              s.setChainNodeDone(data.nodeId, data.output);
              break;
            case 'node_error':
              s.setChainNodeError(data.nodeId, data.error);
              break;
            case 'chain_done':
              s.setChainStatus('completed');
              break;
            case 'chain_error':
              s.setChainStatus('error');
              break;
          }
        },
        onError: () => {
          useStore.getState().setChainStatus('error');
        },
        onClose: () => {
          useStore.getState().setChainAbortController(null);
        },
      },
      controller.signal,
    );
  };

  const stopChain = () => {
    const store = useStore.getState();

    // Tell backend to abort the in-flight LLM calls immediately
    if (activeChainId) {
      fetch(`/api/chains/${activeChainId}/stop`, { method: 'POST' }).catch(() => {});
    }

    // Abort the SSE fetch connection
    store.chainAbortController?.abort();
    store.setChainAbortController(null);

    // Mark chain + running nodes as idle, keeping any partial output
    store.stopChainExecution();
  };

  return { runChain, stopChain };
}
