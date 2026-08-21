import { appConfigDir, join } from "@tauri-apps/api/path";
import { exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { Tab } from "./tabs";

// Session persistence: CodeNote is a single-window app with no auto-save, so
// the only way to "lose" work by closing the window is if we don't snapshot
// it somewhere durable first. This mirrors what Notepad++/most editors do —
// reopen the app and get back exactly the tabs (including unsaved/untitled
// ones with their in-progress content), the active tab, and the terminal
// drawer's open/closed state, not just a blank Welcome tab.
const SESSION_FILE_NAME = "session.json";
const SESSION_VERSION = 1;

export interface PersistedTab {
  path: string | null;
  content: string;
  dirty: boolean;
  untitledName: string;
}

export interface SessionState {
  version: number;
  tabs: PersistedTab[];
  activeIndex: number;
  terminalOpen: boolean;
}

export function tabsToSession(tabs: Tab[], activeId: string, terminalOpen: boolean): SessionState {
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeId),
  );
  return {
    version: SESSION_VERSION,
    tabs: tabs.map((t) => ({ path: t.path, content: t.content, dirty: t.dirty, untitledName: t.untitledName })),
    activeIndex,
    terminalOpen,
  };
}

async function sessionFilePath(): Promise<string> {
  const dir = await appConfigDir();
  return join(dir, SESSION_FILE_NAME);
}

export async function saveSession(state: SessionState): Promise<void> {
  try {
    const dir = await appConfigDir();
    if (!(await exists(dir))) {
      await mkdir(dir, { recursive: true });
    }
    const file = await join(dir, SESSION_FILE_NAME);
    await writeTextFile(file, JSON.stringify(state));
  } catch (err) {
    // Session persistence is a nice-to-have, not a blocking file-I/O path —
    // never let a save/mkdir failure surface as an app-breaking error.
    console.error("CodeNote: failed to save session state", err);
  }
}

export async function loadSession(): Promise<SessionState | null> {
  try {
    const file = await sessionFilePath();
    if (!(await exists(file))) return null;
    const raw = await readTextFile(file);
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (parsed.version !== SESSION_VERSION || !Array.isArray(parsed.tabs) || parsed.tabs.length === 0) {
      return null;
    }
    return parsed as SessionState;
  } catch (err) {
    console.error("CodeNote: failed to load session state", err);
    return null;
  }
}
