import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VariableNodeView } from '../components/VariableNodeView';

export interface VariableMentionOptions {
  allowNewVariables: boolean;
}

export const VariableMention = Node.create<VariableMentionOptions>({
  name: 'variableMention',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      allowNewVariables: false,
    };
  },

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

  addInputRules() {
    if (!this.options.allowNewVariables) return [];

    return [
      new InputRule({
        find: /\{\{(\w+)\}\}$/,
        handler: ({ state, range, match }) => {
          const name = match[1];
          const node = state.schema.nodes.variableMention.create({ name });
          state.tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },
});
