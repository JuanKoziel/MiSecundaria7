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
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import ActasDocente from './ActasDocente';
import { useData } from '../../context/DataContext';
import { getSuplencias } from '../../services/api';
import { suplenciasActivasEnFecha } from '../../utils/suplencias';
import { viewDesdeDestino } from '../../utils/navDestinos';

function PanelProfesores({ user, onLogout }) {
  const { 
    docentes, 
    cursoMateria, 
    cursosObj, 
    navIntent,
    selectedCursoId,
    selectedMateria,
    selectedCursoMateriaId,
    setSeleccionCursoMateria,
    clearSeleccionCursoMateria,
  } = useData();
  const [seccionActiva, setSeccionActiva] = useState('docente');
  const [suplencias, setSuplencias] = useState([]);

  // Usar estado global para curso y materia
  const cursoId = selectedCursoId;
  const materiaSeleccionada = selectedMateria;
  
  const handleCursoChange = (nuevoId) => {
    setSeleccionCursoMateria(nuevoId, '', '');
  };
  
  const handleMateriaChange = (materia, cursoMateriaId) => {
    setSeleccionCursoMateria(cursoId, materia, cursoMateriaId);
  };

  // Parte 8: manejar navegación desde notificaciones.
  // Traduce el destino semántico a una sección válida del panel docente.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'docente');
      if (vista) setSeccionActiva(vista);
    }
  }, [navIntent]);

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
  const nombreCompletoDocente = miDocente ? `${miDocente.apellido}, ${miDocente.nombre}` : null;

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
          nombreCompleto={nombreCompletoDocente}
          onLogout={onLogout}
        />

        {seccionActiva !== 'docente' && seccionActiva !== 'notificaciones' && seccionActiva !== 'comunicados' && seccionActiva !== 'calendario' && seccionActiva !== 'actas' && (
          <div>
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
            <Notificaciones userRole="docente" />
          </div>
        ) : seccionActiva === 'comunicados' ? (
          <div className="view-section active">
            <ComunicadosView userRole="docente" cursoSeleccionado={cursoId} />
          </div>
        ) : seccionActiva === 'info' ? (
          <div className="view-section active">
            <DiagnosticosView 
              userRole="docente" 
              cursoSeleccionado={cursoId}
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
            <ActasDocente 
              docenteId={miDocente?.id}
              cursoId={cursoId ? Number(cursoId) : null}
              materiaSeleccionada={materiaSeleccionada}
              misAsignaciones={misAsignaciones}
            />
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
                  misAsignaciones={misAsignaciones}
                  misCursos={misCursos}
                  cursosObj={cursosObj}
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
