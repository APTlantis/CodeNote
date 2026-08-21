import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import { spawnPty, writePty, resizePty, killPty, onPtyData, onPtyExit } from "../../lib/ptyApi";

interface TerminalPanelProps {
  cwd?: string;
}

export function TerminalPanel({ cwd }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      searchAddonRef.current?.clearDecorations();
      terminalRef.current?.focus();
    }
  }, [searchOpen]);

  const handleSearch = useCallback(
    (dir: "next" | "prev") => {
      if (!searchAddonRef.current || !searchQuery) return;
      if (dir === "next") {
        searchAddonRef.current.findNext(searchQuery, { incremental: false, caseSensitive: false });
      } else {
        searchAddonRef.current.findPrevious(searchQuery, { incremental: false, caseSensitive: false });
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let unlistenData: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      const terminal = new Terminal({
        theme: {
          background: "#050913",
          foreground: "#E1E7DB",
          cursor: "#98A2A2",
          cursorAccent: "#050913",
          selectionBackground: "#262F39",
          black: "#050913",
          red: "#D48E8E",
          green: "#8FBFA7",
          yellow: "#D7C58A",
          blue: "#627786",
          magenta: "#768892",
          cyan: "#98A2A2",
          white: "#B9C9C5",
          brightBlack: "#262F39",
          brightRed: "#D48E8E",
          brightGreen: "#8FBFA7",
          brightYellow: "#D7C58A",
          brightBlue: "#7E827E",
          brightMagenta: "#768892",
          brightCyan: "#B9C9C5",
          brightWhite: "#E1E7DB",
        },
        fontFamily: '"Cascadia Code", "Cascadia Mono", "JetBrains Mono", Consolas, monospace',
        fontSize: 13,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 5000,
      });

      const fitAddon = new FitAddon();
      const searchAddon = new SearchAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(searchAddon);
      terminal.loadAddon(new WebLinksAddon());

      if (disposed || !containerRef.current) return;
      terminal.open(containerRef.current);
      fitAddon.fit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;
      searchAddonRef.current = searchAddon;

      terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === "f" && e.type === "keydown") {
          setSearchOpen((prev) => !prev);
          return false;
        }
        return true;
      });

      const sessionId = await spawnPty(undefined, cwd);
      if (disposed) {
        await killPty(sessionId);
        return;
      }
      sessionIdRef.current = sessionId;

      unlistenData = await onPtyData(sessionId, (chunk) => terminal.write(chunk));
      unlistenExit = await onPtyExit(sessionId, () => {
        terminal.write("\r\n\x1b[31m[process exited]\x1b[0m\r\n");
      });

      void resizePty(sessionId, terminal.cols, terminal.rows);

      terminal.onData((data) => {
        void writePty(sessionId, data);
      });

      resizeObserver = new ResizeObserver(() => {
        if (disposed) return;
        try {
          fitAddon.fit();
          void resizePty(sessionId, terminal.cols, terminal.rows);
        } catch {
          /* element not visible */
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    void init();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      unlistenData?.();
      unlistenExit?.();
      if (sessionIdRef.current) void killPty(sessionIdRef.current);
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
      sessionIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      {searchOpen && (
        <div className="cn-drawer-header" style={{ gap: "0.5rem" }}>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(e.shiftKey ? "prev" : "next");
              if (e.key === "Escape") setSearchOpen(false);
            }}
            placeholder="Search terminal…"
            className="atl-button-ghost"
            style={{ width: "12rem", padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
          />
          <button className="atl-button-ghost" onClick={() => handleSearch("prev")}>
            ↑
          </button>
          <button className="atl-button-ghost" onClick={() => handleSearch("next")}>
            ↓
          </button>
          <button className="atl-button-ghost" onClick={() => setSearchOpen(false)}>
            ✕
          </button>
        </div>
      )}
      <div ref={containerRef} className="cn-drawer-body" />
    </div>
  );
}
