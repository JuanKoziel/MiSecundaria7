import { Fragment, useEffect, useMemo, useState } from 'react';
import { getLibroTemas, BASE_URL } from '../../services/api';
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
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const filtrosOk = filtrosCompletos(anioLectivo, curso);

  useEffect(() => {
    if (!filtrosOk) {
      setRegistros([]);
      return;
    }
    setCargando(true);
    setError('');
    getLibroTemas({ curso })
      .then((data) => {
        setRegistros(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setError('No se pudieron cargar los libros de temas.'))
      .finally(() => setCargando(false));
  }, [filtrosOk, curso]);

  const ordenados = useMemo(
    () =>
      [...registros].sort((a, b) =>
        String(b.fecha || '').localeCompare(String(a.fecha || '')),
      ),
    [registros],
  );

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
        docentes del curso ({curso}). Contenido de solo lectura.
      </p>

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
              {ordenados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-message">
                    No hay libros de temas cargados para este curso.
                  </td>
                </tr>
              ) : (
                ordenados.map((reg) => (
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