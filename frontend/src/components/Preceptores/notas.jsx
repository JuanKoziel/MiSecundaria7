import { useEffect, useState } from 'react';
import { fetchAlumnos, fetchNotasPreceptor, saveNotasPreceptorBulk } from '../../api/services';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return String(Math.min(10, Math.max(1, num)));
}

function Notas() {
  const [alumnos, setAlumnos] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchAlumnos(), fetchNotasPreceptor()])
      .then(([alumnosData, notasData]) => {
        setAlumnos(alumnosData);
        const map = {};
        notasData.forEach((n) => {
          map[n.alumno_id] = n.nota != null ? String(n.nota) : '';
        });
        setNotas(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id, value) => {
    setNotas((prev) => ({ ...prev, [id]: clampNota(value) }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const items = alumnos.map((a) => ({
        alumno_id: a.id,
        nota: notas[a.id] === '' ? null : Number(notas[a.id]),
      }));
      await saveNotasPreceptorBulk(items);
      alert('Notas guardadas correctamente.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones del Periodo</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>

      {loading ? (
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
