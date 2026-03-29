import { useMemo } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Play, FlaskConical, Plus, Trash2, MoreVertical, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { createSSEStream } from '@/lib/sse';
import { api } from '@/lib/api';

export function ChainTestCaseToolbar() {
  const activeChainId = useStore((s) => s.activeChainId);
  const activeChain = useStore((s) => s.activeChain);
  const selectedIds = useStore((s) => s.selectedChainTestCaseIds);
  const chainTestCases = useStore((s) => s.chainTestCases);
  const addChainTestCase = useStore((s) => s.addChainTestCase);
  const deleteAllChainTestCases = useStore((s) => s.deleteAllChainTestCases);
  const updateChain = useStore((s) => s.updateChain);
  const chainNodes = useStore((s) => s.chainNodes);

  const evalEnabled = activeChain?.evalPrompt !== null && activeChain?.evalPrompt !== undefined;

  const variableNames = useMemo(() =>
    chainNodes
      .filter((n) => n.type === 'variable')
      .map((n) => (n.data as any).config?.name)
      .filter(Boolean),
    [chainNodes],
  );

  const runBatch = (withEval: boolean, ids?: string[]) => {
    if (!activeChainId) return;

    const testCaseIds = ids || Object.keys(selectedIds);

    const store = useStore.getState();
    store.clearChainTestCaseRunData();
    for (const id of testCaseIds) {
      store.setChainTestCaseStatus(id, 'running');
      store.setChainTestCaseOutput(id, 'output', '');
      store.setChainTestCaseOutput(id, 'thinking', '');
      store.setChainTestCaseOutput(id, 'evalResult', '');
    }

    createSSEStream(
      `/api/chains/${activeChainId}/run-batch`,
      { testCaseIds: testCaseIds.length > 0 ? testCaseIds : undefined, withEval },
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'case_start':
              s.setChainTestCaseStatus(data.testCaseId, 'running');
              break;
            case 'case_done':
              s.setChainTestCaseOutput(data.testCaseId, 'output', data.output);
              s.setChainTestCaseStatus(data.testCaseId, 'completed');
              s.setChainTestCaseRunData(data.testCaseId, { durationMs: data.durationMs });
              s.setChainTestCaseOutput(data.testCaseId, 'durationMs' as any, data.durationMs ?? null);
              s.setChainTestCaseOutput(data.testCaseId, 'cost' as any, data.cost ?? null);
              break;
            case 'case_error':
              s.setChainTestCaseStatus(data.testCaseId, 'failed');
              s.setChainTestCaseOutput(data.testCaseId, 'output', data.error);
              break;
            case 'eval_start':
              s.setChainTestCaseEvalStatus(data.testCaseId, 'running');
              s.setChainTestCaseOutput(data.testCaseId, 'evalResult', '');
              break;
            case 'case_eval_done':
              s.setChainTestCaseOutput(data.testCaseId, 'evalResult', data.evalResult);
              s.setChainTestCaseEvalStatus(data.testCaseId, 'completed');
              break;
          }
        },
      },
    );
  };

  const runEvalOnly = (ids?: string[]) => {
    if (!activeChainId) return;

    const testCaseIds = ids || Object.keys(selectedIds);
    const targetIds = testCaseIds.filter((id) => chainTestCases[id]?.output);
    if (targetIds.length === 0) return;

    const store = useStore.getState();
    for (const id of targetIds) {
      store.setChainTestCaseEvalStatus(id, 'running');
      store.setChainTestCaseOutput(id, 'evalResult', '');
    }

    createSSEStream(
      `/api/chains/${activeChainId}/run-eval`,
      { testCaseIds: targetIds },
      {
        onEvent: (event, data) => {
          const s = useStore.getState();
          switch (event) {
            case 'eval_start':
              s.setChainTestCaseEvalStatus(data.testCaseId, 'running');
              s.setChainTestCaseOutput(data.testCaseId, 'evalResult', '');
              break;
            case 'case_eval_done':
              s.setChainTestCaseOutput(data.testCaseId, 'evalResult', data.evalResult);
              s.setChainTestCaseEvalStatus(data.testCaseId, 'completed');
              break;
          }
        },
      },
    );
  };

  const downloadCsv = () => {
    const cases = Object.values(chainTestCases);
    if (cases.length === 0) return;

    const rows = cases.map((tc) => {
      const vars: Record<string, string> = tc.variables ? JSON.parse(tc.variables) : {};
      const row: Record<string, string> = {};
      for (const name of variableNames) {
        row[name] = vars[name] || '';
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
    a.download = `chain-test-cases-${activeChain?.name || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = () => {
    if (!activeChainId) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await api.uploadChainTestCaseCsv(activeChainId, file);
      useStore.getState().loadChainTestCases();
    };
    input.click();
  };

  const allIds = Object.keys(chainTestCases);
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

      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleCsvUpload}>
        <Upload className="h-3 w-3" /> CSV
      </Button>

      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={addChainTestCase}>
        <Plus className="h-3 w-3" /> Add Row
      </Button>

      <Separator orientation="vertical" className="h-5" />

      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-destructive hover:text-destructive gap-1.5"
        onClick={deleteAllChainTestCases}
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
            onClick={() => updateChain({ evalPrompt: evalEnabled ? null : '' } as any)}
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
