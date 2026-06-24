import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getActividades } from '../../services/api';

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

        <div style={{ marginTop: '16px' }}>
          <h2>{actividad.titulo}</h2>

          <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
            <p><strong>Materia:</strong> {actividad.materia_nombre || '—'}</p>
            <p><strong>Curso:</strong> {actividad.curso_nombre || '—'}</p>
            <p><strong>Docente:</strong> {actividad.docente_apellido ? `${actividad.docente_apellido}, ${actividad.docente_nombre}` : '—'}</p>
            <p><strong>Fecha:</strong> {formatFecha(actividad.fecha_creacion)}</p>
            <p><strong>Hora:</strong> {formatHora(actividad.fecha_creacion)}</p>
          </div>

          {actividad.descripcion && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}><strong>Descripción:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '8px' }}>{actividad.descripcion}</p>
            </div>
          )}

          {archivos.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Archivos adjuntos ({archivos.length})</h4>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {archivos.map((archivo) => (
                  <div key={archivo.id_archivo || archivo.nombre_archivo}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        <i className="fas fa-paperclip" aria-hidden="true" />{' '}
                        {archivo.nombre_archivo || 'Archivo'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                          <p style={{ margin: 0, color: '#666' }}>Este archivo no admite vista previa.</p>
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

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Actividades</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      {cursoNombre && (
        <p className="upload-hint" style={{ margin: '0 0 12px' }}>
          Curso: <strong>{cursoNombre}</strong>
        </p>
      )}

      {loading ? (
        <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
          Cargando actividades...
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {materiasDelCurso.length === 0 && actividades.length === 0 ? (
            <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
              No hay actividades disponibles para tu curso.
            </p>
          ) : (
            materiasDelCurso.map((materia) => {
              const acts = actividadesPorMateria[materia] || [];
              return (
                <div key={materia}>
                  <h4 style={{ margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', paddingBottom: '4px' }}>
                    {materia}
                  </h4>
                  {acts.length === 0 ? (
                    <p className="empty-state-message" style={{ margin: '8px 0', fontStyle: 'italic' }}>
                      Sin actividades
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {acts.map((act) => {
                        const cantArchivos = Array.isArray(act.archivos) ? act.archivos.length : 0;
                        return (
                          <div
                            key={act.id_actividad}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              background: 'var(--card-bg)',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{act.titulo}</div>
                              <div className="upload-hint" style={{ marginTop: '4px', fontSize: '13px' }}>
                                {formatFecha(act.fecha_creacion)} {formatHora(act.fecha_creacion)}
                                {act.docente_apellido ? ` — ${act.docente_apellido}, ${act.docente_nombre}` : ''}
                                {cantArchivos > 0 ? ` — ${cantArchivos} archivo(s)` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ whiteSpace: 'nowrap' }}
                              onClick={() => setSelectedActividad(act)}
                            >
                              <i className="fas fa-eye" aria-hidden="true" /> Ver
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default ActividadesView;
