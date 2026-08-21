import type { ReactNode } from "react";

export type StatusVariant = "active" | "warning" | "taxonomy" | "archive" | "verified" | "neutral";

interface StatusChipProps {
  variant?: StatusVariant;
  dot?: boolean;
  children: ReactNode;
}

/**
 * Blue-slate starter-pack StatusChip. Supports the six variants named in the
 * starter-pack contract: active, warning, taxonomy, archive, verified, neutral.
 */
export function StatusChip({ variant = "neutral", dot = true, children }: StatusChipProps) {
  return (
    <span className={`atl-status-chip atl-status-chip-${variant}`}>
      {dot && <span className="atl-status-chip-dot" />}
      {children}
    </span>
  );
}
