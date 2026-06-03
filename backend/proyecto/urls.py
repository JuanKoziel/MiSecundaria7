from django.conf import settings
from django.conf.urls.static import static

from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [

    # Admin Django
    path(
        'admin/',
        admin.site.urls
    ),

    # APIs de la aplicación
    path(
        'api/',
        include('escuela.urls')
    ),

    # APIs de usuarios/autenticación
    path(
        'api/usuarios/',
        include('usuarios.urls')
    ),

    # JWT Login
    path(
        'api/token/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    # JWT Refresh
    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
]

# Archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )