import { useMemo } from 'react';

function PersonaSelector({ 
  personas, 
  value, 
  onChange, 
  label = 'Seleccionar persona',
  placeholder = 'Seleccione una persona...',
  required = false,
  disabled = false 
}) {
  const opciones = useMemo(() => 
    (personas || []).map((p) => ({
      id: p.id_usuario || p.id,
      label: `${p.apellido}, ${p.nombre} (${p.tipo || p.rol || 'Usuario'}) - DNI: ${p.dni || '—'}`,
      datos: p,
    })), [personas]
  );

  return (
    <div className="form-group-filter">
      <label htmlFor="persona-existente">{label}</label>
      <select
        id="persona-existente"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {opciones.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
      {value && (
        <p className="m-0 mt-8" style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Se usará el usuario existente. Los datos personales se completarán automáticamente.
        </p>
      )}
    </div>
  );
}

export default PersonaSelector;