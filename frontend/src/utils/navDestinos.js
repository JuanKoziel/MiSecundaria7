// Mapeo de destinos de notificación (semánticos, emitidos por el backend en
// `nav_destino`) al nombre de vista REAL de cada dashboard (`view` /
// `seccionActiva`). Cada dashboard usa identificadores propios; este util
// centraliza la traducción por rol para que la navegación desde una
// notificación llegue a una sección existente y válida.
//
// La clave es `nav_destino` (p. ej. 'calificaciones', 'eventos', 'recursadas');
// el valor es la vista concreta de ese rol. Si no hay una vista adecuada para
// el rol, devuelve `null` (la notificación se muestra pero no navega).

const MAPA_POR_ROL = {
  alumno: {
    calificaciones: 'calificaciones',
    boletin: 'calificaciones',
    asistencias: 'asistencias',
    // Las adeudadas/previas/rendiciones/intensificaciones se consultan en
    // el panel unificado "Materias Adeudadas" del estudiante.
    previas: 'materias-adeudadas',
    rendiciones: 'materias-adeudadas',
    recursadas: 'materias-adeudadas',
    intensificaciones: 'materias-adeudadas',
    actividades: 'materias-adeudadas',
    comunicados: 'comunicados',
    horarios: 'horarios',
    eventos: 'calendario',
    perfil: 'perfil',
  },
  familia: {
    calificaciones: 'calificaciones',
    boletin: 'calificaciones',
    asistencias: 'asistencias',
    actas: 'actas',
    previas: 'calificaciones',
    rendiciones: 'calificaciones',
    recursadas: 'calificaciones',
    intensificaciones: 'calificaciones',
    comunicados: 'comunicados',
    horarios: 'horarios',
    eventos: 'calendario',
    actividades: 'actividades',
    resumen: 'resumen',
    perfil: 'perfil',
  },
  docente: {
    comunicados: 'comunicados',
    actas: 'actas',
    eventos: 'calendario',
    materias_adeudadas: 'actividades',
    // Las suplencias asignadas se consultan en el panel del docente
    // (PanelDocente lista sus suplencias). Los adelantos no tienen apartado
    // en este rol, por lo que quedan sin navegación.
    suplencias: 'docente',
  },
  preceptor: {
    adelantos: 'adelantos-horas',
    actas: 'actas',
    asistencias: 'asistencias',
    notas: 'notas',
    horarios: 'horarios',
    comunicados: 'comunicados',
    eventos: 'calendario',
    gestion_diaria: 'panel-diario',
    perfil: 'perfil',
  },
  admin: {
    adelantos: 'adelantos-horas',
    suplencias: 'suplencias',
    actas: 'actas',
    asistencias: 'asistencias',
    horarios: 'horarios',
    notas: 'notas',
    comunicados: 'comunicados',
    eventos: 'calendario',
    perfil: 'perfil',
  },
};

// Sinónimos de rol a una llave normalizada.
const ROL_EQUIV = {
  jefe_preceptores: 'preceptor',
  director: 'admin',
};

export function viewDesdeDestino(destino, rol) {
  const rolNorm = ROL_EQUIV[rol] || rol;
  const mapa = MAPA_POR_ROL[rolNorm];
  if (!mapa || !destino) return null;
  return mapa[destino] || null;
}

export function tieneVistaParaDestino(destino, rol) {
  return viewDesdeDestino(destino, rol) !== null;
}

// Fallback de navegación por TÍTULO: algunas notificaciones fueron emitidas
// antes de que el backend adjuntara el marcador [nav:...], por lo que no tienen
// `nav_destino`. Se deriva un destino semántico a partir del título para que
// igualmente muestren "Ver" y naveguen (todas apuntan a Calificaciones).
export function destinoDesdeTitulo(titulo) {
  const t = String(titulo || '').toLowerCase();
  if (t.includes('intensificaci')) return 'intensificaciones';
  if (t.includes('calificaci')) return 'calificaciones';
  if (t.includes('previa')) return 'previas';
  if (t.includes('rendici')) return 'rendiciones';
  return null;
}