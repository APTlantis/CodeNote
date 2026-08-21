import type { ReactNode } from "react";

interface AppShellProps {
  /** Icon rail / navigation, rendered outside the main scroll column. */
  rail: ReactNode;
  children: ReactNode;
}

/**
 * Blue-slate starter-pack AppShell: the outer app frame. Wraps CodeNote's
 * existing `.cn-app` layout (defined in styles/app.css) with `.atl-shell`,
 * the shared faint-graph-paper page background used across blue-slate apps.
 */
export function AppShell({ rail, children }: AppShellProps) {
  return (
    <div className="cn-app atl-shell">
      {rail}
      <div className="cn-main">{children}</div>
    </div>
  );
}
