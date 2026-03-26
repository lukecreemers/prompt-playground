import { useMemo, useCallback, useRef, useState, useLayoutEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useStore } from '@/store';
import { useDetectedVariables } from '@/hooks/useDetectedVariables';
import { TestCase } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ArrowUpRight, Inbox, Copy } from 'lucide-react';
import { interpolate } from '@/lib/interpolate';
import { EditableCell } from './EditableCell';
import { StreamingOutputCell } from './StreamingOutputCell';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  idle: 'status-idle',
  running: 'status-running',
  completed: 'status-completed',
  failed: 'status-failed',
};

function SelectAllCheckbox() {
  const testCases = useStore((s) => s.testCases);
  const selectedIds = useStore((s) => s.selectedTestCaseIds);
  const selectAll = useStore((s) => s.selectAllTestCases);
  const deselectAll = useStore((s) => s.deselectAllTestCases);
  const count = Object.keys(testCases).length;
  const allSelected = count > 0 && Object.keys(selectedIds).length === count;

  return (
    <Checkbox
      checked={allSelected}
      onCheckedChange={(v) => (v ? selectAll() : deselectAll())}
    />
  );
}

function RowActions({ row }: { row: TestCase }) {
  const deleteTestCase = useStore((s) => s.deleteTestCase);
  const setTesterVariables = useStore((s) => s.setTesterVariables);
  const setActiveSubTab = useStore((s) => s.setActiveSubTab);
  const activePrompt = useStore((s) => s.activePrompt);

  const copyFilledPrompt = () => {
    if (!activePrompt?.content) return;
    const vars: Record<string, string> = JSON.parse(row.variables || '{}');
    const filled = interpolate(activePrompt.content, vars);
    navigator.clipboard.writeText(filled);
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Copy filled prompt"
        onClick={copyFilledPrompt}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Add to Tester"
        onClick={() => {
          const vars = JSON.parse(row.variables || '{}');
          setTesterVariables(vars);
          setActiveSubTab('tester');
        }}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => deleteTestCase(row.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// Fixed-width column totals
const FIXED_COL_WIDTH = { select: 40, status: 80, actions: 100 };
const FIXED_TOTAL = FIXED_COL_WIDTH.select + FIXED_COL_WIDTH.status + FIXED_COL_WIDTH.actions;

export function TestCaseTable() {
  const testCases = useStore((s) => s.testCases);
  const selectedIds = useStore((s) => s.selectedTestCaseIds);
  const selectTestCase = useStore((s) => s.selectTestCase);
  const deselectTestCase = useStore((s) => s.deselectTestCase);
  const activePrompt = useStore((s) => s.activePrompt);
  const detectedVars = useDetectedVariables();
  const evalEnabled = activePrompt?.evalPrompt !== null && activePrompt?.evalPrompt !== undefined;

  const data = useMemo(() => Object.values(testCases), [testCases]);

  // Measure container once to compute initial flex column sizes
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialWidth, setInitialWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || initialWidth > 0) return;
    setInitialWidth(el.getBoundingClientRect().width);
  });

  // -- Drag-select state (ref to avoid re-renders during drag) --
  const dragRef = useRef<{ active: boolean; mode: 'select' | 'deselect' } | null>(null);

  const handleSelectPointerDown = useCallback((e: React.PointerEvent, rowId: string) => {
    const isSelected = !!selectedIds[rowId];
    const mode = isSelected ? 'deselect' : 'select';
    dragRef.current = { active: true, mode };
    if (mode === 'select') selectTestCase(rowId);
    else deselectTestCase(rowId);

    const onPointerUp = () => {
      dragRef.current = null;
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }, [selectedIds, selectTestCase, deselectTestCase]);

  const handleSelectPointerEnter = useCallback((rowId: string) => {
    if (!dragRef.current?.active) return;
    if (dragRef.current.mode === 'select') selectTestCase(rowId);
    else deselectTestCase(rowId);
  }, [selectTestCase, deselectTestCase]);

  // -- Row heights --
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const rowResizeRef = useRef<{ rowId: string; startY: number; startH: number } | null>(null);

  const startRowResize = useCallback((e: React.PointerEvent, rowId: string, currentH: number) => {
    e.preventDefault();
    rowResizeRef.current = { rowId, startY: e.clientY, startH: currentH };
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      if (!rowResizeRef.current) return;
      const delta = ev.clientY - rowResizeRef.current.startY;
      const newH = Math.min(400, Math.max(36, rowResizeRef.current.startH + delta));
      setRowHeights((prev) => ({ ...prev, [rowResizeRef.current!.rowId]: newH }));
    };
    const onUp = () => {
      rowResizeRef.current = null;
      target.releasePointerCapture(e.pointerId);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  // -- Column defs --
  // Compute flex column sizes to fill available space
  const flexColSizes = useMemo(() => {
    const availableWidth = initialWidth - FIXED_TOTAL - 2; // 2px for rounding
    if (availableWidth <= 0) return null; // not measured yet

    // Count flex columns: variables + output + (eval if enabled)
    const flexCount = detectedVars.length + 1 + (evalEnabled ? 1 : 0);
    // Output gets 1.5x weight, eval gets 1x, each variable gets 1x
    const totalWeight = detectedVars.length + 1.5 + (evalEnabled ? 1 : 0);
    const perUnit = availableWidth / totalWeight;

    return {
      variable: Math.max(100, Math.floor(perUnit)),
      output: Math.max(120, Math.floor(perUnit * 1.5)),
      eval: Math.max(120, Math.floor(perUnit)),
    };
  }, [initialWidth, detectedVars.length, evalEnabled]);

  const columns = useMemo<ColumnDef<TestCase, any>[]>(() => {
    const cols: ColumnDef<TestCase, any>[] = [
      {
        id: 'select',
        header: () => <SelectAllCheckbox />,
        cell: ({ row }) => {
          const isSelected = !!selectedIds[row.original.id];
          return (
            <Checkbox checked={isSelected} className="pointer-events-none" tabIndex={-1} />
          );
        },
        size: FIXED_COL_WIDTH.select,
        minSize: 40,
        enableResizing: false,
      },
    ];

    for (const varName of detectedVars) {
      cols.push({
        id: `var_${varName}`,
        header: varName,
        cell: ({ row }) => (
          <EditableCell
            testCaseId={row.original.id}
            variableKey={varName}
          />
        ),
        size: flexColSizes?.variable ?? 200,
        minSize: 100,
      });
    }

    cols.push({
      id: 'output',
      header: 'Output',
      cell: ({ row }) => (
        <StreamingOutputCell testCaseId={row.original.id} field="output" />
      ),
      size: flexColSizes?.output ?? 300,
      minSize: 120,
    });

    if (evalEnabled) {
      cols.push({
        id: 'evalResult',
        header: 'Eval',
        cell: ({ row }) => (
          <StreamingOutputCell testCaseId={row.original.id} field="evalResult" />
        ),
        size: flexColSizes?.eval ?? 200,
        minSize: 120,
      });
    }

    cols.push({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={cn('text-xs border', statusStyles[status] || statusStyles.idle)}>
            {status}
          </Badge>
        );
      },
      size: FIXED_COL_WIDTH.status,
      minSize: 60,
      enableResizing: false,
    });

    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions row={row.original} />,
      size: FIXED_COL_WIDTH.actions,
      minSize: 60,
      enableResizing: false,
    });

    return cols;
  }, [detectedVars, evalEnabled, selectedIds, handleSelectPointerDown, handleSelectPointerEnter, flexColSizes]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  return (
    <div ref={containerRef}>
    <Table style={{ tableLayout: 'fixed', width: table.getTotalSize() }}>
      <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="border-border hover:bg-transparent">
            {hg.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize(), maxWidth: header.column.columnDef.maxSize }}
                className="text-xs font-semibold relative"
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanResize() && (
                  <div
                    onPointerDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                      'absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none',
                      'opacity-0 hover:opacity-100 bg-primary/40',
                      header.column.getIsResizing() && 'opacity-100 bg-primary/60'
                    )}
                  />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-12">
              <div className="flex flex-col items-center gap-3 border border-dashed border-border rounded-xl p-8 text-center mx-auto max-w-sm">
                <Inbox className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="text-sm font-medium text-foreground">No test cases yet</h3>
                <p className="text-xs text-muted-foreground">Add a row or upload a CSV to get started</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row, i) => {
            const customHeight = rowHeights[row.original.id];
            return (
              <TableRow
                key={row.id}
                className={cn(
                  'border-border relative',
                  selectedIds[row.original.id]
                    ? 'bg-accent/50 ring-1 ring-inset ring-primary/15'
                    : i % 2 === 1 ? 'bg-muted/20' : ''
                )}
                style={{
                  height: customHeight ? `${customHeight}px` : undefined,
                  minHeight: '40px',
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  const isSelectCol = cell.column.id === 'select';
                  return (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.columnDef.maxSize }}
                      className={isSelectCol ? 'cursor-pointer select-none touch-none' : undefined}
                      onPointerDown={isSelectCol ? (e) => handleSelectPointerDown(e, row.original.id) : undefined}
                      onPointerEnter={isSelectCol ? () => handleSelectPointerEnter(row.original.id) : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
                {/* Row resize handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize opacity-0 hover:opacity-100 hover:bg-primary/30 z-10"
                  onPointerDown={(e) => {
                    const tr = e.currentTarget.parentElement;
                    const currentH = tr ? tr.getBoundingClientRect().height : 40;
                    startRowResize(e, row.original.id, currentH);
                  }}
                />
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
    </div>
  );
}
