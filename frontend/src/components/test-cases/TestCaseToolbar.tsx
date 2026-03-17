import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CsvUploadButton } from './CsvUploadButton';
import { Play, FlaskConical, Plus, Trash2 } from 'lucide-react';
import { createSSEStream } from '@/lib/sse';

export function TestCaseToolbar() {
  const activePromptId = useStore((s) => s.activePromptId);
  const selectedIds = useStore((s) => s.selectedTestCaseIds);
  const testCases = useStore((s) => s.testCases);
  const addTestCase = useStore((s) => s.addTestCase);
  const deleteAllTestCases = useStore((s) => s.deleteAllTestCases);

  const runBatch = (withEval: boolean, ids?: string[]) => {
    if (!activePromptId) return;

    const testCaseIds = ids || Object.keys(selectedIds);

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
      { testCaseIds: testCaseIds.length > 0 ? testCaseIds : undefined, withEval },
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
            case 'eval_start':
              s.setTestCaseEvalStatus(data.testCaseId, 'running');
              s.setTestCaseOutput(data.testCaseId, 'evalResult', '');
              break;
            case 'case_eval_done':
              s.setTestCaseOutput(data.testCaseId, 'evalResult', data.evalResult);
              s.setTestCaseEvalStatus(data.testCaseId, 'completed');
              break;
          }
        },
      },
    );
  };

  const runEvalOnly = (ids?: string[]) => {
    if (!activePromptId) return;

    const testCaseIds = ids || Object.keys(selectedIds);
    const targetIds = testCaseIds.filter((id) => testCases[id]?.output);
    if (targetIds.length === 0) return;

    const store = useStore.getState();
    for (const id of targetIds) {
      store.setTestCaseEvalStatus(id, 'running');
      store.setTestCaseOutput(id, 'evalResult', '');
    }

    createSSEStream(
      `/api/prompts/${activePromptId}/run-eval`,
      { testCaseIds: targetIds },
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'eval_start':
              s.setTestCaseEvalStatus(data.testCaseId, 'running');
              s.setTestCaseOutput(data.testCaseId, 'evalResult', '');
              break;
            case 'case_eval_done':
              s.setTestCaseOutput(data.testCaseId, 'evalResult', data.evalResult);
              s.setTestCaseEvalStatus(data.testCaseId, 'completed');
              break;
          }
        },
      },
    );
  };

  const allIds = Object.keys(testCases);
  const selectedKeys = Object.keys(selectedIds);
  const hasSelected = selectedKeys.length > 0;

  return (
    <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        variant="default"
        className="h-7 text-xs gap-1.5 shadow-sm shadow-primary/15"
        onClick={() => runBatch(false, hasSelected ? selectedKeys : allIds)}
        disabled={allIds.length === 0}
      >
        <Play className="h-3 w-3" />
        {hasSelected ? `Run Selected (${selectedKeys.length})` : 'Run All'}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1.5"
        onClick={() => runBatch(true, hasSelected ? selectedKeys : allIds)}
        disabled={allIds.length === 0}
      >
        <FlaskConical className="h-3 w-3" />
        Run with Eval
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1.5"
        onClick={() => runEvalOnly(hasSelected ? selectedKeys : allIds)}
        disabled={allIds.length === 0}
      >
        <FlaskConical className="h-3 w-3" />
        {hasSelected ? `Eval Selected (${selectedKeys.length})` : 'Eval All'}
      </Button>

      <CsvUploadButton />

      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={addTestCase}>
        <Plus className="h-3 w-3" /> Add Row
      </Button>

      <div className="flex-1" />

      <Separator orientation="vertical" className="h-5" />

      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-destructive hover:text-destructive gap-1.5"
        onClick={deleteAllTestCases}
        disabled={allIds.length === 0}
      >
        <Trash2 className="h-3 w-3" /> Delete All
      </Button>
    </div>
  );
}
