import { useEffect, useState } from 'react';
import { fetchAlumnos } from '../../api/services';
import ApiError from '../common/ApiError';
import CursoFilter from './CursoFilter';
import { useCursos } from './useCursos';

function Alumnos() {
  const { cursos, curso, setCurso, error: cursosError, loading: cursosLoading } = useCursos();
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    setError('');
    fetchAlumnos(curso)
      .then(setAlumnos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [curso]);

  const displayError = cursosError || error;

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Listado de Alumnos</h3>
      </div>

      <CursoFilter cursos={cursos} value={curso} onChange={setCurso} id="curso-alumnos" />
      <ApiError message={displayError} />

      {cursosLoading || loading ? (
        <p className="empty-state-message">Cargando alumnos...</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Curso</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.dni}</strong></td>
                  <td>{a.apellido}, {a.nombre}</td>
                  <td>{a.curso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Alumnos;
