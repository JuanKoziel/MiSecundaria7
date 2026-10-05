import os
import sys
import json
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE, 'proyecto'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

BASE_URL = 'http://localhost:8000/api'

dj_user, _ = User.objects.get_or_create(username='Jefe_preceptores', defaults={'is_active': True})
dj_user.is_active = True
dj_user.save()

token = str(RefreshToken.for_user(dj_user).access_token)


def get(path, extra_headers=None):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(BASE_URL + path, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))


me = get('/me/')
print('ME:', json.dumps(me, ensure_ascii=False))

pr = get('/preceptores/', {'X-Rol-Activo': 'jefe_preceptores'})
ids = [(p['id_preceptor'], p['id_usuario'], p['usuario']) for p in pr]
print('PRECEPTORES:', ids)
print('Contiene 1671?', any(p['id_usuario'] == me.get('id_usuario') for p in pr))