import os
from datetime import datetime, time, timedelta
from django.contrib.auth import authenticate
from django.db import models
from django.http import FileResponse
from django.utils import timezone
import re
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from escuela.auth_backend import get_roles_for_usuario
from escuela.notifications import notificar, notificar_alumno
from escuela.permissions import (
    IsAdminOrDirectorForWrite,
    PuedeVerHistorial,
    PuedeGestionarAdelantos,
    PuedeEscribirCalificaciones,
    PuedeGestionarPersonas,
    PuedeGestionarActas,
    PuedeRegistrarAsistencias,
    PuedeGestionarPlanificaciones,
    PuedeGestionarAmbitoDocente,
    PuedePublicarComunicados,
    alumnos_permitidos,
    alumno_del_usuario,
    alumno_ids_familia,
    docente_del_usuario,
    es_rol_amplio,
    get_usuario,
)
from escuela.utils import (
    ACCION_CAMBIO_CONTRASENA,
    ACCION_CAMBIO_ROL,
    ACCION_CREAR,
    ACCION_DESHABILITAR,
    ACCION_ELIMINAR,
    ACCION_FINALIZAR,
    ACCION_HABILITAR,
    ACCION_MODIFICAR,
    marcar_eliminado,
    obtener_docente_activo,
    registrar_historial,
    resumen_registro,
)
from escuela.models import (
    Acta,
    ActaAlumno,
    ActaCurso,
    ActaDocente,
    AdelantoHoras,
    Alumno,
    Asistencia,
    AsistenciaDocente,
    ActividadDocente,
    ActividadDocenteArchivo,
    Calificacion,
    CicloLectivo,
    Comunicado,
    ComunicadoAlcance,
    ComunicadoArchivo,
    Curso,
    CursoMateria,
    DdjjDocente,
    DiagnosticoGrupal,
    Directivo,
    Docente,
    EstadoAsistencia,
    EventoInstitucional,
    HistorialCambio,
    Horario,
    HorariosEspeciales,
    InscripcionMateria,
    LibroTema,
    Materia,
    Modulos,
    Notificacion,
    PadreTutor,
    PeriodoEvaluacion,
    Planificacion,
    Preceptor,
    Rol,
    SuplenciaDocente,
    TipoAccion,
    TipoActa,
    Usuario,
    UsuarioRol,
    HistorialAcademico,
    IntensificacionAcademica,
    MateriaAdeudada,
    ActividadMateriaAdeudada,
    RendicionMateriaAdeudada,
    HistorialCursoAlumno,
    BloqueoHorarioAlumno,
    PromocionAlumno,
    RecursadaMateria,
    RecursadaCalificacion,
    BloqueoMateriaRecursada,
    RegistroRendicionPrevia,
    ResultadoActividadAdeudada,
    SituacionMateriaAlumno,
    PERIODO_ORDEN,
    PERIODO_LABELS,
    PERIODO_DISPLAY,
    NOTA_APROBACION,
)
from escuela.serializers import (
    ActaAlumnoSerializer,
    ActaCursoSerializer,
    ActaDocenteSerializer,
    ActaSerializer,
    ActividadDocenteSerializer,
    ActividadDocenteArchivoSerializer,
    AdelantoHorasSerializer,
    ComunicadoArchivoSerializer,
    ComunicadoAlcanceSerializer,
    ComunicadoSerializer,
    AlumnoSerializer,
    AsistenciaSerializer,
    AsistenciaDocenteSerializer,
    CalificacionSerializer,
    CicloLectivoSerializer,
    CursoMateriaSerializer,
    CursoSerializer,
    DiagnosticoGrupalSerializer,
    DirectivoSerializer,
    DocenteSerializer,
    EstadoAsistenciaSerializer,
    EventoInstitucionalSerializer,
    HistorialCambioSerializer,
    HorarioSerializer,
    HorarioEspecialSerializer,
    InscripcionMateriaSerializer,
    LibroTemaSerializer,
    ModuloSerializer,
    LoginSerializer,
    MateriaSerializer,
    NotificacionSerializer,
    PadreTutorSerializer,
    PeriodoEvaluacionSerializer,
    PlanificacionSerializer,
    DdjjDocenteSerializer,
    PreceptorSerializer,
    RolSerializer,
    SuplenciaDocenteSerializer,
    TipoAccionSerializer,
    TipoActaSerializer,
    UsuarioSerializer,
    HistorialAcademicoSerializer,
    IntensificacionAcademicaSerializer,
    MateriaAdeudadaSerializer,
    ActividadMateriaAdeudadaSerializer,
    RendicionMateriaAdeudadaSerializer,
    HistorialCursoAlumnoSerializer,
    BloqueoHorarioAlumnoSerializer,
    PromocionAlumnoSerializer,
    RecursadaMateriaSerializer,
    RecursadaCalificacionSerializer,
    BloqueoMateriaRecursadaSerializer,
    RegistroRendicionPreviaSerializer,
    ResultadoActividadAdeudadaSerializer,
    SituacionMateriaAlumnoSerializer,
)


def _usuario_context(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return {
            'username': None,
            'roles': [],
            'usuario_obj': None,
            'alumno': None,
            'padre': None,
            'docente': None,
            'preceptor': None,
        }

    roles = get_roles_for_usuario(username)
    usuario_obj = Usuario.objects.filter(usuario=username).first()
    return {
        'username': username,
        'roles': roles,
        'usuario_obj': usuario_obj,
        'alumno': Alumno.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
        'padre': PadreTutor.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
        'docente': Docente.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
        'preceptor': Preceptor.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None,
    }


def _preceptor_actual(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return None
    usuario_obj = Usuario.objects.filter(usuario=username).first()
    if not usuario_obj:
        return None
    return Preceptor.objects.filter(id_usuario=usuario_obj).first()


def _preceptor_cursos_ids(request):
    preceptor = _preceptor_actual(request)
    if not preceptor:
        return set()
    return set(
        Curso.objects.filter(id_preceptor=preceptor).values_list('id_curso', flat=True),
    )


def _alumno_curso(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return None
    usuario = Usuario.objects.filter(usuario=username).first()
    if not usuario:
        return None
    alumno = Alumno.objects.filter(id_usuario=usuario).first()
    if not alumno or not alumno.id_curso_id:
        return None
    return alumno.id_curso_id


def _familia_cursos_ids(request):
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        return set()
    usuario = Usuario.objects.filter(usuario=username).first()
    if not usuario:
        return set()
    tutor = PadreTutor.objects.filter(id_usuario=usuario).first()
    if not tutor:
        return set()
    return set(
        Alumno.objects.filter(id_tutor=tutor)
        .values_list('id_curso', flat=True)
        .distinct()
    )


def _docente_ids_en_cursos(cursos_ids):
    if not cursos_ids:
        return set()
    return set(
        CursoMateria.objects.filter(id_curso__in=cursos_ids).values_list('id_docente', flat=True).distinct(),
    )


def _obtener_bloques_horario(cm_id, dia_semana):
    horarios = list(Horario.objects.filter(
        id_curso_materia=cm_id,
        dia_semana=dia_semana,
        id_modulo__isnull=False,
    ).select_related('id_modulo').order_by('id_modulo__hora_inicio'))

    horarios_esp = list(HorariosEspeciales.objects.filter(
        id_curso_materia=cm_id,
        dia_semana=dia_semana,
    ).order_by('hora_inicio'))

    times = []
    for h in horarios:
        times.append((h.id_modulo.hora_inicio, h.id_modulo.hora_fin))
    for h in horarios_esp:
        times.append((h.hora_inicio, h.hora_fin))

    times.sort(key=lambda x: x[0])

    bloques = []
    i = 0
    while i < len(times):
        j = i
        while j < len(times) - 1 and times[j][1] >= times[j + 1][0]:
            j += 1
        bloques.append((times[i][0], times[j][1]))
        i = j + 1

    return bloques


def puede_modificar_libro_tema(libro_tema, fecha_hora_actual=None):
    """Indica si un Libro de Temas admite modificaciones o eliminación.

    Un Libro de Temas queda bloqueado en cuanto la fecha/hora actual alcanza
    la hora de fin de la clase correspondiente:
      - días anteriores a la clase: bloqueado (solo lectura);
      - el mismo día, si la hora actual es >= hora_fin: bloqueado.

    Reutilizable para PUT, PATCH, DELETE y para el frontend; es la única
    fuente de verdad de la comparación de horarios del Libro de Temas.
    """
    if fecha_hora_actual is None:
        fecha_hora_actual = timezone.localtime()
    elif timezone.is_naive(fecha_hora_actual):
        fecha_hora_actual = timezone.make_aware(fecha_hora_actual)
    fin_clase = timezone.make_aware(datetime.combine(libro_tema.fecha, libro_tema.hora_fin))
    return fecha_hora_actual < fin_clase


def docente_puede_registrar_asistencia_alumnos(docente_id, curso_materia_id, fecha=None, hora=None):
    ahora = timezone.localtime()
    fecha = fecha or ahora.date()
    hora = hora or ahora.time()
    dia = _dia_semana_es(ahora)

    bloques = _obtener_bloques_horario(curso_materia_id, dia)

    bloque_encontrado = None
    for inicio, fin in bloques:
        if inicio <= hora < fin:
            bloque_encontrado = (inicio, fin)
            break

    if not bloque_encontrado:
        return True, None, None

    inicio, fin = bloque_encontrado
    registro = AsistenciaDocente.objects.select_related('id_usuario').filter(
        id_docente_id=docente_id,
        id_curso_materia_id=curso_materia_id,
        fecha=fecha,
        hora__gte=inicio,
        hora__lt=fin,
        id_estado_asistencia__nombre_estado='Ausente',
    ).first()

    if registro:
        preceptor_nombre = None
        if registro.id_usuario:
            preceptor_obj = Preceptor.objects.filter(
                id_usuario=registro.id_usuario,
            ).only('nombre', 'apellido').first()
            if preceptor_obj:
                preceptor_nombre = f'{preceptor_obj.apellido}, {preceptor_obj.nombre}'
        return False, 'No puede registrar asistencias porque fue marcado como AUSENTE para este bloque horario.', preceptor_nombre

    return True, None, None


def limpiar_eventos_temporales_vencidos():
    """Elimina eventos temporales cuya fecha ya pasó.

    Reutilizable desde:
      - management commands
      - cron jobs / Celery beat
      - señales Django (post_save, etc.)
      - cualquier proceso que necesite limpiar eventos vencidos

    Uso:
        from escuela.views import limpiar_eventos_temporales_vencidos
        limpiar_eventos_temporales_vencidos()

    Retorna la cantidad de eventos eliminados.
    """
    count = EventoInstitucional.objects.filter(
        permanente=False,
        fecha__lt=timezone.localdate(),
    ).update(estado=False, fecha_eliminacion=timezone.now())
    return count


def evento_institucional_activo(fecha=None, hora=None):
    ahora = timezone.localtime()
    fecha = fecha or ahora.date()
    hora = hora or ahora.time()

    from django.db.models import Q
    query = Q(fecha=fecha) | Q(fecha__month=fecha.month, fecha__day=fecha.day, permanente=True)
    eventos = list(EventoInstitucional.objects.filter(query))

    if not eventos:
        return False, None, None, None, None, None

    prioridad = EventoInstitucional.PRIORIDAD_MAP
    eventos.sort(key=lambda e: prioridad.get(e.tipo_evento, 99))

    modulos_manana = list(Modulos.objects.filter(hora_inicio__hour__lt=12).order_by('hora_inicio'))
    modulos_tarde = list(Modulos.objects.filter(hora_inicio__hour__gte=12).order_by('hora_inicio'))

    def _turno_rango(modulos):
        if not modulos:
            return None, None
        return modulos[0].hora_inicio, modulos[-1].hora_fin

    for ev in eventos:
        if ev.alcance == 'todo_dia':
            return True, ev.tipo_evento, ev.descripcion, 'Todo el día', None, None

        elif ev.alcance == 'manana':
            hi, hf = _turno_rango(modulos_manana)
            if hi and hf and hi <= hora < hf:
                return True, ev.tipo_evento, ev.descripcion, f'{hi.strftime("%H:%M")} a {hf.strftime("%H:%M")}', hi, hf

        elif ev.alcance == 'tarde':
            hi, hf = _turno_rango(modulos_tarde)
            if hi and hf and hi <= hora < hf:
                return True, ev.tipo_evento, ev.descripcion, f'{hi.strftime("%H:%M")} a {hf.strftime("%H:%M")}', hi, hf

        elif ev.alcance == 'franja':
            if ev.hora_inicio and ev.hora_fin and ev.hora_inicio <= hora < ev.hora_fin:
                return True, ev.tipo_evento, ev.descripcion, f'{ev.hora_inicio.strftime("%H:%M")} a {ev.hora_fin.strftime("%H:%M")}', ev.hora_inicio, ev.hora_fin

    return False, None, None, None, None, None


# ---------- Adelantos de horas ----------

def _franjas_se_solapan(hora_inicio_a, hora_fin_a, hora_inicio_b, hora_fin_b):
    """Indica si dos franjas 'HH:MM' se superponen (extremos excluidos)."""
    def _a_tiempo(valor):
        if isinstance(valor, time):
            return valor
        return datetime.strptime(str(valor)[:5], '%H:%M').time()

    ini_a, fin_a = _a_tiempo(hora_inicio_a), _a_tiempo(hora_fin_a)
    ini_b, fin_b = _a_tiempo(hora_inicio_b), _a_tiempo(hora_fin_b)
    return ini_a < fin_b and fin_a > ini_b


def adelanto_activo_para_clase(curso_id, materia_id, fecha, hora=None, hora_inicio=None, hora_fin=None):
    """Retorna el adelanto de horas activo (estado=1) que cubre una clase.

    - Si se pasa `hora`, devuelve el adelanto cuya franja contiene esa hora.
    - Si se pasan `hora_inicio`/`hora_fin`, devuelve el adelanto que se
      solapa con esa franja (para saber si el horario original fue cubierto
      o cancelado por un adelanto).
    - Si no se pasa ninguna franja, devuelve el primer adelanto activo
      del curso/materia/fecha.
    """
    qs = AdelantoHoras.objects.filter(
        id_curso_id=curso_id,
        id_materia_id=materia_id,
        fecha_adelanto=fecha,
        estado=True,
    ).select_related('id_docente').order_by('hora_inicio')

    if hora is not None:
        for adelanto in qs:
            if adelanto.hora_inicio <= hora < adelanto.hora_fin:
                return adelanto
        return None

    if hora_inicio is not None and hora_fin is not None:
        for adelanto in qs:
            if adelanto.hora_inicio < hora_fin and adelanto.hora_fin > hora_inicio:
                return adelanto
        return None

    return qs.first()


def clase_original_cancelada_por_adelanto(curso_id, materia_id, fecha, hora_inicio, hora_fin):
    """Indica si un bloque del horario original queda cancelado por un
    adelanto de horas que no mantiene el horario original."""
    adelanto = adelanto_activo_para_clase(
        curso_id, materia_id, fecha,
        hora_inicio=hora_inicio, hora_fin=hora_fin,
    )
    return adelanto is not None and not adelanto.mantener_horario_original


def obtener_contexto_docente_para_clase(cm_id, fecha, hora):
    """Determina quién está autorizado a dictar una clase en una fecha/hora.

    Única fuente de verdad para asistencia y Libro de Temas. Prioridad:
      1. Evento institucional activo: nadie dicta (tipo='evento_institucional').
      2. Adelanto de horas activo: lo dicta el docente del adelanto, aunque
         la franja no coincida con el horario normal (tipo='adelanto').
      3. Suplencia activa / horario normal: lo dicta el docente activo según
         `obtener_docente_activo` dentro del bloque horario vigente
         (tipo='suplencia' | 'normal' | 'sin_clase').

    Devuelve un dict con: autorizado, tipo, docente, adelanto, suplencia,
    es_suplencia, titular, hora_inicio, hora_fin, clase_original_cancelada,
    mensaje y evento.
    """
    cm = CursoMateria.objects.filter(pk=cm_id).select_related('id_curso', 'id_materia').first()
    base = {
        'autorizado': False,
        'tipo': 'sin_clase',
        'docente': None,
        'adelanto': None,
        'suplencia': None,
        'es_suplencia': False,
        'titular': None,
        'hora_inicio': None,
        'hora_fin': None,
        'clase_original_cancelada': False,
        'mensaje': None,
        'evento': None,
    }
    if cm is None:
        return base

    evento_activo, tipo_ev, desc_ev, horario_ev, _, _ = evento_institucional_activo(fecha, hora)
    if evento_activo:
        base.update({
            'tipo': 'evento_institucional',
            'mensaje': f'Evento institucional activo ({tipo_ev}).',
            'evento': (tipo_ev, desc_ev, horario_ev),
        })
        return base

    adelanto = adelanto_activo_para_clase(cm.id_curso_id, cm.id_materia_id, fecha, hora=hora)
    if adelanto is not None:
        base.update({
            'autorizado': True,
            'tipo': 'adelanto',
            'docente': adelanto.id_docente,
            'adelanto': adelanto,
            'hora_inicio': adelanto.hora_inicio,
            'hora_fin': adelanto.hora_fin,
            'clase_original_cancelada': not adelanto.mantener_horario_original,
        })
        return base

    activo = obtener_docente_activo(cm_id, fecha)
    dia = _dia_semana_es(datetime.combine(fecha, hora))
    bloques = _obtener_bloques_horario(cm_id, dia)
    bloque = None
    for inicio, fin in bloques:
        if inicio <= hora < fin:
            bloque = (inicio, fin)
            break
    if not bloque:
        base.update({
            'tipo': 'sin_clase',
            'mensaje': 'Fuera del horario de clase para esta materia.',
            'docente': activo.docente,
            'suplencia': activo.suplencia,
            'es_suplencia': activo.es_suplencia,
            'titular': activo.titular,
        })
        return base

    base.update({
        'autorizado': True,
        'tipo': 'suplencia' if activo.es_suplencia else 'normal',
        'docente': activo.docente,
        'suplencia': activo.suplencia,
        'es_suplencia': activo.es_suplencia,
        'titular': activo.titular,
        'hora_inicio': bloque[0],
        'hora_fin': bloque[1],
    })
    return base


def _resolve_course_id(value):
    if value is None:
        return None
    if hasattr(value, 'id_curso'):
        return value.id_curso
    if hasattr(value, 'pk'):
        return value.pk
    return value


def _parse_curso_nombre(nombre_curso):
    if not nombre_curso:
        return {'anio': None, 'division': None}
    texto = str(nombre_curso).strip()
    match = re.match(r'^(\d+)\s*[°º]?\s*(\d*)', texto)
    if match:
        return {
            'anio': int(match.group(1)),
            'division': int(match.group(2)) if match.group(2) else None,
        }
    nums = re.findall(r'\d+', texto)
    if not nums:
        return {'anio': None, 'division': None}
    if len(nums) >= 2:
        return {'anio': int(nums[0]), 'division': int(nums[1])}
    digits = nums[0]
    if len(digits) >= 2:
        return {'anio': int(digits[0]), 'division': int(digits[1:])}
    return {'anio': int(digits), 'division': None}


def _get_comunicado_alcances(comunicado):
    alcances = getattr(comunicado, 'alcances', None)
    if alcances is None:
        return []
    if hasattr(alcances, 'all'):
        return list(alcances.all())
    if isinstance(alcances, (list, tuple)):
        return list(alcances)
    return []


def _curso_matches_alcance(curso_obj, alcance):
    if not alcance or not curso_obj:
        return False
    if (
        alcance.id_ciclo_id is None
        and alcance.curso is None
        and alcance.division is None
        and alcance.id_materia_id is None
    ):
        return True

    if alcance.id_ciclo_id and curso_obj.id_ciclo_id != alcance.id_ciclo_id:
        return False

    parts = _parse_curso_nombre(curso_obj.nombre_curso)
    if alcance.curso is not None and parts['anio'] != int(alcance.curso):
        return False
    if alcance.division is not None and parts['division'] != int(alcance.division):
        return False
    return True


def _docente_tiene_materia_en_curso(docente_id, curso_obj, materia_id):
    if not curso_obj or not materia_id:
        return False
    return CursoMateria.objects.filter(
        id_docente=docente_id,
        id_curso=curso_obj.id_curso,
        id_materia=materia_id,
    ).exists()


def _comunicado_visible_para_ctx(comunicado, ctx):
    if 'admin' in ctx['roles'] or 'director' in ctx['roles']:
        return True

    alcances = _get_comunicado_alcances(comunicado)
    if not alcances:
        return True

    if 'alumno' in ctx['roles'] and ctx['alumno']:
        return any(_curso_matches_alcance(ctx['alumno'].id_curso, alcance) for alcance in alcances)

    if 'familia' in ctx['roles'] and ctx['padre']:
        hijos = Alumno.objects.filter(id_tutor=ctx['padre'].id_tutor).select_related('id_curso')
        return any(
            _curso_matches_alcance(hijo.id_curso, alcance)
            for hijo in hijos if hijo.id_curso
            for alcance in alcances
        )

    if 'preceptor' in ctx['roles'] and ctx['preceptor']:
        cursos = Curso.objects.filter(id_preceptor=ctx['preceptor'].id_preceptor).select_related('id_ciclo')
        return any(
            _curso_matches_alcance(curso, alcance)
            for curso in cursos
            for alcance in alcances
        )

    if 'jefe_preceptores' in ctx['roles'] and ctx['preceptor']:
        cursos = Curso.objects.filter(id_preceptor=ctx['preceptor'].id_preceptor).select_related('id_ciclo')
        return any(
            _curso_matches_alcance(curso, alcance)
            for curso in cursos
            for alcance in alcances
        )

    if 'jefe_preceptores' in ctx['roles'] and not ctx['preceptor']:
        return True

    if 'docente' in ctx['roles'] and ctx['docente']:
        asignaciones = CursoMateria.objects.filter(
            id_docente=ctx['docente'].id_docente,
        ).select_related('id_curso')
        for asignacion in asignaciones:
            curso_obj = asignacion.id_curso
            if not curso_obj:
                continue
            for alcance in alcances:
                if not _curso_matches_alcance(curso_obj, alcance):
                    continue
                if alcance.id_materia_id and int(alcance.id_materia_id) != int(asignacion.id_materia_id):
                    continue
                return True
        return False

    return False


def _filter_visible_comunicados(request, qs):
    ctx = _usuario_context(request)
    if not ctx['username']:
        return qs.none()
    if 'admin' in ctx['roles'] or 'director' in ctx['roles']:
        return qs

    visible_ids = [
        comunicado.id_comunicado
        for comunicado in qs
        if _comunicado_visible_para_ctx(comunicado, ctx)
    ]
    return qs.filter(id_comunicado__in=visible_ids).distinct()


# =========================================================================
# Eventos de notificación (Parte 3 — Comunicados y asistencias)
# -------------------------------------------------------------------------
# Toda creación pasa por `notifications.notificar` (puerta única). La
# autorización no depende de estos helpers: son solo emisores que respetan
# las mismas reglas de visibilidad por alcance que ya usa el sistema.
# =========================================================================

def _usuarios_destinatarios_de_alumno(alumno):
    """Usuarios a notificar por hechos que conciernen a un alumno: el propio
    alumno y, si existe, el usuario de su tutor/familia."""
    usuarios = []
    if alumno is not None and alumno.id_usuario_id:
        usuarios.append(alumno.id_usuario)
    tutor = getattr(alumno, 'id_tutor', None) if alumno else None
    if tutor is not None and tutor.id_usuario_id:
        usuarios.append(tutor.id_usuario)
    return usuarios


def _registrar_o_acumular_ausencia(usuario, alumno, fecha, titulo, mensaje):
    """Agrupa las inasistencias por (destinatario, alumno, fecha): si ya
    existe una notificación de inasistencia para ese día, acumula la materia
    en el mensaje en lugar de crear una notificación nueva.

    `Notificacion.fecha` se guarda en UTC, por lo que el día se compara con
    un rango horario local (medianoche del día de la ausencia → medianoche
    siguiente) para no fallar por diferencias de zona horaria.
    """
    inicio = timezone.make_aware(datetime.combine(fecha, time.min))
    fin = inicio + timedelta(days=1)
    ya = Notificacion.objects.filter(
        id_usuario=usuario,
        id_alumno=alumno,
        fecha__gte=inicio,
        fecha__lt=fin,
        titulo=titulo,
    ).first()
    if ya is not None:
        if str(mensaje) not in (ya.mensaje or ''):
            ya.mensaje = f'{ya.mensaje}\n{mensaje}' if ya.mensaje else mensaje
            ya.save()
        return ya
    return notificar(
        id_usuario=usuario,
        id_alumno=alumno,
        titulo=titulo,
        mensaje=mensaje,
    )


def _notificar_inasistencia(asistencia):
    """E3 — Inasistencia registrada.

    Si la asistencia corresponde a una ausencia efectiva (estado "Ausente"),
    notifica al estudiante y a su familia, agrupando por día: no se genera una
    notificación independiente por cada ausencia del mismo alumno y fecha.
    Usa la estrategia DAILY de notificar_alumno para deduplicación diaria.
    """
    if getattr(asistencia, 'id_estado_asistencia_id', None):
        ausente_id = EstadoAsistencia.objects.filter(
            nombre_estado='Ausente',
        ).values_list('id_estado_asistencia', flat=True).first()
        if not ausente_id or asistencia.id_estado_asistencia_id != ausente_id:
            return

    alumno = asistencia.id_alumno
    if alumno is None:
        return

    cm = asistencia.id_curso_materia
    materia = ''
    if cm is not None and cm.id_materia_id:
        materia = getattr(cm.id_materia, 'nombre_materia', '') or ''
    materia_txt = f' en {materia}' if materia else ''
    titulo = 'Inasistencia registrada'
    mensaje = (
        f'{alumno.apellido}, {alumno.nombre} fue registrado como Ausente'
        f'{materia_txt} el {asistencia.fecha.isoformat()}.'
    )

    # Usar notificar_alumno con estrategia DAILY (agrupa por día)
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje, strategy='DAILY', nav={
        'destino': 'asistencias',
        'params': {
            'alumnoId': alumno.id_alumno,
            'fecha': asistencia.fecha.isoformat() if asistencia.fecha else None,
        }
    })


def _cursos_para_comunicado(comunicado):
    """Devuelve los cursos alcanzados por un comunicado según su alcance real.

    Cuando no hay alcances, devuelve todos los cursos activos. Reutiliza las
    mismas reglas de `_curso_matches_alcance` que la visibilidad del sistema.
    """
    alcances = _get_comunicado_alcances(comunicado)
    cursos = list(Curso.objects.filter(estado=True).select_related('id_preceptor'))
    if not alcances:
        return cursos
    return [
        curso for curso in cursos
        if any(_curso_matches_alcance(curso, alcance) for alcance in alcances)
    ]


def _materia_en_alcance(comunicado, curso_obj, materia_id):
    """Indica si una materia está alcanzada para un curso dado el comunicado.

    Si el comunicado tiene alcances, y alguno de ellos especifica una materia
    (`id_materia`), la materia coincide solo si ese alcance aplica al curso y
    apunta a la misma materia. Si ningún alcance especifica materia, la materia
    queda alcanzada en cualquier curso alcanzado.
    """
    alcances = _get_comunicado_alcances(comunicado)
    if not alcances:
        return curso_obj is not None
    for alcance in alcances:
        if not _curso_matches_alcance(curso_obj, alcance):
            continue
        materia_alcance = alcance.id_materia_id
        if materia_alcance is None:
            return True
        if int(materia_alcance) == int(materia_id):
            return True
    return False


def _docentes_para_comunicado(comunicado):
    """Docentes que tienen materias asignadas a los cursos alcanzados.

    Respeta el alcance real: para el caso "curso + materia" solo se notifica
    al/los docentes que tengan esa materia asignada específicamente a ese
    curso; en los demás casos, a todo docente con alguna materia en los cursos
    alcanzados.
    """
    cursos = _cursos_para_comunicado(comunicado)
    if not cursos:
        return []
    curso_ids = [c.id_curso for c in cursos]
    cms = (
        CursoMateria.objects.filter(id_curso__in=curso_ids, estado=True)
        .select_related('id_curso', 'id_materia', 'id_docente')
    )
    docentes = {}
    for cm in cms:
        if cm.id_docente_id is None or cm.id_curso is None or cm.id_materia is None:
            continue
        if not _materia_en_alcance(comunicado, cm.id_curso, cm.id_materia_id):
            continue
        docentes[cm.id_docente_id] = cm.id_docente
    return list(docentes.values())


def _preceptores_para_comunicado(comunicado):
    """Preceptores asignados a los cursos alcanzados por el comunicado."""
    cursos = _cursos_para_comunicado(comunicado)
    preceptores = {}
    for curso in cursos:
        if curso.id_preceptor_id is not None:
            preceptores[curso.id_preceptor_id] = curso.id_preceptor
    return list(preceptores.values())


def _alumnos_para_comunicado(comunicado):
    """Reutiliza las reglas de visibilidad por alcance para devolver los
    alumnos alcanzados por un comunicado (curso + ciclo + división/materia)."""
    alcances = _get_comunicado_alcances(comunicado)
    alumnos = list(
        Alumno.objects.filter(estado=True)
        .select_related('id_curso', 'id_tutor')
    )
    if not alcances:
        return alumnos
    return [
        alumno for alumno in alumnos
        if alumno.id_curso is not None
        and any(_curso_matches_alcance(alumno.id_curso, alcance) for alcance in alcances)
    ]


def _notificar_comunicado_publicado(comunicado):
    """E7 — Comunicado publicado.

    Notifica a las personas alcanzadas por el alcance real del comunicado:
    - estudiantes de los cursos alcanzados y sus familias;
    - Docentes con materias asignadas a esos cursos (respetando el caso
      "curso + materia");
    - Preceptores asignados a esos cursos.

    Una notificación por destinatario, sin duplicados. Se emite al publicar
    (crear) el comunicado, reutilizando las reglas de visibilidad existentes.
    """
    titulo = comunicado.titulo or 'Nuevo comunicado'
    mensaje = comunicado.cuerpo or ''
    nav = {
        'destino': 'comunicados',
        'params': {
            'comunicadoId': comunicado.id_comunicado,
        }
    }

    def _notificar_usuario(usuario, id_alumno=None):
        duplicado = Notificacion.objects.filter(
            id_usuario=usuario,
            id_alumno=id_alumno,
            titulo=titulo,
            mensaje=mensaje,
        ).exists()
        if duplicado:
            return
        notificar(
            id_usuario=usuario,
            id_alumno=id_alumno,
            titulo=titulo,
            mensaje=mensaje,
            nav=nav,
        )

    # Estudiantes y sus familias
    for alumno in _alumnos_para_comunicado(comunicado):
        for usuario in _usuarios_destinatarios_de_alumno(alumno):
            _notificar_usuario(usuario, id_alumno=alumno)

    # Docentes con materias en los cursos alcanzados
    for docente in _docentes_para_comunicado(comunicado):
        if docente.id_usuario_id:
            _notificar_usuario(docente.id_usuario)

    # Preceptores asignados a los cursos alcanzados
    for preceptor in _preceptores_para_comunicado(comunicado):
        if preceptor.id_usuario_id:
            _notificar_usuario(preceptor.id_usuario)


def _notificar_calificacion(calificacion, accion='cargada'):
    """E1/E6 — Calificación cargada / actualizada.

    No existe un campo "publicada" en `Calificacion`: la nota queda visible
    para la familia en cuanto se guarda. Por eso se notifica al guardar, tanto
    al crear (E1) como al corregir (E6). La deduplicación por contenido idéntico
    evita notificaciones repetidas cuando se vuelve a guardar la misma nota
    (misma materia, mismo período, mismo valor).
    """
    alumno = calificacion.id_alumno
    materia = (
        calificacion.id_curso_materia.id_materia.nombre_materia
        if calificacion.id_curso_materia and calificacion.id_curso_materia.id_materia
        else None
    )
    periodo = calificacion.id_periodo.nombre_periodo if calificacion.id_periodo else None

    if accion == 'actualizada':
        titulo = 'Calificación actualizada'
        detalle = 'fue actualizada'
    else:
        titulo = 'Nueva calificación'
        detalle = 'fue cargada'
    partes = []
    if materia:
        partes.append(f'Materia: {materia}')
    if periodo:
        partes.append(f'Período: {periodo}')
    if calificacion.nota_numerica is not None:
        partes.append(f'Nota: {calificacion.nota_numerica}')
    mensaje = f'Tu calificación {detalle}. ' + ' | '.join(partes) if partes else f'Tu calificación {detalle}.'

    # Estrategia REFERENCE: dedupe por PK de calificación (evita duplicados
    # aunque cambie diagnóstico o se re-guarde con mismo contenido)
    dedupe_key = f'calificacion_{calificacion.pk}'
    nav = {
        'destino': 'calificaciones',
        'params': {
            'alumnoId': alumno.id_alumno if alumno else None,
            'materiaId': calificacion.id_curso_materia.id_materia.id_materia if calificacion.id_curso_materia and calificacion.id_curso_materia.id_materia else None,
            'cursoMateriaId': calificacion.id_curso_materia_id,
        }
    }
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje,
                     strategy='REFERENCE', dedupe_key=dedupe_key, nav=nav)

# ============================================================
# Login / Autenticación
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Autentica contra la tabla 'usuarios' y devuelve tokens JWT + roles.
    Body: { "usuario": "...", "contrasena": "..." }
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['usuario']
    password = serializer.validated_data['contrasena']

    usuario_obj = Usuario.objects.filter(usuario=username).first()
    if usuario_obj and not usuario_obj.estado:
        return Response(
            {'error': 'Su usuario se encuentra deshabilitado. Comuníquese con la administración.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    roles = get_roles_for_usuario(username)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'id_usuario': usuario_obj.id_usuario if usuario_obj else None,
        'usuario': username,
        'roles': roles,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Devuelve info del usuario autenticado y sus roles."""
    username = request.user.username
    roles = get_roles_for_usuario(username)
    usuario_obj = Usuario.objects.filter(usuario=username).first()
    return Response({
        'id_usuario': usuario_obj.id_usuario if usuario_obj else None,
        'usuario': username,
        'roles': roles,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def seleccionar_rol(request):
    """Valida que el rol solicitado pertenezca al usuario autenticado.

    El 'rol activo' es una elección de sesión del frontend (qué panel
    mostrar). El backend autoriza cada recurso con los roles reales del
    usuario en la base de datos, por lo que seleccionar un rol jamás
    otorga permisos adicionales. Este endpoint solo garantiza que el
    frontend no use un rol que el usuario no posee.
    """
    username = request.user.username
    rol = request.data.get('rol')
    roles = get_roles_for_usuario(username)
    if rol not in roles:
        return Response(
            {'error': 'El rol solicitado no está asignado a tu usuario.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return Response({
        'usuario': username,
        'roles': roles,
        'rol_activo': rol,
    })


# ---------- Suplencias docentes: helpers compartidos ----------

def _materias_docente_ids(docente, fecha=None):
    """Devuelve los id_curso_materia asociados a un docente en `fecha`.

    Incluye las materias donde es titular (de `curso_materia`) y las
    materias donde es el docente activo por una suplencia vigente.
    La fuente de verdad del docente activo es `obtener_docente_activo`.
    """
    if docente is None:
        return set()
    if fecha is None:
        fecha = timezone.localdate()
    cm_ids = set(
        CursoMateria.objects.filter(id_docente=docente)
        .values_list('id_curso_materia', flat=True)
    )
    ganadoras = {}
    suplencias_activas = SuplenciaDocente.objects.filter(
        estado=True,
        fecha_inicio__lte=fecha,
        fecha_fin__gte=fecha,
    )
    for suplencia in suplencias_activas:
        prev = ganadoras.get(suplencia.id_curso_materia_id)
        if prev is None or suplencia.nivel > prev.nivel:
            ganadoras[suplencia.id_curso_materia_id] = suplencia
    for suplencia in ganadoras.values():
        cm_ids.add(suplencia.id_curso_materia_id)
    return cm_ids


def _verificar_docente_activo_materia(request, id_curso_materia, fecha=None):
    """Verifica que el docente autenticado sea el activo de la materia.

    Mientras una suplencia esté vigente el suplente adquiere los permisos
    de escritura del titular, y el titular pierde la capacidad de escribir
    (puede ver la materia, con el mensaje correspondiente en el frontend).
    Administradores y directores siempre pueden.
    """
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        raise PermissionDenied('Usuario no autenticado.')
    roles = get_roles_for_usuario(username)
    if 'admin' in roles or 'director' in roles:
        return
    if 'docente' not in roles:
        if 'familia' in roles or 'alumno' in roles:
            raise PermissionDenied('No tienes permiso para realizar esta operación.')
        return
    docente = Docente.objects.filter(id_usuario__usuario=username).first()
    if not docente:
        raise PermissionDenied('No se encontró un perfil de docente asociado al usuario.')
    activo = obtener_docente_activo(id_curso_materia, fecha)
    if activo.docente and activo.docente.id_docente == docente.id_docente:
        return
    if activo.es_suplencia and activo.titular and activo.titular.id_docente == docente.id_docente:
        raise PermissionDenied(
            'La materia se encuentra asignada temporalmente a un docente suplente.'
        )
    raise PermissionDenied('No tienes permiso para realizar esta operación en esta materia.')


def _verificar_docente_activo_curso(request, id_curso, fecha=None):
    """Verifica que el docente autenticado sea el activo en al menos una
    materia del curso (operaciones a nivel curso, p. ej. diagnósticos).

    Si todas sus materias del curso tienen una suplencia vigente de otro
    docente, el titular no puede escribir a nivel curso. La fuente de
    verdad es `obtener_docente_activo`. Administradores y directores
    siempre pueden.
    """
    username = request.user.username if request.user.is_authenticated else None
    if not username:
        raise PermissionDenied('Usuario no autenticado.')
    roles = get_roles_for_usuario(username)
    if 'admin' in roles or 'director' in roles:
        return
    if 'docente' not in roles:
        if 'familia' in roles or 'alumno' in roles:
            raise PermissionDenied('No tienes permiso para realizar esta operación.')
        return
    docente = Docente.objects.filter(id_usuario__usuario=username).first()
    if not docente:
        raise PermissionDenied('No se encontró un perfil de docente asociado al usuario.')
    if fecha is None:
        fecha = timezone.localdate()
    materias_del_curso = CursoMateria.objects.filter(id_curso=id_curso).values_list(
        'id_curso_materia', flat=True,
    )
    for cm_id in materias_del_curso:
        activo = obtener_docente_activo(cm_id, fecha)
        if activo.docente and activo.docente.id_docente == docente.id_docente:
            return
    raise PermissionDenied(
        'No tienes permiso para realizar esta operación en este curso.'
    )


# ============================================================
# ViewSets CRUD
# ============================================================

class HistorialMixin:
    """Mixin de auditoría: registra automáticamente altas, bajas y
    modificaciones en la tabla existente `historial_cambios`."""

    historial_tabla = None
    historial_soft_delete = False

    def get_historial_tabla(self):
        return self.historial_tabla

    def _historial_usuario_actual(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        return Usuario.objects.filter(usuario=username).first()

    def _historial_usuario_registro(self, instance):
        if isinstance(instance, Usuario):
            return instance
        if getattr(instance, 'id_usuario_id', None):
            return instance.id_usuario
        return None

    def _historial_registrar(self, accion, tabla, id_registro, valor_anterior=None, valor_nuevo=None):
        registrar_historial(
            usuario=self._historial_usuario_actual(),
            accion=accion,
            tabla=tabla,
            id_registro=id_registro,
            valor_anterior=valor_anterior,
            valor_nuevo=valor_nuevo,
        )

    def _historial_alta(self, serializer):
        instancia = serializer.instance
        self._historial_registrar(
            ACCION_CREAR,
            self.get_historial_tabla(),
            instancia.pk,
            None,
            resumen_registro(instancia),
        )

    def _historial_modificacion(self, serializer, valor_anterior):
        instancia = serializer.instance
        self._historial_registrar(
            ACCION_MODIFICAR,
            self.get_historial_tabla(),
            instancia.pk,
            valor_anterior,
            resumen_registro(instancia),
        )

    def _historial_baja(self, instance, valor_anterior):
        self._historial_registrar(
            ACCION_ELIMINAR,
            self.get_historial_tabla(),
            instance.pk,
            valor_anterior,
            'Registro dado de baja' if self.historial_soft_delete else 'Registro eliminado',
        )

    def _historial_eventos_usuario(self, usuario, datos_previos):
        if not usuario:
            return
        if datos_previos.get('nueva_contrasena'):
            self._historial_registrar(
                ACCION_CAMBIO_CONTRASENA, 'usuarios', usuario.pk,
                None, 'Contraseña actualizada',
            )
        estado_previo = datos_previos.get('estado_previo')
        if estado_previo is not None and bool(usuario.estado) != bool(estado_previo):
            habilitado = bool(usuario.estado)
            self._historial_registrar(
                ACCION_HABILITAR if habilitado else ACCION_DESHABILITAR,
                'usuarios', usuario.pk,
                'Habilitado' if estado_previo else 'Deshabilitado',
                'Habilitado' if habilitado else 'Deshabilitado',
            )
        roles_nuevos = set(
            UsuarioRol.objects.filter(id_usuario=usuario)
            .values_list('id_rol__nombre_rol', flat=True)
        )
        roles_previos = datos_previos.get('roles_previos')
        if roles_previos is not None and set(roles_previos) != roles_nuevos:
            self._historial_registrar(
                ACCION_CAMBIO_ROL, 'usuarios', usuario.pk,
                ', '.join(sorted(roles_previos)) or 'Sin rol',
                ', '.join(sorted(roles_nuevos)) or 'Sin rol',
            )

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self._historial_alta(serializer)

    def perform_update(self, serializer):
        instancia = serializer.instance
        valor_anterior = resumen_registro(instancia)
        usuario = self._historial_usuario_registro(instancia)
        datos_previos = {}
        if usuario:
            datos_previos = {
                'nueva_contrasena': 'contrasena' in serializer.validated_data,
                'estado_previo': usuario.estado,
                'roles_previos': set(
                    UsuarioRol.objects.filter(id_usuario=usuario)
                    .values_list('id_rol__nombre_rol', flat=True)
                ),
            }
        super().perform_update(serializer)
        self._historial_modificacion(serializer, valor_anterior)
        self._historial_eventos_usuario(usuario, datos_previos)

    def perform_destroy(self, instance):
        valor_anterior = resumen_registro(instance)
        if self.historial_soft_delete:
            marcar_eliminado(instance)
        else:
            super().perform_destroy(instance)
        self._historial_baja(instance, valor_anterior)


class UsuarioViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'usuarios'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()

        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return qs.none()

        roles = get_roles_for_usuario(username)
        if 'director' in roles or 'admin' in roles:
            return qs.filter(
                estado=True,
                usuariorol__id_rol__nombre_rol='admin',
            ).distinct()

        usuario = Usuario.objects.filter(usuario=username).first()
        if usuario:
            return qs.filter(
                id_usuario=usuario.id_usuario,
                estado=True,
                usuariorol__id_rol__nombre_rol='admin',
            ).distinct()

        return qs.none()

    def perform_create(self, serializer):
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied("Usuario no autenticado")

        roles = get_roles_for_usuario(username)

        # Only directors can create admin users
        if 'director' not in roles:
            raise PermissionDenied("Solo directores pueden crear administradores")

        # Check if trying to create an admin user
        requested_roles = self.request.data.get('roles', [])
        if 'admin' in requested_roles and 'director' not in roles:
            raise PermissionDenied("Solo directores pueden crear usuarios con rol administrador")

        super().perform_create(serializer)

    def perform_update(self, serializer):
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied("Usuario no autenticado")

        roles = get_roles_for_usuario(username)

        # Only directors can update admin users
        if 'director' not in roles:
            raise PermissionDenied("Solo directores pueden modificar administradores")

        # Check if trying to assign admin role
        requested_roles = self.request.data.get('roles', [])
        if 'admin' in requested_roles and 'director' not in roles:
            raise PermissionDenied("Solo directores pueden asignar rol administrador")

        estado_anterior = serializer.instance.estado
        super().perform_update(serializer)
        _notificar_usuario_estado(serializer.instance, estado_anterior)

    def perform_destroy(self, instance):
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied("Usuario no autenticado")

        roles = get_roles_for_usuario(username)

        # Only directors can delete admin users
        if 'director' not in roles:
            raise PermissionDenied("Solo directores pueden eliminar administradores")

        # Check if the user being deleted has admin role
        user_roles = UsuarioRol.objects.filter(id_usuario=instance).select_related('id_rol')
        has_admin_role = any(ur.id_rol.nombre_rol == 'admin' for ur in user_roles)

        if has_admin_role and 'director' not in roles:
            raise PermissionDenied("Solo directores pueden eliminar administradores")

        super().perform_destroy(instance)


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer


class AlumnoViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Alumno.objects.select_related(
        'id_curso', 'id_tutor', 'id_usuario',
    ).all()
    serializer_class = AlumnoSerializer
    filterset_fields = ['id_curso', 'dni']
    permission_classes = [IsAuthenticated, PuedeGestionarPersonas]
    historial_tabla = 'alumnos'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        usuario_obj = Usuario.objects.filter(usuario=username).first() if username else None

        if 'preceptor' in roles and usuario_obj:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)

        curso_id = self.request.query_params.get('curso')
        if curso_id:
            qs = qs.filter(id_curso=curso_id)
        return qs

    def _require_preceptor_course_access(self, curso_id):
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids:
            raise PermissionDenied('No tienes cursos asignados para gestionar alumnos.')
        resolved_curso_id = _resolve_course_id(curso_id)
        if resolved_curso_id is None:
            raise PermissionDenied('Debes asignar un curso dentro de tus cursos habilitados.')
        if int(resolved_curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para gestionar alumnos de ese curso.')

    def perform_create(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('No tenés permiso para crear alumnos.')
        if 'preceptor' in roles:
            self._require_preceptor_course_access(serializer.validated_data.get('id_curso'))
        super().perform_create(serializer)

    def perform_update(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('No tenés permiso para modificar alumnos.')
        if 'preceptor' in roles:
            instance = serializer.instance
            self._require_preceptor_course_access(
                serializer.validated_data.get('id_curso', instance.id_curso_id if instance else None),
            )
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('No tenés permiso para eliminar alumnos.')
        if 'preceptor' in roles:
            self._require_preceptor_course_access(instance.id_curso_id)
        super().perform_destroy(instance)


class DocenteViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Docente.objects.select_related('id_usuario').prefetch_related('ddjj_docente').all()
    serializer_class = DocenteSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarPersonas]
    historial_tabla = 'docentes'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            docente_ids = _docente_ids_en_cursos(cursos_ids)
            if not docente_ids:
                return qs.none()
            qs = qs.filter(id_docente__in=docente_ids)
        return qs

    def _require_preceptor_access(self, docente):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' not in roles:
            return
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids:
            raise PermissionDenied('No tienes cursos asignados para gestionar docentes.')
        docente_ids = _docente_ids_en_cursos(cursos_ids)
        if docente.id_docente not in docente_ids:
            raise PermissionDenied('No tienes permiso para gestionar este docente.')

    def perform_create(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('No tenés permiso para crear docentes.')
        super().perform_create(serializer)

    def perform_update(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('No tenés permiso para modificar docentes.')
        self._require_preceptor_access(serializer.instance)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('No tenés permiso para eliminar docentes.')
        self._require_preceptor_access(instance)
        super().perform_destroy(instance)


class DdjjDocenteViewSet(viewsets.ModelViewSet):
    queryset = DdjjDocente.objects.select_related('id_docente', 'id_docente__id_usuario').all()
    serializer_class = DdjjDocenteSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAmbitoDocente]
    parser_classes = [MultiPartParser, FormParser]

    def _roles(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        return get_roles_for_usuario(username) if username else []

    def _docente_actual(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        usuario_obj = Usuario.objects.filter(usuario=username).first()
        if not usuario_obj:
            return None
        return Docente.objects.filter(id_usuario=usuario_obj).first()

    def _can_view_all(self):
        roles = self._roles()
        return 'admin' in roles or 'director' in roles

    def get_queryset(self):
        qs = super().get_queryset()
        if self._can_view_all():
            return qs
        docente = self._docente_actual()
        if docente:
            return qs.filter(id_docente=docente)
        return qs.none()

    def _can_manage(self, docente=None):
        if self._can_view_all():
            return True
        docente_actual = self._docente_actual()
        return bool(docente_actual and docente and docente_actual.id_docente == docente.id_docente)

    def _get_docente_from_request(self):
        if self._can_view_all():
            docente_id = self.request.data.get('id_docente') or self.request.query_params.get('id_docente')
            if docente_id:
                return Docente.objects.filter(id_docente=docente_id).first()
        return self._docente_actual()

    @action(detail=False, methods=['get', 'post', 'delete'], url_path='mi-ddjj')
    def mi_ddjj(self, request):
        docente = self._get_docente_from_request()
        if not docente:
            raise PermissionDenied('No se encontró un perfil de docente asociado al usuario.')

        ddjj = DdjjDocente.objects.filter(id_docente=docente).first()

        if request.method == 'GET':
            if not ddjj:
                return Response({
                    'id_ddjj': None,
                    'id_docente': docente.id_docente,
                    'docente_nombre': docente.nombre,
                    'docente_apellido': docente.apellido,
                    'archivo_url': None,
                    'nombre_archivo': None,
                    'fecha_carga': None,
                    'presentada': False,
                })
            return Response(self.get_serializer(ddjj).data)

        if request.method == 'DELETE':
            if not self._can_view_all():
                raise PermissionDenied('No tienes permiso para eliminar esta DDJJ.')
            if not ddjj:
                return Response({'error': 'No existe una D.D.J.J. para eliminar.'}, status=status.HTTP_404_NOT_FOUND)
            if ddjj.ruta_archivo and ddjj.ruta_archivo.storage.exists(ddjj.ruta_archivo.name):
                ddjj.ruta_archivo.storage.delete(ddjj.ruta_archivo.name)
            ddjj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if ddjj:
            return Response(
                {'archivo': ['Ya posee una D.D.J.J. presentada.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        archivo = request.FILES.get('archivo')
        if archivo is None:
            return Response(
                {
                    'archivo': [
                        'No se recibió un archivo en request.FILES. '
                        'Envíalo como FormData con el campo "archivo".'
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        incoming_data = {
            'id_docente': docente.id_docente,
            'archivo': archivo,
        }
        serializer = self.get_serializer(ddjj, data=incoming_data, partial=bool(ddjj))
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        instance = serializer.save(id_docente=docente)
        _notificar_ddjj_presentada(instance)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        return Response(
            {'error': 'No se permite reemplazar una D.D.J.J. presentada.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {'error': 'No se permite reemplazar una D.D.J.J. presentada.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['get'], url_path='archivo')
    def archivo(self, request, pk=None):
        ddjj = self.get_object()
        if not ddjj.ruta_archivo:
            return Response({'error': 'La DDJJ no tiene archivo cargado.'}, status=status.HTTP_404_NOT_FOUND)
        download = str(request.query_params.get('download', '')).lower() in {'1', 'true', 'yes'}
        return FileResponse(
            ddjj.ruta_archivo.open('rb'),
            as_attachment=download,
            filename=ddjj.ruta_archivo.name.split('/')[-1],
        )

    def perform_create(self, serializer):
        docente = serializer.validated_data.get('id_docente')
        if not self._can_manage(docente):
            raise PermissionDenied('No tienes permiso para cargar esta DDJJ.')
        serializer.save()

    def perform_update(self, serializer):
        docente = serializer.validated_data.get('id_docente') or serializer.instance.id_docente
        if not self._can_manage(docente):
            raise PermissionDenied('No tienes permiso para modificar esta DDJJ.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self._can_view_all():
            raise PermissionDenied('No tienes permiso para eliminar esta DDJJ.')
        if instance.ruta_archivo and instance.ruta_archivo.storage.exists(instance.ruta_archivo.name):
            instance.ruta_archivo.storage.delete(instance.ruta_archivo.name)
        instance.delete()


class ActividadDocenteViewSet(viewsets.ModelViewSet):
    queryset = ActividadDocente.objects.select_related(
        'id_docente',
        'id_curso_materia__id_curso',
        'id_curso_materia__id_materia',
        ).prefetch_related('archivos_adjuntos').all()
    serializer_class = ActividadDocenteSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAmbitoDocente]
    parser_classes = [MultiPartParser, FormParser]

    def _docente_actual(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        usuario_obj = Usuario.objects.filter(usuario=username).first()
        if not usuario_obj:
            return None
        return Docente.objects.filter(id_usuario=usuario_obj).first()

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        usuario_obj = Usuario.objects.filter(usuario=username).first() if username else None

        if 'docente' in roles:
            docente = self._docente_actual()
            if docente:
                qs = qs.filter(id_curso_materia__in=_materias_docente_ids(docente))
            else:
                return qs.none()
        elif 'alumno' in roles and usuario_obj:
            alumno = Alumno.objects.filter(id_usuario=usuario_obj).first()
            if alumno and alumno.id_curso_id:
                curso_materias = CursoMateria.objects.filter(
                    id_curso=alumno.id_curso_id,
                ).values_list('id_curso_materia', flat=True)
                qs = qs.filter(id_curso_materia__in=curso_materias)
            else:
                return qs.none()
        elif 'familia' in roles and usuario_obj:
            tutor = PadreTutor.objects.filter(id_usuario=usuario_obj).first()
            if tutor:
                hijos = Alumno.objects.filter(id_tutor=tutor).values_list('id_curso', flat=True)
                curso_ids = [h for h in hijos if h is not None]
                if curso_ids:
                    curso_materias = CursoMateria.objects.filter(
                        id_curso__in=curso_ids,
                    ).values_list('id_curso_materia', flat=True)
                    qs = qs.filter(id_curso_materia__in=curso_materias)
                else:
                    return qs.none()
            else:
                return qs.none()
        elif not roles:
            return qs.none()

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)

        curso_materia = self.request.query_params.get('curso_materia')
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        uploaded_files = []
        if hasattr(self.request, 'FILES'):
            uploaded_files.extend(self.request.FILES.getlist('archivos'))
            uploaded_files.extend(self.request.FILES.getlist('archivo'))
            if not uploaded_files and self.request.FILES.get('archivo'):
                uploaded_files.append(self.request.FILES.get('archivo'))
        context['uploaded_files'] = uploaded_files
        return context

    def _delete_file_object(self, archivo_obj):
        if archivo_obj and archivo_obj.ruta_archivo and archivo_obj.ruta_archivo.name:
            storage = archivo_obj.ruta_archivo.storage
            if storage.exists(archivo_obj.ruta_archivo.name):
                storage.delete(archivo_obj.ruta_archivo.name)

    def _promote_primary_if_needed(self, actividad, archivo_eliminado):
        current_name = getattr(actividad.ruta_archivo, 'name', None)
        if not current_name:
            return
        if not archivo_eliminado or not archivo_eliminado.ruta_archivo:
            return
        if current_name != archivo_eliminado.ruta_archivo.name:
            return
        siguiente = actividad.archivos_adjuntos.exclude(id_archivo=archivo_eliminado.id_archivo).order_by('id_archivo').first()
        if siguiente:
            actividad.ruta_archivo = siguiente.ruta_archivo.name
        else:
            actividad.ruta_archivo = ''
        actividad.save(update_fields=['ruta_archivo'])

    def create(self, request, *args, **kwargs):
        cm_id = request.data.get('id_curso_materia')
        if cm_id:
            _verificar_docente_activo_materia(request, cm_id)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        cm_id = instance.id_curso_materia_id
        if cm_id:
            _verificar_docente_activo_materia(request, cm_id)
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        docente = self._docente_actual()
        if not docente:
            raise PermissionDenied('No se pudo identificar el docente autenticado.')
        cm = serializer.validated_data.get('id_curso_materia')
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        serializer.save(id_docente=docente)

    def perform_update(self, serializer):
        docente = self._docente_actual()
        if not docente:
            raise PermissionDenied('No tienes permiso para modificar esta actividad.')
        cm = serializer.instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        serializer.save()

    def perform_destroy(self, instance):
        docente = self._docente_actual()
        if not docente:
            raise PermissionDenied('No tienes permiso para eliminar esta actividad.')
        cm = instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        marcar_eliminado(instance)

    @action(detail=True, methods=['delete'], url_path=r'archivos/(?P<archivo_id>[^/.]+)')
    def borrar_archivo(self, request, pk=None, archivo_id=None):
        actividad = self.get_object()
        docente = self._docente_actual()
        if not docente:
            raise PermissionDenied('No tienes permiso para modificar esta actividad.')
        cm = actividad.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)

        archivo = actividad.archivos_adjuntos.filter(id_archivo=archivo_id).first()
        if not archivo:
            return Response({'error': 'El archivo no existe.'}, status=status.HTTP_404_NOT_FOUND)

        self._promote_primary_if_needed(actividad, archivo)
        self._delete_file_object(archivo)
        archivo.delete()

        actividad.refresh_from_db()
        serializer = self.get_serializer(actividad)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PreceptorViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Preceptor.objects.select_related('id_usuario').prefetch_related(
        models.Prefetch(
            'curso_set',
            queryset=Curso.objects.order_by('nombre_curso').select_related('id_ciclo'),
        ),
    ).all()
    serializer_class = PreceptorSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarPersonas]
    historial_tabla = 'preceptores'
    historial_soft_delete = True

    def get_historial_tabla(self):
        return 'jefes_preceptores' if self._is_jefe_target() else 'preceptores'

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        rol_param = self.request.query_params.get('rol')
        if rol_param in ('preceptor', 'jefe_preceptores'):
            qs = qs.filter(id_usuario__usuariorol__id_rol__nombre_rol=rol_param)
        if 'admin' in roles or 'director' in roles or 'jefe_preceptores' in roles:
            return qs
        if 'preceptor' in roles and username:
            return qs.filter(id_usuario__usuario=username)
        return qs.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['rol'] = self.request.query_params.get('rol', 'preceptor')
        return context

    def _is_jefe_target(self):
        return self.request.query_params.get('rol') == 'jefe_preceptores'

    def _require_admin_or_director(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles and 'jefe_preceptores' not in roles:
            raise PermissionDenied("Solo administradores, directores o jefes de preceptores pueden gestionar preceptores")

    def _require_admin_or_director_only(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles:
            raise PermissionDenied('Solo administradores o directores pueden gestionar jefes de preceptores')

    def perform_create(self, serializer):
        if self._is_jefe_target():
            self._require_admin_or_director_only()
        else:
            self._require_admin_or_director()
        super().perform_create(serializer)

    def perform_update(self, serializer):
        if self._is_jefe_target():
            self._require_admin_or_director_only()
        else:
            self._require_admin_or_director()
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        if self._is_jefe_target():
            self._require_admin_or_director_only()
        else:
            self._require_admin_or_director()
        usuario = instance.id_usuario
        Curso.objects.filter(id_preceptor=instance).update(id_preceptor=None)
        if usuario:
            UsuarioRol.objects.filter(id_usuario=usuario).delete()
        super().perform_destroy(instance)


class DirectivoViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Directivo.objects.select_related('id_usuario').all()
    serializer_class = DirectivoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'directores'
    historial_soft_delete = True


class PadreTutorViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = PadreTutor.objects.select_related('id_usuario').prefetch_related(
        models.Prefetch(
            'alumno_set',
            queryset=Alumno.objects.select_related('id_curso', 'id_curso__id_ciclo'),
        ),
    ).all()
    serializer_class = PadreTutorSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarPersonas]
    historial_tabla = 'tutores'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' in roles or 'director' in roles or 'jefe_preceptores' in roles:
            return qs
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            tutor_ids = Alumno.objects.filter(
                id_curso__in=cursos_ids,
                id_tutor__isnull=False,
            ).values_list('id_tutor', flat=True).distinct()
            return qs.filter(id_tutor__in=tutor_ids)
        if 'familia' in roles and username:
            usuario = Usuario.objects.filter(usuario=username).first()
            if usuario:
                return qs.filter(id_usuario=usuario)
            return qs.none()
        return qs.none()

    def _require_preceptor_course_access(self, alumnos_ids):
        if not alumnos_ids:
            return
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids:
            raise PermissionDenied('No tienes cursos asignados para gestionar familias.')
        alumnos_curso_ids = set(
            Alumno.objects.filter(id_alumno__in=alumnos_ids)
            .values_list('id_curso_id', flat=True)
        )
        no_permitidos = alumnos_curso_ids - {int(c) for c in cursos_ids}
        if no_permitidos:
            raise PermissionDenied('No tienes permiso para asociar alumnos de otros cursos.')

    def _require_admin_or_director(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles and 'jefe_preceptores' not in roles:
            raise PermissionDenied("Solo administradores, directores o jefes de preceptores pueden gestionar familias.")

    def perform_create(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('Los jefes de preceptores no pueden crear tutores.')
        if 'preceptor' in roles:
            alumnos_ids = serializer.validated_data.get('alumnos_ids', [])
            self._require_preceptor_course_access(alumnos_ids)
        else:
            self._require_admin_or_director()
        super().perform_create(serializer)

    def perform_update(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('Los jefes de preceptores no pueden modificar tutores.')
        if 'preceptor' in roles:
            alumnos_ids = serializer.validated_data.get('alumnos_ids')
            if alumnos_ids is not None:
                self._require_preceptor_course_access(alumnos_ids)
        else:
            self._require_admin_or_director()
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'jefe_preceptores' in roles:
            raise PermissionDenied('Los jefes de preceptores no pueden eliminar tutores.')
        if 'preceptor' not in roles:
            self._require_admin_or_director()
        Alumno.objects.filter(id_tutor=instance).update(id_tutor=None)
        usuario = instance.id_usuario
        if usuario:
            UsuarioRol.objects.filter(id_usuario=usuario).delete()
        super().perform_destroy(instance)


class CicloLectivoViewSet(viewsets.ModelViewSet):
    queryset = CicloLectivo.objects.all()
    serializer_class = CicloLectivoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def perform_destroy(self, instance):
        marcar_eliminado(instance)


class CursoViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Curso.objects.select_related('id_preceptor', 'id_ciclo').prefetch_related(
        models.Prefetch(
            'cursomateria_set__horario_set',
            queryset=Horario.objects.select_related('id_modulo'),
        ),
    ).all()
    serializer_class = CursoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'cursos'
    historial_soft_delete = True

    def _require_write_permiso(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles:
            raise PermissionDenied("Solo administradores o directores pueden crear o eliminar cursos")

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('incluir_inactivos') != '1':
            qs = qs.filter(activo=True)
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        usuario_obj = Usuario.objects.filter(usuario=username).first() if username else None

        if 'jefe_preceptores' in roles or 'admin' in roles or 'director' in roles:
            pass
        elif 'preceptor' in roles and usuario_obj:
            preceptor = Preceptor.objects.filter(id_usuario=usuario_obj).first()
            if not preceptor:
                return qs.none()
            qs = qs.filter(id_preceptor=preceptor)
        elif 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso=curso_id)
        elif 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)

        ciclo = self.request.query_params.get('ciclo')
        if ciclo:
            qs = qs.filter(id_ciclo=ciclo)
        return qs

    def perform_create(self, serializer):
        self._require_write_permiso()
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._require_write_permiso()
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        self._require_write_permiso()
        super().perform_destroy(instance)


class MateriaViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'materias'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('incluir_inactivos') != '1':
            qs = qs.filter(activo=True)
        return qs

    def perform_destroy(self, instance):
        super().perform_destroy(instance)


class CursoMateriaViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = CursoMateria.objects.select_related(
        'id_curso', 'id_materia',
    ).prefetch_related('id_docente', 'horario_set', 'horariosespeciales_set').all()
    serializer_class = CursoMateriaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'asignaciones_cursos'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('incluir_inactivos') != '1':
            qs = qs.filter(activo=True)
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)
        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso=curso_id)
        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso__in=cursos_ids)
        curso = self.request.query_params.get('curso')
        docente = self.request.query_params.get('docente')
        
        if curso:
            qs = qs.filter(id_curso=curso)
        if docente:
            qs = qs.filter(id_docente=docente)
        
        return qs

    def perform_destroy(self, instance):
        super().perform_destroy(instance)


class SuplenciaDocenteViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = SuplenciaDocente.objects.select_related(
        'id_curso_materia__id_curso',
        'id_curso_materia__id_materia',
        'id_curso_materia__id_docente',
        'id_docente_suplente',
    ).all()
    serializer_class = SuplenciaDocenteSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'suplencias_docentes'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        curso_materia = self.request.query_params.get('curso_materia')
        docente = self.request.query_params.get('docente')
        estado = self.request.query_params.get('estado')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        if docente:
            qs = qs.filter(id_docente_suplente=docente)
        if estado not in (None, ''):
            qs = qs.filter(estado=estado)
        hoy = timezone.localdate()
        qs = qs.prefetch_related(
            models.Prefetch(
                'id_curso_materia__suplencias',
                queryset=SuplenciaDocente.objects.filter(
                    estado=True,
                    fecha_inicio__lte=hoy,
                    fecha_fin__gte=hoy,
                ).select_related('id_docente_suplente', 'id_curso_materia')
                .order_by('-nivel', '-fecha_inicio'),
                to_attr='_suplencias_activas',
            ),
        )
        return qs

    def perform_create(self, serializer):
        super().perform_create(serializer)
        _notificar_suplencia_asignada(serializer.instance)

    @action(detail=True, methods=['post'], url_path='finalizar')
    def finalizar(self, request, pk=None):
        suplencia = self.get_object()
        if not suplencia.estado:
            return Response(
                {'error': 'La suplencia ya se encuentra finalizada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        valor_anterior = resumen_registro(suplencia)
        suplencia.estado = False
        suplencia.save(update_fields=['estado', 'fecha_modificacion'])
        self._historial_registrar(
            ACCION_FINALIZAR,
            self.get_historial_tabla(),
            suplencia.pk,
            valor_anterior,
            'Suplencia finalizada',
        )
        return Response(self.get_serializer(suplencia).data)


class AdelantoHorasViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = AdelantoHoras.all_objects.select_related(
        'id_curso',
        'id_materia',
        'id_docente',
        'id_usuario_autorizador',
    ).all()
    serializer_class = AdelantoHorasSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAdelantos]
    historial_tabla = 'adelantos_horas'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []

        es_directivo = bool(
            roles and ('admin' in roles or 'director' in roles or 'jefe_preceptores' in roles)
        )
        if 'preceptor' in roles and not es_directivo:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_id__in=cursos_ids)

        curso = self.request.query_params.get('curso')
        materia = self.request.query_params.get('materia')
        docente = self.request.query_params.get('docente')
        fecha = self.request.query_params.get('fecha')
        desde = self.request.query_params.get('desde')
        hasta = self.request.query_params.get('hasta')
        estado = self.request.query_params.get('estado')
        if curso:
            qs = qs.filter(id_curso_id=curso)
        if materia:
            qs = qs.filter(id_materia_id=materia)
        if docente:
            qs = qs.filter(id_docente_id=docente)
        if fecha:
            qs = qs.filter(fecha_adelanto=fecha)
        if desde:
            qs = qs.filter(fecha_adelanto__gte=desde)
        if hasta:
            qs = qs.filter(fecha_adelanto__lte=hasta)
        if estado not in (None, ''):
            qs = qs.filter(estado=estado)
        return qs.order_by('-fecha_adelanto', '-fecha_creacion')

    def _check_curso_acceso(self, curso_id):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' in roles or 'director' in roles or 'jefe_preceptores' in roles:
            return
        if 'preceptor' not in roles:
            raise PermissionDenied('No tienes permiso para gestionar adelantos de horas.')
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids or int(curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para gestionar adelantos de este curso.')

    def perform_create(self, serializer):
        curso = serializer.validated_data.get('id_curso')
        if curso is not None:
            self._check_curso_acceso(curso.pk)
        usuario = self._historial_usuario_actual()
        serializer.save(id_usuario_autorizador=usuario)
        self._historial_alta(serializer)
        _notificar_adelanto_aprobado(serializer.instance)

    def perform_update(self, serializer):
        instancia = serializer.instance
        self._check_curso_acceso(instancia.id_curso_id)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        self._check_curso_acceso(instance.id_curso_id)
        super().perform_destroy(instance)


class ModuloViewSet(viewsets.ModelViewSet):
    queryset = Modulos.objects.all()
    serializer_class = ModuloSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class HorarioEspecialViewSet(viewsets.ModelViewSet):
    queryset = HorariosEspeciales.objects.select_related('id_curso_materia').prefetch_related(
        'id_curso_materia__id_curso',
        'id_curso_materia__id_materia',
        ).all()
    serializer_class = HorarioEspecialSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)
        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso=curso_id)
        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        return qs

    def _check_preceptor_curso_access(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' in roles or 'director' in roles:
            return
        if 'preceptor' not in roles:
            raise PermissionDenied('No tienes permiso para modificar horarios.')
        if isinstance(instance, CursoMateria):
            curso_id = instance.id_curso_id
        else:
            curso_id = instance.id_curso_materia.id_curso_id
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids or int(curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para modificar horarios de este curso.')

    def perform_create(self, serializer):
        cm = serializer.validated_data.get('id_curso_materia')
        if cm is not None:
            self._check_preceptor_curso_access(cm)
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_destroy(self, instance):
        self._check_preceptor_curso_access(instance)
        instance.delete()


class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('id_curso_materia', 'id_modulo').prefetch_related(
        'id_curso_materia__id_curso',
        'id_curso_materia__id_materia',
        'id_curso_materia__id_docente',
        ).all()
    serializer_class = HorarioSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []

        if 'preceptor' in roles:
            cursos_ids = _preceptor_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)

        if 'alumno' in roles:
            curso_id = _alumno_curso(self.request)
            if not curso_id:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso=curso_id)

        if 'familia' in roles:
            cursos_ids = _familia_cursos_ids(self.request)
            if not cursos_ids:
                return qs.none()
            qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)

        curso_materia = self.request.query_params.get('curso_materia')
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def _check_preceptor_curso_access(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' in roles or 'director' in roles:
            return
        if 'preceptor' not in roles:
            raise PermissionDenied('No tienes permiso para modificar horarios.')
        if isinstance(instance, CursoMateria):
            curso_id = instance.id_curso_id
        else:
            curso_id = instance.id_curso_materia.id_curso_id
        cursos_ids = _preceptor_cursos_ids(self.request)
        if not cursos_ids or int(curso_id) not in {int(c) for c in cursos_ids}:
            raise PermissionDenied('No tienes permiso para modificar horarios de este curso.')

    def perform_create(self, serializer):
        cm = serializer.validated_data.get('id_curso_materia')
        if cm is not None:
            self._check_preceptor_curso_access(cm)
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._check_preceptor_curso_access(instance)

    def perform_destroy(self, instance):
        self._check_preceptor_curso_access(instance)
        instance.delete()


class InscripcionMateriaViewSet(viewsets.ModelViewSet):
    queryset = InscripcionMateria.objects.select_related(
        'id_alumno', 'id_curso_materia',
    ).all()
    serializer_class = InscripcionMateriaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        alumno = self.request.query_params.get('alumno')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        return qs


class PeriodoEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = PeriodoEvaluacion.objects.all()
    serializer_class = PeriodoEvaluacionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def perform_destroy(self, instance):
        marcar_eliminado(instance)


class CalificacionViewSet(viewsets.ModelViewSet):
    queryset = Calificacion.objects.select_related(
        'id_alumno', 'id_curso_materia__id_materia',
        'id_curso_materia__id_curso', 'id_docente', 'id_periodo',
        ).all()
    serializer_class = CalificacionSerializer
    permission_classes = [IsAuthenticated, PuedeEscribirCalificaciones]

    def get_queryset(self):
        qs = super().get_queryset()
        alumno = self.request.query_params.get('alumno')
        curso = self.request.query_params.get('curso')
        materia = self.request.query_params.get('materia')
        docente = self.request.query_params.get('docente')
        curso_materia = self.request.query_params.get('curso_materia')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        if materia:
            qs = qs.filter(id_curso_materia__id_materia=materia)
        if docente:
            qs = qs.filter(id_docente=docente)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def perform_create(self, serializer):
        cm = serializer.validated_data.get('id_curso_materia')
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        super().perform_create(serializer)
        _notificar_calificacion(serializer.instance, accion='cargada')

    def perform_update(self, serializer):
        cm = serializer.validated_data.get('id_curso_materia') or serializer.instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        super().perform_update(serializer)
        _notificar_calificacion(serializer.instance, accion='actualizada')

    def perform_destroy(self, instance):
        cm = instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        super().perform_destroy(instance)


class EstadoAsistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EstadoAsistencia.objects.all()
    serializer_class = EstadoAsistenciaSerializer


DIAS_SEMANA_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

def _dia_semana_es(dt=None):
    dt = dt or timezone.localtime()
    return DIAS_SEMANA_ES[dt.weekday()]  # 0=Lunes


class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.select_related(
        'id_alumno', 'id_curso_materia__id_materia',
        'id_curso_materia__id_curso', 'id_estado_asistencia',
        ).all()
    serializer_class = AsistenciaSerializer
    permission_classes = [IsAuthenticated, PuedeRegistrarAsistencias]

    def get_queryset(self):
        qs = super().get_queryset()
        alumno = self.request.query_params.get('alumno')
        curso = self.request.query_params.get('curso')
        fecha = self.request.query_params.get('fecha')
        curso_materia = self.request.query_params.get('curso_materia')
        materia = self.request.query_params.get('materia')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        if fecha:
            qs = qs.filter(fecha=fecha)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        if materia:
            qs = qs.filter(id_curso_materia__id_materia__nombre_materia=materia)
        return qs

    def perform_update(self, serializer):
        cm = serializer.instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        cm = instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        super().perform_destroy(instance)

    @action(detail=False, methods=['get'], url_path='server-time')
    def server_time(self, request):
        ahora = timezone.localtime()
        dia = _dia_semana_es(ahora)
        data = {
            'fecha': ahora.strftime('%Y-%m-%d'),
            'hora': ahora.strftime('%H:%M:%S'),
            'dia_semana': dia,
        }
        cm_id = request.query_params.get('curso_materia')
        if cm_id:
            horarios_hoy = self._horarios_hoy(cm_id, dia, ahora.date())
            data['horarios_hoy'] = horarios_hoy
            data['estado'] = self._estado_horario(horarios_hoy, ahora)

            contexto = obtener_contexto_docente_para_clase(cm_id, ahora.date(), ahora.time())
            data['contexto_clase'] = {
                'tipo': contexto['tipo'],
                'autorizado': contexto['autorizado'],
                'es_adelanto': contexto['tipo'] == 'adelanto',
                'clase_original_cancelada': contexto['clase_original_cancelada'],
                'hora_inicio': contexto['hora_inicio'].strftime('%H:%M') if contexto['hora_inicio'] else None,
                'hora_fin': contexto['hora_fin'].strftime('%H:%M') if contexto['hora_fin'] else None,
                'docente': f"{contexto['docente'].apellido}, {contexto['docente'].nombre}"
                if contexto['docente'] else None,
                'motivo_adelanto': contexto['adelanto'].motivo if contexto['adelanto'] else None,
                'docente_adelanto': f"{contexto['adelanto'].id_docente.apellido}, {contexto['adelanto'].id_docente.nombre}"
                if contexto['adelanto'] else None,
            }

            roles = get_roles_for_usuario(request.user.username)
            if 'docente' in roles:
                try:
                    cm = CursoMateria.objects.get(id_curso_materia=cm_id)
                    activo = obtener_docente_activo(cm_id, ahora.date())
                    activo_docente = contexto['docente'] or activo.docente
                    if activo_docente:
                        puede, mensaje, preceptor_nombre = docente_puede_registrar_asistencia_alumnos(
                            activo_docente.id_docente, cm_id, ahora.date(), ahora.time(),
                        )
                        data['docente_ausente'] = not puede
                        if not puede:
                            data['mensaje_restriccion'] = mensaje
                            data['preceptor'] = preceptor_nombre
                except CursoMateria.DoesNotExist:
                    pass

        activo, tipo_ev, desc_ev, horario_ev, _, _ = evento_institucional_activo(ahora.date(), ahora.time())
        if activo:
            data['evento_activo'] = True
            data['evento_tipo'] = tipo_ev
            data['evento_descripcion'] = desc_ev
            data['evento_horario'] = horario_ev

        return Response(data)

    def _horarios_hoy(self, curso_materia_id, dia_semana, fecha=None):
        """Retorna lista de dicts con hora_inicio y hora_fin para hoy.

        Incluye los adelantos de horas activos para la fecha. Cuando un
        adelanto no mantiene el horario original (mantener_horario_original=0),
        reemplaza los bloques normales con los que se solapa.
        """
        horarios = []
        qs = Horario.objects.filter(
            id_curso_materia=curso_materia_id,
            dia_semana=dia_semana,
        ).select_related('id_modulo')
        for h in qs:
            if h.id_modulo:
                horarios.append({
                    'hora_inicio': h.id_modulo.hora_inicio.strftime('%H:%M'),
                    'hora_fin': h.id_modulo.hora_fin.strftime('%H:%M'),
                    'tipo': 'normal',
                })
        qs_esp = HorariosEspeciales.objects.filter(
            id_curso_materia=curso_materia_id,
            dia_semana=dia_semana,
        )
        for h in qs_esp:
            horarios.append({
                'hora_inicio': h.hora_inicio.strftime('%H:%M'),
                'hora_fin': h.hora_fin.strftime('%H:%M'),
                'tipo': 'normal',
            })
        if fecha is not None:
            cm = CursoMateria.objects.filter(pk=curso_materia_id).select_related('id_curso', 'id_materia').first()
            if cm is not None:
                adelantos = AdelantoHoras.objects.filter(
                    id_curso_id=cm.id_curso_id,
                    id_materia_id=cm.id_materia_id,
                    fecha_adelanto=fecha,
                    estado=True,
                ).order_by('hora_inicio')
                for a in adelantos:
                    if not a.mantener_horario_original:
                        horarios = [
                            h for h in horarios
                            if not _franjas_se_solapan(
                                h['hora_inicio'], h['hora_fin'],
                                a.hora_inicio.strftime('%H:%M'), a.hora_fin.strftime('%H:%M'),
                            )
                        ]
                    horarios.append({
                        'hora_inicio': a.hora_inicio.strftime('%H:%M'),
                        'hora_fin': a.hora_fin.strftime('%H:%M'),
                        'tipo': 'adelanto',
                        'id_adelanto': a.id_adelanto,
                        'motivo': a.motivo,
                    })
        horarios.sort(key=lambda x: x['hora_inicio'])
        return horarios

    def _estado_horario(self, horarios_hoy, ahora):
        """Determina el estado: sin_clases, esperando, en_horario, terminado."""
        if not horarios_hoy:
            return {'codigo': 'sin_clases', 'mensaje': 'Esta materia no tiene clases programadas para hoy.'}
        hora_actual = ahora.strftime('%H:%M')
        primero = horarios_hoy[0]
        ultimo = horarios_hoy[-1]
        if hora_actual < primero['hora_inicio']:
            return {
                'codigo': 'esperando',
                'mensaje': f'Las clases comienzan a las {primero["hora_inicio"]}. Actualmente son las {hora_actual}.',
                'proximo_inicio': primero['hora_inicio'],
            }
        if hora_actual >= ultimo['hora_fin']:
            return {
                'codigo': 'terminado',
                'mensaje': f'El horario de clases finalizó a las {ultimo["hora_fin"]}. Actualmente son las {hora_actual}.',
            }
        for h in horarios_hoy:
            if h['hora_inicio'] <= hora_actual < h['hora_fin']:
                return {'codigo': 'en_horario', 'mensaje': 'Dentro del horario de clase.'}
        return {
            'codigo': 'esperando',
            'mensaje': f'Próximo módulo comienza a las {primero["hora_inicio"]}.',
            'proximo_inicio': primero['hora_inicio'],
        }

    @action(detail=False, methods=['get'], url_path='alumno-detalle')
    def alumno_detalle(self, request):
        roles = get_roles_for_usuario(request.user.username)
        try:
            usuario = Usuario.objects.get(usuario=request.user.username)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if 'alumno' in roles:
            try:
                alumno = Alumno.objects.get(id_usuario=usuario)
            except Alumno.DoesNotExist:
                return Response({'error': 'Alumno no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        elif 'familia' in roles:
            alumno_id = request.query_params.get('id_alumno')
            if not alumno_id:
                return Response({'error': 'Se requiere id_alumno.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                tutor = PadreTutor.objects.get(id_usuario=usuario)
                alumno = Alumno.objects.get(id_alumno=alumno_id, id_tutor=tutor)
            except (PadreTutor.DoesNotExist, Alumno.DoesNotExist):
                return Response({'error': 'Alumno no encontrado o no autorizado.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)
        qs = Asistencia.objects.filter(id_alumno=alumno).select_related(
            'id_curso_materia__id_materia',
            'id_curso_materia__id_docente',
            'id_estado_asistencia',
        )
        cm_id = request.query_params.get('curso_materia')
        if cm_id:
            qs = qs.filter(id_curso_materia=cm_id)
        qs = qs.order_by('-fecha', '-hora')
        result = []
        for a in qs:
            dia_semana = DIAS_SEMANA_ES[a.fecha.weekday()]
            modulo_info = self._resolver_modulo(a, dia_semana)
            docente = getattr(a.id_curso_materia, 'id_docente', None)
            if docente:
                docente_nombre = f'{docente.nombre} {docente.apellido}'
            else:
                docente_nombre = '-'
            result.append({
                'id': a.id_asistencia,
                'fecha': a.fecha.strftime('%Y-%m-%d'),
                'hora': a.hora.strftime('%H:%M') if a.hora else '',
                'materia_nombre': a.id_curso_materia.id_materia.nombre_materia
                if a.id_curso_materia.id_materia else '-',
                'docente_nombre': docente_nombre,
                'estado_nombre': a.id_estado_asistencia.nombre_estado
                if a.id_estado_asistencia else '-',
                'horario': modulo_info.get('horario') if modulo_info else '-',
            })
        return Response(result)

    @action(detail=False, methods=['get'], url_path='preceptor-materia')
    def preceptor_materia(self, request):
        roles = get_roles_for_usuario(request.user.username)
        if 'preceptor' not in roles and 'admin' not in roles and 'director' not in roles and 'jefe_preceptores' not in roles:
            return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)
        cursos_ids = _preceptor_cursos_ids(request) if 'preceptor' in roles else None
        if 'preceptor' in roles and not cursos_ids:
            return Response({'error': 'Preceptor sin cursos asignados.'}, status=status.HTTP_403_FORBIDDEN)

        cm_id = request.query_params.get('curso_materia')
        fecha_str = request.query_params.get('fecha')
        if not cm_id:
            return Response({'error': 'Se requiere curso_materia.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cm = CursoMateria.objects.get(id_curso_materia=cm_id)
        except CursoMateria.DoesNotExist:
            return Response({'error': 'Materia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        if cursos_ids is not None and cm.id_curso_id not in cursos_ids:
            return Response({'error': 'No autorizado para esta materia.'}, status=status.HTTP_403_FORBIDDEN)

        qs = Asistencia.objects.filter(
            id_curso_materia=cm_id,
        ).select_related(
            'id_alumno', 'id_curso_materia__id_materia',
            'id_curso_materia__id_docente', 'id_estado_asistencia',
        ).order_by('-fecha', 'id_alumno__apellido', 'id_alumno__nombre')

        if fecha_str:
            qs = qs.filter(fecha=fecha_str)

        alumno_id = request.query_params.get('alumno')
        if alumno_id:
            qs = qs.filter(id_alumno=alumno_id)

        dia_semana = DIAS_SEMANA_ES[datetime.strptime(fecha_str, '%Y-%m-%d').weekday()] if fecha_str else _dia_semana_es()

        result = []
        for a in qs:
            horario = self._resolver_modulo(a, dia_semana)
            docente = getattr(a.id_curso_materia, 'id_docente', None)
            result.append({
                'id': a.id_asistencia,
                'id_alumno': a.id_alumno_id,
                'alumno_nombre': f'{a.id_alumno.apellido}, {a.id_alumno.nombre}',
                'fecha': a.fecha.strftime('%Y-%m-%d'),
                'horario': horario.get('horario') if horario else '-',
                'docente_nombre': f'{docente.nombre} {docente.apellido}' if docente else '-',
                'estado_nombre': a.id_estado_asistencia.nombre_estado if a.id_estado_asistencia else '-',
                'hora_carga': a.hora.strftime('%H:%M') if a.hora else '',
                'justificado': a.justificado,
            })

        alumnos_del_curso = Alumno.objects.filter(
            id_curso=cm.id_curso_id,
        ).select_related('id_usuario').order_by('apellido', 'nombre')

        ids_encontrados = {r['id_alumno'] for r in result}
        if fecha_str:
            for al in alumnos_del_curso:
                if al.id_alumno not in ids_encontrados:
                    result.append({
                        'id': None,
                        'id_alumno': al.id_alumno,
                        'alumno_nombre': f'{al.apellido}, {al.nombre}',
                        'horario': '-',
                        'docente_nombre': '-',
                        'estado_nombre': 'Sin registro',
                        'hora_carga': '',
                        'justificado': False,
                    })

        result.sort(key=lambda r: r['alumno_nombre'])
        return Response(result)

    @action(detail=False, methods=['get'], url_path='asistencia-diaria')
    def asistencia_diaria(self, request):
        curso_nombre = request.query_params.get('curso')
        fecha_str = request.query_params.get('fecha')
        if not curso_nombre or not fecha_str:
            return Response({'error': 'Se requiere curso y fecha.'}, status=status.HTTP_400_BAD_REQUEST)

        curso_obj = Curso.objects.filter(nombre_curso=curso_nombre).first()
        if not curso_obj:
            return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        cm_ids = list(
            CursoMateria.objects.filter(id_curso=curso_obj).values_list('id_curso_materia', flat=True)
        )
        if not cm_ids:
            return Response([])

        asistencias = Asistencia.objects.filter(
            id_curso_materia__in=cm_ids,
            fecha=fecha_str,
        ).select_related('id_alumno', 'id_estado_asistencia')

        alumnos_del_curso = Alumno.objects.filter(
            id_curso=curso_obj,
        ).order_by('apellido', 'nombre')

        estado_map = {}
        for a in asistencias:
            aid = a.id_alumno_id
            nombre = a.id_estado_asistencia.nombre_estado if a.id_estado_asistencia else None
            if aid not in estado_map:
                estado_map[aid] = []
            if nombre:
                estado_map[aid].append(nombre)

        resultado = {
            'Presente': 'Presente',
            'Ausente': 'Ausente',
        }
        reglas = [
            ({'Presente', 'Presente'}, 'Presente'),
            ({'Presente', 'Ausente'}, 'Retiro'),
            ({'Ausente', 'Presente'}, 'Tarde'),
            ({'Ausente', 'Ausente'}, 'Ausente'),
        ]

        result = []
        for al in alumnos_del_curso:
            estados = estado_map.get(al.id_alumno, [])
            if not estados:
                estado_final = 'Sin registro'
            elif len(estados) == 1:
                estado_final = resultado.get(estados[0], estados[0])
            else:
                conjunto = set(estados[:2])
                estado_final = 'Sin registro'
                for regla_conjunto, regla_estado in reglas:
                    if conjunto == regla_conjunto:
                        estado_final = regla_estado
                        break

            result.append({
                'id_alumno': al.id_alumno,
                'alumno_nombre': f'{al.apellido}, {al.nombre}',
                'estado': estado_final,
            })

        result.sort(key=lambda r: r['alumno_nombre'])
        return Response(result)

    @action(detail=False, methods=['get'], url_path='registro-diario')
    def registro_diario(self, request):
        curso_nombre = request.query_params.get('curso')
        fecha_str = request.query_params.get('fecha')
        alumno_id = request.query_params.get('alumno')

        if not curso_nombre:
            return Response({'error': 'Se requiere curso.'}, status=status.HTTP_400_BAD_REQUEST)

        curso_obj = Curso.objects.filter(nombre_curso=curso_nombre).first()
        if not curso_obj:
            return Response({'error': 'Curso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        cm_ids = list(
            CursoMateria.objects.filter(id_curso=curso_obj).values_list('id_curso_materia', flat=True)
        )
        if not cm_ids:
            return Response([])

        if not fecha_str and not alumno_id:
            return Response([])

        asistencias = Asistencia.objects.filter(
            id_curso_materia__in=cm_ids,
        ).select_related('id_alumno', 'id_estado_asistencia')

        if fecha_str:
            asistencias = asistencias.filter(fecha=fecha_str)
        if alumno_id:
            asistencias = asistencias.filter(id_alumno=alumno_id)

        asistencias = asistencias.order_by('-fecha', 'id_alumno__apellido', 'id_alumno__nombre')

        result = []
        for a in asistencias:
            result.append({
                'id': a.id_asistencia,
                'fecha': a.fecha.strftime('%Y-%m-%d'),
                'id_alumno': a.id_alumno_id,
                'alumno_nombre': f'{a.id_alumno.apellido}, {a.id_alumno.nombre}' if a.id_alumno else '',
                'estado': a.id_estado_asistencia.nombre_estado if a.id_estado_asistencia else '-',
            })

        return Response(result)

    @action(detail=True, methods=['patch'], url_path='justificar')
    def justificar(self, request, pk=None):
        roles = get_roles_for_usuario(request.user.username)
        if 'preceptor' not in roles:
            return Response({'error': 'Solo preceptores.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            asistencia = Asistencia.objects.get(pk=pk)
        except Asistencia.DoesNotExist:
            return Response({'error': 'Asistencia no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        cursos_ids = _preceptor_cursos_ids(request)
        cm = asistencia.id_curso_materia
        if cm.id_curso_id not in cursos_ids:
            return Response({'error': 'No autorizado para modificar esta asistencia.'}, status=status.HTTP_403_FORBIDDEN)

        justificado = request.data.get('justificado')
        if justificado is None:
            return Response({'error': 'Se requiere justificado.'}, status=status.HTTP_400_BAD_REQUEST)

        asistencia.justificado = bool(justificado)
        asistencia.save(update_fields=['justificado'])
        return Response({'id': asistencia.id_asistencia, 'justificado': asistencia.justificado})

    def _resolver_modulo(self, asistencia, dia_semana):
        cm_id = asistencia.id_curso_materia_id
        hora = asistencia.hora

        def _expandir(times, idx):
            s = e = idx
            while s > 0 and times[s - 1][1] == times[s][0]:
                s -= 1
            while e < len(times) - 1 and times[e][1] == times[e + 1][0]:
                e += 1
            return s, e

        horarios = list(Horario.objects.filter(
            id_curso_materia=cm_id, dia_semana=dia_semana,
            id_modulo__isnull=False,
        ).select_related('id_modulo').order_by('id_modulo__hora_inicio'))

        for i, h in enumerate(horarios):
            hi, hf = h.id_modulo.hora_inicio, h.id_modulo.hora_fin
            if hi is not None and hf is not None and hi <= hora < hf:
                times = [(x.id_modulo.hora_inicio, x.id_modulo.hora_fin) for x in horarios]
                s, e = _expandir(times, i)
                return {'horario': f'{times[s][0].strftime("%H:%M")} - {times[e][1].strftime("%H:%M")}'}

        hor_esp = list(HorariosEspeciales.objects.filter(
            id_curso_materia=cm_id, dia_semana=dia_semana,
        ).order_by('hora_inicio'))

        for i, h in enumerate(hor_esp):
            if h.hora_inicio <= hora < h.hora_fin:
                times = [(x.hora_inicio, x.hora_fin) for x in hor_esp]
                s, e = _expandir(times, i)
                return {'horario': f'{times[s][0].strftime("%H:%M")} - {times[e][1].strftime("%H:%M")}'}

        return None

    def create(self, request, *args, **kwargs):
        ahora = timezone.localtime()
        dia = _dia_semana_es(ahora)

        roles = get_roles_for_usuario(request.user.username)
        if 'jefe_preceptores' in roles or not any(r in roles for r in ('admin', 'director', 'preceptor', 'docente')):
            return Response({'error': 'No tenés permiso para registrar asistencias.'}, status=status.HTTP_403_FORBIDDEN)

        cm_id = request.data.get('id_curso_materia')
        if not cm_id:
            return Response({'error': 'id_curso_materia es requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        horarios_hoy = self._horarios_hoy(cm_id, dia)
        estado = self._estado_horario(horarios_hoy, ahora)
        if estado['codigo'] != 'en_horario':
            return Response({'error': estado['mensaje']}, status=status.HTTP_403_FORBIDDEN)

        activo, tipo_ev, desc_ev, horario_ev, _, _ = evento_institucional_activo(ahora.date(), ahora.time())
        if activo:
            return Response({
                'error': f'No es posible registrar asistencias. Existe un evento institucional activo: "{tipo_ev}". {desc_ev}. Horario afectado: {horario_ev}.',
            }, status=status.HTTP_403_FORBIDDEN)

        roles = get_roles_for_usuario(request.user.username)
        if 'docente' in roles:
            try:
                cm = CursoMateria.objects.get(id_curso_materia=cm_id)
            except CursoMateria.DoesNotExist:
                return Response({'error': 'Curso materia no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

            _verificar_docente_activo_materia(request, cm_id, ahora.date())

            activo = obtener_docente_activo(cm_id, ahora.date())
            if activo.docente:
                puede, mensaje, _ = docente_puede_registrar_asistencia_alumnos(
                    activo.docente.id_docente, cm_id, ahora.date(), ahora.time(),
                )
                if not puede:
                    return Response({'error': mensaje}, status=status.HTTP_403_FORBIDDEN)

        usuario_actual = Usuario.objects.filter(usuario=request.user.username).first()
        if not usuario_actual:
            return Response({'error': 'No se encontró un perfil de usuario válido.'}, status=status.HTTP_403_FORBIDDEN)

        data = {
            'id_alumno': request.data.get('id_alumno'),
            'id_curso_materia': cm_id,
            'id_estado_asistencia': request.data.get('id_estado_asistencia'),
            'fecha': request.data.get('fecha') or ahora.date(),
            'hora': ahora.time(),
            'id_usuario': usuario_actual.id_usuario,
        }
        existing = Asistencia.objects.filter(
            id_alumno=data['id_alumno'],
            id_curso_materia=data['id_curso_materia'],
            fecha=data['fecha'],
        ).first()
        if existing:
            serializer = self.get_serializer(existing, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            asistencia = serializer.save()
            _notificar_inasistencia(asistencia)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        _notificar_inasistencia(serializer.instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AsistenciaDocenteViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='docentes-disponibles')
    def docentes_disponibles(self, request):
        roles = get_roles_for_usuario(request.user.username)
        if 'preceptor' not in roles and 'admin' not in roles and 'director' not in roles:
            return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        cursos_ids = _preceptor_cursos_ids(request) if 'preceptor' in roles else None
        if 'preceptor' in roles and not cursos_ids:
            return Response({'error': 'Preceptor sin cursos asignados.'}, status=status.HTTP_403_FORBIDDEN)

        curso_nombre = request.query_params.get('curso')
        curso_filtro_id = None
        if curso_nombre:
            curso_obj = Curso.objects.filter(nombre_curso=curso_nombre, activo=True).first()
            if not curso_obj:
                return Response([])
            curso_filtro_id = curso_obj.id_curso

        ahora = timezone.localtime()
        dia = _dia_semana_es(ahora)
        hora_actual = ahora.time()
        fecha_hoy = ahora.date()

        horarios_normales = Horario.objects.filter(
            id_modulo__isnull=False,
            dia_semana=dia,
            id_curso_materia__id_curso__activo=True,
        ).select_related(
            'id_curso_materia__id_docente',
            'id_curso_materia__id_materia',
            'id_curso_materia__id_curso',
            'id_modulo',
        )

        horarios_especiales = HorariosEspeciales.objects.filter(
            dia_semana=dia,
            id_curso_materia__id_curso__activo=True,
        ).select_related(
            'id_curso_materia__id_docente',
            'id_curso_materia__id_materia',
            'id_curso_materia__id_curso',
        )

        bloques_map = {}
        for h in horarios_normales:
            cm = h.id_curso_materia
            if cursos_ids is not None and cm.id_curso_id not in cursos_ids:
                continue
            if curso_filtro_id is not None and cm.id_curso_id != curso_filtro_id:
                continue
            activo = obtener_docente_activo(cm.id_curso_materia, fecha_hoy)
            docente_activo = activo.docente
            if not docente_activo:
                continue
            hi = h.id_modulo.hora_inicio
            hf = h.id_modulo.hora_fin
            key = (docente_activo.id_docente, cm.id_curso_materia)
            if key not in bloques_map:
                bloques_map[key] = {
                    'docente_id': docente_activo.id_docente,
                    'docente_nombre': f'{docente_activo.apellido}, {docente_activo.nombre}',
                    'materia_nombre': cm.id_materia.nombre_materia if cm.id_materia else '-',
                    'curso_nombre': cm.id_curso.nombre_curso,
                    'cm_id': cm.id_curso_materia,
                    'times': [],
                }
            bloques_map[key]['times'].append((hi, hf))

        for h in horarios_especiales:
            cm = h.id_curso_materia
            if cursos_ids is not None and cm.id_curso_id not in cursos_ids:
                continue
            if curso_filtro_id is not None and cm.id_curso_id != curso_filtro_id:
                continue
            activo = obtener_docente_activo(cm.id_curso_materia, fecha_hoy)
            docente_activo = activo.docente
            if not docente_activo:
                continue
            key = (docente_activo.id_docente, cm.id_curso_materia)
            if key not in bloques_map:
                bloques_map[key] = {
                    'docente_id': docente_activo.id_docente,
                    'docente_nombre': f'{docente_activo.apellido}, {docente_activo.nombre}',
                    'materia_nombre': cm.id_materia.nombre_materia if cm.id_materia else '-',
                    'curso_nombre': cm.id_curso.nombre_curso,
                    'cm_id': cm.id_curso_materia,
                    'times': [],
                }
            bloques_map[key]['times'].append((h.hora_inicio, h.hora_fin))

        resultado = []
        for key, info in bloques_map.items():
            times = sorted(info['times'], key=lambda x: x[0])

            s = 0
            while s < len(times):
                e = s
                while e < len(times) - 1 and times[e][1] >= times[e + 1][0]:
                    e += 1

                inicio = times[s][0]
                fin = times[e][1]

                if inicio <= hora_actual < fin:
                    ya_registrada = AsistenciaDocente.objects.filter(
                        id_docente_id=info['docente_id'],
                        id_curso_materia_id=info['cm_id'],
                        fecha=fecha_hoy,
                        hora__gte=inicio,
                        hora__lt=fin,
                    ).exists()

                    resultado.append({
                        'docente_id': info['docente_id'],
                        'docente_nombre': info['docente_nombre'],
                        'materia_nombre': info['materia_nombre'],
                        'curso_nombre': info['curso_nombre'],
                        'cm_id': info['cm_id'],
                        'horario': f'{inicio.strftime("%H:%M")} - {fin.strftime("%H:%M")}',
                        'ya_registrada': ya_registrada,
                    })
                    break

                s = e + 1

        resultado.sort(key=lambda r: r['docente_nombre'])
        return Response(resultado)

    @action(detail=False, methods=['post'], url_path='registrar-asistencia-docente')
    def registrar_asistencia_docente(self, request):
        roles = get_roles_for_usuario(request.user.username)
        if 'jefe_preceptores' in roles:
            return Response({'error': 'No tenés permiso para registrar asistencia de docentes.'}, status=status.HTTP_403_FORBIDDEN)
        if 'preceptor' not in roles and 'admin' not in roles and 'director' not in roles:
            return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        cursos_ids = _preceptor_cursos_ids(request) if 'preceptor' in roles else None
        if 'preceptor' in roles and not cursos_ids:
            return Response({'error': 'Preceptor sin cursos asignados.'}, status=status.HTTP_403_FORBIDDEN)

        docente_id = request.data.get('docente_id')
        cm_id = request.data.get('cm_id')
        estado = request.data.get('estado')

        if not docente_id or not cm_id or not estado:
            return Response(
                {'error': 'Se requieren docente_id, cm_id y estado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ahora = timezone.localtime()
        dia = _dia_semana_es(ahora)
        hora_actual = ahora.time()
        fecha_hoy = ahora.date()

        try:
            cm = CursoMateria.objects.get(id_curso_materia=cm_id)
        except CursoMateria.DoesNotExist:
            return Response({'error': 'Curso materia no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        activo = obtener_docente_activo(cm.id_curso_materia, fecha_hoy)
        if not activo.docente or activo.docente.id_docente != int(docente_id):
            return Response({'error': 'El docente no corresponde a esta materia.'}, status=status.HTTP_400_BAD_REQUEST)

        if cursos_ids is not None and cm.id_curso_id not in cursos_ids:
            return Response({'error': 'No autorizado para este curso.'}, status=status.HTTP_403_FORBIDDEN)

        bloques = self._obtener_bloques_hoy(cm_id, dia)
        bloque_encontrado = None
        for inicio, fin in bloques:
            if inicio <= hora_actual < fin:
                bloque_encontrado = (inicio, fin)
                break

        if not bloque_encontrado:
            return Response(
                {'error': 'El docente no tiene clases programadas en este momento.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        activo, tipo_ev, desc_ev, horario_ev, _, _ = evento_institucional_activo(fecha_hoy, hora_actual)
        if activo:
            return Response({
                'error': f'No es posible registrar asistencias. Existe un evento institucional activo: "{tipo_ev}". {desc_ev}. Horario afectado: {horario_ev}.',
            }, status=status.HTTP_403_FORBIDDEN)

        inicio, fin = bloque_encontrado
        duplicada = AsistenciaDocente.objects.filter(
            id_docente_id=docente_id,
            id_curso_materia_id=cm_id,
            fecha=fecha_hoy,
            hora__gte=inicio,
            hora__lt=fin,
        ).first()

        if duplicada:
            return Response(
                {'error': 'Ya se registró asistencia para este docente en este bloque horario.'},
                status=status.HTTP_409_CONFLICT,
            )

        estado_obj = EstadoAsistencia.objects.filter(nombre_estado=estado).first()
        if not estado_obj:
            return Response({'error': f'Estado de asistencia "{estado}" no encontrado.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario = Usuario.objects.filter(usuario=request.user.username).first()
        if not usuario:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        asistencia = AsistenciaDocente.objects.create(
            id_docente_id=docente_id,
            id_curso_materia_id=cm_id,
            id_usuario=usuario,
            id_estado_asistencia=estado_obj,
            fecha=fecha_hoy,
            hora=ahora.time(),
        )

        return Response({
            'id_asistencia_docente': asistencia.id_asistencia_docente,
            'docente_id': docente_id,
            'cm_id': cm_id,
            'estado': estado,
            'fecha': fecha_hoy.strftime('%Y-%m-%d'),
            'mensaje': 'Asistencia registrada correctamente.',
        }, status=status.HTTP_201_CREATED)

    def _obtener_bloques_hoy(self, cm_id, dia_semana):
        return _obtener_bloques_horario(cm_id, dia_semana)


def _verificar_solapamiento(nuevo_alcance, nueva_fecha, nueva_hora_inicio, nueva_hora_fin, nuevo_permanente, exclude_id=None):
    """Verifica si un nuevo evento entra en conflicto con existentes.

    Reglas de conflicto (bloquea la creación):
      - todo_dia: NUNCA se bloquea (reemplaza todo).
      - manana: se bloquea si existe un todo_dia en la misma fecha.
      - tarde: se bloquea si existe un todo_dia en la misma fecha.
      - franja: se bloquea si existe todo_dia, o si manana/tarde cubre la franja,
                o si otra franja se superpone sin ser cubierta completamente.

    Retorna string de error o None.
    """
    from django.db.models import Q
    if not nueva_fecha:
        return None

    if nuevo_permanente:
        query = Q(fecha__month=nueva_fecha.month, fecha__day=nueva_fecha.day, permanente=True)
    else:
        query = Q(Q(fecha=nueva_fecha, permanente=False) | Q(fecha=nueva_fecha, permanente=True))

    if exclude_id:
        query = query & ~Q(id_evento=exclude_id)

    otros = list(EventoInstitucional.objects.filter(query))
    if not otros:
        return None

    if nuevo_alcance == 'todo_dia':
        return None

    mod_manana = list(Modulos.objects.filter(hora_inicio__hour__lt=12).order_by('hora_inicio'))
    mod_tarde = list(Modulos.objects.filter(hora_inicio__hour__gte=12).order_by('hora_inicio'))

    def _rango_turno(modulos):
        if not modulos:
            return None, None
        return modulos[0].hora_inicio, modulos[-1].hora_fin

    m_hi, m_hf = _rango_turno(mod_manana)
    t_hi, t_hf = _rango_turno(mod_tarde)

    for ev in otros:
        if nuevo_alcance == 'manana':
            if ev.alcance == 'todo_dia':
                return 'Existe un evento de todo el día para esa fecha.'

        elif nuevo_alcance == 'tarde':
            if ev.alcance == 'todo_dia':
                return 'Existe un evento de todo el día para esa fecha.'

        elif nuevo_alcance == 'franja':
            if not (nueva_hora_inicio and nueva_hora_fin):
                continue
            if ev.alcance == 'todo_dia':
                return 'Existe un evento de todo el día para esa fecha.'
            if ev.alcance == 'manana' and m_hi and m_hf:
                if nueva_hora_inicio < m_hf and nueva_hora_fin > m_hi:
                    return 'La franja horaria se superpone con el turno mañana.'
            if ev.alcance == 'tarde' and t_hi and t_hf:
                if nueva_hora_inicio < t_hf and nueva_hora_fin > t_hi:
                    return 'La franja horaria se superpone con el turno tarde.'
            if ev.alcance == 'franja' and ev.hora_inicio and ev.hora_fin:
                if nueva_hora_inicio < ev.hora_fin and nueva_hora_fin > ev.hora_inicio:
                    cubre = nueva_hora_inicio <= ev.hora_inicio and nueva_hora_fin >= ev.hora_fin
                    if not cubre:
                        return 'Ya existe un evento con franja horaria superpuesta.'

    return None


def _alcance_cubre(nuevo_alcance, nueva_hora_inicio, nueva_hora_fin, alcance_existente, ev_hora_inicio, ev_hora_fin):
    """Determina si el nuevo alcance cubre completamente al existente."""
    if nuevo_alcance == 'todo_dia':
        return True
    if nuevo_alcance == 'manana' and alcance_existente == 'manana':
        return True
    if nuevo_alcance == 'tarde' and alcance_existente == 'tarde':
        return True
    if nuevo_alcance == 'franja' and alcance_existente == 'franja':
        if nueva_hora_inicio and nueva_hora_fin and ev_hora_inicio and ev_hora_fin:
            return nueva_hora_inicio <= ev_hora_inicio and nueva_hora_fin >= ev_hora_fin
    return False


def _eventos_a_reemplazar(nuevo_alcance, nueva_fecha, nueva_hora_inicio, nueva_hora_fin, nuevo_permanente, exclude_id=None):
    """Retorna IDs de eventos que deben eliminarse porque el nuevo los cubre.

    Reglas:
      - todo_dia: reemplaza TODOS los eventos de esa fecha (misma permanencia).
      - manana: reemplaza otros manana.
      - tarde: reemplaza otros tarde.
      - franja: reemplaza otra franja si la envuelve completamente.
    """
    from django.db.models import Q
    if not nueva_fecha:
        return []

    if nuevo_permanente:
        query = Q(fecha__month=nueva_fecha.month, fecha__day=nueva_fecha.day, permanente=True)
    else:
        query = Q(fecha=nueva_fecha, permanente=False)

    if exclude_id:
        query = query & ~Q(id_evento=exclude_id)

    otros = EventoInstitucional.objects.filter(query)
    ids_reemplazar = []

    for ev in otros:
        if _alcance_cubre(nuevo_alcance, nueva_hora_inicio, nueva_hora_fin, ev.alcance, ev.hora_inicio, ev.hora_fin):
            ids_reemplazar.append(ev.id_evento)

    return ids_reemplazar


class EventoInstitucionalViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = EventoInstitucional.objects.prefetch_related(
        'id_usuario_creador',
        'id_usuario_creador__preceptor',
        'id_usuario_creador__directivo',
    ).all()
    serializer_class = EventoInstitucionalSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    historial_tabla = 'eventos_institucionales'
    historial_soft_delete = True

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        usuario = Usuario.objects.filter(usuario=self.request.user.username).first()
        data = serializer.validated_data
        err = _verificar_solapamiento(
            data.get('alcance', 'todo_dia'),
            data.get('fecha'),
            data.get('hora_inicio'),
            data.get('hora_fin'),
            data.get('permanente', False),
        )
        if err:
            raise ValidationError({'non_field_errors': [err]})
        ids_reemplazar = _eventos_a_reemplazar(
            data.get('alcance', 'todo_dia'),
            data.get('fecha'),
            data.get('hora_inicio'),
            data.get('hora_fin'),
            data.get('permanente', False),
        )
        if ids_reemplazar:
            reemplazados = list(EventoInstitucional.objects.filter(id_evento__in=ids_reemplazar))
            resumenes = [(ev.pk, resumen_registro(ev)) for ev in reemplazados]
            EventoInstitucional.objects.filter(id_evento__in=ids_reemplazar).update(
                estado=False,
                fecha_eliminacion=timezone.now(),
            )
            for pk, resumen in resumenes:
                self._historial_registrar(
                    ACCION_ELIMINAR, self.get_historial_tabla(), pk,
                    resumen, 'Evento reemplazado',
                )
        serializer.save(id_usuario_creador=usuario)
        self._historial_alta(serializer)
        _notificar_evento_institucional(serializer.instance)

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        from django.db.models import Q
        instance = self.get_object()
        data = serializer.validated_data
        nueva_fecha = data.get('fecha', instance.fecha)
        nuevo_alcance = data.get('alcance', instance.alcance)
        nueva_hora_inicio = data.get('hora_inicio', instance.hora_inicio)
        nueva_hora_fin = data.get('hora_fin', instance.hora_fin)

        if nuevo_alcance == 'franja':
            if nueva_hora_inicio and nueva_hora_fin and nueva_hora_inicio >= nueva_hora_fin:
                raise ValidationError({'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'})

        err = _verificar_solapamiento(
            nuevo_alcance,
            nueva_fecha,
            nueva_hora_inicio,
            nueva_hora_fin,
            data.get('permanente', instance.permanente),
            exclude_id=instance.id_evento,
        )
        if err:
            raise ValidationError({'non_field_errors': [err]})
        ids_reemplazar = _eventos_a_reemplazar(
            nuevo_alcance,
            nueva_fecha,
            nueva_hora_inicio,
            nueva_hora_fin,
            data.get('permanente', instance.permanente),
            exclude_id=instance.id_evento,
        )
        if ids_reemplazar:
            reemplazados = list(EventoInstitucional.objects.filter(id_evento__in=ids_reemplazar))
            resumenes = [(ev.pk, resumen_registro(ev)) for ev in reemplazados]
            EventoInstitucional.objects.filter(id_evento__in=ids_reemplazar).update(
                estado=False,
                fecha_eliminacion=timezone.now(),
            )
            for pk, resumen in resumenes:
                self._historial_registrar(
                    ACCION_ELIMINAR, self.get_historial_tabla(), pk,
                    resumen, 'Evento reemplazado',
                )
        valor_anterior = resumen_registro(instance)
        serializer.save(fecha_creacion=instance.fecha_creacion)
        self._historial_modificacion(serializer, valor_anterior)


class TipoActaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoActa.objects.all()
    serializer_class = TipoActaSerializer


# Roles autorizados para crear actas (y sus relaciones). Admin y Director
# no crean actas desde el sistema: solo visualizan y gestionan las
# existentes. Familia y Alumno solo tienen acceso de lectura.
ROLES_CREAR_ACTA = ('docente', 'preceptor', 'jefe_preceptores')


class ActaPropiedadMixin:
    """Helpers de roles/propiedad compartidos por `ActaViewSet` y sus
    relaciones (acta_alumno, acta_curso, acta_docente)."""

    def _roles_usuario(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        return get_roles_for_usuario(username) if username else []

    def _usuario_actual(self):
        """Usuario del sistema (`usuarios`) correspondiente al usuario
        autenticado (request.user). No se asume que `request.user.id`
        coincida con `usuarios.id_usuario`."""
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        return Usuario.objects.filter(usuario=username).first()

    def _check_acta_owner_permission(self, acta):
        roles = self._roles_usuario()
        if 'admin' in roles or 'director' in roles:
            return
        usuario_obj = self._usuario_actual()
        if not usuario_obj or acta.id_usuario_creador_id != usuario_obj.id_usuario:
            raise PermissionDenied("Solo puedes modificar o eliminar tus propias actas.")


class ActaViewSet(HistorialMixin, ActaPropiedadMixin, viewsets.ModelViewSet):
    queryset = Acta.objects.select_related(
        'id_usuario_creador', 'id_tipo_acta',
    ).all()
    serializer_class = ActaSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarActas]
    historial_tabla = 'actas'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        alumno = self.request.query_params.get('alumno')
        docente = self.request.query_params.get('docente')
        if curso:
            acta_ids = ActaCurso.objects.filter(
                id_curso=curso,
            ).values_list('id_acta', flat=True)
            qs = qs.filter(id_acta__in=acta_ids)
        if alumno:
            acta_ids = ActaAlumno.objects.filter(
                id_alumno=alumno,
            ).values_list('id_acta', flat=True)
            qs = qs.filter(id_acta__in=acta_ids)
        if docente:
            acta_ids = ActaDocente.objects.filter(
                id_docente=docente,
            ).values_list('id_acta', flat=True)
            qs = qs.filter(id_acta__in=acta_ids)
        return qs

    def perform_create(self, serializer):
        roles = self._roles_usuario()
        if 'admin' in roles or 'director' in roles:
            raise PermissionDenied("Admin y Director no crean actas desde el sistema.")
        if not any(r in roles for r in ROLES_CREAR_ACTA):
            raise PermissionDenied("Tu rol no tiene permiso para crear actas.")
        usuario = self._usuario_actual()
        if not usuario:
            raise PermissionDenied("No se pudo identificar tu usuario en el sistema.")
        # El creador real es el usuario autenticado; se ignora cualquier
        # valor de `id_usuario_creador` enviado por el cliente.
        serializer.save(id_usuario_creador=usuario)
        self._historial_alta(serializer)

    def perform_update(self, serializer):
        self._check_acta_owner_permission(serializer.instance)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        self._check_acta_owner_permission(instance)
        super().perform_destroy(instance)


class ActaRelacionMixin(ActaPropiedadMixin):
    """Controles para las relaciones acta-alumno/curso/docente.

    Estas relaciones no deben servir como vía alternativa para modificar un
    acta ajena: crear, modificar o eliminar una relación exige los mismos
    permisos que la acta de la que cuelga (Admin/Director → cualquier acta;
    propietario → sus propias actas; el resto → rechazado)."""

    def _acta_destino(self, serializer):
        acta = serializer.validated_data.get('id_acta')
        if acta is None:
            acta = getattr(serializer.instance, 'id_acta', None)
        return acta

    def perform_create(self, serializer):
        roles = self._roles_usuario()
        if 'admin' in roles or 'director' in roles:
            raise PermissionDenied("Admin y Director no crean actas desde el sistema.")
        if not any(r in roles for r in ROLES_CREAR_ACTA):
            raise PermissionDenied("Tu rol no tiene permiso para crear relaciones de actas.")
        acta = self._acta_destino(serializer)
        if acta is None:
            raise PermissionDenied("La relación debe estar asociada a una acta.")
        self._check_acta_owner_permission(acta)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        acta = self._acta_destino(serializer)
        if acta is None:
            raise PermissionDenied("No se pudo identificar el acta asociada.")
        self._check_acta_owner_permission(acta)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        self._check_acta_owner_permission(instance.id_acta)
        super().perform_destroy(instance)


class ActaAlumnoViewSet(ActaRelacionMixin, viewsets.ModelViewSet):
    queryset = ActaAlumno.objects.select_related('id_acta', 'id_alumno').all()
    serializer_class = ActaAlumnoSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarActas]

    def perform_create(self, serializer):
        super().perform_create(serializer)
        _notificar_acta_conducta(serializer.instance)


class ActaCursoViewSet(ActaRelacionMixin, viewsets.ModelViewSet):
    queryset = ActaCurso.objects.select_related('id_acta', 'id_curso').all()
    serializer_class = ActaCursoSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarActas]


class ActaDocenteViewSet(ActaRelacionMixin, viewsets.ModelViewSet):
    queryset = ActaDocente.objects.select_related('id_acta', 'id_docente').all()
    serializer_class = ActaDocenteSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarActas]


class ComunicadoViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = Comunicado.objects.select_related(
        'id_usuario_creador', 'id_curso__id_ciclo', 'id_materia',
    ).prefetch_related('archivos', 'alcances').all()
    serializer_class = ComunicadoSerializer
    permission_classes = [IsAuthenticated, PuedePublicarComunicados]
    historial_tabla = 'comunicados'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        return _filter_visible_comunicados(self.request, qs)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        _notificar_comunicado_publicado(serializer.instance)


class ComunicadoArchivoViewSet(viewsets.ModelViewSet):
    queryset = ComunicadoArchivo.objects.select_related('id_comunicado').all()
    serializer_class = ComunicadoArchivoSerializer
    permission_classes = [IsAuthenticated, PuedePublicarComunicados]

    def get_queryset(self):
        qs = super().get_queryset()
        comunicados_visibles = _filter_visible_comunicados(self.request, Comunicado.objects.prefetch_related('alcances').all())
        ids_visibles = list(comunicados_visibles.values_list('id_comunicado', flat=True))
        return qs.filter(id_comunicado__in=ids_visibles)


class PlanificacionViewSet(viewsets.ModelViewSet):
    queryset = Planificacion.objects.select_related(
        'id_docente', 'id_curso_materia',
        'id_curso_materia__id_curso', 'id_curso_materia__id_materia',
        'id_curso_materia__id_curso__id_ciclo',
    ).all()
    serializer_class = PlanificacionSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarPlanificaciones]

    def get_queryset(self):
        qs = super().get_queryset()
        docente = self.request.query_params.get('docente')
        curso_materia = self.request.query_params.get('curso_materia')
        if docente:
            qs = qs.filter(id_docente=docente)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def perform_destroy(self, instance):
        cm = instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(self.request, cm.id_curso_materia)
        marcar_eliminado(instance)

    def _generar_pdf(self, planificacion, contenido, objetivos, salidas, fundamentacion):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.enums import TA_LEFT, TA_CENTER
        import os
        from django.conf import settings

        docente = planificacion.id_docente
        cm_obj = planificacion.id_curso_materia
        materia_nombre = cm_obj.id_materia.nombre_materia if cm_obj and cm_obj.id_materia_id else ''
        curso_nombre = cm_obj.id_curso.nombre_curso if cm_obj and cm_obj.id_curso_id else ''
        docente_nombre = f"{docente.nombre} {docente.apellido}" if docente else ''

        anio = str(cm_obj.id_curso.id_ciclo.anio) if (cm_obj and cm_obj.id_curso_id and cm_obj.id_curso.id_ciclo_id) else ''

        safe_materia = re.sub(r'[\\/*?:"<>|]', '', (materia_nombre or '')).replace(' ', '_')
        safe_curso = re.sub(r'[\\/*?:"<>|]', '', (curso_nombre or '')).replace(' ', '_')
        filename = f'Proyecto_{safe_materia}_{safe_curso}_{anio}.pdf'

        dest_dir = os.path.join(settings.MEDIA_ROOT, 'planificaciones')
        os.makedirs(dest_dir, exist_ok=True)
        filepath = os.path.join(dest_dir, filename)

        doc = SimpleDocTemplate(filepath, pagesize=A4,
                                topMargin=2.5 * cm, bottomMargin=2 * cm,
                                leftMargin=2.5 * cm, rightMargin=2.5 * cm)

        styles = getSampleStyleSheet()
        titulo_style = ParagraphStyle(
            'Titulo', parent=styles['Title'],
            fontSize=16, spaceAfter=6, alignment=TA_CENTER,
        )
        subtitulo_style = ParagraphStyle(
            'Subtitulo', parent=styles['Normal'],
            fontSize=12, spaceAfter=4, alignment=TA_CENTER,
        )
        cuerpo_style = ParagraphStyle(
            'Cuerpo', parent=styles['Normal'],
            fontSize=11, spaceAfter=12, alignment=TA_LEFT,
            leading=16,
        )
        seccion_style = ParagraphStyle(
            'Seccion', parent=styles['Heading2'],
            fontSize=13, spaceBefore=16, spaceAfter=6,
        )

        elements = []
        elements.append(Paragraph(f"{materia_nombre} - {curso_nombre}", titulo_style))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"Docente: {docente_nombre}", subtitulo_style))
        elements.append(Spacer(1, 16))

        if contenido:
            elements.append(Paragraph("Contenido", seccion_style))
            elements.append(Paragraph(contenido.replace('\n', '<br/>'), cuerpo_style))
        if objetivos:
            elements.append(Paragraph("Objetivos", seccion_style))
            elements.append(Paragraph(objetivos.replace('\n', '<br/>'), cuerpo_style))
        if salidas:
            elements.append(Paragraph("Salidas", seccion_style))
            elements.append(Paragraph(salidas.replace('\n', '<br/>'), cuerpo_style))
        if fundamentacion:
            elements.append(Paragraph("Fundamentación", seccion_style))
            elements.append(Paragraph(fundamentacion.replace('\n', '<br/>'), cuerpo_style))

        doc.build(elements)
        return f'{settings.MEDIA_URL}planificaciones/{filename}'

    def create(self, request, *args, **kwargs):
        mutable = request.data.copy()
        mutable['fecha_subida'] = timezone.now()
        mutable['fecha_ultima_modificacion'] = timezone.now()

        serializer = self.get_serializer(data=mutable)
        serializer.is_valid(raise_exception=True)
        save_kwargs = {}
        cm = serializer.validated_data.get('id_curso_materia')
        if cm is not None:
            _verificar_docente_activo_materia(request, cm.id_curso_materia)
            roles = get_roles_for_usuario(request.user.username)
            if 'docente' in roles:
                activo = obtener_docente_activo(cm.id_curso_materia)
                if activo.docente:
                    save_kwargs['id_docente'] = activo.docente
        planificacion = serializer.save(**save_kwargs)

        if 'docente' in roles:
            _notificar_planificacion_para_revision(planificacion, accion='creada')

        pdf_url = self._generar_pdf(
            planificacion,
            planificacion.contenido or '',
            planificacion.objetivos or '',
            planificacion.salidas or '',
            planificacion.fundamentacion or '',
        )
        Planificacion.objects.filter(id_planificacion=planificacion.id_planificacion).update(
            ruta_archivo=pdf_url,
        )
        planificacion.ruta_archivo = pdf_url

        return Response(PlanificacionSerializer(planificacion).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        from django.conf import settings
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        mutable = request.data.copy()
        mutable['fecha_subida'] = timezone.now()
        mutable['fecha_ultima_modificacion'] = timezone.now()

        serializer = self.get_serializer(instance, data=mutable, partial=partial)
        serializer.is_valid(raise_exception=True)
        save_kwargs = {}
        cm = serializer.validated_data.get('id_curso_materia') or instance.id_curso_materia
        if cm is not None:
            _verificar_docente_activo_materia(request, cm.id_curso_materia)
            roles = get_roles_for_usuario(request.user.username)
            if 'docente' in roles:
                activo = obtener_docente_activo(cm.id_curso_materia)
                if activo.docente:
                    save_kwargs['id_docente'] = activo.docente
        planificacion = serializer.save(**save_kwargs)

        if 'docente' in roles:
            _notificar_planificacion_para_revision(planificacion, accion='actualizada')

        # Remove old PDF file if it exists
        if planificacion.ruta_archivo:
            rel_path = planificacion.ruta_archivo.replace(settings.MEDIA_URL, '', 1) if planificacion.ruta_archivo.startswith(settings.MEDIA_URL) else planificacion.ruta_archivo
            old_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass

        pdf_url = self._generar_pdf(
            planificacion,
            planificacion.contenido or '',
            planificacion.objetivos or '',
            planificacion.salidas or '',
            planificacion.fundamentacion or '',
        )
        Planificacion.objects.filter(id_planificacion=planificacion.id_planificacion).update(
            ruta_archivo=pdf_url,
        )
        planificacion.ruta_archivo = pdf_url

        return Response(PlanificacionSerializer(planificacion).data, status=status.HTTP_200_OK)


class LibroTemaViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = LibroTema.objects.select_related(
        'id_docente',
        'id_curso_materia__id_curso',
        'id_curso_materia__id_materia',
    ).all()
    serializer_class = LibroTemaSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAmbitoDocente]
    historial_tabla = 'libro_temas'
    historial_soft_delete = True

    def _docente_actual(self):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return None
        usuario_obj = Usuario.objects.filter(usuario=username).first()
        if not usuario_obj:
            return None
        return Docente.objects.filter(id_usuario=usuario_obj).first()

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []

        if 'docente' in roles:
            docente = self._docente_actual()
            if not docente:
                return qs.none()
            qs = qs.filter(id_docente=docente)
        elif not roles:
            return qs.none()

        curso = self.request.query_params.get('curso')
        if curso:
            qs = qs.filter(id_curso_materia__id_curso=curso)
        curso_materia = self.request.query_params.get('curso_materia')
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs.order_by('-fecha', '-hora_inicio')

    def _verificar_dueño(self, instance):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied('Usuario no autenticado.')
        roles = get_roles_for_usuario(username)
        if 'admin' in roles or 'director' in roles:
            return
        docente = self._docente_actual()
        if not docente:
            raise PermissionDenied('No se encontró un perfil de docente asociado al usuario.')
        if instance.id_docente_id != docente.id_docente:
            raise PermissionDenied(
                'No tienes permiso para realizar esta operación sobre este registro del Libro de Temas.'
            )
        cm = instance.id_curso_materia
        if cm is not None and instance.fecha:
            adelanto = adelanto_activo_para_clase(
                cm.id_curso_id, cm.id_materia_id, instance.fecha,
                hora_inicio=instance.hora_inicio, hora_fin=instance.hora_fin,
            )
            if adelanto is not None:
                if adelanto.id_docente_id != docente.id_docente:
                    raise PermissionDenied(
                        'Esta clase fue cubierta por un adelanto de horas autorizado a otro docente.'
                    )
                return
        activo = obtener_docente_activo(instance.id_curso_materia_id, instance.fecha)
        if activo.es_suplencia and activo.titular and activo.titular.id_docente == docente.id_docente:
            raise PermissionDenied('Esta materia se encuentra actualmente a cargo de un docente suplente.')
        if not (activo.docente and activo.docente.id_docente == docente.id_docente):
            raise PermissionDenied(
                'No tienes permiso para realizar esta operación sobre este registro del Libro de Temas.'
            )

    def _verificar_puede_modificar(self, instance):
        """Bloquea modificaciones/eliminación cuando el horario ya finalizó.

        Debe ejecutarse antes de `perform_update`/`perform_destroy` para que
        los intentos fallidos no generen registros en `historial_cambios`.
        """
        if not puede_modificar_libro_tema(instance):
            raise PermissionDenied(
                'No puede modificar este Libro de Temas porque el horario de la clase ya finalizó.'
            )

    def _validar_puede_cargar(self, cm_id):
        """Valida que se pueda cargar el Libro de Temas en el momento actual.

        Reglas (reutilizando la lógica existente del sistema):
          - Solo se puede cargar si hay una clase activa ahora para la materia
            y si no hay un evento institucional activo. El contexto lo define
            `obtener_contexto_docente_para_clase`: evento institucional →
            adelanto de horas → suplencia/horario normal.
          - El docente autenticado debe ser el docente activo de la clase
            (docente del adelanto, suplente o titular según corresponda).
          - El titular no puede cargar mientras una suplencia esté vigente.
          - Fuera de horario / evento activo: HTTP 403.
        """
        ahora = timezone.localtime()
        fecha_hoy = ahora.date()
        hora_ahora = ahora.time()

        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied('Usuario no autenticado.')
        roles = get_roles_for_usuario(username)
        es_directivo = 'admin' in roles or 'director' in roles

        contexto = obtener_contexto_docente_para_clase(cm_id, fecha_hoy, hora_ahora)

        if contexto['tipo'] == 'evento_institucional':
            tipo_ev, desc_ev, horario_ev = contexto['evento']
            raise PermissionDenied(
                f'No puede cargar el Libro de Temas porque hay un evento institucional activo ({tipo_ev}).'
            )

        if not contexto['autorizado']:
            raise PermissionDenied(
                'No puede cargar el Libro de Temas porque actualmente no tiene una clase asignada para esta materia.'
            )

        if not es_directivo:
            if 'docente' not in roles:
                raise PermissionDenied('No tienes permiso para cargar el Libro de Temas.')
            docente = self._docente_actual()
            if not docente:
                raise PermissionDenied('No se encontró un perfil de docente asociado al usuario.')
            docente_activo = contexto['docente']
            if not (docente_activo and docente_activo.id_docente == docente.id_docente):
                if contexto['tipo'] == 'adelanto':
                    raise PermissionDenied(
                        'Esta clase está cubierta por un adelanto de horas autorizado a otro docente.'
                    )
                if (
                    contexto['es_suplencia']
                    and contexto['titular']
                    and contexto['titular'].id_docente == docente.id_docente
                ):
                    raise PermissionDenied('Esta materia se encuentra actualmente a cargo de un docente suplente.')
                raise PermissionDenied('No tienes permiso para cargar el Libro de Temas en esta materia.')

        return {
            'fecha': fecha_hoy,
            'hora_inicio': contexto['hora_inicio'],
            'hora_fin': contexto['hora_fin'],
            'activo': contexto,
        }

    def perform_create(self, serializer, **kwargs):
        serializer.save(**kwargs)
        self._historial_alta(serializer)

    def create(self, request, *args, **kwargs):
        cm_id = request.data.get('id_curso_materia')
        if not cm_id:
            return Response(
                {'id_curso_materia': ['Debe indicar la asignación curso/materia.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        info = self._validar_puede_cargar(cm_id)

        mutable = request.data.copy()
        mutable['fecha'] = info['fecha']
        mutable['hora_inicio'] = info['hora_inicio']
        mutable['hora_fin'] = info['hora_fin']

        serializer = self.get_serializer(data=mutable)
        serializer.is_valid(raise_exception=True)

        save_kwargs = {}
        activo = info.get('activo')
        if isinstance(activo, dict):
            docente_activo = activo.get('docente')
        else:
            docente_activo = getattr(activo, 'docente', None)
        if docente_activo:
            save_kwargs['id_docente'] = docente_activo
        else:
            cm = CursoMateria.objects.filter(pk=cm_id).first()
            if cm and cm.id_docente_id:
                save_kwargs['id_docente'] = cm.id_docente
            else:
                raise PermissionDenied('No se puede determinar el docente a cargo de la materia.')

        self.perform_create(serializer, **save_kwargs)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        self._verificar_dueño(instance)
        self._verificar_puede_modificar(instance)

        mutable = request.data.copy()
        for campo in ('id_curso_materia', 'id_docente', 'fecha', 'hora_inicio', 'hora_fin', 'fecha_creacion'):
            mutable.pop(campo, None)

        serializer = self.get_serializer(instance, data=mutable, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        self._verificar_dueño(instance)
        self._verificar_puede_modificar(instance)
        super().perform_destroy(instance)


class DiagnosticoGrupalViewSet(HistorialMixin, viewsets.ModelViewSet):
    queryset = DiagnosticoGrupal.objects.select_related(
        'id_curso', 'id_docente',
    ).all()
    serializer_class = DiagnosticoGrupalSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAmbitoDocente]
    historial_tabla = 'diagnosticos'
    historial_soft_delete = True

    def get_queryset(self):
        qs = super().get_queryset()
        curso = self.request.query_params.get('curso')
        docente = self.request.query_params.get('docente')
        if curso:
            qs = qs.filter(id_curso=curso)
        if docente:
            qs = qs.filter(id_docente=docente)

        # Permission filtering based on user role
        from escuela.auth_backend import get_roles_for_usuario
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            return qs.none()

        roles = get_roles_for_usuario(username)
        usuario_obj = Usuario.objects.filter(usuario=username).first()

        if 'admin' in roles or 'director' in roles:
            # Administrators and directors can see all diagnostics
            return qs

        if 'alumno' in roles and usuario_obj:
            # Students can see diagnostics for their course
            alumno = Alumno.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if alumno:
                mi_curso_id = alumno.id_curso
                qs = qs.filter(id_curso=mi_curso_id)
            else:
                qs = qs.none()

        elif 'familia' in roles and usuario_obj:
            # Families can see diagnostics from their linked students' courses
            tutor = PadreTutor.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if tutor:
                hijos = Alumno.objects.filter(id_tutor=tutor.id_tutor)
                cursos_hijos_ids = list(hijos.values_list('id_curso', flat=True))
                qs = qs.filter(id_curso__in=cursos_hijos_ids)
            else:
                qs = qs.none()

        elif 'docente' in roles and usuario_obj:
            # Teachers can only see diagnostics for courses where they have assignments
            docente = Docente.objects.filter(id_usuario=usuario_obj.id_usuario).first()
            if docente:
                # Cursos de las materias donde el docente es activo (titular o suplente vigente)
                cursos_asignados = CursoMateria.objects.filter(
                    id_curso_materia__in=_materias_docente_ids(docente),
                ).values_list('id_curso', flat=True)
                qs = qs.filter(id_curso__in=cursos_asignados)
            else:
                qs = qs.none()

        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        username = request.user.username if request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles and 'docente' not in roles:
            return Response(
                {'error': 'No tienes permiso para eliminar este diagnóstico.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            _verificar_docente_activo_curso(request, instance.id_curso_id)
        except PermissionDenied as exc:
            return Response({'error': str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        username = self.request.user.username if self.request.user.is_authenticated else None
        if not username:
            raise PermissionDenied('Usuario no autenticado.')

        roles = get_roles_for_usuario(username)
        if 'admin' not in roles and 'director' not in roles and 'docente' not in roles:
            raise PermissionDenied('Solo docentes, administradores y directores pueden crear diagnósticos.')

        if 'docente' in roles:
            id_curso = self.request.data.get('id_curso')
            if not id_curso:
                raise PermissionDenied('Se debe especificar un curso.')

            _verificar_docente_activo_curso(self.request, id_curso)

            usuario_obj = Usuario.objects.filter(usuario=username).first()
            docente = Docente.objects.filter(id_usuario=usuario_obj).first() if usuario_obj else None
            if not docente:
                raise PermissionDenied('No se encontró el perfil de docente.')
            serializer.save(id_docente=docente)
        else:
            serializer.save()
        self._historial_alta(serializer)


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """Notificaciones del usuario autenticado (solo lectura).

    - `get_queryset` restringe SIEMPRE a `id_usuario` = usuario autenticado:
      nadie puede leer notificaciones ajenas, ni siquiera enviando `?usuario=`.
    - `?id_alumno=` solo sub-conjunta las notificaciones propias. Para el rol
      Familia se valida además que el `id_alumno` solicitado sea realmente uno
      de sus hijos; si no lo es, se devuelve vacío (nunca se concede acceso
      mediante `id_alumno`).
    - La creación es interna (módulo `notifications.notificar`) y no se expone
      por esta API: un usuario autenticado no puede crear notificaciones para
      otro usuario.
    """

    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        usuario = get_usuario(self.request)
        if not usuario:
            return Notificacion.objects.none()
        qs = Notificacion.objects.filter(id_usuario=usuario)
        alumno_id = self.request.query_params.get('id_alumno')
        if alumno_id:
            qs = self._aplicar_filtro_alumno(qs, alumno_id)
        return qs.order_by('-fecha')

    def _aplicar_filtro_alumno(self, qs, alumno_id):
        # La frontera de seguridad ya es `id_usuario` (solo las propias).
        # En Familia se valida que el `id_alumno` pedido sea un hijo real.
        try:
            alumno_id_int = int(alumno_id)
        except (TypeError, ValueError):
            return qs.none()
        hijos = set(alumno_ids_familia(self.request))
        if hijos:
            if alumno_id_int not in hijos:
                return qs.none()
        return qs.filter(id_alumno=alumno_id_int)

    @action(detail=True, methods=['patch'])
    def marcar_leida(self, request, pk=None):
        # `get_object()` usa `get_queryset()`, por lo que solo se puede
        # marcar una notificación propia (las ajenas dan 404).
        notif = self.get_object()
        notif.leida = True
        notif.save()
        return Response(NotificacionSerializer(notif).data)

    @action(detail=False, methods=['patch'])
    def marcar_todas_leidas(self, request):
        # Solo las propias: get_queryset restringe a id_usuario autenticado y
        # a un eventual filtro por id_alumno (para la vista "Del Estudiante"
        # de Familia, que solo afecta a las de su hijo seleccionado).
        cantidad = self.get_queryset().filter(leida=False).update(leida=True)
        return Response({'actualizadas': cantidad})


class TipoAccionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoAccion.objects.all()
    serializer_class = TipoAccionSerializer


class HistorialCambioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialCambio.objects.select_related(
        'id_usuario', 'id_tipo_accion',
    ).prefetch_related('id_usuario__usuariorol_set__id_rol').all()
    serializer_class = HistorialCambioSerializer
    permission_classes = [IsAuthenticated, PuedeVerHistorial]

    def get_queryset(self):
        qs = super().get_queryset().order_by('-fecha')
        username = self.request.user.username if self.request.user.is_authenticated else None
        roles = get_roles_for_usuario(username) if username else []
        if 'admin' not in roles and 'director' not in roles:
            if 'jefe_preceptores' in roles:
                qs = qs.filter(
                    id_usuario__usuariorol__id_rol__nombre_rol__in=[
                        'preceptor', 'jefe_preceptores',
                    ],
                ).distinct()
            else:
                return qs.none()
        fecha = self.request.query_params.get('fecha')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        usuario_id = self.request.query_params.get('usuario_id')
        rol = self.request.query_params.get('rol')
        accion = self.request.query_params.get('accion')
        tabla = self.request.query_params.get('tabla')

        if fecha:
            qs = qs.filter(fecha__date=fecha)
        if fecha_desde:
            qs = qs.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__date__lte=fecha_hasta)
        if usuario_id:
            qs = qs.filter(id_usuario_id=usuario_id)
        if rol:
            qs = qs.filter(
                id_usuario__usuariorol__id_rol__nombre_rol=rol,
            ).distinct()
        if accion:
            qs = qs.filter(id_tipo_accion__nombre_accion__iexact=accion)
        if tabla:
            qs = qs.filter(tabla_modificada=tabla)

        return qs


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_preceptoria(request):
    username = request.user.username
    roles = get_roles_for_usuario(username)
    if 'jefe_preceptores' not in roles and 'admin' not in roles and 'director' not in roles:
        return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)
    hoy = timezone.localdate()
    return Response({
        'total_preceptores': Preceptor.objects.filter(
            id_usuario__usuariorol__id_rol__nombre_rol='preceptor',
        ).count(),
        'cursos_con_preceptor': Curso.objects.filter(id_preceptor__isnull=False, activo=True).count(),
        'cursos_sin_preceptor': Curso.objects.filter(id_preceptor__isnull=True, activo=True).count(),
        'total_alumnos': Alumno.objects.count(),
        'total_tutores': PadreTutor.objects.count(),
        'docentes_ausentes_hoy': AsistenciaDocente.objects.filter(
            fecha=hoy,
            id_estado_asistencia__nombre_estado='Ausente',
        ).values('id_docente').distinct().count(),
        'alumnos_ausentes_hoy': Asistencia.objects.filter(
            fecha=hoy,
            id_estado_asistencia__nombre_estado='Ausente',
        ).values('id_alumno').distinct().count(),
        'actas_hoy': Acta.objects.filter(fecha__date=hoy).count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def supervision_preceptores(request):
    username = request.user.username
    roles = get_roles_for_usuario(username)
    if 'jefe_preceptores' not in roles and 'admin' not in roles and 'director' not in roles:
        return Response({'error': 'Acceso no autorizado.'}, status=status.HTTP_403_FORBIDDEN)
    preceptores = Preceptor.objects.filter(
        id_usuario__usuariorol__id_rol__nombre_rol='preceptor',
    ).select_related('id_usuario')
    result = []
    for p in preceptores:
        cursos = Curso.objects.filter(id_preceptor=p, activo=True)
        cursos_ids = list(cursos.values_list('id_curso', flat=True))
        cantidad_alumnos = Alumno.objects.filter(id_curso__in=cursos_ids).count()
        tutores_ids = Alumno.objects.filter(
            id_curso__in=cursos_ids,
            id_tutor__isnull=False,
        ).values_list('id_tutor', flat=True).distinct()
        ultimo_acceso = p.id_usuario.ultimo_acceso if p.id_usuario else None
        result.append({
            'id_preceptor': p.id_preceptor,
            'nombre': p.nombre,
            'apellido': p.apellido,
            'cursos_asignados': [
                {'id_curso': c.id_curso, 'nombre_curso': c.nombre_curso}
                for c in cursos
            ],
            'cantidad_cursos': len(cursos),
            'cantidad_alumnos': cantidad_alumnos,
            'cantidad_tutores': len(tutores_ids),
            'ultimo_acceso': ultimo_acceso.isoformat() if ultimo_acceso else None,
        })
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    import os
    from pathlib import PurePath
    from django.conf import settings

    archivo = request.FILES.get('archivo')
    if not archivo:
        return Response({'error': 'No se envió ningún archivo.'}, status=400)

    carpeta = PurePath(request.data.get('carpeta') or 'general').name or 'general'
    dest_dir = os.path.join(settings.MEDIA_ROOT, carpeta)
    os.makedirs(dest_dir, exist_ok=True)

    nombre = PurePath(archivo.name).name
    ruta = os.path.join(dest_dir, nombre)
    counter = 1
    base, ext = os.path.splitext(nombre)
    while os.path.exists(ruta):
        nombre = f'{base}_{counter}{ext}'
        ruta = os.path.join(dest_dir, nombre)
        counter += 1

    with open(ruta, 'wb+') as f:
        for chunk in archivo.chunks():
            f.write(chunk)

    url = f'{settings.MEDIA_URL}{carpeta}/{nombre}'
    return Response({'url': url, 'nombre': nombre})


class HistorialAcademicoViewSet(viewsets.ModelViewSet):
    queryset = HistorialAcademico.objects.select_related('id_alumno', 'id_materia', 'id_curso', 'id_curso_materia').all()
    serializer_class = HistorialAcademicoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        permitidos = alumnos_permitidos(self.request)
        if permitidos is not None:
            qs = qs.filter(id_alumno__in=permitidos)
        alumno = self.request.query_params.get('alumno')
        curso = self.request.query_params.get('curso')
        materia = self.request.query_params.get('materia')
        anio = self.request.query_params.get('anio')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if curso:
            qs = qs.filter(id_curso=curso)
        if materia:
            qs = qs.filter(id_materia=materia)
        if anio:
            qs = qs.filter(anio_lectivo=anio)
        return qs


TIPO_INTENSIF_1C = ('MARZO', 'JULIO', 'AGOSTO')
TIPO_INTENSIF_DICIEMBRE = ('DICIEMBRE_1', 'DICIEMBRE_2')
TIPO_INTENSIF_FEBRERO = 'FEBRERO'


def _tipo_intensif(periodo):
    """Clasifica un período de `IntensificacionAcademica` en los tres tipos
    conceptuales de intensificación. NO usa la secuencia genérica de previas."""
    if periodo in TIPO_INTENSIF_1C:
        return '1C'
    if periodo in TIPO_INTENSIF_DICIEMBRE:
        return 'DICIEMBRE'
    if periodo == TIPO_INTENSIF_FEBRERO:
        return 'FEBRERO'
    return None


def _nota_cuatrimestre(historial, orden):
    """Nota definitiva de un cuatrimestre (1 o 2) para el alumno/materia del
    historial, evaluada igual que `consolidar_historial_alumno`."""
    periodo = PeriodoEvaluacion.objects.filter(orden_periodo=orden, estado=True).first()
    if not periodo:
        return None
    cal = Calificacion.objects.filter(
        id_alumno=historial.id_alumno,
        id_curso_materia=historial.id_curso_materia,
        id_periodo=periodo,
    ).first()
    if cal and cal.nota_numerica is not None:
        return float(cal.nota_numerica)
    if orden == 1 and historial.nota_1_cuatrimestre is not None:
        return float(historial.nota_1_cuatrimestre)
    if orden == 2 and historial.nota_2_cuatrimestre is not None:
        return float(historial.nota_2_cuatrimestre)
    return None


def _intensif_por_tipo(instancias, tipo):
    for ins in instancias:
        if _tipo_intensif(ins.periodo) == tipo:
            return ins
    return None


def _intensif_habilitada(instancia):
    """Reglas académicas de habilitación de intensificaciones:
    - 1°C habilitada  -> desaprobó el Primer Cuatrimestre.
    - Diciembre habilitado -> desaprobó el Segundo Cuatrimestre
                             O desaprobó la Intensificación 1°C.
    - Febrero habilitado -> desaprobó la Intensificación de Diciembre.
    Todo comienza bloqueado: sin condición cumplida, NO se habilita.
    """
    historial = instancia.id_historial
    tipo = _tipo_intensif(instancia.periodo)
    hermanas = list(
        IntensificacionAcademica.objects.filter(id_historial=historial)
    )
    if tipo == '1C':
        n1 = _nota_cuatrimestre(historial, 1)
        return n1 is not None and n1 < NOTA_APROBACION
    if tipo == 'DICIEMBRE':
        n2 = _nota_cuatrimestre(historial, 2)
        intensif_1c = _intensif_por_tipo(hermanas, '1C')
        desaprobo_1c = intensif_1c is not None and intensif_1c.estado == 'DESAPROBADA'
        return (n2 is not None and n2 < NOTA_APROBACION) or desaprobo_1c
    if tipo == 'FEBRERO':
        intensif_dic = _intensif_por_tipo(hermanas, 'DICIEMBRE')
        return intensif_dic is not None and intensif_dic.estado == 'DESAPROBADA'
    return False


def _msg_intensif_no_habilitada(instancia):
    tipo = _tipo_intensif(instancia.periodo)
    mensajes = {
        '1C': 'No se puede cargar la Intensificación del Primer Cuatrimestre: el estudiante no desaprobó el Primer Cuatrimestre.',
        'DICIEMBRE': 'No se puede cargar la Intensificación de Diciembre: no desaprobó el Segundo Cuatrimestre ni la Intensificación del Primer Cuatrimestre.',
        'FEBRERO': 'No se puede cargar la Intensificación de Febrero: no desaprobó la Intensificación de Diciembre.',
    }
    return mensajes.get(tipo, 'La instancia de intensificación no está habilitada.')


def _pasar_a_previa(historial):
    """Convierte la materia en PREVIA / ADEUDADA reutilizando el mecanismo
    existente (`get_or_create` con curso de origen real, sin duplicar).
    Nota (corrección post-cierre, documentada en HISTORIAL §8): se invoca
    `_notificar_previa` sin depender de la bandera `created` de `get_or_create`;
    el reproceso de una materia ya en previa re-intenta la notificación (oculta
    por dedup de contenido). Queda registrado como issue aparte (no se modifica
    aquí hasta decidir el comportamiento deseado)."""
    MateriaAdeudada.objects.get_or_create(
        id_alumno=historial.id_alumno,
        id_materia=historial.id_materia,
        id_curso_origen=historial.id_curso,
        defaults={
            'tipo_deuda': 'PREVIA',
            'estado': 'ADEUDADA',
            'fecha_generacion': timezone.now(),
        },
    )
    HistorialAcademico.objects.filter(pk=historial.pk).update(
        estado_materia='adeudada',
        periodo_aprobacion='febrero_marzo',
        es_recursada=False,
    )
    _notificar_previa(historial.id_alumno, historial.id_materia)


def _notificar_previa(alumno, materia):
    """E10 — Materia pasa a Previa.

    Notifica al estudiante y a su familia cuando la materia pasa a PREVIA /
    ADEUDADA tras una instancia de febrero desaprobada. Se emite únicamente
    ante la transición real (reutilizando `_pasar_a_previa`); la
    deduplicación por contenido evita repetidos ante reprocesamientos.
    """
    nombre = materia.nombre_materia if materia else 'la materia'
    titulo = 'Materia en condición de previa'
    mensaje = f'La materia {nombre} quedó en condición de PREVIA y deberá rendirse en próximas instancias.'
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje, nav={
        'destino': 'previas',
        'params': {
            'materiaId': materia.id_materia if materia else None,
        }
    })


def _resolver_o_crear_historial(id_alumno, id_curso_materia, anio_lectivo):
    """Obtiene o crea el `HistorialAcademico` de un alumno + curso_materia + año.

    Cuando la intensificación se crea desde la interfaz, el historial del año
    activo puede no existir todavía (se genera al cerrar el ciclo). Para poder
    persistir la intensificación, el backend recrea el historial on demand con
    los mismos campos que usa el módulo académico. Nunca duplica existentes.
    """
    cm = CursoMateria.objects.select_related('id_curso', 'id_materia').get(
        pk=id_curso_materia,
    )
    historial, _ = HistorialAcademico.objects.get_or_create(
        id_alumno_id=id_alumno,
        id_curso_materia_id=id_curso_materia,
        anio_lectivo=anio_lectivo,
        defaults={
            'id_curso': cm.id_curso,
            'id_materia': cm.id_materia,
            'estado_materia': 'adeudada',
        },
    )
    return historial


class IntensificacionAcademicaViewSet(viewsets.ModelViewSet):
    queryset = IntensificacionAcademica.objects.select_related('id_historial', 'id_historial__id_alumno', 'id_historial__id_materia').all()
    serializer_class = IntensificacionAcademicaSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAmbitoDocente]

    def _procesar(self, instancia, nota):
        """Aplica las reglas académicas: valida habilitación, deriva el estado
        por la nota mínima central y, si Febrero quedó desaprobado, pasa a previa."""
        nota = float(nota)
        if not _intensif_habilitada(instancia):
            return _msg_intensif_no_habilitada(instancia)
        resultado = 'APROBADA' if nota >= NOTA_APROBACION else 'DESAPROBADA'
        if resultado == 'DESAPROBADA' and _tipo_intensif(instancia.periodo) == 'FEBRERO':
            _pasar_a_previa(instancia.id_historial)
        return resultado

    def create(self, request, *args, **kwargs):
        # El frontend puede enviar el id_historial, o (más común en el año
        # activo, que aún no tiene historial generado) los identificadores con
        # los que el backend lo resuelve/crea on demand.
        data = request.data.copy()
        if not data.get('id_historial') and data.get('id_alumno') and data.get('id_curso_materia'):
            historial = _resolver_o_crear_historial(
                data['id_alumno'],
                data['id_curso_materia'],
                data.get('anio_rendicion') or timezone.now().year,
            )
            data['id_historial'] = historial.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('fecha_registro') is None:
            serializer.validated_data['fecha_registro'] = timezone.now()
        instancia = serializer.save()
        if 'nota' in serializer.validated_data and serializer.validated_data.get('nota') is not None:
            resultado = self._procesar(instancia, serializer.validated_data['nota'])
            if resultado not in ('APROBADA', 'DESAPROBADA'):
                # No habilitada: revertir el registro recién creado.
                instancia.delete()
                return Response({'error': resultado}, status=status.HTTP_400_BAD_REQUEST)
            instancia.estado = resultado
            instancia.save(update_fields=['estado'])
            _notificar_intensificacion(instancia)
        return Response(IntensificacionAcademicaSerializer(instancia).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Backend como autoridad: rechaza cargar una instancia que no está
        habilitada según las condiciones académicas; deriva el estado con la
        nota mínima central y aplica el paso a previa cuando corresponde."""
        parcial = kwargs.pop('partial', request.method == 'PATCH')
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=parcial)
        serializer.is_valid(raise_exception=True)

        if 'nota' in serializer.validated_data and serializer.validated_data.get('nota') is not None:
            resultado = self._procesar(instance, serializer.validated_data['nota'])
            if resultado not in ('APROBADA', 'DESAPROBADA'):
                return Response({'error': resultado}, status=status.HTTP_400_BAD_REQUEST)
            serializer.validated_data['estado'] = resultado

        self.perform_update(serializer)
        if 'nota' in serializer.validated_data and serializer.validated_data.get('nota') is not None:
            _notificar_intensificacion(serializer.instance)
        return Response(serializer.data)


class MateriaAdeudadaViewSet(viewsets.ModelViewSet):
    queryset = MateriaAdeudada.objects.select_related('id_alumno', 'id_materia', 'id_curso_origen', 'id_curso_actual').all()
    serializer_class = MateriaAdeudadaSerializer
    permission_classes = [IsAuthenticated, PuedeGestionarAmbitoDocente]

    def get_queryset(self):
        qs = super().get_queryset()
        permitidos = alumnos_permitidos(self.request)
        if permitidos is not None:
            qs = qs.filter(id_alumno__in=permitidos)
        alumno = self.request.query_params.get('alumno')
        tipo = self.request.query_params.get('tipo')
        estado = self.request.query_params.get('estado')
        if alumno:
            qs = qs.filter(id_alumno=alumno)
        if tipo:
            qs = qs.filter(tipo_deuda=tipo)
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    @action(detail=True, methods=['post'], url_path='rendir')
    def rendir(self, request, pk=None):
        ma = self.get_object()
        permitidos = alumnos_permitidos(request)
        if permitidos is not None and not permitidos.filter(pk=ma.id_alumno_id).exists():
            raise PermissionDenied('No tiene permiso para rendir esta materia adeudada.')
        nota = request.data.get('nota')
        periodo = request.data.get('periodo')
        anio = request.data.get('anio_rendicion') or timezone.now().year
        observaciones = request.data.get('observaciones', '')

        if nota is None or not periodo:
            return Response({'error': 'Nota y período son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        if ma.estado == 'APROBADA':
            return Response(
                {'error': 'La previa ya fue aprobada; no se pueden cargar rendiciones posteriores.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        periodo = str(periodo)
        if periodo not in PERIODO_ORDEN:
            return Response({'error': 'Período de rendición inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # No permitir duplicar una rendición del mismo período + año.
        if RendicionMateriaAdeudada.objects.filter(
            id_materia_adeudada=ma, periodo=periodo, anio_rendicion=anio
        ).exists():
            return Response(
                {'error': f'Ya existe una rendición registrada para {PERIODO_LABELS.get(periodo, periodo)} {anio}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Regla de secuencia: toda instancia anterior (dentro del ciclo) debe
        # tener una rendición registrada antes de habilitar la actual.
        rendidas = set(
            RendicionMateriaAdeudada.objects.filter(id_materia_adeudada=ma)
            .values_list('periodo', flat=True)
        )
        orden_actual = PERIODO_ORDEN[periodo]
        for p, ord_p in PERIODO_ORDEN.items():
            if ord_p < orden_actual and p not in rendidas:
                return Response(
                    {'error': f'Debe registrar primero la instancia {PERIODO_LABELS.get(p, p)}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        nota_num = float(nota)
        resultado = 'APROBADA' if nota_num >= 7 else 'DESAPROBADA'

        rendicion = RendicionMateriaAdeudada.objects.create(
            id_materia_adeudada=ma,
            id_alumno=ma.id_alumno,
            id_docente_id=request.data.get('id_docente'),
            anio_rendicion=anio,
            periodo=periodo,
            nota=nota_num,
            estado=resultado,
            fecha_rendicion=timezone.now(),
            observaciones=observaciones,
            fecha_registro=timezone.now()
        )

        RegistroRendicionPrevia.objects.create(
            id_alumno=ma.id_alumno,
            id_materia_adeudada=ma,
            id_materia=ma.id_materia,
            id_curso_origen=ma.id_curso_origen,
            anio_rendicion=anio,
            periodo=periodo,
            nota=nota_num,
            resultado=resultado,
            id_docente_id=request.data.get('id_docente'),
            observaciones=observaciones,
            fecha_rendicion=timezone.now()
        )

        if resultado == 'APROBADA':
            ma.estado = 'APROBADA'
            ma.fecha_aprobacion = timezone.now()
            ma.save(update_fields=['estado', 'fecha_aprobacion'])

            HistorialAcademico.objects.filter(
                id_alumno=ma.id_alumno,
                id_materia=ma.id_materia,
                id_curso=ma.id_curso_origen
            ).update(
                estado_materia='aprobada',
                periodo_aprobacion='previa',
                anio_aprobacion=anio,
                nota_final=nota_num
            )

        _notificar_rendicion(ma, rendicion)

        return Response(RendicionMateriaAdeudadaSerializer(rendicion).data)


def _notificar_rendicion(ma, rendicion):
    """E11 — Rendición de materia adeudada.

    Notifica al estudiante y a su familia cuando la rendición de una materia
    adeudada queda efectivamente registrada (incluye la instancia, la nota y
    el resultado derivado por las reglas académicas existentes).
    """
    alumno = ma.id_alumno
    nombre = ma.id_materia.nombre_materia if ma.id_materia else 'la materia'
    periodo = PERIODO_DISPLAY.get(rendicion.periodo, rendicion.periodo)
    resultado = 'APROBADA' if rendicion.estado == 'APROBADA' else 'DESAPROBADA'
    titulo = 'Rendición de materia adeudada'
    mensaje = (
        f'Se registró la rendición de {nombre} ({periodo} {rendicion.anio_rendicion}). '
        f'Nota: {rendicion.nota} — Resultado: {resultado}.'
    )
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje, nav={
        'destino': 'rendiciones',
        'params': {
            'materiaId': ma.id_materia.id_materia if ma.id_materia else None,
            'materiaAdeudadaId': ma.id_materia_adeudada,
            'rendicionId': rendicion.id_rendicion,
        }
    })


def _notificar_intensificacion(instancia):
    """E12 — Intensificación (carga/resultado).

    Notifica al estudiante y a su familia cuando una instancia de
    intensificación (marzo, julio, agosto, diciembre 1/2, febrero) queda con
    un resultado derivado por las reglas académicas existentes. La
    deduplicación por contenido evita repetidos ante guardados repetidos.
    """
    alumno = instancia.id_historial.id_alumno
    materia = instancia.id_historial.id_materia
    nombre = materia.nombre_materia if materia else 'la materia'
    periodo = PERIODO_DISPLAY.get(instancia.periodo, instancia.periodo)
    resultado = 'APROBADA' if instancia.estado == 'APROBADA' else 'DESAPROBADA'
    titulo = 'Intensificación'
    mensaje = (
        f'Se registró el resultado de la intensificación de {nombre} '
        f'({periodo} {instancia.anio_rendicion}). Nota: {instancia.nota} — Resultado: {resultado}.'
    )
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje)


class ActividadMateriaAdeudadaViewSet(viewsets.ModelViewSet):
    queryset = ActividadMateriaAdeudada.objects.select_related('id_curso_materia__id_materia', 'id_curso_materia__id_curso', 'id_docente').all()
    serializer_class = ActividadMateriaAdeudadaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        doc = docente_del_usuario(self.request)
        if es_rol_amplio(self.request):
            pass
        elif doc:
            qs = qs.filter(id_docente=doc)
        else:
            qs = qs.none()
        tipo = self.request.query_params.get('tipo')
        curso_materia = self.request.query_params.get('curso_materia')
        if tipo:
            qs = qs.filter(tipo=tipo)
        if curso_materia:
            qs = qs.filter(id_curso_materia=curso_materia)
        return qs

    def _es_dueno_o_amplio(self, instancia):
        if es_rol_amplio(self.request):
            return True
        doc = docente_del_usuario(self.request)
        return bool(doc and instancia.id_docente_id == doc.id_docente)

    def perform_create(self, serializer):
        doc = docente_del_usuario(self.request)
        if not es_rol_amplio(self.request) and not doc:
            raise PermissionDenied('No tiene permiso para crear actividades.')
        cm_id = self.request.data.get('id_curso_materia')
        if doc and not es_rol_amplio(self.request):
            if not CursoMateria.objects.filter(id_curso_materia=cm_id, id_docente=doc).exists():
                raise PermissionDenied('No puede crear actividades para materias que no tiene asignadas.')
            serializer.save(id_docente=doc)
        else:
            serializer.save()

    def perform_update(self, serializer):
        if not self._es_dueno_o_amplio(self.get_object()):
            raise PermissionDenied('No puede modificar actividades de otro docente.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self._es_dueno_o_amplio(instance):
            raise PermissionDenied('No puede eliminar actividades de otro docente.')
        marcar_eliminado(instance)

    def _obtener_para_escritura(self, pk):
        from django.http import Http404
        try:
            instancia = ActividadMateriaAdeudada.all_objects.filter(pk=pk).first()
        except (ValueError, TypeError):
            raise Http404
        if instancia is None:
            raise Http404
        if not self._es_dueno_o_amplio(instancia):
            raise PermissionDenied('No puede modificar actividades de otro docente.')
        return instancia

    def update(self, request, *args, **kwargs):
        instancia = self._obtener_para_escritura(kwargs['pk'])
        serializer = self.get_serializer(instancia, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instancia = self._obtener_para_escritura(kwargs['pk'])
        serializer = self.get_serializer(instancia, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instancia = self._obtener_para_escritura(kwargs['pk'])
        self.perform_destroy(instancia)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RendicionMateriaAdeudadaViewSet(viewsets.ModelViewSet):
    queryset = RendicionMateriaAdeudada.objects.all()
    serializer_class = RendicionMateriaAdeudadaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class HistorialCursoAlumnoViewSet(viewsets.ModelViewSet):
    queryset = HistorialCursoAlumno.objects.select_related('id_alumno', 'id_curso').all()
    serializer_class = HistorialCursoAlumnoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class BloqueoHorarioAlumnoViewSet(viewsets.ModelViewSet):
    queryset = BloqueoHorarioAlumno.objects.select_related('id_alumno', 'id_materia_bloqueada', 'id_materia_prioritaria').all()
    serializer_class = BloqueoHorarioAlumnoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        permitidos = alumnos_permitidos(self.request)
        if permitidos is not None:
            qs = qs.filter(id_alumno__in=permitidos)
        return qs

    def perform_create(self, serializer):
        super().perform_create(serializer)
        _notificar_bloqueo_horario(serializer.instance, accion='creado')

    def perform_update(self, serializer):
        estado_anterior = serializer.instance.estado
        super().perform_update(serializer)
        if estado_anterior and not serializer.instance.estado:
            _notificar_bloqueo_horario(serializer.instance, accion='desactivado')


class PromocionAlumnoViewSet(viewsets.ModelViewSet):
    queryset = PromocionAlumno.objects.select_related('id_alumno', 'curso_origen', 'curso_destino').all()
    serializer_class = PromocionAlumnoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class RecursadaMateriaViewSet(viewsets.ModelViewSet):
    queryset = RecursadaMateria.objects.select_related('id_alumno', 'id_materia', 'id_curso_origen', 'id_curso_recursada').all()
    serializer_class = RecursadaMateriaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        permitidos = alumnos_permitidos(self.request)
        if permitidos is not None:
            qs = qs.filter(id_alumno__in=permitidos)
        return qs

    def perform_create(self, serializer):
        super().perform_create(serializer)
        _notificar_recursada(serializer.instance, 'cargada')

    def perform_update(self, serializer):
        instancia = serializer.instance
        estado_anterior = instancia.estado
        super().perform_update(serializer)
        estado_nuevo = serializer.instance.estado
        if estado_nuevo != estado_anterior and estado_nuevo in ('APROBADA', 'DESAPROBADA'):
            _notificar_recursada(serializer.instance, 'resultado')


def _notificar_recursada(recursada, accion):
    """E18 — Recursada (carga / resultado).

    Notifica al estudiante y a su familia cuando se carga una recursada
    (accion='cargada') y cuando su estado pasa a APROBADA o DESAPROBADA
    (accion='resultado'), ambos derivados por las reglas académicas existentes.
    """
    alumno = recursada.id_alumno
    nombre = recursada.id_materia.nombre_materia if recursada.id_materia else 'la materia'
    if accion == 'resultado':
        titulo = 'Resultado de recursada'
        resultado = 'APROBADA' if recursada.estado == 'APROBADA' else 'DESAPROBADA'
        mensaje = f'La materia {nombre} quedó {resultado} en la recursada.'
        nav_destino = 'recursadas'
        params = {
            'recursadaId': recursada.id_recursada,
        }
    else:
        titulo = 'Recursada cargada'
        mensaje = f'Se registró la recursada de la materia {nombre}.'
        nav_destino = 'recursadas'
        params = {
            'recursadaId': recursada.id_recursada,
        }
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje, nav={
        'destino': nav_destino,
        'params': params
    })


def _usuarios_directivos():
    """Obtiene los usuarios con roles de Director o Admin para notificaciones
    de revisión/presentación (E8, E9)."""
    roles_directivos = ['admin', 'director']
    usuarios = Usuario.objects.filter(estado=True)
    usuarios_ids = []
    for u in usuarios:
        roles = get_roles_for_usuario(u.usuario)
        if any(r in roles_directivos for r in roles):
            usuarios_ids.append(u)
    return usuarios_ids


def _notificar_adelanto_aprobado(adelanto):
    """E15 — Adelanto de horas aprobado.

    Notifica al docente que recibirá el adelanto cuando un usuario autorizado
    (preceptor, director, admin) crea el adelanto, y además a los estudiantes
    de la materia/curso afectado y a sus familias (corrección posterior).

    El estado por defecto es activo (estado=True), por lo que la creación
    equivale a la aprobación.
    """
    materia = adelanto.id_materia.nombre_materia if adelanto.id_materia else 'la materia'
    curso = adelanto.id_curso.nombre_curso if adelanto.id_curso else 'el curso'
    titulo_doc = 'Adelanto de horas aprobado'
    mensaje_doc = (
        f'Se aprobó un adelanto de horas para la materia {materia} '
        f'({curso}) el {adelanto.fecha_adelanto} '
        f'de {adelanto.hora_inicio} a {adelanto.hora_fin}.'
    )
    nav = {
        'destino': 'adelantos',
        'params': {
            'adelantoId': adelanto.id_adelanto,
        }
    }

    # Notificación profesional al docente
    docente = adelanto.id_docente
    if docente and getattr(docente, 'id_usuario_id', None):
        notificar(id_usuario=docente.id_usuario, id_alumno=None,
                  titulo=titulo_doc, mensaje=mensaje_doc, nav=nav)

    # Estudiantes de la materia/curso afectado y sus familias
    if adelanto.id_curso_id is None:
        return
    alumnos = Alumno.objects.filter(
        estado=True, id_curso_id=adelanto.id_curso_id,
    ).select_related('id_tutor')
    titulo_al = titulo_doc
    for alumno in alumnos:
        mensaje_al = (
            f'La materia {materia} ({curso}) adelantará sus horas el '
            f'{adelanto.fecha_adelanto} de {adelanto.hora_inicio} '
            f'a {adelanto.hora_fin}.'
        )
        notificar_alumno(
            alumno=alumno,
            titulo=titulo_al,
            mensaje=mensaje_al,
            dedupe=True,
            strategy='CONTENT',
            nav=nav,
        )


def _notificar_suplencia_asignada(suplencia):
    """E17 — Suplencia asignada.

    Notifica al docente suplente cuando se crea una suplencia activa para una
    materia, y además a los estudiantes de ese curso y a sus familias
    (corrección posterior). La creación con estado=True equivale a la
    asignación efectiva.
    """
    cm = suplencia.id_curso_materia
    materia = cm.id_materia.nombre_materia if cm and cm.id_materia else 'la materia'
    curso = cm.id_curso.nombre_curso if cm and cm.id_curso else 'el curso'
    nav = {
        'destino': 'suplencias',
        'params': {
            'suplenciaId': suplencia.id_suplencia,
        }
    }

    # Notificación profesional al docente suplente
    suplente = suplencia.id_docente_suplente
    if suplente and getattr(suplente, 'id_usuario_id', None):
        titulo_doc = 'Suplencia asignada'
        mensaje_doc = (
            f'Se te ha asignado una suplencia para {materia} ({curso}) '
            f'desde {suplencia.fecha_inicio} hasta {suplencia.fecha_fin}.'
        )
        notificar(id_usuario=suplente.id_usuario, id_alumno=None,
                  titulo=titulo_doc, mensaje=mensaje_doc, nav=nav)

    # Estudiantes del curso afectado y sus familias
    if cm is None or cm.id_curso_id is None:
        return
    alumnos = Alumno.objects.filter(
        estado=True, id_curso_id=cm.id_curso_id,
    ).select_related('id_tutor')
    titulo_al = 'Suplencia asignada'
    for alumno in alumnos:
        mensaje_al = (
            f'La materia {materia} ({curso}) será dictada por un docente '
            f'suplente desde {suplencia.fecha_inicio} hasta {suplencia.fecha_fin}.'
        )
        notificar_alumno(
            alumno=alumno,
            titulo=titulo_al,
            mensaje=mensaje_al,
            dedupe=True,
            strategy='CONTENT',
            nav=nav,
        )


def _notificar_planificacion_para_revision(planificacion, accion='creada'):
    """E8 — Planificación pendiente de revisión.

    Notifica a los directivos (Admin/Director) cuando un docente crea o
    actualiza una planificación (estado 'Borrador'). La revisión formal queda
    pendiente de decisión (Parte 7); aquí se avisa que hay contenido nuevo
    para revisar.
    """
    usuarios = _usuarios_directivos()
    if not usuarios:
        return
    cm = planificacion.id_curso_materia
    if not cm:
        return
    materia = cm.id_materia.nombre_materia if cm.id_materia else 'la materia'
    curso = cm.id_curso.nombre_curso if cm.id_curso else 'el curso'
    docente = planificacion.id_docente
    docente_nombre = f"{docente.nombre} {docente.apellido}" if docente else 'un docente'
    if accion == 'actualizada':
        titulo = 'Planificación actualizada'
        verbo = 'actualizó'
    else:
        titulo = 'Planificación para revisión'
        verbo = 'creó'
    mensaje = (
        f'El docente {docente_nombre} {verbo} la planificación de '
        f'{materia} ({curso}). Pendiente de revisión.'
    )
    for u in usuarios:
        notificar(id_usuario=u, id_alumno=None, titulo=titulo, mensaje=mensaje, nav={
            'destino': 'planificaciones',
            'params': {
                'planificacionId': planificacion.id_planificacion,
            }
        })


def _notificar_ddjj_presentada(ddjj):
    """E9 — DDJJ presentada.

    Notifica a los directivos (Admin/Director) cuando un docente presenta
    su Declaración Jurada.
    """
    usuarios = _usuarios_directivos()
    if not usuarios:
        return
    docente = ddjj.id_docente
    docente_nombre = f"{docente.nombre} {docente.apellido}" if docente else 'un docente'
    titulo = 'DDJJ presentada'
    mensaje = f'El docente {docente_nombre} ha presentado su Declaración Jurada.'
    for u in usuarios:
        notificar(id_usuario=u, id_alumno=None, titulo=titulo, mensaje=mensaje, nav={
            'destino': 'ddjj',
            'params': {
                'ddjjId': ddjj.id_ddjj,
            }
        })


# ============================================================
# Parte 6 — Administración, actas y eventos institucionales
# ============================================================

TIPOS_ACTA_CONDUCTA = {'Apercibimiento', 'Conducta', 'Amonestación', 'Sanción'}

def _es_tipo_acta_conducta(acta):
    """Verifica si un acta es de tipo conducta/apercibimiento."""
    if not acta or not acta.id_tipo_acta:
        return False
    return acta.id_tipo_acta.nombre_tipo in TIPOS_ACTA_CONDUCTA


def _notificar_acta_conducta(acta_alumno):
    """E4 — Conducta/apercibimientos.

    Notifica al estudiante y a su familia cuando se asocia un acta de tipo
    conducta/apercibimiento a un alumno (creación de ActaAlumno).
    """
    acta = acta_alumno.id_acta
    if not _es_tipo_acta_conducta(acta):
        return
    alumno = acta_alumno.id_alumno
    tipo = acta.id_tipo_acta.nombre_tipo if acta.id_tipo_acta else 'acta'
    titulo = f'Acta de {tipo}'
    mensaje = (
        f'Se ha registrado un acta de {tipo} a tu nombre: '
        f'{acta.titulo or acta.descripcion or "sin detalles"}.'
    )
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje, nav={
        'destino': 'actas',
        'params': {
            'actaId': acta.id_acta,
        }
    })


def _notificar_usuario_estado(usuario, estado_anterior):
    """E14 — Usuario habilitado/deshabilitado.

    Notifica al usuario cuando su estado (habilitado/deshabilitado) cambia.
    """
    if not getattr(usuario, 'pk', None):
        return
    if estado_anterior is None or estado_anterior == usuario.estado:
        return
    if usuario.estado:
        titulo = 'Cuenta habilitada'
        mensaje = 'Tu cuenta de usuario ha sido habilitada. Ya puedes acceder al sistema.'
    else:
        titulo = 'Cuenta deshabilitada'
        mensaje = 'Tu cuenta de usuario ha sido deshabilitada. Contacta a la administración para más información.'
    notificar(id_usuario=usuario, id_alumno=None, titulo=titulo, mensaje=mensaje, nav={
        'destino': 'perfil',
        'params': {}
    })


def _notificar_evento_institucional(evento):
    """E16 — Evento institucional.

    Notifica a todas las personas afectadas por el evento según su alcance real
    (`todo_dia`/`manana`/`tarde`/`franja`), que alcanza a toda la institución:
    - estudiantes y sus familias;
    - Docentes;
    - Preceptores (incluye Jefe de Preceptores);
    - Directivos y Admin.

    El mensaje informa la FECHA en que ocurre el evento, no la fecha de
    creación de la notificación.
    """
    fecha_str = evento.fecha.strftime('%d/%m/%Y')
    titulo = evento.get_tipo_evento_display()
    frase = {
        'Suspension': 'Se suspenden las clases',
        'Feriado': 'Feriado',
        'Jornada Institucional': 'Jornada Institucional',
        'Otro': titulo,
    }.get(evento.tipo_evento, titulo)
    desc = f' {evento.descripcion}' if evento.descripcion else ''
    mensaje = f'{frase} el {fecha_str}{desc}'

    nav = {
        'destino': 'eventos',
        'params': {
            'eventoId': evento.id_evento,
        }
    }

    def _emitir(usuario, id_alumno=None):
        duplicado = Notificacion.objects.filter(
            id_usuario=usuario,
            id_alumno=id_alumno,
            titulo=titulo,
            mensaje=mensaje,
        ).exists()
        if duplicado:
            return
        notificar(
            id_usuario=usuario,
            id_alumno=id_alumno,
            titulo=titulo,
            mensaje=mensaje,
            nav=nav,
        )

    # Estudiantes y sus familias
    for alumno in Alumno.objects.filter(estado=True).select_related('id_tutor'):
        for usuario in _usuarios_destinatarios_de_alumno(alumno):
            _emitir(usuario, id_alumno=alumno)

    # Docentes con cuenta
    for docente in Docente.objects.exclude(id_usuario=None).select_related('id_usuario'):
        _emitir(docente.id_usuario)

    # Preceptores con cuenta (preceptor y jefe de preceptores)
    for preceptor in Preceptor.objects.exclude(id_usuario=None).select_related('id_usuario'):
        _emitir(preceptor.id_usuario)

    # Directivos y Admin
    for usuario in _usuarios_directivos():
        _emitir(usuario)


def _notificar_bloqueo_horario(bloqueo, accion='creado'):
    """E19 — Bloqueo/modificación de horario del estudiante.

    Notifica al estudiante y a su familia cuando se crea un bloqueo
    (accion='creado') o cuando se desactiva (accion='desactivado').
    """
    alumno = bloqueo.id_alumno
    materia_bloq = bloqueo.id_materia_bloqueada
    materia_prio = bloqueo.id_materia_prioritaria
    if accion == 'creado' and not bloqueo.estado:
        return
    if accion == 'desactivado':
        titulo = 'Bloqueo de horario levantado'
        mensaje = (
            f'Se ha levantado el bloqueo de la materia '
            f'{materia_bloq.nombre_materia if materia_bloq else "desconocida"} '
            f'(conflicto con {materia_prio.nombre_materia if materia_prio else "materia recursada"} resuelto).'
        )
    else:
        titulo = 'Bloqueo de horario por superposición'
        mensaje = (
            f'La materia {materia_bloq.nombre_materia if materia_bloq else "desconocida"} '
            f'ha sido bloqueada por superposición de horario con la recursada de '
            f'{materia_prio.nombre_materia if materia_prio else "materia recursada"}.'
)
    notificar_alumno(alumno=alumno, titulo=titulo, mensaje=mensaje, nav={
        'destino': 'horarios',
        'params': {
            'materiaBloqueadaId': materia_bloq.id_materia if materia_bloq else None,
            'materiaPrioritariaId': materia_prio.id_materia if materia_prio else None,
            'bloqueoId': bloqueo.id_bloqueo,
        }
    })


class RecursadaCalificacionViewSet(viewsets.ModelViewSet):
    queryset = RecursadaCalificacion.objects.all()
    serializer_class = RecursadaCalificacionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class BloqueoMateriaRecursadaViewSet(viewsets.ModelViewSet):
    queryset = BloqueoMateriaRecursada.objects.all()
    serializer_class = BloqueoMateriaRecursadaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class RegistroRendicionPreviaViewSet(viewsets.ModelViewSet):
    queryset = RegistroRendicionPrevia.objects.all()
    serializer_class = RegistroRendicionPreviaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class ResultadoActividadAdeudadaViewSet(viewsets.ModelViewSet):
    queryset = ResultadoActividadAdeudada.objects.all()
    serializer_class = ResultadoActividadAdeudadaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]


class SituacionMateriaAlumnoViewSet(viewsets.ModelViewSet):
    queryset = SituacionMateriaAlumno.objects.select_related('id_alumno', 'id_curso_materia').all()
    serializer_class = SituacionMateriaAlumnoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        permitidos = alumnos_permitidos(self.request)
        if permitidos is not None:
            qs = qs.filter(id_alumno__in=permitidos)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cierre_ciclo_api_view(request):
    from escuela.academico import procesar_cierre_ciclo
    username = request.user.username
    roles = get_roles_for_usuario(username)
    if 'admin' not in roles and 'director' not in roles:
        return Response({'error': 'Solo administradores o directores pueden ejecutar el cierre de ciclo.'}, status=status.HTTP_403_FORBIDDEN)
    anio = request.data.get('anio_lectivo') or timezone.now().year
    procesar_cierre_ciclo(int(anio))
    return Response({'status': 'Cierre de ciclo ejecutado correctamente', 'anio': anio})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def boletin_academico_api_view(request, alumno_id):
    alumno = Alumno.objects.filter(pk=alumno_id).select_related('id_curso').first()
    if not alumno:
        return Response({'error': 'Alumno no encontrado.'}, status=404)

    permitidos = alumnos_permitidos(request)
    if permitidos is not None and not permitidos.filter(pk=alumno_id).exists():
        return Response({'error': 'No tiene permiso para consultar este boletín.'}, status=403)

    from django.db.models import Q

    curso_actual = alumno.id_curso
    nombre_curso_actual = curso_actual.nombre_curso if curso_actual else ''

    # Constante central (etiquetas de instancias de rendición). El orden
    # canonico es la constante `PERIODO_ORDEN` importada a nivel de módulo.
    PERIODO_LABEL = PERIODO_LABELS

    # --- Intensificación 1° cuatrimestre (columna de la tabla principal) ---
    intensificaciones_1c = {}
    if curso_actual:
        acts_1c = ActividadMateriaAdeudada.objects.filter(
            id_curso_materia__id_curso=curso_actual, estado=True,
            periodo_intensificacion__icontains='primer cuatrimestre',
        ).select_related('id_curso_materia__id_materia')
        for a in acts_1c:
            materia = a.id_curso_materia.id_materia.nombre_materia if a.id_curso_materia and a.id_curso_materia.id_materia else ''
            if not materia:
                continue
            res = ResultadoActividadAdeudada.objects.filter(id_actividad=a.id_actividad, id_alumno=alumno).first()
            nota = float(res.nota) if (res and res.nota is not None) else None
            intensificaciones_1c[materia] = nota

    # --- Bloqueos por materia (tabla principal) ---
    bloqueos_por_materia = {}
    bloqueos = BloqueoHorarioAlumno.objects.filter(id_alumno=alumno, estado=True).select_related('id_materia_bloqueada')
    for b in bloqueos:
        if b.id_materia_bloqueada:
            bloqueos_por_materia[b.id_materia_bloqueada.nombre_materia] = {
                'bloqueada': True,
                'motivo': b.get_motivo_display() if b.motivo else 'Bloqueada por superposición de horario',
            }

    # --- Intensificaciones posteriores (sección B): diciembre / febrero ---
    intensificaciones_posteriores = []
    if curso_actual:
        acts_post = ActividadMateriaAdeudada.objects.filter(
            id_curso_materia__id_curso=curso_actual, estado=True,
        ).filter(
            Q(periodo_intensificacion__icontains='diciembre') | Q(periodo_intensificacion__icontains='febrero')
        ).select_related('id_curso_materia__id_materia')
        agrup = {}
        for a in acts_post:
            cm = a.id_curso_materia
            if not cm or not cm.id_materia:
                continue
            materia = cm.id_materia.nombre_materia
            if materia not in agrup:
                agrup[materia] = {'materia': materia, 'anio': nombre_curso_actual, 'diciembre': None, 'febrero': None}
            res = ResultadoActividadAdeudada.objects.filter(id_actividad=a.id_actividad, id_alumno=alumno).first()
            nota = float(res.nota) if (res and res.nota is not None) else None
            peri = (a.periodo_intensificacion or '').lower()
            if 'diciembre' in peri:
                agrup[materia]['diciembre'] = nota
            elif 'febrero' in peri:
                agrup[materia]['febrero'] = nota
        intensificaciones_posteriores = list(agrup.values())

    # --- Materias a recursar (sección C) ---
    # Cada RecursadaMateria tiene sus notas en RecursadaCalificacion
    # (relación id_recursada -> calificaciones). Cada nota se ubica en la
    # columna que corresponde según el periodo declarado de la calificación;
    # la "Calificación final" se calcula igual que en la tabla principal
    # (promedio de las notas de ambos cuatrimestres) en el frontend.
    recursadas = []
    for r in RecursadaMateria.objects.filter(
        id_alumno=alumno, estado='ACTIVA'
    ).select_related('id_materia', 'id_curso_origen').prefetch_related('calificaciones'):
        notas = {'1c': None, '2c': None, 'intensif_1c': None, 'diciembre': None, 'febrero': None}
        for c in r.calificaciones.all():
            if c.nota is None:
                continue
            p = (c.periodo or '').lower()
            if 'diciembre' in p:
                notas['diciembre'] = float(c.nota)
            elif 'febrero' in p:
                notas['febrero'] = float(c.nota)
            elif 'intensificacion' in p and any(k in p for k in ('1', 'primer', '1°', '1º')):
                notas['intensif_1c'] = float(c.nota)
            elif 'cuatrimestre' in p:
                if any(k in p for k in ('1', 'primer', '1°', '1º')):
                    notas['1c'] = float(c.nota)
                elif any(k in p for k in ('2', 'segundo', '2°', '2º')):
                    notas['2c'] = float(c.nota)
        recursadas.append({
            'materia': r.id_materia.nombre_materia if r.id_materia else '',
            'anio': r.id_curso_origen.nombre_curso if r.id_curso_origen else '',
            'estado': 'A recursar',
            'prenota1': None,
            'nota1': notas['1c'],
            'prenota2': None,
            'nota2': notas['2c'],
            'intensificacion_1c': notas['intensif_1c'],
            'diciembre': notas['diciembre'],
            'febrero': notas['febrero'],
            'observaciones': (r.observaciones or '').strip(),
        })

    # --- Previas / adeudadas no resueltas (sección D) ---
    previas = []
    for p in MateriaAdeudada.objects.filter(
        id_alumno=alumno, tipo_deuda='PREVIA', estado='ADEUDADA'
    ).select_related('id_materia', 'id_curso_origen'):
        regs = list(RegistroRendicionPrevia.objects.filter(id_materia_adeudada=p))
        ult = None
        if regs:
            regs.sort(key=lambda x: (x.anio_rendicion, PERIODO_ORDEN.get(x.periodo, 0)), reverse=True)
            ult = regs[0]
        periodo = PERIODO_LABEL.get(ult.periodo, ult.periodo) if ult else ''
        calif = float(ult.nota) if (ult and ult.nota is not None) else None
        previas.append({
            'materia': p.id_materia.nombre_materia if p.id_materia else '',
            'anio': p.id_curso_origen.nombre_curso if p.id_curso_origen else '',
            'periodo': periodo,
            'calificacion': calif,
        })

    return Response({
        'alumno': {
            'id': alumno.id_alumno,
            'nombre': f"{alumno.apellido}, {alumno.nombre}",
            'dni': alumno.dni,
            'curso': nombre_curso_actual,
        },
        'intensificaciones_1c': intensificaciones_1c,
        'bloqueos_por_materia': bloqueos_por_materia,
        'intensificaciones_posteriores': intensificaciones_posteriores,
        'recursadas': recursadas,
        'previas': previas,
    })



