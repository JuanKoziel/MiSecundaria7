import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  createAsistencia,
  getAsistenciasPreceptorMateria,
  patchJustificar,
  getAsistenciaDiaria,
  getRegistroDiario,
} from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import {
  alumnosPorAnioYCurso,
  fechaHoy,
  filtrosCompletos,
} from './preceptorUtils';

function getBadgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  if (estado === 'Retiro') return 'badge-tarde';
  return 'badge-tarde';
}

function estadoInicial() {
  return { estado: 'Presente', justificada: false };
}

function Asistencias({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const {
    inscripciones, alumnos, nombreCorto: nc,
    cursosObj, cursoMateria, estadosAsistencia,
    refreshData,
  } = useData();
  const { user } = useAuth();

  const [tab, setTab] = useState('dia');
  const [materiaCmId, setMateriaCmId] = useState('');
  const [fechaMateria, setFechaMateria] = useState('');
  const [alumnoMateria, setAlumnoMateria] = useState('');
  const [asistAlumnos, setAsistAlumnos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [dataMateria, setDataMateria] = useState([]);
  const [cargandoMateria, setCargandoMateria] = useState(false);
  const [dataDiaria, setDataDiaria] = useState([]);
  const [cargandoDiaria, setCargandoDiaria] = useState(false);
  const [regFecha, setRegFecha] = useState('');
  const [regAlumno, setRegAlumno] = useState('');
  const [dataRegistro, setDataRegistro] = useState([]);
  const [cargandoRegistro, setCargandoRegistro] = useState(false);

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);

  const cursoObjSel = useMemo(
    () => cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === Number(anioLectivo)),
    [cursosObj, curso, anioLectivo],
  );
  const cmCurso = useMemo(
    () => (cursoObjSel ? cursoMateria.filter((cm) => cm.id_curso === cursoObjSel.id_curso) : []),
    [cursoMateria, cursoObjSel],
  );

  const getAlumnoReg = (id) => asistAlumnos[id] ?? estadoInicial();
  const updateAlumno = (id, patch) => {
    setAsistAlumnos((prev) => ({
      ...prev,
      [id]: { ...getAlumnoReg(id), ...patch },
    }));
  };

  const cargarDiaria = useCallback(() => {
    if (!curso || !filtrosCompletos(anioLectivo, curso)) return;
    setCargandoDiaria(true);
    getAsistenciaDiaria(curso, fechaHoy())
      .then(setDataDiaria)
      .catch(() => setDataDiaria([]))
      .finally(() => setCargandoDiaria(false));
  }, [curso, anioLectivo]);

  useEffect(() => {
    if (tab === 'dia') cargarDiaria();
  }, [tab, cargarDiaria]);

  useEffect(() => {
    if (tab === 'materia' && materiaCmId) {
      setCargandoMateria(true);
      const params = {};
      if (fechaMateria) params.fecha = fechaMateria;
      if (alumnoMateria) params.alumno = alumnoMateria;
      getAsistenciasPreceptorMateria(materiaCmId, params)
        .then(setDataMateria)
        .catch(() => setDataMateria([]))
        .finally(() => setCargandoMateria(false));
    }
  }, [tab, materiaCmId, fechaMateria, alumnoMateria]);

  useEffect(() => {
    if (tab === 'dia' && curso && (regFecha || regAlumno)) {
      setCargandoRegistro(true);
      const params = {};
      if (regFecha) params.fecha = regFecha;
      if (regAlumno) params.alumno = regAlumno;
      getRegistroDiario(curso, params)
        .then(setDataRegistro)
        .catch(() => setDataRegistro([]))
        .finally(() => setCargandoRegistro(false));
    }
  }, [tab, curso, regFecha, regAlumno]);

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
          fecha: fechaHoy(),
          numero_modulo: null,
          id_estado_asistencia: estadoId,
          id_usuario: user?.id || 1,
        });
      });
      await Promise.all(promises);
      setMensaje('Asistencias guardadas exitosamente.');
      await refreshData();
      cargarDiaria();
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
      <div>
        <div className="card">
          <FiltrosAnioCurso
            anioLectivo={anioLectivo}
            curso={curso}
            onAnioChange={onAnioChange}
            onCursoChange={onCursoChange}
          />
        </div>
        <EmptyFiltros />
      </div>
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
        <h3>Control de Asistencia — {curso} ({anioLectivo})</h3>
      </div>

      <div className="asist-tipo-selector">
        <button
          type="button"
          className={`btn btn-sm ${tab === 'dia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('dia')}
        >
          Asistencia por día
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('materia')}
        >
          Asistencia por materia
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'docentes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('docentes')}
        >
          Asistencia de docentes
        </button>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      {tab === 'dia' && (
        <div>
          <div className="card-header-flex">
            <h3>Asistencias del día</h3>
            <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
              <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          <p style={{ color: '#888', margin: '0 0 12px' }}>
            Curso: {curso} — Fecha: {fechaHoy()}
          </p>

          {cargandoDiaria ? (
            <p>Cargando asistencias...</p>
          ) : dataDiaria.length === 0 ? (
            <p className="empty-state-message">No hay asistencias registradas para hoy.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {dataDiaria.map((r) => (
                    <tr key={r.id_alumno}>
                      <td className="table-cell-strong">{r.alumno_nombre}</td>
                      <td>
                        <span className={`badge ${
                          r.estado === 'Presente' ? 'badge-presente' :
                          r.estado === 'Ausente' ? 'badge-ausente' :
                          r.estado === 'Tarde' ? 'badge-tarde' :
                          r.estado === 'Retiro' ? 'badge-tarde' : ''
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card mt-16">
            <div className="card-header-flex">
              <h3>Registro</h3>
            </div>

            <div className="filter-row">
              <div className="form-group-filter">
                <label htmlFor="reg-fecha">Fecha</label>
                <input
                  id="reg-fecha"
                  type="date"
                  value={regFecha}
                  onChange={(e) => setRegFecha(e.target.value)}
                />
              </div>
              <div className="form-group-filter">
                <label htmlFor="reg-alumno">Alumno</label>
                <select
                  id="reg-alumno"
                  value={regAlumno}
                  onChange={(e) => setRegAlumno(e.target.value)}
                >
                  <option value="">Todos...</option>
                  {listaAlumnos.map((a) => (
                    <option key={a.id} value={a.id}>{nc(a)}</option>
                  ))}
                </select>
              </div>
            </div>

            {!regFecha && !regAlumno ? (
              <p className="empty-state-message">Seleccioná una fecha o un alumno para ver registros.</p>
            ) : cargandoRegistro ? (
              <p>Cargando registros...</p>
            ) : dataRegistro.length === 0 ? (
              <p className="empty-state-message">No hay registros para los filtros seleccionados.</p>
            ) : (
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
                    {dataRegistro.map((r) => (
                      <tr key={r.id}>
                        <td>{r.fecha}</td>
                        <td className="table-cell-strong">{r.alumno_nombre}</td>
                        <td>
                          <span className={`badge ${
                            r.estado === 'Presente' ? 'badge-presente' :
                            r.estado === 'Ausente' ? 'badge-ausente' :
                            r.estado === 'Tarde' ? 'badge-tarde' :
                            r.estado === 'Retiro' ? 'badge-tarde' : ''
                          }`}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'materia' && (
        <div>
          <p className="asist-info-banner">
            <i className="fas fa-info-circle" aria-hidden="true" /> Como preceptor solo podés
            <strong> visualizar</strong> la asistencia por materia. La carga la realiza el docente.
          </p>

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
              <label htmlFor="fecha-materia-prec">Fecha</label>
              <input
                id="fecha-materia-prec"
                type="date"
                value={fechaMateria}
                onChange={(e) => setFechaMateria(e.target.value)}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="alumno-materia-prec">Alumno</label>
              <select
                id="alumno-materia-prec"
                value={alumnoMateria}
                onChange={(e) => setAlumnoMateria(e.target.value)}
              >
                <option value="">Todos...</option>
                {listaAlumnos.map((a) => (
                  <option key={a.id} value={a.id}>{nc(a)}</option>
                ))}
              </select>
            </div>
          </div>

          {!materiaCmId ? (
            <p className="empty-state-message">Seleccione una materia para ver las asistencias.</p>
          ) : cargandoMateria ? (
            <p>Cargando asistencias...</p>
          ) : dataMateria.length === 0 ? (
            <p className="empty-state-message">No hay asistencias registradas para esta materia con los filtros seleccionados.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Docente</th>
                    <th>Estado</th>
                    <th>Hora de carga</th>
                    <th>Justificado</th>
                  </tr>
                </thead>
                <tbody>
                  {dataMateria.map((r, idx) => {
                    const puedeJustificar = r.estado_nombre !== 'Presente' && r.estado_nombre !== 'Sin registro' && r.id;
                    return (
                      <tr key={r.id ?? `sin-reg-${idx}`}>
                        <td className="table-cell-strong">{r.alumno_nombre}</td>
                        <td>{r.fecha || '-'}</td>
                        <td className="nowrap">{r.horario}</td>
                        <td>{r.docente_nombre}</td>
                        <td>
                          <span className={`badge ${
                            r.estado_nombre === 'Presente' ? 'badge-presente' :
                            r.estado_nombre === 'Ausente' ? 'badge-ausente' :
                            r.estado_nombre === 'Tarde' ? 'badge-tarde' :
                            r.estado_nombre === 'Retiro' ? 'badge-tarde' : ''
                          }`}>
                            {r.estado_nombre}
                          </span>
                        </td>
                        <td>{r.hora_carga || '-'}</td>
                        <td>
                          {puedeJustificar ? (
                            <label className="cb-label" style={{ cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={r.justificado}
                                onChange={async (e) => {
                                  const nuevoValor = e.target.checked;
                                  setDataMateria((prev) =>
                                    prev.map((x) =>
                                      x.id === r.id ? { ...x, justificado: nuevoValor } : x,
                                    ),
                                  );
                                  try {
                                    await patchJustificar(r.id, nuevoValor);
                                  } catch {
                                    setDataMateria((prev) =>
                                      prev.map((x) =>
                                        x.id === r.id ? { ...x, justificado: !nuevoValor } : x,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <span>Sí</span>
                            </label>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'docentes' && (
        <div>
          <p className="empty-state-message">Próximamente.</p>
        </div>
      )}
    </div>
  );
}

export default Asistencias;
