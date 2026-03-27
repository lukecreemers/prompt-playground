import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { CsvUploadButton } from './CsvUploadButton';
import { Play, FlaskConical, Plus, Trash2, MoreVertical, Download } from 'lucide-react';
import Papa from 'papaparse';
import { createSSEStream } from '@/lib/sse';

export function TestCaseToolbar() {
  const activePromptId = useStore((s) => s.activePromptId);
  const activePrompt = useStore((s) => s.activePrompt);
  const selectedIds = useStore((s) => s.selectedTestCaseIds);
  const testCases = useStore((s) => s.testCases);
  const addTestCase = useStore((s) => s.addTestCase);
  const deleteAllTestCases = useStore((s) => s.deleteAllTestCases);
  const updatePrompt = useStore((s) => s.updatePrompt);

  const evalEnabled = activePrompt?.evalPrompt !== null && activePrompt?.evalPrompt !== undefined;

  const runBatch = (withEval: boolean, ids?: string[]) => {
    if (!activePromptId) return;

    const testCaseIds = ids || Object.keys(selectedIds);

    // Reset statuses
    const store = useStore.getState();
    store.clearTestCaseRunData();
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
            case 'case_done':
              s.setTestCaseOutput(data.testCaseId, 'output', data.output);
              s.setTestCaseOutput(data.testCaseId, 'thinking', data.thinking);
              s.setTestCaseStatus(data.testCaseId, 'completed');
              s.setTestCaseRunData(data.testCaseId, { usage: data.usage, durationMs: data.durationMs });
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

  const downloadCsv = () => {
    const cases = Object.values(testCases);
    if (cases.length === 0) return;

    // Collect all variable keys
    const varKeys = new Set<string>();
    const parsed = cases.map((tc) => {
      const vars: Record<string, string> = tc.variables ? JSON.parse(tc.variables) : {};
      Object.keys(vars).forEach((k) => varKeys.add(k));
      return { vars, tc };
    });

    const columns = [...varKeys];
    const rows = parsed.map(({ vars, tc }) => {
      const row: Record<string, string> = {};
      for (const key of columns) {
        row[key] = vars[key] || '';
      }
      row['output'] = tc.output || '';
      if (evalEnabled) {
        row['evalResult'] = tc.evalResult || '';
      }
      return row;
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${activePrompt?.name || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allIds = Object.keys(testCases);
  const selectedKeys = Object.keys(selectedIds);
  const hasSelected = selectedKeys.length > 0;

  return (
    <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        variant="default"
        className="h-7 text-xs gap-1.5"
        onClick={() => runBatch(false, hasSelected ? selectedKeys : allIds)}
        disabled={allIds.length === 0}
      >
        <Play className="h-3 w-3" />
        {hasSelected ? `Run Selected (${selectedKeys.length})` : 'Run All'}
      </Button>

      {evalEnabled && (
        <>
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
        </>
      )}

      <div className="flex-1" />

      <CsvUploadButton />

      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={addTestCase}>
        <Plus className="h-3 w-3" /> Add Row
      </Button>

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => updatePrompt({ evalPrompt: evalEnabled ? null : '' })}
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            {evalEnabled ? 'Disable Eval' : 'Enable Eval'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={downloadCsv}
            disabled={allIds.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
