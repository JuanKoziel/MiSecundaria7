// Configuración de módulos horarios institucionales.
// Horario: 07:30 a 19:30, módulos de 1 hora (duración configurable).

export const HORA_INICIO_INSTITUCIONAL = '07:30';
export const HORA_FIN_INSTITUCIONAL = '19:30';
export const DURACION_MODULO_MIN = 60;

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

function minutosDesdeHora(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + (m || 0);
}

function horaDesdeMinutos(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Genera la lista de módulos según duración y franja institucional.
export function generarModulos(
  duracion = DURACION_MODULO_MIN,
  inicio = HORA_INICIO_INSTITUCIONAL,
  fin = HORA_FIN_INSTITUCIONAL,
) {
  const modulos = [];
  const minFin = minutosDesdeHora(fin);
  let actual = minutosDesdeHora(inicio);
  let numero = 1;
  while (actual + duracion <= minFin) {
    const horaInicio = horaDesdeMinutos(actual);
    const horaFin = horaDesdeMinutos(actual + duracion);
    modulos.push({
      numero,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      label: `Módulo ${numero} (${horaInicio} - ${horaFin})`,
    });
    actual += duracion;
    numero += 1;
  }
  return modulos;
}

export const MODULOS = generarModulos();

export function moduloPorNumero(numero) {
  return MODULOS.find((m) => m.numero === Number(numero)) || null;
}

// Devuelve el número de módulo correspondiente a una hora dada (Date).
export function moduloActual(fecha = new Date()) {
  const min = fecha.getHours() * 60 + fecha.getMinutes();
  const m = MODULOS.find(
    (mod) =>
      min >= minutosDesdeHora(mod.hora_inicio) &&
      min < minutosDesdeHora(mod.hora_fin),
  );
  return m ? m.numero : null;
}

// Devuelve el nombre del día de la semana (Lunes..Sábado) para una fecha.
export function diaSemanaNombre(fecha = new Date()) {
  // getDay(): 0=Domingo, 1=Lunes...
  const idx = fecha.getDay();
  if (idx === 0) return 'Domingo';
  return DIAS_SEMANA[idx - 1];
}
