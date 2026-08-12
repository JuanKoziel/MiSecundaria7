import { useState, useEffect } from 'react';
import { getMateriasAdeudadas, getActividadesMateriasAdeudadas } from '../../services/api';

function PanelPreviasAlumno({ miAlumno }) {
  const [deudas, setDeudas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!miAlumno) return;
    Promise.all([
      getMateriasAdeudadas({ alumno: miAlumno.id }),
      getActividadesMateriasAdeudadas()
    ]).then(([deudasRes, actsRes]) => {
      setDeudas(Array.isArray(deudasRes) ? deudasRes : []);
      setActividades(Array.isArray(actsRes) ? actsRes : []);
    }).catch(() => {
      setDeudas([]);
      setActividades([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [miAlumno]);

  if (loading) {
    return <div className="card"><p>Cargando materias previas...</p></div>;
  }

  const deudasActivas = deudas.filter((d) => d.estado === 'ADEUDADA');

  return (
    <div className="card">
      <h2>Materias Adeudadas y Previas</h2>
      <p className="text-muted">Listado de materias pendientes e intensificaciones asignadas.</p>

      {deudasActivas.length === 0 ? (
        <p className="empty-state-message">No tenés materias adeudadas actualmente. ¡Felicitaciones!</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
          {deudasActivas.map((d) => {
            const actsMateria = actividades.filter((a) => a.id_curso_materia && a.materia_nombre === d.materia_nombre);
            return (
              <div key={d.id_materia_adeudada} className="card" style={{ background: '#f8f9fa', borderLeft: '4px solid var(--primary-color)' }}>
                <h3>{d.materia_nombre || `Materia #${d.id_materia}`} — {d.curso_origen_nombre || '2° año'}</h3>
                <p><strong>Curso de origen:</strong> {d.curso_origen_nombre || '—'}</p>
                <p><strong>Estado:</strong> <span className="badge badge-warning">{d.estado}</span></p>

                <h4 style={{ marginTop: '12px' }}>Actividades de Intensificación / Apoyo</h4>
                {actsMateria.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>No hay actividades de intensificación publicadas para esta materia.</p>
                ) : (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
                    {actsMateria.map((act) => (
                      <li key={act.id_actividad} style={{ marginBottom: '8px' }}>
                        <strong>Intensificación: {act.periodo_intensificacion || 'Primer cuatrimestre'}</strong><br/>
                        <em>{act.titulo}</em>: {act.descripcion}
                        {act.archivo_pdf && (
                          <div style={{ marginTop: '4px' }}>
                            <a href={act.archivo_pdf} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                              <i className="fas fa-file-pdf" /> Descargar PDF
                            </a>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PanelPreviasAlumno;
