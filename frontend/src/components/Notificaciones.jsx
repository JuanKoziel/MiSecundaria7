import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Mapea destinos de notificación a vistas/secciones del dashboard (Parte 8)
const DESTINO_A_VISTA = {
  calificaciones: 'calificaciones',
  boletin: 'boletin',
  asistencias: 'asistencias',
  intensificaciones: 'intensificaciones',
  previas: 'previas',
  rendiciones: 'rendiciones',
  actas: 'actas',
  comunicados: 'comunicados',
  horarios: 'horarios',
  eventos: 'eventos',
  planificaciones: 'planificaciones',
  adelantos: 'adelantos',
  suplencias: 'suplencias',
  ddjj: 'ddjj',
  perfil: 'perfil',
};

function Notificaciones({ userRole, selectedChild }) {
  const {
    notificaciones = [],
    loading,
    error,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    navegarDesdeNotificacion,
  } = useData();

  const [activeTab, setActiveTab] = useState('alumno');

  const esFamilia = userRole === 'familia';

  const notificacionesActivas = useMemo(() => {
    if (!esFamilia) return notificaciones;
    // Personales: notificaciones no vinculadas a ningún hijo (id_alumno nulo).
    if (activeTab === 'personal') {
      return notificaciones.filter((n) => n.id_alumno === null || n.id_alumno === undefined);
    }
    // Del Estudiante: solo las del hijo seleccionado.
    const alumnoId = selectedChild?.alumnoId;
    if (!alumnoId) return [];
    return notificaciones.filter((n) => Number(n.id_alumno) === Number(alumnoId));
  }, [esFamilia, activeTab, notificaciones, selectedChild]);

  const noLeidasCount = notificacionesActivas.filter((n) => !n.leida).length;

  const marcarTodas = async () => {
    await marcarTodasNotificacionesLeidas(notificacionesActivas.map((n) => n.id));
  };

  // Parte 8: manejo de click en notificación para navegación
  const handleNotificacionClick = (n) => {
    if (!n.nav_destino) return;
    const vista = DESTINO_A_VISTA[n.nav_destino];
    if (vista) {
      navegarDesdeNotificacion(vista, n.nav_params || {});
    }
  };

  const renderLista = () => {
    if (loading) {
      return (
        <div className="notificaciones-empty">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Cargando notificaciones…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="notificaciones-empty">
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />
          <p>No se pudieron cargar las notificaciones.</p>
        </div>
      );
    }

    if (notificacionesActivas.length === 0) {
      return (
        <div className="notificaciones-empty">
          <i className="fas fa-bell-slash" aria-hidden="true" />
          <p>
            {esFamilia && activeTab === 'alumno' && selectedChild
              ? `No hay notificaciones disponibles para ${selectedChild.nombre}.`
              : 'No hay notificaciones disponibles.'}
          </p>
        </div>
      );
    }

    const items = notificacionesActivas.map(function(n) {
      const tieneNavegacion = Boolean(n.nav_destino);
      return (
        <div
          key={n.id}
          className={`notificacion-item ${n.leida ? '' : 'notificacion-item--no-leida'} ${tieneNavegacion ? 'notificacion-item--navegable' : ''}`}
          onClick={() => handleNotificacionClick(n)}
          role={tieneNavegacion ? 'button' : undefined}
          tabIndex={tieneNavegacion ? 0 : undefined}
          onKeyDown={(e) => { if (tieneNavegacion && (e.key === 'Enter' || e.key === ' ')) handleNotificacionClick(n); }}
        >
          <div className="flex-row--between notificacion-item__encabezado">
            <span className="notificacion-item__titulo">
              <strong>{n.titulo || 'Sin título'}</strong>
              {!n.leida && <span className="badge">Nuevo</span>}
              {tieneNavegacion && (
                <span className="notificacion-item__nav-indicador" title="Ir a la sección">
                  <i className="fas fa-chevron-right" aria-hidden="true" />
                </span>
              )}
            </span>
            <span className="text-muted notificacion-item__fecha">{formatearFecha(n.fecha)}</span>
          </div>

          {n.mensaje && (
            <p className="notificacion-item__mensaje">{n.mensaje}</p>
          )}

          {!n.leida && (
            <div className="notificacion-item__accion">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={(e) => { e.stopPropagation(); marcarNotificacionLeida(n.id); }}
              >
                <i className="fas fa-check" aria-hidden="true" /> Marcar como leída
              </button>
            </div>
          )}
        </div>
      );
    });

    return (
      <>
        {noLeidasCount > 0 && (
          <div className="flex-row--between notificaciones-acciones">
            <span className="badge">{noLeidasCount} sin leer</span>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={marcarTodas}
            >
              <i className="fas fa-check-double" aria-hidden="true" /> Marcar todas como leídas
            </button>
          </div>
        )}

        <div className="notificaciones-lista">
          {items}
        </div>
      </>
    );
  };

  if (esFamilia) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <h3>Notificaciones</h3>
        </div>

        <div className="tabs-container">
          <button
            type="button"
            className={`tab-button ${activeTab === 'alumno' ? 'active' : ''}`}
            onClick={() => setActiveTab('alumno')}
          >
            Del Estudiante
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personales
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'alumno' && !selectedChild ? (
            <div className="notificaciones-empty">
              <i className="fas fa-user-slash" aria-hidden="true" />
              <p>Seleccioná un estudiante para ver sus notificaciones.</p>
            </div>
          ) : (
            renderLista()
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Notificaciones</h3>
      </div>
      <div className="tab-content">{renderLista()}</div>
    </div>
  );
}

export default Notificaciones;