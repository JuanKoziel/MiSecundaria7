import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.url?.endsWith('/login/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

let refreshEnCurso = null;

function refrescarAccessToken(refresh) {
  if (!refreshEnCurso) {
    refreshEnCurso = axios
      .post(`${API_BASE}/token/refresh/`, { refresh })
      .then(({ data }) => {
        localStorage.setItem('access_token', data.access);
        return data.access;
      })
      .finally(() => {
        refreshEnCurso = null;
      });
  }
  return refreshEnCurso;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (original.url?.endsWith('/login/')) {
        return Promise.reject(error);
      }
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const access = await refrescarAccessToken(refresh);
          original.headers.Authorization = `Bearer ${access}`;
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

export async function seleccionarRol(rol) {
  const { data } = await api.post('/rol-activo/', { rol });
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

export async function deleteMiDdjjDocente(idDocente) {
  await api.delete('/ddjj-docente/mi-ddjj/', {
    params: { id_docente: idDocente },
  });
}

export async function getPreceptores(rol) {
  const { data } = await api.get('/preceptores/', {
    params: rol ? { rol } : {},
  });
  return data;
}

export async function getDirectivos() {
  const { data } = await api.get('/directivos/');
  return data;
}

export async function createPreceptor(payload, rol) {
  const { data } = await api.post('/preceptores/', payload, {
    params: rol ? { rol } : {},
  });
  return data;
}

export async function updatePreceptor(id, payload, rol) {
  const { data } = await api.patch(`/preceptores/${id}/`, payload, {
    params: rol ? { rol } : {},
  });
  return data;
}

export async function deletePreceptor(id, rol) {
  await api.delete(`/preceptores/${id}/`, {
    params: rol ? { rol } : {},
  });
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

export async function getDocentesDisponibles(curso) {
  const params = {};
  if (curso) params.curso = curso;
  const { data } = await api.get('/asistencias-docentes/docentes-disponibles/', { params });
  return data;
}

export async function registrarAsistenciaDocente(payload) {
  const { data } = await api.post('/asistencias-docentes/registrar-asistencia-docente/', payload);
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

export async function marcarLeida(id) {
  const { data } = await api.patch(`/notificaciones/${id}/marcar_leida/`);
  return data;
}

export async function marcarTodasLeidas(params) {
  const { data } = await api.patch('/notificaciones/marcar_todas_leidas/', null, { params });
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

export async function getEventosInstitucionales(params) {
  const { data } = await api.get('/eventos-institucionales/', { params });
  return data;
}

export async function createEventoInstitucional(payload) {
  const { data } = await api.post('/eventos-institucionales/', payload);
  return data;
}

export async function updateEventoInstitucional(id, payload) {
  const { data } = await api.patch(`/eventos-institucionales/${id}/`, payload);
  return data;
}

export async function deleteEventoInstitucional(id) {
  await api.delete(`/eventos-institucionales/${id}/`);
}

export async function getEstadisticasPreceptoria() {
  const { data } = await api.get('/estadisticas-preceptoria/');
  return data;
}

export async function getSupervisionPreceptores() {
  const { data } = await api.get('/supervision-preceptores/');
  return data;
}

export async function getHistorialCambios(params) {
  const { data } = await api.get('/historial/', { params });
  return data;
}

export async function getTiposAccion() {
  const { data } = await api.get('/tipos-accion/');
  return data;
}

export async function getSuplencias(params) {
  const { data } = await api.get('/suplencias/', { params });
  return data;
}

export async function createSuplencia(payload) {
  const { data } = await api.post('/suplencias/', payload);
  return data;
}

export async function updateSuplencia(id, payload) {
  const { data } = await api.patch(`/suplencias/${id}/`, payload);
  return data;
}

export async function deleteSuplencia(id) {
  await api.delete(`/suplencias/${id}/`);
}

export async function finalizarSuplencia(id) {
  const { data } = await api.post(`/suplencias/${id}/finalizar/`);
  return data;
}

export async function getAdelantosHoras(params) {
  const { data } = await api.get('/adelantos-horas/', { params });
  return data;
}

export async function createAdelantoHoras(payload) {
  const { data } = await api.post('/adelantos-horas/', payload);
  return data;
}

export async function updateAdelantoHoras(id, payload) {
  const { data } = await api.patch(`/adelantos-horas/${id}/`, payload);
  return data;
}

export async function deleteAdelantoHoras(id) {
  await api.delete(`/adelantos-horas/${id}/`);
}

export async function getLibroTemas(params) {
  const { data } = await api.get('/libro-temas/', { params });
  return data;
}

export async function createLibroTema(payload) {
  const { data } = await api.post('/libro-temas/', payload);
  return data;
}

export async function updateLibroTema(id, payload) {
  const { data } = await api.patch(`/libro-temas/${id}/`, payload);
  return data;
}

export async function deleteLibroTema(id) {
  await api.delete(`/libro-temas/${id}/`);
}

// --- Sistema Académico Avanzado ---

export async function getHistorialAcademico(params) {
  const { data } = await api.get('/historial-academico/', { params });
  return data;
}

export async function getMateriasAdeudadas(params) {
  const { data } = await api.get('/materias-adeudadas/', { params });
  return data;
}

export async function rendirMateriaAdeudada(id, payload) {
  const { data } = await api.post(`/materias-adeudadas/${id}/rendir/`, payload);
  return data;
}

export async function getActividadesMateriasAdeudadas(params) {
  const { data } = await api.get('/actividades-materias-adeudadas/', { params });
  return data;
}

export async function createActividadMateriaAdeudada(payload) {
  const { data } = await api.post('/actividades-materias-adeudadas/', payload);
  return data;
}

export async function updateActividadMateriaAdeudada(id, payload) {
  const { data } = await api.patch(`/actividades-materias-adeudadas/${id}/`, payload);
  return data;
}

export async function deleteActividadMateriaAdeudada(id) {
  await api.delete(`/actividades-materias-adeudadas/${id}/`);
}

export async function getIntensificacionesAcademicas(params) {
  const { data } = await api.get('/intensificaciones-academicas/', { params });
  return data;
}

export async function updateIntensificacionAcademica(id, payload) {
  const { data } = await api.patch(`/intensificaciones-academicas/${id}/`, payload);
  return data;
}

export async function createIntensificacionAcademica(payload) {
  const { data } = await api.post('/intensificaciones-academicas/', payload);
  return data;
}

export async function getRegistroRendicionesPrevias(params) {
  const { data } = await api.get('/registro-rendiciones-previas/', { params });
  return data;
}

export async function getBoletinAcademico(alumnoId) {
  const { data } = await api.get(`/boletin-academico/${alumnoId}/`);
  return data;
}


export default api;
