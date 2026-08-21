import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export async function spawnPty(shell?: string, cwd?: string): Promise<string> {
  return invoke<string>("pty_spawn", { shell, cwd });
}

export async function writePty(sessionId: string, data: string): Promise<void> {
  await invoke("pty_write", { sessionId, data });
}

export async function resizePty(sessionId: string, cols: number, rows: number): Promise<void> {
  await invoke("pty_resize", { sessionId, cols, rows });
}

export async function killPty(sessionId: string): Promise<void> {
  await invoke("pty_kill", { sessionId });
}

export function onPtyData(sessionId: string, cb: (chunk: string) => void): Promise<UnlistenFn> {
  return listen<string>(`pty://data/${sessionId}`, (event) => cb(event.payload));
}

export function onPtyExit(sessionId: string, cb: () => void): Promise<UnlistenFn> {
  return listen(`pty://exit/${sessionId}`, () => cb());
}
