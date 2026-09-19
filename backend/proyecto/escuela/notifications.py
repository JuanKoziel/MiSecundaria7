"""Puerta única de creación de notificaciones.

Todos los eventos de negocio (Parte 3 en adelante del Plan Maestro) deben
crear notificaciones a través de `notificar(...)`, nunca directamente con
el ORM, para centralizar la protección y permitir luego aplicar reglas de
anti-spam y deduplicación en un solo punto.

Garantías:
- `id_usuario` es el usuario destinatario (obligatorio).
- `id_alumno` es el alumno sobre el que trata la notificación (opcional,
  NULL permitido para notificaciones históricas o sin alumno asociado).
- La creación nunca se expone por la API pública.

Estrategias de deduplicación (Parte 7):
- CONTENT: contenido idéntico (usuario, alumno, título, mensaje)
- DAILY: una por día por (usuario, alumno, título) — usado en asistencias
- STATE_TRANSITION: solo en cambio real de estado (manejo en emisores)
- REFERENCE: por clave de referencia externa (ej. id_acta, id_rendicion)
"""

from datetime import time
from django.utils import timezone
from django.db import transaction

from escuela.models import Notificacion, PadreTutor
from escuela.permissions import tutor_ids_de_alumno


# Límites de anti-spam (Parte 7) — ajustar solo con evidencia de necesidad
MAX_NOTIFICACIONES_POR_USUARIO_DIA = 50
MAX_NOTIFICACIONES_POR_USUARIO_HORA = 10
RETENCION_DIAS = 180  # días para purga automática

# Segmentos destino de una notificación: coinciden con el `rol` persistido en
# la columna `rol` de `notificaciones`. Sirven para que un usuario con varios
# roles solo vea, al operar con un rol activo, las notificaciones dirigidas a
# ese segmento (más las universales).
SEGMENTO_ALUMNO = 'alumno'
SEGMENTO_FAMILIA = 'familia'
SEGMENTO_DOCENTE = 'docente'
SEGMENTO_PRECEPTOR = 'preceptor'
SEGMENTO_JEFE_PRECEPTORES = 'jefe_preceptores'
SEGMENTO_DIRECTIVO = 'directivo'
SEGMENTO_UNIVERSAL = 'universal'

# Mapeo rol_activo_usuario (admin/director comparten el segmento directivo).
SEGMENTO_POR_ROL_ACTIVO = {
    'admin': SEGMENTO_DIRECTIVO,
    'director': SEGMENTO_DIRECTIVO,
    'jefe_preceptores': SEGMENTO_JEFE_PRECEPTORES,
    'preceptor': SEGMENTO_PRECEPTOR,
    'docente': SEGMENTO_DOCENTE,
    'alumno': SEGMENTO_ALUMNO,
    'familia': SEGMENTO_FAMILIA,
}


def segmento_de_rol_activo(rol_activo):
    """Devuelve el segmento destino asociado a un rol activo (o None)."""
    return SEGMENTO_POR_ROL_ACTIVO.get(rol_activo)


def _limite_diario_excedido(id_usuario, limite=MAX_NOTIFICACIONES_POR_USUARIO_DIA):
    """Verifica si el usuario ya superó el límite diario de notificaciones."""
    hoy_inicio = timezone.make_aware(
        timezone.datetime.combine(timezone.localdate(), time.min)
    )
    hoy_fin = hoy_inicio + timezone.timedelta(days=1)
    return Notificacion.objects.filter(
        id_usuario=id_usuario,
        fecha__gte=hoy_inicio,
        fecha__lt=hoy_fin,
    ).count() >= limite


def _limite_horario_excedido(id_usuario, limite=MAX_NOTIFICACIONES_POR_USUARIO_HORA):
    """Verifica si el usuario ya superó el límite horario de notificaciones."""
    ahora = timezone.now()
    hora_inicio = ahora.replace(minute=0, second=0, microsecond=0)
    return Notificacion.objects.filter(
        id_usuario=id_usuario,
        fecha__gte=hora_inicio,
        fecha__lt=hora_inicio + timezone.timedelta(hours=1),
    ).count() >= limite


def _purgar_notificaciones_antiguas():
    """Elimina notificaciones más antiguas que RETENCION_DIAS."""
    fecha_limite = timezone.now() - timezone.timedelta(days=RETENCION_DIAS)
    Notificacion.objects.filter(fecha__lt=fecha_limite).delete()


import json

def _formatear_nav(nav):
    """Formatea metadatos de navegación como bloque al final del mensaje."""
    if not nav:
        return ''
    try:
        nav_json = json.dumps(nav, separators=(',', ':'), ensure_ascii=False)
        return f' [nav:{nav_json}]'
    except (TypeError, ValueError):
        return ''


def notificar(*, id_usuario, titulo='', mensaje='', id_alumno=None, fecha=None,
              check_limits=True, dedupe_key=None, nav=None, rol=None):
    """Crea una notificación para un usuario destinatario con anti-spam.

    Parámetros:
        id_usuario (Usuario): destinatario de la notificación (obligatorio).
        titulo (str): breve título.
        mensaje (str): cuerpo de la notificación.
        id_alumno (Alumno | None): alumno al que se refiere la notificación.
        fecha (datetime | None): fecha de emisión (por defecto, ahora).
        check_limits (bool): si True, aplica límites diarios/horarios.
        dedupe_key (str | None): clave de deduplicación por referencia
            (ej. 'acta_123', 'rendicion_456'). Si se provee, evita duplicados
            por (usuario, dedupe_key) independientemente del contenido.
            El mensaje debe incluir el marcador `[ref:dedupe_key]` para que
            funcione la deduplicación.
        nav (dict | None): metadatos de navegación (Parte 8) con claves
            'destino' (str: vista destino) y 'params' (dict: parámetros).
        rol (str | None): segmento destino (SEGMENTO_*). Si es None queda
            'universal' (visible en cualquier rol activo).

    Devuelve la instancia `Notificacion` creada, o None si se bloqueó por
    límites o deduplicación.
    """
    # TODO(limitadores): desactivado temporalmente por solicitud del cliente.
    # Para reactivar, volver a habilitar el bloque siguiente:
    # if check_limits:
    #     if _limite_diario_excedido(id_usuario) or _limite_horario_excedido(id_usuario):
    #         return None

    if dedupe_key:
        # Deduplicación por clave de referencia externa
        existente = Notificacion.objects.filter(
            id_usuario=id_usuario,
            # Usamos un campo virtual en el mensaje para la clave;
            # alternativa: añadir campo dedupe_key al modelo si se necesita
            mensaje__contains=f'[ref:{dedupe_key}]',
        ).first()
        if existente:
            return existente

    # Añadir metadatos de navegación al mensaje (Parte 8)
    if nav:
        mensaje = f'{mensaje}{_formatear_nav(nav)}'

    # Anti-spam: no crear si ya existe una idéntica en los últimos 5 minutos
    # (evita ráfagas por reintentos de red)
    hace_5min = timezone.now() - timezone.timedelta(minutes=5)
    reciente = Notificacion.objects.filter(
        id_usuario=id_usuario,
        id_alumno=id_alumno,
        titulo=titulo,
        mensaje=mensaje,
        fecha__gte=hace_5min,
    ).first()
    if reciente:
        return reciente

    return Notificacion.objects.create(
        id_usuario=id_usuario,
        id_alumno=id_alumno,
        titulo=titulo,
        mensaje=mensaje,
        fecha=fecha or timezone.now(),
        rol=rol or SEGMENTO_UNIVERSAL,
    )


def notificar_alumno(*, alumno, titulo='', mensaje='', dedupe=True, strategy='CONTENT', dedupe_key=None, nav=None):
    """Emite una notificación académica a los usuarios que conciernen a un
    alumno: el propio `id_usuario` del alumno y, si existe, el `id_usuario`
    de su tutor/familia.

    Se etiqueta cada notificación con su segmento destino: 'alumno' para el
    propio alumno y 'familia' para cada tutor, de modo que un usuario con
    varios roles solo las vea al operar con el rol correspondiente.

    Toda creación sigue pasando por `notificar(...)`, que es la puerta única
    de la aplicación.

    Estrategias de deduplicación:
    - CONTENT (default): contenido idéntico (usuario, alumno, título, mensaje)
    - DAILY: una por día por (usuario, alumno, título) — usado en asistencias
    - REFERENCE: por dedupe_key (ej. 'calificacion_123') — evita duplicados
      por referencia externa aunque cambie el contenido (diagnóstico, etc.)

    Parámetros:
        nav (dict | None): metadatos de navegación (Parte 8) con claves
            'destino' (str: vista destino) y 'params' (dict: parámetros).

    Devuelve la lista de notificaciones creadas.
    """
    destinatarios = []  # (usuario, segmento)
    if alumno is not None and getattr(alumno, 'id_usuario_id', None):
        destinatarios.append((alumno.id_usuario, SEGMENTO_ALUMNO))
    tutor_ids = tutor_ids_de_alumno(alumno) if alumno is not None else []
    if tutor_ids:
        tutores = PadreTutor.objects.filter(
            id_tutor__in=tutor_ids,
            id_usuario_id__isnull=False,
        )
        for tutor in tutores:
            destinatarios.append((tutor.id_usuario, SEGMENTO_FAMILIA))

    creadas = []
    for usuario, segmento in destinatarios:
        if strategy == 'DAILY':
            # Deduplicación diaria: buscar notificación del mismo día
            hoy_inicio = timezone.make_aware(
                timezone.datetime.combine(timezone.localdate(), time.min)
            )
            hoy_fin = hoy_inicio + timezone.timedelta(days=1)
            ya = Notificacion.objects.filter(
                id_usuario=usuario,
                id_alumno=alumno,
                titulo=titulo,
                fecha__gte=hoy_inicio,
                fecha__lt=hoy_fin,
            ).first()
            if ya:
                # Acumular mensaje si es distinto
                if mensaje not in (ya.mensaje or ''):
                    ya.mensaje = f'{ya.mensaje}\n{mensaje}' if ya.mensaje else mensaje
                    ya.save()
                creadas.append(ya)
                continue

        if strategy == 'REFERENCE' and dedupe_key:
            # Deduplicación por clave de referencia externa
            ref_marker = f'[ref:{dedupe_key}]'
            # Añadir marcador al mensaje para que notificar() pueda dedupe
            mensaje_con_ref = f'{mensaje}\n{ref_marker}' if ref_marker not in mensaje else mensaje
            existente = Notificacion.objects.filter(
                id_usuario=usuario,
                id_alumno=alumno,
                mensaje__contains=ref_marker,
            ).first()
            if existente:
                # Actualizar mensaje si cambió el contenido
                if mensaje not in (existente.mensaje or ''):
                    existente.mensaje = f'{mensaje}\n{ref_marker}'
                    existente.save()
                creadas.append(existente)
                continue

            # Crear nueva con marcador de referencia
            creadas.append(
                notificar(
                    id_usuario=usuario,
                    id_alumno=alumno,
                    titulo=titulo,
                    mensaje=mensaje_con_ref,
                    dedupe_key=dedupe_key,
                    nav=nav,
                    rol=segmento,
                )
            )
            continue

        # Estrategia CONTENT (por defecto)
        if dedupe and Notificacion.objects.filter(
            id_usuario=usuario,
            id_alumno=alumno,
            titulo=titulo,
            mensaje=mensaje,
        ).exists():
            continue

        creadas.append(
            notificar(id_usuario=usuario, id_alumno=alumno, titulo=titulo, mensaje=mensaje, nav=nav, rol=segmento)
        )
    return creadas


@transaction.atomic
def ejecutar_mantenimiento():
    """Ejecuta tareas de mantenimiento: purga de notificaciones antiguas.

    Debe invocarse periódicamente (ej. vía cron/management command).
    """
    _purgar_notificaciones_antiguas()
