import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { viewDesdeDestino } from '../../utils/navDestinos';

/**
 * AvisoDatosMaestros — falta un dato maestro para poder operar.
 *
 * Reemplaza los selects vacíos que dejaban al usuario sin salida (por ejemplo,
 * "Nuevo curso" sin ningún ciclo lectivo cargado) por un mensaje que explica
 * qué falta y ofrece el acceso directo a la pantalla que lo crea.
 *
 * Reutiliza las clases de `index.css` ya en uso en el resto de la aplicación
 * (`.empty-state-card`, `.empty-state-message`, `.btn`).
 *
 * La navegación reutiliza el `navIntent` de `DataContext` (el mismo mecanismo
 * que usan las notificaciones), así que el destino llega al dashboard activo.
 *
 * El botón solo se muestra si el rol actual tiene esa vista: el módulo
 * Configuración es de Administración (admin/director), de modo que un docente o
 * un preceptor que encuentra el mismo problema ve el aviso sin un enlace que
 * no lo llevaría a ninguna parte.
 *
 * @param {string} mensaje   Texto principal (qué falta y por qué importa).
 * @param {string} [detalle] Línea secundaria opcional.
 * @param {string} [accion]  Etiqueta del botón. Si se omite, no se muestra.
 * @param {string} destino   `nav_destino` a navegar (ver `utils/navDestinos.js`).
 */
export default function AvisoDatosMaestros({ mensaje, detalle, accion, destino }) {
  const { navegarDesdeNotificacion } = useData();
  let rol = null;
  try {
    rol = useAuth()?.user?.role ?? null;
  } catch {
    // Fuera del AuthProvider (tests) el aviso funciona igual, sin botón.
    rol = null;
  }

  if (!mensaje) return null;

  const puedeNavegar = Boolean(
    accion && destino && typeof navegarDesdeNotificacion === 'function'
    && (!rol || viewDesdeDestino(destino, rol)),
  );

  const ir = () => {
    if (!puedeNavegar) return;
    navegarDesdeNotificacion(destino);
  };

  return (
    <div className="empty-state-card empty-state-card--compact">
      <i className="fas fa-triangle-exclamation" aria-hidden="true" />
      <p className="empty-state-message">{mensaje}</p>
      {detalle && <p className="empty-state-message">{detalle}</p>}
      {puedeNavegar && (
        <button type="button" className="btn btn-primary" onClick={ir}>
          <i className="fas fa-plus" aria-hidden="true" /> {accion}
        </button>
      )}
    </div>
  );
}