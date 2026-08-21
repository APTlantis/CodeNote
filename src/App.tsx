import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewUpdate } from "@codemirror/view";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppShell } from "./components/blue-slate/AppShell";
import { Tabs } from "./components/blue-slate/Tabs";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { EditorView } from "./components/editor/EditorView";
import { TerminalPanel } from "./components/terminal/TerminalPanel";
import { openFileDialog, saveFile, saveFileAsDialog } from "./lib/fileApi";
import { detectLanguage } from "./lib/language";
import { loadSession, saveSession, tabsToSession } from "./lib/session";
import { createTab, restoreTab, tabTitle, type Tab } from "./lib/tabs";

const WELCOME = `# Welcome to CodeNote

A lightweight markdown & text editor with a native terminal.

- **Ctrl+S** to save
- **Ctrl+\`** to toggle the terminal
- **Ctrl+N** for a new tab, **Ctrl+W** to close one
- Fenced code blocks are syntax highlighted

\`\`\`ts
function hello(name: string) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

\`\`\`mermaid
graph TD
  A[Write] --> B[Preview]
  B --> C[Ship]
\`\`\`
`;

function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => [createTab(null, WELCOME)]);
  const [activeId, setActiveId] = useState<string>(() => tabs[0].id);
  const [terminalOpen, setTerminalOpen] = useState(false);
  // Gates the persistence-write effect until the startup restore (below) has
  // had a chance to run — without this, the very first render's placeholder
  // Welcome tab gets written over whatever session was saved last time,
  // before loadSession() even resolves.
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Refs mirror the latest state so the window close-requested handler
  // (registered once) can flush an up-to-the-second snapshot instead of
  // whatever was captured when the listener was first attached.
  const tabsRef = useRef(tabs);
  const activeIdRef = useRef(activeId);
  const terminalOpenRef = useRef(terminalOpen);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    terminalOpenRef.current = terminalOpen;
  }, [terminalOpen]);

  // Restore whatever tabs/active tab/terminal state were open the last time
  // the app was closed — matching how Notepad/Notepad++ reopen with the
  // same buffers (including unsaved ones) rather than a blank slate.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadSession();
      if (cancelled) return;
      if (saved && saved.tabs.length > 0) {
        const restored = saved.tabs.map(restoreTab);
        setTabs(restored);
        const fallbackIndex = Math.min(Math.max(saved.activeIndex, 0), restored.length - 1);
        setActiveId(restored[fallbackIndex].id);
        setTerminalOpen(saved.terminalOpen);
      }
      setSessionLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced persistence: any change to tabs/active tab/terminal state gets
  // written to disk shortly after it settles, so a crash or unexpected quit
  // loses at most a fraction of a second of edits.
  useEffect(() => {
    if (!sessionLoaded) return;
    const timeout = setTimeout(() => {
      void saveSession(tabsToSession(tabs, activeId, terminalOpen));
    }, 400);
    return () => clearTimeout(timeout);
  }, [tabs, activeId, terminalOpen, sessionLoaded]);

  // Belt-and-suspenders flush on the actual close event, so the debounce
  // window above can never cause the last keystrokes before quitting to be
  // dropped.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;
    void (async () => {
      const win = getCurrentWindow();
      const off = await win.onCloseRequested(async (event) => {
        event.preventDefault();
        await saveSession(tabsToSession(tabsRef.current, activeIdRef.current, terminalOpenRef.current));
        await win.destroy();
      });
      if (disposed) {
        off();
      } else {
        unlisten = off;
      }
    })();
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const language = detectLanguage(activeTab.path ?? "Untitled.md");
  const basePath = activeTab.path
    ? activeTab.path.slice(0, Math.max(activeTab.path.lastIndexOf("/"), activeTab.path.lastIndexOf("\\")))
    : null;

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const handleChange = useCallback(
    (value: string, _update: ViewUpdate) => {
      updateTab(activeId, { content: value, dirty: true });
    },
    [activeId, updateTab],
  );

  const handleNewTab = useCallback(() => {
    const tab = createTab(null, "", tabs);
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }, [tabs]);

  const handleOpen = useCallback(async () => {
    const opened = await openFileDialog();
    if (!opened) return;
    const existing = tabs.find((t) => t.path === opened.path);
    if (existing) {
      updateTab(existing.id, { content: opened.content, dirty: false });
      setActiveId(existing.id);
      return;
    }
    const tab = createTab(opened.path, opened.content);
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }, [tabs, updateTab]);

  const handleSave = useCallback(async () => {
    const tab = tabs.find((t) => t.id === activeId);
    if (!tab) return;
    if (tab.path) {
      await saveFile(tab.path, tab.content);
      updateTab(tab.id, { dirty: false });
      return;
    }
    const saved = await saveFileAsDialog(tab.content);
    if (saved) {
      updateTab(tab.id, { path: saved, dirty: false });
    }
  }, [tabs, activeId, updateTab]);

  const handleCloseTab = useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (tab?.dirty && !window.confirm("Discard unsaved changes?")) return;

      const idx = tabs.findIndex((t) => t.id === id);
      const remaining = tabs.filter((t) => t.id !== id);

      if (remaining.length === 0) {
        const fresh = createTab(null, "");
        setTabs([fresh]);
        setActiveId(fresh.id);
        return;
      }

      setTabs(remaining);
      if (id === activeId) {
        const fallback = remaining[Math.min(idx, remaining.length - 1)];
        setActiveId(fallback.id);
      }
    },
    [tabs, activeId],
  );

  const cycleTab = useCallback(
    (direction: 1 | -1) => {
      setActiveId((current) => {
        const idx = tabs.findIndex((t) => t.id === current);
        if (idx === -1) return current;
        const nextIdx = (idx + direction + tabs.length) % tabs.length;
        return tabs[nextIdx].id;
      });
    },
    [tabs],
  );

  const handleToggleTerminal = useCallback(() => setTerminalOpen((prev) => !prev), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
      if (mod && e.key === "`") {
        e.preventDefault();
        handleToggleTerminal();
      }
      if (mod && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewTab();
      }
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void handleOpen();
      }
      if (mod && e.key.toLowerCase() === "w") {
        e.preventDefault();
        handleCloseTab(activeId);
      }
      if (mod && e.key === "Tab") {
        e.preventDefault();
        cycleTab(e.shiftKey ? -1 : 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, handleToggleTerminal, handleNewTab, handleOpen, handleCloseTab, cycleTab, activeId]);

  return (
    <AppShell
      rail={
        <Sidebar
          onNew={handleNewTab}
          onOpen={() => void handleOpen()}
          onSave={() => void handleSave()}
          terminalOpen={terminalOpen}
          onToggleTerminal={handleToggleTerminal}
        />
      }
    >
      <Tabs tabs={tabs} activeId={activeTab.id} onSelect={setActiveId} onClose={handleCloseTab} onNew={handleNewTab} />
      <Header title={tabTitle(activeTab)} path={activeTab.path} dirty={activeTab.dirty} />
      <EditorView
        key={activeTab.id}
        value={activeTab.content}
        language={language}
        basePath={basePath}
        onChange={handleChange}
      />
      {terminalOpen && (
        <div className="cn-drawer">
          <div className="cn-drawer-header">
            <span>TERMINAL</span>
            <div style={{ flex: 1 }} />
            <button className="atl-button-ghost" onClick={handleToggleTerminal}>
              ✕
            </button>
          </div>
          <TerminalPanel />
        </div>
      )}
    </AppShell>
  );
}

export default App;
