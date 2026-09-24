import { Fragment, useEffect, useMemo, useState } from 'react';
import { getLibroTemas, BASE_URL } from '../../services/api';
import { useData } from '../../context/DataContext';
import EmptyFiltros from './EmptyFiltros';
import { filtrosCompletos } from './preceptorUtils';
import LoadingSpinner from '../Shared/LoadingSpinner';

const API_BASE = BASE_URL;

function formatFecha(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(date);
}

function LibroTemasPreceptor({ anioLectivo, curso }) {
  const { cursosObj, materiasPorCurso } = useData();
  const [registros, setRegistros] = useState([]);
  const [materiaSel, setMateriaSel] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const filtrosOk = filtrosCompletos(anioLectivo, curso);

  const cursoId = useMemo(
    () =>
      curso
        ? (cursosObj || []).find((c) => c.nombre_curso === curso)?.id_curso || null
        : null,
    [curso, cursosObj],
  );

  const materiasDelCurso = useMemo(
    () => (curso ? materiasPorCurso?.[curso] || [] : []),
    [curso, materiasPorCurso],
  );

  useEffect(() => {
    setMateriaSel('');
  }, [curso]);

  useEffect(() => {
    if (!filtrosOk || !cursoId) {
      setRegistros([]);
      return;
    }
    setCargando(true);
    setError('');
    getLibroTemas({ curso: cursoId })
      .then((data) => {
        setRegistros(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setError('No se pudieron cargar los libros de temas.'))
      .finally(() => setCargando(false));
  }, [filtrosOk, cursoId]);

  const visibles = useMemo(() => {
    const base = materiaSel
      ? registros.filter((r) => r.materia_nombre === materiaSel)
      : registros;
    return [...base].sort((a, b) => {
      const porFecha = String(b.fecha || '').localeCompare(String(a.fecha || ''));
      if (porFecha !== 0) return porFecha;
      return String(b.hora_inicio || '').localeCompare(String(a.hora_inicio || ''));
    });
  }, [registros, materiaSel]);

  if (!filtrosOk) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-book-open" aria-hidden="true" /> Libros de Temas</h3>
        </div>
        <EmptyFiltros />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-book-open" aria-hidden="true" /> Libros de Temas</h3>
        <span className="badge badge-neutral">Solo lectura</span>
      </div>

      <p className="upload-hint m-0 mb-12">
        <i className="fas fa-info-circle" aria-hidden="true" /> Libros de temas cargados por los
        docentes del curso ({curso}). Elegí una materia para ver todos sus libros; el más reciente
        aparece primero.
      </p>

      <div className="form-group-filter" style={{ maxWidth: '320px', marginBottom: '12px' }}>
        <label>Materia</label>
        <select value={materiaSel} onChange={(e) => setMateriaSel(e.target.value)}>
          <option value="">Todas las materias</option>
          {materiasDelCurso.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {cargando ? (
        <LoadingSpinner text="Cargando libros de temas..." />
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Materia</th>
                <th>Docente</th>
                <th>Horario</th>
                <th>Descripción</th>
                <th>Archivo</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-message">
                    {materiaSel
                      ? `No hay libros de temas cargados para ${materiaSel}.`
                      : 'No hay libros de temas cargados para este curso.'}
                  </td>
                </tr>
              ) : (
                visibles.map((reg) => (
                  <Fragment key={reg.id_libro_tema}>
                    <tr>
                      <td>{formatFecha(reg.fecha)}</td>
                      <td className="table-cell-strong">{reg.materia_nombre || '—'}</td>
                      <td>{reg.docente_nombre || '—'}</td>
                      <td>
                        {`${String(reg.hora_inicio || '').slice(0, 5)} - ${String(reg.hora_fin || '').slice(0, 5)}`}
                      </td>
                      <td>{reg.descripcion || '—'}</td>
                      <td>
                        {reg.ruta_archivo ? (
                          <a
                            href={`${API_BASE}${reg.ruta_archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success table-download-btn"
                          >
                            <i className="fas fa-eye" aria-hidden="true" /> Ver
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LibroTemasPreceptor;
