import { useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import Editor, { type BeforeMount, type OnMount, useMonaco } from '@monaco-editor/react';

interface CodeEditorProps {
  functionId: string;
  value: string;
  onChange: (value: string) => void;
}

const handleBeforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('app-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'e4e4e7' },
      { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c084fc' },
      { token: 'string', foreground: '34d399' },
      { token: 'number', foreground: 'fbbf24' },
      { token: 'type', foreground: '60a5fa' },
    ],
    colors: {
      'editor.background': '#272730',
      'editor.foreground': '#e4e4e7',
      'editor.lineHighlightBackground': '#2c2c36',
      'editor.selectionBackground': '#3f3f4640',
      'editorLineNumber.foreground': '#52525b',
      'editorLineNumber.activeForeground': '#a1a1aa',
      'editor.inactiveSelectionBackground': '#27272a40',
      'editorIndentGuide.background': '#3f3f46',
      'editorCursor.foreground': '#e4e4e7',
      'editorWidget.background': '#27272a',
      'editorWidget.border': '#3f3f46',
    },
  });

  monaco.editor.defineTheme('app-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '1a1a2e' },
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7c3aed' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'd97706' },
      { token: 'type', foreground: '2563eb' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1a1a2e',
      'editor.lineHighlightBackground': '#f5f5f7',
      'editor.selectionBackground': '#7c3aed20',
      'editorLineNumber.foreground': '#9ca3af',
      'editorLineNumber.activeForeground': '#6b7280',
      'editor.inactiveSelectionBackground': '#7c3aed10',
      'editorIndentGuide.background': '#e5e7eb',
      'editorCursor.foreground': '#1a1a2e',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e0e0e6',
    },
  });
};

// Subscribe to the `dark` class on <html> so we catch every toggle, even if this component wasn't mounted at the time.
function subscribeToTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}
function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

export function CodeEditor({ functionId, value, onChange }: CodeEditorProps) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDark = useSyncExternalStore(subscribeToTheme, getIsDark);
  const monaco = useMonaco();
  const monacoTheme = isDark ? 'app-dark' : 'app-light';

  // Switch theme reactively when user toggles light/dark
  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(monacoTheme);
    }
  }, [monaco, monacoTheme]);

  const handleChange = useCallback((newValue: string | undefined) => {
    if (newValue === undefined) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  }, [onChange]);

  const handleMount: OnMount = (editor) => {
    editor.focus();
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Editor
        key={functionId}
        defaultValue={value}
        language="javascript"
        theme={monacoTheme}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        loading={
          <div className="flex items-center justify-center h-full bg-card text-muted-foreground text-sm">
            Loading editor...
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          bracketPairColorization: { enabled: true },
          padding: { top: 12 },
          renderLineHighlight: 'line',
          scrollbar: { verticalScrollbarSize: 8 },
          lineNumbersMinChars: 3,
          folding: true,
          contextmenu: true,
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
}
