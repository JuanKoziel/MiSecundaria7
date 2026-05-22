import { useEffect, useState } from 'react';
import {
  fetchAlumnos,
  fetchAsistenciasDiarias,
  saveAsistenciasDiariasBulk,
} from '../../api/services';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Asistencias() {
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [fecha, setFecha] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAlumnos(), fetchAsistenciasDiarias(fecha)])
      .then(([alumnosData, asistData]) => {
        setAlumnos(alumnosData);
        const map = {};
        asistData.forEach((a) => {
          map[a.alumno_id] = a.estado === 'Presente';
        });
        setAsistencias(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fecha]);

  const toggleAsistencia = (id) => {
    setAsistencias((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const items = alumnos.map((a) => ({
        alumno_id: a.id,
        estado: asistencias[a.id] ? 'Presente' : 'Ausente',
      }));
      await saveAsistenciasDiariasBulk({ fecha, items });
      alert('Asistencia guardada correctamente.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Control de Asistencia Diaria</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar día'}
        </button>
      </div>

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

      {loading ? (
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
