import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { createAsistencia } from '../../services/api';
import { MODULOS, diaSemanaNombre } from '../../utils/modulos';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import {
  alumnosPorAnioYCurso,
  docentesDelCurso,
  fechaHoy,
  filtrosCompletos,
  nombreDocente,
} from './preceptorUtils';

const ESTADOS = ['Presente', 'Ausente', 'Tarde'];

function getBadgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function estadoInicial() {
  return { estado: 'Presente', justificada: false };
}

function docenteInicial() {
  return {
    estado: 'Presente',
    justificada: false,
    ajusteTipo: '',
    ajusteHoras: '',
  };
}

function diaDeFecha(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  return diaSemanaNombre(new Date(y, (m || 1) - 1, d || 1));
}

function Asistencias({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { inscripciones, alumnos, docentes, asignacionesDocente, nombreCorto, cursosObj, cursoMateria, estadosAsistencia, asistenciasAdmin, horarios, refreshData } = useData();
  const { user } = useAuth();
  const [fecha, setFecha] = useState(fechaHoy);
  const [tab, setTab] = useState('alumnos');
  const [tipoAsist, setTipoAsist] = useState(() => {
    const saved = sessionStorage.getItem('preceptor_asistencia_tipo');
    return saved || 'general';
  });
  const [materiaCmId, setMateriaCmId] = useState('');
  const [numModulo, setNumModulo] = useState('');
  const [asistAlumnos, setAsistAlumnos] = useState({});
  const [asistDocentes, setAsistDocentes] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    sessionStorage.setItem('preceptor_asistencia_tipo', tipoAsist);
  }, [tipoAsist]);

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);
  const listaDocentes = docentesDelCurso(anioLectivo, curso, docentes, asignacionesDocente);

  const cursoObjSel = useMemo(
    () => cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === Number(anioLectivo)),
    [cursosObj, curso, anioLectivo],
  );
  const cmCurso = useMemo(
    () => (cursoObjSel ? cursoMateria.filter((cm) => cm.id_curso === cursoObjSel.id_curso) : []),
    [cursoMateria, cursoObjSel],
  );
  const diaSel = diaDeFecha(fecha);
  const horarioMateria = useMemo(() => {
    if (!materiaCmId || !numModulo) return null;
    return horarios.find(
      (h) =>
        h.id_curso_materia === Number(materiaCmId) &&
        h.dia_semana === diaSel &&
        h.numero_modulo === Number(numModulo),
    ) || null;
  }, [horarios, materiaCmId, numModulo, diaSel]);

  const asistMateria = useMemo(() => {
    if (!materiaCmId || !numModulo) return [];
    return asistenciasAdmin.filter(
      (a) =>
        a.fecha === fecha &&
        a.id_curso_materia === Number(materiaCmId) &&
        a.numero_modulo === Number(numModulo),
    );
  }, [asistenciasAdmin, fecha, materiaCmId, numModulo]);

  const registroAlumnos = useMemo(() => {
    const alumnoIds = new Set(listaAlumnos.map((a) => a.id));
    return asistenciasAdmin
      .filter((a) => alumnoIds.has(a.alumnoId))
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [asistenciasAdmin, listaAlumnos]);

  const historialPorDia = useMemo(() => {
    if (!cursoObjSel) return [];
    const fechasUnicas = [...new Set(asistenciasAdmin.filter(a => a.curso === curso && a.tipo === 'general').map(a => a.fecha))];
    return fechasUnicas.map(fecha => {
      const asistenciasFecha = asistenciasAdmin.filter(a => a.curso === curso && a.fecha === fecha && a.tipo === 'general');
      const presentes = asistenciasFecha.filter(a => a.estado === 'Presente').length;
      const ausentes = asistenciasFecha.filter(a => a.estado === 'Ausente').length;
      const estadoGeneral = presentes > ausentes ? 'Bueno' : presentes < ausentes ? 'Atención' : 'Regular';
      return {
        fecha,
        curso,
        presentes,
        ausentes,
        estadoGeneral
      };
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [asistenciasAdmin, curso, cursoObjSel]);

  const historialPorMateria = useMemo(() => {
    if (!cursoObjSel) return [];
    return asistenciasAdmin
      .filter(a => a.curso === curso && a.tipo === 'materia')
      .map(a => ({
        fecha: a.fecha,
        curso: a.curso,
        materia: a.materia,
        modulo: a.numero_modulo ? `Módulo ${a.numero_modulo}` : '—',
        docente: a.docente_nombre || '—',
        estado: a.estado
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [asistenciasAdmin, curso, cursoObjSel]);

  const asistenciasCargadasHoy = useMemo(() => {
    return registroAlumnos.filter((a) => a.fecha === fecha).length > 0;
  }, [registroAlumnos, fecha]);

  const getAlumnoReg = (id) => asistAlumnos[id] ?? estadoInicial();
  const getDocenteReg = (id) => asistDocentes[id] ?? docenteInicial();

  const updateAlumno = (id, patch) => {
    setAsistAlumnos((prev) => ({
      ...prev,
      [id]: { ...getAlumnoReg(id), ...patch },
    }));
  };

  const updateDocente = (id, patch) => {
    setAsistDocentes((prev) => ({
      ...prev,
      [id]: { ...getDocenteReg(id), ...patch },
    }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      const anio = Number(anioLectivo);
      const cursoObj = cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === anio);
      if (!cursoObj) {
        setMensaje('No se encontró el curso seleccionado para ese año lectivo.');
        setGuardando(false);
        return;
      }
      const cmList = cursoMateria.filter((cm) => cm.id_curso === cursoObj.id_curso);
      const primerCm = cmList[0];
      if (!primerCm) {
        setMensaje('No hay materias asignadas a este curso.');
        setGuardando(false);
        return;
      }
      const estadoMap = {};
      estadosAsistencia.forEach((e) => { estadoMap[e.nombre_estado] = e.id_estado_asistencia; });
      const promises = listaAlumnos.map((a) => {
        const reg = getAlumnoReg(a.id);
        const estadoId = estadoMap[reg.estado] || estadosAsistencia[0]?.id_estado_asistencia || 1;
        return createAsistencia({
          id_alumno: a.id,
          id_curso_materia: primerCm.id,
          fecha,
          numero_modulo: null,
          id_estado_asistencia: estadoId,
          id_usuario: user?.id || 1,
        });
      });
      await Promise.all(promises);
      setMensaje('Asistencias guardadas exitosamente.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  if (!filtrosCompletos(anioLectivo, curso)) {
    return (
      <>
        <div className="card">
          <FiltrosAnioCurso
            anioLectivo={anioLectivo}
            curso={curso}
            onAnioChange={onAnioChange}
            onCursoChange={onCursoChange}
          />
        </div>
        <EmptyFiltros />
      </>
    );
  }

  return (
    <div className="card">
      <FiltrosAnioCurso
        anioLectivo={anioLectivo}
        curso={curso}
        onAnioChange={onAnioChange}
        onCursoChange={onCursoChange}
      />

      <div className="card-header-flex">
        <h3>
          Control de Asistencia — {curso} ({anioLectivo})
        </h3>
        {tipoAsist === 'general' && (
          <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
            <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>

      <div className="asist-tipo-selector">
        <button
          type="button"
          className={`btn btn-sm ${tipoAsist === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTipoAsist('general')}
        >
          Asistencia General del Día
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tipoAsist === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTipoAsist('materia')}
        >
          Asistencia por Materia
        </button>
      </div>

      {tipoAsist === 'materia' && (
        <p className="asist-info-banner">
          <i className="fas fa-info-circle" aria-hidden="true" /> Como preceptor solo podés
          <strong> visualizar</strong> la asistencia por materia. La carga la realiza el docente.
        </p>
      )}

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      <div className="global-field-box">
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fecha-asistencia-preceptor">Fecha</label>
            <input
              id="fecha-asistencia-preceptor"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

      {asistenciasCargadasHoy && (
        <p style={{ color: '#2196F3', margin: '8px 0', fontWeight: 500 }}>
          <i className="fas fa-check-circle" aria-hidden="true" /> Ya se cargaron asistencias para la fecha {fecha}.
        </p>
      )}

      {tipoAsist === 'materia' && (
        <>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="materia-asist-prec">Materia</label>
              <select
                id="materia-asist-prec"
                value={materiaCmId}
                onChange={(e) => setMateriaCmId(e.target.value)}
              >
                <option value="">Seleccione materia...</option>
                {cmCurso.map((cm) => (
                  <option key={cm.id} value={cm.id}>
                    {cm.materia_nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-filter">
              <label htmlFor="modulo-asist-prec">Módulo</label>
              <select
                id="modulo-asist-prec"
                value={numModulo}
                onChange={(e) => setNumModulo(e.target.value)}
              >
                <option value="">Seleccione módulo...</option>
                {MODULOS.map((m) => (
                  <option key={m.numero} value={m.numero}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-filter filtro-orientacion">
              <span className="badge">Día: {diaSel || '—'}</span>
            </div>
          </div>

          {materiaCmId && numModulo && !horarioMateria && (
            <p className="asist-info-banner asist-bloqueado">
              <i className="fas fa-ban" aria-hidden="true" /> Esta materia no posee clases
              programadas para este día y horario.
            </p>
          )}

          {materiaCmId && numModulo && horarioMateria && (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {listaAlumnos.map((a) => {
                    const reg = asistMateria.find((r) => r.alumnoId === a.id);
                    const estado = reg?.estado || 'Sin registro';
                    return (
                      <tr key={a.id}>
                        <td className="table-cell-strong">{nombreCorto(a)}</td>
                        <td>
                          <span
                            className={`badge ${estado === 'Sin registro' ? '' : getBadgeClass(estado)}`}
                          >
                            {estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tipoAsist === 'general' && (
      <div className="preceptor-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'alumnos'}
          className={`preceptor-tab ${tab === 'alumnos' ? 'preceptor-tab--active' : ''}`}
          onClick={() => setTab('alumnos')}
        >
          Alumnos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'docentes'}
          className={`preceptor-tab ${tab === 'docentes' ? 'preceptor-tab--active' : ''}`}
          onClick={() => setTab('docentes')}
        >
          Docentes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'registro'}
          className={`preceptor-tab ${tab === 'registro' ? 'preceptor-tab--active' : ''}`}
          onClick={() => setTab('registro')}
        >
          Registro
        </button>
      </div>
      )}

      {tipoAsist === 'general' && tab === 'alumnos' && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Estado</th>
                <th>Justificada</th>
              </tr>
            </thead>
            <tbody>
              {listaAlumnos.map((a) => {
                const reg = getAlumnoReg(a.id);
                const puedeJustificar = reg.estado !== 'Presente';
                return (
                  <tr key={a.id}>
                    <td className="table-cell-strong">{nombreCorto(a)}</td>
                    <td>
                      <div
                        className="cb-container"
                        role="radiogroup"
                        aria-label={`Asistencia de ${nombreCorto(a)}`}
                      >
                        {ESTADOS.map((tipo) => (
                          <label key={tipo} className="cb-label">
                            <input
                              type="radio"
                              name={`asist-alumno-${a.id}`}
                              checked={reg.estado === tipo}
                              onChange={() =>
                                updateAlumno(a.id, {
                                  estado: tipo,
                                  justificada: tipo === 'Presente' ? false : reg.justificada,
                                })
                              }
                            />
                            <span className={`badge ${getBadgeClass(tipo)}`}>{tipo}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td>
                      <label className="cb-label">
                        <input
                          type="checkbox"
                          checked={reg.justificada}
                          disabled={!puedeJustificar}
                          onChange={(e) =>
                            updateAlumno(a.id, { justificada: e.target.checked })
                          }
                        />
                        <span>justificada</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tipoAsist === 'general' && tab === 'docentes' && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Docente</th>
                <th>Materia</th>
                <th>Estado</th>
                <th>Justificada</th>
                <th>Ajuste de horas</th>
              </tr>
            </thead>
            <tbody>
              {listaDocentes.map((d) => {
                const reg = getDocenteReg(d.id);
                const puedeJustificar = reg.estado !== 'Presente';
                return (
                  <tr key={d.id}>
                    <td className="table-cell-strong">{nombreDocente(d)}</td>
                    <td>{d.materia}</td>
                    <td>
                      <div
                        className="cb-container"
                        role="radiogroup"
                        aria-label={`Asistencia de ${nombreDocente(d)}`}
                      >
                        {ESTADOS.map((tipo) => (
                          <label key={tipo} className="cb-label">
                            <input
                              type="radio"
                              name={`asist-docente-${d.id}`}
                              checked={reg.estado === tipo}
                              onChange={() =>
                                updateDocente(d.id, {
                                  estado: tipo,
                                  justificada:
                                    tipo === 'Presente' ? false : reg.justificada,
                                })
                              }
                            />
                            <span className={`badge ${getBadgeClass(tipo)}`}>{tipo}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td>
                      <label className="cb-label">
                        <input
                          type="checkbox"
                          checked={reg.justificada}
                          disabled={!puedeJustificar}
                          onChange={(e) =>
                            updateDocente(d.id, { justificada: e.target.checked })
                          }
                        />
                        <span>justificada</span>
                      </label>
                    </td>
                    <td>
                      <div className="field-row" style={{ margin: 0 }}>
                        <select
                          className="select-table"
                          value={reg.ajusteTipo}
                          onChange={(e) =>
                            updateDocente(d.id, { ajusteTipo: e.target.value })
                          }
                        >
                          <option value="">Sin ajuste</option>
                          <option value="adelanto">Adelantó horas</option>
                          <option value="atraso">Atrasó horas</option>
                        </select>
                        {reg.ajusteTipo && (
                          <input
                            type="number"
                            min="1"
                            max="8"
                            className="input-table"
                            placeholder="Hs"
                            value={reg.ajusteHoras}
                            onChange={(e) =>
                              updateDocente(d.id, { ajusteHoras: e.target.value })
                            }
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tipoAsist === 'general' && tab === 'registro' && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Alumno</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {registroAlumnos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state-message">
                    No hay registros de asistencia para este curso.
                  </td>
                </tr>
              ) : (
                registroAlumnos.map((r) => {
                  const alumno = listaAlumnos.find((a) => a.id === r.alumnoId);
                  return (
                    <tr key={r.id}>
                      <td>{r.fecha}</td>
                      <td className="table-cell-strong">
                        {alumno ? nombreCorto(alumno) : `Alumno #${r.alumnoId}`}
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(r.estado)}`}>{r.estado}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {tipoAsist === 'general' && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header-flex">
            <h3>Historial de Asistencias</h3>
          </div>

          <div className="asist-tipo-selector" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={`btn btn-sm ${tipoAsist === 'general' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTipoAsist('general')}
            >
              Por Día
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tipoAsist === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTipoAsist('materia')}
            >
              Por Materia
            </button>
          </div>

          {tipoAsist === 'general' ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Curso</th>
                    <th>Presentes</th>
                    <th>Ausentes</th>
                    <th>Estado General</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPorDia.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state-message">
                        No hay registros de historial por día.
                      </td>
                    </tr>
                  ) : (
                    historialPorDia.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.fecha}</td>
                        <td>{h.curso}</td>
                        <td>{h.presentes}</td>
                        <td>{h.ausentes}</td>
                        <td>
                          <span className={`badge ${h.estadoGeneral === 'Bueno' ? 'badge-presente' : h.estadoGeneral === 'Atención' ? 'badge-ausente' : 'badge-tarde'}`}>
                            {h.estadoGeneral}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Curso</th>
                    <th>Materia</th>
                    <th>Módulo</th>
                    <th>Docente</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPorMateria.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state-message">
                        No hay registros de historial por materia.
                      </td>
                    </tr>
                  ) : (
                    historialPorMateria.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.fecha}</td>
                        <td>{h.curso}</td>
                        <td>{h.materia}</td>
                        <td>{h.modulo}</td>
                        <td>{h.docente}</td>
                        <td>
                          <span className={`badge ${getBadgeClass(h.estado)}`}>
                            {h.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Asistencias;
