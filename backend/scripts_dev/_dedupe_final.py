# -*- coding: utf-8 -*-
"""Dedupe real MySQL: 1 MateriaAdeudada por (id_alumno, id_materia, id_curso_origen).
Prioridad de conservacion:
  1. Si existe UNA con estado APROBADA -> conservar esa unica.
  2. Si no hay aprobada -> conservar la mas reciente (fecha_generacion) ADEUDADA.
Se eliminan las demas del grupo. No toca RendicionMateriaAdeudada ni historiales.
"""
from django.db.models import Count
from proyecto.escuela.models import MateriaAdeudada

grupos = MateriaAdeudada.objects.values(
    'id_alumno_id', 'id_materia_id', 'id_curso_origen_id',
).annotate(n=Count('pk')).filter(n__gt=1)

total_grupos = 0
borradas = 0
for g in grupos:
    total_grupos += 1
    filas = list(MateriaAdeudada.objects.filter(
        id_alumno_id=g['id_alumno_id'],
        id_materia_id=g['id_materia_id'],
        id_curso_origen_id=g['id_curso_origen_id'],
    ).order_by('-fecha_generacion'))

    aprobada = next((f for f in filas if f.estado == 'APROBADA'), None)
    conservar = aprobada if aprobada else filas[0]

    for f in filas:
        if f.pk != conservar.pk:
            f.delete()
            borradas += 1

print('GRUPOS_DUPLICADOS: %d' % total_grupos)
print('REGISTROS_ELIMINADOS: %d' % borradas)
print('CONSERVADO_APROBADA_PRIORITARIA: True')
