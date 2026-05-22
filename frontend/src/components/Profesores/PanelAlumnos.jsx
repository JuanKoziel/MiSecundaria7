import { useEffect, useState } from 'react';
import { fetchAlumnos, fetchCalificaciones, saveCalificacionesBulk } from '../../api/services';
import ApiError from '../common/ApiError';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return Math.min(10, Math.max(1, num));
}

function PanelAlumnos({ curso, materia }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      fetchAlumnos(curso),
      fetchCalificaciones({ curso, materia }),
    ])
      .then(([alumnosData, califs]) => {
        const califMap = Object.fromEntries(califs.map((c) => [c.alumno_id, c]));
        setAlumnos(
          alumnosData.map((a) => {
            const c = califMap[a.id] || {};
            return {
              id: a.id,
              nombre: `${a.apellido}, ${a.nombre}`,
              prenota1: c.prenota1 || '',
              nota1: c.nota1 ?? '',
              prenota2: c.prenota2 || '',
              nota2: c.nota2 ?? '',
              diag: c.diagnostico || '',
            };
          })
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [curso, materia]);

  const handleInputChange = (id, campo, valor) => {
    setAlumnos((prev) =>
      prev.map((alumno) => (alumno.id === id ? { ...alumno, [campo]: valor } : alumno))
    );
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await saveCalificacionesBulk({
        curso,
        materia,
        items: alumnos.map((a) => ({
          alumno_id: a.id,
          prenota1: a.prenota1,
          nota1: a.nota1 === '' ? null : a.nota1,
          prenota2: a.prenota2,
          nota2: a.nota2 === '' ? null : a.nota2,
          diagnostico: a.diag,
        })),
      });
      alert('Notas guardadas correctamente.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="empty-state-message">Cargando planilla...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <ApiError message={error} />
      <div className="card-header-flex">
        <h3>Planilla de Calificaciones</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving}>
          <i className="fas fa-save" aria-hidden="true" /> {saving ? 'Guardando...' : 'Guardar Notas'}
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nombre del Estudiante</th>
              <th>Documentación</th>
              <th>Prenota 1 (TEA/TEP/TED)</th>
              <th>Nota 1</th>
              <th>Prenota 2 (TEA/TEP/TED)</th>
              <th>Nota 2</th>
              <th>Diagnóstico Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td className="table-cell-strong">{alumno.nombre}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-success table-download-btn"
                    onClick={() =>
                      alert(`Legajo de ${alumno.nombre} (consultar en Actas del alumno).`)
                    }
                  >
                    <i className="fas fa-file-pdf" aria-hidden="true" /> Ver Acta
                  </button>
                </td>
                <td>
                  <select
                    value={alumno.prenota1}
                    onChange={(e) => handleInputChange(alumno.id, 'prenota1', e.target.value)}
                    className="select-table"
                  >
                    <option value="" disabled>--</option>
                    <option value="TEA">TEA</option>
                    <option value="TEP">TEP</option>
                    <option value="TED">TED</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input-table"
                    value={alumno.nota1}
                    onChange={(e) =>
                      handleInputChange(alumno.id, 'nota1', clampNota(e.target.value))
                    }
                  />
                </td>
                <td>
                  <select
                    value={alumno.prenota2}
                    onChange={(e) => handleInputChange(alumno.id, 'prenota2', e.target.value)}
                    className="select-table"
                  >
                    <option value="" disabled>--</option>
                    <option value="TEA">TEA</option>
                    <option value="TEP">TEP</option>
                    <option value="TED">TED</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input-table"
                    value={alumno.nota2}
                    onChange={(e) =>
                      handleInputChange(alumno.id, 'nota2', clampNota(e.target.value))
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={alumno.diag}
                    onChange={(e) => handleInputChange(alumno.id, 'diag', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAlumnos;
