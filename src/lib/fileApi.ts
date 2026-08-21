import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export interface OpenedFile {
  path: string;
  content: string;
}

const TEXT_FILTERS = [
  {
    name: "Text & Markdown",
    extensions: ["md", "markdown", "txt", "json", "yaml", "yml", "toml", "js", "ts", "tsx", "jsx", "css", "html", "py"],
  },
  { name: "All Files", extensions: ["*"] },
];

export async function openFileDialog(): Promise<OpenedFile | null> {
  const path = await open({ multiple: false, directory: false, filters: TEXT_FILTERS });
  if (!path || Array.isArray(path)) return null;
  const content = await readTextFile(path);
  return { path, content };
}

export async function saveFile(path: string, content: string): Promise<void> {
  await writeTextFile(path, content);
}

export async function saveFileAsDialog(content: string, suggestedName = "Untitled.md"): Promise<string | null> {
  const path = await save({ defaultPath: suggestedName, filters: TEXT_FILTERS });
  if (!path) return null;
  await writeTextFile(path, content);
  return path;
}
