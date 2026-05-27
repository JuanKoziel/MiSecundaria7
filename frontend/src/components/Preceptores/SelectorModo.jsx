const MODOS = [
  { id: 'vista', label: 'Vista general', icon: 'fa-list', desc: 'Consultar listado actual' },
  { id: 'crear', label: 'Crear', icon: 'fa-plus', desc: 'Agregar un nuevo registro' },
  { id: 'modificar', label: 'Modificar', icon: 'fa-edit', desc: 'Editar datos existentes' },
  { id: 'borrar', label: 'Borrar', icon: 'fa-trash', desc: 'Eliminar un registro' },
];

function SelectorModo({ modo, onModoChange, titulo }) {
  if (modo) {
    const activo = MODOS.find((m) => m.id === modo);
    return (
      <div className="preceptor-modo-bar">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onModoChange('')}
        >
          <i className="fas fa-arrow-left" aria-hidden="true" /> Cambiar acción
        </button>
        <span className="preceptor-modo-activo">
          <i className={`fas ${activo?.icon}`} aria-hidden="true" /> {activo?.label}
        </span>
      </div>
    );
  }

  return (
    <div className="preceptor-modo-selector">
      <h4 className="preceptor-section-title">{titulo}</h4>
      <p className="preceptor-modo-hint">Seleccioná qué acción querés realizar:</p>
      <div className="preceptor-modo-grid">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="preceptor-modo-card"
            onClick={() => onModoChange(m.id)}
          >
            <i className={`fas ${m.icon}`} aria-hidden="true" />
            <strong>{m.label}</strong>
            <span>{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SelectorModo;
