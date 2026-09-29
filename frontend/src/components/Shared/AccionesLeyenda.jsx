const ACCIONES = [
  { id: 'editar', emoji: '✏️', label: 'Editar' },
  { id: 'deshabilitar', emoji: '🚫', label: 'Deshabilitar' },
  { id: 'programar', emoji: '🗓️', label: 'Programar' },
  { id: 'eliminar', emoji: '🗑️', label: 'Eliminar' },
  { id: 'habilitar', emoji: '✅', label: 'Habilitar' },
  { id: 'finalizar', emoji: '🏁', label: 'Finalizar' },
  { id: 'ver', emoji: '👁️', label: 'Ver' },
  { id: 'descargar', emoji: '⬇️', label: 'Descargar' },
  { id: 'verificar', emoji: '🔎', label: 'Verificar' },
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
