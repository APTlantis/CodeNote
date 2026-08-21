import { StatusChip } from "../blue-slate/StatusChip";

interface HeaderProps {
  title: string;
  path: string | null;
  dirty: boolean;
}

export function Header({ title, path, dirty }: HeaderProps) {
  return (
    <div className="cn-header">
      <div>
        <div className="cn-header-title">
          {title}
          {dirty && <span className="cn-dirty-dot" style={{ display: "inline-block", marginLeft: "0.4rem" }} />}
        </div>
        {path && <div className="cn-header-path">{path}</div>}
      </div>
      <div className="cn-header-spacer" />
      <StatusChip variant={dirty ? "warning" : "active"}>{dirty ? "Unsaved changes" : "Saved"}</StatusChip>
    </div>
  );
}
