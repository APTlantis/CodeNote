export type LanguageId =
  | "json"
  | "markdown"
  | "javascript"
  | "typescript"
  | "python"
  | "css"
  | "html"
  | "yaml"
  | "toml"
  | "text";

const EXTENSION_MAP: Record<string, LanguageId> = {
  md: "markdown",
  markdown: "markdown",
  json: "json",
  jsonc: "json",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  css: "css",
  scss: "css",
  html: "html",
  htm: "html",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
};

export function detectLanguage(path: string | null | undefined): LanguageId {
  if (!path) return "text";
  const name = path.split(/[/\\]/).pop() ?? path;
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : undefined;
  if (!ext) return "text";
  return EXTENSION_MAP[ext] ?? "text";
}

export function fileNameFromPath(path: string | null | undefined): string {
  if (!path) return "Untitled";
  return path.split(/[/\\]/).pop() ?? path;
}

export function isMarkdown(language: LanguageId): boolean {
  return language === "markdown";
}
