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
    previas: 'previas',
    recursadas: 'calificaciones',
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
    recursadas: 'calificaciones',
    comunicados: 'comunicados',
    horarios: 'horarios',
    eventos: 'calendario',
    resumen: 'resumen',
    perfil: 'perfil',
  },
  docente: {
    comunicados: 'comunicados',
    actas: 'actas',
    eventos: 'calendario',
    materias_adeudadas: 'materias-adeudadas',
    adelantos: 'docente',
    suplencias: 'docente',
  },
  preceptor: {
    adelantos: 'adelantos-horas',
    actas: 'actas',
    comunicados: 'comunicados',
    eventos: 'calendario',
    perfil: 'perfil',
  },
  admin: {
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