import type { ViewUpdate } from "@codemirror/view";
import { CodeEditor } from "./CodeEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import type { LanguageId } from "../../lib/language";
import { isMarkdown } from "../../lib/language";

interface EditorViewProps {
  value: string;
  language: LanguageId;
  basePath?: string | null;
  onChange: (value: string, viewUpdate: ViewUpdate) => void;
}

export function EditorView({ value, language, basePath, onChange }: EditorViewProps) {
  const showPreview = isMarkdown(language);

  return (
    <div className="cn-body">
      <div className={`cn-pane cn-editor-pane`}>
        <CodeEditor value={value} language={language} onChange={onChange} />
      </div>
      {showPreview && (
        <div className="cn-pane">
          <MarkdownPreview source={value} basePath={basePath} />
        </div>
      )}
    </div>
  );
}
