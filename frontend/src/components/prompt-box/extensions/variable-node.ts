import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VariableNodeView } from '../components/VariableNodeView';

export const VariableMention = Node.create({
  name: 'variableMention',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-name'),
        renderHTML: (attrs) => ({ 'data-name': attrs.name }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="variable-mention"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'variable-mention' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableNodeView);
  },
});
