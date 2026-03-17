import { ReactRenderer } from '@tiptap/react';
import { type SuggestionOptions } from '@tiptap/suggestion';
import Suggestion from '@tiptap/suggestion';
import { Extension } from '@tiptap/core';
import { SuggestionDropdown, type SuggestionDropdownRef } from '../components/SuggestionDropdown';

export function createVariableSuggestion(
  variablesRef: React.RefObject<string[]>,
): Pick<SuggestionOptions, 'items' | 'render' | 'command' | 'char' | 'allowSpaces'> {
  return {
    char: '{{',
    allowSpaces: false,

    items: ({ query }) => {
      const vars = variablesRef.current ?? [];
      if (!query) return vars;
      return vars.filter((v) => v.toLowerCase().startsWith(query.toLowerCase()));
    },

    command: ({ editor, range, props }: any) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'variableMention',
          attrs: { name: props.name },
        })
        .run();
    },

    render: () => {
      let component: ReactRenderer<SuggestionDropdownRef> | null = null;
      let popup: HTMLDivElement | null = null;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SuggestionDropdown, {
            props: {
              items: props.items,
              command: (attrs: any) => props.command(attrs),
            },
            editor: props.editor,
          });

          popup = document.createElement('div');
          popup.style.position = 'fixed';
          popup.style.zIndex = '9999';
          document.body.appendChild(popup);

          popup.appendChild(component.element);
          updatePosition(props, popup);
        },

        onUpdate: (props: any) => {
          component?.updateProps({
            items: props.items,
            command: (attrs: any) => props.command(attrs),
          });

          if (popup) updatePosition(props, popup);
        },

        onKeyDown: (props: any) => {
          if (props.event.key === 'Escape') {
            popup?.remove();
            component?.destroy();
            popup = null;
            component = null;
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          popup?.remove();
          component?.destroy();
          popup = null;
          component = null;
        },
      };
    },
  };
}

function updatePosition(props: any, popup: HTMLDivElement) {
  const { clientRect } = props;
  if (!clientRect) return;
  const rect = clientRect();
  if (!rect) return;
  popup.style.top = `${rect.bottom + 4}px`;
  popup.style.left = `${rect.left}px`;
}

export const VariableSuggestionExtension = Extension.create({
  name: 'variableSuggestion',

  addOptions() {
    return {
      suggestion: {} as ReturnType<typeof createVariableSuggestion>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
