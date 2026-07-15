import { useMemo, useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import {
  getAsistenciasPreceptorMateria,
  patchJustificar,
  getAsistenciaDiaria,
  getRegistroDiario,
  getServerTime,
} from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  if (estado === 'Retiro') return 'badge-tarde';
  return 'badge-tarde';
}

function Asistencias() {
  const {
    alumnos,
    cursosObj,
    cursoMateria,
    nombreCorto,
  } = useData();

  const [curso, setCurso] = useState('');
  const [tab, setTab] = useState('dia');
  const [materiaCmId, setMateriaCmId] = useState('');
  const [fechaMateria, setFechaMateria] = useState('');
  const [alumnoMateria, setAlumnoMateria] = useState('');
  const [dataMateria, setDataMateria] = useState([]);
  const [cargandoMateria, setCargandoMateria] = useState(false);
  const [dataDiaria, setDataDiaria] = useState([]);
  const [cargandoDiaria, setCargandoDiaria] = useState(false);
  const [regFecha, setRegFecha] = useState('');
  const [regAlumno, setRegAlumno] = useState('');
  const [dataRegistro, setDataRegistro] = useState([]);
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);

  const cursoObjSel = useMemo(
    () => cursosObj.find((c) => c.nombre_curso === curso),
    [cursosObj, curso],
  );
  const cmCurso = useMemo(
    () => (cursoObjSel ? cursoMateria.filter((cm) => cm.id_curso === cursoObjSel.id_curso) : []),
    [cursoMateria, cursoObjSel],
  );

  const listaAlumnos = useMemo(
    () => alumnos.filter((a) => a.curso === curso).sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '')),
    [alumnos, curso],
  );

  const handleCursoChange = (nuevoCurso) => {
    setCurso(nuevoCurso);
    setMateriaCmId('');
    setFechaMateria('');
    setAlumnoMateria('');
  };

  const today = new Date().toISOString().slice(0, 10);

  const cargarDiaria = useCallback(() => {
    if (!curso) return;
    setCargandoDiaria(true);
    getAsistenciaDiaria(curso, today)
      .then(setDataDiaria)
      .catch(() => setDataDiaria([]))
      .finally(() => setCargandoDiaria(false));
  }, [curso]);

  useEffect(() => {
    if (tab === 'dia' && curso) cargarDiaria();
  }, [tab, curso, cargarDiaria]);

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

  useEffect(() => {
    getServerTime().then(setServerInfo).catch(() => setServerInfo(null));
  }, []);

  return (
    <div className="card">
      {serverInfo?.evento_activo && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', textAlign: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '480px' }}>
            <div style={{ fontSize: '3em', marginBottom: '16px' }}>&#128683;</div>
            <h3 style={{ marginBottom: '12px', color: '#dc3545' }}>No es posible registrar asistencias</h3>
            <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
              Actualmente existe un evento institucional activo.
            </p>
            <p style={{ color: '#555', lineHeight: '1.6', marginTop: '8px', marginBottom: 0 }}>
              Evento: <strong style={{ color: '#333' }}>{serverInfo.evento_tipo}</strong>
            </p>
            {serverInfo.evento_descripcion && (
              <p style={{ color: '#555', lineHeight: '1.6', marginTop: '4px', marginBottom: 0 }}>
                Descripción: <strong style={{ color: '#333' }}>{serverInfo.evento_descripcion}</strong>
              </p>
            )}
            {serverInfo.evento_horario && (
              <p style={{ color: '#555', lineHeight: '1.6', marginTop: '4px', marginBottom: 0 }}>
                Horario afectado: <strong style={{ color: '#333' }}>{serverInfo.evento_horario}</strong>
              </p>
            )}
            <p style={{ color: '#555', lineHeight: '1.6', marginTop: '12px', marginBottom: 0, fontStyle: 'italic' }}>
              Las asistencias volverán a habilitarse automáticamente al finalizar el evento.
            </p>
          </div>
        </div>
      )}

      {!serverInfo?.evento_activo && (
      <>
      <div className="card-header-flex">
        <h3>Control de Asistencia</h3>
        <span className="badge role-badge-display">Solo lectura</span>
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

      <FiltrosAnioCurso
        cursosObj={cursosObj}
        defaultToFirst
        onCursoChange={handleCursoChange}
      />

      {tab === 'dia' && (
        <div>
          <div className="card-header-flex">
            <h3>Asistencias del día</h3>
          </div>

          <p style={{ color: '#888', margin: '0 0 12px' }}>
            Curso: {curso || '—'} — Fecha: {today}
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
                        <span className={`badge ${badgeClass(r.estado)}`}>
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
                <label htmlFor="reg-fecha-admin">Fecha</label>
                <input
                  id="reg-fecha-admin"
                  type="date"
                  value={regFecha}
                  onChange={(e) => setRegFecha(e.target.value)}
                />
              </div>
              <div className="form-group-filter">
                <label htmlFor="reg-alumno-admin">Alumno</label>
                <select
                  id="reg-alumno-admin"
                  value={regAlumno}
                  onChange={(e) => setRegAlumno(e.target.value)}
                >
                  <option value="">Todos...</option>
                  {listaAlumnos.map((a) => (
                    <option key={a.id} value={a.id}>{nombreCorto(a)}</option>
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
                          <span className={`badge ${badgeClass(r.estado)}`}>
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
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="materia-asistencias">Materia</label>
              <select
                id="materia-asistencias"
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
              <label htmlFor="fecha-asistencias">Fecha</label>
              <input
                id="fecha-asistencias"
                type="date"
                value={fechaMateria}
                onChange={(e) => setFechaMateria(e.target.value)}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="alumno-asistencias">Alumno</label>
              <select
                id="alumno-asistencias"
                value={alumnoMateria}
                onChange={(e) => setAlumnoMateria(e.target.value)}
              >
                <option value="">Todos...</option>
                {listaAlumnos.map((a) => (
                  <option key={a.id} value={a.id}>{nombreCorto(a)}</option>
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
      </>
      )}
    </div>
  );
}

export default Asistencias;
