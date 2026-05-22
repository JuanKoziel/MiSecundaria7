import { useEffect, useState } from 'react';
import {
  fetchAlumnos,
  fetchAsistenciasDiarias,
  saveAsistenciasDiariasBulk,
} from '../../api/services';
import { todayISO } from '../../utils/date';
import ApiError from '../common/ApiError';
import CursoFilter from './CursoFilter';
import { useCursos } from './useCursos';

function Asistencias() {
  const { cursos, curso, setCurso, error: cursosError, loading: cursosLoading } = useCursos();
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [fecha, setFecha] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    setError('');
    Promise.all([fetchAlumnos(curso), fetchAsistenciasDiarias(fecha, null, curso)])
      .then(([alumnosData, asistData]) => {
        setAlumnos(alumnosData);
        const map = {};
        asistData.forEach((a) => {
          map[a.alumno_id] = a.estado === 'Presente';
        });
        setAsistencias(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fecha, curso]);

  const toggleAsistencia = (id) => {
    setAsistencias((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError('');
    try {
      const items = alumnos.map((a) => ({
        alumno_id: a.id,
        estado: asistencias[a.id] ? 'Presente' : 'Ausente',
      }));
      await saveAsistenciasDiariasBulk({ fecha, items });
      alert('Asistencia guardada correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayError = cursosError || error;

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Control de Asistencia Diaria</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving || !curso}>
          {saving ? 'Guardando...' : 'Guardar día'}
        </button>
      </div>

      <CursoFilter cursos={cursos} value={curso} onChange={setCurso} id="curso-asistencias" />

      <div className="global-field-box">
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fecha-asist-preceptor">Fecha</label>
            <input
              id="fecha-asist-preceptor"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

      <ApiError message={displayError} />

      {cursosLoading || loading ? (
        <p className="empty-state-message">Cargando...</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Estado de Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => {
                const isPresente = asistencias[a.id] ?? false;
                return (
                  <tr key={a.id}>
                    <td>{a.nombre} {a.apellido}</td>
                    <td>
                      <button
                        type="button"
                        className={`badge badge-interactive ${isPresente ? 'badge-presente' : 'badge-ausente'}`}
                        onClick={() => toggleAsistencia(a.id)}
                      >
                        {isPresente ? '✓ Presente' : '✕ Ausente'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Asistencias;
