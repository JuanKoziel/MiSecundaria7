"""Carga única de 20 minutos (Panel Diario → "Notificar").

Centraliza el estado de la ventana de carga única que el preceptor otorga a
un docente para completar las Asistencias y/o el Libro de Temas del día:

  * `crear_o_renovar_carga`  → activa/renueva la ventana de 20 minutos.
  * `carga_de_item`          → resuelve si un ítem puede cargarse ahora.
  * `marcar_item_cargado`    → fija un ítem como cargado (bloquea re-edición).
  * `ventana_del_dia`        → ventana (latest) de un curso-materia y fecha.
  * `info_ventana`           → payload para el frontend (estado y cuenta regresiva).

Reglas de bloqueo por ítem ('asistencias' / 'libro_temas'):
  * 'permitido'           → ventana activa, ítem solicitado y aún no cargado.
                             Autoriza la carga aunque no se esté en horario.
  * 'bloqueado_cargado'   → el ítem ya se cargó: no se puede editar/actualizar.
  * 'bloqueado_vencido'   → la ventana venció sin haberse cargado el ítem.
  * 'no_pedido'           → ventana existe pero el ítem no fue solicitado:
                             se aplican las reglas normales del sistema.
  * 'sin_carga'           → no hay ventana: reglas normales del sistema.
"""

import json
from datetime import timedelta

from django.utils import timezone

from escuela.models import AdelantoHoras, CargaUnica, CursoMateria, Horario, HorariosEspeciales

CLAVE_ITEMS = {
    'asistencias': 'Asistencias',
    'libro_temas': 'Libro de temas',
}

DIAS_SEMANA_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

DURACION_VENTANA = timedelta(minutes=20)


def ventana_del_dia(cm_id, fecha):
    """Devuelve la ventana de carga única más reciente del día, o None."""
    return (
        CargaUnica.objects.filter(id_curso_materia_id=cm_id, fecha=fecha)
        .select_related('id_curso_materia__id_materia', 'id_curso_materia__id_curso')
        .order_by('-fecha_creacion', '-id_carga_unica')
        .first()
    )


def crear_o_renovar_carga(cm, fecha, pendientes, docente=None):
    """Activa una nueva ventana de 20 minutos (o renueva la del día).

    Si ya existe una ventana para la fecha (aunque esté vencida) se renueva:
    se extiende el vencimiento a +20 minutos y se amplía la lista de ítems
    pendientes. Los ítems ya cargados conservan su flag (no se vuelven a pedir
    ni se pueden re-editar).
    """
    pendientes = [p for p in (pendientes or []) if p in CLAVE_ITEMS]
    if not pendientes:
        return None

    cm_id = getattr(cm, 'id_curso_materia', cm)
    hoy_ventanas = list(
        CargaUnica.objects.filter(id_curso_materia_id=cm_id, fecha=fecha)
        .order_by('-fecha_creacion', '-id_carga_unica')
    )
    cu = hoy_ventanas[0] if hoy_ventanas else None

    ahora = timezone.localtime()
    if cu is None:
        cu = CargaUnica.objects.create(
            id_curso_materia_id=cm_id,
            id_docente=docente,
            fecha=fecha,
            fecha_inicio=ahora,
            fecha_vencimiento=ahora + DURACION_VENTANA,
            pendientes=json.dumps(pendientes),
        )
    else:
        previos = cu.pendientes_lista()
        for p in pendientes:
            if p in ('asistencias', 'libro_temas'):
                p_cargado = cu.asistencias_cargada if p == 'asistencias' else cu.libro_cargada
                if not p_cargado and p not in previos:
                    previos.append(p)
        cu.pendientes = json.dumps(previos)
        cu.fecha_inicio = ahora
        cu.fecha_vencimiento = ahora + DURACION_VENTANA
        cu.save(update_fields=['pendientes', 'fecha_inicio', 'fecha_vencimiento'])

    return cu


def _item_cargado(cu, item):
    if item == 'asistencias':
        return cu.asistencias_cargada
    if item == 'libro_temas':
        return cu.libro_cargada
    return False


def carga_de_item(cm_id, fecha, item):
    """Resuelve el estado de la carga para un ítem en una fecha."""
    cu = ventana_del_dia(cm_id, fecha)
    if cu is None:
        return {'estado': 'sin_carga', 'carga': None, 'mensaje': None}

    cargado = _item_cargado(cu, item)
    if cargado:
        return {
            'estado': 'bloqueado_cargado',
            'carga': cu,
            'mensaje': (
                f'Ya realizaste la carga única de {CLAVE_ITEMS.get(item, item)} de hoy; '
                f'no podés modificarla.'
            ),
        }

    if item not in cu.pendientes_lista():
        return {'estado': 'no_pedido', 'carga': cu, 'mensaje': None}

    if timezone.localtime() > cu.fecha_vencimiento:
        return {
            'estado': 'bloqueado_vencido',
            'carga': cu,
            'mensaje': (
                f'La carga única de {CLAVE_ITEMS.get(item, item)} venció: el plazo '
                f'de 20 minutos finalizó y ya no podés cargarla.'
            ),
        }

    return {'estado': 'permitido', 'carga': cu, 'mensaje': None}


def marcar_item_cargado(cm_id, fecha, item):
    """Marca un ítem como cargado en la ventana del día. Devuelve la ventana."""
    if item not in CLAVE_ITEMS:
        return None
    cu = ventana_del_dia(cm_id, fecha)
    if cu is None:
        return None
    if item == 'asistencias':
        cu.asistencias_cargada = True
        campo = 'asistencias_cargada'
    else:
        cu.libro_cargada = True
        campo = 'libro_cargada'
    cu.save(update_fields=[campo])
    return cu


def info_ventana(cu):
    """Payload para el frontend: estado, cuenta regresiva y flags por ítem."""
    ahora = timezone.localtime()
    vencida = cu.fecha_vencimiento <= ahora
    cm = cu.id_curso_materia
    return {
        'id_carga_unica': cu.id_carga_unica,
        'id_curso_materia': cu.id_curso_materia_id,
        'materia_nombre': cu.id_curso_materia_id and getattr(cm.id_materia, 'nombre_materia', None),
        'curso_nombre': cu.id_curso_materia_id and getattr(cm.id_curso, 'nombre_curso', None),
        'fecha': cu.fecha,
        'fecha_inicio': cu.fecha_inicio,
        'fecha_vencimiento': cu.fecha_vencimiento,
        'pendientes': cu.pendientes_lista(),
        'asistencias_cargada': cu.asistencias_cargada,
        'libro_cargada': cu.libro_cargada,
        'estado': 'vencida' if vencida else 'activa',
        'tiempo_restante_seg': (
            0 if vencida else max(0, int((cu.fecha_vencimiento - ahora).total_seconds()))
        ),
    }


def bloques_del_dia(cm_id, fecha):
    """Bloques horarios del día para un curso-materia (normal/especial/adelanto).

    Se usa cuando una ventana de carga única autoriza a cargar el Libro de
    Temas por fuera del horario de clase, para persisir una franja coherente
    en lugar de usar la hora actual.
    """
    dia = DIAS_SEMANA_ES[fecha.weekday()]
    bloques = []

    for h in Horario.objects.filter(
        id_curso_materia_id=cm_id, dia_semana=dia,
        id_modulo__isnull=False,
    ).select_related('id_modulo'):
        if h.id_modulo.hora_inicio is not None and h.id_modulo.hora_fin is not None:
            bloques.append({
                'hora_inicio': h.id_modulo.hora_inicio,
                'hora_fin': h.id_modulo.hora_fin,
                'tipo': 'normal',
            })

    for h in HorariosEspeciales.objects.filter(id_curso_materia_id=cm_id, dia_semana=dia):
        if not any(
            b['hora_inicio'] <= h.hora_inicio < b['hora_fin']
            or b['hora_inicio'] < h.hora_fin <= b['hora_fin']
            for b in bloques
        ):
            bloques.append({
                'hora_inicio': h.hora_inicio,
                'hora_fin': h.hora_fin,
                'tipo': 'especial',
            })

    registro = CursoMateria.objects.filter(pk=cm_id).values('id_curso_id', 'id_materia_id').first()
    if registro:
        cm_curso = registro['id_curso_id']
        cm_materia = registro['id_materia_id']

        adelantos = AdelantoHoras.objects.filter(
            id_curso_id=cm_curso, id_materia_id=cm_materia,
            fecha_adelanto=fecha, estado=True,
        )
        for a in adelantos:
            bloques.append({
                'hora_inicio': a.hora_inicio,
                'hora_fin': a.hora_fin,
                'tipo': 'adelanto',
                'id_adelanto': a.id_adelanto,
            })

    bloques.sort(key=lambda b: b['hora_inicio'])
    return bloques