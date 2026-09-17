import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import EmptyFiltros from './EmptyFiltros';
import { filtrosCompletos } from './preceptorUtils';
import { BASE_URL } from '../../services/api';

const API_BASE = BASE_URL;

function formatFecha(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(date);
}

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function esPdf(nombre = '') {
  return String(nombre).toLowerCase().endsWith('.pdf');
}

function Proyectos({ anioLectivo, curso }) {
  const { cursosObj, cursoMateria, planificaciones, docentes } = useData();
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);

  const filtrosOk = filtrosCompletos(anioLectivo, curso);

  const cursoId = useMemo(() => {
    if (!curso) return null;
    const c = (cursosObj || []).find((x) => x.nombre_curso === curso);
    return c?.id_curso || null;
  }, [curso, cursosObj]);

  const docentesPorId = useMemo(() => {
    const mapa = {};
    (docentes || []).forEach((d) => { mapa[d.id] = d; });
    return mapa;
  }, [docentes]);

  const materiasDelCurso = useMemo(() => {
    if (!cursoId) return [];
    const mapa = new Map();
    (cursoMateria || [])
      .filter((cm) => Number(cm.id_curso) === Number(cursoId))
      .forEach((cm) => {
        if (!mapa.has(cm.materia_nombre)) {
          const doc = docentesPorId[cm.id_docente];
          mapa.set(cm.materia_nombre, {
            materia: cm.materia_nombre || '—',
            docente: cm.docente_nombre || (doc ? `${doc.apellido}, ${doc.nombre}` : '—'),
          });
        }
      });
    return [...mapa.values()].sort((a, b) => a.materia.localeCompare(b.materia));
  }, [cursoId, cursoMateria, docentesPorId]);

  const proyectosPorMateria = useMemo(() => {
    if (!cursoId) return {};
    const cmIds = new Set(
      (cursoMateria || [])
        .filter((cm) => Number(cm.id_curso) === Number(cursoId))
        .map((cm) => cm.id),
    );
    const grupos = {};
    (planificaciones || [])
      .filter((p) => cmIds.has(p.id_curso_materia))
      .forEach((p) => {
        const cm = (cursoMateria || []).find((x) => x.id === p.id_curso_materia);
        const materia = cm?.materia_nombre || '—';
        if (!grupos[materia]) grupos[materia] = [];
        grupos[materia].push({
          id: p.id,
          docente: cm?.docente_nombre || '—',
          fecha: p.fecha_subida || '—',
          ruta: p.ruta_archivo || null,
        });
      });
    Object.keys(grupos).forEach((k) => {
      grupos[k].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    });
    return grupos;
  }, [cursoId, cursoMateria, planificaciones]);

  if (!filtrosOk) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-project-diagram" aria-hidden="true" /> Proyectos — Contenido</h3>
        </div>
        <EmptyFiltros />
      </div>
    );
  }

  if (materiaSeleccionada) {
    const proyectos = proyectosPorMateria[materiaSeleccionada] || [];
    const infoMateria = materiasDelCurso.find((m) => m.materia === materiaSeleccionada);

    return (
      <div className="card">
        <div className="card-header-flex">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setMateriaSeleccionada(null)}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
          </button>
          <h3><i className="fas fa-project-diagram" aria-hidden="true" /> {materiaSeleccionada}</h3>
        </div>

        {infoMateria && (
          <p className="upload-hint m-0 mb-12">
            Docente: <strong>{infoMateria.docente}</strong> — Curso: <strong>{curso} ({anioLectivo})</strong>
          </p>
        )}

        {proyectos.length === 0 ? (
          <p className="empty-state-message empty-state-centered">
            No hay proyectos subidos para esta materia en este curso.
          </p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Fecha de subida</th>
                  <th>Archivo</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.docente}</td>
                    <td>{formatFecha(p.fecha)}</td>
                    <td>
                      {p.ruta ? (
                        <a
                          href={resolveUrl(p.ruta)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary"
                        >
                          <i className={`fas ${esPdf(p.ruta) ? 'fa-file-pdf' : 'fa-file'}`} aria-hidden="true" />{' '}
                          Ver proyecto
                        </a>
                      ) : (
                        <span style={{ color: '#888' }}>Sin archivo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const totalProyectos = Object.values(proyectosPorMateria).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-project-diagram" aria-hidden="true" /> Proyectos</h3>
        <span className="badge role-badge-display">{curso} ({anioLectivo})</span>
      </div>

      <p className="upload-hint m-0 mb-12">
        Seleccioná una materia para ver los proyectos subidos por los docentes.
      </p>

      {materiasDelCurso.length === 0 ? (
        <p className="empty-state-message empty-state-centered">
          No hay materias asignadas para este curso ({curso}).
        </p>
      ) : (
        <div className="materias-docentes-grid">
          {materiasDelCurso.map((m) => {
            const count = (proyectosPorMateria[m.materia] || []).length;
            return (
              <button
                key={m.materia}
                type="button"
                className="materia-docente-card"
                onClick={() => setMateriaSeleccionada(m.materia)}
              >
                <span className="materia-docente-card-title">{m.materia}</span>
                <span className="materia-docente-card-teacher">{m.docente}</span>
                <span className="materia-docente-card-count">
                  {count > 0 ? `${count} proyecto(s)` : 'Sin proyectos'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Proyectos;