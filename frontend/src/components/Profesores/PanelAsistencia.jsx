import { useEffect, useState } from 'react';
import { fetchSesionClase, saveSesionClase } from '../../api/services';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function PanelAsistencia({ curso, materia }) {
  const [alumnos, setAlumnos] = useState([]);
  const [fecha, setFecha] = useState(todayISO());
  const [libroTemas, setLibroTemas] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSesionClase(curso, materia, fecha)
      .then((data) => {
        setLibroTemas(data.libro_temas || '');
        setAlumnos(
          (data.asistencias || []).map((a) => ({
            id: a.id,
            nombre: a.nombre,
            estado: a.estado || 'Presente',
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [curso, materia, fecha]);

  const cambiarAsistencia = (id, nuevoEstado) => {
    setAlumnos((prev) => prev.map((al) => (al.id === id ? { ...al, estado: nuevoEstado } : al)));
  };

  const getBadgeClass = (estado) => {
    if (estado === 'Presente') return 'badge-presente';
    if (estado === 'Ausente') return 'badge-ausente';
    return 'badge-tarde';
  };

  const handleConsolidar = async () => {
    setSaving(true);
    try {
      await saveSesionClase({
        curso,
        materia,
        fecha,
        libro_temas: libroTemas,
        asistencias: alumnos.map((a) => ({
          alumno_id: a.id,
          estado: a.estado,
        })),
      });
      alert('Asistencia del día consolidada correctamente.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="empty-state-message">Cargando asistencia...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Registro de Asistencias Diario</h3>
        <button type="button" className="btn btn-primary" onClick={handleConsolidar} disabled={saving}>
          <i className="fas fa-check-double" aria-hidden="true" />{' '}
          {saving ? 'Guardando...' : 'Consolidar Día'}
        </button>
      </div>

      <div className="global-field-box">
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fecha-dictado">Fecha de Dictado</label>
            <input
              id="fecha-dictado"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="field-group field-group--grow">
            <label htmlFor="libro-temas">Libro de Temas de la Clase</label>
            <input
              id="libro-temas"
              type="text"
              value={libroTemas}
              onChange={(e) => setLibroTemas(e.target.value)}
              placeholder="Escriba los contenidos y ejes conceptuales dictados hoy..."
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado Actual</th>
              <th>Cambiar Estado</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td className="table-cell-strong">{alumno.nombre}</td>
                <td>
                  <span className={`badge ${getBadgeClass(alumno.estado)}`}>{alumno.estado}</span>
                </td>
                <td>
                  <div className="cb-container" role="radiogroup" aria-label={`Asistencia de ${alumno.nombre}`}>
                    {['Presente', 'Ausente', 'Tarde'].map((tipo) => (
                      <label key={tipo} className="cb-label">
                        <input
                          type="radio"
                          name={`asistencia-${alumno.id}`}
                          checked={alumno.estado === tipo}
                          onChange={() => cambiarAsistencia(alumno.id, tipo)}
                        />
                        <span>{tipo}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAsistencia;
