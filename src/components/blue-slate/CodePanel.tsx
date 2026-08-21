import { useEffect, useRef } from "react";
// Side-effect imports of the vendored full Prism bundle. Safe to import from
// multiple places — modules are cached, the script only runs once.
import "../../vendor/prism.js";
import "../../vendor/prism.css";

interface CodePanelProps {
  code: string;
  language?: string;
}

/**
 * Blue-slate starter-pack CodePanel: a standalone, highlighted code block
 * using the atl-code contract class, plus the line-numbers and match-braces
 * Prism plugins. MarkdownPreview.tsx doesn't use this directly (it injects
 * raw rehype-stringify HTML and highlights in place), but this is the
 * canonical component for embedding a single code snippet elsewhere in a
 * blue-slate app — a command output panel, a doc excerpt, etc.
 */
export function CodePanel({ code, language = "none" }: CodePanelProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) window.Prism.highlightElement(codeRef.current);
  }, [code, language]);

  return (
    <pre className={`atl-code line-numbers match-braces language-${language}`}>
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
}
