# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from escuela.models import Usuario, UsuarioRol

ur = UsuarioRol.objects.select_related('id_rol').first()
user = Usuario.objects.get(pk=ur.id_usuario_id)
tok = str(RefreshToken.for_user(user).access_token)
client = APIClient()
client.credentials(HTTP_AUTHORIZATION='Bearer ' + tok)
resp = client.post('/api/notificaciones/enviar-recordatorio-ddjj/', {'id_docente': 14}, format='json')
print('STATUS:', resp.status_code)
print('OK?', resp.json() if resp.headers.get('content-type') and 'json' in resp.headers.get('content-type') else resp.content[:200])