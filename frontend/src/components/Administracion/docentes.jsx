import { Fragment, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { cursoConOrientacion } from '../../utils/orientacion';
import { deleteMiDdjjDocente } from '../../services/api';

const API_BASE = 'http://localhost:8000';
const PREVIEWABLE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

function getFileExtension(nombre = '') {
  const clean = String(nombre).split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
}

function isPreviewable(nombre = '') {
  return PREVIEWABLE_EXTENSIONS.has(getFileExtension(nombre));
}

function getAbsoluteFileUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}

function buildDownloadUrl(path) {
  const absolute = getAbsoluteFileUrl(path);
  if (!absolute) return null;
  return absolute.includes('?') ? `${absolute}&download=1` : `${absolute}?download=1`;
}

function DdjjPreviewModal({ docente, onClose, onDelete }) {
  if (!docente) return null;

  const archivoUrl = docente.ddjj_url || docente.ruta_ddjj || null;
  const absoluteUrl = getAbsoluteFileUrl(archivoUrl);
  const downloadUrl = buildDownloadUrl(archivoUrl);
  const archivoNombre = docente.ddjj_nombre_archivo || (archivoUrl ? archivoUrl.split('/').pop() : 'Archivo');
  const previewOk = isPreviewable(archivoNombre);
  const extension = getFileExtension(archivoNombre);
  const fechaCarga = docente.ddjj_fecha_carga
    ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(docente.ddjj_fecha_carga))
    : null;

  return (
    <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ddjj-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de ${archivoNombre}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ddjj-modal-header">
          <div>
            <h4 style={{ margin: 0 }}>D.D.J.J. del docente</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {docente.apellido}, {docente.nombre}
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            <i className="fas fa-times" aria-hidden="true" /> Cerrar
          </button>
        </div>

        <div className="ddjj-modal-body">
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
            Archivo: {archivoNombre}
          </p>
          {fechaCarga && (
            <p style={{ margin: '0 0 10px' }}>
              Fecha de carga: {fechaCarga}
            </p>
          )}

          {previewOk && absoluteUrl ? (
            extension === 'pdf' ? (
              <iframe
                title={`Vista previa ${archivoNombre}`}
                className="ddjj-preview-frame"
                src={absoluteUrl}
              />
            ) : (
              <div className="ddjj-image-wrap">
                <img
                  src={absoluteUrl}
                  alt={`Vista previa ${archivoNombre}`}
                  className="ddjj-preview-image"
                />
              </div>
            )
          ) : (
            <div className="ddjj-no-preview">
              <p style={{ margin: 0 }}>Este archivo no admite vista previa.</p>
              {downloadUrl && (
                <a
                  className="btn btn-primary"
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-download" aria-hidden="true" /> Descargar archivo
                </a>
              )}
            </div>
          )}
        </div>

        <div className="ddjj-modal-footer">
          {downloadUrl && (
            <a
              className="btn btn-secondary"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-download" aria-hidden="true" /> Descargar archivo
            </a>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete(docente)}
          >
            <i className="fas fa-trash-alt" aria-hidden="true" /> Eliminar DDJJ
          </button>
        </div>
      </div>
    </div>
  );
}

function ActasDocenteDesplegable({ actas }) {
  if (actas.length === 0) {
    return <p className="empty-state-message">No hay actas cargadas.</p>;
  }

  return (
    <table className="acta-desplegable-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Descripción</th>
          <th>Archivo</th>
          <th>Autor</th>
        </tr>
      </thead>
      <tbody>
        {actas.map((acta) => (
          <tr key={acta.id}>
            <td>{acta.fecha}</td>
            <td>{acta.descripcion || acta.titulo}</td>
            <td>
              {acta.ruta_archivo ? (
                <a
                  href={`${API_BASE}${acta.ruta_archivo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success table-download-btn"
                >
                  <i className="fas fa-file-pdf" aria-hidden="true" /> Ver
                </a>
              ) : (
                '—'
              )}
            </td>
            <td>{acta.autor || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CursosMateriasDesplegable({ docenteId, cursoMateria, planificaciones }) {
  const asignaciones = useMemo(() => {
    const map = new Map();
    cursoMateria
      .filter((cm) => cm.id_docente === docenteId)
      .forEach((cm) => {
        const key = `${cm.id_curso}-${cm.curso_nombre}`;
        if (!map.has(key)) {
          map.set(key, { curso: cm.curso_nombre, items: [] });
        }
        map.get(key).items.push(cm);
      });
    return [...map.values()];
  }, [cursoMateria, docenteId]);

  if (!asignaciones.length) {
    return <p className="empty-state-message">Sin cursos ni materias asignadas.</p>;
  }

  return (
    <table className="acta-desplegable-table docente-materias-table">
      <thead>
        <tr>
          <th>Curso</th>
          <th>Materia</th>
          <th>Proyecto</th>
        </tr>
      </thead>
      <tbody>
        {asignaciones.map((asig) =>
          asig.items.map((cm, index) => {
            const planificacion = planificaciones.find((p) => p.id_curso_materia === cm.id);
            const nombreCurso = cursoConOrientacion(asig.curso);
            return (
              <tr key={cm.id}>
                {index === 0 && (
                  <td rowSpan={asig.items.length} className="table-cell-strong">
                    {nombreCurso}
                  </td>
                )}
                <td>
                  <div className="docente-materia-line">
                    <span>{cm.materia_nombre || '—'}</span>
                  </div>
                </td>
                <td>
                  {planificacion?.ruta_archivo ? (
                    <a
                      href={`${API_BASE}${planificacion.ruta_archivo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success table-download-btn"
                    >
                      <i className="fas fa-folder-open" aria-hidden="true" /> Ver proyecto
                    </a>
                  ) : (
                    <button type="button" className="btn btn-danger table-download-btn" disabled>
                      <i className="fas fa-folder-open" aria-hidden="true" /> Ver proyecto
                    </button>
                  )}
                </td>
              </tr>
            );
          }),
        )}
      </tbody>
    </table>
  );
}

function Docentes() {
  const { docentes, actasDocente, cursoMateria, planificaciones, refreshData } = useData();
  const [actasAbierto, setActasAbierto] = useState(null);
  const [cursosAbierto, setCursosAbierto] = useState(null);
  const [previewDocente, setPreviewDocente] = useState(null);

  const handleEliminarDdjj = async (docente) => {
    if (!window.confirm('¿Está seguro de eliminar esta D.D.J.J.?')) return;
    try {
      await deleteMiDdjjDocente(docente.id);
      if (previewDocente?.id === docente.id) {
        setPreviewDocente(null);
      }
      await refreshData();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.detail || 'No se pudo eliminar la DDJJ.');
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Docentes</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docentes.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">
                  No hay docentes registrados.
                </td>
              </tr>
            ) : (
              docentes.map((d) => {
                const verActas = actasAbierto === d.id;
                const verCursos = cursosAbierto === d.id;
                const actas = actasDocente.filter((a) => a.docenteId === d.id);
                const tieneDdjj = Boolean(d.ddjj_presentada || d.ddjj_id);
                const archivoUrl = d.ddjj_url || d.ruta_ddjj || null;
                const archivoNombre = d.ddjj_nombre_archivo || (archivoUrl ? archivoUrl.split('/').pop() : 'Archivo');

                return (
                  <Fragment key={d.id}>
                    <tr>
                      <td>{d.nombre}</td>
                      <td>{d.apellido}</td>
                      <td><strong>{d.dni}</strong></td>
                      <td>{d.correo || '—'}</td>
                      <td>{d.telefono || '—'}</td>
                      <td className="acciones-cell">
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '8px',
                            width: '100%',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-success table-download-btn"
                            onClick={() => {
                              setActasAbierto(verActas ? null : d.id);
                              setCursosAbierto(null);
                            }}
                          >
                            <i
                              className={`fas fa-chevron-${verActas ? 'up' : 'down'}`}
                              aria-hidden="true"
                            />{' '}
                            Ver Actas
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm ${tieneDdjj ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => setPreviewDocente(d)}
                            disabled={!tieneDdjj}
                            title={tieneDdjj ? `Ver ${archivoNombre}` : 'No hay DDJJ cargada'}
                          >
                            <i className="fas fa-file-alt" aria-hidden="true" /> DDJJ
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary table-download-btn"
                            style={{ gridColumn: '1 / -1', width: '100%' }}
                            onClick={() => {
                              setCursosAbierto(verCursos ? null : d.id);
                              setActasAbierto(null);
                            }}
                          >
                            <i
                              className={`fas fa-chevron-${verCursos ? 'up' : 'down'}`}
                              aria-hidden="true"
                            />{' '}
                            Ver Cursos y Materias
                          </button>
                        </div>
                      </td>
                    </tr>
                    {verActas && (
                      <tr className="acta-desplegable-row">
                        <td colSpan={6}>
                          <ActasDocenteDesplegable actas={actas} />
                        </td>
                      </tr>
                    )}
                    {verCursos && (
                      <tr className="acta-desplegable-row">
                        <td colSpan={6}>
                          <CursosMateriasDesplegable
                            docenteId={d.id}
                            cursoMateria={cursoMateria}
                            planificaciones={planificaciones}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {previewDocente && (
        <DdjjPreviewModal
          docente={previewDocente}
          onClose={() => setPreviewDocente(null)}
          onDelete={handleEliminarDdjj}
        />
      )}
    </div>
  );
}

export default Docentes;
