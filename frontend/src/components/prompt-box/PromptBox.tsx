import { useEffect, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';
import { PromptBoxContext, type PromptBoxContextValue } from './context';
import { VariableMention } from './extensions/variable-node';
import {
  VariableSuggestionExtension,
  createVariableSuggestion,
} from './extensions/variable-suggestion';
import { fromPlainText, toPlainText } from './lib/serialization';

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  existingVariables?: string[];
  variableValues?: Record<string, string>;
  hasEditableVariables?: boolean;
  onEditVariable?: (varName: string) => void;
  allowNewVariables?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function PromptBox({
  value,
  onChange,
  onBlur,
  existingVariables = [],
  variableValues = {},
  hasEditableVariables = false,
  onEditVariable,
  allowNewVariables = false,
  placeholder,
  className,
  minHeight = '300px',
}: PromptBoxProps) {
  const variablesRef = useRef<string[]>(existingVariables);
  useEffect(() => {
    variablesRef.current = existingVariables;
  }, [existingVariables]);

  // Refs to hold latest callbacks without recreating editor
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);

  const suggestion = useMemo(
    () => createVariableSuggestion(variablesRef),
    [],
  );

  // Track the last value we emitted to avoid echo loops with external sync
  const lastEmittedRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        hardBreak: false,
        horizontalRule: false,
        listItem: false,
      }),
      VariableMention.configure({ allowNewVariables }),
      VariableSuggestionExtension.configure({ suggestion }),
    ],
    content: fromPlainText(value),
    onUpdate: ({ editor: e }) => {
      const text = toPlainText(e);
      lastEmittedRef.current = text;
      onChangeRef.current(text);
    },
    onBlur: () => {
      onBlurRef.current?.();
    },
    editorProps: {
      attributes: {
        class: 'outline-none whitespace-pre-wrap break-words h-full',
        'data-placeholder': placeholder ?? '',
      },
      handlePaste: (_view, event) => {
        const clipboardText = event.clipboardData?.getData('text/plain');
        if (!clipboardText || !clipboardText.includes('{{')) return false;

        const doc = fromPlainText(clipboardText);
        editor?.chain().focus().insertContent(doc).run();
        event.preventDefault();
        return true;
      },
    },
  });

  // Sync external value changes (e.g. switching prompts)
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const currentText = toPlainText(editor);
    if (currentText !== value) {
      editor.commands.setContent(fromPlainText(value));
    }
  }, [value, editor]);

  const contextValue = useMemo<PromptBoxContextValue>(
    () => ({
      variableValues,
      hasEditableVariables,
      onEditVariable,
    }),
    [variableValues, hasEditableVariables, onEditVariable],
  );

  return (
    <PromptBoxContext.Provider value={contextValue}>
      <div
        className={cn(
          'font-mono text-sm bg-muted/40 rounded-md border border-border/50 focus-within:border-primary/30 leading-[1.5] cursor-text overflow-hidden flex flex-col',
          className,
        )}
        style={{ minHeight }}
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} className="flex-1 overflow-y-auto prompt-box-editor" />
      </div>
      <style>{`
        .prompt-box-editor {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .prompt-box-editor .tiptap {
          outline: none;
          border: none;
          box-shadow: none;
          white-space: pre-wrap;
          word-wrap: break-word;
          flex: 1;
          padding: 0.75rem;
        }
        .prompt-box-editor .tiptap:focus,
        .prompt-box-editor .tiptap:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .prompt-box-editor .tiptap p {
          margin: 0;
        }
        .prompt-box-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted-foreground);
          pointer-events: none;
          height: 0;
        }
        .prompt-box-editor .tiptap .ProseMirror-selectednode {
          outline: 2px solid hsl(var(--primary));
          border-radius: 3px;
        }
      `}</style>
    </PromptBoxContext.Provider>
  );
}
