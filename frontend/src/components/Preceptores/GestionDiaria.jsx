import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { getLibroTemas } from '../../services/api';
import EmptyFiltros from './EmptyFiltros';
import { filtrosCompletos } from './preceptorUtils';
import LoadingSpinner from '../Shared/LoadingSpinner';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatFecha(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(date);
}

function ultimaFecha(items, keyF = 'fecha') {
  let ultima = null;
  (items || []).forEach((it) => {
    const f = it[keyF];
    if (f && (!ultima || String(f) > String(ultima))) ultima = f;
  });
  return ultima;
}

function EstadoCelda({ ok, textoOk, textoNo }) {
  if (ok) {
    return (
      <div>
        <span className="badge badge-success">Sí</span>
        {textoOk && <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{textoOk}</div>}
      </div>
    );
  }
  return (
    <div>
      <span className="badge badge-danger">No</span>
      {textoNo && <div style={{ fontSize: '12px', marginTop: '4px', color: '#dc3545', fontWeight: 500 }}>{textoNo}</div>}
    </div>
  );
}

function GestionDiaria({ anioLectivo, curso }) {
  const { cursosObj, cursoMateria, asistenciasAdmin, calificacionesCompletas, horarios, preceptores } = useData();
  const [libroTemas, setLibroTemas] = useState([]);
  const [cargandoLibro, setCargandoLibro] = useState(false);
  const [modoCargaUnica, setModoCargaUnica] = useState(null); // { id_curso_materia, temporizador }
  const [notificacionesEnviadas, setNotificacionesEnviadas] = useState(new Set());

  const filtrosOk = filtrosCompletos(anioLectivo, curso);

  const cursoId = useMemo(() => {
    if (!curso) return null;
    const c = (cursosObj || []).find((x) => x.nombre_curso === curso);
    return c?.id_curso || null;
  }, [curso, cursosObj]);

  const diaHoy = DIAS_SEMANA[new Date().getDay()];

  const cmIdsConClaseHoy = useMemo(() => {
    if (!cursoId) return new Set();
    return new Set(
      (horarios || [])
        .filter((h) => Number(h.id_curso) === Number(cursoId) && h.dia_semana === diaHoy)
        .map((h) => h.id_curso_materia),
    );
  }, [cursoId, horarios, diaHoy]);

  const materiasCurso = useMemo(() => {
    if (!cursoId) return [];
    return (cursoMateria || [])
      .filter((cm) => Number(cm.id_curso) === Number(cursoId) && cmIdsConClaseHoy.has(cm.id))
      .sort((a, b) => (a.materia_nombre || '').localeCompare(b.materia_nombre || ''));
  }, [cursoId, cursoMateria, cmIdsConClaseHoy]);

  const libroPorMateria = useMemo(() => {
    const mapa = {};
    (libroTemas || []).forEach((lt) => {
      const cmId = lt.id_curso_materia;
      if (cmId === null || cmId === undefined) return;
      const f = lt.fecha || lt.fecha_creacion || '';
      if (!mapa[cmId] || String(f) > String(mapa[cmId])) mapa[cmId] = f;
    });
    return mapa;
  }, [libroTemas]);

  useEffect(() => {
    if (!cursoId) {
      setLibroTemas([]);
      setCargandoLibro(false);
      return;
    }
    setCargandoLibro(true);
    getLibroTemas({ curso: cursoId })
      .then((data) => {
        setLibroTemas(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setLibroTemas([]))
      .finally(() => setCargandoLibro(false));
  }, [cursoId]);

  if (!filtrosOk) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-clipboard-check" aria-hidden="true" /> Panel Diario — Gestión Diaria</h3>
        </div>
        <EmptyFiltros />
      </div>
    );
  }

  const asistenciasDe = (cmId) => (asistenciasAdmin || []).filter((a) => a.id_curso_materia === cmId);
  const calificacionesDe = (cmId) => (calificacionesCompletas || []).filter((c) => c.id_curso_materia === cmId);

  const toggleCargaUnica = async (cmId) => {
    if (modoCargaUnica && modoCargaUnica.id_curso_materia === cmId) {
      // Ya está activo, cerrarlo
      setModoCargaUnica(null);
      return;
    }
    // Activar modo carga única con temporizador de 20 minutos
    setModoCargaUnica({ id_curso_materia: cmId, inicio: new Date() });
  };

  const puedeEnviarCargaUnica = (cmId) => {
    if (!modoCargaUnica || modoCargaUnica.id_curso_materia !== cmId) return false;
    const diffMin = Math.round((new Date().getTime() - modoCargaUnica.inicio.getTime()) / 60000);
    return diffMin <= 20;
  };

  const obtenerTiempoRestante = (cmId) => {
    if (!modoCargaUnica || modoCargaUnica.id_curso_materia !== cmId) return null;
    const diffMin = Math.round((new Date().getTime() - modoCargaUnica.inicio.getTime()) / 60000);
    const restante = 20 - diffMin;
    return restante <= 0 ? 0 : restante;
  };

  const hayClasesHoy = diaHoy !== 'Sábado' && diaHoy !== 'Domingo' && cmIdsConClaseHoy.size > 0;

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-clipboard-check" aria-hidden="true" /> Panel Diario — Gestión Diaria</h3>
      </div>

      <p className="upload-hint m-0 mb-12">
        Verificación por materia: el preceptor verifica si el docente cargó las asistencias, subió el libro de temas y cargó calificaciones nuevas.
        {hayClasesHoy && (
          <> Mostrando únicamente las materias con clases el <strong>{diaHoy}</strong>.</>
        )}
      </p>

      {hayClasesHoy ? (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Docente</th>
                <th>Hora de clase</th>
                <th>Carga realizada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiasCurso.map((cm) => {
                const asigs = asistenciasDe(cm.id);
                const ultAsig = ultimaFecha(asigs, 'fecha');
                const ultLibro = libroPorMateria[cm.id] || null;
                const cals = calificacionesDe(cm.id);
                const ultCal = ultimaFecha(cals, 'fecha_carga');
                const librosMateria = (libroTemas || []).filter((lt) => lt.id_curso_materia === cm.id);

                const { texto: txtAsist, hayCarga: haAsist } = (() => {
                  const asigs = asistenciasDe(cm.id);
                  if (asigs.length > 0) {
                    const ultAsig = ultimaFecha(asigs, 'fecha');
                    return {
                      texto: ultAsig ? `Última carga: ${formatFecha(ultAsig)}` : 'Sin asistencias registradas',
                      hayCarga: true,
                    };
                  }
                  return { texto: 'Sin asistencias registradas', hayCarga: false };
                })();

                const { texto: txtLibro, hayCarga: haLibro } = (() => {
                  const librosMateria = (libroTemas || []).filter((lt) => lt.id_curso_materia === cm.id);
                  if (librosMateria.length > 0) {
                    const ultLibro = libroPorMateria[cm.id];
                    return {
                      texto: ultLibro ? `Última carga: ${formatFecha(ultLibro)} (${librosMateria.length})` : 'Sin libro de temas',
                      hayCarga: true,
                    };
                  }
                  return { texto: 'Sin libro de temas', hayCarga: false };
                })();

                const { texto: txtCal, hayCarga: haCal } = (() => {
                  const cals = calificacionesDe(cm.id);
                  if (cals.length > 0) {
                    const ultCal = ultimaFecha(cals, 'fecha_carga');
                    return {
                      texto: ultCal ? `Última carga: ${formatFecha(ultCal)}` : 'Sin calificaciones',
                      hayCarga: true,
                    };
                  }
                  return { texto: 'Sin calificaciones', hayCarga: false };
                })();

                const horaClase = cmIdsConClaseHoy.has(cm.id)
                  ? (horarios || []).find((h) => h.id_curso_materia === cm.id)?.hora_inicio || '—'
                  : '—';

                const filaPendiente = !haAsist || !haLibro || !haCal;

                return (
                  <tr key={cm.id} style={filaPendiente ? { background: 'rgba(220, 53, 69, 0.06)' } : undefined}>
                    <td className="table-cell-strong">{cm.materia_nombre || '—'}</td>
                    <td>{cm.docente_nombre || '—'}</td>
                    <td>{horaClase}</td>
                    <td>
                      <div>
                        {haAsist && <EstadoCelda ok={true} textoOk={txtAsist} />}{!haAsist && <EstadoCelda ok={false} textoNo="Sin asistencias registradas" />}
                        {haLibro && <EstadoCelda ok={true} textoOk={txtLibro} />}{!haLibro && <EstadoCelda ok={false} textoNo="Sin libro de temas" />}
                        {haCal && <EstadoCelda ok={true} textoOk={txtCal} />}{!haCal && <EstadoCelda ok={false} textoNo="Sin calificaciones" />}
                      </div>
                    </td>
                    <td>
                      {modoCargaUnica && modoCargaUnica.id_curso_materia === cm.id ? (
                        <div style={{
                          margin: '8px 0',
                          padding: '8px',
                          background: '#fff3cd',
                          border: '1px solid #ffeeba',
                          borderRadius: '4px',
                        }}>
                          <span>Carga única de {obtenerTiempoRestante(cm.id)} min restantes</span>
                          <br />
                          <small>Máximo 20 minutos para entregar</small>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleCargaUnica(cm.id)}
                          title="Notificar y habilitar carga única"
                        >
                          <i className="fas fa-bell" aria-hidden="true" /> Notificar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state-message empty-state-centered">
          No hay materias con clases el {diaHoy} en este curso ({curso}).
        </p>
      )}

      <p className="upload-hint m-0 mt-12" style={{ fontSize: '12.5px' }}>
        <i className="fas fa-info-circle" aria-hidden="true" /> Los proyectos y archivos subidos por los docentes se encuentran en la sección Contenido del menú lateral.
      </p>
    </div>
  );
}

export default GestionDiaria;