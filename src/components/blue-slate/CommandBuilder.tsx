import { useState } from "react";

interface CommandBuilderField {
  id: string;
  label: string;
  placeholder?: string;
}

interface CommandBuilderProps {
  fields?: CommandBuilderField[];
  buildCommand?: (values: Record<string, string>) => string;
  onRun?: (command: string) => void;
}

const DEFAULT_FIELDS: CommandBuilderField[] = [{ id: "input", label: "Input" }];

/**
 * Blue-slate starter-pack CommandBuilder. Class contract: atl-form-field,
 * atl-input, atl-checkbox-row, atl-command-output. CodeNote has no command
 * builder UI today (it's a straight file-editor+terminal, not a form-driven
 * command tool) — this exists so the contract's component surface is
 * available if that changes, without required props to wire up.
 */
export function CommandBuilder({ fields = DEFAULT_FIELDS, buildCommand, onRun }: CommandBuilderProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const command = buildCommand ? buildCommand(values) : Object.values(values).filter(Boolean).join(" ");

  return (
    <div className="atl-command-builder">
      {fields.map((field) => (
        <label key={field.id} className="atl-form-field">
          <span>{field.label}</span>
          <input
            className="atl-input"
            placeholder={field.placeholder}
            value={values[field.id] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
          />
        </label>
      ))}
      <label className="atl-checkbox-row">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>Confirm before running</span>
      </label>
      <pre className="atl-command-output">{command || " "}</pre>
      <button className="atl-button" disabled={!confirmed} onClick={() => onRun?.(command)}>
        Run
      </button>
    </div>
  );
}
