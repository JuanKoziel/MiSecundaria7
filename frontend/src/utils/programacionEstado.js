/**
 * Programación de habilitación / deshabilitación de cuentas (punto 5.9).
 *
 * Contexto: el backend guarda dos campos independientes,
 * `fecha_deshabilitacion_programada` y `fecha_habilitacion_programada`, y
 * `escuela.usuario_estado.aplicar_programaciones_usuario` aplica el que ya
 * venció y lo limpia.
 *
 * El bug que se corregía acá: la validación pedía SIEMPRE
 * `habilitacion <= deshabilitacion`, sin importar el estado actual de la cuenta.
 * Eso hacía imposible dos casos perfectlyamente válidos, que son los que el plan
 * pide permitir:
 *
 *   - cuenta HABILITADA, con una deshabilitación ya agendada → se quiere
 *     programar la re-habilitación posterior a esa fecha.
 *   - cuenta DESHABILITADA, con una habilitación ya agendada → se quiere
 *     programar la deshabilitación posterior a esa fecha.
 *
 * La regla correcta no es "habilitación antes que deshabilitación" sino: **la
 * primera acción de la línea de tiempo tiene que ser la opuesta al estado
 * actual de la cuenta**, y la segunda tiene que ir después. Todo lo demás se
 * acepta.
 *
 * No se valida contra la fecha actual a propósito: se permite agendar en el
 * pasado si la secuencia es coherente, que es lo que pide el plan.
 */

const RE_INPUT_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function esFechaValida(value) {
  if (typeof value !== 'string' || !RE_INPUT_DATETIME.test(value)) return false;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function fechaDesdeInput(value) {
  // `new Date('2026-03-05T14:30')` se interpreta como hora LOCAL, que es
  // exactamente lo que necesitamos para comparar dos valores del mismo input.
  return esFechaValida(value) ? new Date(value).getTime() : null;
}

function formatearCorta(value) {
  if (!esFechaValida(value)) return '';
  const [y, m, d, hh = '00', mm = '00'] = value.split(/[-T:]/);
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

/**
 * Convierte un ISO del backend al formato que espera `<input type="datetime-local">`.
 *
 * `toISOString()` devuelve UTC, así que sincorrer el offset antes de cortar los
 * minutos: si no, una fecha cargada a las 18:00 aparece como 21:00 y al guardar
 * se corre tres horas.
 */
export function aInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Valida el par de fechas programadas de una cuenta.
 *
 * @param {object} params
 * @param {boolean|null} params.estadoInicial `true` = habilitada. `null`/`undefined`
 *   cuando la persona todavía no tiene usuario: en ese caso no se puede exigir
 *   un orden, porque no se sabe de qué estado se parte.
 * @param {string} params.deshabilitacion valor del input, `''` si no se programa.
 * @param {string} params.habilitacion valor del input, `''` si no se programa.
 * @returns {{error: string|null}} `error` es `null` cuando la programación es válida.
 */
export function validarProgramacionEstado({ estadoInicial, deshabilitacion, habilitacion } = {}) {
  const deshab = fechaDesdeInput(deshabilitacion);
  const hab = fechaDesdeInput(habilitacion);
  const hayDeshab = deshab !== null;
  const hayHab = hab !== null;

  if (!hayDeshab && !hayHab) {
    return { error: 'Ingresá al menos una fecha programada (deshabilitación o habilitación).' };
  }

  // Con una sola fecha no hay orden que verificar: no se la compara contra la
  // fecha actual, sino contra la acción opuesta que ya esté programada.
  if (!hayDeshab || !hayHab) return { error: null };

  // Las dos: la primera de la línea de tiempo tiene que ser la opuesta al
  // estado actual, o la primera de las dos no haría nada.
  if (estadoInicial === null || estadoInicial === undefined) return { error: null };

  const primero = deshab <= hab ? 'deshabilitacion' : 'habilitacion';
  const esperada = estadoInicial ? 'deshabilitacion' : 'habilitacion';

  if (primero !== esperada) {
    const fechaDeshab = formatearCorta(deshabilitacion);
    const fechaHab = formatearCorta(habilitacion);
    return {
      error: estadoInicial
        ? `La cuenta está habilitada: la deshabilitación (${fechaDeshab}) tiene que ser anterior a la `
          + `habilitación (${fechaHab}).`
        : `La cuenta está deshabilitada: la habilitación (${fechaHab}) tiene que ser anterior a la `
          + `deshabilitación (${fechaDeshab}).`,
    };
  }

  return { error: null };
}

/**
 * Igual que `validarProgramacionEstado` pero devuelve el string del error, que es
 * la forma en que se consume en los formularios.
 */
export function errorProgramacion(params) {
  return validarProgramacionEstado(params).error;
}
