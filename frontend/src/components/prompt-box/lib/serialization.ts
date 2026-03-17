import type { JSONContent, Editor } from '@tiptap/core';

const VAR_REGEX = /(\{\{\w+\}\})/;
const VAR_EXTRACT = /^\{\{(\w+)\}\}$/;

export function fromPlainText(text: string): JSONContent {
  const lines = text.split('\n');
  const paragraphs: JSONContent[] = lines.map((line) => {
    if (line === '') return { type: 'paragraph' };

    const parts = line.split(VAR_REGEX).filter(Boolean);
    const content: JSONContent[] = parts.map((part) => {
      const match = part.match(VAR_EXTRACT);
      if (match) {
        return {
          type: 'variableMention',
          attrs: { name: match[1] },
        };
      }
      return { type: 'text', text: part };
    });

    return { type: 'paragraph', content };
  });

  return { type: 'doc', content: paragraphs };
}

export function toPlainText(editor: Editor): string {
  const doc = editor.getJSON();
  if (!doc.content) return '';

  return doc.content
    .map((paragraph) => {
      if (!paragraph.content) return '';
      return paragraph.content
        .map((node) => {
          if (node.type === 'variableMention' && node.attrs?.name) {
            return `{{${node.attrs.name}}}`;
          }
          return node.text ?? '';
        })
        .join('');
    })
    .join('\n');
}
