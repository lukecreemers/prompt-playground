import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Pencil } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { usePromptBoxContext } from '../context';

export function VariableNodeView({ node }: NodeViewProps) {
  const name: string = node.attrs.name;
  const { variableValues, hasEditableVariables, onEditVariable } = usePromptBoxContext();
  const value = variableValues[name];
  const hasValue = value !== undefined && value !== '';

  const badge = (
    <span className="inline-flex items-center gap-0.5 text-primary font-mono font-medium">
      {`{{${name}}}`}
      {hasEditableVariables && onEditVariable && (
        <button
          type="button"
          className="inline-flex items-center justify-center h-4 w-4 rounded hover:bg-primary/20 transition-colors"
          onClick={() => onEditVariable(name)}
          contentEditable={false}
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );

  if (!hasValue) {
    return (
      <NodeViewWrapper as="span" className="inline">
        {badge}
      </NodeViewWrapper>
    );
  }

  const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;

  return (
    <NodeViewWrapper as="span" className="inline">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs font-mono text-xs">
            {truncated}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </NodeViewWrapper>
  );
}
