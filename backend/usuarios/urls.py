from django.urls import path
from . import views

urlpatterns = [
    path('usuarios/me/', views.me_view, name='me'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/refresh/', views.refresh_token_view, name='refresh-token'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/forgot-password/', views.forgot_password_view, name='forgot-password'),
    path('auth/reset-password/', views.reset_password_view, name='reset-password'),
]
