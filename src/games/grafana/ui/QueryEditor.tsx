import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, LRLanguage, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { parser } from '@prometheus-io/lezer-promql';
import { useEffect, useRef } from 'react';

const promql = LRLanguage.define({ name: 'promql', parser: parser.configure({ top: 'PromQL' }) });

const highlight = HighlightStyle.define([
  { tag: t.function(t.variableName), color: '#7aa5ff' },
  { tag: t.operatorKeyword, color: '#e69f00', fontWeight: '600' },
  { tag: t.modifier, color: '#cc79a7' },
  { tag: t.logicOperator, color: '#cc79a7' },
  { tag: t.labelName, color: '#56b4e9' },
  { tag: t.string, color: '#7ee787' },
  { tag: t.number, color: '#f0e442' },
  { tag: t.comment, color: '#8b8d98', fontStyle: 'italic' },
  { tag: t.variableName, color: '#d8d9e3' },
]);

const theme = EditorView.theme(
  {
    '&': { color: '#d8d9e3', backgroundColor: '#111217' },
    '.cm-content': { caretColor: '#6e9fff', fontFamily: 'var(--font-mono)', padding: '6px 0' },
    '.cm-cursor': { borderLeftColor: '#6e9fff' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#2f4a7a' },
    '.cm-placeholder': { color: '#8b8d98' },
  },
  { dark: true },
);

interface Props {
  value: string;
  onChange?: (value: string) => void;
  /** Ctrl/Cmd+Enter. */
  onRun?: (value: string) => void;
  autoFocus?: boolean;
  label: string;
  placeholder?: string;
  id?: string;
}

export function QueryEditor({ value, onChange, onRun, autoFocus, label, placeholder, id }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRun });
  callbacks.current = { onChange, onRun };

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([
            {
              key: 'Mod-Enter',
              run: (ed) => {
                callbacks.current.onRun?.(ed.state.doc.toString());
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          promql,
          syntaxHighlighting(highlight),
          theme,
          EditorView.lineWrapping,
          cmPlaceholder(placeholder ?? 'Enter a PromQL query… (Ctrl+Enter to run)'),
          EditorView.contentAttributes.of({ 'aria-label': label, ...(id ? { id } : {}) }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) callbacks.current.onChange?.(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    if (autoFocus) v.focus();
    return () => v.destroy();
    // The editor is created once; later `value` changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} />;
}
