import { useEffect, useRef, useState } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import mermaid from "mermaid";
import zenuml from "@mermaid-js/mermaid-zenuml";
import elkLayouts from "@mermaid-js/layout-elk";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
// Full PrismJS 1.30.0 bundle (all languages + Okaidia theme + a curated plugin
// set), generated from prismjs.com/download and vendored wholesale rather than
// the previous hand-picked language list — code highlighting is one of the
// few things this app does a lot of, so it gets the rich/full-suite treatment.
// The bundle is a self-registering script (no ESM exports), so it attaches to
// `window.Prism`; see src/vendor/prism.d.ts for the ambient type.
import "../../vendor/prism.js";
import "../../vendor/prism.css";

const Prism = window.Prism;

// ELK layout engine (adds elk.layered/elk.stress/elk.force/elk.mrtree/
// elk.sporeOverlap as selectable `layout:` values via diagram frontmatter),
// registered synchronously before initialize so diagrams that opt into it
// can find it immediately.
mermaid.registerLayoutLoaders(elkLayouts);

// zenUML sequence diagrams (```mermaid-zenuml blocks) are an external
// diagram type and must be registered before any zenuml block is rendered.
// registerExternalDiagrams is async; the mermaid-render effect below awaits
// this once before the first render pass.
const zenumlReady = mermaid.registerExternalDiagrams([zenuml]);

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#050913",
    primaryColor: "#172536",
    primaryTextColor: "#E1E7DB",
    primaryBorderColor: "#36485A",
    lineColor: "#768892",
    secondaryColor: "#0B1728",
    tertiaryColor: "#192E46",
  },
  fontFamily: "Cascadia Code, JetBrains Mono, Consolas, monospace",
  // Rich/full-featured Mermaid, matching the "go deep on the parts we do want"
  // brief: permissive security level (click handlers, tooltips, hrefs from
  // diagram source), HTML labels for nicer node text wrapping, and generous
  // limits so large diagrams don't silently refuse to render. `layout:
  // "dagre"` stays the default; diagram-source frontmatter can still opt
  // individual diagrams into `elk`/`elk.layered`/etc. now that the ELK
  // loader above is registered, and zenUML/sankey/xyChart/block/packet/
  // architecture/quadrant diagram types get explicit useMaxWidth config so
  // none of them silently fall back to a cramped default.
  securityLevel: "loose",
  maxTextSize: 200_000,
  maxEdges: 2000,
  layout: "dagre",
  flowchart: { htmlLabels: true, useMaxWidth: true },
  sequence: { useMaxWidth: true, wrap: true },
  gantt: { useMaxWidth: true },
  er: { useMaxWidth: true },
  pie: { useMaxWidth: true },
  mindmap: { useMaxWidth: true },
  timeline: { useMaxWidth: true },
  class: { useMaxWidth: true },
  state: { useMaxWidth: true },
  journey: { useMaxWidth: true },
  quadrantChart: { useMaxWidth: true },
  xyChart: { useMaxWidth: true },
  requirement: { useMaxWidth: true },
  sankey: { useMaxWidth: true, showValues: true },
  block: { useMaxWidth: true },
  packet: { useMaxWidth: true },
  architecture: { useMaxWidth: true },
});

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify, { allowDangerousHtml: true });

interface MarkdownPreviewProps {
  source: string;
  /** Directory of the file currently open, used to resolve relative image paths. */
  basePath?: string | null;
}

let mermaidRenderCounter = 0;

function isAbsoluteOrRemote(src: string): boolean {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) || /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("/");
}

function resolveRelativePath(basePath: string, relative: string): string {
  const sep = basePath.includes("\\") ? "\\" : "/";
  const baseParts = basePath.split(/[\\/]/).filter(Boolean);
  const relParts = relative.split(/[\\/]/).filter((part) => part !== "");
  const stack = [...baseParts];
  for (const part of relParts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  const isWindows = /^[a-zA-Z]:$/.test(stack[0] ?? "");
  return isWindows ? stack.join(sep) : sep + stack.join(sep);
}

const EXTERNAL_LINK_RE = /^(https?|mailto|tel):/i;

export function MarkdownPreview({ source, basePath }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      const href = link?.getAttribute("href");
      if (!href || !EXTERNAL_LINK_RE.test(href)) return;
      e.preventDefault();
      void openUrl(href);
    }

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Debounced on purpose: reprocessing on every keystroke means the
    // container's innerHTML gets replaced with raw, un-rendered
    // <pre><code class="language-mermaid"> markup on every keystroke too —
    // wiping out whatever SVG/Prism output was already showing — and kicks
    // off a fresh async mermaid.render() that the *next* keystroke then
    // cancels before it can finish. During continuous typing that means no
    // render ever completes, so the preview looks "stuck" on plain,
    // unstyled source text until typing pauses long enough for one attempt
    // to run uninterrupted. Waiting a beat after the last keystroke before
    // reprocessing avoids that churn — the previously-rendered diagram/code
    // block stays on screen untouched while typing continues, and only
    // swaps once there's actually a settled result to show.
    const timeout = setTimeout(() => {
      processor.process(source).then((file) => {
        if (!cancelled) setHtml(String(file));
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [source]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !basePath) return;

    container.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src || isAbsoluteOrRemote(src)) return;
      img.setAttribute("src", convertFileSrc(resolveRelativePath(basePath, decodeURIComponent(src))));
    });
  }, [html, basePath]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const codeBlocks = Array.from(container.querySelectorAll("pre > code"));

    codeBlocks.forEach((block) => {
      const isMermaid = block.classList.contains("language-mermaid");
      const pre = block.parentElement;
      // Give every block the shared "atl-code" box treatment up front,
      // including mermaid blocks — that way, if the mermaid render below
      // fails (or is superseded by a newer render before it resolves), the
      // fallback still reads as "code that errored" rather than bare
      // unstyled paragraph text. line-numbers/match-braces are opt-in Prism
      // plugins that require Prism.highlightElement to actually populate
      // their gutter/markup, so those are only added for blocks we're about
      // to run through Prism — adding them to a block Prism never touches
      // (mermaid) would reserve a gutter that's permanently empty.
      pre?.classList.add("atl-code");
      if (isMermaid) return;
      pre?.classList.add("line-numbers", "match-braces");
      Prism.highlightElement(block);
    });

    const mermaidBlocks = codeBlocks.filter((block) => block.classList.contains("language-mermaid"));
    mermaidBlocks.forEach(async (block) => {
      const pre = block.parentElement;
      if (!pre) return;
      const code = block.textContent ?? "";
      const id = `cn-mermaid-${mermaidRenderCounter++}`;
      try {
        // zenUML diagrams (source starting with the `zenuml` keyword inside
        // an otherwise-ordinary ```mermaid fence) are registered as an
        // external diagram type; the registration promise must settle
        // before the first render call or mermaid throws an "unknown
        // diagram type" error.
        await zenumlReady;
        const { svg } = await mermaid.render(id, code);
        // The render is async and `html` (and therefore this whole effect)
        // can re-run before it resolves — e.g. fast typing, a tab switch, or
        // a save-triggered remount. Without this guard a stale render can
        // land after the container has already moved on to newer content
        // and either silently no-op against a detached node or, worse,
        // clobber a newer render that already finished. Bail out instead of
        // touching the DOM once superseded.
        if (cancelled || !pre.isConnected) return;
        const wrapper = document.createElement("div");
        wrapper.className = "cn-mermaid";
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      } catch (err) {
        if (cancelled || !pre.isConnected) return;
        pre.classList.add("cn-mermaid-error");
        pre.textContent = `Mermaid render error: ${(err as Error).message}`;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [html]);

  return <div ref={containerRef} className="cn-preview-pane" dangerouslySetInnerHTML={{ __html: html }} />;
}
