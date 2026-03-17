import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { createSSEStream } from '@/lib/sse';

export function RunButton() {
  const activePromptId = useStore((s) => s.activePromptId);
  const activeSubTab = useStore((s) => s.activeSubTab);
  const testerStatus = useStore((s) => s.testerStatus);
  const abortController = useStore((s) => s.abortController);
  const saveTesterVariables = useStore((s) => s.saveTesterVariables);
  const testCases = useStore((s) => s.testCases);
  const selectedTestCaseIds = useStore((s) => s.selectedTestCaseIds);

  const isTestCases = activeSubTab === 'test-cases';

  const handleRunTester = async () => {
    if (!activePromptId) return;

    // Save variables first
    await saveTesterVariables();

    const store = useStore.getState();
    store.setTesterResponse('');
    store.setTesterThinking('');
    store.setTesterUsage(null);
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
              if (data.usage) s.setTesterUsage(data.usage);
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

  const handleRunTestCases = () => {
    if (!activePromptId) return;

    const allIds = Object.keys(testCases);
    const selectedKeys = Object.keys(selectedTestCaseIds);
    const hasSelected = selectedKeys.length > 0;
    const testCaseIds = hasSelected ? selectedKeys : allIds;

    // Reset statuses
    const store = useStore.getState();
    for (const id of testCaseIds) {
      store.setTestCaseStatus(id, 'running');
      store.setTestCaseOutput(id, 'output', '');
      store.setTestCaseOutput(id, 'thinking', '');
      store.setTestCaseOutput(id, 'evalResult', '');
    }

    createSSEStream(
      `/api/prompts/${activePromptId}/run-batch`,
      { testCaseIds: testCaseIds.length > 0 ? testCaseIds : undefined, withEval: false },
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'case_start':
              s.setTestCaseStatus(data.testCaseId, 'running');
              break;
            case 'case_text':
              s.appendTestCaseOutput(data.testCaseId, 'output', data.content);
              break;
            case 'case_thinking':
              s.appendTestCaseOutput(data.testCaseId, 'thinking', data.content);
              break;
            case 'case_done':
              s.setTestCaseStatus(data.testCaseId, 'completed');
              break;
            case 'case_error':
              s.setTestCaseStatus(data.testCaseId, 'failed');
              s.setTestCaseOutput(data.testCaseId, 'output', data.error);
              break;
          }
        },
      },
    );
  };

  const handleRun = () => {
    if (isTestCases) {
      handleRunTestCases();
    } else {
      handleRunTester();
    }
  };

  const handleStop = () => {
    abortController?.abort();
    useStore.getState().setTesterStatus('idle');
    useStore.getState().setAbortController(null);
  };

  // Compute label and disabled state
  const allIds = Object.keys(testCases);
  const selectedKeys = Object.keys(selectedTestCaseIds);
  const hasSelected = selectedKeys.length > 0;

  let label = 'Run';
  let isDisabled = !activePromptId;

  if (isTestCases) {
    label = hasSelected ? `Run Selected (${selectedKeys.length})` : 'Run All';
    isDisabled = !activePromptId || allIds.length === 0;
  }

  if (testerStatus === 'running') {
    return (
      <Button variant="destructive" size="sm" onClick={handleStop} className="gap-1.5">
        <Square className="h-3.5 w-3.5 animate-pulse" /> Stop
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleRun} disabled={isDisabled} className="gap-1.5">
      <Play className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}
