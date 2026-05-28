import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { createCalificacion } from '../../services/api';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return Math.min(10, Math.max(1, num));
}

function PanelAlumnos() {
  const { alumnosDocenteInicial, cursoMateria, refreshData } = useData();
  const [alumnos, setAlumnos] = useState(alumnosDocenteInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleInputChange = (id, campo, valor) => {
    setAlumnos((prev) =>
      prev.map((alumno) => (alumno.id === id ? { ...alumno, [campo]: valor } : alumno))
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      const primerCm = cursoMateria[0];
      if (!primerCm) {
        setMensaje('No hay curso-materia disponible para guardar notas.');
        setGuardando(false);
        return;
      }
      const promises = alumnos
        .filter((a) => a.prenota1 || a.nota1)
        .map((a) =>
          createCalificacion({
            id_alumno: a.id,
            id_curso_materia: primerCm.id,
            id_docente: primerCm.id_docente,
            id_periodo: 1,
            pre_nota: a.prenota1 || '',
            nota_numerica: a.nota1 || null,
            diagnostico: a.diag || '',
          }),
        );
      await Promise.all(promises);
      setMensaje('Notas guardadas exitosamente.');
      await refreshData();
    } catch (err) {
      setMensaje(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Calificaciones</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Notas'}
        </button>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

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
                      alert(`Descargando legajo de ${alumno.nombre} (modo demostración).`)
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
                    <option value="" disabled>
                      --
                    </option>
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
                    <option value="" disabled>
                      --
                    </option>
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
                    value={alumno.nota2}
                    onChange={(e) =>
                      handleInputChange(alumno.id, 'nota2', clampNota(e.target.value))
                    }
                    className="input-table"
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
