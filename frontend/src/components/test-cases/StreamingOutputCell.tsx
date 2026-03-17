import React, { useState } from 'react';
import { useStore } from '@/store';
import { CellDetailModal } from './CellDetailModal';

interface StreamingOutputCellProps {
  testCaseId: string;
  field: 'output' | 'evalResult';
}

export const StreamingOutputCell = React.memo(function StreamingOutputCell({
  testCaseId,
  field,
}: StreamingOutputCellProps) {
  const value = useStore((s) => {
    const tc = s.testCases[testCaseId];
    return tc ? (tc as any)[field] || '' : '';
  });
  const status = useStore((s) => {
    const tc = s.testCases[testCaseId];
    return tc?.status || 'idle';
  });
  const evalStatus = useStore((s) => {
    const tc = s.testCases[testCaseId];
    return tc?.evalStatus || 'idle';
  });
  const [modalOpen, setModalOpen] = useState(false);

  const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;

  return (
    <>
      <div
        className="text-sm cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded-md h-[120px] break-words whitespace-pre-wrap overflow-y-auto"
        onClick={() => value && setModalOpen(true)}
      >
        {truncated || (
          (status === 'running' || (field === 'evalResult' && evalStatus === 'running')) ? (
            <span className="text-primary/60 inline-flex items-center">
              <span className="animate-pulse">|</span>
            </span>
          ) : (
            <span className="text-muted-foreground/30">&mdash;</span>
          )
        )}
      </div>
      <CellDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={field === 'output' ? 'Output' : 'Eval Result'}
        content={value}
      />
    </>
  );
});
