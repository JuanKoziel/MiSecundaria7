# -*- coding: utf-8 -*-
"""Dedupe MateriaAdeudada: 1 registro por (alumno, materia, curso + anio).
Regla: si en el grupo hay APROBADA -> conservar UNA APROBADA y borrar el resto.
Si no hay aprobada -> conservar la ADEUDADA mas reciente y borrar el resto.
"""
from django.db.models import Count
from escuela.models import MateriaAdeudada
from django.utils import timezone

grupos = MateriaAdeudada.objects.values(
    'id_alumno_id', 'id_materia_id', 'id_curso_origen_id'
).annotate(n=Count('pk')).filter(n__gt=1)

total = 0
eliminadas = 0
for g in grupos:
    total += 1
    filas = list(MateriaAdeudada.objects.filter(
        id_alumno_id=g['id_alumno_id'],
        id_materia_id=g['id_materia_id'],
        id_curso_origen_id=g['id_curso_origen_id'],
    ).order_by('-fecha_generacion'))
    if len(filas) <= 1:
        continue
    aprobada = next((f for f in filas if f.estado == 'APROBADA'), None)
    conservar = aprobada if aprobada else filas[0]
    for f in filas:
        if f.pk != conservar.pk:
            f.delete()
            eliminadas += 1

print('grupos_duplicados=%d' % total)
print('registros_eliminados=%d' % eliminadas)
print('ok_una_por_alumno_materia_curso')
