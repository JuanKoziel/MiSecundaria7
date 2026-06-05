from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Usuario
from .serializers import LoginSerializer, UsuarioSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['usuario_obj']
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    refresh = RefreshToken.for_user(user)
    role = user.rol or 'sin_rol'

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': UsuarioSerializer(user).data,
        'rol_actual': role,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def refresh_token_view(request):
    try:
        refresh = RefreshToken(request.data.get('refresh'))
        return Response({'access': str(refresh.access_token)})
    except Exception:
        return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    return Response(UsuarioSerializer(request.user).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    return Response({'mensaje': 'Sesión cerrada correctamente'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password_view(request):
    usuario = request.data.get('usuario') or request.data.get('email')
    if not usuario:
        return Response({'error': 'Debe indicar un usuario o correo electrónico.'}, status=400)

    try:
        user = Usuario.objects.get(username=usuario) if '@' not in usuario else Usuario.objects.get(email=usuario)
    except Usuario.DoesNotExist:
        return Response({'mensaje': 'Si el usuario existe, se generó un token de recuperación.'}, status=200)

    token = default_token_generator.make_token(user)
    cache.set(f'pwd_reset:{user.pk}:{token}', True, timeout=900)

    return Response({
        'mensaje': 'Token de recuperación generado correctamente.',
        'token': token,
        'usuario': user.username,
    }, status=200)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_view(request):
    usuario = request.data.get('usuario')
    token = request.data.get('token')
    nueva = request.data.get('nueva_contrasena')
    confirmar = request.data.get('confirmar_contrasena')

    if not all([usuario, token, nueva, confirmar]):
        return Response({'error': 'Faltan datos para restablecer la contraseña.'}, status=400)
    if nueva != confirmar:
        return Response({'error': 'Las contraseñas no coinciden.'}, status=400)

    try:
        user = Usuario.objects.get(username=usuario)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)

    if not default_token_generator.check_token(user, token) or not cache.get(f'pwd_reset:{user.pk}:{token}'):
        return Response({'error': 'Token de recuperación inválido o expirado.'}, status=400)

    user.password = make_password(nueva)
    user.save(update_fields=['password'])
    cache.delete(f'pwd_reset:{user.pk}:{token}')

    return Response({'mensaje': 'Contraseña actualizada correctamente.'}, status=200)
