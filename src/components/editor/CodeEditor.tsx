import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ViewUpdate } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting, StreamLanguage } from "@codemirror/language";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { yaml } from "@codemirror/lang-yaml";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";
import type { LanguageId } from "../../lib/language";

interface CodeEditorProps {
  value: string;
  language: LanguageId;
  onChange: (value: string, viewUpdate: ViewUpdate) => void;
}

function languageExtension(language: LanguageId): Extension[] {
  switch (language) {
    case "json":
      return [json()];
    case "markdown":
      return [markdown()];
    case "javascript":
      return [javascript()];
    case "typescript":
      return [javascript({ typescript: true })];
    case "python":
      return [python()];
    case "css":
      return [css()];
    case "html":
      return [html()];
    case "yaml":
      return [yaml()];
    case "toml":
      return [StreamLanguage.define(toml)];
    default:
      return [];
  }
}

// Archival paper surface: warm off-white base with a faint graph-paper grid
// (same hairline-gradient technique as .atl-shell in theme.css, inked for a
// light ground). Colors come from the --paper-* custom properties defined on
// .cn-editor-pane so the editor reads as a writing surface, distinct from the
// dark app chrome around it.
const codeNoteChrome = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--paper-bg)",
      backgroundImage:
        "linear-gradient(var(--paper-grid) 1px, transparent 1px), linear-gradient(90deg, var(--paper-grid) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
      color: "var(--paper-ink)",
      height: "100%",
    },
    ".cm-content": {
      caretColor: "var(--paper-cursor)",
      fontFamily: "var(--font-atl-mono)",
      fontSize: "13.5px",
      padding: "0.75rem 0",
    },
    ".cm-scroller": { overflow: "auto" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--paper-cursor)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "var(--paper-selection)",
    },
    ".cm-activeLine": { backgroundColor: "var(--paper-active-line)" },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--paper-active-line)",
      color: "var(--paper-ink-soft)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--paper-bg-gutter)",
      color: "var(--paper-muted)",
      border: "none",
      borderRight: "1px solid var(--paper-border)",
    },
    ".cm-panels": {
      backgroundColor: "var(--paper-bg-gutter)",
      color: "var(--paper-ink)",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--paper-bg-gutter)",
      color: "var(--paper-ink)",
      border: "1px solid var(--paper-border)",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "var(--paper-selection)",
      outline: "1px solid var(--paper-cursor)",
    },
  },
  { dark: false },
);

const codeNoteHighlight = HighlightStyle.define([
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: "#2B4A63" },
  { tag: [tags.string, tags.special(tags.string)], color: "#8A5A2B" },
  { tag: [tags.number, tags.bool, tags.atom], color: "#3E6E5B" },
  { tag: [tags.keyword, tags.operator], color: "#6B3A3A" },
  { tag: tags.comment, color: "#7C7A66", fontStyle: "italic" },
  { tag: [tags.punctuation, tags.bracket, tags.separator], color: "#8C8D74" },
  { tag: [tags.heading, tags.heading1, tags.heading2, tags.heading3], color: "#1F2A33", fontWeight: "700" },
  { tag: [tags.link, tags.url], color: "#2B4A63", textDecoration: "underline" },
  { tag: tags.strong, fontWeight: "700", color: "#2A2A22" },
  { tag: tags.emphasis, fontStyle: "italic" },
]);

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const extensions = useMemo<Extension[]>(
    () => [
      ...languageExtension(language),
      codeNoteChrome,
      syntaxHighlighting(codeNoteHighlight),
      EditorView.lineWrapping,
    ],
    [language],
  );

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme="none"
      extensions={extensions}
      basicSetup={{ foldGutter: true, autocompletion: true, highlightActiveLine: true }}
      onChange={onChange}
      style={{ height: "100%" }}
    />
  );
}
