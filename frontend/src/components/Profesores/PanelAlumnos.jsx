import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  createCalificacion,
  updateCalificacion,
  getIntensificacionesAcademicas,
  updateIntensificacionAcademica,
  getMateriasAdeudadas,
  rendirMateriaAdeudada,
} from '../../services/api';

function clampNota(value) {
  if (value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return Math.min(10, Math.max(1, num));
}

const PERIODOS_INTENSIFICACION = [
  { key: 'intensificacion_1c', label: 'Intensificación 1.º C' },
  { key: 'diciembre', label: 'Diciembre' },
  { key: 'febrero', label: 'Febrero' },
];

function PanelAlumnos({ cursoMateriaId, cursoId, cursoNombre, materiaNombre, docenteId, puedeEditar = true }) {
  const { alumnos, calificacionesCompletas, periodos, refreshData } = useData();
  const toast = useToast();
  const [filas, setFilas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [intensificaciones, setIntensificaciones] = useState([]);
  const [cargandoIntensif, setCargandoIntensif] = useState(false);

  const [previas, setPrevias] = useState([]);
  const [cargandoPrevias, setCargandoPrevias] = useState(false);

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

  const cargarIntensificaciones = useCallback(async () => {
    if (!alumnosCurso.length) return;
    setCargandoIntensif(true);
    try {
      const alumnoIds = alumnosCurso.map((a) => a.id);
      const allData = await getIntensificacionesAcademicas();
      const data = Array.isArray(allData) ? allData : allData.results || [];
      const intensifAlumnos = data.filter((i) =>
        alumnoIds.includes(i.id_alumno),
      );

      const filasIntensif = alumnosCurso.map((alumno) => {
        const registros = intensifAlumnos.filter(
          (i) => i.id_alumno === alumno.id,
        );
        const porPeriodo = {};
        PERIODOS_INTENSIFICACION.forEach(({ key }) => {
          porPeriodo[key] = '';
        });
        registros.forEach((r) => {
          const peri = (r.periodo || '').toLowerCase();
          if (peri.includes('1') && (peri.includes('intensif') || peri.includes('primer'))) {
            porPeriodo.intensificacion_1c = r.nota ?? '';
          } else if (peri.includes('diciembre')) {
            porPeriodo.diciembre = r.nota ?? '';
          } else if (peri.includes('febrero')) {
            porPeriodo.febrero = r.nota ?? '';
          }
        });
        return {
          alumnoId: alumno.id,
          nombre: `${alumno.apellido}, ${alumno.nombre}`,
          registros: porPeriodo,
          registroIds: {},
        };
      });

      intensifAlumnos.forEach((r) => {
        const fila = filasIntensif.find((f) => f.alumnoId === r.id_alumno);
        if (!fila) return;
        const peri = (r.periodo || '').toLowerCase();
        if (peri.includes('1') && (peri.includes('intensif') || peri.includes('primer'))) {
          fila.registroIds.intensificacion_1c = r.id_intensificacion;
        } else if (peri.includes('diciembre')) {
          fila.registroIds.diciembre = r.id_intensificacion;
        } else if (peri.includes('febrero')) {
          fila.registroIds.febrero = r.id_intensificacion;
        }
      });

      setIntensificaciones(filasIntensif);
    } catch {
      setIntensificaciones([]);
    } finally {
      setCargandoIntensif(false);
    }
  }, [alumnosCurso]);

  const cargarPrevias = useCallback(async () => {
    if (!alumnosCurso.length) return;
    setCargandoPrevias(true);
    try {
      const allData = await getMateriasAdeudadas();
      const data = Array.isArray(allData) ? allData : allData.results || [];
      const alumnoIds = new Set(alumnosCurso.map((a) => a.id));
      const previasAlumnos = data.filter(
        (p) => alumnoIds.has(p.id_alumno) && p.tipo_deuda === 'PREVIA' && p.estado === 'ADEUDADA',
      );

      const filasPrevias = previasAlumnos.map((p) => ({
        alumnoId: p.id_alumno,
        alumnoNombre: alumnosCurso.find((a) => a.id === p.id_alumno)
          ? `${alumnosCurso.find((a) => a.id === p.id_alumno).apellido}, ${alumnosCurso.find((a) => a.id === p.id_alumno).nombre}`
          : '',
        materia: p.materia_nombre || '—',
        materiaAdeudadaId: p.id_materia_adeudada,
        cursoOrigen: p.curso_origen_nombre || '',
      }));

      setPrevias(filasPrevias);
    } catch {
      setPrevias([]);
    } finally {
      setCargandoPrevias(false);
    }
  }, [alumnosCurso]);

  useEffect(() => {
    cargarIntensificaciones();
    cargarPrevias();
  }, [cargarIntensificaciones, cargarPrevias]);

  const handleInputChange = (id, campo, valor) => {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)),
    );
  };

  const handleIntensifChange = (alumnoId, campo, valor) => {
    setIntensificaciones((prev) =>
      prev.map((f) =>
        f.alumnoId === alumnoId
          ? { ...f, registros: { ...f.registros, [campo]: valor } }
          : f,
      ),
    );
  };

  const handleGuardarIntensificaciones = async () => {
    const promesas = [];
    for (const fila of intensificaciones) {
      for (const { key } of PERIODOS_INTENSIFICACION) {
        const nota = fila.registros[key];
        if (nota === '' || nota === null || nota === undefined) continue;
        const registroId = fila.registroIds[key];
        if (registroId) {
          promesas.push(
            updateIntensificacionAcademica(registroId, { nota: Number(nota) }),
          );
        }
      }
    }
    if (promesas.length === 0) {
      toast.info('No hay intensificaciones para guardar.');
      return;
    }
    try {
      await Promise.all(promesas);
      toast.success('Intensificaciones guardadas exitosamente.');
      await cargarIntensificaciones();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(msg);
    }
  };

  const [previaSeleccion, setPreviaSeleccion] = useState({});
  const [previaNotas, setPreviaNotas] = useState({});

  const handlePreviaChange = (materiaAdeudadaId, valor) => {
    setPreviaNotas((prev) => ({ ...prev, [materiaAdeudadaId]: valor }));
  };

  const handleGuardarPrevias = async () => {
    const promesas = [];
    for (const p of previas) {
      const nota = previaNotas[p.materiaAdeudadaId];
      if (nota === '' || nota === null || nota === undefined) continue;
      promesas.push(
        rendirMateriaAdeudada(p.materiaAdeudadaId, {
          nota: Number(nota),
          periodo: previaSeleccion[p.materiaAdeudadaId] || 'DICIEMBRE_1',
          anio_rendicion: new Date().getFullYear(),
          id_docente: docenteId,
        }),
      );
    }
    if (promesas.length === 0) {
      toast.info('No hay notas de previas para guardar.');
      return;
    }
    try {
      await Promise.all(promesas);
      toast.success('Notas de previas guardadas exitosamente.');
      setPreviaNotas({});
      setPreviaSeleccion({});
      await cargarPrevias();
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(msg);
    }
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

      <div style={{ borderTop: '2px solid var(--border-color)', marginTop: '24px', paddingTop: '20px' }}>
        <div className="card-header-flex">
          <h3>Intensificaciones</h3>
          {puedeEditar && intensificaciones.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={handleGuardarIntensificaciones}>
              <i className="fas fa-save" aria-hidden="true" /> Guardar Intensificaciones
            </button>
          )}
        </div>

        {cargandoIntensif ? (
          <p className="empty-state-message">Cargando intensificaciones...</p>
        ) : intensificaciones.length === 0 ? (
          <p className="empty-state-message">No hay intensificaciones registradas para este curso/materia.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  {PERIODOS_INTENSIFICACION.map(({ key, label }) => (
                    <th key={key}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intensificaciones.map((fila) => (
                  <tr key={fila.alumnoId}>
                    <td className="table-cell-strong">{fila.nombre}</td>
                    {PERIODOS_INTENSIFICACION.map(({ key }) => (
                      <td key={key}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="input-table"
                          value={fila.registros[key] ?? ''}
                          onChange={(e) =>
                            handleIntensifChange(fila.alumnoId, key, clampNota(e.target.value))
                          }
                          disabled={!puedeEditar}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid var(--border-color)', marginTop: '24px', paddingTop: '20px' }}>
        <div className="card-header-flex">
          <h3>Previas</h3>
          {puedeEditar && previas.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={handleGuardarPrevias}>
              <i className="fas fa-save" aria-hidden="true" /> Guardar Notas de Previas
            </button>
          )}
        </div>

        {cargandoPrevias ? (
          <p className="empty-state-message">Cargando previas...</p>
        ) : previas.length === 0 ? (
          <p className="empty-state-message">No hay materias previas/adeudadas para este curso.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Materia</th>
                  <th>Curso Origen</th>
                  <th>Periodo de Rendición</th>
                  <th>Nota Previa</th>
                </tr>
              </thead>
              <tbody>
                {previas.map((p) => (
                  <tr key={`${p.alumnoId}-${p.materiaAdeudadaId}`}>
                    <td className="table-cell-strong">{p.alumnoNombre}</td>
                    <td>{p.materia}</td>
                    <td>{p.cursoOrigen}</td>
                    <td>
                      <select
                        className="select-table"
                        value={previaSeleccion[p.materiaAdeudadaId] || 'DICIEMBRE_1'}
                        onChange={(e) =>
                          setPreviaSeleccion((prev) => ({
                            ...prev,
                            [p.materiaAdeudadaId]: e.target.value,
                          }))
                        }
                        disabled={!puedeEditar}
                      >
                        <option value="MARZO">Marzo</option>
                        <option value="JULIO">Julio</option>
                        <option value="AGOSTO">Agosto</option>
                        <option value="DICIEMBRE_1">Diciembre 1</option>
                        <option value="DICIEMBRE_2">Diciembre 2</option>
                        <option value="FEBRERO">Febrero</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input-table"
                        value={previaNotas[p.materiaAdeudadaId] ?? ''}
                        onChange={(e) =>
                          handlePreviaChange(p.materiaAdeudadaId, clampNota(e.target.value))
                        }
                        disabled={!puedeEditar}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelAlumnos;
