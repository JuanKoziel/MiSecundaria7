import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  createCalificacion,
  updateCalificacion,
  getIntensificacionesAcademicas,
  updateIntensificacionAcademica,
  createIntensificacionAcademica,
  getHistorialAcademico,
  getMateriasAdeudadas,
  getRegistroRendicionesPrevias,
  rendirMateriaAdeudada,
} from '../../services/api';
import {
  PERIODOS_RENDICION,
  PERIODO_LABELS,
  proximoPeriodoEditable,
  notaGuardada,
} from '../../utils/previasRendicion';
import {
  PERIODOS_INTENSIFICACION,
  TIPO_POR_BUCKET,
  clampNota,
  tiposIntensifHabilitados,
  cambiosIntensificaciones,
} from '../../utils/intensificaciones';

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
      const alumnoIds = new Set(alumnosCurso.map((a) => a.id));
      const allData = await getIntensificacionesAcademicas();
      const data = Array.isArray(allData) ? allData : allData.results || [];
      // Solo las instancias de la materia del panel actual y de alumnos del curso.
      const intensifMateria = data.filter(
        (i) => alumnoIds.has(i.id_alumno) && i.materia_nombre === materiaNombre,
      );
      const calsCm = calificacionesCompletas.filter(
        (c) => c.id_curso_materia === cursoMateriaId,
      );

      // Historial académico: fuente del id_historial (necesario al CREAR una
      // intensificación nueva) y de las notas de cuatrimestre para las reglas.
      const histData = await getHistorialAcademico();
      const histList = Array.isArray(histData) ? histData : histData.results || [];
      const histPorAlumno = new Map();
      histList.forEach((h) => {
        if (!histPorAlumno.has(h.id_alumno)) {
          histPorAlumno.set(h.id_alumno, h);
        }
      });

      const filasIntensif = alumnosCurso.map((alumno) => {
        const hist = histPorAlumno.get(alumno.id) || null;
        const cal1 = calsCm.find(
          (c) => c.id_alumno === alumno.id && c.id_periodo === periodo1?.id_periodo,
        );
        const cal2 = calsCm.find(
          (c) => c.id_alumno === alumno.id && c.id_periodo === periodo2?.id_periodo,
        );
        const nota1Cal = cal1?.nota_numerica != null ? Number(cal1.nota_numerica) : null;
        const nota2Cal = cal2?.nota_numerica != null ? Number(cal2.nota_numerica) : null;
        // Fallback a las notas de cuatrimestre del historial (fuente autoritativa).
        const nota1 =
          nota1Cal != null
            ? nota1Cal
            : hist?.nota_1_cuatrimestre != null
              ? Number(hist.nota_1_cuatrimestre)
              : null;
        const nota2 =
          nota2Cal != null
            ? nota2Cal
            : hist?.nota_2_cuatrimestre != null
              ? Number(hist.nota_2_cuatrimestre)
              : null;

        const instancias = intensifMateria
          .filter((i) => i.id_alumno === alumno.id)
          .map((i) => ({
            id: i.id_intensificacion,
            idHistorial: i.id_historial,
            periodo: i.periodo,
            anio: i.anio_rendicion,
            nota: i.nota != null ? Number(i.nota) : null,
            estado: i.estado || 'PENDIENTE',
          }));

        // Reglas académicas: habilita solo lo que corresponde (todo bloqueado por defecto).
        const habilitados = tiposIntensifHabilitados(nota1, nota2, instancias);

        // id_historial: primero desde el historial, luego desde una instancia previa.
        const idHistorial = hist?.id_historial ?? instancias[0]?.idHistorial ?? null;

        // Id de la instancia por período (para guardar la nota sobre ella).
        const registroIds = {};
        instancias.forEach((ins) => {
          registroIds[ins.periodo] = ins.id;
        });

        // Estado local de los inputs, por columna (estructura original de 3).
        const registros = {};
        PERIODOS_INTENSIFICACION.forEach(({ key }) => {
          registros[key] = '';
        });

        return {
          alumnoId: alumno.id,
          nombre: `${alumno.apellido}, ${alumno.nombre}`,
          nota1,
          nota2,
          instancias,
          idHistorial,
          habilitados,
          registros,
          registroIds,
        };
      });

      setIntensificaciones(filasIntensif);
    } catch {
      setIntensificaciones([]);
    } finally {
      setCargandoIntensif(false);
    }
  }, [alumnosCurso, materiaNombre, calificacionesCompletas, cursoMateriaId, periodo1, periodo2]);

  const cargarPrevias = useCallback(async () => {
    if (!alumnosCurso.length) return;
    setCargandoPrevias(true);
    try {
      const [maData, regData] = await Promise.all([
        getMateriasAdeudadas(),
        getRegistroRendicionesPrevias(),
      ]);
      const deudas = Array.isArray(maData) ? maData : maData.results || [];
      const registros = Array.isArray(regData) ? regData : regData.results || [];
      const alumnoIds = new Set(alumnosCurso.map((a) => a.id));

      // Histórico de rendiciones indexado por materia adeudada.
      const rendicionesPorMateria = {};
      registros.forEach((r) => {
        const clave = r.id_materia_adeudada;
        if (!rendicionesPorMateria[clave]) rendicionesPorMateria[clave] = [];
        rendicionesPorMateria[clave].push({
          periodo: r.periodo,
          anio: r.anio_rendicion,
          nota: r.nota,
          resultado: r.resultado,
          cursoOrigen: r.curso_origen_nombre || '',
        });
      });

      // Todas las materias previas (ADEUDADA y APROBADA) para que las
      // aprobadas sigan visibles en el histórico.
      const previasAlumnos = deudas.filter(
        (p) => alumnoIds.has(p.id_alumno) && p.tipo_deuda === 'PREVIA',
      );

      const filasPrevias = previasAlumnos.map((p) => {
        const alumno = alumnosCurso.find((a) => a.id === p.id_alumno);
        return {
          alumnoId: p.id_alumno,
          alumnoNombre: alumno ? `${alumno.apellido}, ${alumno.nombre}` : '',
          materia: p.materia_nombre || '—',
          materiaAdeudadaId: p.id_materia_adeudada,
          cursoOrigen: p.curso_origen_nombre || '',
          estado: p.estado || 'ADEUDADA',
          rendiciones: rendicionesPorMateria[p.id_materia_adeudada] || [],
        };
      });

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
    const anio = new Date().getFullYear();
    const cambios = cambiosIntensificaciones(intensificaciones, anio, cursoMateriaId);
    if (cambios.length === 0) {
      toast.info('No hay intensificaciones para guardar.');
      return;
    }
    const promesas = cambios.map((c) =>
      c.tipo === 'update'
        ? updateIntensificacionAcademica(c.id, c.payload)
        : createIntensificacionAcademica(c.payload),
    );
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

  const [previaNotas, setPreviaNotas] = useState({});
  const [previaAnios, setPreviaAnios] = useState({});

  const previaCellKey = (id, periodo) => `${id}::${periodo}`;

  const anioPorDefecto = () => new Date().getFullYear();

  const handlePreviaNotaChange = (materiaAdeudadaId, periodo, valor) => {
    setPreviaNotas((prev) => ({
      ...prev,
      [previaCellKey(materiaAdeudadaId, periodo)]: valor,
    }));
  };

  const handlePreviaAnioChange = (materiaAdeudadaId, periodo, valor) => {
    setPreviaAnios((prev) => ({
      ...prev,
      [previaCellKey(materiaAdeudadaId, periodo)]: valor,
    }));
  };

  const handleGuardarPrevias = async () => {
    const promesas = [];
    for (const p of previas) {
      for (const per of PERIODOS_RENDICION) {
        const clave = previaCellKey(p.materiaAdeudadaId, per);
        const nota = previaNotas[clave];
        if (nota === '' || nota === null || nota === undefined) continue;
        const anio = previaAnios[clave] || anioPorDefecto();
        promesas.push(
          rendirMateriaAdeudada(p.materiaAdeudadaId, {
            nota: Number(nota),
            periodo: per,
            anio_rendicion: Number(anio),
            id_docente: docenteId,
          }),
        );
      }
    }
    if (promesas.length === 0) {
      toast.info('No hay notas de previas para guardar.');
      return;
    }
    try {
      await Promise.all(promesas);
      toast.success('Notas de previas guardadas exitosamente.');
      setPreviaNotas({});
      setPreviaAnios({});
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
                    {PERIODOS_INTENSIFICACION.map(({ key, periodos }) => {
                      const tipo = TIPO_POR_BUCKET[key];
                      const habilitado = fila.habilitados[tipo];
                      const delBucket = (fila.instancias || []).filter((ins) =>
                        periodos.includes(ins.periodo),
                      );
                      const notaActual =
                        delBucket.length > 0 ? delBucket[delBucket.length - 1].nota : null;
                      const valor = fila.registros[key] ?? '';
                      const persisteNota = notaActual != null && valor === '' ? notaActual : valor;
                      return (
                        <td key={key}>
                          {delBucket.length > 0 && (
                            <div className="intensif-historial">
                              {delBucket.map((ins, i) => (
                                <span key={i} className="intensif-histNota">
                                  {PERIODO_LABELS[ins.periodo] || ins.periodo} {ins.anio} →{' '}
                                  {ins.nota != null ? Number(ins.nota) : '—'}
                                  {ins.estado === 'APROBADA' ? ' (Aprobada)' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {habilitado ? (
                            <input
                              type="number"
                              min="1"
                              max="10"
                              className="input-table"
                              value={persisteNota}
                              disabled={!puedeEditar}
                              onChange={(e) =>
                                handleIntensifChange(fila.alumnoId, key, clampNota(e.target.value))
                              }
                            />
                          ) : (
                            <span className="intensif-bloqueado">Bloqueado</span>
                          )}
                        </td>
                      );
                    })}
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
                  <th>Estado</th>
                  <th>Aprobó en</th>
                  {PERIODOS_RENDICION.map((per) => (
                    <th key={per} className="previa-cell-center">{PERIODO_LABELS[per]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previas.map((p) => {
                  const proximo = proximoPeriodoEditable(p);
                  const aprobadoPeriodo = (p.rendiciones || []).find(
                    (r) => r.resultado === 'APROBADA',
                  );
                  return (
                    <tr key={`${p.alumnoId}-${p.materiaAdeudadaId}`}>
                      <td className="table-cell-strong">{p.alumnoNombre}</td>
                      <td>{p.materia}</td>
                      <td>{p.cursoOrigen}</td>
                      <td>
                        <span className={`badge ${p.estado === 'APROBADA' ? 'badge-success' : 'badge-warning'}`}>
                          {p.estado === 'APROBADA' ? 'Aprobada' : 'Adeudada'}
                        </span>
                      </td>
                      <td>
                        {aprobadoPeriodo
                          ? `${PERIODO_LABELS[aprobadoPeriodo.periodo]} ${aprobadoPeriodo.anio}`
                          : '—'}
                      </td>
                      {PERIODOS_RENDICION.map((per) => {
                        const guardadas = (p.rendiciones || []).filter((r) => r.periodo === per);
                        const editable = puedeEditar && per === proximo;
                        const clave = previaCellKey(p.materiaAdeudadaId, per);
                        const anioSel = previaAnios[clave] || anioPorDefecto();
                        const valor = previaNotas[clave] ?? '';
                        const persisteNota = notaGuardada(p.rendiciones, per, anioSel);
                        return (
                          <td key={per} className="previa-cell-center">
                            {guardadas.length > 0 && (
                              <div className="previa-saved-list">
                                {guardadas.map((g, i) => (
                                  <span
                                    key={i}
                                    className={`badge ${g.resultado === 'APROBADA' ? 'badge-success' : 'badge-secondary'}`}
                                    title={`${PERIODO_LABELS[g.periodo]} ${g.anio} · ${g.resultado}`}
                                  >
                                    {Number(g.nota)} ({g.anio})
                                  </span>
                                ))}
                              </div>
                            )}
                            {editable ? (
                              <div className="previa-input-group">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  className="input-table"
                                  value={persisteNota != null && valor === '' ? persisteNota : valor}
                                  onChange={(e) =>
                                    handlePreviaNotaChange(
                                      p.materiaAdeudadaId,
                                      per,
                                      clampNota(e.target.value),
                                    )
                                  }
                                />
                                <input
                                  type="number"
                                  min="2000"
                                  max="2100"
                                  className="input-table previa-anio"
                                  value={anioSel}
                                  onChange={(e) =>
                                    handlePreviaAnioChange(p.materiaAdeudadaId, per, e.target.value)
                                  }
                                />
                              </div>
                            ) : (
                              <span className="previa-bloqueado">
                                {p.estado === 'APROBADA'
                                  ? 'Previa aprobada'
                                  : guardadas.length > 0
                                    ? '—'
                                    : 'Bloqueado: períodos previos'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelAlumnos;
