# -*- coding: utf-8 -*-
"""A4 - Dedupe de MateriaAdeudada: 1 registro por (alumno, materia, curso_origen).
Regla de conservacion:
  - Si en el grupo hay >=1 APROBADA -> conservar UNA APROBADA y eliminar el resto.
  - Si no hay aprobada -> conservar UNA ADEUDADA (la mas reciente) y eliminar el resto.
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto.settings')
django.setup()
from django.db.models import Count
from escuela.models import MateriaAdeudada

borradas = 0
conservadas = 0
grupos = MateriaAdeudada.objects.values(
    'id_alumno_id', 'id_materia_id', 'id_curso_origen'
).annotate(n=Count('pk')).filter(n__gt=1)
detalle = []
for g in grupos:
    filas = list(MateriaAdeudada.objects.filter(
        id_alumno_id=g['id_alumno_id'],
        id_materia_id=g['id_materia_id'],
        id_curso_origen=g['id_curso_origen'],
    ).order_by('-fecha_generacion'))
    if len(filas) <= 1:
        continue
    aprobadas = [f for f in filas if f.estado == 'APROBADA']
    if aprobadas:
        conservar = aprobadas[0]
    else:
        conservar = filas[0]
    resto = [f for f in filas if f.pk != conservar.pk]
    detalle.append({
        'alumno': g['id_alumno_id'], 'materia': g['id_materia_id'],
        'curso': g['id_curso_origen'], 'grupo': len(filas),
        'conservo': conservar.estado,
    })
    for f in resto:
        f.delete()
        borradas += 1
    conservadas += 1

print('RESULTADO FINAL:')
print('  grupos con duplicados procesados:', len(detalle))
print('  registros eliminados:', borradas)
print('  registros conservados (1 por alumno-materia-curso):', conservadas)
print('  ejemplos (alumno|materia|curso|grupo|conservado):')
for d in detalle[:8]:
    print('   ', d)
