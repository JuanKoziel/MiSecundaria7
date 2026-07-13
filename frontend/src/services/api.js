import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/token/refresh/`, {
            refresh,
          });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  },
);

export async function login(usuario, contrasena) {
  const { data } = await api.post('/login/', { usuario, contrasena });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getMe() {
  const { data } = await api.get('/me/');
  return data;
}

export async function getAlumnos(params) {
  const { data } = await api.get('/alumnos/', { params });
  return data;
}

export async function getDocentes() {
  const { data } = await api.get('/docentes/');
  return data;
}

export async function getMiDdjjDocente() {
  const { data } = await api.get('/ddjj-docente/mi-ddjj/');
  return data;
}

export async function uploadMiDdjjDocente(file) {
  const formData = new FormData();
  formData.append('archivo', file);
  const { data } = await api.post('/ddjj-docente/mi-ddjj/', formData);
  return data;
}

export async function getActividades(params) {
  const { data } = await api.get('/actividades-docente/', { params });
  return data;
}

export async function createActividad(payload) {
  const { data } = await api.post('/actividades-docente/', payload);
  return data;
}

export async function updateActividad(id, payload) {
  const { data } = await api.patch(`/actividades-docente/${id}/`, payload);
  return data;
}

export async function deleteActividad(id) {
  await api.delete(`/actividades-docente/${id}/`);
}

export async function deleteActividadArchivo(idActividad, idArchivo) {
  const { data } = await api.delete(`/actividades-docente/${idActividad}/archivos/${idArchivo}/`);
  return data;
}

export async function getDdjjDocenteArchivo(idDdjj) {
  const { data } = await api.get(`/ddjj-docente/${idDdjj}/archivo/`);
  return data;
}

export async function deleteMiDdjjDocente(idDocente) {
  await api.delete('/ddjj-docente/mi-ddjj/', {
    params: { id_docente: idDocente },
  });
}

export async function getPreceptores() {
  const { data } = await api.get('/preceptores/');
  return data;
}

export async function getDirectivos() {
  const { data } = await api.get('/directivos/');
  return data;
}

export async function createPreceptor(payload) {
  const { data } = await api.post('/preceptores/', payload);
  return data;
}

export async function updatePreceptor(id, payload) {
  const { data } = await api.patch(`/preceptores/${id}/`, payload);
  return data;
}

export async function deletePreceptor(id) {
  await api.delete(`/preceptores/${id}/`);
}

export async function getCursos(params) {
  const { data } = await api.get('/cursos/', { params });
  return data;
}

export async function getMaterias(params) {
  const { data } = await api.get('/materias/', { params });
  return data;
}

export async function getCursoMateria(params) {
  const { data } = await api.get('/curso-materia/', { params });
  return data;
}

export async function createCurso(payload) {
  const { data } = await api.post('/cursos/', payload);
  return data;
}

export async function updateCurso(id, payload) {
  const { data } = await api.patch(`/cursos/${id}/`, payload);
  return data;
}

export async function createMateria(payload) {
  const { data } = await api.post('/materias/', payload);
  return data;
}

export async function updateMateria(id, payload) {
  const { data } = await api.patch(`/materias/${id}/`, payload);
  return data;
}

export async function getCalificaciones(params) {
  const { data } = await api.get('/calificaciones/', { params });
  return data;
}

export async function createCalificacion(payload) {
  const { data } = await api.post('/calificaciones/', payload);
  return data;
}

export async function updateCalificacion(id, payload) {
  const { data } = await api.patch(`/calificaciones/${id}/`, payload);
  return data;
}

export async function getServerTime(cursoMateriaId) {
  const params = cursoMateriaId ? { curso_materia: cursoMateriaId } : {};
  const { data } = await api.get('/asistencias/server-time/', { params });
  return data;
}

export async function getAsistenciasAlumnoDetalle(cursoMateriaId, alumnoId) {
  const params = {};
  if (cursoMateriaId) params.curso_materia = cursoMateriaId;
  if (alumnoId) params.id_alumno = alumnoId;
  const { data } = await api.get('/asistencias/alumno-detalle/', { params });
  return data;
}

export async function getAsistenciasPreceptorMateria(cursoMateriaId, params = {}) {
  const { data } = await api.get('/asistencias/preceptor-materia/', {
    params: { curso_materia: cursoMateriaId, ...params },
  });
  return data;
}

export async function patchJustificar(asistenciaId, justificado) {
  const { data } = await api.patch(`/asistencias/${asistenciaId}/justificar/`, { justificado });
  return data;
}

export async function getAsistencias(params) {
  const { data } = await api.get('/asistencias/', { params });
  return data;
}

export async function createAsistencia(payload) {
  const { data } = await api.post('/asistencias/', payload);
  return data;
}

export async function updateAsistencia(id, payload) {
  const { data } = await api.patch(`/asistencias/${id}/`, payload);
  return data;
}

export async function getEstadosAsistencia() {
  const { data } = await api.get('/estados-asistencia/');
  return data;
}

export async function getAsistenciaDiaria(curso, fecha) {
  const { data } = await api.get('/asistencias/asistencia-diaria/', {
    params: { curso, fecha },
  });
  return data;
}

export async function getRegistroDiario(curso, params = {}) {
  const { data } = await api.get('/asistencias/registro-diario/', {
    params: { curso, ...params },
  });
  return data;
}

export async function getActas(params) {
  const { data } = await api.get('/actas/', { params });
  return data;
}

export async function createActa(payload) {
  const { data } = await api.post('/actas/', payload);
  return data;
}

export async function getActaAlumno(params) {
  const { data } = await api.get('/acta-alumno/', { params });
  return data;
}

export async function getActaCurso(params) {
  const { data } = await api.get('/acta-curso/', { params });
  return data;
}

export async function getActaDocente(params) {
  const { data } = await api.get('/acta-docente/', { params });
  return data;
}

export async function createActaDocente(payload) {
  const { data } = await api.post('/acta-docente/', payload);
  return data;
}

export async function deleteActa(id) {
  await api.delete(`/actas/${id}/`);
}

export async function deleteActaAlumno(id) {
  await api.delete(`/acta-alumno/${id}/`);
}

export async function updateActaAlumno(id, payload) {
  const { data } = await api.patch(`/acta-alumno/${id}/`, payload);
  return data;
}

export async function updateActaDocente(id, payload) {
  const { data } = await api.patch(`/acta-docente/${id}/`, payload);
  return data;
}

export async function deleteActaCurso(id) {
  await api.delete(`/acta-curso/${id}/`);
}

export async function deleteActaDocente(id) {
  await api.delete(`/acta-docente/${id}/`);
}

export async function getModulos() {
  const { data } = await api.get('/modulos/');
  return data;
}

export async function getHorarios(params) {
  const { data } = await api.get('/horarios/', { params });
  return data;
}

export async function createHorario(payload) {
  const { data } = await api.post('/horarios/', payload);
  return data;
}

export async function updateHorario(id, payload) {
  const { data } = await api.patch(`/horarios/${id}/`, payload);
  return data;
}

export async function deleteHorario(id) {
  await api.delete(`/horarios/${id}/`);
}

export async function getHorariosEspeciales(params) {
  const { data } = await api.get('/horarios-especiales/', { params });
  return data;
}

export async function createHorarioEspecial(payload) {
  const { data } = await api.post('/horarios-especiales/', payload);
  return data;
}

export async function updateHorarioEspecial(id, payload) {
  const { data } = await api.patch(`/horarios-especiales/${id}/`, payload);
  return data;
}

export async function deleteHorarioEspecial(id) {
  await api.delete(`/horarios-especiales/${id}/`);
}

export async function getCiclosLectivos() {
  const { data } = await api.get('/ciclos-lectivos/');
  return data;
}

export async function getPeriodos() {
  const { data } = await api.get('/periodos/');
  return data;
}

export async function getNotificaciones(params) {
  const { data } = await api.get('/notificaciones/', { params });
  return data;
}

export async function getPlanificaciones(params) {
  const { data } = await api.get('/planificaciones/', { params });
  return data;
}

export async function createPlanificacion(payload) {
  const { data } = await api.post('/planificaciones/', payload);
  return data;
}

export async function getDiagnosticosGrupales(params) {
  const { data } = await api.get('/diagnosticos-grupales/', { params });
  return data;
}

export async function createDiagnosticoGrupal(payload) {
  const { data } = await api.post('/diagnosticos-grupales/', payload);
  return data;
}

export async function deleteDiagnosticoGrupal(id) {
  await api.delete(`/diagnosticos-grupales/${id}/`);
}

export async function getPadresTutores() {
  const { data } = await api.get('/padres-tutores/');
  return data;
}

export async function createPadreTutor(payload) {
  const { data } = await api.post('/padres-tutores/', payload);
  return data;
}

export async function updatePadreTutor(id, payload) {
  const { data } = await api.patch(`/padres-tutores/${id}/`, payload);
  return data;
}

export async function deletePadreTutor(id) {
  await api.delete(`/padres-tutores/${id}/`);
}

export async function getInscripciones(params) {
  const { data } = await api.get('/inscripciones/', { params });
  return data;
}

export async function getTiposActa() {
  const { data } = await api.get('/tipos-acta/');
  return data;
}

export async function getRoles() {
  const { data } = await api.get('/roles/');
  return data;
}

export async function getUsuarios() {
  const { data } = await api.get('/usuarios/');
  return data;
}

export async function createUsuario(payload) {
  const { data } = await api.post('/usuarios/', payload);
  return data;
}

export async function updateUsuario(id, payload) {
  const { data } = await api.patch(`/usuarios/${id}/`, payload);
  return data;
}

export async function deleteUsuario(id) {
  await api.delete(`/usuarios/${id}/`);
}

export async function createAlumno(payload) {
  const { data } = await api.post('/alumnos/', payload);
  return data;
}

export async function updateAlumno(id, payload) {
  const { data } = await api.patch(`/alumnos/${id}/`, payload);
  return data;
}

export async function deleteAlumno(id) {
  await api.delete(`/alumnos/${id}/`);
}

export async function createDocente(payload) {
  const { data } = await api.post('/docentes/', payload);
  return data;
}

export async function updateDocente(id, payload) {
  const { data } = await api.patch(`/docentes/${id}/`, payload);
  return data;
}

export async function deleteDocente(id) {
  await api.delete(`/docentes/${id}/`);
}

export async function createCursoMateria(payload) {
  const { data } = await api.post('/curso-materia/', payload);
  return data;
}

export async function updateCursoMateria(id, payload) {
  const { data } = await api.patch(`/curso-materia/${id}/`, payload);
  return data;
}

export async function deleteCursoMateria(id) {
  await api.delete(`/curso-materia/${id}/`);
}

export async function createActaCurso(payload) {
  const { data } = await api.post('/acta-curso/', payload);
  return data;
}

export async function createActaAlumno(payload) {
  const { data } = await api.post('/acta-alumno/', payload);
  return data;
}

export async function createNotificacion(payload) {
  const { data } = await api.post('/notificaciones/', payload);
  return data;
}

export async function getComunicados(params) {
  const { data } = await api.get('/comunicados/', { params });
  return data;
}

export async function createComunicado(payload) {
  const { data } = await api.post('/comunicados/', payload);
  return data;
}

export async function deleteComunicado(id) {
  await api.delete(`/comunicados/${id}/`);
}

export async function createComunicadoArchivo(payload) {
  const { data } = await api.post('/comunicado-archivo/', payload);
  return data;
}

export async function uploadFile(file, carpeta = 'general') {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('carpeta', carpeta);
  const { data } = await api.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateActa(id, payload) {
  const { data } = await api.patch(`/actas/${id}/`, payload);
  return data;
}

export async function updatePlanificacion(id, payload) {
  const { data } = await api.patch(`/planificaciones/${id}/`, payload);
  return data;
}

export async function deletePlanificacion(id) {
  await api.delete(`/planificaciones/${id}/`);
}

export default api;
