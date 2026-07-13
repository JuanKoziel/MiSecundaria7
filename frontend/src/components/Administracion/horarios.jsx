import { useMemo, useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import {
  getCursoMateria,
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
  getHorariosEspeciales,
  createHorarioEspecial,
  updateHorarioEspecial,
  deleteHorarioEspecial,
} from '../../services/api';
import VistaHorarios from './VistaHorarios';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MATERIA_EF = 'Educación Física';

function timeStr(value) {
  if (!value) return '';
  const s = typeof value === 'string' ? value : String(value);
  return s.slice(0, 5);
}

function HorarioSemanal({ cursosOptions }) {
  const { modulos } = useData();
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiasCurso, setMateriasCurso] = useState([]);
  const [celdas, setCeldas] = useState({});
  const [originalCeldas, setOriginalCeldas] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoGrilla, setCargandoGrilla] = useState(false);

  const modulosSorted = useMemo(() => {
    if (!Array.isArray(modulos)) return [];
    return [...modulos].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
  }, [modulos]);

  useEffect(() => {
    if (!cursoSeleccionado) {
      setMateriasCurso([]);
      setCeldas({});
      setOriginalCeldas({});
      return;
    }
    setCargandoGrilla(true);
    setMensaje('');
    Promise.all([
      getCursoMateria({ curso: cursoSeleccionado }),
      getHorarios({ curso: cursoSeleccionado }),
    ])
      .then(([cmData, horData]) => {
        const cmList = Array.isArray(cmData) ? cmData : cmData.results || [];
        const horList = Array.isArray(horData) ? horData : horData.results || [];

        const materias = cmList
          .filter((cm) => cm.materia_nombre && cm.materia_nombre !== MATERIA_EF)
          .map((cm) => ({ id: cm.id_curso_materia, nombre: cm.materia_nombre }));

        const unicas = [];
        const vistos = new Set();
        materias.forEach((m) => {
          if (!vistos.has(m.nombre)) {
            vistos.add(m.nombre);
            unicas.push(m);
          }
        });
        unicas.sort((a, b) => a.nombre.localeCompare(b.nombre));

        setMateriasCurso(unicas);

        const celdasInit = {};
        horList.forEach((h) => {
          const key = `${h.dia_semana}_${h.id_modulo}`;
          celdasInit[key] = {
            id_horario: h.id_horario,
            id_curso_materia: h.id_curso_materia,
          };
        });
        setCeldas(celdasInit);
        setOriginalCeldas(JSON.parse(JSON.stringify(celdasInit)));
      })
      .catch(() => setMensaje('Error al cargar datos del curso.'))
      .finally(() => setCargandoGrilla(false));
  }, [cursoSeleccionado]);

  const getCellValue = (dia, idModulo) => {
    const key = `${dia}_${idModulo}`;
    const cell = celdas[key];
    if (!cell) return '';
    const cm = materiasCurso.find((m) => m.id === cell.id_curso_materia);
    return cm ? cm.nombre : '';
  };

  const handleCellChange = (dia, idModulo, materiaNombre) => {
    setCeldas((prev) => {
      const next = { ...prev };
      const key = `${dia}_${idModulo}`;
      if (!materiaNombre) {
        delete next[key];
      } else {
        const cm = materiasCurso.find((m) => m.nombre === materiaNombre);
        if (cm) {
          next[key] = {
            id_horario: prev[key]?.id_horario || null,
            id_curso_materia: cm.id,
          };
        }
      }
      return next;
    });
  };

  const handleGuardar = async () => {
    setMensaje('');
    setGuardando(true);
    try {
      for (const dia of DIAS) {
        for (const mod of modulosSorted) {
          const key = `${dia}_${mod.id_modulo}`;
          const current = celdas[key];
          const original = originalCeldas[key];

          if (current && current.id_curso_materia) {
            if (original) {
              if (original.id_curso_materia !== current.id_curso_materia) {
                await updateHorario(original.id_horario, { id_curso_materia: current.id_curso_materia });
              }
            } else {
              await createHorario({
                id_curso_materia: current.id_curso_materia,
                dia_semana: dia,
                id_modulo: mod.id_modulo,
                aula: null,
              });
            }
          } else if (!current && original && original.id_horario) {
            await deleteHorario(original.id_horario);
          }
        }
      }

      setMensaje('Horarios guardados correctamente.');

      const [horData] = await Promise.all([
        getHorarios({ curso: cursoSeleccionado }),
      ]);
      const horList = Array.isArray(horData) ? horData : horData.results || [];
      const newCeldas = {};
      horList.forEach((h) => {
        const key = `${h.dia_semana}_${h.id_modulo}`;
        newCeldas[key] = {
          id_horario: h.id_horario,
          id_curso_materia: h.id_curso_materia,
        };
      });
      setCeldas(newCeldas);
      setOriginalCeldas(JSON.parse(JSON.stringify(newCeldas)));
    } catch {
      setMensaje('Error al guardar horarios.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="filter-row">
        <div className="form-group-filter" style={{ maxWidth: '320px' }}>
          <label htmlFor="hs-curso">Curso</label>
          <select
            id="hs-curso"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
          >
            <option value="">— Seleccionar curso —</option>
            {cursosOptions.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>
            ))}
          </select>
        </div>
      </div>

      {mensaje && (
        <p className="form-error-message" style={{ color: mensaje.includes('correctamente') ? '#155724' : undefined }}>
          {mensaje}
        </p>
      )}

      {cursoSeleccionado && (
        <div>
          {cargandoGrilla ? (
            <p className="empty-state-message empty-state-centered">
              Cargando horarios...
            </p>
          ) : modulosSorted.length === 0 ? (
            <p className="empty-state-message empty-state-centered">
              No hay módulos horarios definidos en el sistema.
            </p>
          ) : materiasCurso.length === 0 ? (
            <p className="empty-state-message empty-state-centered">
              El curso no tiene materias asignadas.
            </p>
          ) : (
            <div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '110px' }}>Horario</th>
                      {DIAS.map((d) => (
                        <th key={d} style={{ minWidth: '140px' }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modulosSorted.map((mod) => (
                      <tr key={mod.id_modulo}>
                        <td className="font-bold nowrap">
                          {timeStr(mod.hora_inicio)} - {timeStr(mod.hora_fin)}
                        </td>
                        {DIAS.map((dia) => (
                          <td key={`${dia}_${mod.id_modulo}`} style={{ padding: '4px 6px' }}>
                            <select
                              className="form-control"
                              style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem' }}
                              value={getCellValue(dia, mod.id_modulo)}
                              onChange={(e) => handleCellChange(dia, mod.id_modulo, e.target.value)}
                            >
                              <option value="" />
                              {materiasCurso.map((m) => (
                                <option key={m.id} value={m.nombre}>{m.nombre}</option>
                              ))}
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-actions mt-16">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={guardando}
                  onClick={handleGuardar}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EducacionFisica({ cursosOptions }) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [cmEf, setCmEf] = useState(null);
  const [form, setForm] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);

  const FORM_VACIO = { dia_semana: '', hora_inicio: '', hora_fin: '', aula: '' };

  useEffect(() => {
    if (!cursoSeleccionado) {
      setHorarios([]);
      setCmEf(null);
      return;
    }
    setCargando(true);
    setMensaje('');
    Promise.all([
      getCursoMateria({ curso: cursoSeleccionado }),
      getHorariosEspeciales({ curso: cursoSeleccionado }),
    ])
      .then(([cmData, heData]) => {
        const cmList = Array.isArray(cmData) ? cmData : cmData.results || [];
        const heList = Array.isArray(heData) ? heData : heData.results || [];

        const ef = cmList.find((cm) => cm.materia_nombre === MATERIA_EF);
        setCmEf(ef || null);

        heList.sort((a, b) => {
          const diaA = DIAS.indexOf(a.dia_semana);
          const diaB = DIAS.indexOf(b.dia_semana);
          if (diaA !== diaB) return diaA - diaB;
          return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
        });
        setHorarios(heList);
      })
      .catch(() => setMensaje('Error al cargar datos.'))
      .finally(() => setCargando(false));
  }, [cursoSeleccionado]);

  const resetForm = () => {
    setForm(null);
    setMensaje('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dia_semana || !form.hora_inicio || !form.hora_fin) {
      setMensaje('Completá día, hora inicio y hora fin.');
      return;
    }
    if (!cmEf) {
      setMensaje('El curso no tiene Educación Física asignada.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      const payload = {
        id_curso_materia: cmEf.id_curso_materia,
        dia_semana: form.dia_semana,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        aula: form.aula || null,
      };
      if (form.id) {
        await updateHorarioEspecial(form.id, payload);
      } else {
        await createHorarioEspecial(payload);
      }
      resetForm();
      const [heData] = await Promise.all([
        getHorariosEspeciales({ curso: cursoSeleccionado }),
      ]);
      const heList = Array.isArray(heData) ? heData : heData.results || [];
      heList.sort((a, b) => {
        const diaA = DIAS.indexOf(a.dia_semana);
        const diaB = DIAS.indexOf(b.dia_semana);
        if (diaA !== diaB) return diaA - diaB;
        return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
      });
      setHorarios(heList);
    } catch {
      setMensaje('Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (h) => {
    setForm({
      id: h.id_horario_especial,
      dia_semana: h.dia_semana,
      hora_inicio: timeStr(h.hora_inicio),
      hora_fin: timeStr(h.hora_fin),
      aula: h.aula || '',
    });
    setMensaje('');
  };

  const handleEliminar = async (h) => {
    if (!window.confirm('¿Eliminar este horario?')) return;
    try {
      await deleteHorarioEspecial(h.id_horario_especial);
      const [heData] = await Promise.all([
        getHorariosEspeciales({ curso: cursoSeleccionado }),
      ]);
      const heList = Array.isArray(heData) ? heData : heData.results || [];
      heList.sort((a, b) => {
        const diaA = DIAS.indexOf(a.dia_semana);
        const diaB = DIAS.indexOf(b.dia_semana);
        if (diaA !== diaB) return diaA - diaB;
        return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
      });
      setHorarios(heList);
    } catch {
      setMensaje('Error al eliminar.');
    }
  };

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  return (
    <div>
      <div className="filter-row">
        <div className="form-group-filter" style={{ maxWidth: '320px' }}>
          <label htmlFor="ef-curso">Curso</label>
          <select
            id="ef-curso"
            value={cursoSeleccionado}
            onChange={(e) => { setCursoSeleccionado(e.target.value); resetForm(); }}
          >
            <option value="">— Seleccionar curso —</option>
            {cursosOptions.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>
            ))}
          </select>
        </div>
      </div>

      {mensaje && (
        <p className="form-error-message" style={{ color: mensaje.includes('Error') ? undefined : '#155724' }}>
          {mensaje}
        </p>
      )}

      {cursoSeleccionado && (
        <div>
          {cargando ? (
            <p className="empty-state-message empty-state-centered">
              Cargando...
            </p>
          ) : !cmEf ? (
            <p className="empty-state-message empty-state-centered">
              El curso no tiene Educación Física asignada.
            </p>
          ) : (
            <div>
              {form && (
                <form onSubmit={handleSubmit} className="mb-20">
                  <div className="filter-row">
                    <div className="form-group-filter">
                      <label htmlFor="ef-dia">Día</label>
                      <select
                        id="ef-dia"
                        value={form.dia_semana}
                        onChange={(e) => handleChange('dia_semana', e.target.value)}
                      >
                        <option value="">— Día —</option>
                        {DIAS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-filter">
                      <label htmlFor="ef-hora-inicio">Hora inicio</label>
                      <input
                        id="ef-hora-inicio"
                        type="time"
                        value={form.hora_inicio}
                        onChange={(e) => handleChange('hora_inicio', e.target.value)}
                      />
                    </div>
                    <div className="form-group-filter">
                      <label htmlFor="ef-hora-fin">Hora fin</label>
                      <input
                        id="ef-hora-fin"
                        type="time"
                        value={form.hora_fin}
                        onChange={(e) => handleChange('hora_fin', e.target.value)}
                      />
                    </div>
                    <div className="form-group-filter">
                      <label htmlFor="ef-aula">Aula (opcional)</label>
                      <input
                        id="ef-aula"
                        type="text"
                        value={form.aula}
                        onChange={(e) => handleChange('aula', e.target.value)}
                        placeholder="Ej: Gimnasio"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                      {form.id ? 'Actualizar horario' : 'Agregar horario'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {!form && (
                <button
                  type="button"
                  className="btn btn-primary mb-16"
                  onClick={() => setForm({ ...FORM_VACIO })}
                >
                  Agregar horario
                </button>
              )}

              {horarios.length === 0 ? (
                <p className="empty-state-message empty-state-centered">
                  No hay horarios de Educación Física cargados.
                </p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th>Hora inicio</th>
                        <th>Hora fin</th>
                        <th>Aula</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horarios.map((h) => (
                        <tr key={h.id_horario_especial}>
                          <td>{h.dia_semana}</td>
                          <td>{timeStr(h.hora_inicio)}</td>
                          <td>{timeStr(h.hora_fin)}</td>
                          <td>{h.aula || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditar(h)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleEliminar(h)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Horarios() {
  const { cursosObj } = useData();
  const [modo, setModo] = useState('semanal');

  const cursosOptions = useMemo(() => {
    if (!Array.isArray(cursosObj)) return [];
    return [...cursosObj].sort((a, b) => (a.nombre_curso || '').localeCompare(b.nombre_curso || ''));
  }, [cursosObj]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Horarios</h3>
      </div>

      <div className="filter-row mb-20">
        <div className="form-group-filter" style={{ maxWidth: '320px' }}>
          <label>Vista</label>
          <div className="flex-row">
            <button
              type="button"
              className={`btn btn-sm ${modo === 'semanal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModo('semanal')}
            >
              Horario semanal
            </button>
            <button
              type="button"
              className={`btn btn-sm ${modo === 'ef' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModo('ef')}
            >
              Educación Física
            </button>
            <button
              type="button"
              className={`btn btn-sm ${modo === 'ver' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModo('ver')}
            >
              Ver horarios
            </button>
          </div>
        </div>
      </div>

      {modo === 'semanal' && <HorarioSemanal cursosOptions={cursosOptions} />}
      {modo === 'ef' && <EducacionFisica cursosOptions={cursosOptions} />}
      {modo === 'ver' && <VistaHorarios cursosOptions={cursosOptions} />}
    </div>
  );
}

export default Horarios;
