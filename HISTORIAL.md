# HISTORIAL DE CAMBIOS — Mi Secundaria 7

> **Propósito:** Registro de todas las auditorías, correcciones y decisiones significativas tomadas en el proyecto. Este archivo preserva el trabajo ya realizado para referencia futura.
>
> **Última actualización:** 2026-09-02

---

## 1. Auditorías Realizadas (2026-08-24)

Se ejecutaron 3 auditorías completas del sistema: Backend/BD, Frontend/Estado Global, y UI/Diseño Institucional. A continuación se documentan los hallazgos resueltos y pendientes.

### 1.1 Auditoría Backend y Base de Datos

- **Alcance:** `models.py` (55 modelos), `serializers.py` (~45 serializers), `views.py` (52 ViewSets + FBVs), `permissions.py`, generación de PDFs con ReportLab.
- **Resultado:** 2 hallazgos CRÍTICOS resueltos, 5 pendientes (ALTO/MEDIO/BAJO).

### 1.2 Auditoría Frontend y Estado Global

- **Alcance:** `api.js` (685 líneas, ~90+ funciones), `DataContext.jsx` (716 líneas), navegación por estado en 6 dashboards.
- **Resultado:** 2 hallazgos HIGH resueltos, 1 falso positivo identificado, ~10 pendientes.

### 1.3 Auditoría UI y Diseño Institucional

- **Alcance:** `index.css` (3120 líneas), cumplimiento de design system, extracción de componentes Shared.
- **Resultado:** 2 hallazgos P0 resueltos, ~10 pendientes (P1/P2).

---

## 2. Hallazgos Resueltos

### 2.1 Backend — Resueltos

| # | Hallazgo | Severidad | Solución | Fecha |
|---|----------|-----------|----------|-------|
| 1 | 28 ViewSets sin `permission_classes` explícito — dependían de `IsAuthenticated` default | **CRÍTICO** | Permission classes creadas en `permissions.py` (clases nuevas en español) y cableadas en `views.py`: personas/cursos → `IsAdminOrDirectorForWrite` / `PuedeGestionarPersonas`; actas → `PuedeGestionarActas`; asistencias → `PuedeRegistrarAsistencias`; planificaciones → `PuedeGestionarPlanificaciones`; ámbito docente (DDJJ/libro temas/diagnósticos/materias adeudadas) → `PuedeGestionarAmbitoDocente`; comunicados → `PuedePublicarComunicados`; avanzados sin escritor UI → `IsAdminOrDirectorForWrite`. ReadOnly puros (Rol/TipoActa/EstadoAsistencia/TipoAccion) y `AsistenciaDocenteViewSet` (actions auto-cuidados) quedan como estaban. Tests: `tests/test_permisos.py` (37 casos), suite completa 138 OK. | 2026-08-24 |
| 2 | `CalificacionViewSet` sin restricción de escritura por rol | **CRÍTICO** | `permission_classes = [IsAuthenticated, PuedeEscribirCalificaciones]` ({admin, director, docente}); el alcance fino por `CursoMateria` sigue en `_verificar_docente_activo_materia`. Alumno/familia/preceptor/jefe → 403 en la puerta. | 2026-08-24 |

### 2.2 Frontend — Resueltos

| # | Hallazgo | Severidad | Solución | Fecha |
|---|----------|-----------|----------|-------|
| 1 | `API_BASE` hardcodeado en `api.js` — imposible deployar a staging/production sin cambio de código | **HIGH** | `api.js` ahora usa `import.meta.env.VITE_API_URL` con fallback local (`.env.example` ya documentaba la variable). Quedan 11 constantes `API_BASE/MEDIA_BASE = 'http://localhost:8000'` para URLs de media en componentes — corrección sugerida para próximo lote. | 2026-08-24 |
| 10 | Race condition en refresh de tokens — requests concurrentes con 401 generaban múltiples refresh calls | **HIGH** | Mutex implementado: `refreshEnCurso` comparte la promesa de refresh entre requests concurrentes (`refrescarAccessToken`), todos los 401 esperan el mismo refresh. | 2026-08-24 |
| 21 | Definiciones duplicadas de endpoints (`createActaCurso`, `createActaAlumno`) | **MEDIUM** | **FALSO POSITIVO** — `createActa` (línea 271, endpoint `/actas/`) y `createActaCurso`/`createActaAlumno` (líneas 489/494, endpoints `/acta-curso/`, `/acta-alumno/`) son funciones **distintas** con endpoints distintos; cada nombre se exporta una sola vez en `api.js`. No había duplicados. | 2026-08-24 |

### 2.3 UI — Resueltos

| # | Hallazgo | Severidad | Solución | Fecha |
|---|----------|-----------|----------|-------|
| P0 #1 | Selectores CSS duplicados (`.main-header`, `.card`, `.table-responsive`, `.user-avatar`) — definiciones conflictivas | **P0** | Bloques sombreados eliminados de `index.css` (conservadas `.main-header-subtitle`, `.user-profile-info`; recortada la regla redundante de `.table-responsive` dentro del media query 768px); quedan las definiciones únicas canónicas (sección HEADER/CARDS/TABLAS). Verificado: Vitest 85 OK + `vite build` OK. | 2026-08-24 |
| P0 #3 | `FiltrosAnioCurso` duplicado en `Administracion/` y `Preceptores/` — dos copias con ligeras diferencias | **P0** | Componente unificado en `Shared/FiltrosAnioCurso.jsx` (modo controlado para Preceptores vía `anioLectivo/onAnioChange`; modo autónomo para Administración vía `cursosObj/defaultToFirst`), helpers movidos a `Shared/cursoFilters.js`, imports actualizados en 9 consumidores y originales eliminados (sin leer `user.role`). Verificado: Vitest 85 OK + `vite build` OK. | 2026-08-24 |

---

## 3. Hallazgos Pendientes (No Resueltos)

### 3.1 Backend Pendientes

| # | Hallazgo | Severidad | Notas |
|---|----------|-----------|-------|
| 3 | Boletín generado client-side, no backend con ReportLab (viola la decisión arquitectónica de PDFs desde Django) | **ALTO** | Requiere migración de `frontend/src/utils/boletin.js` a `_generar_pdf()` en `PlanificacionViewSet` |
| 4 | `HorarioEspecialViewSet.perform_destroy` usa `delete()` físico (no `marcar_eliminado`) | **MEDIO** | Falta implementar soft delete |
| 5 | No hay rate limiting en `login_view` (brute-force) | **MEDIO** | Considerar django-ratelimit o similar |
| 6 | Generación de PDF de actas y actividades adeudadas no determinada | **BAJO** | |
| 7 | `UsuarioEstadoProgramadoMiddleware` ejecuta queries en cada request | **BAJO** | Optimizar o cachear |

### 3.2 Frontend Pendientes

| # | Hallazgo | Severidad | Notas |
|---|----------|-----------|-------|
| 3 | Sin request timeout en `axios.create()` — requests pueden colgar indefinidamente | **HIGH** | |
| 4 | DataContext carga 23 endpoints para todos los roles (over-fetching masivo) | **HIGH** | |
| 5 | Errores de endpoints individuales se tragan silenciosamente (usuarios ven estados vacíos sin mensaje) | **HIGH** | |
| 15 | Refresh token expiration no maneja respuesta de error del servidor | **FAIL** | |
| 18 | `logout()` no invalida tokens server-side | **FAIL** | |
| 20 | Funciones agrupadas parcialmente por dominio, sin marcadores claros de sección | **PARTIAL** | |
| 22 | Sin validación de tipos (TypeScript) — errores de runtime silenciosos | **FAIL** | Decisión deliberada: ver DECISIONES §14 |
| 23 | Error handling no centralizado — cada consumidor maneja errores de axios independientemente | **FAIL** | |
| 24 | Sin soporte de request cancellation (`AbortController`) | **FAIL** | |
| 26 | Tokens en `localStorage` (vector XSS) | **WARNING** | `httpOnly` cookies preferidos para refresh tokens |
| Nav 1 | Sin deep linking — usuarios no pueden bookmarkear vistas específicas | **HIGH** | |
| Nav 2 | Back/forward roto — presionar "Back" sale de la app | **HIGH** | |
| Nav 6 | Docente usa `seccionActiva` en lugar de `view` — inconsistencia de patrón | **MEDIUM** | |
| Nav 7 | `PanelProfesores` tiene 10+ condiciones ternarias — lógica de render difficult de mantener | **MEDIUM** | |

### 3.3 UI Pendientes

| # | Hallazgo | Prioridad | Notas |
|---|----------|-----------|-------|
| P0 #2 | Colores hardcodeados → extraer a variables CSS (`--danger`, `--success`, etc.) | **P0** | Pendiente registro en DECISIONES §7 o nombres en español |
| P1 #4 | Extraer `StatCard` a `Shared/StatCard.jsx` | **P1** | 5+ implementaciones inline |
| P1 #5 | Completar auditoría de cumplimiento por componente (matriz §2.3) | **P1** | |
| P1 #6 | Agregar variable `--radius-sm` (8px) y reemplazar `border-radius: 8px` hardcodeado (30+ ocurrencias) | **P1** | |
| P1 #7 | Agregar variables de spacing (`--spacing-sm`, `--spacing-md`, `--spacing-lg`) | **P1** | |
| P2 #8 | Evaluar extracción de `TablaCRUD` | **P2** | |
| P2 #9 | Eliminar todos los `style={{}}` inline que duplican clases CSS existentes | **P2** | |
| P2 #10 | Agregar atributos `aria-*` faltantes en botones icon-only | **P2** | |
| P2 #11 | Análisis de clases CSS huérfanas | **P2** | |

---

## 4. Decisiones Arquitectónicas Registradas

> Las 15 decisiones arquitectónicas originales se documentan en `DOCUMENTACION_TECNICA.md` §14. Este resumen preserva las más relevantes:

| # | Decisión | Resumen |
|---|----------|---------|
| 1 | BD externa con `managed=False` | Django nunca gestiona esquema; la BD MySQL preexistente es la fuente de verdad |
| 3 | Un único DataContext | Fuente centralizada de datos; carga ~26 endpoints en paralelo al autenticarse |
| 4 | Un único api.js | Centraliza todas las llamadas HTTP; interceptor JWT automático |
| 5 | Formularios desplegables inline | No modales; mejor contexto visual y experiencia en móvil |
| 6 | PDFs desde Django + ReportLab | Consistencia, auditoría, control de acceso |
| 7 | Español en todo el código | Nombres, variables, endpoints, strings — todo en español |
| 8 | Diseño visual consistente | Todos los módulos comparten el mismo look & feel |
| 9 | Reutilización antes de crear | Shared/ para componentes multi-rol |
| 10 | Sin innovar en arquitectura | Seguir patrones existentes |
| 11 | Archivos monolíticos por capa | Un solo models.py, serializers.py, views.py |
| 12 | Enrutamiento por estado | No React Router; variable `view` + switch |
| 13 | Sin librerías UI externas | CSS vanilla en index.css |
| 14 | Sin TypeScript | JavaScript puro con JSX |
| 15 | Sin tests automatizados (original) | **Actualizado:** ahora existen tests en `backend/proyecto/escuela/tests/` y Vitest en frontend |

---

## 5. Prompt de Implementación Original

> Preservado como referencia histórica de las instrucciones dadas a la IA implementadora para resolver los hallazgos CRÍTICOS/ALTO/P0.

El prompt original (`Prompt-ResolverAnalisis.md`) instruía a una IA a:

1. **Re-verificar** los hallazgos contra el código actual
2. **Corregir solo** los ítems CRÍTICO / ALTO / P0
3. **No reescribir** arquitectura ni "mejorar" P1/P2
4. **Seguir** el Flujo CLI Obligatorio (Fases 0–6) antes de cada edición
5. **Respetar** el checklist de español (§3.1–§3.4)

### Autoridad de documentos (orden de precedencia)

1. `REGLAS_DESARROLLO.md` — autoridad máxima (Fases 0–6, español, managed=False)
2. `DECISIONES.md` — decisiones arquitectónicas vinculantes
3. Documentación general del proyecto
4. Análisis de auditoría — backlog, no fuente de verdad

### Prohibiciones del prompt

- No `makemigrations` / `migrate` / `managed=True`
- No partir archivos monolíticos
- No React Router, Tailwind, Bootstrap, MUI, TypeScript, Redux
- No commitear `.env`, exponer `SECRET_KEY`, hardcodear credenciales
- No instrumentar loggers de navegación, overlays de debug
- No ejecutar management commands mutantes sin Fases 0–6

---

## 6. Comandos de Referencia Rápidos

```bash
# Tests backend
cd backend && python manage.py test escuela --verbosity=2

# Tests frontend
cd frontend && npx vitest run

# Build frontend
cd frontend && npx vite build

# Management commands read-only
cd backend && python manage.py check_admins
cd backend && python manage.py diagnostic_curso_materia
cd backend && python manage.py verificar_boletin_mysql

# Management commands mutantes (requieren Fases 0–6)
cd backend && python manage.py actualizar_estados_usuarios
cd backend && python manage.py limpiar_eventos_temporales
```

---

## 7. Corrección del flujo de guardado de Intensificaciones (2026-09-02)

### 7.1 Problema

Al intentar guardar una nota de Intensificaciones en `Docente → Calificaciones → Intensificaciones`, la interfaz mostraba incorrectamente **"No hay intensificaciones para guardar"** aunque el usuario hubiera escrito una nota en una columna habilitada.

**Causa raíz (confirmada por inspección solo-lectura de la base real):**

- En la base de producción, `historial_academico` tenía **0 registros**.
- `intensificaciones_academicas` también tenía **0 registros**.
- `IntensificacionAcademica.id_historial` es una FK **NOT NULL**.
- El historial académico del año activo normalmente se genera durante el cierre/consolidación del ciclo (`consolidar_historial_alumno` / `procesar_cierre_ciclo`), por lo que era normal que el año activo aún **no tuviera historial**.
- El frontend dependía de un `id_historial` existente para generar el `POST`.
- Como no había historial, `fila.idHistorial` quedaba en `null`.
- No se generaba ninguna promesa de guardado → `promesas.length === 0` → el mensaje "No hay intensificaciones para guardar".

### 7.2 Solución (Backend)

- Se agregó `_resolver_o_crear_historial()` en `backend/proyecto/escuela/views.py`.
- El backend ahora puede **resolver o crear** el `HistorialAcademico` necesario a partir de:
  - `id_alumno`
  - `id_curso_materia`
  - `anio_rendicion`
- `id_curso` e `id_materia` se obtienen a partir de `CursoMateria`.
- Se evita duplicar historiales mediante `get_or_create`.
- `IntensificacionAcademicaViewSet.create` ahora puede recibir `id_alumno + id_curso_materia` **sin** `id_historial`.
- El backend resuelve el historial automáticamente.
- También se corrigió el establecimiento de `fecha_registro` en el `create` (el campo no podía quedar `NULL` a nivel de columna).

### 7.3 Solución (Frontend)

- `cambiosIntensificaciones()` ahora puede generar correctamente un `CREATE` aunque no exista previamente una intensificación.
- El payload de creación utiliza:
  - `id_alumno`
  - `id_curso_materia`
  - `periodo`
  - `anio_rendicion`
  - `nota`
- `id_historial` se incluye cuando está disponible; en caso contrario el backend lo resuelve.
- `PanelAlumnos.jsx` pasa `cursoMateriaId` a la lógica de cambios.
- Las actualizaciones de registros existentes continúan utilizando `PATCH`.
- Se **mantiene la estructura original de 3 columnas**:
  - Intensificación 1.º Cuatrimestre
  - Diciembre
  - Febrero

### 7.4 Reglas académicas (conservadas, no modificadas)

- Intensificación 1.º Cuatrimestre → habilitada solo si se desaprobó el 1.º Cuatrimestre.
- Diciembre → habilitada si se desaprobó el 2.º Cuatrimestre **O** la Intensificación 1.º Cuatrimestre quedó desaprobada.
- Febrero → habilitada si Diciembre quedó desaprobado.
- Si Febrero queda desaprobada → la materia pasa a **Previa**.
- Se conserva el historial académico.

### 7.5 Base de datos

- **No se realizaron modificaciones manuales** sobre la base de producción durante esta corrección.
- La investigación de `historial_academico = 0` e `intensificaciones_academicas = 0` fue de **solo lectura**.
- La única base eliminada/limpiada durante las pruebas fue una **base efímera de testing** (`test_sistema_escolar`) mediante el mecanismo correspondiente de Django.
- **No se modificaron migraciones** para solucionar este problema.

### 7.6 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/proyecto/escuela/views.py` | `_resolver_o_crear_historial()`, `IntensificacionAcademicaViewSet.create` (resolve historial + `fecha_registro`), corrección de detección de error en create/update (`resultado not in ('APROBADA','DESAPROBADA')`) |
| `backend/proyecto/escuela/models.py` | Ajuste menor relacionado con el flujo de intensificaciones |
| `backend/proyecto/escuela/tests/test_academico.py` | 16 tests, incluye `test_intensificacion_crea_sin_historial_existente` |
| `frontend/src/components/Profesores/PanelAlumnos.jsx` | `cargarIntensificaciones`, `handleGuardarIntensificaciones`, `handleIntensifChange`, pase de `cursoMateriaId` |
| `frontend/src/services/api.js` | Uso de `getHistorialAcademico` / `createIntensificacionAcademica` |
| `frontend/src/utils/intensificaciones.js` | Nuevo: constantes + lógica pura (`cambiosIntensificaciones`, etc.) |
| `frontend/src/utils/intensificaciones.test.js` | Nuevo: cobertura de la lógica pura |

---

*Documento actualizado el 2026-09-02 · Proyecto Mi Secundaria 7*
