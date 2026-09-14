import { useRef } from 'react';

function FilePicker({
  id,
  label,
  hint,
  accept,
  multiple = false,
  value = [],
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const files = Array.isArray(value) ? value : [];

  const handleChange = (e) => {
    const nuevos = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...files, ...nuevos]);
    } else {
      onChange(nuevos.slice(0, 1));
    }
    e.target.value = '';
  };

  const quitar = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group-filter">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
      />
      {files.length > 0 && (
        <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              className="flex-row--between"
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 10px',
                background: 'var(--card-bg)',
              }}
            >
              <span style={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>
                <i className="fas fa-file" aria-hidden="true" /> {file.name}
              </span>
              <button
                type="button"
                className="btn-link-danger"
                onClick={() => quitar(index)}
                disabled={disabled}
              >
                <i className="fas fa-times" aria-hidden="true" /> Quitar
              </button>
            </div>
          ))}
        </div>
      )}
      {hint && <small className="upload-hint">{hint}</small>}
    </div>
  );
}

export default FilePicker;