# CodeNote

![status](https://img.shields.io/badge/status-active-brightgreen)
![license](https://img.shields.io/badge/license-See_LICENSE-blue)
![stage](https://img.shields.io/badge/stage-prototype-orange)
![language](https://img.shields.io/badge/language-multi-lightgrey)

CodeNote is a lightweight desktop markdown/text editor with a live preview and a native terminal, built on Tauri. It's a single window, single surface — editor, preview, and an optional terminal drawer, no dashboards or settings screens. The idea is narrow but deep: few features, but the ones it has (syntax highlighting, diagrams) are full-featured rather than a cut-down subset.

## What's in it

- **Editor** — CodeMirror 6, with language packages for JS/TS/JSX/TSX, Python, CSS, HTML, JSON, YAML, and Markdown, auto-detected from the file extension. Styled like archival paper: off-white background, faint graph-paper grid, warm ink text.
- **Live markdown preview** — a `remark` → `rehype` pipeline (GFM tables, task lists, footnotes, headings, blockquotes, relative image resolution, external links opened in the OS browser instead of in-app).
- **Code highlighting** — the full vendored PrismJS 1.30.0 bundle: every language Prism ships, not a hand-picked list, plus a curated plugin set (copy-to-clipboard, line numbers, brace matching, inline color swatches, treeview, and more).
- **Diagrams** — fenced ` ```mermaid ` blocks render via Mermaid, configured permissively (loose security so click handlers/tooltips work, HTML labels, high size/edge limits) rather than locked to a small diagram subset. Theme is hand-matched to the app's blue-slate palette.
- **Terminal** — an xterm.js-backed native PTY session, toggled independently of whatever file is open.
- **Tabs** — multi-tab editing with dirty-state tracking, close/cycle/new.

## Stack

Tauri 2 (Rust shell) + React 19 + Vite 7, with CodeMirror 6 for editing, `unified`/`remark`/`rehype` for markdown, vendored PrismJS for highlighting, Mermaid 11 for diagrams, and xterm.js for the terminal.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| Ctrl/Cmd+S | Save |
| Ctrl/Cmd+` | Toggle terminal |
| Ctrl/Cmd+N | New tab |
| Ctrl/Cmd+O | Open file |
| Ctrl/Cmd+W | Close tab (confirms if dirty) |
| Ctrl/Cmd+Tab / Shift+Tab | Cycle tabs |

## File I/O

Tauri's dialog and fs plugins handle open/save — saves in place if the file has a known path, otherwise prompts a save-as dialog. No cloud sync, no auto-save beyond explicit save.

## Explicitly out of scope

Multi-window, a plugin/extension system, cloud sync, collaborative editing, a settings UI, and a command palette. None of these are planned — the app is meant to stay small.

## Development

```
npm install
npm run dev      # Vite dev server
npm run tauri dev  # Tauri desktop shell
npm run build     # tsc + production build
```

See `SPEC.md` for the full rendering contract and design notes.
