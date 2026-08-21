import { StatusChip, type StatusVariant } from "./StatusChip";

interface EvidenceItem {
  id: string;
  title: string;
  meta?: string;
  status?: StatusVariant;
}

interface EvidenceGridProps {
  items?: EvidenceItem[];
}

const NO_ITEMS: EvidenceItem[] = [];

/**
 * Blue-slate starter-pack EvidenceGrid: compact file/proof cards. Not
 * currently wired into CodeNote (there's no file-browser or evidence view
 * yet) — available for future use, e.g. a recent-files or search-results grid.
 */
export function EvidenceGrid({ items = NO_ITEMS }: EvidenceGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="atl-evidence-grid">
      {items.map((item) => (
        <div key={item.id} className="atl-evidence-card">
          <div className="atl-evidence-card-title">{item.title}</div>
          {item.meta && <div className="atl-evidence-card-meta">{item.meta}</div>}
          {item.status && <StatusChip variant={item.status}>{item.status}</StatusChip>}
        </div>
      ))}
    </div>
  );
}
