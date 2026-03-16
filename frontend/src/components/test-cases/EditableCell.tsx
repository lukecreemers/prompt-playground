import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { Textarea } from '@/components/ui/textarea';

interface EditableCellProps {
  testCaseId: string;
  variableKey: string;
}

export function EditableCell({ testCaseId, variableKey }: EditableCellProps) {
  const tc = useStore((s) => s.testCases[testCaseId]);
  const updateTestCase = useStore((s) => s.updateTestCase);

  const vars = tc ? JSON.parse(tc.variables || '{}') : {};
  const [value, setValue] = useState(vars[variableKey] || '');
  const [editing, setEditing] = useState(false);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (value !== (vars[variableKey] || '')) {
      const newVars = { ...vars, [variableKey]: value };
      updateTestCase(testCaseId, { variables: newVars });
    }
  }, [value, vars, variableKey, testCaseId, updateTestCase]);

  if (editing) {
    return (
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        autoFocus
        className="text-sm bg-muted/60 border-border/50 h-[120px] resize-none"
      />
    );
  }

  return (
    <div
      className="text-sm cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded-md h-[120px] break-words whitespace-pre-wrap overflow-y-auto"
      onClick={() => setEditing(true)}
    >
      {value || <span className="text-muted-foreground/50">click to edit</span>}
    </div>
  );
}
