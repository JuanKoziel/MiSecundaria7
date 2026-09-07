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

function claveMateriaDocente(materia, docenteNombre, docenteApellido) {
  return `${materia}|${docenteNombre}|${docenteApellido}`;
}

function separarDocente(completo = '') {
  const texto = String(completo || '').trim();
  if (!texto) return { nombre: '', apellido: '' };
  const indice = texto.indexOf(',');
  if (indice === -1) return { nombre: texto, apellido: '' };
  return {
    apellido: texto.slice(0, indice).trim(),
    nombre: texto.slice(indice + 1).trim(),
  };
}

function ActividadesView({ userRole, selectedChild }) {
  const { alumnos, cursosObj, cursoMateria } = useData();
  const { user } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMateriaDocente, setSelectedMateriaDocente] = useState(null);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [previewArchivo, setPreviewArchivo] = useState(null);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

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

  const materiasDocentesDelCurso = useMemo(() => {
    if (!cursoId) return [];
    const mapa = new Map();
    cursoMateria
      .filter((cm) => Number(cm.id_curso) === Number(cursoId))
      .forEach((cm) => {
        const { nombre, apellido } = separarDocente(cm.docente_nombre);
        const key = claveMateriaDocente(
          cm.materia_nombre || 'Sin materia',
          nombre,
          apellido
        );
        if (!mapa.has(key)) {
          mapa.set(key, {
            id: key,
            materia: cm.materia_nombre || 'Sin materia',
            docente: apellido ? `${apellido}, ${nombre}` : (nombre ? nombre : 'Sin docente'),
            docenteNombre: nombre,
            docenteApellido: apellido,
            materiaNombre: cm.materia_nombre,
          });
        }
      });
    return [...mapa.values()].sort((a, b) => a.materia.localeCompare(b.materia));
  }, [cursoId, cursoMateria]);

  useEffect(() => {
    if (materiasDocentesDelCurso.length === 0) {
      setSelectedMateriaDocente(null);
    } else if (
      selectedMateriaDocente &&
      !materiasDocentesDelCurso.some((md) => md.id === selectedMateriaDocente)
    ) {
      setSelectedMateriaDocente(null);
    }
  }, [materiasDocentesDelCurso, selectedMateriaDocente]);

  const actividadesPorMateriaDocente = useMemo(() => {
    const grupos = {};
    actividades.forEach((act) => {
      const key = claveMateriaDocente(
        act.materia_nombre || '',
        act.docente_nombre || '',
        act.docente_apellido || ''
      );
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(act);
    });
    Object.keys(grupos).forEach((k) => {
      grupos[k].sort((a, b) => {
        const fa = a.fecha_creacion || '';
        const fb = b.fecha_creacion || '';
        return fb.localeCompare(fa);
      });
    });
    return grupos;
  }, [actividades]);

  useEffect(() => {
    if (!cursoId) {
      setActividades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelectedActividad(null);
    setPreviewArchivo(null);
    setMenuAbiertoId(null);
    getActividades({ curso: cursoId })
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.results || [];
        setActividades(lista);
      })
      .catch(() => setActividades([]))
      .finally(() => setLoading(false));
  }, [cursoId]);

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


  const grupos = actividadesPorMateriaDocente[selectedMateriaDocente] || [];
  const materiaDocenteSeleccionado = selectedMateriaDocente
    ? materiasDocentesDelCurso.find((md) => md.id === selectedMateriaDocente)
    : null;

  if (materiaDocenteSeleccionado) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedMateriaDocente(null)}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
          </button>
          <h3>{materiaDocenteSeleccionado.materia} — {materiaDocenteSeleccionado.docente}</h3>
        </div>

        {cursoNombre && (
          <p className="upload-hint m-0 mb-12">
            Curso: <strong>{cursoNombre}</strong>
          </p>
        )}

        {loading ? (
          <LoadingSpinner text="Cargando actividades..." size="sm" inline />
        ) : grupos.length === 0 ? (
          <p className="empty-state-message empty-state-centered">
            Sin actividades para esta materia y docente.
          </p>
        ) : (
          <div className="actividades-publicaciones">
            {grupos.map((act) => {
              const archivos = Array.isArray(act.archivos) ? act.archivos : [];
              const esActividad = archivos.length > 0 || Boolean(act.descripcion && act.descripcion.trim());
              const iconoTipo = esActividad ? 'fa-clipboard-list' : 'fa-book-open';
              const verboTipo = esActividad ? 'una nueva actividad' : 'un nuevo material';
              const nombreDocente = act.docente_apellido
                ? `${act.docente_apellido}, ${act.docente_nombre}`
                : (materiaDocenteSeleccionado.docente || 'Docente');
              const menuAbierto = menuAbiertoId === act.id_actividad;
              const enlaceUnico = act.archivo_url || archivos[0]?.archivo_url || null;
              return (
                <article
                  key={act.id_actividad}
                  className="publicacion-box"
                  onClick={() => setSelectedActividad(act)}
                >
                  <div className="publicacion-icon">
                    <i className={`fas ${iconoTipo}`} aria-hidden="true" />
                  </div>
                  <div className="publicacion-contenido">
                    <p className="publicacion-usuario">
                      {nombreDocente} publicó {verboTipo}:
                    </p>
                    <h4 className="publicacion-titulo">
                      {act.titulo}
                    </h4>
                    <p className="publicacion-fecha">
                      {formatFecha(act.fecha_creacion)}
                      {act.fecha_creacion ? ` · ${formatHora(act.fecha_creacion)}` : ''}
                      {act.editado ? ' · Editado' : ''}
                    </p>
                  </div>
                  <div className="publicacion-menu" style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="publicacion-menu-btn"
                      style={{ border: 'none', background: 'transparent', color: 'var(--text-light)', padding: '6px 8px', fontSize: '1rem', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(menuAbierto ? null : act.id_actividad); }}
                      aria-label="Opciones de la publicación"
                    >
                      <i className="fas fa-ellipsis-v" aria-hidden="true" />
                    </button>
                    {menuAbierto && (
                      <div className="publicacion-menu-dropdown" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '190px', padding: '4px' }}>
                        <button
                          type="button"
                          style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
                          onClick={() => { setMenuAbiertoId(null); setSelectedActividad(act); }}
                        >
                          <i className="fas fa-eye" aria-hidden="true" /> Ver detalle
                        </button>
                        {enlaceUnico && (
                          <a
                            href={resolveUrl(enlaceUnico)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '0.85rem', textDecoration: 'none', color: 'inherit' }}
                            onClick={() => setMenuAbiertoId(null)}
                          >
                            <i className="fas fa-download" aria-hidden="true" /> Descargar adjunto
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
        <p className="upload-hint m-0 mb-12">
          Curso: <strong>{cursoNombre}</strong>
        </p>
      )}

      {loading ? (
        <LoadingSpinner text="Cargando actividades..." size="sm" inline />
      ) : materiasDocentesDelCurso.length === 0 ? (
        <p className="empty-state-message empty-state-centered">
          No hay materias disponibles.
        </p>
      ) : (
        <div className="materias-docentes-grid">
          {materiasDocentesDelCurso.map((md) => (
            <button
              key={md.id}
              type="button"
              className="materia-docente-card"
              onClick={() => setSelectedMateriaDocente(md.id)}
            >
              <span className="materia-docente-card-title">{md.materia}</span>
              <span className="materia-docente-card-teacher">{md.docente}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActividadesView;