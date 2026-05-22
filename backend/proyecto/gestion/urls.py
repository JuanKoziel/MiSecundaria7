from django.urls import path

from . import views

urlpatterns = [
    path('auth/login/', views.LoginView.as_view()),
    path('me/', views.MeView.as_view()),
    path('catalogos/', views.CatalogosView.as_view()),
    path('alumnos/', views.AlumnoListView.as_view()),
    path('docentes/', views.DocenteListView.as_view()),
    path('calificaciones/', views.CalificacionListView.as_view()),
    path('calificaciones/bulk/', views.CalificacionBulkView.as_view()),
    path('asistencias-diarias/', views.AsistenciaDiariaListView.as_view()),
    path('asistencias-diarias/bulk/', views.AsistenciaDiariaBulkView.as_view()),
    path('notas-preceptor/', views.NotaPreceptorListView.as_view()),
    path('notas-preceptor/bulk/', views.NotaPreceptorBulkView.as_view()),
    path('actas-curso/', views.ActaCursoListView.as_view()),
    path('actas-alumno/', views.ActaAlumnoListView.as_view()),
    path('comunicados/', views.ComunicadoListView.as_view()),
    path('familia/hijos/', views.FamiliaHijosView.as_view()),
    path('sesiones-clase/', views.SesionClaseView.as_view()),
]
