import { fileNameFromPath } from "./language";

export interface Tab {
  id: string;
  path: string | null;
  content: string;
  dirty: boolean;
  /** Stable display name for an unsaved tab (path is null). Ignored once a path is set. */
  untitledName: string;
}

function nextId(): string {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nextUntitledName(existingTabs: Tab[]): string {
  const used = new Set(existingTabs.filter((t) => !t.path).map((t) => t.untitledName));
  let n = 1;
  while (used.has(n === 1 ? "Untitled" : `Untitled ${n}`)) n += 1;
  return n === 1 ? "Untitled" : `Untitled ${n}`;
}

export function createTab(path: string | null, content: string, existingTabs: Tab[] = []): Tab {
  if (path) {
    return { id: nextId(), path, content, dirty: false, untitledName: "" };
  }
  return { id: nextId(), path: null, content, dirty: false, untitledName: nextUntitledName(existingTabs) };
}

/** Rebuild a live Tab (fresh id) from a persisted-session record on app startup. */
export function restoreTab(saved: { path: string | null; content: string; dirty: boolean; untitledName: string }): Tab {
  return { id: nextId(), path: saved.path, content: saved.content, dirty: saved.dirty, untitledName: saved.untitledName };
}

export function tabTitle(tab: Tab): string {
  return tab.path ? fileNameFromPath(tab.path) : tab.untitledName;
}
