# PROJECT CONTEXT — MiSecundaria7

> Documento técnico permanente del proyecto.  
> Última actualización: 2026-06-29

---

## Índice

1. [Descripción general del proyecto](#1-descripción-general-del-proyecto)
2. [Base de datos](#2-base-de-datos)
3. [Roles del sistema](#3-roles-del-sistema)
4. [Permisos](#4-permisos)
5. [Horarios](#5-horarios)
6. [Actividades](#6-actividades)
7. [Asistencias](#7-asistencias)
8. [Relaciones importantes](#8-relaciones-importantes)
9. [Componentes reutilizados](#9-componentes-reutilizados)
10. [Decisiones técnicas](#10-decisiones-técnicas)
11. [Convenciones del proyecto](#11-convenciones-del-proyecto)
12. [Archivos importantes](#12-archivos-importantes)
13. [Estado actual del proyecto](#13-estado-actual-del-proyecto)
14. [Historial técnico](#14-historial-técnico)

---

## 1. Descripción general del proyecto

### Objetivo del sistema

Sistema de gestión escolar integral para la Escuela de Educación Secundaria Técnica N° 7.  
Permite administrar alumnos, docentes, preceptores, cursos, horarios, asistencias, calificaciones, actas, comunicados, planificaciones y actividades escolares.  
Cada rol del sistema (admin, director, preceptor, docente, alumno, familia) tiene acceso a un panel específico con los módulos que le corresponden.

### Tecnologías utilizadas

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React 18 + Vite 5 | 18.3.1 / 5.4.x |
| Frontend HTTP | Axios | 1.7.9 |
| Backend | Django 6.x + Django REST Framework | ~6.0 |
| Base de datos | MySQL | 8.x (aprox) |
| Autenticación | JWT (SimpleJWT) | — |
| CSS | Vanilla CSS (sin framework) | — |

### Arquitectura general

```
Cliente (React + Vite)  →  Axios HTTP  →  API REST (Django DRF)  →  MySQL
    :5173                   :8000/api         :3306/sistema_escolar
```

- **Frontend**: Single Page Application (SPA). Sin router de React — el cambio de vistas se maneja con estado local (`seccionActiva` / `view`) en cada Dashboard.
- **Backend**: API REST clásica con ViewSets de DRF, autenticación JWT, autorización por roles.
- **Base de datos**: Esquema existente (`managed = False` en todos los modelos). Django no gestiona migraciones.

### Estructura de carpetas

```
/
├── backend/
│   ├── manage.py
│   ├── proyecto/
│   │   ├── settings.py
│   │   ├── urls.py                  # Raíz: monta /api/ y sirve media
│   │   └── escuela/
│   │       ├── models.py            # 36 modelos, todos managed=False
│   │       ├── serializers.py       # 37 serializers
│   │       ├── views.py             # 33 ViewSets + 3 function views
│   │       ├── urls.py              # Router con todas las rutas
│   │       └── auth_backend.py      # Autenticación contra tabla usuarios
│   └── media/                       # Archivos subidos (DDJJ, actividades, etc.)
│
├── frontend/
│   └── src/
│       ├── App.jsx                  # Mapeo rol → Dashboard
│       ├── main.jsx                 # Entry point, monta AuthProvider
│       ├── context/
│       │   ├── AuthContext.jsx       # Estado de autenticación
│       │   └── DataContext.jsx       # Datos globales (23 llamadas API)
│       ├── services/
│       │   └── api.js               # 63 funciones API + interceptor JWT
│       ├── utils/
│       │   ├── modulos.js           # Config módulos horarios
│       │   ├── orientacion.js       # Cálculo orientación visual
│       │   └── boletin.js           # Lógica de boletines
│       └── components/
│           ├── Login/
│           ├── Administracion/       # admin + director
│           ├── Preceptores/
│           ├── Profesores/           # docente
│           ├── Alumno/
│           ├── Familia/
│           └── Shared/              # Componentes reutilizados
└── PROJECT_CONTEXT.md               # Este archivo
```

---

## 2. Base de datos

Base de datos: `sistema_escolar` (MySQL).  
Todos los modelos tienen `managed = False` — Django refleja un esquema existente.

### Tabla: `usuarios`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_usuario | INT PK | Autoincremental |
| usuario | VARCHAR(50) UNIQUE | Nombre de usuario para login |
| contrasena | VARCHAR(255) | Password hasheado con bcrypt |
| estado | BOOLEAN | TRUE = habilitado, FALSE = deshabilitado |
| fecha_deshabilitacion_programada | DATETIME NULL | Deshabilitación automática futura |
| fecha_habilitacion_programada | DATETIME NULL | Habilitación automática futura |
| ultimo_acceso | DATETIME NULL | Último login |

**Propósito**: Login del sistema. No usa `django.contrib.auth.User` como tabla principal — se usa un modelo custom y un backend de autenticación personalizado (`auth_backend.py`).

### Tabla: `roles`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_rol | INT PK | Autoincremental |
| nombre_rol | VARCHAR(50) UNIQUE | `admin`, `director`, `preceptor`, `docente`, `alumno`, `familia` |

### Tabla: `usuario_roles`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_usuario | INT PK FK → usuarios | Clave primaria compuesta |
| id_rol | INT FK → roles | |

**Propósito**: Asignación de roles. Un usuario puede tener múltiples roles (aunque el sistema usa `roles[0]` como rol principal).

### Tabla: `padres_tutores`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_tutor | INT PK | Autoincremental |
| id_usuario | INT FK → usuarios | Puede ser NULL |
| nombre, apellido | VARCHAR | |
| dni | VARCHAR(20) UNIQUE | |
| telefono, direccion | VARCHAR NULL | |

**Propósito**: Representa a padres, madres o tutores. Vinculados a alumnos via `alumnos.id_tutor`.

### Tabla: `ciclos_lectivos`

| Columna | Tipo |
|---------|------|
| id_ciclo | INT PK |
| anio | INT |
| fecha_inicio, fecha_fin | DATE NULL |
| estado | BOOLEAN |

**Propósito**: Años lectivos. Cada curso pertenece a un ciclo.

### Tabla: `preceptores`

| Columna | Tipo |
|---------|------|
| id_preceptor | INT PK |
| id_usuario | INT FK → usuarios (unique) |
| nombre, apellido, dni, correo, telefono | |

### Tabla: `cursos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_curso | INT PK | |
| id_preceptor | INT FK → preceptores NULL | Preceptor asignado |
| id_ciclo | INT FK → ciclos_lectivos NULL | Ciclo lectivo |
| nombre_curso | VARCHAR(50) | Ej: `"4°1"`, `"1°2"` |
| orientacion | VARCHAR(50) NULL | `"Sociales"` o `"Gestión"` o NULL |

**Nota**: La columna `turno` fue eliminada. El turno se calcula dinámicamente según los horarios (`turno_calculado` en `CursoSerializer`).

### Tabla: `alumnos`

| Columna | Tipo |
|---------|------|
| id_alumno | INT PK |
| id_usuario | INT FK → usuarios (unique, nullable) |
| id_tutor | INT FK → padres_tutores NULL |
| id_curso | INT FK → cursos NULL |
| nombre, apellido, dni, fecha_nacimiento, direccion, telefono, procedencia | |

**Relaciones**: FK a `cursos` (curso actual), FK a `padres_tutores` (tutor/familia).

### Tabla: `docentes`

| Columna | Tipo |
|---------|------|
| id_docente | INT PK |
| id_usuario | INT FK → usuarios (unique, nullable) |
| nombre, apellido, dni, correo, telefono | |

### Tabla: `ddjj_docente`

| Columna | Tipo |
|---------|------|
| id_ddjj | INT PK |
| id_docente | INT FK → docentes (unique) |
| ruta_archivo | VARCHAR(255) |
| fecha_carga | DATETIME |

**Propósito**: Declaración Jurada del docente (archivo PDF subido).

### Tabla: `actividades_docentes`

| Columna | Tipo |
|---------|------|
| id_actividad | INT PK |
| id_docente | INT FK → docentes |
| id_curso_materia | INT FK → curso_materia |
| titulo | VARCHAR(150) |
| descripcion | TEXT NULL |
| ruta_archivo | VARCHAR(255) NULL |
| fecha_creacion | DATETIME |

**Propósito**: Actividades creadas por docentes para una materia específica. Soporta archivos múltiples via tabla `actividad_docente_archivos`.

### Tabla: `actividad_docente_archivos`

| Columna | Tipo |
|---------|------|
| id_archivo | INT PK |
| id_actividad | INT FK → actividades_docentes |
| ruta_archivo | VARCHAR(255) |
| fecha_carga | DATETIME |

**Propósito**: Archivos adjuntos a una actividad (soporte multi-archivo).

### Tabla: `directivos`

| Columna | Tipo |
|---------|------|
| id_directivo | INT PK |
| id_usuario | INT FK → usuarios (unique) |
| nombre, apellido, dni, telefono, cargo | |

### Tabla: `materias`

| Columna | Tipo |
|---------|------|
| id_materia | INT PK |
| nombre_materia | VARCHAR(100) |
| descripcion | TEXT NULL |

**Propósito**: Catálogo de materias (Matemática, Lengua, Historia, etc.).

### Tabla: `curso_materia`

| Columna | Tipo |
|---------|------|
| id_curso_materia | INT PK |
| id_curso | INT FK → cursos |
| id_materia | INT FK → materias |
| id_docente | INT FK → docentes |

**Propósito**: Tabla puente que asigna un docente a una materia en un curso específico. Es la tabla central del sistema — casi todo pasa por acá.

### Tabla: `periodos_evaluacion`

| Columna | Tipo |
|---------|------|
| id_periodo | INT PK |
| nombre_periodo | VARCHAR(100) NULL |
| orden_periodo | INT NULL |

**Propósito**: Períodos de evaluación (Ej: "1er Trimestre", "2do Trimestre").

### Tabla: `calificaciones`

| Columna | Tipo |
|---------|------|
| id_calificacion | INT PK |
| id_alumno | INT FK → alumnos |
| id_curso_materia | INT FK → curso_materia |
| id_docente | INT FK → docentes |
| id_periodo | INT FK → periodos_evaluacion |
| pre_nota | VARCHAR(10) NULL |
| nota_numerica | DECIMAL(4,2) NULL |
| diagnostico | TEXT NULL |
| fecha_carga | DATETIME NULL |

**Propósito**: Notas de alumnos por materia y período. Una calificación por alumno/materia/período.

### Tabla: `estados_asistencia`

| Columna | Tipo |
|---------|------|
| id_estado_asistencia | INT PK |
| nombre_estado | VARCHAR(50) UNIQUE |

**Valores típicos**: `Presente`, `Ausente`, `Tarde`.

### Tabla: `asistencias`

| Columna | Tipo |
|---------|------|
| id_asistencia | INT PK |
| id_alumno | INT FK → alumnos |
| id_curso_materia | INT FK → curso_materia |
| id_usuario | INT FK → usuarios |
| id_estado_asistencia | INT FK → estados_asistencia |
| fecha | DATE |
| hora | TIME |

**Nota**: Las columnas `numero_modulo` y `observacion` fueron eliminadas. Se agregó `hora`.  
La lógica ahora usa la hora del servidor y la tabla `horarios` para validar.

### Tabla: `tipos_acta`

| Columna | Tipo |
|---------|------|
| id_tipo_acta | INT PK |
| nombre_tipo | VARCHAR(50) UNIQUE |

### Tabla: `actas`

| Columna | Tipo |
|---------|------|
| id_acta | INT PK |
| id_usuario_creador | INT FK → usuarios |
| id_tipo_acta | INT FK → tipos_acta |
| titulo, descripcion, fecha, ruta_archivo | |

**Propósito**: Actas (documentos oficiales). Pueden vincularse a alumnos, cursos y/o docentes mediante tablas puente.

### Tabla: `acta_alumno`

`id_acta_alumno` PK, `id_acta` FK → actas, `id_alumno` FK → alumnos

### Tabla: `acta_curso`

`id_acta_curso` PK, `id_acta` FK → actas, `id_curso` FK → cursos

### Tabla: `acta_docente`

`id_acta_docente` PK, `id_acta` FK → actas, `id_docente` FK → docentes

### Tabla: `modulos`

| Columna | Tipo |
|---------|------|
| id_modulo | INT PK |
| nombre | VARCHAR(50) |
| hora_inicio | TIME |
| hora_fin | TIME |

**Propósito**: Franjas horarias institucionales. Ej: `"Módulo 1"` 07:30-08:30, `"Módulo 2"` 08:30-09:30, etc.  
Los horarios referencian a esta tabla via `horarios.id_modulo`.

### Tabla: `horarios`

| Columna | Tipo |
|---------|------|
| id_horario | INT PK |
| id_curso_materia | INT FK → curso_materia |
| dia_semana | VARCHAR(20) | `"Lunes"`, `"Martes"`, etc. |
| aula | VARCHAR(50) NULL |
| id_modulo | INT FK → modulos NULL |

**Propósito**: Horarios regulares de cada materia en cada curso. Un horario = una materia + un día + un módulo.

### Tabla: `horarios_especiales`

| Columna | Tipo |
|---------|------|
| id_horario_especial | INT PK |
| id_curso_materia | INT FK → curso_materia |
| dia_semana | VARCHAR(20) |
| hora_inicio | TIME |
| hora_fin | TIME |
| aula | VARCHAR(50) NULL |

**Propósito**: Horarios de materias que NO usan la estructura de módulos fijos (principalmente Educación Física). Tienen hora de inicio y fin libre.

### Tabla: `inscripciones_materias`

| Columna | Tipo |
|---------|------|
| id_inscripcion | INT PK |
| id_alumno | INT FK → alumnos |
| id_curso_materia | INT FK → curso_materia |
| estado | VARCHAR(50) NULL |
| fecha_inscripcion | DATE NULL |

### Tabla: `planificaciones`

| Columna | Tipo |
|---------|------|
| id_planificacion | INT PK |
| id_docente | INT FK → docentes |
| id_curso_materia | INT FK → curso_materia |
| titulo, descripcion, ruta_archivo, fecha_subida | |

**Propósito**: Planificaciones anuales de los docentes.

### Tabla: `diagnosticos_grupales`

| Columna | Tipo |
|---------|------|
| id_diagnostico_grupal | INT PK |
| id_curso | INT FK → cursos |
| id_docente | INT FK → docentes |
| fecha, descripcion | |

**Propósito**: Diagnósticos grupales escritos por docentes sobre un curso.

### Tabla: `notificaciones`

| Columna | Tipo |
|---------|------|
| id_notificacion | INT PK |
| id_usuario | INT FK → usuarios |
| titulo, mensaje, fecha, leida (BOOLEAN) | |

### Tabla: `tipos_accion`

`id_tipo_accion` PK, `nombre_accion` VARCHAR(50) UNIQUE

### Tabla: `historial_cambios`

| Columna | Tipo |
|---------|------|
| id_historial | INT PK |
| id_usuario, id_tipo_accion (FKs) | |
| tabla_modificada, id_registro | |
| valor_anterior, valor_nuevo | TEXT |
| fecha | DATETIME |

### Tabla: `comunicados`

| Columna | Tipo |
|---------|------|
| id_comunicado | INT PK |
| id_usuario_creador | INT FK → usuarios NULL |
| id_curso | INT FK → cursos NULL |
| id_materia | INT FK → materias NULL |
| titulo, cuerpo, fecha | |

### Tabla: `comunicado_alcance`

| Columna | Tipo |
|---------|------|
| id_alcance | INT PK |
| id_comunicado | INT FK → comunicados |
| id_ciclo | INT FK → ciclos_lectivos NULL |
| curso (INT), division (INT) | Alcance por año/división |
| id_materia | INT FK → materias NULL |

**Propósito**: Define el alcance de un comunicado (general, por ciclo, por año, por división, por materia).

### Tabla: `comunicado_archivo`

`id_comunicado_archivo` PK, `id_comunicado` FK, `ruta_archivo`

---

## 3. Roles del sistema

Seis roles definidos en la tabla `roles`. Un usuario puede tener múltiples roles, pero el sistema usa `roles[0]` como rol principal para determinar el Dashboard.

### Administrador (`admin`)

| Aspecto | Descripción |
|---------|-------------|
| Dashboard | `AdminDashboard` (compartido con director) |
| Sidebar | 10 items (alumnos, docentes, preceptores, administradores, horarios, asistencias, notas, comunicados, info, notificaciones) |
| Permisos | Acceso total a todos los módulos |
| Restricciones | Ninguna |
| Módulos | CRUD completo de alumnos, docentes, preceptores, cursos, horarios, asistencias, calificaciones, actas, comunicados, planificaciones, diagnósticos |

### Director (`director`)

| Aspecto | Descripción |
|---------|-------------|
| Dashboard | `AdminDashboard` (compartido con admin) |
| Sidebar | Mismos items que admin, excepto "Administradores" (visible solo para director) |
| Permisos | Mismos que admin. Puede gestionar usuarios administradores (crear, editar, eliminar admins) |
| Restricciones | Ninguna relevante |

### Preceptor (`preceptor`)

| Aspecto | Descripción |
|---------|-------------|
| Dashboard | `PreceptorDashboard` |
| Sidebar | 8 items: Alumnos, Docentes, Horarios, Asistencias, Notas, Actas, Comunicados, Notificaciones |
| Permisos | CRUD limitado a los cursos que tiene asignados |
| Restricciones | Solo ve alumnos, docentes, horarios, asistencias de sus propios cursos. No puede modificar datos fuera de sus cursos. |

**Lógica de acceso**: Un preceptor está vinculado a cursos via `Curso.id_preceptor`. Todos los ViewSets filtran por `_preceptor_cursos_ids()`.

### Docente (`docente`)

| Aspecto | Descripción |
|---------|-------------|
| Dashboard | `PanelProfesores` |
| Sidebar | 8 items: Mi Perfil, Calificaciones, Info General, Planificaciones, Actividades, Asistencia, Comunicados, Notificaciones |
| Permisos | Solo ve/edita datos de sus propias materias (CursoMateria donde es `id_docente`) |
| Restricciones | Selecciona curso activo + materia activa para trabajar. No puede crear alumnos, horarios, etc. |

**Flujo de trabajo**: Selecciona un curso (de los que tiene asignados) → selecciona una materia → accede a los módulos de calificaciones, actividades, asistencia, planificaciones.

### Alumno (`alumno`)

| Aspecto | Descripción |
|---------|-------------|
| Dashboard | `AlumnoDashboard` |
| Sidebar | 6 items: Calificaciones, Asistencias, Actividades, Horarios, Comunicados, Notificaciones |
| Permisos | Solo lectura |
| Restricciones | Solo ve datos de su propio curso (via `Alumno.id_curso`). No puede crear, modificar ni eliminar nada. |

### Familia (`familia`)

| Aspecto | Descripción |
|---------|-------------|
| Dashboard | `FamiliaDashboard` |
| Sidebar | 8 items: Resumen, Calificaciones, Asistencias, Actas, Horarios, Actividades, Comunicados, Notificaciones |
| Permisos | Solo lectura, sobre los datos de sus hijos (alumnos vinculados via `Alumno.id_tutor = PadreTutor.id_tutor`) |
| Restricciones | Selecciona un hijo de una lista desplegable. Solo ve datos de los cursos de sus hijos. |

---

## 4. Permisos

### Implementación general

El sistema usa **Role-Based Access Control (RBAC)** implementado a nivel de ViewSet en Django REST Framework. No hay permisos a nivel de tabla en la base de datos.

**Flujo de autenticación:**
1. `POST /api/login/` → valida usuario/contraseña contra `usuarios` usando bcrypt
2. Devuelve JWT (access + refresh)
3. Cada request subsiguiente incluye `Authorization: Bearer <token>`
4. DRF verifica el token con SimpleJWT
5. El backend custom (`auth_backend.py`) busca el usuario en la tabla `usuarios` y crea un `django.contrib.auth.User` temporal

**Resolución de roles:**
```python
def get_roles_for_usuario(username):
    usuario = Usuario.objects.get(usuario=username)
    roles = UsuarioRol.objects.filter(id_usuario=usuario).select_related('id_rol')
    return [ur.id_rol.nombre_rol for ur in roles]  # ej: ['admin', 'docente']
```

El frontend usa `user.roles[0]` como rol principal y `user.role` para decidir el Dashboard.

### Filtrado por rol en ViewSets

Cada ViewSet relevante implementa `get_queryset()` para filtrar datos según el rol:

| Helper | ViewSets que lo usan | Lógica |
|--------|---------------------|--------|
| `_preceptor_cursos_ids(request)` | `AlumnoViewSet`, `DocenteViewSet`, `CursoViewSet`, `CursoMateriaViewSet`, `HorarioViewSet`, `HorarioEspecialViewSet` | Returns `set` de `id_curso` donde `Curso.id_preceptor = preceptor_actual` |
| `_alumno_curso(request)` | `CursoViewSet`, `CursoMateriaViewSet`, `HorarioViewSet`, `HorarioEspecialViewSet` | Returns `id_curso` del alumno autenticado |
| `_familia_cursos_ids(request)` | `CursoViewSet`, `CursoMateriaViewSet`, `HorarioViewSet`, `HorarioEspecialViewSet`, `ActividadDocenteViewSet` | Returns `set` de `id_curso` de todos los hijos del tutor |
| `_docente_actual()` | `ActividadDocenteViewSet`, `DdjjDocenteViewSet` | Returns `Docente` vinculado al usuario autenticado |
| `_filter_visible_comunicados(request, qs)` | `ComunicadoViewSet` | Filtra comunicados según alcances + rol del usuario |

### Validación en escritura

Para operaciones de creación/actualización/eliminación:

- **Preceptor**: Métodos `_require_preceptor_course_access(curso_id)` lanzan `PermissionDenied` si el preceptor no tiene acceso al curso. Se llama en `perform_create/update/destroy` de `AlumnoViewSet`, `CursoMateriaViewSet`, `HorarioViewSet`, `HorarioEspecialViewSet`.
- **Docente**: `ActividadDocenteViewSet.validate()` verifica que `id_curso_materia` pertenezca al docente autenticado. `perform_destroy` verifica ownership.
- **Admin/Director**: `PreceptorViewSet._require_admin_or_director()` restringe ciertas operaciones.
- **Asistencia en horario**: `AsistenciaViewSet.create()` valida que la hora del servidor esté dentro del horario de clase antes de permitir guardar.

### Seguridad general

- Todas las validaciones de permisos se hacen en el **backend**, nunca se confía en el frontend.
- Los roles se verifican en cada request via JWT.
- Los ViewSets no exponen datos de otros usuarios gracias al filtrado en `get_queryset()`.

---

## 5. Horarios

### Estructura

El módulo de horarios se compone de tres fuentes de datos:

1. **`modulos`** — Franjas horarias fijas de la institución (07:30-08:30, 08:30-09:30, etc.)
2. **`horarios`** — Asignación de materia+módulo+día para cada curso (horarios regulares)
3. **`horarios_especiales`** — Horarios libres (sin módulo fijo) para materias como Educación Física

### Relaciones

```
Curso → CursoMateria → Horario → Modulos
                     → HorariosEspeciales
```

- Un `Curso` tiene muchos `CursoMateria` (materias con docente asignado)
- Cada `CursoMateria` puede tener múltiples `Horario` (ej: Matemática los Lunes Módulo 1 y Miércoles Módulo 3)
- Cada `Horario` referencia un `Modulos` (define hora_inicio y hora_fin)
- Adicionalmente, un `CursoMateria` puede tener `HorariosEspeciales` con hora propia

### Construcción de la grilla

El componente `VistaHorarios.jsx` (reutilizado en 4 roles) construye la vista así:

1. **`buildTimeSlots()`**: Unifica horarios regulares y especiales. Los horarios regulares obtienen `hora_inicio/fin` desde `Modulos`. Ordena por día y hora. Deduplica (si dos registros tienen mismo día, hora_inicio y materia, se fusionan).
2. **`computeRowspans()`**: Agrupa celdas consecutivas del mismo día con la misma materia en una sola celda vertical (atributo `rowspan`). Útil para materias con módulos dobles (ej: 2 horas seguidas de Lengua).
3. **Renderizado**: Tabla con columnas = Lunes a Viernes, filas = horarios ordenados.
4. **Información por fila**: En la primera fila se muestra el nombre del curso, turno calculado y preceptor.
5. **Nombre del docente**: Debajo del nombre de cada materia aparece el docente (obtenido desde `CursoMateria.id_docente`), en fuente más pequeña (10px), con clase CSS `.docente`.

### Cálculo del turno

El turno se calcula dinámicamente. No existe columna `turno` en la base de datos.

**Regla**: Se cuentan los módulos que inician antes de las 12:00 vs después.
- Mayoría antes de 12:00 → `"Mañana"`
- Mayoría después de 12:00 → `"Tarde"`
- Empate → `""`

Se implementa tanto en backend (`CursoSerializer.get_turno_calculado()`) como en frontend (`VistaHorarios.calcularTurno()`).

### Orientación del curso

La columna `orientacion` en `cursos` almacena `"Sociales"`, `"Gestión"` o NULL.  
Se muestra en la info row del horario: `"4°1 - Sociales"`.  
Si la orientación es NULL/vacía, se muestra solo el nombre del curso (`"1°1"`).

Adicionalmente, existe `utils/orientacion.js` en el frontend que calcula orientaciones de forma visual (para cursos que aún no tienen el valor en DB):
- A partir de 4° año, división 1 = Sociales, divisiones 2/3 = Gestión
- Cursos menores a 4° año no tienen orientación

### Preceptor del curso

El preceptor se almacena en `Curso.id_preceptor`. Se expone via `CursoSerializer` como:
- `preceptor_nombre` → `"Apellido, Nombre"`
- `preceptor_nombre_completo` → `"Nombre Apellido"`

### Docente por materia

El docente se obtiene desde `CursoMateria.id_docente`. Se expone en `HorarioSerializer.get_docente_nombre()` recorriendo `obj.id_curso_materia.id_docente`.

### PDF

La descarga de PDF es **client-side** (sin librería externa):
1. `buildRowsHtml()` genera HTML de tabla con clases CSS
2. `descargarPDF()` envuelve el HTML en un documento completo con `@page { size: landscape; }`
3. Lo escribe en un `<iframe>` oculto y dispara `iframe.contentWindow.print()`
4. El navegador muestra el diálogo de impresión → "Guardar como PDF"

### Educación Física

La materia Educación Física usa `HorariosEspeciales` porque sus horarios no se ajustan a los módulos fijos (pueden tener horarios variables como 08:00-09:30 o 13:00-14:30). Se gestiona en una pestaña separada en `horarios.jsx`.

---

## 6. Actividades

### Propósito

Los docentes pueden crear actividades (tareas, trabajos prácticos) para sus materias. Los alumnos y las familias pueden verlas (solo lectura).

### Estructura de datos

```
ActividadDocente (id_actividad, id_docente, id_curso_materia, titulo, descripcion, fecha_creacion)
    └── ActividadDocenteArchivo (id_archivo, id_actividad, ruta_archivo, fecha_carga) — múltiples por actividad
```

- `ActividadDocente.ruta_archivo` es un campo legacy para un solo archivo
- `ActividadDocenteArchivo` es el sistema actual que soporta **múltiples archivos** por actividad

### Permisos

| Rol | Puede |
|-----|-------|
| Docente | Crear, editar, eliminar actividades propias (de sus materias) |
| Alumno | Visualizar actividades de su curso |
| Familia | Visualizar actividades de los cursos de sus hijos |
| Admin/Director | Visualizar todas |

- La validación de propiedad se hace en `ActividadDocenteViewSet.get_queryset()` y en `perform_create/update/destroy`.

### Subida de archivos

- El ViewSet usa `MultiPartParser` y `FormParser`
- El serializador recibe los archivos via `request.FILES` (claves `'archivos'` y `'archivo'`)
- Cada archivo se guarda en `MEDIA_ROOT/actividades_docentes/` y se crea un registro en `ActividadDocenteArchivo`
- El primer archivo subido se establece como `ruta_archivo` en la actividad (legacy)

### Descarga y vista previa

- Los archivos se sirven desde Django (`/media/...`)
- El frontend clasifica archivos como previsualizables (PDF, PNG, JPG, WEBP, GIF) o no
- Los PDF se muestran en `<iframe>`, las imágenes en `<img>`, otros formatos muestran solo enlace de descarga

### Componentes

- **`PanelActividades.jsx`**: Panel del docente con CRUD completo, modal de creación/edición, modal de vista previa
- **`ActividadesView.jsx`**: Componente compartido (solo lectura) usado por Alumno y Familia. Filtra por materia y muestra actividades en formato de tarjetas.

---

## 7. Asistencias

### Estado actual del módulo

El módulo de Asistencias fue migrado a una nueva estructura.

**Estructura actual de la tabla `asistencias`:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id_asistencia | INT PK | |
| id_alumno | FK → alumnos | |
| id_curso_materia | FK → curso_materia | |
| id_usuario | FK → usuarios | Quien registró |
| id_estado_asistencia | FK → estados_asistencia | Presente/Ausente/Tarde |
| fecha | DATE | Fecha del servidor |
| hora | TIME | Hora del servidor |

**Campos eliminados:** `numero_modulo`, `observacion`

### Lógica de funcionamiento (Docente)

1. El docente selecciona curso y materia en el panel.
2. El frontend llama a `GET /asistencias/server-time/?curso_materia=X`.
3. El backend devuelve:
   - `fecha`, `hora`, `dia_semana` del servidor
   - `horarios_hoy`: lista de `{hora_inicio, hora_fin}` para esa materia hoy
   - `estado`: objeto con `codigo` y `mensaje`
4. El frontend muestra la fecha, hora y día como **solo lectura** (inputs deshabilitados).
5. El backend determina el estado:
   - `sin_clases`: No hay horarios para esta materia hoy → no se muestra la tabla de alumnos
   - `esperando`: La materia tiene clase hoy pero aún no comenzó → se informa el horario de inicio
   - `en_horario`: La hora actual está dentro de un horario de clase → se permite registrar asistencia
   - `terminado`: El horario ya finalizó → se bloquea la carga
6. Cuando está `en_horario`, se muestra la lista de alumnos del curso con un selector de estado (Presente/Ausente/Tarde).
7. Al guardar, el frontend envía solo `id_alumno`, `id_curso_materia`, `id_estado_asistencia`.
8. El backend **ignora** la fecha/hora del cliente y registra la del servidor. También registra `id_usuario` del token JWT.
9. El backend verifica que la hora actual esté dentro del horario permitido. Si no, rechaza con 403.
10. Si ya existe una asistencia para ese alumno+materia+fecha, se actualiza (upsert).

### Componentes por rol

| Rol | Componente | Tipo |
|-----|-----------|------|
| Docente | `PanelAsistencia.jsx` | Registro con validación server-time |
| Preceptor | `Preceptores/asistencias.jsx` | Gestión completa (alumnos + docentes) |
| Admin | `Administracion/asistencias.jsx` | Visualización y filtros |
| Alumno | `AlumnoDashboard.jsx` | Historial (solo lectura) |
| Familia | `Familia/Asistencias.jsx` | Historial de hijos (solo lectura) |

### Estados de asistencia

Definidos en tabla `estados_asistencia`: `Presente`, `Ausente`, `Tarde`.

---

## 8. Relaciones importantes

### Relaciones principales del sistema

```
Usuario (1) ──── (N) UsuarioRol (N) ──── (1) Rol
  │
  ├── (1) Alumno (N) ──── (1) Curso
  │     └── (N) PadreTutor (1)  [via id_tutor]
  │
  ├── (1) Docente (N) ──── (N) CursoMateria
  │
  ├── (1) Preceptor (N) ──── (1) Curso  [via id_preceptor]
  │
  └── (1) Directivo
```

### CursoMateria (tabla central)

```
Curso (1) ──── (N) CursoMateria (N) ──── (1) Materia
                      │
                      └── (1) Docente
```

Todo lo que ocurre académicamente pasa por `CursoMateria`:
- `Horario` (horarios de clase)
- `HorariosEspeciales` (horarios de EF)
- `Calificacion` (notas)
- `Asistencia` (asistencias)
- `ActividadDocente` (actividades)
- `Planificacion` (planificaciones)
- `InscripcionMateria` (inscripciones optativas)

### Alumno → Familia

```
PadreTutor (1) ──── (N) Alumno  [via Alumno.id_tutor]
```

Un tutor puede tener múltiples hijos en la escuela. Cada alumno tiene un solo tutor registrado.

### Horarios

```
CursoMateria (1) ──── (N) Horario (N) ──── (1) Modulos
                └── (N) HorariosEspeciales
```

### Comunicados y alcances

```
Comunicado (1) ──── (N) ComunicadoAlcance
                      ├── CicloLectivo (opcional)
                      ├── curso / division (opcional)
                      └── Materia (opcional)

Comunicado (1) ──── (N) ComunicadoArchivo
```

Los alcances permiten que un comunicado sea visible para combinaciones específicas de ciclo/año/división/materia.

---

## 9. Componentes reutilizados

### `VistaHorarios.jsx`

**Ubicación:** `components/Administracion/VistaHorarios.jsx`  
**Reutilizado en:**
- `Administracion/horarios.jsx` → pestaña "Ver horarios"
- `Alumno/AlumnoDashboard.jsx` → con prop `cursoForzado`
- `Familia/FamiliaDashboard.jsx` → con prop `cursoForzado`
- `Preceptores/PreceptorDashboard.jsx` → como `<Horarios />` (wrapper)

**Mecanismo:** Cuando se pasa la prop `cursoForzado` (ID del curso), el componente oculta el selector de cursos y carga automáticamente ese curso. Cuando no, muestra un dropdown para seleccionar.

### `ActividadesView.jsx`

**Ubicación:** `components/Shared/ActividadesView.jsx`  
**Reutilizado en:**
- `Alumno/AlumnoDashboard.jsx` → con `userRole="alumno"`
- `Familia/FamiliaDashboard.jsx` → con `userRole="familia"` y `selectedChild`

**Mecanismo:** Recibe `userRole` y opcionalmente `selectedChild`. Para alumnos, resuelve el curso automáticamente desde el usuario autenticado. Para familia, usa el hijo seleccionado. Muestra actividades filtradas por materia en formato de tarjetas, solo lectura.

### `ComunicadosView.jsx`

**Ubicación:** `components/Shared/ComunicadosView.jsx`  
**Reutilizado en:** Múltiples dashboards con filtro por `userRole` y `cursoSeleccionado`.

### `DiagnosticosView.jsx`

**Ubicación:** `components/Shared/DiagnosticosView.jsx`  
**Reutilizado en:** Múltiples dashboards.

### SidebarMenu (parámetro de configuración)

Cada rol tiene su propia configuración de menú, pero visualmente se renderizan igual (excepto Alumno cuyo menú está hardcodeado en JSX). Admin/Director comparten el mismo menú pero filtran items con `directorOnly`.

---

## 10. Decisiones técnicas

### ¿Por qué se eliminó `numero_modulo` de `asistencias`?

La columna `numero_modulo` permitía registrar asistencia por módulo específico. La nueva lógica simplifica el registro: una asistencia por alumno+materia+fecha, con la hora del servidor como timestamp. La validación se hace contra la tabla `horarios` en tiempo real, usando el servidor como fuente de verdad. Esto elimina la complejidad de seleccionar módulo y previene registros fuera de horario.

### ¿Por qué Educación Física tiene tabla separada (`horarios_especiales`)?

La mayoría de las materias usan módulos fijos de 1 hora (07:30-08:30, 08:30-09:30, etc.). Educación Física tiene horarios variables y bloques de distinta duración (ej: 08:00-09:30). Una tabla separada con hora_inicio/hora_fin libre permite esta flexibilidad sin modificar la estructura de módulos fijos.

### ¿Por qué `VistaHorarios` es reutilizado?

El componente muestra la grilla horaria en modo solo lectura. Todos los roles (admin, preceptor, alumno, familia) necesitan ver horarios pero de diferentes cursos. En lugar de duplicar el componente, se parametriza con `cursoForzado` (para alumnos/familia que ven un curso fijo) o con selector de cursos (para admin/preceptor que pueden elegir).

### ¿Por qué la seguridad se valida siempre en backend?

El frontend es una SPA que se ejecuta en el navegador del cliente. Cualquier validación del frontend puede ser eludida modificando el código JavaScript o llamando directamente a la API con herramientas como Postman. Por eso todas las verificaciones de permisos se implementan en los ViewSets del backend, y el frontend solo usa esas verificaciones para mejorar la UX (ocultar botones, etc.).

### ¿Por qué los modelos usan `managed = False`?

El proyecto se desarrolló sobre una base de datos existente (sistema_escolar). Django no debe crear, modificar ni eliminar tablas. Todos los cambios de esquema se hacen directamente en MySQL. Django solo refleja la estructura existente. Esto permite que otros sistemas (posiblemente legacy) sigan funcionando contra la misma base de datos.

### ¿Por qué el turno se calcula y no se almacena?

El turno de un curso depende de los horarios asignados, que pueden cambiar entre ciclos lectivos. Almacenar el turno requeriría mantenerlo sincronizado con los horarios. Calcularlo dinámicamente evita inconsistencias.

### ¿Por qué el PDF se genera del lado del cliente?

Evita agregar una dependencia server-side (como WeasyPrint o ReportLab). El navegador tiene capacidad nativa de imprimir/exportar a PDF. La generación es un HTML con estilos print-friendly inyectado en un iframe. Es simple, no requiere procesamiento en el servidor y el resultado es visualmente idéntico a la pantalla.

### ¿Por qué los módulos horarios se definen tanto en backend como frontend?

Los módulos existen en la base de datos (tabla `modulos`) y también se generan en el frontend (`utils/modulos.js`). Esto es porque la grilla horaria se construye en el frontend y necesita conocer los intervalos para el layout visual. El backend los usa para serializar horarios y calcular turnos. Ambas fuentes deben mantenerse sincronizadas (07:30-19:30, módulos de 60 min).

---

## 11. Convenciones del proyecto

### Código

- **No duplicar componentes**: Si un componente puede ser reutilizado, debe ir en `components/Shared/`.
- **Modelos con `managed = False`**: No modificar el esquema de DB desde Django.
- **No crear tablas nuevas**: Salvo que sea estrictamente necesario y aprobado.
- **Comentarios**: No agregar comentarios en el código salvo que sean realmente necesarios para explicar lógica compleja.
- **Clean Code**: Sin embargo no obsesivo — el código debe ser funcional y mantenible.

### Seguridad

- **Permisos siempre en backend**: Nunca confiar en validaciones del frontend.
- **Usar siempre fecha y hora del servidor**: Especialmente en asistencias y cualquier registro con timestamp.
- **Validar autenticación en cada endpoint**: DRF con `IsAuthenticated` por defecto.
- **Filtrar datos por rol en `get_queryset()`**: Cada ViewSet expone solo los datos que el usuario debe ver.

### Base de datos

- **Mantener compatibilidad con la estructura actual**: No asumir cambios en el esquema.
- **Usar `db_column` explícito**: Todos los FKs especifican `db_column` para coincidir con la DB existente.
- **No usar migraciones de Django**: La DB se gestiona externamente.

### Frontend

- **Usar `useData()` para datos globales**: El contexto provee datos normalizados de todas las tablas.
- **Estado local para UI**: Las vistas internas usan `useState` para secciones activas, filtros, etc.
- **Llamadas API directas para operaciones específicas**: No todo pasa por DataContext. Operaciones CRUD usan las funciones de `api.js` directamente.
- **No usar React Router**: La navegación entre vistas se maneja con estado (`seccionActiva`/`view`).

---

## 12. Archivos importantes

### Backend

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `backend/proyecto/escuela/models.py` | 640 | 36 modelos Django, todos `managed=False`, reflejando la DB `sistema_escolar` |
| `backend/proyecto/escuela/serializers.py` | 1455 | 37 serializers, incluyendo lógica de creación de usuarios con roles, cálculo de campos computados (turno, nombre del docente, etc.) |
| `backend/proyecto/escuela/views.py` | 1613 | 33 ViewSets + 3 function views. Toda la lógica de permisos, filtrado por rol, CRUD, y endpoints custom (`server-time`, `alumno-detalle`, `mi-ddjj`, `borrar-archivo`, `marcar-leida`) |
| `backend/proyecto/escuela/urls.py` | 46 | Router de DRF con todos los endpoints registrados |
| `backend/proyecto/escuela/auth_backend.py` | 48 | Backend de autenticación custom contra tabla `usuarios` |
| `backend/proyecto/urls.py` | 14 | URLs raíz: monta `/api/`, sirve media en desarrollo |
| `backend/proyecto/settings.py` | 168 | Config Django: MySQL, JWT, CORS, media files |

### Frontend

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `frontend/src/App.jsx` | 64 | Entry point: mapea rol del usuario al Dashboard correspondiente |
| `frontend/src/context/AuthContext.jsx` | ~80 | Contexto de autenticación: login, logout, refresh de sesión |
| `frontend/src/context/DataContext.jsx` | 660 | Contexto de datos: 23 llamadas API paralelas, normalización masiva, helpers de búsqueda |
| `frontend/src/services/api.js` | 462 | 64 funciones API + interceptor JWT con refresh automático |
| `frontend/src/utils/modulos.js` | 76 | Generación de módulos horarios institucionales (07:30-19:30, 60min) |
| `frontend/src/utils/orientacion.js` | 42 | Cálculo visual de orientación del curso |
| `frontend/src/components/Administracion/VistaHorarios.jsx` | 480 | Componente principal de grilla horaria (reutilizado en 4 roles) |
| `frontend/src/components/Administracion/horarios.jsx` | 595 | Gestión de horarios con 3 pestañas (semanal, EF, vista) |
| `frontend/src/components/Profesores/PanelAsistencia.jsx` | ~200 | Registro de asistencia docente con validación server-time |
| `frontend/src/components/Profesores/PanelActividades.jsx` | ~400 | CRUD de actividades del docente con multi-archivo |
| `frontend/src/components/Shared/ActividadesView.jsx` | ~250 | Vista de actividades (solo lectura) para Alumno y Familia |
| `frontend/src/components/Preceptores/asistencias.jsx` | 696 | Gestión de asistencias del preceptor (alumnos + docentes) |
| `frontend/src/components/Preceptores/PreceptorDashboard.jsx` | ~100 | Dashboard del preceptor con import de Horarios |
| `frontend/src/components/Alumno/AlumnoDashboard.jsx` | 550 | Dashboard del alumno (calificaciones, asistencias, actividades, horarios) |
| `frontend/src/components/Familia/FamiliaDashboard.jsx` | ~200 | Dashboard de familia con selector de hijos |
| `frontend/src/components/Administracion/sidebarMenu.js` | ~15 | Config del menú de admin/director |
| `frontend/src/components/Preceptores/sidebarMenu.js` | ~12 | Config del menú de preceptor |
| `frontend/src/components/Profesores/sidebarMenu.js` | ~12 | Config del menú de docente |

---

## 13. Estado actual del proyecto

### Funcionalidades terminadas

- Sistema de login con JWT y roles
- Dashboard para cada rol (admin, director, preceptor, docente, alumno, familia)
- CRUD de usuarios con asignación de roles
- CRUD de alumnos, docentes, preceptores
- CRUD de cursos, materias, curso-materia
- Gestión de horarios:
  - Horarios regulares (por módulo)
  - Horarios especiales (Educación Física)
  - Vista de grilla con rowspan
  - PDF (client-side)
  - Disponible para Admin, Preceptor, Alumno, Familia
  - Orientación del curso en nombre
  - Nombre del docente por materia
  - Preceptor del curso
  - Turno calculado automáticamente
- Gestión de calificaciones (por período, boletín)
- Gestión de actas (con vínculos a alumnos/cursos/docentes)
- Comunicados con alcances por ciclo/curso/división/materia
- Planificaciones
- Diagnósticos grupales
- Actividades docentes con múltiples archivos adjuntos
- Notificaciones
- Declaración Jurada del docente (DDJJ)
- Módulo de Asistencias con server-time (backend y frontend docente completados)
- Módulo de Asistencias del Alumno — "Asistencia por Materia": endpoint `alumno-detalle` con resolución de módulos, selector de materia y tabla detallada en el dashboard del alumno

### Funcionalidades en progreso

- Módulo de Asistencias para Preceptor: Requiere adaptación a nueva estructura (sin `numero_modulo`). El componente `Preceptores/asistencias.jsx` aún referencia `numero_modulo`.

- Módulo de Asistencias para Admin: El componente `Administracion/asistencias.jsx` aún usa lógica de "general" vs "materia" basada en `numero_modulo`.

- Módulo de Asistencias para Familia: Similar a Alumno, muestra datos de `numero_modulo`. Pendiente de refactor similar al de Alumno.

### Funcionalidades pendientes

- Refactorizar los componentes de Asistencias de Preceptor, Admin y Familia para usar la nueva estructura (sin `numero_modulo`, sin distinción general/materia).
- Verificar y ajustar la vista "Asistencia por Día" del alumno (usa filtro `tipo === 'general'` que ya no existe).

---

## 14. Historial técnico

Todas las modificaciones importantes al sistema deben registrarse aquí con fecha, módulo afectado, archivos modificados y motivo.

### 2026-06-29 — Migración del modelo Asistencia (server-time)

**Módulo afectado:** Asistencias

**Archivos modificados:**
- `backend/proyecto/escuela/models.py` — Eliminados `numero_modulo` y `observacion` del modelo `Asistencia`. Agregado `hora = TimeField()`.
- `backend/proyecto/escuela/serializers.py` — Eliminado campo `tipo` y método `get_tipo()` de `AsistenciaSerializer`.
- `backend/proyecto/escuela/views.py` — Eliminado filtro `modo` de `get_queryset()`. Agregado endpoint `GET /asistencias/server-time/`. Reescribito `create()` para validar horario, usar server date/time, upsert por (alumno, curso_materia, fecha).
- `frontend/src/services/api.js` — Agregada función `getServerTime()`.
- `frontend/src/components/Profesores/PanelAsistencia.jsx` — Reescribito completamente: obtiene server-time al montar, inputs readonly, habilitación condicional según estado del horario.
- `frontend/src/context/DataContext.jsx` — Eliminados `numero_modulo` y `tipo` de la normalización de asistencias. Agregado `hora`.

**Motivo:** La columna `numero_modulo` fue eliminada de la base de datos. Se implementó nueva lógica donde la asistencia se registra con la hora del servidor y se valida contra la tabla `horarios`. El frontend del docente ahora obtiene la hora del servidor y solo permite cargar asistencia durante el horario de clase.

---

### 2026-06-29 — Asistencia por Materia del Alumno (visor detallado)

**Módulo afectado:** Asistencias - Alumno

**Archivos modificados:**
- `backend/proyecto/escuela/views.py` — Agregado endpoint `GET /asistencias/alumno-detalle/` con filtro por alumno autenticado y `curso_materia` opcional, y método `_resolver_modulo()` para determinar módulo/horario comparando `hora` contra `horarios` y `horarios_especiales`. Docente_nombre se devuelve como "Nombre Apellido".
- `frontend/src/services/api.js` — Agregada función `getAsistenciasAlumnoDetalle(cursoMateriaId)`.
- `frontend/src/components/Alumno/AlumnoDashboard.jsx` — Reemplazada sección "Asistencia por Materia": ahora tiene selector de materias desplegable (filtradas del curso del alumno) y tabla con columnas Fecha/Horario/Docente/Estado/Hora. Datos obtenidos del nuevo endpoint. Se eliminó `historialPorMateria` del dashboard.
- `PROJECT_CONTEXT.md` — Actualizado estado y archivos.

**Explicación técnica:**
El endpoint recibe `curso_materia` como query param opcional. Filtra asistencias por `Alumno` (obtenido via `id_usuario` del JWT), resuelve el módulo iterando sobre `Horario` y `HorariosEspeciales` que coincidan en `id_curso_materia` y `dia_semana`, comparando `hora_inicio <= hora < hora_fin`. Devuelve `modulo_info` con `numero` (si es horario regular) o `tipo: 'especial'`. Orden descendente por fecha y hora.

El frontend calcula las materias del alumno filtrando `cursoMateria` por `id_curso === miAlumno.id_curso`, evitando duplicados. Al seleccionar una materia, se dispara la llamada al endpoint.

**Motivo de la decisión:** Eliminar la dependencia de `numero_modulo` (ya eliminado de la BD) y reemplazar la vista obsoleta por una consulta detallada con resolución de horarios server-side, manteniendo la regla de que el alumno solo puede ver sus propias asistencias.
