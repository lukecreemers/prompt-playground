import { useStore } from '@/store';

export function IoChangesBanner() {
  const activeCodeFunction = useStore((s) => s.activeCodeFunction);
  const codeAiProposal = useStore((s) => s.codeAiProposal);
  const acceptCodeAiProposal = useStore((s) => s.acceptCodeAiProposal);
  const rejectCodeAiProposal = useStore((s) => s.rejectCodeAiProposal);

  if (!activeCodeFunction || !codeAiProposal) return null;

  const currentInputs: string[] = JSON.parse(activeCodeFunction.inputs || '[]');
  const currentOutputs: string[] = JSON.parse(activeCodeFunction.outputs || '[]');
  const proposedInputs = codeAiProposal.inputs;
  const proposedOutputs = codeAiProposal.outputs;

  const addedInputs = proposedInputs.filter((i) => !currentInputs.includes(i));
  const removedInputs = currentInputs.filter((i) => !proposedInputs.includes(i));
  const addedOutputs = proposedOutputs.filter((o) => !currentOutputs.includes(o));
  const removedOutputs = currentOutputs.filter((o) => !proposedOutputs.includes(o));

  const hasChanges = addedInputs.length > 0 || removedInputs.length > 0 || addedOutputs.length > 0 || removedOutputs.length > 0;

  if (!hasChanges) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-accent/30 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">I/O Changes:</span>

        {addedInputs.map((name) => (
          <span key={`+in-${name}`} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            + input: {name}
          </span>
        ))}
        {removedInputs.map((name) => (
          <span key={`-in-${name}`} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 line-through">
            input: {name}
          </span>
        ))}
        {addedOutputs.map((name) => (
          <span key={`+out-${name}`} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            + output: {name}
          </span>
        ))}
        {removedOutputs.map((name) => (
          <span key={`-out-${name}`} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 line-through">
            output: {name}
          </span>
        ))}
      </div>
    </div>
  );
}
