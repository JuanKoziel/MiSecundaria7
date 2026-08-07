import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { createCalificacion, updateCalificacion } from '../../services/api';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return Math.min(10, Math.max(1, num));
}

function PanelAlumnos({ cursoMateriaId, cursoId, cursoNombre, materiaNombre, docenteId, puedeEditar = true }) {
  const { alumnos, calificacionesCompletas, periodos, refreshData } = useData();
  const toast = useToast();
  const [filas, setFilas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const alumnosCurso = useMemo(
    () => alumnos.filter((a) => a.id_curso === cursoId),
    [alumnos, cursoId],
  );

  const periodo1 = useMemo(
    () => periodos.find((p) => p.orden_periodo === 1) || periodos[0],
    [periodos],
  );
  const periodo2 = useMemo(
    () => periodos.find((p) => p.orden_periodo === 2) || periodos[1],
    [periodos],
  );

  useEffect(() => {
    const calsCm = calificacionesCompletas.filter(
      (c) => c.id_curso_materia === cursoMateriaId,
    );

    const nuevasFilas = alumnosCurso.map((a) => {
      const cal1 = calsCm.find(
        (c) => c.id_alumno === a.id && c.id_periodo === periodo1?.id_periodo,
      );
      const cal2 = calsCm.find(
        (c) => c.id_alumno === a.id && c.id_periodo === periodo2?.id_periodo,
      );
      return {
        id: a.id,
        nombre: `${a.apellido}, ${a.nombre}`,
        prenota1: cal1?.pre_nota || '',
        nota1: cal1?.nota_numerica ?? '',
        prenota2: cal2?.pre_nota || '',
        nota2: cal2?.nota_numerica ?? '',
        diag: cal1?.diagnostico || cal2?.diagnostico || '',
        calId1: cal1?.id_calificacion || null,
        calId2: cal2?.id_calificacion || null,
      };
    });
    setFilas(nuevasFilas);
  }, [alumnosCurso, calificacionesCompletas, cursoMateriaId, periodo1, periodo2]);

  const handleInputChange = (id, campo, valor) => {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)),
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      if (!periodo1) {
        toast.info('No hay periodos de evaluación configurados.');
        setGuardando(false);
        return;
      }

      const promises = [];
      for (const fila of filas) {
        if (fila.prenota1 || fila.nota1 || fila.diag) {
          const payload1 = {
            id_alumno: fila.id,
            id_curso_materia: cursoMateriaId,
            id_docente: docenteId,
            id_periodo: periodo1.id_periodo,
            pre_nota: fila.prenota1 || '',
            nota_numerica: fila.nota1 !== '' ? fila.nota1 : null,
            diagnostico: fila.diag || '',
          };
          if (fila.calId1) {
            promises.push(updateCalificacion(fila.calId1, payload1));
          } else {
            promises.push(createCalificacion(payload1));
          }
        }

        if (periodo2 && (fila.prenota2 || fila.nota2)) {
          const payload2 = {
            id_alumno: fila.id,
            id_curso_materia: cursoMateriaId,
            id_docente: docenteId,
            id_periodo: periodo2.id_periodo,
            pre_nota: fila.prenota2 || '',
            nota_numerica: fila.nota2 !== '' ? fila.nota2 : null,
            diagnostico: '',
          };
          if (fila.calId2) {
            promises.push(updateCalificacion(fila.calId2, payload2));
          } else {
            promises.push(createCalificacion(payload2));
          }
        }
      }

      if (promises.length === 0) {
        toast.info('No hay notas para guardar.');
        setGuardando(false);
        return;
      }

      await Promise.all(promises);
      toast.success('Notas guardadas exitosamente.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Calificaciones — {cursoNombre} &gt; {materiaNombre}</h3>
        {puedeEditar && (
          <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
            <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Notas'}
          </button>
        )}
      </div>

      {!puedeEditar && (
        <p
          style={{
            background: '#fff4cf',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: '#854d0e',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          Esta materia está asignada temporalmente a un docente suplente. La planilla es de solo lectura hasta que finalice la suplencia.
        </p>
      )}

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
              <th>Prenota 1 (TEA/TEP/TED)</th>
              <th>Nota 1</th>
              <th>Prenota 2 (TEA/TEP/TED)</th>
              <th>Nota 2</th>
              <th>Diagnóstico Final</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">
                  No hay alumnos en este curso.
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id}>
                  <td className="table-cell-strong">{fila.nombre}</td>
                  <td>
                    <select
                      value={fila.prenota1}
                      onChange={(e) => handleInputChange(fila.id, 'prenota1', e.target.value)}
                      className="select-table"
                      disabled={!puedeEditar}
                    >
                      <option value="">--</option>
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
                      value={fila.nota1}
                      onChange={(e) =>
                        handleInputChange(fila.id, 'nota1', clampNota(e.target.value))
                      }
                      disabled={!puedeEditar}
                    />
                  </td>
                  <td>
                    <select
                      value={fila.prenota2}
                      onChange={(e) => handleInputChange(fila.id, 'prenota2', e.target.value)}
                      className="select-table"
                      disabled={!puedeEditar}
                    >
                      <option value="">--</option>
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
                      value={fila.nota2}
                      onChange={(e) =>
                        handleInputChange(fila.id, 'nota2', clampNota(e.target.value))
                      }
                      className="input-table"
                      disabled={!puedeEditar}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={fila.diag}
                      onChange={(e) => handleInputChange(fila.id, 'diag', e.target.value)}
                      disabled={!puedeEditar}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAlumnos;
