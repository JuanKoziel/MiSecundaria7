import { useEffect, useState } from 'react';
import { fetchAlumnos, fetchNotasPreceptor, saveNotasPreceptorBulk } from '../../api/services';
import ApiError from '../common/ApiError';
import CursoFilter from './CursoFilter';
import { useCursos } from './useCursos';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(Math.min(10, Math.max(1, num)));
}

function Notas() {
  const { cursos, curso, setCurso, error: cursosError, loading: cursosLoading } = useCursos();
  const [alumnos, setAlumnos] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    setError('');
    Promise.all([fetchAlumnos(curso), fetchNotasPreceptor()])
      .then(([alumnosData, notasData]) => {
        setAlumnos(alumnosData);
        const map = {};
        const ids = new Set(alumnosData.map((a) => a.id));
        notasData.forEach((n) => {
          if (ids.has(n.alumno_id)) {
            map[n.alumno_id] = n.nota != null ? String(n.nota) : '';
          }
        });
        setNotas(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [curso]);

  const handleChange = (id, value) => {
    setNotas((prev) => ({ ...prev, [id]: clampNota(value) }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError('');
    try {
      const items = alumnos.map((a) => ({
        alumno_id: a.id,
        nota: notas[a.id] === '' ? null : Number(notas[a.id]),
      }));
      await saveNotasPreceptorBulk(items);
      alert('Notas guardadas correctamente.');
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
        <h3>Calificaciones del Periodo</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving || !curso}>
          {saving ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>

      <CursoFilter cursos={cursos} value={curso} onChange={setCurso} id="curso-notas" />
      <ApiError message={displayError} />

      {cursosLoading || loading ? (
        <p className="empty-state-message">Cargando...</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th style={{ width: '150px' }}>Nota Final</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre} {a.apellido}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input-table input-table--wide"
                      value={notas[a.id] ?? ''}
                      onChange={(e) => handleChange(a.id, e.target.value)}
                    />
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

export default Notas;
