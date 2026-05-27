<<<<<<< HEAD
import { useEffect, useState } from 'react';
import {
  fetchAlumnos,
  fetchAsistenciasDiarias,
  saveAsistenciasDiariasBulk,
} from '../../api/services';
import { todayISO } from '../../utils/date';
import ApiError from '../common/ApiError';
import CursoFilter from './CursoFilter';
import { useCursos } from './useCursos';

function Asistencias() {
  const { cursos, curso, setCurso, error: cursosError, loading: cursosLoading } = useCursos();
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [fecha, setFecha] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    setError('');
    Promise.all([fetchAlumnos(curso), fetchAsistenciasDiarias(fecha, null, curso)])
      .then(([alumnosData, asistData]) => {
        setAlumnos(alumnosData);
        const map = {};
        asistData.forEach((a) => {
          map[a.alumno_id] = a.estado === 'Presente';
        });
        setAsistencias(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fecha, curso]);
=======
import { useState } from 'react';
import { nombreCorto } from '../../data/mockData';
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
>>>>>>> main

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

function Asistencias({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const [fecha, setFecha] = useState(fechaHoy);
  const [tab, setTab] = useState('alumnos');
  const [asistAlumnos, setAsistAlumnos] = useState({});
  const [asistDocentes, setAsistDocentes] = useState({});

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso);
  const listaDocentes = docentesDelCurso(anioLectivo, curso);

  const getAlumnoReg = (id) => asistAlumnos[id] ?? estadoInicial();
  const getDocenteReg = (id) => asistDocentes[id] ?? docenteInicial();

  const updateAlumno = (id, patch) => {
    setAsistAlumnos((prev) => ({
      ...prev,
      [id]: { ...getAlumnoReg(id), ...patch },
    }));
  };

<<<<<<< HEAD
  const handleGuardar = async () => {
    setSaving(true);
    setError('');
    try {
      const items = alumnos.map((a) => ({
        alumno_id: a.id,
        estado: asistencias[a.id] ? 'Presente' : 'Ausente',
      }));
      await saveAsistenciasDiariasBulk({ fecha, items });
      alert('Asistencia guardada correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayError = cursosError || error;
=======
  const updateDocente = (id, patch) => {
    setAsistDocentes((prev) => ({
      ...prev,
      [id]: { ...getDocenteReg(id), ...patch },
    }));
  };

  const handleGuardar = () => {
    alert(
      `Asistencias guardadas — ${curso} (${anioLectivo}), fecha ${fecha}.`,
    );
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
>>>>>>> main

  return (
    <div className="card">
      <FiltrosAnioCurso
        anioLectivo={anioLectivo}
        curso={curso}
        onAnioChange={onAnioChange}
        onCursoChange={onCursoChange}
      />

      <div className="card-header-flex">
<<<<<<< HEAD
        <h3>Control de Asistencia Diaria</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving || !curso}>
          {saving ? 'Guardando...' : 'Guardar día'}
        </button>
      </div>

      <CursoFilter cursos={cursos} value={curso} onChange={setCurso} id="curso-asistencias" />

      <div className="global-field-box">
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fecha-asist-preceptor">Fecha</label>
            <input
              id="fecha-asist-preceptor"
=======
        <h3>
          Control de Asistencia — {curso} ({anioLectivo})
        </h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar}>
          <i className="fas fa-save" aria-hidden="true" /> Guardar
        </button>
      </div>

      <div className="global-field-box">
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fecha-asistencia-preceptor">Fecha</label>
            <input
              id="fecha-asistencia-preceptor"
>>>>>>> main
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <ApiError message={displayError} />

      {cursosLoading || loading ? (
        <p className="empty-state-message">Cargando...</p>
      ) : (
=======
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
      </div>

      {tab === 'alumnos' && (
>>>>>>> main
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
<<<<<<< HEAD
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
=======
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

      {tab === 'docentes' && (
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
>>>>>>> main
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
