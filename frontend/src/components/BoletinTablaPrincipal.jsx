import React from 'react';

function califFinal(m) {
  const n1 = parseFloat(m.nota1);
  const n2 = parseFloat(m.nota2);
  const nums = [n1, n2].filter((n) => !Number.isNaN(n));
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '—';
}

function celdaPrenota(p) {
  if (!p || p === 'Sin calificaciones') return '—';
  return <span className="badge badge-cualitativa">{p}</span>;
}

function celdaNota(n) {
  if (n === '' || n === null || n === undefined) return '—';
  return n;
}

// Tabla principal del boletín (Hoja 1). Estructura oficial 2025:
// Materia | 1.º Cuatrimestre (1.ª Val. Preliminar, Calificación)
//         | 2.º Cuatrimestre (2.ª Val. Preliminar, Calificación, Intensificación 1.º C)
//         | Intensificaciones (Diciembre, Febrero)
//         | Calificación final | Observaciones
// "Intensificación 1.º C" es subcolumna directa de "2.º Cuatrimestre".
export default function BoletinTablaPrincipal({
  materias = [],
  intensificaciones_1c = {},
  bloqueos_por_materia = {},
}) {
  return (
    <div className="table-responsive">
      <table className="boletin-table boletin-tabla-principal">
        <thead>
          <tr>
            <th rowSpan={2}>Materia</th>
            <th colSpan={2}>1.º Cuatrimestre</th>
            <th colSpan={3}>2.º Cuatrimestre</th>
            <th colSpan={2}>Intensificaciones</th>
            <th rowSpan={2}>Calificación final</th>
            <th rowSpan={2}>Observaciones</th>
          </tr>
          <tr>
            <th>1.ª Valoración Preliminar</th>
            <th>Calificación</th>
            <th>2.ª Valoración Preliminar</th>
            <th>Calificación</th>
            <th>Intensificación 1.º C</th>
            <th>Diciembre</th>
            <th>Febrero</th>
          </tr>
        </thead>
        <tbody>
          {materias.length === 0 ? (
            <tr>
              <td colSpan={10} className="empty-state-message">
                Sin calificaciones cargadas.
              </td>
            </tr>
          ) : (
            materias.map((m, idx) => {
              const bloqueada = bloqueos_por_materia[m.materia];
              const intensif = intensificaciones_1c[m.materia];
              const tieneIntensif = intensif !== undefined && intensif !== null;
              return (
                <tr key={idx} className={bloqueada ? 'boletin-fila-bloqueada' : ''}>
                  <td className="table-cell-strong">
                    {m.materia}
                    {bloqueada && (
                      <span className="badge badge-danger boletin-badge-bloqueo">Bloqueada</span>
                    )}
                  </td>
                  <td>{celdaPrenota(m.prenota1)}</td>
                  <td>{celdaNota(m.nota1)}</td>
                  <td>{celdaPrenota(m.prenota2)}</td>
                  <td>{celdaNota(m.nota2)}</td>
                  <td>{tieneIntensif ? intensif : ''}</td>
                  <td></td>
                  <td></td>
                  <td>{califFinal(m)}</td>
                  <td>{m.diagnostico || '—'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
