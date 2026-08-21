import type { Tab } from "../../lib/tabs";
import { tabTitle } from "../../lib/tabs";

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

/**
 * Blue-slate starter-pack Tabs component. Class contract:
 * atl-tabs (strip) / atl-tab (item) / atl-tab-active (active modifier).
 * Formerly components/layout/TabBar.tsx with cn-tab* classes.
 */
export function Tabs({ tabs, activeId, onSelect, onClose, onNew }: TabsProps) {
  return (
    <div className="atl-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`atl-tab${tab.id === activeId ? " atl-tab-active" : ""}`}
          title={tab.path ?? tab.untitledName}
          onClick={() => onSelect(tab.id)}
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              onClose(tab.id);
            }
          }}
        >
          {tab.dirty && <span className="atl-tab-dot" />}
          <span className="atl-tab-label">{tabTitle(tab)}</span>
          <button
            className="atl-tab-close"
            title="Close tab (Ctrl+W)"
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <button className="atl-tab-add" title="New tab (Ctrl+N)" onClick={onNew}>
        +
      </button>
    </div>
  );
}
