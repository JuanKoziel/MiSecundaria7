import { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { tieneVistaParaDestino } from '../../utils/navDestinos';

const VISIBLE_MS = 7000;
const SALIDA_MS = 300;

// Toast de notificación NUEVA (Partes 2, 3, 5 y 7).
// - Solo se muestran notificaciones que llegaron DURANTE la sesión (la lista
//   `nuevasNotificaciones` la llena DataContext con su sondeo); nunca las que
//   ya existían al cargar.
// - "Ver →" reutiliza la navegación existente (`navegarDesdeNotificacion`) y
//   solo aparece si el rol del usuario tiene una vista real para el destino.
// - Cada tarjeta se autocierra y tiene botón de cierre; no se duplican porque
//   la cola deduplica por id y se descarta al cerrar/ver.
function ItemToast({ nueva, userRole, onCerrar, onVer }) {
  const [saliendo, setSaliendo] = useState(false);

  const puedeNavegar =
    Boolean(nueva.nav_destino) && tieneVistaParaDestino(nueva.nav_destino, userRole);

  useEffect(() => {
    const t1 = setTimeout(() => setSaliendo(true), VISIBLE_MS);
    const t2 = setTimeout(() => onCerrar(nueva.id), VISIBLE_MS + SALIDA_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cerrar = () => {
    setSaliendo(true);
    setTimeout(() => onCerrar(nueva.id), SALIDA_MS);
  };

  return (
    <div
      className={`notif-toast${saliendo ? ' notif-toast--saliendo' : ''}`}
    >
      <div className="notif-toast__campana">
        <i className="fas fa-bell" aria-hidden="true" />
      </div>
      <div className="notif-toast__cuerpo">
        <span className="notif-toast__titulo">Nueva notificación</span>
        <span className="notif-toast__asunto">{nueva.titulo || 'Tienes una nueva notificación'}</span>
        {nueva.mensaje && (
          <span className="notif-toast__mensaje">{nueva.mensaje}</span>
        )}
        {puedeNavegar && (
          <button type="button" className="notif-toast__ver" onClick={onVer}>
            Ver <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        )}
      </div>
      <button
        type="button"
        className="notif-toast__cerrar"
        aria-label="Cerrar notificación"
        title="Cerrar"
        onClick={cerrar}
      >
        <i className="fas fa-xmark" aria-hidden="true" />
      </button>
    </div>
  );
}

function NotificacionToast({ userRole }) {
  const {
    nuevasNotificaciones = [],
    descartarNueva,
    navegarDesdeNotificacion,
  } = useData();

  if (nuevasNotificaciones.length === 0) {
    return null;
  }

  return (
    <div className="notificaciones-toast" role="status" aria-live="polite">
      {nuevasNotificaciones.map((nueva) => (
        <ItemToast
          key={nueva.id}
          nueva={nueva}
          userRole={userRole}
          onCerrar={descartarNueva}
          onVer={() => {
            descartarNueva(nueva.id);
            navegarDesdeNotificacion(nueva.nav_destino, nueva.nav_params || {});
          }}
        />
      ))}
    </div>
  );
}

export default NotificacionToast;