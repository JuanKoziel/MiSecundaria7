# AUDITORÍA — Base de Datos y Backend

> **Propósito:** Documento de auditoría completo del backend Django y la base de datos MySQL del sistema MiSecundaria 7. Cubre: reverse-engineering de la base de datos con `managed = False`, revisión de lógica de negocio en la capa backend, auditoría de permisos RBAC, y verificación de generación de PDFs con ReportLab.
>
> **Estado:** Análisis de código estático completado. Ejecución de auditoría (fases de testing) pendiente.

---

## ⚠ Reglas Obligatorias Pre-Ejecución

> **Autoridad:** Este documento está estrictamente subordinado a [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md).
> Ningún comando de auditoría ni corrección derivada de este documento se ejecuta sin cumplir previamente con estas directivas:

1. **Clasificación de comandos:**
   - **Comandos de Solo Lectura (Auditoría):** Se pueden ejecutar directamente para recolectar información (`mysqldump --no-data`, `inspectdb`, `diff`, búsquedas con `rg`, `check_admins`, `diagnostic_curso_materia`, `verificar_boletin_mysql`).
   - **Comandos Mutantes (Modificación de datos o código):** Requieren seguir estrictamente el **Flujo CLI Obligatorio (Fases 0 a 6)** de `Modification-Flow&CodebaseRules.md` antes de ejecutarse (`actualizar_estados_usuarios`, `limpiar_eventos_temporales`, cualquier edición de archivo).
2. **Búsqueda Global previa a cambios (Fase 1):** Antes de modificar cualquier modelo, campo, serializer o vista identificada en este análisis, ejecutar `rg --no-heading --line-number -w "${TARGET_FIELD}"` en todo el repositorio.
3. **Validación de idioma español (§3):** Toda corrección en backend debe respetar estrictamente el checklist §3.1 (variables de entorno), §3.2 (esquema BD) y §3.3 (nomenclatura backend).
4. **Excepciones controladas (§3.5 / §7):** Si se requiere una excepción de nomenclatura o arquitectura, debe registrarse formalmente en `DECISIONES.md` antes de aplicarla.
5. **Cadena de Dependencias y Tests (Fases 2 a 6):** Validar dependencias, cross-reference frontend-backend, verificar ausencia de migraciones pendientes y ejecutar tests canónicos (`cd backend && python manage.py test escuela --verbosity=2`) antes y después de cualquier cambio.

| Sección del Documento | Tipo de Operación | Requisito Previo |
|-----------------------|-------------------|------------------|
| §2.1 Exportar/Comparar esquema | Solo Lectura (Read-Only) | Ninguno (seguro para auditar) |
| §2.2 Inspectdb vs modelos | Solo Lectura (Read-Only) | Ninguno (seguro para auditar) |
| §2.3–§6 Revisiones de código | Solo Lectura (Read-Only) | Ninguno |
| §8.1 Comparaciones de esquema | Solo Lectura (Read-Only) | Ninguno |
| §8.2 Búsquedas de código (`rg`) | Solo Lectura (Read-Only) | Ninguno |
| §8.3 Testing backend | Ejecución de verificación | Forma canónica: `cd backend && python manage.py test escuela` |
| §8.4 Management commands de lectura | Solo Lectura | Ninguno (`check_admins`, `diagnostic_curso_materia`, `verificar_boletin_mysql`) |
| §8.4 Management commands mutantes | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** (`actualizar_estados_usuarios`, `limpiar_eventos_temporales`) |
| Correcciones derivadas de hallazgos | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6 + Checklist Español** |

---

## Índice

0. [Reglas Obligatorias Pre-Ejecución](#-reglas-obligatorias-pre-ejecución)
1. [Resumen de Arquitectura](#1-resumen-de-arquitectura)
2. [Fase 1 — Reverse-Engineering de la Base de Datos](#2-fase-1--reverse-engineering-de-la-base-de-datos)
3. [Fase 2 — Auditoría de Lógica de Negocio](#3-fase-2--auditoría-de-lógica-de-negocio)
4. [Fase 3 — Auditoría de Permisos y RBAC](#4-fase-3--auditoría-de-permisos-y-rbac)
5. [Fase 4 — Auditoría de Generación de PDFs](#5-fase-4--auditoría-de-generación-de-pdfs)
6. [Fase 5 — Preocupaciones Adicionales](#6-fase-5--preocupaciones-adicionales)
7. [Checklists Operativos](#7-checklists-operativos)
8. [Comandos CLI de Referencia](#8-comandos-cli-de-referencia)

---

## 1. Resumen de Arquitectura

### 1.1 Estructura del Proyecto

```
MiSecundaria7/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── media/                            # PDFs generados, archivos subidos
│   └── proyecto/
│       ├── settings.py                   # Django 6.0.5, DRF, JWT, MySQL
│       ├── urls.py
│       └── escuela/                      # ÚNICA app Django
│           ├── models.py                 # 55 modelos, 1568 líneas
│           ├── serializers.py            # ~45 serializers, 2357 líneas
│           ├── views.py                  # 52 ViewSets + FBVs, 4436 líneas
│           ├── permissions.py            # 3 clases + helpers, 117 líneas
│           ├── auth_backend.py           # Autenticación custom vs tabla usuarios
│           ├── utils.py                  # Auditoría, borrado lógico, suplencias
│           ├── academico.py              # Cierre de ciclo lectivo
│           ├── middleware.py             # Programación de estados de usuario
│           ├── test_runner.py            # Copia esquema real → test DB
│           └── tests/                    # 13 archivos de test
├── frontend/                             # React 18 SPA (Vite)
│   └── src/utils/boletin.js             # Generación client-side de boletines
└── estructura base de datos/
    └── sistema_escolar.sql              # DDL de referencia (NO autoritativo)
```

### 1.2 Stack Tecnológico

| Componente | Versión | Detalle |
|------------|---------|---------|
| Django | 6.0.5 | Web framework |
| DRF | 3.16.0 | API REST |
| simplejwt | 5.5.0 | Autenticación JWT |
| mysqlclient | 2.2.8 | Driver MySQL |
| ReportLab | 4.4.1 | Generación de PDFs |
| MySQL | 8+ | Base de datos externa |
| React | 18.3.1 | Frontend SPA (Vite) |

### 1.3 Base de Datos

- **Nombre**: `sistema_escolar`
- **Engine**: MySQL 8+ (`utf8mb4`, `utf8mb4_0900_ai_ci`)
- **Gestión**: Externa a Django (`managed = False` en los 55 modelos)
- **Configuración**: Variables de entorno via `python-dotenv` (`backend/.env`)
- **Fuente de verdad**: La BD en ejecución, NO el archivo `sistema_escolar.sql` (regla 1.7 de REGLAS_DESARROLLO.md)

### 1.4 Modelos — Mapa Completo (55 modelos)

| # | Modelo | Tabla | Dominio | Línea |
|---|--------|-------|---------|-------|
| 1 | `Usuario` | `usuarios` | Auth | 29 |
| 2 | `Rol` | `roles` | Auth | 51 |
| 3 | `UsuarioRol` | `usuario_roles` | Auth | 63 |
| 4 | `PadreTutor` | `padres_tutores` | Personas | 78 |
| 5 | `CicloLectivo` | `ciclos_lectivos` | Académico | 105 |
| 6 | `Preceptor` | `preceptores` | Personas | 124 |
| 7 | `Curso` | `cursos` | Académico | 149 |
| 8 | `Alumno` | `alumnos` | Personas | 176 |
| 9 | `Docente` | `docentes` | Personas | 222 |
| 10 | `DdjjDocente` | `ddjj_docente` | Docentes | 240 |
| 11 | `ActividadDocente` | `actividades_docentes` | Docentes | 268 |
| 12 | `ActividadDocenteArchivo` | `actividad_docente_archivos` | Docentes | 285 |
| 13 | `Directivo` | `directivos` | Personas | 310 |
| 14 | `Materia` | `materias` | Académico | 329 |
| 15 | `CursoMateria` | `curso_materia` | Académico | 356 |
| 16 | `SuplenciaDocente` | `suplencias_docentes` | Docentes | 393 |
| 17 | `PeriodoEvaluacion` | `periodos_evaluacion` | Evaluación | 411 |
| 18 | `Calificacion` | `calificaciones` | Evaluación | 440 |
| 19 | `EstadoAsistencia` | `estados_asistencia` | Asistencia | 449 |
| 20 | `AsistenciaDocente` | `asistencias_docentes` | Asistencia | 475 |
| 21 | `Asistencia` | `asistencias` | Asistencia | 502 |
| 22 | `TipoActa` | `tipos_acta` | Documentos | 511 |
| 23 | `Acta` | `actas` | Documentos | 537 |
| 24 | `ActaAlumno` | `acta_alumno` | Documentos | 554 |
| 25 | `ActaCurso` | `acta_curso` | Documentos | 568 |
| 26 | `ActaDocente` | `acta_docente` | Documentos | 582 |
| 27 | `Modulos` | `modulos` | Horarios | 593 |
| 28 | `Horario` | `horarios` | Horarios | 613 |
| 29 | `HorariosEspeciales` | `horarios_especiales` | Horarios | 628 |
| 30 | `InscripcionMateria` | `inscripciones_materias` | Académico | 644 |
| 31 | `Planificacion` | `planificaciones` | Docentes | 671 |
| 32 | `DiagnosticoGrupal` | `diagnosticos_grupales` | Evaluación | 695 |
| 33 | `Notificacion` | `notificaciones` | Admin | 710 |
| 34 | `TipoAccion` | `tipos_accion` | Admin | 719 |
| 35 | `HistorialCambio` | `historial_cambios` | Admin | 742 |
| 36 | `Comunicado` | `comunicados` | Documentos | 769 |
| 37 | `ComunicadoAlcance` | `comunicado_alcance` | Documentos | 791 |
| 38 | `ComunicadoArchivo` | `comunicado_archivo` | Documentos | 804 |
| 39 | `EventoInstitucional` | `eventos_institucionales` | Admin | 849 |
| 40 | `AdelantoHoras` | `adelantos_horas` | Docentes | 895 |
| 41 | `LibroTema` | `libro_temas` | Docentes | 933 |
| 42 | `HistorialAcademico` | `historial_academico` | Evaluación | 1013 |
| 43 | `IntensificacionAcademica` | `intensificaciones_academicas` | Académico | 1055 |
| 44 | `MateriaAdeudada` | `materias_adeudadas` | Académico | 1104 |
| 45 | `ActividadMateriaAdeudada` | `actividades_materias_adeudadas` | Académico | 1150 |
| 46 | `RendicionMateriaAdeudada` | `rendiciones_materias_adeudadas` | Académico | 1191 |
| 47 | `HistorialCursoAlumno` | `historial_cursos_alumno` | Académico | 1226 |
| 48 | `BloqueoHorarioAlumno` | `bloqueos_horarios_alumno` | Académico | 1279 |
| 49 | `PromocionAlumno` | `promociones_alumno` | Académico | 1319 |
| 50 | `RecursadaMateria` | `recursadas_materias` | Académico | 1364 |
| 51 | `RecursadaCalificacion` | `materias_recursadas_calificaciones` | Académico | 1391 |
| 52 | `BloqueoMateriaRecursada` | `bloqueos_materias_recursadas` | Académico | 1422 |
| 53 | `RegistroRendicionPrevia` | `registro_rendiciones_previas` | Académico | 1472 |
| 54 | `ResultadoActividadAdeudada` | `resultados_actividades_adeudadas` | Académico | 1513 |
| 55 | `SituacionMateriaAlumno` | `situaciones_materias_alumno` | Académico | 1558 |

### 1.5 Roles del Sistema

| Role | Perfil de acceso |
|------|-----------------|
| `admin` | CRUD completo, acceso total |
| `director` | CRUD completo (equivalente a admin en permisos de escritura) |
| `jefe_preceptores` | Supervisión de preceptores, historial, adelantos |
| `preceptor` | CRUD propio, alcance por cursos asignados |
| `docente` | Lectura general, escritura limitada a materias asignadas |
| `alumno` | Solo lectura, datos propios |
| `familia` | Solo lectura, datos de hijos vinculados |

---

## 2. Fase 1 — Reverse-Engineering de la Base de Datos

> **Objetivo:** Verificar que las definiciones de modelos Django (`managed = False`) coinciden exactamente con el esquema MySQL en ejecución.

### 2.1 Exportar y comparar esquema vivo

```bash
# Exportar esquema de la BD real (estructura, sin datos)
mysqldump -u root -p --no-data --routines --triggers sistema_escolar > /tmp/live_schema.sql

# Comparar con el DDL de referencia
diff -u "estructura base de datos/sistema_escolar.sql" /tmp/live_schema.sql
```

**Qué buscar en el diff:**

| Criterio | Impacto |
|----------|---------|
| Tablas en BD pero no en modelos Django | Modelo faltante en `models.py` |
| Modelos Django pero no en BD | Modelo obsoleto o error de `db_table` |
| Diferencias en tipos de columna | `IntegerField` vs `BIGINT`, `CharField` vs `VARCHAR(n)` incorrecto |
| Diferencias en `NOT NULL` / `DEFAULT` | `blank=True` incorrecto en Django |
| FK constraint diffs (`ON DELETE`) | `on_delete` en Django no coincide con MySQL |
| Índices faltantes o extras | Rendimiento, unicidad comprometida |
| `auto_increment` diffs | `AutoField` vs `BigAutoField` |

### 2.2 Inspectdb vs. modelos reales

```bash
# Generar lo que Django "ve" desde la BD
python manage.py inspectdb --database default > /tmp/inspected_models.py

# Comparar contra models.py real
diff -u backend/proyecto/escuela/models.py /tmp/inspected_models.py
```

**Checklist por cada modelo:**

- [ ] `db_table` en `Meta` coincide con el nombre real de la tabla MySQL
- [ ] PK es `AutoField` (MySQL `auto_increment`) — verificar en `db_table` SQL
- [ ] Todos los FK usan `db_column='nombre_real'` correcto
- [ ] `max_length` en `CharField` coincide con `VARCHAR(n)` de MySQL
- [ ] `null=True/blank=True` coincide con `DEFAULT NULL` / `NOT NULL` de MySQL
- [ ] `unique=True` coincide con `UNIQUE KEY` en MySQL
- [ ] `unique_together` coincide con restricciones compuestas en MySQL
- [ ] `primary_key=True` en modelos como `UsuarioRol` coincide con PK compuesta MySQL
- [ ] Campos `BooleanField` mapean correctamente a `TINYINT(1)`

### 2.3 Consistencia de Managers custom

```bash
# Verificar modelos con ActivoManager vs PlanificacionManager
grep -n "ActivoManager\|PlanificacionManager\|all_objects" backend/proyecto/escuela/models.py
```

**Regla:**
- `ActivoManager` filtra por `estado=True` — verificar que el campo `estado` existe como `BooleanField` en cada modelo que lo use
- `PlanificacionManager` filtra por `eliminado=False` — verificar que `eliminado` existe solo en `Planificacion`
- Todo modelo con manager custom debe tener `all_objects = models.Manager()` para consultas sin filtro

**Modelos sin manager custom (no tienen filtro de borrado lógico):**
`Usuario`, `Rol`, `UsuarioRol`, `CicloLectivo`, `Curso`, `DdjjDocente`, `Modulos`, `InscripcionMateria`, `PeriodoEvaluacion`, `EstadoAsistencia`, `TipoActa`, `TipoAccion`, `Materia`

### 2.4 Relaciones y restricciones

**Verificar contra el DDL de MySQL:**

| Modelo Django | FK en MySQL | `on_delete` esperado |
|---------------|-------------|---------------------|
| `Alumno.id_usuario` → `Usuario` | `alumnos_ibfk_1` | `SET_NULL` (nullable) |
| `Alumno.id_tutor` → `PadreTutor` | `alumnos_ibfk_2` | `SET_NULL` (nullable) |
| `Alumno.id_curso` → `Curso` | `alumnos_ibfk_3` | `SET_NULL` (nullable) |
| `CursoMateria.id_curso` → `Curso` | FK en MySQL | Verificar `ON DELETE` |
| `CursoMateria.id_materia` → `Materia` | FK en MySQL | Verificar `ON DELETE` |
| `CursoMateria.id_docente` → `Docente` | FK en MySQL | Verificar `ON DELETE` |
| `Calificacion.id_alumno` → `Alumno` | `calificaciones_ibfk_1` | Verificar |
| `Calificacion.id_curso_materia` → `CursoMateria` | `calificaciones_ibfk_2` | Verificar |
| `Calificacion.id_docente` → `Docente` | `calificaciones_ibfk_3` | Verificar |
| `Calificacion.id_periodo` → `PeriodoEvaluacion` | `calificaciones_ibfk_4` | Verificar |
| `HistorialCambio.id_usuario` → `Usuario` | FK en MySQL | Verificar |
| `HistorialCambio.id_tipo_accion` → `TipoAccion` | FK en MySQL | Verificar |

---

## 3. Fase 2 — Auditoría de Lógica de Negocio

> **Objetivo:** Revisar secuencialmente el flujo de datos desde la definición del modelo (`models.py`), a través de la validación (`serializers.py`), hasta la exposición en endpoints (`views.py`).

### 3.1 models.py (55 modelos, 1568 líneas)

**Estructura por dominio:**

| Dominio | Modelos | Líneas |
|---------|---------|--------|
| Auth/Users | `Usuario`, `Rol`, `UsuarioRol` | 29–75 |
| Personas | `PadreTutor`, `Preceptor`, `Alumno`, `Docente`, `Directivo` | 78–330 |
| Estructura Académica | `CicloLectivo`, `Curso`, `Materia`, `CursoMateria`, `Modulos`, `Horario`, `HorariosEspeciales`, `InscripcionMateria` | 105–670 |
| Evaluación | `PeriodoEvaluacion`, `Calificacion`, `HistorialAcademico`, `DiagnosticoGrupal`, `SituacionMateriaAlumno` | 411–1568 |
| Asistencia | `EstadoAsistencia`, `Asistencia`, `AsistenciaDocente` | 449–514 |
| Documentos | `TipoActa`, `Acta`, `ActaAlumno`, `ActaCurso`, `ActaDocente`, `Comunicado`, `ComunicadoAlcance`, `ComunicadoArchivo` | 511–850 |
| Enseñanza | `SuplenciaDocente`, `DdjjDocente`, `ActividadDocente`, `ActividadDocenteArchivo`, `Planificacion`, `LibroTema` | 240–940 |
| Admin/Tracking | `Notificacion`, `TipoAccion`, `HistorialCambio`, `EventoInstitucional` | 710–900 |
| Progresión Académica | `AdelantoHoras`, `IntensificacionAcademica`, `MateriaAdeudada`, `ActividadMateriaAdeudada`, `RendicionMateriaAdeudada`, `HistorialCursoAlumno`, `BloqueoHorarioAlumno`, `PromocionAlumno`, `RecursadaMateria`, `RecursadaCalificacion`, `BloqueoMateriaRecursada`, `RegistroRendicionPrevia`, `ResultadoActividadAdeudada` | 895–1568 |

**Checklist por modelo:**

- [ ] `managed = False` presente en `Meta`
- [ ] `db_table` coincide con nombre MySQL exacto
- [ ] PK es `AutoField` (verificar `auto_increment` en MySQL)
- [ ] FKs usan `db_column` para mapear a columnas reales
- [ ] `on_delete` es consistente con restricciones FK de MySQL
- [ ] `__str__` definido (legibilidad para debugging/admin)
- [ ] Sin `related_name` conflictivos (verificar reverse FK)
- [ ] Borrado lógico consistente: `estado` (boolean) o `eliminado` (boolean) + `fecha_eliminacion` (datetime)

**Observación sobre `Planificacion`:**
- `estado` = Borrador/Publicado (NO es borrado lógico)
- `eliminado` = Borrado lógico
- Esto es correcto pero inusual. `PlanificacionManager` filtra por `eliminado=False`.

### 3.2 serializers.py (45 serializers, 2357 líneas)

**Patrón de auditoría — Para cada serializer:**

```bash
# Listar todos los serializers
grep -n "class \w*Serializer" backend/proyecto/escuela/serializers.py
```

#### 3.2.1 Helpers compartidos

**`_assign_role(usuario, nombre_rol)`** (línea 68):
- Crea `Rol` y `UsuarioRol` con `get_or_create`
- Verificar: ¿se crean roles sin permiso? (current: sí, cualquier creación de usuario puede crear roles)

**`_build_usuario_account(...)`** (línea 77):
- Lógica compartida para crear/enlazar cuentas `Usuario` desde serializers de `Docente`, `Preceptor`, `Alumno`, `PadreTutor`
- Verificar:
  - [ ] `set_password` se llama al crear (hash PBKDF2)
  - [ ] Username uniqueness se respeta
  - [ ] Estado del usuario se sincroniza con el estado de la entidad
  - [ ] No se exponen campos sensibles en la respuesta

#### 3.2.2 Serializers de alta complejidad

| Serializer | Línea | Complejidad | Verificar |
|------------|-------|-------------|-----------|
| `UsuarioSerializer` | ~100 | Alta | Creación directa de usuario + perfil Directivo |
| `DocenteSerializer` | ~200 | Alta | Creación atomica de Docente + Usuario + Rol |
| `PreceptorSerializer` | ~300 | Alta | Creación atomica de Preceptor + Usuario + Rol |
| `AlumnoSerializer` | ~400 | Alta | Creación atomica de Alumno + Usuario + Rol |
| `PadreTutorSerializer` | ~500 | Alta | Creación atomica de PadreTutor + Usuario + Rol |
| `SuplenciaDocenteSerializer` | ~600 | Alta | Validación de overlap de suplencias, reglas de nivel |
| `AdelantoHorasSerializer` | ~700 | Media | Selección de slot horario por módulo |
| `ComunicadoSerializer` | ~800 | Alta | Nested creation de `alcances` (M2M) y `archivos` |
| `CalificacionSerializer` | ~900 | Media | Validación de rango de notas, periodo |

#### 3.2.3 Checklist de validación por serializer

- [ ] Campos escritos explícitamente (no `fields = '__all__'`)
- [ ] Campos read-only marcados (IDs, timestamps, campos computados)
- [ ] `validate_<field>` methods para reglas de negocio
- [ ] `create()`/`update()` no saltan validación
- [ ] No se filtran datos sensibles (contraseñas, tokens, hashes)
- [ ] Transacciones atómicas en creaciones multi-modelo (`@transaction.atomic`)

### 3.3 views.py (52 ViewSets + FBVs, 4436 líneas)

**Estructura de archivos:**

| Sección | Contenido | Líneas |
|---------|-----------|--------|
| Imports y helpers | Funciones auxiliares, context builders | 1–230 |
| Helper functions | `_usuario_context`, `_preceptor_actual`, `_preceptor_cursos_ids`, `_alumno_curso`, `_familia_cursos_ids` | 156–230 |
| Funciones de horarios | `_obtener_bloques_horario`, overlap detection | 239–350 |
| Suplencias | Lógica de reemplazo docente | 350–500 |
| Login/Auth FBVs | `login_view`, `me_view`, `seleccionar_rol` | 689–760 |
| ViewSets CRUD | ~52 ViewSets | 992–4436 |
| Endpoints especiales | `estadisticas_preceptoria`, `supervision_preceptores`, `cierre_ciclo`, `boletin_academico` | 3900–4436 |

**ViewSets de riesgo (requieren auditoría profunda):**

| ViewSets | Línea | Riesgo | Motivo |
|----------|-------|--------|--------|
| `CalificacionViewSet` | 2124 | **CRÍTICO** | CRUD de calificaciones — ¿quién puede crear/modificar? |
| `AsistenciaViewSet` | 2181 | **CRÍTICO** | Registro de asistencia — ¿quién puede registrar? |
| `PlanificacionViewSet` | 3342 | **ALTO** | Generación de PDF + CRUD pedagógico |
| `ActaViewSet` | 3211 | **ALTO** | Documentos oficiales institucionales |
| `UsuarioViewSet` | 992 | **ALTO** | Gestión de usuarios, cambio de contraseña |
| `HistorialCambioViewSet` | 3854 | **ALTO** | Trail de auditoría — acceso restringido |
| `AsistenciaDocenteViewSet` | 2729 | **ALTO** | ViewSet custom (no ModelViewSet) |
| `SuplenciaDocenteViewSet` | 1823 | **ALTO** | Lógica de reemplazo docente |
| `AdelantoHorasViewSet` | 1885 | **MEDIO** | Adelanto de horas con validación de módulos |
| `MateriaAdeudadaViewSet` | 4029 | **MEDIO** | Workflow de materias adeudadas |
| `ComunicadoViewSet` | 3317 | **MEDIO** | Comunicaciones institucionales con archivos |

#### 3.3.1 Patrón de `get_queryset()` por rol

Muchos ViewSets filtran datos dentro de `get_queryset()` según el rol del usuario autenticado. Ejemplo del patrón:

```python
def get_queryset(self):
    qs = super().get_queryset()
    roles = get_roles_for_usuario(username)
    if 'preceptor' in roles:
        cursos_ids = _preceptor_cursos_ids(self.request)
        qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)
    if 'alumno' in roles:
        curso_id = _alumno_curso(self.request)
        qs = qs.filter(id_curso_materia__id_curso=curso_id)
    if 'familia' in roles:
        cursos_ids = _familia_cursos_ids(self.request)
        qs = qs.filter(id_curso_materia__id_curso__in=cursos_ids)
    return qs
```

**Verificar este patrón en:**
- `HorarioEspecialViewSet.get_queryset()` (1975)
- `HorarioViewSet.get_queryset()` (2039)
- `CalificacionViewSet.get_queryset()` (2124)
- `AsistenciaViewSet` — toda la lógica de filtrado
- `CursoViewSet.get_queryset()` (1700)
- `EventoInstitucionalViewSet.get_queryset()` (3079)

#### 3.3.2 `perform_destroy` — Borrado lógico vs físico

```bash
# Verificar que perform_destroy usa marcar_eliminado, no instance.delete()
grep -n "perform_destroy\|marcar_eliminado\|instance.delete\|\.delete()" backend/proyecto/escuela/views.py
```

**Regla:** Todo borrado debe usar `marcar_eliminado()` de `utils.py`, que implementa:
- `estado = False` (entidades con `ActivoManager`)
- `eliminado = True` (solo `Planificacion`)
- `fecha_eliminacion = timezone.now()`

**Excepción conocida:** `HorarioEspecialViewSet.perform_destroy()` (línea 2026) usa `instance.delete()` — borrado físico. Verificar si es intencional.

#### 3.3.3 Function-Based Views

| FBV | Línea | Permiso | Verificar |
|-----|-------|---------|-----------|
| `login_view` | 689 | `AllowAny` | Rate limiting, brute-force protection |
| `me_view` | 728 | `IsAuthenticated` | No filtra datos sensibles |
| `seleccionar_rol` | 742 | `IsAuthenticated` | Valida que el usuario tiene el rol seleccionado |
| `upload_file` | 3903 | `IsAuthenticated` | Validación de tipo/tamaño de archivo |
| `estadisticas_preceptoria` | 3931 | `IsAuthenticated` | Scoping por preceptor |
| `supervision_preceptores` | 3967 | `IsAuthenticated` | Solo jefe_preceptores |
| `cierre_ciclo_api_view` | 4001 | `IsAuthenticated` | Solo admin/director, transacciones atómicas |
| `boletin_academico_api_view` | 4292 | `IsAuthenticated` | Scoping por familia/alumno |

---

## 4. Fase 3 — Auditoría de Permisos y RBAC

> **Objetivo:** Verificar que cada endpoint impone correctamente el control de acceso por rol.

### 4.1 Modelo RBAC actual

**Componentes:**

| Componente | Archivo | Función |
|------------|---------|---------|
| Tabla `roles` | MySQL | Define roles: admin, director, docente, preceptor, jefe_preceptores, alumno, familia |
| Tabla `usuario_roles` | MySQL | Many-to-many: usuarios ↔ roles |
| `UsuarioBackend.authenticate()` | `auth_backend.py:17` | Autentica contra tabla `usuarios`, crea `django.contrib.auth.User` |
| `get_roles_for_usuario()` | `auth_backend.py:41` | Devuelve lista de roles para un username |
| `IsAdminOrDirectorForWrite` | `permissions.py:84` | Lectura: autenticado. Escritura: admin/director |
| `PuedeVerHistorial` | `permissions.py:93` | Admin, director, jefe_preceptores |
| `PuedeGestionarAdelantos` | `permissions.py:102` | Admin, director, jefe_preceptores, preceptor |
| `ROLES_AMPLIOS` | `permissions.py:14` | `{'admin', 'director', 'jefe_preceptores', 'preceptor'}` |
| `alumnos_permitidos()` | `permissions.py:59` | Queryset de alumnos accesibles según rol |
| `alumno_del_usuario()` | `permissions.py:35` | Resuelve Alumno desde request |
| `docente_del_usuario()` | `permissions.py:52` | Resuelve Docente desde request |

### 4.2 Cobertura de `permission_classes` en ViewSets

**Clase global DRF** (`settings.py:181`):
```python
'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated']
```

Esto significa que cualquier ViewSet sin `permission_classes` explícito requiere solo autenticación — **sin restricción de rol**.

#### 4.2.1 ViewSets CON `permission_classes` explícito

| ViewSet | Permission Classes | Cobertura |
|---------|-------------------|-----------|
| `MateriaViewSet` (1762) | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `CursoMateriaViewSet` (1779) | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `SuplenciaDocenteViewSet` (1823) | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `AdelantoHorasViewSet` (1885) | `IsAuthenticated, PuedeGestionarAdelantos` | ✅ Gestión restringida |
| `EventoInstitucionalViewSet` (3079) | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `PeriodoEvaluacionViewSet` (2116) | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `HistorialCambioViewSet` (3854) | `IsAuthenticated, PuedeVerHistorial` | ✅ Solo roles amplios |
| `AsistenciaDocenteViewSet` (2729) | `IsAuthenticated` | ⚠️ Solo autenticación |

#### 4.2.2 ViewSets SOLO con `IsAuthenticated` (sin restricción de rol)

| ViewSet | Línea | Riesgo |
|---------|-------|--------|
| `UsuarioViewSet` | 992 | **CRÍTICO** — CRUD de usuarios sin restricción |
| `AlumnoViewSet` | 1088 | **ALTO** — CRUD de alumnos |
| `DocenteViewSet` | 1155 | **ALTO** — CRUD de docentes |
| `PreceptorViewSet` | 1520 | **ALTO** — CRUD de preceptores |
| `DirectivoViewSet` | 1593 | **ALTO** — CRUD de directivos |
| `PadreTutorViewSet` | 1600 | **ALTO** — CRUD de tutores |
| `CursoViewSet` | 1700 | **ALTO** — CRUD de cursos |
| `AsistenciaViewSet` | 2181 | **ALTO** — CRUD de asistencia |
| `CalificacionViewSet` | 2124 | **CRÍTICO** — CRUD de calificaciones |
| `ComunicadoViewSet` | 3317 | **MEDIO** — Comunicaciones |
| `PlanificacionViewSet` | 3342 | **ALTO** — Generación de PDF |
| `ActaViewSet` | 3211 | **ALTO** — Documentos oficiales |
| `LibroTemaViewSet` | 3515 | **MEDIO** — Libro de temas |
| `DiagnosticoGrupalViewSet` | 3725 | **MEDIO** — Diagnósticos |
| `NotificacionViewSet` | 3830 | **MEDIO** — Notificaciones |

#### 4.2.3 ViewSets SIN `permission_classes` (usan default global: `IsAuthenticated`)

Estos ViewSets no declaran `permission_classes` — dependen del default de DRF:

```
RolViewSet (1083), DdjjDocenteViewSet (1211), ActividadDocenteViewSet (1359),
ModuloViewSet (1963), HorarioEspecialViewSet (1968), HorarioViewSet (2031),
InscripcionMateriaViewSet (2102), EstadoAsistenciaViewSet (2169),
TipoActaViewSet (3174), ActaAlumnoViewSet (3302), ActaCursoViewSet (3307),
ActaDocenteViewSet (3312), ComunicadoArchivoViewSet (3330),
TipoAccionViewSet (3849), HistorialAcademicoViewSet (3998),
IntensificacionAcademicaViewSet (4023), MateriaAdeudadaViewSet (4029),
ActividadMateriaAdeudadaViewSet (4113), RendicionMateriaAdeudadaViewSet (4196),
HistorialCursoAlumnoViewSet (4202), BloqueoHorarioAlumnoViewSet (4208),
PromocionAlumnoViewSet (4221), RecursadaMateriaViewSet (4227),
RecursadaCalificacionViewSet (4240), BloqueoMateriaRecursadaViewSet (4246),
RegistroRendicionPreviaViewSet (4252), ResultadoActividadAdeudadaViewSet (4258),
SituacionMateriaAlumnoViewSet (4264)
```

**Nota:** Algunos de estos implementan filtrado por rol en `get_queryset()`, pero la escritura (POST/PUT/PATCH/DELETE) no está restringida a nivel de permiso.

### 4.3 Gaps de autorización críticos

#### 4.3.1 `CalificacionViewSet` (2124)

- **Permiso:** Solo `IsAuthenticated`
- **Riesgo:** Un `alumno` o `familia` podría enviar `POST /api/calificaciones/` para crear/modificar calificaciones propias o ajenas
- **Verificar:** ¿Hay validación en el serializer o en `perform_create` que restrinja quién puede calificar?

#### 4.3.2 `UsuarioViewSet` (992)

- **Permiso:** Solo `IsAuthenticated`
- **Riesgo:** Un `alumno` podría modificar su propio usuario, cambiar contraseña de otro, o crear usuarios nuevos
- **Verificar:** ¿`UsuarioSerializer` valida quién puede crear/modificar?

#### 4.3.3 `ActaViewSet` (3211)

- **Permiso:** Solo `IsAuthenticated`
- **Riesgo:** Actas son documentos oficiales — cualquier usuario autenticado podría crear/modificar
- **Verificar:** ¿Solo preceptores/jefe_preceptores/admin pueden gestionar actas?

#### 4.3.4 `ComunicadoViewSet` (3317)

- **Permiso:** Solo `IsAuthenticated`
- **Riesgo:** Un `alumno` podría crear comunicados institucionales
- **Verificar:** ¿Quién puede enviar comunicados?

### 4.4 Auditoría de `get_queryset()` vs. `has_permission`

**Problema de patrón:** Muchos ViewSets implementan filtrado de datos en `get_queryset()` pero NO en `has_permission()` (o `permission_classes`). Esto significa:

1. Un `alumno` puede hacer `DELETE /api/horarios/1/` — el ViewSet no lo bloquea a nivel de permiso
2. El `get_queryset()` devuelve solo sus horarios, pero si conoce el ID exacto, podría intentar la operación
3. La protección depende de que `get_object()` use el queryset filtrado

**Verificar en cada ViewSet:** ¿`get_object()` usa el queryset filtrado por rol?

```python
# DRF comportamiento estándar:
# get_object() llama a self.get_queryset().get(pk=pk)
# Si el queryset está filtrado, un ID fuera de alcance lanza 404
# PERO: si hay un segundo QuerySet sin filtro (ej: all_objects), podría haber bypass
```

### 4.5 Matriz de auditoría por rol × endpoint

**Crear tests para validar:**

| Test | Método HTTP | Esperado |
|------|-------------|----------|
| `alumno` → `POST /api/usuarios/` | POST | 403 |
| `alumno` → `DELETE /api/alumnos/1/` | DELETE | 403 |
| `alumno` → `GET /api/calificaciones/?alumno=<own>` | GET | 200 |
| `alumno` → `GET /api/calificaciones/?alumno=<other>` | GET | 403 o vacío |
| `docente` → `POST /api/calificaciones/` (own subject) | POST | 201 |
| `docente` → `POST /api/calificaciones/` (other subject) | POST | 403 |
| `preceptor` → `GET /api/asistencias/` (own courses) | GET | 200 |
| `preceptor` → `GET /api/asistencias/` (other courses) | GET | vacío |
| `familia` → `GET /api/boletin-academico/<child>/` | GET | 200 |
| `familia` → `GET /api/boletin-academico/<other_child>/` | GET | 403 |
| `docente` → `POST /api/actas/` | POST | 403 |
| `preceptor` → `POST /api/actas/` | POST | 201 |
| `alumno` → `DELETE /api/horarios/1/` | DELETE | 403 |
| `alumno` → `GET /api/historial/` | GET | 403 |

---

## 5. Fase 4 — Auditoría de Generación de PDFs

> **Objetivo:** Verificar que toda generación de PDFs institucionales se realiza exclusivamente backend con ReportLab (DECISIONES.md §6).

### 5.1 Generación backend con ReportLab

**Único punto de generación backend:** `PlanificacionViewSet._generar_pdf()`

| Aspecto | Detalle |
|---------|---------|
| **Archivo** | `backend/proyecto/escuela/views.py:3366-3434` |
| **Librería** | ReportLab 4.4.1 |
| **Formato** | A4, SimpleDocTemplate |
| **Contenido** | Título (materia + curso), subtítulo (docente), secciones: Contenido, Objetivos, Salidas, Fundamentación |
| **Salida** | `MEDIA_ROOT/planificaciones/Proyecto_{materia}_{curso}_{anio}.pdf` |
| **Almacenamiento** | URL guardada en `Planificacion.ruta_archivo` (CharField) |
| **Ciclo de vida** | Creado en `create()` (3454), regenerado en `update()` (3500), viejo PDF eliminado antes de regenerar |

**Checks de seguridad y calidad:**

- [ ] **XSS en PDF:** El contenido se inserta vía `Paragraph()` con `replace('\n', '<br/>')`. Verificar que el contenido no contiene HTML malicioso que ReportLab procese.
- [ ] **Sanitización de filename:** `re.sub(r'[\\/*?:"<>|]', '', ...)` — elimina caracteres peligrosos del path.
- [ ] **Creación de directorio:** `os.makedirs(dest_dir, exist_ok=True)` — maneja directorio inexistente.
- [ ] **Concurrencia:** No hay lock de archivo — dos requests simultáneos podrían corromper el PDF. Verificar si esto es un riesgo real.
- [ ] **Errores de disco lleno:** No hay try/except alrededor de `doc.build(elements)`. Un error de disco no controlado podría 500 el endpoint.

### 5.2 Generación frontend (NO ReportLab)

**`boletin.js`** (`frontend/src/utils/boletin.js`):

```javascript
// Línea 1: Generación de boletín escolar en PDF (vía ventana de impresión del navegador).
export function exportarBoletinPDF(boletines, titulo) {
  // Usa window.print() — NO ReportLab, NO backend
}
```

**Componentes que usan esta función:**
- `frontend/src/components/Familia/Calificaciones.jsx:103` — Familia descarga boletín
- `frontend/src/components/Alumno/AlumnoDashboard.jsx:141` — Alumno descarga boletín

**Hallazgo:** El boletín de calificaciones se genera **client-side** usando `window.print()`. Esto contradice DECISIONES.md §6 ("PDFs generados desde Django, no desde React").

### 5.3 Otros archivos PDF relacionados

| Ubicación | Tipo | Generado por ReportLab? |
|-----------|------|------------------------|
| `Planificacion.ruta_archivo` | CharField con path de PDF | ✅ Sí — `_generar_pdf()` |
| `ActividadMateriaAdeudada.archivo_pdf` | CharField con path de PDF | ❓ No se encontró código de generación — ¿upload manual? |
| `DdjjDocente` | FileField para uploads | ❌ Upload manual del docente |
| `Acta.ruta_archivo` | CharField con path de PDF | ❓ No se encontró código de generación — ¿upload manual o generado externamente? |
| Frontend `fa-file-pdf` icons | UI links a PDFs existentes | N/A — solo visualización |

### 5.4 Resumen de cumplimiento de DECISIONES.md §6

| Documento | Generación backend (ReportLab) | Estado |
|-----------|-------------------------------|--------|
| Proyectos pedagógicos (Planificaciones) | ✅ `PlanificacionViewSet._generar_pdf()` | **Cumple** |
| Boletines de calificaciones | ❌ Frontend `window.print()` | **NO cumple** |
| Actas | ❓ No determinado | **Requiere investigación** |
| Actividades materias adeudadas | ❓ No determinado | **Requiere investigación** |
| DDJJ docente | ❌ Upload manual | **No aplica** (upload, no generación) |

---

## 6. Fase 5 — Preocupaciones Adicionales

### 6.1 Seguridad

| Área | Hallazgo | Severidad |
|------|----------|-----------|
| Password storage | PBKDF2 via `make_password`/`check_password` — **correcto** | ✅ OK |
| JWT tokens | 1h access, 7d refresh — razonable | ✅ OK |
| `AllowAny` en login | Correcto — login es endpoint público | ✅ OK |
| Upload validation | `upload_file` (3903) — verificar tipo/tamaño | ⚠️ Revisar |
| CORS | Configurable via env, default `localhost:5173` | ✅ OK (dev) |
| Brute-force login | No hay rate limiting en `login_view` | ⚠️ Riesgo |
| Password en serializers | Verificar que `contrasena` nunca aparece en responses | ⚠️ Revisar |

### 6.2 Integridad de datos

| Área | Hallazgo |
|------|----------|
| Borrado lógico | Consistente: `estado=False` o `eliminado=True` + `fecha_eliminacion` |
| `all_objects` Manager | Verificar presente en todo modelo con `ActivoManager` |
| Trail de auditoría | `HistorialMixin` en ViewSets + `registrar_historial()` en `utils.py` |
| `Planificacion` dual-field | `estado` = Borrador/Publicado, `eliminado` = borrado lógico — correcto pero inusual |

### 6.3 Rendimiento

| Área | Hallazgo |
|------|----------|
| N+1 queries | Verificar `select_related`/`prefetch_related` en ViewSets con FK anidadas |
| `UsuarioEstadoProgramadoMiddleware` | Ejecuta `aplicar_programaciones_usuario()` en **cada request** — verificar que no hace queries innecesarias |
| `get_usuario()` en permissions | Se ejecuta en cada request autenticado para resolver el `Usuario` — posible N+1 si hay muchos permisos |

### 6.4 Consistencia del Test Runner

`EscuelaDiscoverRunner` (`test_runner.py`) copia el esquema de la BD real al test DB:

```python
# Copia estructura (CREATE TABLE) de la BD real al test DB
cur_real.execute(f'SHOW CREATE TABLE `{tabla}`')
cur_test.execute(ddl)
```

**Verificar:**
- Los tests cubren los ViewSets de mayor riesgo
- Los tests validan permisos por rol
- No hay tests que dependan de datos de producción

---

## 7. Checklists Operativos

### 7.1 Checklist de reverse-engineering (Fase 1)

- [ ] `mysqldump --no-data` exportado y comparado con `sistema_escolar.sql`
- [ ] `inspectdb` generado y comparado con `models.py`
- [ ] Todos los 55 modelos verificados: `db_table`, PKs, FKs, tipos, NULLs
- [ ] Managers `ActivoManager`/`PlanificacionManager` verificados
- [ ] `all_objects` presente donde corresponde
- [ ] FK constraints verificadas contra MySQL DDL

### 7.2 Checklist de lógica de negocio (Fase 2)

- [ ] `models.py`: Todos los modelos revisados por dominio
- [ ] `serializers.py`: `_build_usuario_account` revisado (hashing, atomicidad)
- [ ] `serializers.py`: Serializers de alta complejidad revisados
- [ ] `views.py`: ViewSets de riesgo revisados (Calificacion, Asistencia, Acta, etc.)
- [ ] `views.py`: `get_queryset()` patrones de filtrado por rol verificados
- [ ] `views.py`: `perform_destroy` usa `marcar_eliminado` (no `delete()`)
- [ ] `academico.py`: Lógica de cierre de ciclo revisada
- [ ] `utils.py`: `registrar_historial` y `marcar_eliminado` verificados

### 7.3 Checklist de permisos RBAC (Fase 3)

- [ ] Mapa de roles documentado y validado
- [ ] ViewSets con `permission_classes` explícito: lista completa
- [ ] ViewSets SIN permisos personalizados: lista completa con riesgos
- [ ] Gap analysis: ViewSets donde `alumno`/`familia` podrían escribir
- [ ] `get_queryset()` scoping verificado en ViewSets críticos
- [ ] Tests de autorización planificados (matriz rol × endpoint)
- [ ] `perform_destroy` verificado — ¿un alumno puede borrar?

### 7.4 Checklist de PDFs (Fase 4)

- [ ] `_generar_pdf()` de Planificacion verificada (ReportLab)
- [ ] Sanitización de filename verificada
- [ ] Ciclo de vida de PDF (create/update/delete viejo) verificado
- [ ] Boletín: identificado como generación client-side (`window.print()`)
- [ ] Actas: mecanismo de generación determinado
- [ ] Actividades adeudadas: mecanismo de generación determinado

---

## 8. Comandos CLI de Referencia

### 8.1 Schema comparison (Read-Only)

```bash
# Exportar esquema vivo (MySQL live es la autoridad, no el SQL de referencia)
mysqldump -u root -p --no-data sistema_escolar > /tmp/live_schema.sql

# Inspectdb de Django
cd backend && python manage.py inspectdb --database default > /tmp/inspected_models.py

# Comparaciones
diff -u "estructura base de datos/sistema_escolar.sql" /tmp/live_schema.sql
diff -u backend/proyecto/escuela/models.py /tmp/inspected_models.py
```

### 8.2 Code search (Read-Only — Usando `rg`)

```bash
# Modelos con managed = False
rg -c "managed\s*=\s*False" backend/proyecto/escuela/models.py

# Modelos con managed = True (PROHIBIDO)
rg -n "managed\s*=\s*True" backend/proyecto/escuela/models.py

# ViewSets y sus clases de permisos
rg -n "class \w+ViewSet|permission_classes" backend/proyecto/escuela/views.py

# Borrado físico vs lógico
rg -n "\.delete\(\)|marcar_eliminado" backend/proyecto/escuela/views.py

# Uso de ReportLab
rg -n "reportlab|SimpleDocTemplate|Paragraph" backend/proyecto/escuela/views.py

# Generación client-side de PDF
rg -n "window\.print|boletinHTML|exportarBoletinPDF" frontend/src/

# Endpoints registrados
rg -n "router\.register|path\(" backend/proyecto/escuela/urls.py
```

### 8.3 Testing (Forma Canónica — Fase 5)

```bash
# Ejecutar suite completa de tests de la app escuela (canónico)
cd backend && python manage.py test escuela --verbosity=2

# Ejecutar tests de un archivo específico
cd backend && python manage.py test escuela.tests.test_boletin_e2e --verbosity=2

# Ejecutar tests de permisos (si existen)
cd backend && python manage.py test escuela.tests.test_permisos --verbosity=2
```

### 8.4 Django management commands del proyecto

```bash
# === COMANDOS READ-ONLY (Seguros para diagnóstico) ===
cd backend && python manage.py check_admins
cd backend && python manage.py diagnostic_curso_materia
cd backend && python manage.py verificar_boletin_mysql

# === COMANDOS MUTANTES ⚠ (Requieren seguir Fases 0–6 antes de ejecutar) ===
# Modifica estado de usuarios en la base de datos
cd backend && python manage.py actualizar_estados_usuarios

# Elimina registros de eventos en la base de datos
cd backend && python manage.py limpiar_eventos_temporales
```

---

## Resumen de Hallazgos Principales

> ⚠ Estos hallazgos **no se corrigen al detectarlos**. Cada corrección es operación **MUTANTE** y requiere el Flujo Fases 0–6 + checklist español §3.1–§3.3 de [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md) **antes** de editar modelos, serializers, vistas o permisos. `makemigrations` / `migrate` y `managed=True` están **prohibidos** (S-3, S-4).

| # | Hallazgo | Severidad | Fase |
|---|----------|-----------|------|
| 1 | 28 ViewSets sin `permission_classes` explícito — dependen de `IsAuthenticated` default | **CRÍTICO** | 3 | ✅ **RESUELTO 2026-08-24** — Puertas declaradas en `permissions.py` (clases nuevas en español) y cableadas en `views.py`: personas/cursos → `IsAdminOrDirectorForWrite` / `PuedeGestionarPersonas`; actas → `PuedeGestionarActas`; asistencias → `PuedeRegistrarAsistencias`; planificaciones → `PuedeGestionarPlanificaciones`; ámbito docente (DDJJ/libro temas/diagnósticos/materias adeudadas) → `PuedeGestionarAmbitoDocente`; comunicados → `PuedePublicarComunicados`; avanzados sin escritor UI → `IsAdminOrDirectorForWrite`. ReadOnly puros (Rol/TipoActa/EstadoAsistencia/TipoAccion) y `AsistenciaDocenteViewSet` (actions auto-cuidados) quedan como estaban. Tests: `tests/test_permisos.py` (37 casos), suite completa 138 OK. |
| 2 | `CalificacionViewSet` sin restricción de escritura por rol | **CRÍTICO** | 3 | ✅ **RESUELTO 2026-08-24** — `permission_classes = [IsAuthenticated, PuedeEscribirCalificaciones]` ({admin, director, docente}); el alcance fino por `CursoMateria` sigue en `_verificar_docente_activo_materia`. Alumno/familia/preceptor/jefe → 403 en la puerta. |
| 3 | Boletín generado client-side, no backend con ReportLab (viola DECISIONES.md §6) | **ALTO** | 4 |
| 4 | `HorarioEspecialViewSet.perform_destroy` usa `delete()` físico (no `marcar_eliminado`) | **MEDIO** | 2 |
| 5 | No hay rate limiting en `login_view` (brute-force) | **MEDIO** | 5 |
| 6 | Generación de PDF de actas y actividades adeudadas no determinada | **BAJO** | 4 |
| 7 | `UsuarioEstadoProgramadoMiddleware` ejecuta queries en cada request | **BAJO** | 5 |
