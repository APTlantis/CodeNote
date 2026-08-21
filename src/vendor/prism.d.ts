// Ambient type for the vendored full PrismJS bundle (src/vendor/prism.js).
// That file is the plain prismjs.com/download output — a self-registering
// script with no ES module exports — so it attaches itself to the global
// `window.Prism` instead of being importable as a value. This file just
// tells TypeScript that global exists and gives it a loose, workable shape.

interface PrismStatic {
  highlightElement: (element: Element, async?: boolean, callback?: () => void) => void;
  highlightAll: (async?: boolean, callback?: () => void) => void;
  highlight: (text: string, grammar: unknown, language: string) => string;
  languages: Record<string, unknown>;
  plugins: Record<string, unknown>;
  hooks: {
    add: (name: string, callback: (env: Record<string, unknown>) => void) => void;
  };
  manual?: boolean;
}

declare global {
  interface Window {
    Prism: PrismStatic;
  }
}

export {};
