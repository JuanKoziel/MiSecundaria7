import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE, 'proyecto'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto.settings')
django.setup()

from escuela.models import Preceptor, Usuario
from escuela.serializers import PreceptorSerializer

# Reproduce PreceptorViewSet.get_queryset para el usuario Jefe_preceptores:
#  - roles = ['jefe_preceptores']  -> devuelve TODOS los preceptores
qs = Preceptor.objects.select_related('id_usuario').all()
print("Cantidad de preceptores:", qs.count())

data = PreceptorSerializer(qs, many=True).data
for p in data:
    print(dict(id_preceptor=p['id_preceptor'], id_usuario=p['id_usuario'],
               usuario=p['usuario'], nombre=p['nombre'], apellido=p['apellido']))

usuario = Usuario.objects.filter(usuario='Jefe_preceptores').first()
print("\nUsuario a buscar:", usuario.id_usuario if usuario else None)
print("¿Está en la lista?", any(p['id_usuario'] == usuario.id_usuario for p in data) if usuario else False)
print("¿Tipo de id_usuario en el JS?", type(data[0]['id_usuario']) if data else None)