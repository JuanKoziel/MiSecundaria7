from datetime import datetime, date

from django.db import models
from django.db.utils import OperationalError, ProgrammingError
from django.utils import timezone

from escuela.models import HistorialCambio, TipoAccion


# ---------- Auditoría / Historial de cambios ----------

ACCION_CREAR = 'Crear'
ACCION_MODIFICAR = 'Modificar'
ACCION_ELIMINAR = 'Eliminar'
ACCION_CAMBIO_CONTRASENA = 'Cambio de contraseña'
ACCION_CAMBIO_ROL = 'Cambio de rol'
ACCION_HABILITAR = 'Habilitar'
ACCION_DESHABILITAR = 'Deshabilitar'

ACCIONES_POR_DEFECTO = [
    ACCION_CREAR,
    ACCION_MODIFICAR,
    ACCION_ELIMINAR,
    ACCION_CAMBIO_CONTRASENA,
    ACCION_CAMBIO_ROL,
    ACCION_HABILITAR,
    ACCION_DESHABILITAR,
]

_CAMPOS_SENSIBLES = {'contrasena', 'password', 'pass', 'hash', 'token'}

_CAMPOS_TECNICOS = {'fecha_eliminacion', 'eliminado'}

_ETIQUETAS_CAMPOS = {
    'usuario': 'Usuario',
    'nombre': 'Nombre',
    'apellido': 'Apellido',
    'dni': 'DNI',
    'correo': 'Correo',
    'telefono': 'Teléfono',
    'direccion': 'Dirección',
    'cargo': 'Cargo',
    'estado': 'Estado',
    'activo': 'Activo',
    'nombre_curso': 'Curso',
    'nombre_materia': 'Materia',
    'anio': 'Año',
    'division': 'División',
    'nombre_estado': 'Estado',
    'nombre_tipo': 'Tipo',
    'nombre_rol': 'Rol',
    'titulo': 'Título',
    'contenido': 'Contenido',
    'descripcion': 'Descripción',
    'fecha': 'Fecha',
    'fecha_creacion': 'Fecha creación',
    'hora_inicio': 'Hora inicio',
    'hora_fin': 'Hora fin',
    'alcance': 'Alcance',
    'permanente': 'Permanente',
    'id_usuario_creador': 'Creado por',
}


def _obtener_tipo_accion(nombre_accion):
    tipo, _ = TipoAccion.objects.get_or_create(nombre_accion=nombre_accion)
    return tipo


def _etiqueta_campo(field):
    nombre = field.name
    if nombre in _ETIQUETAS_CAMPOS:
        return _ETIQUETAS_CAMPOS[nombre]
    if nombre.startswith('id_'):
        return nombre[3:].replace('_', ' ').title()
    return nombre.replace('_', ' ').title()


def _str_relacionado(obj):
    if obj is None:
        return None
    if type(obj).__str__ is not models.Model.__str__:
        return str(obj)
    partes = []
    for f in obj._meta.fields:
        if isinstance(f, (models.CharField, models.TextField)):
            valor = getattr(obj, f.attname, None)
            if valor:
                partes.append(str(valor))
        if len(partes) >= 2:
            break
    if partes:
        return ' - '.join(partes)
    return f'{obj._meta.verbose_name} #{getattr(obj, "pk", "")}'


def resumen_registro(instance):
    """Devuelve un resumen legible de un registro para auditoría.

    Formato: "Campo: valor" en líneas separadas. Las claves foráneas se
    resuelven por JOIN y se muestran con su representación legible.
    """
    if instance is None:
        return None
    lineas = []
    for field in instance._meta.fields:
        nombre = field.name
        if field.primary_key or field.auto_created or nombre in _CAMPOS_SENSIBLES or nombre in _CAMPOS_TECNICOS:
            continue
        try:
            if getattr(field, 'is_relation', False) and field.many_to_one:
                valor = _str_relacionado(getattr(instance, nombre, None))
            else:
                valor = getattr(instance, field.attname, None)
                if isinstance(valor, datetime):
                    valor = valor.strftime('%d/%m/%Y %H:%M')
                elif isinstance(valor, date):
                    valor = valor.strftime('%d/%m/%Y')
                elif isinstance(valor, bool):
                    valor = 'Sí' if valor else 'No'
                elif valor is None:
                    continue
                else:
                    valor = str(valor)
        except models.ObjectDoesNotExist:
            continue
        if valor is None or valor == '':
            continue
        lineas.append(f'{_etiqueta_campo(field)}: {valor}')
    return '\n'.join(lineas) if lineas else str(instance)


def registrar_historial(usuario, accion, tabla, id_registro, valor_anterior=None, valor_nuevo=None):
    """Registra una operación en la tabla existente `historial_cambios`.

    usuario: instancia Usuario autenticado que realizó la acción.
    accion: nombre de acción (se resuelve contra `tipos_accion`).
    tabla: nombre de la tabla/módulo afectado.
    id_registro: id del registro afectado.
    """
    if not usuario or not accion:
        return None
    tipo = _obtener_tipo_accion(accion)
    return HistorialCambio.objects.create(
        id_usuario=usuario,
        id_tipo_accion=tipo,
        tabla_modificada=tabla,
        id_registro=id_registro,
        valor_anterior=valor_anterior,
        valor_nuevo=valor_nuevo,
        fecha=timezone.now(),
    )


def seed_tipos_accion():
    try:
        for nombre in ACCIONES_POR_DEFECTO:
            TipoAccion.objects.get_or_create(nombre_accion=nombre)
    except (OperationalError, ProgrammingError):
        pass


def normalizar_dni(value):
    if not value:
        return value
    digits = ''.join(c for c in str(value) if c.isdigit())
    if not digits:
        return value
    if len(digits) <= 3:
        return digits
    last3 = digits[-3:]
    rest = digits[:-3]
    if len(rest) <= 3:
        return f'{rest}.{last3}'
    next3 = rest[-3:]
    first = rest[:-3]
    return f'{first}.{next3}.{last3}'

def activar_o_crear(model_class, lookup, defaults):
    try:
        existing = model_class.objects.filter(**lookup, activo=False).first()
        if existing:
            for k, v in defaults.items():
                setattr(existing, k, v)
            existing.activo = True
            existing.save()
            return existing, True
    except AttributeError:
        pass
    return model_class.objects.create(**lookup, **defaults, activo=True), False


def _campos_borrado(instance):
    """Devuelve la lista de campos que identifican el borrado lógico."""
    if hasattr(instance, 'eliminado'):
        return ['eliminado', 'fecha_eliminacion']
    return ['estado', 'fecha_eliminacion']


def marcar_eliminado(instance, commit=True):
    """Aplica borrado lógico sobre una instancia de entidad.

    Reglas comunes reutilizadas por todos los CRUD:
      - Planificacion usa `eliminado = True` (su campo `estado` es
        Borrador/Publicado y no se toca).
      - El resto de las entidades usan `estado = False`.
      - `fecha_eliminacion` se setea con la fecha/hora actual si el
        modelo tiene esa columna (por ej. `usuarios` no la tiene).

    Devuelve la instancia con los cambios aplicados.
    """
    if hasattr(instance, 'eliminado'):
        instance.eliminado = True
    else:
        instance.estado = False
    if hasattr(instance, 'fecha_eliminacion'):
        instance.fecha_eliminacion = timezone.now()
    if commit:
        instance.save(update_fields=_campos_borrado(instance))
    return instance
