import { apiRequest } from './client';

function pathWithQuery(base, params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const search = new URLSearchParams(filtered).toString();
  return `${base}${search ? `?${search}` : ''}`;
}

export function login(username, password) {
  return apiRequest('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe() {
  return apiRequest('/me/');
}

export function fetchCatalogos() {
  return apiRequest('/catalogos/');
}

export function fetchAlumnos(curso) {
  return apiRequest(pathWithQuery('/alumnos/', { curso }));
}

export function fetchDocentes() {
  return apiRequest('/docentes/');
}

export function fetchCalificaciones(params = {}) {
  return apiRequest(pathWithQuery('/calificaciones/', params));
}

export function saveCalificacionesBulk(payload) {
  return apiRequest('/calificaciones/bulk/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchAsistenciasDiarias(fecha, alumnoId) {
  return apiRequest(pathWithQuery('/asistencias-diarias/', { fecha, alumno_id: alumnoId }));
}

export function saveAsistenciasDiariasBulk(payload) {
  return apiRequest('/asistencias-diarias/bulk/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchNotasPreceptor(alumnoId) {
  return apiRequest(pathWithQuery('/notas-preceptor/', { alumno_id: alumnoId }));
}

export function saveNotasPreceptorBulk(items) {
  return apiRequest('/notas-preceptor/bulk/', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function fetchActasCurso(curso) {
  return apiRequest(pathWithQuery('/actas-curso/', { curso }));
}

export function fetchActasAlumno(alumnoId) {
  return apiRequest(pathWithQuery('/actas-alumno/', { alumno_id: alumnoId }));
}

export function fetchComunicados(curso) {
  return apiRequest(pathWithQuery('/comunicados/', { curso }));
}

export function fetchFamiliaHijos() {
  return apiRequest('/familia/hijos/');
}

export function fetchSesionClase(curso, materia, fecha) {
  return apiRequest(pathWithQuery('/sesiones-clase/', { curso, materia, fecha }));
}

export function saveSesionClase(payload) {
  return apiRequest('/sesiones-clase/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function mapUser(apiUser) {
  return {
    id: apiUser.id,
    username: apiUser.username.toUpperCase(),
    role: apiUser.role,
    nombre: apiUser.nombre,
    apellido: apiUser.apellido,
  };
}

export function mapHijo(apiHijo) {
  return {
    id: apiHijo.id,
    alumnoId: apiHijo.alumno_id,
    nombre: apiHijo.nombre,
    dni: apiHijo.dni,
    curso: apiHijo.curso,
    vinculo: apiHijo.vinculo,
  };
}
