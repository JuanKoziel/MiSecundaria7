import { useMemo } from 'react';
import { useData } from '../../context/DataContext';

// Ítem "Notificaciones" del menú lateral.
//
// - Fuente ÚNICA del contador: lo calcula aquí desde `useData().notificaciones`
//   (sin lógica de recuento duplicada por rol). El badge responde solo a
//   notificaciones sin leer, y se actualiza automáticamente cuando:
//     * el sondeo de DataContext incorpora notificaciones nuevas (Parte 6), o
//     * el usuario marca como leídas (la cuenta baja sola).
// - `campanaPulse` lo incrementa DataContext cada vez que llega una
//   notificación NUEVA en sesión; ese cambio fuerza una breve animación de
//   campana sin re-montar todo el menú.
function CampanaNotificaciones() {
  const { notificaciones = [], campanaPulse = 0 } = useData();
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  // `key` distinta por pulso: reinicia la animación CSS al llegar una nueva.
  const idAnimacion = useMemo(() => `campana-pulse-${campanaPulse}`, [campanaPulse]);

  return (
    <span className="campana-notif" key={idAnimacion}>
      <i
        className={`fas fa-bell campana-notif__icono${campanaPulse > 0 ? ' campana-notif__icono--animar' : ''}`}
        aria-hidden="true"
      />
      {noLeidas > 0 && (
        <span className="campana-notif__badge" aria-hidden="true">
          {noLeidas > 99 ? '99+' : noLeidas}
        </span>
      )}
      <span className="visually-hidden">
        {noLeidas} notificaciones sin leer
      </span>
    </span>
  );
}

export default CampanaNotificaciones;