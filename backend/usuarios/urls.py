<<<<<<< HEAD:backend/gestion_escolar/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para los ViewSets
router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet, basename='usuario')
router.register(r'roles', views.RolViewSet, basename='rol')
router.register(r'docentes', views.DocenteViewSet, basename='docente')
router.register(r'alumnos', views.AlumnoViewSet, basename='alumno')
router.register(r'padres', views.PadreTutorViewSet, basename='padre-tutor')
router.register(r'cursos', views.CursoViewSet, basename='curso')
router.register(r'materias', views.MateriaViewSet, basename='materia')
router.register(r'curso-materia', views.CursoMateriaViewSet, basename='curso-materia')
router.register(r'ciclos-lectivos', views.CicloLectivoViewSet, basename='ciclo-lectivo')

app_name = 'gestion_escolar'

urlpatterns = [
    # Rutas de autenticación
    path('auth/login/', views.login_view, name='login'),
    path('auth/refresh/', views.refresh_token_view, name='refresh-token'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # Rutas del router
    path('', include(router.urls)),
]
=======
from django.urls import path

urlpatterns = [
]
>>>>>>> 5e4dc3228e3b802dcda3721ee7db3cdb90281b0f:backend/usuarios/urls.py
