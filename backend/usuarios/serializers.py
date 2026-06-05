from django.contrib.auth.hashers import check_password, make_password
from rest_framework import serializers

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField(source='username')
    estado = serializers.BooleanField(source='is_active')
    rol_nombres = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'usuario', 'estado', 'email', 'rol', 'rol_nombres']

    def get_rol_nombres(self, obj):
        return [obj.rol] if obj.rol else []


class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    contrasena = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('usuario')
        password = attrs.get('contrasena')

        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist as exc:
            raise serializers.ValidationError('Usuario o contraseña incorrectos') from exc

        if not user.is_active:
            raise serializers.ValidationError('El usuario está inactivo')

        if not check_password(password, user.password):
            raise serializers.ValidationError('Usuario o contraseña incorrectos')

        attrs['usuario_obj'] = user
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    usuario = UsuarioSerializer()
    rol_actual = serializers.CharField()
