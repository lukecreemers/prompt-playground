import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { createSSEStream } from '@/lib/sse';

export function RunButton() {
  const activePromptId = useStore((s) => s.activePromptId);
  const testerStatus = useStore((s) => s.testerStatus);
  const abortController = useStore((s) => s.abortController);
  const saveTesterVariables = useStore((s) => s.saveTesterVariables);

  const handleRun = async () => {
    if (!activePromptId) return;

    // Save variables first
    await saveTesterVariables();

    const store = useStore.getState();
    store.setTesterResponse('');
    store.setTesterThinking('');
    store.setTesterStatus('running');

    const controller = new AbortController();
    store.setAbortController(controller);

    createSSEStream(
      `/api/prompts/${activePromptId}/run`,
      {},
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'text':
              s.appendTesterResponse(data.content);
              break;
            case 'thinking':
              s.appendTesterThinking(data.content);
              break;
            case 'done':
              s.setTesterStatus('completed');
              break;
            case 'error':
              s.setTesterStatus('error');
              s.appendTesterResponse(`\n\nError: ${data.message}`);
              break;
          }
        },
        onError: () => {
          useStore.getState().setTesterStatus('error');
        },
        onClose: () => {
          useStore.getState().setAbortController(null);
        },
      },
      controller.signal,
    );
  };

  const handleStop = () => {
    abortController?.abort();
    useStore.getState().setTesterStatus('idle');
    useStore.getState().setAbortController(null);
  };

  if (testerStatus === 'running') {
    return (
      <Button variant="destructive" size="sm" onClick={handleStop} className="gap-1.5 shadow-lg shadow-destructive/20">
        <Square className="h-3.5 w-3.5 animate-pulse" /> Stop
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleRun} disabled={!activePromptId} className="gap-1.5 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
      <Play className="h-3.5 w-3.5" /> Run
    </Button>
  );
}
