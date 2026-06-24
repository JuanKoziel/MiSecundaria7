import { useMemo, useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { getCursoMateria, getHorarios, createHorario, updateHorario, deleteHorario } from '../../services/api';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function timeStr(value) {
  if (!value) return '';
  const s = typeof value === 'string' ? value : String(value);
  return s.slice(0, 5);
}

function Horarios() {
  const { cursosObj, refreshData, modulos } = useData();
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiasCurso, setMateriasCurso] = useState([]);
  const [celdas, setCeldas] = useState({});
  const [originalCeldas, setOriginalCeldas] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoGrilla, setCargandoGrilla] = useState(false);
  const cursoCargado = useRef(null);

  const modulosSorted = useMemo(() => {
    if (!Array.isArray(modulos)) return [];
    return [...modulos].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
  }, [modulos]);

  const cursosOptions = useMemo(() => {
    if (!Array.isArray(cursosObj)) return [];
    return [...cursosObj].sort((a, b) => (a.nombre_curso || '').localeCompare(b.nombre_curso || ''));
  }, [cursosObj]);

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
          .filter((cm) => cm.materia_nombre)
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
        cursoCargado.current = cursoSeleccionado;
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
      await refreshData();

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
    <div className="card">
      <div className="card-header-flex">
        <h3>Horarios</h3>
      </div>

      <div className="filter-row">
        <div className="form-group-filter" style={{ maxWidth: '320px' }}>
          <label htmlFor="curso-select">Curso</label>
          <select
            id="curso-select"
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
        <>
          {cargandoGrilla ? (
            <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
              Cargando horarios...
            </p>
          ) : modulosSorted.length === 0 ? (
            <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
              No hay módulos horarios definidos en el sistema.
            </p>
          ) : materiasCurso.length === 0 ? (
            <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
              El curso no tiene materias asignadas.
            </p>
          ) : (
            <>
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
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
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

              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={guardando}
                  onClick={handleGuardar}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Horarios;
