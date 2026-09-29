/**
 * Utilidades de fecha compartidas por los formularios.
 *
 * Nota sobre `hoy()`: se usan las partes locales de la fecha a propósito.
 * `toISOString()` convierte a UTC, y en Argentina (UTC-3) devuelve el día
 * siguiente a partir de las 21:00, lo que hacía que un formulario abierto por
 * la tarde cerrara con la fecha de mañana.
 */

function partesLocales(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Fecha de hoy en formato `YYYY-MM-DD`, según la hora local. */
export function hoy() {
  return partesLocales(new Date());
}

/** Suma (o resta) días a una fecha `YYYY-MM-DD` y devuelve `YYYY-MM-DD`. */
export function sumarDias(iso, dias) {
  if (!esFechaValida(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  return partesLocales(date);
}

const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Construye un `Date` en hora local desde un `YYYY-MM-DD`.
 *
 * OJO: `new Date('2026-09-26')` se interpreta como UTC y en Argentina
 * (UTC-3) cae en el día anterior, con lo que el sábado se reportaba como
 * viernes. Hay que armarlo con los números sueltos.
 */
function aDateLocal(iso) {
  if (!esFechaValida(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Día de la semana en hora local: 0 domingo … 6 sábado. */
function diaSemana(iso) {
  const d = aDateLocal(iso);
  return d ? d.getDay() : null;
}

/**
 * Valida una cadena `YYYY-MM-DD` y que corresponda a una fecha real.
 * Rechaza, por ejemplo, `2026-02-30`, que `new Date()` normalizaría a marzo.
 */
export function esFechaValida(iso) {
  if (typeof iso !== 'string' || !RE_ISO.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Calcula los atributos `min`/`max` para un `<input type="date">`.
 * Devuelve `{}` cuando no hay límites que aplicar.
 */
export function limitesFecha({ min, max } = {}) {
  const attrs = {};
  if (esFechaValida(min)) attrs.min = min;
  if (esFechaValida(max)) attrs.max = max;
  return attrs;
}

/**
 * Indica si una fecha cae sábado (6) o domingo (0).
 */
export function esFinDeSemana(fecha) {
  const dia = diaSemana(fecha);
  return dia === 0 || dia === 6;
}

/**
 * Devuelve la fecha de evento a usar: hoy, salvo que hoy sea fin de semana, en
 * cuyo caso devuelve el próximo lunes.
 */
export function hoyLaborable() {
  return proximaLaborable(hoy());
}

/**
 * Igual que `hoyLaborable` pero a partir de una fecha cualquiera. Si la fecha
 * base ya es laborable, la devuelve sin cambios.
 */
export function proximaLaborable(fecha) {
  const d = aDateLocal(fecha);
  if (!d) return fecha;
  if (d.getDay() !== 0 && d.getDay() !== 6) return fecha;
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return partesLocales(d);
}

/**
 * Normaliza el valor de un `<input type="date">` y acota contra `min`/`max`.
 *
 * IMPORTANTE: usar solo en `onBlur` o al enviar el formulario, NUNCA en
 * `onChange`. El input es controlado y edita por segmentos (día → mes → año);
 * si se reescribe el valor en cada pulsación, al escribir un día el navegador
 * emite un valor parcial, React lo fuerza de vuelta y el día tipeado se borra.
 */
export function validarCambioFecha(valor, { min, max } = {}) {
  if (valor === '') return { valor: '', error: null };
  if (!esFechaValida(valor)) {
    return { valor: '', error: 'La fecha ingressada no existe en el calendario.' };
  }
  if (esFechaValida(min) && valor < min) {
    return { valor: min, error: `La fecha no puede ser anterior a ${min.split('-').reverse().join('/')}.` };
  }
  if (esFechaValida(max) && valor > max) {
    return { valor: max, error: `La fecha no puede ser posterior a ${max.split('-').reverse().join('/')}.` };
  }
  return { valor, error: null };
}
