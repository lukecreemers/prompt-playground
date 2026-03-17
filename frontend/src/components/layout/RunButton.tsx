import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { createSSEStream } from '@/lib/sse';

export function RunButton() {
  const activePage = useStore((s) => s.activePage);
  const activePromptId = useStore((s) => s.activePromptId);
  const activeAgentId = useStore((s) => s.activeAgentId);
  const activeSubTab = useStore((s) => s.activeSubTab);
  const testerStatus = useStore((s) => s.testerStatus);
  const agentStatus = useStore((s) => s.agentStatus);
  const abortController = useStore((s) => s.abortController);
  const agentAbortController = useStore((s) => s.agentAbortController);
  const saveTesterVariables = useStore((s) => s.saveTesterVariables);
  const saveAgentVariables = useStore((s) => s.saveAgentVariables);
  const testCases = useStore((s) => s.testCases);
  const selectedTestCaseIds = useStore((s) => s.selectedTestCaseIds);

  const isAgent = activePage === 'agent-tester';
  const isTestCases = !isAgent && activeSubTab === 'test-cases';
  const currentStatus = isAgent ? agentStatus : testerStatus;
  const currentAbort = isAgent ? agentAbortController : abortController;

  const handleRunAgent = async () => {
    if (!activeAgentId) return;

    await saveAgentVariables();

    const store = useStore.getState();
    store.setAgentResponse('');
    store.setAgentThinking('');
    store.setAgentUsage(null);
    store.setAgentStatus('running');

    const controller = new AbortController();
    store.setAgentAbortController(controller);

    createSSEStream(
      `/api/agents/${activeAgentId}/run`,
      {},
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'text':
              s.appendAgentResponse(data.content);
              break;
            case 'thinking':
              s.appendAgentThinking(data.content);
              break;
            case 'done':
              if (data.usage) s.setAgentUsage(data.usage);
              s.setAgentStatus('completed');
              s.addAgentGeneration({
                response: data.fullText || s.agentResponse,
                thinking: s.agentThinking,
                usage: data.usage || null,
              });
              break;
            case 'error':
              s.setAgentStatus('error');
              s.appendAgentResponse(`\n\nError: ${data.message}`);
              break;
          }
        },
        onError: () => {
          useStore.getState().setAgentStatus('error');
        },
        onClose: () => {
          useStore.getState().setAgentAbortController(null);
        },
      },
      controller.signal,
    );
  };

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
    if (isAgent) {
      handleRunAgent();
    } else if (isTestCases) {
      handleRunTestCases();
    } else {
      handleRunTester();
    }
  };

  const handleStop = () => {
    if (isAgent) {
      agentAbortController?.abort();
      useStore.getState().setAgentStatus('idle');
      useStore.getState().setAgentAbortController(null);
    } else {
      abortController?.abort();
      useStore.getState().setTesterStatus('idle');
      useStore.getState().setAbortController(null);
    }
  };

  // Compute label and disabled state
  const allIds = Object.keys(testCases);
  const selectedKeys = Object.keys(selectedTestCaseIds);
  const hasSelected = selectedKeys.length > 0;

  let label = 'Run';
  let isDisabled = isAgent ? !activeAgentId : !activePromptId;

  if (isTestCases) {
    label = hasSelected ? `Run Selected (${selectedKeys.length})` : 'Run All';
    isDisabled = !activePromptId || allIds.length === 0;
  }

  if (currentStatus === 'running') {
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
