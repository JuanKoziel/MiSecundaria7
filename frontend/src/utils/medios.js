const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Origen del backend sin el prefijo `/api`.
 *
 * El endpoint `POST /api/upload/` devuelve la ruta ya con `MEDIA_URL`
 * (`/media/carpeta/archivo.pdf`). Como los archivos se sirven en `/media/...`
 * y no en `/api/media/...`, concatenar `API_BASE` sobre esa ruta producía un
 * 404 al abrir o descargar cualquier archivo subido.
 */
const ORIGEN = API_BASE.replace(/\/api\/?$/, '');

/**
 * Resuelve la URL de un archivo guardado en un campo `ruta_archivo`.
 *
 * - Cadena vacía o nula: devuelve `''`.
 * - URL absoluta (`http`, `https`, `blob`, `data`): se devuelve tal cual.
 * - Ruta relativa que ya empieza por `/media/`: se antepone el origen.
 * - Cualquier otra ruta: se le antepone el origen como absoluta.
 */
export function buildMediaUrl(ruta) {
  if (!ruta || typeof ruta !== 'string') return '';
  const valor = ruta.trim();
  if (!valor) return '';
  if (/^(https?:|blob:|data:)/i.test(valor)) return valor;
  if (valor.startsWith('/media/') || valor.startsWith('media/')) {
    return `${ORIGEN}${valor.startsWith('/') ? '' : '/'}${valor}`;
  }
  return `${ORIGEN}/${valor.replace(/^\/+/, '')}`;
}

export default buildMediaUrl;
