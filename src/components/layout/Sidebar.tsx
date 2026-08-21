import logo from "../../assets/aptlantis-studio-simplified-logo.svg";

interface SidebarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
}

function RailIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  new: "M12 5v14M5 12h14",
  open: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  save: "M5 3h11l3 3v15H5V3ZM7 3v6h9V3M7 13h9v8H7v-8Z",
  terminal: "M4 5h16v14H4V5ZM7 9l3 3-3 3M12 15h5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1.04-1.56V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.56 1.04H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.04Z",
};

export function Sidebar({ onNew, onOpen, onSave, terminalOpen, onToggleTerminal }: SidebarProps) {
  return (
    <div className="cn-rail">
      <img src={logo} alt="CodeNote" className="cn-rail-logo" />
      <button className="cn-rail-btn" title="New file (Ctrl+N)" onClick={onNew}>
        <RailIcon path={ICONS.new} />
      </button>
      <button className="cn-rail-btn" title="Open file (Ctrl+O)" onClick={onOpen}>
        <RailIcon path={ICONS.open} />
      </button>
      <button className="cn-rail-btn" title="Save (Ctrl+S)" onClick={onSave}>
        <RailIcon path={ICONS.save} />
      </button>
      <div className="cn-rail-spacer" />
      <button
        className={`cn-rail-btn${terminalOpen ? " is-active" : ""}`}
        title="Toggle terminal (Ctrl+`)"
        onClick={onToggleTerminal}
      >
        <RailIcon path={ICONS.terminal} />
      </button>
      <button className="cn-rail-btn" title="Settings">
        <RailIcon path={ICONS.settings} />
      </button>
    </div>
  );
}
