import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getActividades } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';

const API_BASE = 'http://localhost:8000';
const PREVIEWABLE = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'];

function getExtension(nombre = '') {
  const limpio = String(nombre).split('?')[0].split('#')[0];
  const parts = limpio.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function isPreviewable(nombre = '') {
  return PREVIEWABLE.includes(getExtension(nombre));
}

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function formatFecha(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(date);
}

function formatHora(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' }).format(date);
}

function ActividadesView({ userRole, selectedChild }) {
  const { alumnos, cursosObj, cursoMateria } = useData();
  const { user } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [previewArchivo, setPreviewArchivo] = useState(null);

  const cursoId = useMemo(() => {
    if (userRole === 'alumno') {
      const miAlumno = alumnos.find((a) => a.id_usuario === user?.id);
      return miAlumno?.id_curso;
    }
    if (userRole === 'familia' && selectedChild) {
      const alumno = alumnos.find((a) => a.id === selectedChild.alumnoId);
      return alumno?.id_curso;
    }
    return null;
  }, [userRole, selectedChild, alumnos, user]);

  const cursoNombre = useMemo(() => {
    if (!cursoId) return '';
    const curso = cursosObj.find((c) => Number(c.id_curso) === Number(cursoId));
    return curso?.nombre_curso || '';
  }, [cursoId, cursosObj]);

  const materiasDelCurso = useMemo(() => {
    if (!cursoId) return [];
    const nombres = cursoMateria
      .filter((cm) => Number(cm.id_curso) === Number(cursoId))
      .map((cm) => cm.materia_nombre)
      .filter(Boolean);
    return [...new Set(nombres)].sort();
  }, [cursoId, cursoMateria]);

  useEffect(() => {
    if (!cursoId) {
      setActividades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelectedActividad(null);
    setPreviewArchivo(null);
    getActividades({ curso: cursoId })
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        setActividades(lista);
      })
      .catch(() => setActividades([]))
      .finally(() => setLoading(false));
  }, [cursoId]);

  useEffect(() => {
    if (materiasDelCurso.length > 0) {
      if (!selectedMateria || !materiasDelCurso.includes(selectedMateria)) {
        setSelectedMateria(materiasDelCurso[0]);
      }
    } else {
      setSelectedMateria('');
    }
  }, [materiasDelCurso]);

  const actividadesPorMateria = useMemo(() => {
    const grupos = {};
    actividades.forEach((act) => {
      const materia = act.materia_nombre || 'Sin materia';
      if (!grupos[materia]) grupos[materia] = [];
      grupos[materia].push(act);
    });
    Object.keys(grupos).forEach((m) => {
      grupos[m].sort((a, b) => {
        const fa = a.fecha_creacion || '';
        const fb = b.fecha_creacion || '';
        return fb.localeCompare(fa);
      });
    });
    return grupos;
  }, [actividades]);

  if (selectedActividad) {
    const actividad = selectedActividad;
    const archivos = Array.isArray(actividad.archivos) ? actividad.archivos : [];

    return (
      <div className="card">
        <div className="card-header-flex">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setSelectedActividad(null); setPreviewArchivo(null); }}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
          </button>
          <h3>Detalle de la Actividad</h3>
        </div>

        <div className="mt-16">
          <h2>{actividad.titulo}</h2>

          <div className="mt-12 text-muted" style={{ fontSize: '14px' }}>
            <p><strong>Materia:</strong> {actividad.materia_nombre || '—'}</p>
            <p><strong>Curso:</strong> {actividad.curso_nombre || '—'}</p>
            <p><strong>Docente:</strong> {actividad.docente_apellido ? `${actividad.docente_apellido}, ${actividad.docente_nombre}` : '—'}</p>
            <p><strong>Fecha:</strong> {formatFecha(actividad.fecha_creacion)}</p>
            <p><strong>Hora:</strong> {formatHora(actividad.fecha_creacion)}</p>
          </div>

          {actividad.descripcion && (
            <div className="mt-20" style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}><strong>Descripción:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '8px' }}>{actividad.descripcion}</p>
            </div>
          )}

          {archivos.length > 0 && (
            <div className="mt-20">
              <h4>Archivos adjuntos ({archivos.length})</h4>
              <div className="mt-12" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {archivos.map((archivo) => (
                  <div key={archivo.id_archivo || archivo.nombre_archivo}>
                    <div className="flex-row--between" style={{ padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
                      <span style={{ fontSize: '14px' }}>
                        <i className="fas fa-paperclip" aria-hidden="true" />{' '}
                        {archivo.nombre_archivo || 'Archivo'}
                      </span>
                      <div className="flex-row">
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => setPreviewArchivo(
                            previewArchivo === archivo ? null : archivo,
                          )}
                        >
                          <i className="fas fa-eye" aria-hidden="true" />{' '}
                          {previewArchivo === archivo ? 'Ocultar' : 'Ver'}
                        </button>
                        {archivo.archivo_url && (
                          <a
                            href={resolveUrl(archivo.archivo_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                          >
                            <i className="fas fa-download" aria-hidden="true" /> Descargar
                          </a>
                        )}
                      </div>
                    </div>
                    {previewArchivo === archivo && archivo.archivo_url && (
                      <div style={{ marginTop: '8px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                        {isPreviewable(archivo.nombre_archivo || '') ? (
                          getExtension(archivo.nombre_archivo || '') === 'pdf' ? (
                            <iframe
                              title={`Vista previa ${archivo.nombre_archivo || 'archivo'}`}
                              src={resolveUrl(archivo.archivo_url)}
                              style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          ) : (
                            <img
                              src={resolveUrl(archivo.archivo_url)}
                              alt={`Vista previa ${archivo.nombre_archivo || 'archivo'}`}
                              style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
                            />
                          )
                        ) : (
                          <p className="m-0 text-muted">Este archivo no admite vista previa.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const acts = actividadesPorMateria[selectedMateria] || [];

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Actividades</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      {cursoNombre && (
        <p className="upload-hint m-0 mb-12">
          Curso: <strong>{cursoNombre}</strong>
        </p>
      )}

      {loading ? (
        <LoadingSpinner text="Cargando actividades..." size="sm" inline />
      ) : materiasDelCurso.length === 0 ? (
        <p className="empty-state-message empty-state-centered">
          No hay materias disponibles.
        </p>
      ) : (
        <div>
          <div className="filter-row mb-20">
            <div className="form-group-filter" style={{ maxWidth: '360px' }}>
              <label htmlFor="materia-select">Materia</label>
              <select
                id="materia-select"
                value={selectedMateria}
                onChange={(e) => setSelectedMateria(e.target.value)}
              >
                {materiasDelCurso.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="actividades-grid">
            {acts.length === 0 ? (
              <p className="empty-state-message empty-state-centered" style={{ gridColumn: '1 / -1' }}>
                Sin actividades para esta materia.
              </p>
            ) : (
              acts.map((act) => {
                const cantArchivos = Array.isArray(act.archivos) ? act.archivos.length : 0;
                const hasFiles = cantArchivos > 0;
                return (
                  <article
                    key={act.id_actividad}
                    className="actividad-card"
                    onClick={() => setSelectedActividad(act)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '20px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      background: 'var(--card-bg)',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div className="actividad-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="actividad-materia-badge" style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: 'rgba(253, 126, 20, 0.12)',
                          color: 'var(--primary-dark)',
                          marginBottom: '8px',
                        }}>
                          {act.materia_nombre || 'Sin materia'}
                        </span>
                        <h3 className="actividad-titulo" style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', wordBreak: 'break-word' }}>
                          {act.titulo}
                        </h3>
                      </div>
                      {hasFiles && (
                        <span className="actividad-files-badge" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: '#e8f5e9',
                          color: '#2e7d32',
                        }}>
                          <i className="fas fa-paperclip" aria-hidden="true" style={{ fontSize: '0.7rem' }} />
                          {cantArchivos}
                        </span>
                      )}
                    </div>

                    <div className="actividad-card-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-calendar-alt" aria-hidden="true" />
                        {formatFecha(act.fecha_creacion)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-clock" aria-hidden="true" />
                        {formatHora(act.fecha_creacion)}
                      </span>
                      {act.docente_apellido && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-chalkboard-teacher" aria-hidden="true" />
                          {act.docente_apellido}, {act.docente_nombre}
                        </span>
                      )}
                    </div>

                    {act.descripcion && (
                      <div className="actividad-descripcion-preview" style={{ marginTop: '12px', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-dark)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {act.descripcion}
                        </p>
                      </div>
                    )}

                    <div className="actividad-card-footer" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="actividad-ver-mas" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Ver detalles <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActividadesView;
