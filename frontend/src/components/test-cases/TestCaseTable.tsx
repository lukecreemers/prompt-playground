import { useMemo, useCallback } from 'react';
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
import { Trash2, ArrowUpRight, Inbox } from 'lucide-react';
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

function RowCheckbox({ id }: { id: string }) {
  const isSelected = useStore((s) => !!s.selectedTestCaseIds[id]);
  const toggleSelection = useStore((s) => s.toggleTestCaseSelection);

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={() => toggleSelection(id)}
    />
  );
}

function RowActions({ row }: { row: TestCase }) {
  const deleteTestCase = useStore((s) => s.deleteTestCase);
  const setTesterVariables = useStore((s) => s.setTesterVariables);
  const setActiveSubTab = useStore((s) => s.setActiveSubTab);

  return (
    <div className="flex items-center gap-0.5">
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

export function TestCaseTable() {
  const testCases = useStore((s) => s.testCases);
  const selectedIds = useStore((s) => s.selectedTestCaseIds);
  const detectedVars = useDetectedVariables();

  const data = useMemo(() => Object.values(testCases), [testCases]);

  const columns = useMemo<ColumnDef<TestCase, any>[]>(() => {
    const cols: ColumnDef<TestCase, any>[] = [
      {
        id: 'select',
        header: () => <SelectAllCheckbox />,
        cell: ({ row }) => <RowCheckbox id={row.original.id} />,
        size: 40,
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
        size: 200,
        maxSize: 300,
      });
    }

    cols.push({
      id: 'output',
      header: 'Output',
      cell: ({ row }) => (
        <StreamingOutputCell testCaseId={row.original.id} field="output" />
      ),
      size: 300,
      maxSize: 400,
    });

    cols.push({
      id: 'evalResult',
      header: 'Eval',
      cell: ({ row }) => (
        <StreamingOutputCell testCaseId={row.original.id} field="evalResult" />
      ),
      size: 200,
      maxSize: 300,
    });

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
      size: 80,
    });

    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions row={row.original} />,
      size: 70,
    });

    return cols;
  }, [detectedVars]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="border-border hover:bg-transparent">
            {hg.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize(), maxWidth: header.column.columnDef.maxSize }}
                className="text-xs font-semibold"
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
          table.getRowModel().rows.map((row, i) => (
            <TableRow
              key={row.id}
              className={cn(
                'border-border',
                selectedIds[row.original.id]
                  ? 'bg-accent/50 ring-1 ring-inset ring-primary/15'
                  : i % 2 === 1 ? 'bg-muted/20' : ''
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  style={{ width: cell.column.getSize(), maxWidth: cell.column.columnDef.maxSize }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
