import { useId } from 'react';

export default function ToggleSwitch({
  id,
  label = 'Habilitado',
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}) {
  const generatedId = useId();
  const toggleId = id || generatedId;
  const labelId = `${toggleId}-label`;
  const statusId = `${toggleId}-status`;

  return (
    <div className="toggle-switch-row">
      <label id={labelId} className="toggle-switch-label" htmlFor={toggleId}>
        {label}
      </label>
      <div className="toggle-switch-wrapper">
        <input
          type="checkbox"
          id={toggleId}
          role="switch"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={statusId}
          className="toggle-switch-input"
        />
        <span
          id={statusId}
          className="toggle-switch-status"
          aria-live="polite"
          aria-atomic="true"
        >
          {checked ? 'Habilitado' : 'Deshabilitado'}
        </span>
        <span className="toggle-switch-track" aria-hidden="true">
          <span className="toggle-switch-thumb" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}