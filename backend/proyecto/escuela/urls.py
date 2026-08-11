from django.urls import path, include
from rest_framework.routers import DefaultRouter

from escuela import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'roles', views.RolViewSet)
router.register(r'alumnos', views.AlumnoViewSet)
router.register(r'docentes', views.DocenteViewSet)
router.register(r'ddjj-docente', views.DdjjDocenteViewSet)
router.register(r'actividades-docente', views.ActividadDocenteViewSet)
router.register(r'preceptores', views.PreceptorViewSet)
router.register(r'directivos', views.DirectivoViewSet)
router.register(r'padres-tutores', views.PadreTutorViewSet)
router.register(r'ciclos-lectivos', views.CicloLectivoViewSet)
router.register(r'cursos', views.CursoViewSet)
router.register(r'materias', views.MateriaViewSet)
router.register(r'curso-materia', views.CursoMateriaViewSet)
router.register(r'suplencias', views.SuplenciaDocenteViewSet)
router.register(r'modulos', views.ModuloViewSet)
router.register(r'horarios-especiales', views.HorarioEspecialViewSet)
router.register(r'horarios', views.HorarioViewSet)
router.register(r'inscripciones', views.InscripcionMateriaViewSet)
router.register(r'periodos', views.PeriodoEvaluacionViewSet)
router.register(r'calificaciones', views.CalificacionViewSet)
router.register(r'estados-asistencia', views.EstadoAsistenciaViewSet)
router.register(r'asistencias', views.AsistenciaViewSet)
router.register(r'asistencias-docentes', views.AsistenciaDocenteViewSet, basename='asistencias-docentes')
router.register(r'tipos-acta', views.TipoActaViewSet)
router.register(r'actas', views.ActaViewSet)
router.register(r'acta-alumno', views.ActaAlumnoViewSet)
router.register(r'acta-curso', views.ActaCursoViewSet)
router.register(r'acta-docente', views.ActaDocenteViewSet)
router.register(r'comunicados', views.ComunicadoViewSet)
router.register(r'comunicado-archivo', views.ComunicadoArchivoViewSet)
router.register(r'planificaciones', views.PlanificacionViewSet)
router.register(r'diagnosticos-grupales', views.DiagnosticoGrupalViewSet)
router.register(r'notificaciones', views.NotificacionViewSet)
router.register(r'tipos-accion', views.TipoAccionViewSet)
router.register(r'historial', views.HistorialCambioViewSet)
router.register(r'eventos-institucionales', views.EventoInstitucionalViewSet, basename='eventos-institucionales')
router.register(r'libro-temas', views.LibroTemaViewSet)
router.register(r'adelantos-horas', views.AdelantoHorasViewSet)

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('me/', views.me_view, name='me'),
    path('upload/', views.upload_file, name='upload_file'),
    path('estadisticas-preceptoria/', views.estadisticas_preceptoria, name='estadisticas-preceptoria'),
    path('supervision-preceptores/', views.supervision_preceptores, name='supervision-preceptores'),
    path('', include(router.urls)),
]
