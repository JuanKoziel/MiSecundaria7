import { useEffect, useMemo, useState } from 'react';
import FormModal from './FormModal';

function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Configuración de las asignaciones obligatorias según el rol a agregar
const ROLE_CONFIG = {
  familia: {
    label: 'Tutor/Familia',
    stepLabel: 'Asignar alumno(s)',
    needAssignment: true,
    assignmentType: 'alumnos',
    assignmentKey: 'alumnos_ids',
    minSelection: 1,
  },
  docente: {
    label: 'Docente',
    stepLabel: 'Asignar curso-materia',
    needAssignment: true,
    assignmentType: 'curso_materia',
    assignmentKey: 'curso_materia_ids',
    minSelection: 1,
  },
  preceptor: {
    label: 'Preceptor',
    stepLabel: 'Asignar curso(s)',
    needAssignment: true,
    assignmentType: 'cursos',
    assignmentKey: 'cursos_ids',
    minSelection: 1,
  },
  jefe_preceptores: {
    label: 'Jefe de Preceptores',
    stepLabel: '',
    needAssignment: false,
    assignmentType: null,
    assignmentKey: null,
    minSelection: 0,
  },
  admin: {
    label: 'Administrador',
    stepLabel: '',
    needAssignment: false,
    assignmentType: null,
    assignmentKey: null,
    minSelection: 0,
  },
};

const ASSIGNMENT_LABELS = {
  alumnos: 'alumno(s)',
  cursos: 'curso(s)',
  curso_materia: 'curso-materia(s)',
};

function AgregarRolModal({
  titulo,
  subtitulo,
  personas,
  onClose,
  onAgregar,
  guardando,
  mensaje,
  rol,
  fetchAssignmentsFn,
  fetchCursosFn,
  fetchMateriasFn,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState('');
  const [paso, setPaso] = useState(1);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionesDisponibles, setAsignacionesDisponibles] = useState([]);
  const [cursoMateriasDisponibles, setCursoMateriasDisponibles] = useState([]);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState('');
  const [busquedaAsignacion, setBusquedaAsignacion] = useState('');

  const roleConfig = ROLE_CONFIG[rol] || { needAssignment: false, minSelection: 0 };

  useEffect(() => {
    setBusqueda('');
    setSeleccionada('');
    setPaso(1);
    setPersonaSeleccionada(null);
    setAsignaciones([]);
    setAsignacionesDisponibles([]);
    setCursoMateriasDisponibles([]);
    setCursosDisponibles([]);
    setMateriasDisponibles([]);
    setCursoSeleccionado('');
    setMateriaSeleccionada('');
    setErrorAsignacion('');
    setBusquedaAsignacion('');
  }, [titulo, rol]);

  // Cargar las asignaciones disponibles al entrar al paso 2
  useEffect(() => {
    if (paso !== 2 || !roleConfig.needAssignment) return;
    setCargandoAsignaciones(true);
    setErrorAsignacion('');

    const cargar = async () => {
      try {
        if (roleConfig.assignmentType === 'curso_materia') {
          const [cmData, cursosData, materiasData] = await Promise.all([
            fetchAssignmentsFn ? fetchAssignmentsFn() : Promise.resolve([]),
            fetchCursosFn ? fetchCursosFn() : Promise.resolve([]),
            fetchMateriasFn ? fetchMateriasFn() : Promise.resolve([]),
          ]);
          setCursoMateriasDisponibles(Array.isArray(cmData) ? cmData : []);
          setCursosDisponibles(Array.isArray(cursosData) ? cursosData : []);
          setMateriasDisponibles(Array.isArray(materiasData) ? materiasData : []);
        } else {
          const data = fetchAssignmentsFn ? await fetchAssignmentsFn() : [];
          setAsignacionesDisponibles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setErrorAsignacion('Error al cargar las opciones disponibles.');
        console.error(err);
      } finally {
        setCargandoAsignaciones(false);
      }
    };

    cargar();
  }, [paso, roleConfig.needAssignment, roleConfig.assignmentType, fetchAssignmentsFn, fetchCursosFn, fetchMateriasFn]);

  const filtradas = useMemo(() => {
    const lista = personas || [];
    const q = normalize(busqueda.trim());
    if (!q) return lista;
    return lista.filter(
      (p) =>
        normalize(p.apellido).includes(q) ||
        normalize(p.nombre).includes(q) ||
        normalize(`${p.apellido} ${p.nombre}`).includes(q) ||
        normalize(`${p.nombre} ${p.apellido}`).includes(q),
    );
  }, [personas, busqueda]);

  const personaSel = (personas || []).find(
    (p) => String(p.id_usuario ?? p.id) === String(seleccionada),
  );

  const filtradasAsignaciones = useMemo(() => {
    const lista = asignacionesDisponibles || [];
    const q = normalize(busquedaAsignacion.trim());
    if (!q) return lista;
    return lista.filter((a) => {
      if (roleConfig.assignmentType === 'alumnos') {
        return (
          normalize(a.apellido).includes(q) ||
          normalize(a.nombre).includes(q) ||
          normalize(a.curso_nombre || '').includes(q)
        );
      }
      if (roleConfig.assignmentType === 'cursos') {
        return (
          normalize(a.nombre_curso).includes(q) ||
          normalize(String(a.ciclo_anio || '')).includes(q)
        );
      }
      return false;
    });
  }, [asignacionesDisponibles, busquedaAsignacion, roleConfig.assignmentType]);

  const handleSiguiente = () => {
    if (!personaSel) return;
    setPersonaSeleccionada(personaSel);
    setErrorAsignacion('');
    setPaso(roleConfig.needAssignment ? 2 : 3);
  };

  const handleAnterior = () => {
    if (paso === 3) {
      setPaso(roleConfig.needAssignment ? 2 : 1);
    } else {
      setPaso(1);
      setPersonaSeleccionada(null);
      setAsignaciones([]);
    }
  };

  const toggleAsignacion = (id) => {
    setAsignaciones((prev) => {
      const idStr = String(id);
      if (prev.includes(idStr)) {
        return prev.filter((item) => item !== idStr);
      }
      return [...prev, idStr];
    });
  };

  const quitarAsignacion = (id) => {
    setAsignaciones((prev) => {
      const idStr = String(id);
      return prev.filter((item) => {
        if (roleConfig.assignmentType === 'curso_materia') {
          return String(item.id_curso_materia) !== idStr;
        }
        return item !== idStr;
      });
    });
  };

  const agregarRelacionCursoMateria = () => {
    if (!cursoSeleccionado || !materiaSeleccionada) return;
    const existente = (cursoMateriasDisponibles || []).find(
      (cm) =>
        String(cm.id_curso) === String(cursoSeleccionado) &&
        String(cm.id_materia) === String(materiaSeleccionada),
    );
    if (!existente) {
      setErrorAsignacion('No existe una relación curso-materia registrada para esa combinación.');
      return;
    }
    const id = String(existente.id_curso_materia);
    const duplicada = asignaciones.some((item) => String(item.id_curso_materia) === id);
    if (duplicada) {
      setErrorAsignacion('Esa relación curso-materia ya fue agregada.');
      return;
    }
    setErrorAsignacion('');
    setAsignaciones((prev) => [
      ...prev,
      {
        id_curso_materia: existente.id_curso_materia,
        id_curso: existente.id_curso,
        id_materia: existente.id_materia,
        label: `${existente.materia_nombre || 'Materia'} - ${existente.curso_nombre || 'Curso'}`,
      },
    ]);
    setCursoSeleccionado('');
    setMateriaSeleccionada('');
  };

  const handleConfirmar = () => {
    if (roleConfig.needAssignment && asignaciones.length < roleConfig.minSelection) {
      setErrorAsignacion(
        `Debe seleccionar al menos ${roleConfig.minSelection} ${ASSIGNMENT_LABELS[roleConfig.assignmentType] || 'elemento(s)'}.`,
      );
      return;
    }

    let asignacionesPayload = {};
    if (roleConfig.needAssignment) {
      if (roleConfig.assignmentType === 'curso_materia') {
        asignacionesPayload[roleConfig.assignmentKey] = asignaciones.map((item) => Number(item.id_curso_materia));
      } else {
        asignacionesPayload[roleConfig.assignmentKey] = asignaciones.map(Number);
      }
    }

    onAgregar({
      persona: personaSeleccionada,
      asignaciones: asignacionesPayload,
    });
  };

  const renderPaso1 = () => (
    <>
      {subtitulo && (
        <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
          {subtitulo}
        </p>
      )}
      {mensaje && (
        <p className="m-0" style={{ color: mensaje.startsWith('Error') ? 'red' : 'green' }}>
          {mensaje}
        </p>
      )}
      <div className="form-group-filter">
        <label htmlFor="agregar-rol-busqueda">Buscar persona</label>
        <input
          id="agregar-rol-busqueda"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o apellido..."
          autoFocus
        />
      </div>
      <div
        style={{
          maxHeight: 280,
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        {filtradas.length === 0 ? (
          <p className="empty-state-message m-0" style={{ padding: '16px', margin: 0 }}>
            No se encontraron personas sin este rol.
          </p>
        ) : (
          filtradas.map((p) => {
            const idPersona = p.id_usuario ?? p.id;
            const activa = String(seleccionada) === String(idPersona);
            return (
              <label
                key={idPersona}
                className={`preceptor-curso-option${activa ? ' preceptor-curso-option--selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  margin: 0,
                }}
              >
                <input
                  type="radio"
                  name="agregar-rol-persona"
                  value={String(idPersona)}
                  checked={activa}
                  onChange={() => setSeleccionada(String(idPersona))}
                />
                <span>
                  {p.apellido}, {p.nombre}
                </span>
              </label>
            );
          })
        )}
      </div>
    </>
  );

  const renderSelectoresCursoMateria = () => (
    <div style={{ display: 'grid', gap: '10px' }}>
      <div className="form-group-filter">
        <label htmlFor="agregar-rol-curso">Curso</label>
        <select
          id="agregar-rol-curso"
          value={cursoSeleccionado}
          onChange={(e) => setCursoSeleccionado(e.target.value)}
        >
          <option value="">Seleccionar curso...</option>
          {cursosDisponibles.map((c) => (
            <option key={c.id_curso} value={String(c.id_curso)}>
              {c.nombre_curso}
              {c.ciclo_anio ? ` (${c.ciclo_anio})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="agregar-rol-materia">Materia</label>
        <select
          id="agregar-rol-materia"
          value={materiaSeleccionada}
          onChange={(e) => setMateriaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar materia...</option>
          {materiasDisponibles.map((m) => (
            <option key={m.id_materia} value={String(m.id_materia)}>
              {m.nombre_materia}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!cursoSeleccionado || !materiaSeleccionada || guardando}
        onClick={agregarRelacionCursoMateria}
      >
        <i className="fas fa-plus" aria-hidden="true" /> Agregar relación
      </button>
    </div>
  );

  const renderListaAsignaciones = () => {
    if (roleConfig.assignmentType === 'curso_materia') {
      return asignaciones.length === 0 ? (
        <p className="empty-state-message m-0" style={{ padding: '12px', margin: 0 }}>
          Todavía no se agregaron curso-materias.
        </p>
      ) : (
        <div
          style={{
            maxHeight: 180,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        >
          {asignaciones.map((item) => (
            <div
              key={String(item.id_curso_materia)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span style={{ flex: 1 }}>{item.label}</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={guardando}
                onClick={() => quitarAsignacion(String(item.id_curso_materia))}
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      );
    }

    const seleccionadas = asignacionesDisponibles.filter((a) => {
      const id = a.id_alumno ?? a.id_curso ?? a.id;
      return asignaciones.includes(String(id));
    });

    if (seleccionadas.length === 0) {
      return (
        <p className="empty-state-message m-0" style={{ padding: '12px', margin: 0 }}>
          Todavía no se seleccionaron {ASSIGNMENT_LABELS[roleConfig.assignmentType] || 'elementos'}.
        </p>
      );
    }

    return (
      <div
        style={{
          maxHeight: 180,
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}
      >
        {seleccionadas.map((a) => {
          const id = a.id_alumno ?? a.id_curso ?? a.id;
          let label = '';
          if (roleConfig.assignmentType === 'alumnos') {
            label = `${a.apellido}, ${a.nombre}${a.curso_nombre ? ` (${a.curso_nombre})` : ''}`;
          } else {
            label = `${a.nombre_curso}${a.ciclo_anio ? ` (${a.ciclo_anio})` : ''}`;
          }
          return (
            <div
              key={String(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span style={{ flex: 1 }}>{label}</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={guardando}
                onClick={() => quitarAsignacion(String(id))}
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSeleccionAsignaciones = () => {
    if (roleConfig.assignmentType === 'curso_materia') {
      return renderSelectoresCursoMateria();
    }

    return (
      <>
        <div className="form-group-filter" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <label htmlFor="asignacion-busqueda">Buscar</label>
          <input
            id="asignacion-busqueda"
            type="text"
            value={busquedaAsignacion}
            onChange={(e) => setBusquedaAsignacion(e.target.value)}
            placeholder={`Buscar ${roleConfig.assignmentType === 'alumnos' ? 'alumno' : 'curso'}...`}
          />
        </div>
        <div
          style={{
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        >
          {filtradasAsignaciones.length === 0 ? (
            <p className="empty-state-message m-0" style={{ padding: '16px', margin: 0 }}>
              No se encontraron {roleConfig.assignmentType === 'alumnos' ? 'alumnos' : 'cursos'} con ese criterio.
            </p>
          ) : (
            filtradasAsignaciones.map((a) => {
              const id = a.id_alumno ?? a.id_curso ?? a.id;
              const activa = asignaciones.includes(String(id));
              let label = '';
              if (roleConfig.assignmentType === 'alumnos') {
                label = `${a.apellido}, ${a.nombre}${a.curso_nombre ? ` (${a.curso_nombre})` : ''}`;
              } else {
                label = `${a.nombre_curso}${a.ciclo_anio ? ` (${a.ciclo_anio})` : ''}`;
              }
              return (
                <label
                  key={String(id)}
                  className={`preceptor-curso-option${activa ? ' preceptor-curso-option--selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activa}
                    onChange={() => toggleAsignacion(id)}
                  />
                  <span>{label}</span>
                </label>
              );
            })
          )}
        </div>
      </>
    );
  };

  const renderPaso2 = () => (
    <>
      <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '8px' }}>
        Persona seleccionada: <strong>{personaSeleccionada?.apellido}, {personaSeleccionada?.nombre}</strong>
      </p>
      <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '12px' }}>
        {roleConfig.stepLabel} (mínimo {roleConfig.minSelection}{' '}
        {ASSIGNMENT_LABELS[roleConfig.assignmentType] || 'elemento(s)'})
      </p>
      {errorAsignacion && (
        <p className="m-0" style={{ color: 'red', marginBottom: '8px', fontSize: '0.85rem' }}>
          {errorAsignacion}
        </p>
      )}
      {cargandoAsignaciones ? (
        <p className="m-0" style={{ textAlign: 'center', padding: '20px', color: '#cbd5e1' }}>
          Cargando opciones disponibles...
        </p>
      ) : (
        <>
          {roleConfig.assignmentType === 'curso_materia'
            ? renderSeleccionAsignaciones()
            : (asignacionesDisponibles.length === 0 ? (
                <p className="empty-state-message m-0" style={{ padding: '16px', margin: 0 }}>
                  No hay {roleConfig.assignmentType === 'alumnos' ? 'alumnos' : 'cursos'} disponibles para asignar.
                </p>
              ) : renderSeleccionAsignaciones())}
        </>
      )}
      {(asignaciones.length > 0 || roleConfig.assignmentType === 'curso_materia') && (
        <>
          <p className="m-0" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            Seleccionadas: <strong>{asignaciones.length}</strong>
          </p>
          {renderListaAsignaciones()}
        </>
      )}
    </>
  );

  const renderPaso3 = () => (
    <>
      <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '8px' }}>
        Persona seleccionada: <strong>{personaSeleccionada?.apellido}, {personaSeleccionada?.nombre}</strong>
      </p>
      <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '12px' }}>
        Se asignará el rol <strong>{roleConfig.label}</strong> a esta persona.
      </p>
      {mensaje && (
        <p className="m-0" style={{ color: mensaje.startsWith('Error') ? 'red' : 'green' }}>
          {mensaje}
        </p>
      )}
    </>
  );

  const puedeConfirmar =
    !roleConfig.needAssignment || asignaciones.length >= roleConfig.minSelection;

  return (
    <FormModal title={titulo} onClose={onClose}>
      <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
        {paso === 1 ? renderPaso1() : paso === 2 ? renderPaso2() : renderPaso3()}
      </div>
      <div className="standard-modal-footer">
        {paso > 1 && (
          <button type="button" className="btn btn-secondary" onClick={handleAnterior} disabled={guardando}>
            <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>
          Cancelar
        </button>
        {paso === 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!personaSel || guardando}
            onClick={handleSiguiente}
          >
            <i className="fas fa-arrow-right" aria-hidden="true" /> Siguiente
          </button>
        ) : paso === 2 ? (
          <button
            type="button"
            className="btn btn-success"
            disabled={!puedeConfirmar || guardando}
            onClick={handleConfirmar}
          >
            <i className="fas fa-user-tag" aria-hidden="true" />
            {guardando ? ' Guardando...' : ' Agregar rol'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-success"
            disabled={guardando}
            onClick={handleConfirmar}
          >
            <i className="fas fa-user-tag" aria-hidden="true" />
            {guardando ? ' Guardando...' : ' Agregar rol'}
          </button>
        )}
      </div>
    </FormModal>
  );
}

export default AgregarRolModal;