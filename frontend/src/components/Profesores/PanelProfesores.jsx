import { useState, useMemo, useEffect } from 'react';
import Sidebar from './Sidebar';
import PanelDocente from './PanelDocente';
import TopHeader from './TopHeader';
import PanelAlumnos from './PanelAlumnos';
import PanelInfo from './PanelInfo';
import PanelPlanif from './PanelPlanif';
import PanelLibroTemas from './PanelLibroTemas';
import PanelAsistencia from './PanelAsistencia';
import PanelActividades from './PanelActividades';
import Actas from '../Preceptores/actas';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import PanelMateriasAdeudadasDocente from './PanelMateriasAdeudadasDocente';
import { useData } from '../../context/DataContext';
import { getSuplencias } from '../../services/api';
import { suplenciasActivasEnFecha } from '../../utils/suplencias';
import { viewDesdeDestino } from '../../utils/navDestinos';

function PanelProfesores({ user, onLogout }) {
  const { docentes, cursoMateria, cursosObj, navIntent } = useData();
  const [cursoId, setCursoId] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('docente');
  const [cursoComunicados, setCursoComunicados] = useState('');
  const [cursoDiagnosticos, setCursoDiagnosticos] = useState('');
  const [anioActas, setAnioActas] = useState('');
  const [cursoActas, setCursoActas] = useState('');
  const [suplencias, setSuplencias] = useState([]);

  // Parte 8: manejar navegación desde notificaciones.
  // Traduce el destino semántico a una sección válida del panel docente.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'docente');
      if (vista) setSeccionActiva(vista);
    }
  }, [navIntent]);

  const handleAnioActasChange = (nuevoAnio) => {
    setAnioActas(nuevoAnio);
    setCursoActas('');
  };

  const actasFiltrosProps = {
    anioLectivo: anioActas,
    curso: cursoActas,
    onAnioChange: handleAnioActasChange,
    onCursoChange: setCursoActas,
  };

  useEffect(() => {
    let activo = true;
    getSuplencias()
      .then((data) => {
        if (activo) setSuplencias(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (activo) setSuplencias([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  const userId = user?.id_usuario ?? user?.id ?? null;
  const miDocente = useMemo(
    () => docentes.find((d) => d.id_usuario === userId) || null,
    [docentes, userId],
  );

  const mapSuplencias = useMemo(
    () => suplenciasActivasEnFecha(suplencias),
    [suplencias],
  );

  const misAsignaciones = useMemo(() => {
    if (!miDocente) return [];
    return cursoMateria
      .filter((cm) => {
        const s = mapSuplencias[cm.id];
        if (cm.id_docente === miDocente.id) return true;
        return Boolean(s && s.id_docente_suplente === miDocente.id);
      })
      .map((cm) => {
        const s = mapSuplencias[cm.id] || null;
        const esSuplente = Boolean(s && s.id_docente_suplente === miDocente.id);
        return {
          ...cm,
          esSuplente,
          suplenciaActiva: Boolean(s),
          suplenteNombre: s?.suplente_nombre || null,
          puedeEditar: esSuplente || !Boolean(s),
        };
      });
  }, [cursoMateria, miDocente, mapSuplencias]);

  const cursosEditables = useMemo(() => {
    const set = new Set();
    misAsignaciones.forEach((cm) => {
      if (cm.puedeEditar) set.add(cm.id_curso);
    });
    return set;
  }, [misAsignaciones]);

  const misCursos = useMemo(() => {
    const map = new Map();
    misAsignaciones.forEach((cm) => {
      if (!map.has(cm.id_curso)) {
        const cObj = cursosObj.find((c) => c.id_curso === cm.id_curso);
        map.set(cm.id_curso, {
          id_curso: cm.id_curso,
          nombre: cm.curso_nombre || '',
          anio: cObj?.ciclo_anio || '',
        });
      }
    });
    return [...map.values()];
  }, [misAsignaciones, cursosObj]);

  const materiasCurso = useMemo(
    () =>
      misAsignaciones
        .filter((cm) => String(cm.id_curso) === cursoId)
        .map((cm) => ({ id: cm.id, materia: cm.materia_nombre, esSuplente: cm.esSuplente, suplenciaActiva: cm.suplenciaActiva, suplenteNombre: cm.suplenteNombre, puedeEditar: cm.puedeEditar })),
    [misAsignaciones, cursoId],
  );

  const cursoMateriaActivo = useMemo(
    () =>
      misAsignaciones.find(
        (cm) => String(cm.id_curso) === cursoId && cm.materia_nombre === materiaSeleccionada,
      ) || null,
    [misAsignaciones, cursoId, materiaSeleccionada],
  );

  const cursoNombre = misCursos.find((c) => String(c.id_curso) === cursoId)?.nombre || '';

  const handleCursoChange = (nuevoId) => {
    setCursoId(nuevoId);
    setMateriaSeleccionada('');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        view={seccionActiva}
        setView={setSeccionActiva}
        onLogout={onLogout}
      />

      <main className="main-content">
        <TopHeader
          user={user}
          cursoSeleccionado={cursoNombre}
          materiaSeleccionada={materiaSeleccionada}
        />

        {seccionActiva !== 'docente' && seccionActiva !== 'notificaciones' && seccionActiva !== 'comunicados' && seccionActiva !== 'info' && seccionActiva !== 'calendario' && seccionActiva !== 'actas' && (
          <div className="card">
            <div className="filter-row">
              <div className="form-group-filter">
                <label htmlFor="curso-select">Curso Activo</label>
                <select
                  id="curso-select"
                  value={cursoId}
                  onChange={(e) => handleCursoChange(e.target.value)}
                >
                  <option value="" disabled hidden>
                    Seleccione un curso...
                  </option>
                  {misCursos.map((c) => (
                    <option key={c.id_curso} value={String(c.id_curso)}>
                      {c.nombre} ({c.anio})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cursoId && (
              <div className="materias-wrapper">
                <h3>Mis Materias</h3>
                <div className="materias-grid">
                  {materiasCurso.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`materia-btn ${materiaSeleccionada === m.materia ? 'active-materia' : ''}`}
                      onClick={() => setMateriaSeleccionada(m.materia)}
                    >
                      {m.materia}
                      {m.esSuplente && (
                        <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Suplencia</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cursoMateriaActivo && cursoMateriaActivo.suplenciaActiva && !cursoMateriaActivo.esSuplente && (
              <div
                style={{
                  background: '#fff4cf',
                  borderLeft: '4px solid #d97706',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  color: '#854d0e',
                  lineHeight: '1.6',
                }}
              >
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }} aria-hidden="true" />
                Esta materia se encuentra asignada temporalmente a un docente suplente
                {cursoMateriaActivo.suplenteNombre ? ` (${cursoMateriaActivo.suplenteNombre})` : ''}.
                Podés ver la información, pero las modificaciones quedan deshabilitadas hasta que finalice la suplencia.
              </div>
            )}
          </div>
        )}

        {seccionActiva === 'notificaciones' ? (
          <div className="view-section active">
            <Notificaciones />
          </div>
        ) : seccionActiva === 'materias-adeudadas' ? (
          <div className="view-section active">
            <PanelMateriasAdeudadasDocente
              misAsignaciones={misAsignaciones}
              misCursos={misCursos}
              cursosObj={cursosObj}
            />
          </div>
        ) : seccionActiva === 'comunicados' ? (
          <div className="view-section active">
            <div className="card">
              <div className="filter-row">
                <div className="form-group-filter">
                  <label htmlFor="comunicados-curso">Filtrar por curso</label>
                  <select
                    id="comunicados-curso"
                    value={cursoComunicados}
                    onChange={(e) => setCursoComunicados(e.target.value)}
                  >
                    <option value="">Todos los cursos</option>
                    {misCursos.map((c) => (
                      <option key={c.id_curso} value={String(c.id_curso)}>
                        {c.nombre} ({c.anio})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <ComunicadosView userRole="docente" cursoSeleccionado={cursoComunicados} />
          </div>
        ) : seccionActiva === 'info' ? (
          <div className="view-section active">
            <div className="card">
              <div className="filter-row">
                <div className="form-group-filter">
                  <label htmlFor="diagnosticos-curso">Filtrar por curso</label>
                  <select
                    id="diagnosticos-curso"
                    value={cursoDiagnosticos}
                    onChange={(e) => setCursoDiagnosticos(e.target.value)}
                  >
                    <option value="">Todos los cursos</option>
                    {misCursos.map((c) => (
                      <option key={c.id_curso} value={String(c.id_curso)}>
                        {c.nombre} ({c.anio})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DiagnosticosView
              userRole="docente"
              cursoSeleccionado={cursoDiagnosticos}
              cursosEditables={cursosEditables}
            />
          </div>
        ) : seccionActiva === 'calendario' ? (
          <div className="view-section active">
            <CalendarioInstitucional readOnly />
          </div>
        ) : seccionActiva === 'docente' ? (
          <div className="view-section active">
            <PanelDocente miDocente={miDocente} mapSuplencias={mapSuplencias} />
          </div>
        ) : seccionActiva === 'actas' ? (
          <div className="view-section active">
            <Actas {...actasFiltrosProps} />
          </div>
        ) : cursoId && materiaSeleccionada && cursoMateriaActivo ? (
          <div>
            <div className={`view-section ${seccionActiva === 'alumnos' ? 'active' : ''}`}>
              {seccionActiva === 'alumnos' && (
                <PanelAlumnos
                  cursoMateriaId={cursoMateriaActivo.id}
                  cursoId={Number(cursoId)}
                  cursoNombre={cursoNombre}
                  materiaNombre={materiaSeleccionada}
                  docenteId={miDocente?.id}
                  puedeEditar={cursoMateriaActivo.puedeEditar}
                />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'info' ? 'active' : ''}`}>
              {seccionActiva === 'info' && (
                <PanelInfo
                  cursoId={Number(cursoId)}
                  docenteId={miDocente?.id}
                  cursoNombre={cursoNombre}
                  puedeEditar={cursosEditables.has(Number(cursoId))}
                />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'planif' ? 'active' : ''}`}>
              {seccionActiva === 'planif' && (
                <PanelPlanif
                  cursoMateriaId={cursoMateriaActivo.id}
                  docenteId={miDocente?.id}
                  materiaNombre={materiaSeleccionada}
                  cursoNombre={cursoNombre}
                  miDocente={miDocente}
                  puedeEditar={cursoMateriaActivo.puedeEditar}
                />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'libro-temas' ? 'active' : ''}`}>
              {seccionActiva === 'libro-temas' && (
                <PanelLibroTemas
                  cursoMateriaId={cursoMateriaActivo.id}
                  materiaNombre={materiaSeleccionada}
                  cursoNombre={cursoNombre}
                  miDocente={miDocente}
                  puedeEditar={cursoMateriaActivo.puedeEditar}
                />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'actividades' ? 'active' : ''}`}>
              {seccionActiva === 'actividades' && (
                <PanelActividades
                  cursoMateriaId={cursoMateriaActivo.id}
                  docenteId={miDocente?.id}
                  materiaNombre={materiaSeleccionada}
                  cursoNombre={cursoNombre}
                  puedeEditar={cursoMateriaActivo.puedeEditar}
                />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'asistencia' ? 'active' : ''}`}>
              {seccionActiva === 'asistencia' && (
                <PanelAsistencia
                  cursoMateriaId={cursoMateriaActivo.id}
                  cursoId={Number(cursoId)}
                  cursoNombre={cursoNombre}
                  puedeEditar={cursoMateriaActivo.puedeEditar}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="card empty-state-card">
            <p className="empty-state-message">
              {!miDocente
                ? 'No se encontró un perfil de docente vinculado a tu usuario.'
                : !cursoId
                  ? 'Por favor, seleccione un curso en el Panel de Control superior.'
                  : 'Por favor, seleccione una materia para desplegar las planillas de trabajo.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PanelProfesores;
