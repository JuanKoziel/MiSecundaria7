const ACCIONES = [
  { id: 'editar', emoji: '✏️', label: 'Editar' },
  { id: 'programar', emoji: '🗓️', label: 'Programar' },
  { id: 'habilitar', emoji: '✅', label: 'Habilitar' },
  { id: 'deshabilitar', emoji: '🚫', label: 'Deshabilitar' },
  { id: 'eliminar', emoji: '🗑️', label: 'Eliminar' },
];

function AccionesLeyenda({ acciones = [] }) {
  const items = ACCIONES.filter((a) => acciones.includes(a.id));
  if (items.length === 0) return null;

  return (
    <div className="acciones-leyenda" aria-label="Leyenda de acciones">
      {items.map((item) => (
        <span key={item.id} className="acciones-leyenda-item">
          <span className="acciones-leyenda-emoji" aria-hidden="true">{item.emoji}</span> {item.label}
        </span>
      ))}
    </div>
  );
}

export default AccionesLeyenda;