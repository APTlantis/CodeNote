# CodeNote (Aptlantis Blue-Slate) — Spec

## What it is
A Tauri desktop app: a lightweight markdown/text editor with a live preview and a native terminal. Single window, no multi-page navigation — the whole "app" is one rendering surface (editor + preview + optional terminal drawer) plus a tab strip and icon rail.

## Why a traditional app spec doesn't fully apply
There's no dashboard, no settings screens, no auth, no navigation graph. Almost every pixel is either input (CodeMirror editor, terminal) or output (markdown/mermaid/syntax-highlighted render). So this spec skips the usual "screens/flows/personas" structure and instead defines: surfaces, behaviors, and rendering contracts — since correctness of rendering *is* the product.

## Design principle: narrow but deep
CodeNote intentionally has very little surface area — no settings, no plugins, no multi-window, no command palette. But the few things it does do (markdown rendering, code highlighting, diagrams) are meant to be full-featured rather than a minimal subset. Concretely: the app bundles all of PrismJS's languages and a curated plugin set (not a hand-picked handful of languages), and Mermaid is configured permissively rather than locked to a small diagram subset. Don't read "few features" as license to also under-build the features that exist.

## Surfaces
- **Icon rail** (60px, left): new/open/save, terminal toggle.
- **Tab strip**: multi-tab editing, dirty-dot indicator, close/add.
- **Header**: active file title + path, save-state chip.
- **Editor pane**: CodeMirror 6, language auto-detected from extension.
- **Preview pane**: rendered markdown (remark/rehype pipeline + Prism + Mermaid).
- **Terminal drawer**: xterm.js, toggled via Ctrl+`, docked bottom (320px).

## Editor
- CodeMirror 6 with language packages for JS/TS/JSX/TSX, Python, CSS, HTML, JSON, YAML, Markdown.
- Surface styled as archival paper: off-white background (`#FAF9F5`, deliberately neutral rather than cream), faint 36px graph-paper grid, warm ink text color — distinct from the app's dark blue-slate chrome.

## Markdown preview — rendering contract
Pipeline: `remark-parse` → `remark-gfm` → `remark-rehype` (raw HTML allowed) → `rehype-raw` → `rehype-stringify`.

Must visibly apply:
- Headings h1–h6: distinct size, weight, and spacing per level (h1/h2 get a rule underneath).
- Paragraphs: spaced apart, not run together.
- Lists (ordered/unordered, nested): indented with visible bullets/numbers.
- Bold/italic: visually distinct from body text.
- Tables (GFM): bordered, collapsed borders.
- Blockquotes, hr, footnotes, task-list checkboxes: styled distinctly from plain text.
- Relative image paths: resolved against the open file's directory and converted via Tauri's `convertFileSrc`.
- External links: intercepted and opened via the OS default browser, not in-app navigation.

### Code highlighting (rich, by design)
Fenced code blocks are highlighted with the full vendored PrismJS 1.30.0 bundle (`src/vendor/prism.js` + `prism.css`) — every language Prism ships, Okaidia theme, and a curated plugin set: `toolbar` (host for the two below), `copy-to-clipboard`, `show-language`, `line-numbers`, `match-braces`, `inline-color`, `keep-markup`, `remove-initial-line-feed`, `treeview`. This replaced an earlier hand-picked ~20-language import list. Each highlighted `<pre>` gets the shared `atl-code` contract class plus `line-numbers`/`match-braces`; the rest of the plugins self-activate via Prism's hook system. Okaidia's token colors are used as-is; only the block background/border are retinted to the app's `atl-void`/`atl-navy` palette so it doesn't look like a foreign gray card dropped into the page.

### Diagrams (rich, by design)
` ```mermaid ` blocks render via Mermaid, configured permissively rather than restricted to a diagram subset: `securityLevel: "loose"` (click handlers/tooltips/hrefs from diagram source work), `htmlLabels` on for flowcharts, and raised `maxTextSize`/`maxEdges` so large diagrams don't silently refuse to render. Theme variables are hand-matched to the blue-slate palette rather than a Mermaid built-in theme. `useMaxWidth` is set explicitly per diagram type (flowchart, sequence, gantt, er, pie, mindmap, timeline, class, state, journey, quadrantChart, xyChart, requirement, sankey, block, packet, architecture) so none of them fall back to a cramped default. Two official Mermaid extensions are registered on top of core: `@mermaid-js/mermaid-zenuml` (zenUML sequence-diagram syntax, invoked via the `zenuml` keyword inside a normal ` ```mermaid ` fence) and `@mermaid-js/layout-elk` (adds `elk`/`elk.layered`/`elk.stress`/`elk.force`/`elk.mrtree`/`elk.sporeOverlap` as selectable layout engines via diagram frontmatter; `dagre` remains the default layout).

## Terminal
xterm.js-backed native PTY session (via `ptyApi`/Tauri backend). Opens/closes independent of file state.

## File I/O
Tauri dialog + fs plugins: open-file dialog, save (in place if path known, otherwise save-as dialog). No cloud sync, no auto-save beyond explicit Ctrl+S.

## Session persistence
On quit, the full set of open tabs (path, content — including unsaved/dirty content and untitled buffers, not just saved files — and dirty flag) plus the active tab and terminal-drawer open/closed state are written to `session.json` in the OS app-config directory (`src/lib/session.ts`). On next launch this is restored before anything else renders, so closing and reopening the app reproduces the same tabs/state rather than resetting to a blank Welcome tab — the same behavior Notepad/Notepad++ have. Writes are debounced (400ms after the last change) and also flushed synchronously on the window's close-requested event so the debounce window can't drop last-second edits. This is a single JSON snapshot, not undo history or versioned backups.

## Keyboard shortcuts
| Shortcut | Action |
|---|---|
| Ctrl/Cmd+S | Save |
| Ctrl/Cmd+` | Toggle terminal |
| Ctrl/Cmd+N | New tab |
| Ctrl/Cmd+O | Open file |
| Ctrl/Cmd+W | Close tab (confirms if dirty) |
| Ctrl/Cmd+Tab / Shift+Tab | Cycle tabs |

## Theming and the blue-slate starter-pack contract
CodeNote is fully aligned to the `blue.slate/starter-packs` seed profile:
- Theme lives at `src/styles/blue-slate.css` (imported directly from `main.tsx`), carrying the shared `atl-*` design tokens plus the shared component styles. `src/styles/theme.css` is kept only as a one-line `@import` redirect for backward compatibility (see below on file deletion).
- Shared components live under `src/components/blue-slate/`: `AppShell`, `Tabs`, `StatusChip`, `CodePanel`, `CommandBuilder`, `EvidenceGrid`.
- Class contract followed: `atl-tabs`/`atl-tab`/`atl-tab-active` for tabs, `atl-code` for code panels, `atl-status-chip` + the six variants (`active`/`warning`/`taxonomy`/`archive`/`verified`/`neutral`) for status chips, `atl-form-field`/`atl-input`/`atl-checkbox-row`/`atl-command-output` for command builders.
- `CommandBuilder` and `EvidenceGrid` aren't wired into any current CodeNote screen — there's no command-form or file-evidence UI yet — but they exist as ready-to-use components so the contract's full surface is available the moment a use case shows up, rather than being bolted on ad hoc later.

Note: this session's tools can only edit/create files, not rename or delete them. `src/components/layout/TabBar.tsx` and `src/styles/theme.css` are now thin re-export/redirect shims pointing at the real implementations; both are safe to delete by hand.

## Explicitly out of scope
Multi-window, plugin/extension system, cloud sync, collaborative editing, settings UI, command palette. (Session/tab-state persistence — see above — is in scope; it's a fixed automatic behavior, not user-configurable preferences.)

## Known-good
Multi-tab lifecycle (create/close/cycle/dirty tracking), Tauri file open/save, terminal PTY session.

## Verification done this pass
`tsc --noEmit` passes clean. `vite build` couldn't be exercised in this sandbox (pre-existing `@rollup/rollup-linux-x64-gnu` native-binary mismatch in `node_modules`, unrelated to these changes — likely `node_modules` was synced from a different OS). Recommend running `npm run build` locally to confirm the production bundle once you're back on your own machine.
