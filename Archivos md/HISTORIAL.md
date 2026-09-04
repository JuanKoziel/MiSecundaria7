# HISTORIAL DE CAMBIOS — Mi Secundaria 7

> **Propósito:** Registro de todas las auditorías, correcciones y decisiones significativas tomadas en el proyecto. Este archivo preserva el trabajo ya realizado para referencia futura.
>
> **Última actualización:** 2026-09-04

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

## 8. Navegación desde notificaciones y documentación de eventos E10/E3/E19 (2026-09-03)

Correcciones post-cierre del Plan Maestro de Notificaciones (§16). No se reabrió
ninguna parte de las 1–9; solo se corrigió la navegación y se documentaron los
eventos.

### 8.1 Corrección 6 — Navegación desde notificaciones (arreglo)

**Problema:** `DESTINO_A_VISTA` (en `Notificaciones.jsx`) traducía el destino
semántico del backend a un nombre de vista genérico y cada dashboard lo usaba
directamente como `view`/`seccionActiva`. Esto producía destinos inexistentes
(p. ej. `eventos` en vez de `calendario`, `planificaciones` en vez de `planif`,
`boletin`/`intensificaciones`/`rendiciones`/`ddjj` sin vista real) y, además,
los dashboards de **Preceptor** y **Admin** no consumían `navIntent` en absoluto.
Resultado: muchos clics en notificaciones derivaban a una sección en blanco.

**Solución:**
- Nuevo util `frontend/src/utils/navDestinos.js` con `viewDesdeDestino(destino, rol)`
  que mapea el destino **semántico** al nombre de vista **real** de cada rol.
- `Notificaciones.jsx` ahora propaga `nav_destino`/`nav_params` **sin pre-mapear**;
  cada dashboard traduce con su rol.
- Dashboards actualizados: `AlumnoDashboard`, `FamiliaDashboard`, `PanelProfesores`
  (docente), `PreceptorDashboard` y `AdminDashboard` mapean el destino y solo
  navegan si existe una vista válida (si no, el item no navega, no queda en blanco).
- `FamiliaDashboard` además preselecciona el hijo cuando `nav_params.alumnoId`
  coincide con un hijo vinculado.
- Tests: `frontend/src/utils/navDestinos.test.js` (nuevo, 12 tests) + 2 tests de
  propagación en `Notificaciones.test.jsx`. Frontend total: **137 OK**; build OK.

### 8.2 Documentación de eventos (correcciones 7, 8, 9)

#### E10 — Materia pasa a Previa (registrado como issue aparte)

`_pasar_a_previa(historial)` (`backend/proyecto/escuela/views.py:4488`) invoca
`MateriaAdeudada.objects.get_or_create(...)`, pero **ignora la bandera `created`**
y llama a `_notificar_previa(...)` de forma incondicional. Por lo tanto, cada vez
que se reprocesa una materia que ya está en PREVIA, se vuelve a intentar emitir la
notificación, aunque no haya una transición real.

- En la práctica la deduplicación por contenido (`notificar_alumno`, estrategia
  CONTENT) oculta la mayoría de los duplicados idénticos, por lo que el test
  `test_previa_evita_duplicados` pasa.
- Sin embargo, no se cumple estrictamente el criterio §17 #9 ("solo notificación
  ante cambios efectivos"): si el historial de la notificación previa se purga o
  se elimina, el reproceso volvería a crear una notificación para un estado ya
  existente.
- **Decisión:** se documenta como issue aparte (**sin corrección de código** en
  este alcance). Requiere decidir el comportamiento deseado antes de tocar
  `_pasar_a_previa` (p. ej. notificar solo cuando `created` es `True`).

#### E3 — Inasistencia registrada (validación manual pendiente)

El emisor `_notificar_inasistencia(...)` está correctamente integrado en
`AsistenciaViewSet.create` (`backend/proyecto/escuela/views.py:3043,3048`), tanto
para la ruta de actualización de una asistencia existente como para la creación.
Los tests unitarios de E3 llaman a la función directamente y **pasan**.

Sin embargo, el endpoint `AsistenciaViewSet.create` arrastra los **3 fallos
PREEXISTENTES** de `test_asistencias` (el endpoint retorna `201` en lugar de `400`
en validaciones de docente), que impiden validar el disparo de E3 a través de la
API real de forma automatizada.

- **Decisión:** se documenta que la validación **manual** del flujo completo
  (registrar una ausencia por la UI de Asistencias y comprobar la notificación)
  queda **pendiente** hasta resolver la deuda técnica del endpoint. La lógica
  unitaria de E3 está cubierta por tests y no presenta defectos propios.

#### E19 — Bloqueo/modificación de horario (inspección sin modificación)

Se inspeccionó `BloqueoHorarioAlumnoViewSet` (`backend/proyecto/escuela/views.py:4878`):

- `perform_create` → `_notificar_bloqueo_horario(..., accion='creado')`: notifica
  solo si `estado=True` (bloqueo activo). Crear un bloqueo inactivo no notifica.
- `perform_update` → notifica con `accion='desactivado'` **solo** en la transición
  `True → False` (levantamiento del bloqueo), que es el evento definido.
- Escritura restringida a `IsAdminOrDirectorForWrite`; la lectura respeta
  `alumnos_permitidos(request)`.
- Los 3 tests de `test_notificaciones_eventos_parte6.py` (E19) cubren crear
  activo, desactivar, y crear inactivo (no notifica) — **pasan**.

**Conclusión:** el comportamiento de E19 es correcto y coherente con el plan
(§5.6.2 y §E19); **no requiere modificación de código**. Se documenta el resultado
de la inspección. Nota: no se notifica la *reactivación* (`False → True`), lo cual
es coherente con el plan (no está definido como evento); ante requerimientos
futuros se podría agregar.

## 9. Destinatarios Preceptor y navegación E4 (2026-09-04)

Segunda ronda de correcciones post-cierre del Plan Maestro de Notificaciones
(§16). No se reabrieron las Partes 1–9. Sin cambios de base de datos ni
migraciones.

### 9.1 Determinación de destinatarios del Preceptor (Problema 1)

Se auditó qué eventos deben notificar al Preceptor según el alcance real de cada
evento y la relación real `Alumno.id_curso → Curso.id_preceptor`:

| Evento | ¿Notifica al Preceptor? | Resultado |
|--------|------------------------|-----------|
| E7 Comunicados | Sí | Ya cubierto (curso-scoped; tests actuales) |
| E16 Eventos institucionales | Sí | Ya cubierto (alcance institucional) |
| **E4 Conducta/apercibimientos** | **Sí (añadido)** | Se notifica al preceptor del curso del alumno |
| E3 Asistencias | No (diferido) | Requiere resumen diario [REQUIERE DECISIÓN]; fuera de alcance |
| E10 Previa | No | Issue aparte (§8.2); no tocar |
| E19 Bloqueo horario | No | Fuera de alcance (§8.2) |
| E5 Actas, E11/E12/E13/E18 académicos | No | Plan §5.2: alumno+familia (+ docentes) |

**Cambio de código (E4):**
- Nuevo helper compartido `_preceptores_para_cursos(curso_ids)`
  (`backend/proyecto/escuela/views.py`) que devuelve los preceptores únicos
  (`Curso.id_preceptor`) con su `id_usuario`, deduplicados.
- `_notificar_acta_conducta(...)` ahora, además de alumno y familia, notifica al
  preceptor del curso del alumno (mensaje con el nombre del alumno y el mismo
  `nav` al destino `actas`). Usa la puerta única `notificar()` (conserva
  anti-spam y dedup del § Parte 7).
- `_preceptores_para_comunicado(...)` se refactorizó para reutilizar el helper
  (mismo resultado; solo reduce duplicación).

**Test añadido:** `test_acta_conducta_notifica_al_preceptor_del_curso`
(`test_notificaciones_eventos_parte6.py`) — verifica que el preceptor del curso
del alumno recibe la notificación con el `nav` a `actas`, y que el preceptor de
otro curso no recibe nada. Suite E4: **4 OK**.

### 9.2 Navegación clicable y verificación completa (Problema 2)

Se completó la navegación para el nuevo destinatario preceptor: se añadió
`actas: 'actas'` al mapa de `preceptor` en `utils/navDestinos.js`, de modo que
los preceptores puedan abrir la vista **Actas** (módulo existente del
`PreceptorDashboard`) al hacer clic en una notificación de conducta.

Flujo verificado de punta a punta: clic → `nav_destino` semántico + `nav_params`
(emitidos por el backend) → `viewDesdeDestino(destino, rol)` por dashboard → vista
real del panel (solo navega si existe; si no, el item no navega y nunca queda una
pantalla en blanco). No se muestran marcadores `[nav:...]`/`[ref:...]` en la UI
(el serializer los separa del `mensaje`).

### 9.3 Verificación

- Backend: suites de notificaciones completas **86 OK**; suite completa **234
  tests con solo los 3 fallos PREEXISTENTES** de `test_asistencias` (`201 != 400`),
  ajenos a estos cambios. `manage.py check`: solo warning W342 preexistente.
- Frontend: `npm test` **137 OK** (14 archivos); `npm run build` OK.

## 10. Notificaciones clickeables y accesibles desde la UI (2026-09-04)

Tercera ronda de correcciones post-cierre del Plan Maestro de Notificaciones
(§16). No se reabrieron las Partes 1–9. Sin cambios de base de datos, ni
migraciones, ni lógica de destinatarios/eventos.

### 10.1 Diagnóstico

El flujo de navegación **ya existía** (destino semántico → `navegarDesdeNotificacion`
→ `navIntent` → `viewDesdeDestino(rol)` → vista real). El problema real era doble:

1. **Affordance visual ausente:** `Notificaciones.jsx` ya tenía armado un
   `onClick`, `role="button"`, `tabIndex`, teclado Enter/Space y `stopPropagation`
   en "Marcar como leída", pero **el CSS no definía ningún estilo** para
   `.notificacion-item--navegable` (sin `cursor: pointer`, sin hover, sin foco) ni
   para el indicador `.notificacion-item__nav-indicador` (un plano `<i>`).
   Resultado: el usuario no percibía ni cómo activar la navegación.
2. **Rol sin suscripción:** el rol **Jefe de Preceptores**
   (`JefePreceptorDashboard`) rendía `Notificaciones` pero NO consumía `navIntent`,
   por lo que sus notificaciones no navegaban (las 5 roles pedidos —Alumno,
   Familia, Docente, Preceptor, Admin/Director— sí estaban correctamente cableadas).

### 10.2 Solución

- `frontend/src/index.css`: affordance de clic para `.notificacion-item--navegable`
  (`cursor: pointer`, `transition`, hover/active sobre `border-color`,
  `outline` en `:focus-visible`) y estilado del indicador
  `.notificacion-item__nav-indicador` como una "píldora" visible con borde del
  color primario.
- `frontend/src/components/Notificaciones.jsx`: el indicador ahora incluye texto
  **"Ver →"** (además del chevron) claramente visible; el manejador de teclado
  extrae la lógica a `handleNotificacionKeyDown` (Enter **y** Space navegan, con
  `preventDefault` para que Space no haga scroll); se añadió `aria-label` a la
  tarjeta navegable. La tarjeta completa es el elemento clicable (opción 1),
  complementada con el indicador visible (opción 2).
- `frontend/src/components/JefePreceptores/JefePreceptorDashboard.jsx`: consume
  `navIntent` con `viewDesdeDestino(..., 'preceptor')` (el mapa normaliza
  `jefe_preceptores → preceptor`), replicando el patrón del `PreceptorDashboard`.

### 10.3 Cómo se evita navegación accidental

- **"Marcar como leída":** su `onClick` ejecuta `e.stopPropagation()` **antes**
  de marcar, de forma que el evento no llega al `onClick` de la tarjeta →
  nunca dispara navegación.
- **"Marcar todas como leídas":** botón fuera de las tarjetas, sin conflicto.
- Notificación con destino válido: clicable y navega. Sin destino válido: se
  renderiza como texto normal, `handleNotificacionClick` retorna temprano, no
  rompe y no deja pantalla en blanco (los dashboards solo cambian de sección si
  `viewDesdeDestino` devuelve una vista existente).

### 10.4 Verificación

- `frontend/src/components/Notificaciones.test.jsx`: +4 tests (indicador "Ver →"
  con tarjeta `role=button` que navega; navegación por Enter y Space; "Marcar
  como leída" con `stopPropagation` sin navegar; metadata `[nav:/[ref:]` nunca
  visible y `nav_params` no inlineado). Total `Notificaciones`: 16 tests.
- `npm test`: **141 OK** (14 archivos). `npm run build`: OK.
- Backend: no modificado en esta ronda (los metadatos los separa el serializer
  del backend; el frontend solo recibe `nav_destino`/`nav_params` como campos).

## 11. Causa raíz de la navegación: DataContext descartaba el nav (2026-09-04)

Cuarta ronda de correcciones post-cierre del Plan Maestro de Notificaciones
(§16). No se reabrieron las Partes 1–9. Sin cambios de base de datos, ni
migraciones, ni destinatarios ni eventos. La sección §10 había añadido la
affordance visual y el consumo de `navIntent` en todos los roles, pero el flujo
REAL seguía roto.

### 11.1 Diagnóstico (extremo a extremo)

Se trazó una notificación real desde el evento hasta el render de la tarjeta:

1. **Evento** (`_notificar_comunicado_publicado`, E7): pasa `nav={'destino':
   'comunicados', 'params': {'comunicadoId': ...}}` a `notificar()`.
2. **`notifications.notificar()`**: añade `[nav:{...}]` al final de `mensaje`.
3. **DB** (`notificaciones`): guarda el marcador en `mensaje` (dedup + nav).
4. **`.NotificacionSerializer`** (`serializers.py:1924`): `_extraer_nav()` lee el
   marcador y expone `nav_destino` y `nav_params`; `get_mensaje()` devuelve el
   texto limpio sin `[nav:]`/`[ref:]`.
5. **`GET /api/notificaciones/`** (`NotificacionViewSet`): devuelve correctamente
   `nav_destino` y `nav_params` — verificado por `test_notificaciones.py` (§11.3)
   y cubierto desde la ronda 1.
6. **`DataContext`** (`frontend/src/context/DataContext.jsx:551`): el `.map()` que
   normaliza cada notificación **descartaba `nav_destino` y `nav_params`**.
7. **`Notificaciones.jsx`**: sin `n.nav_destino`,
   `tieneNavegacion = Boolean(undefined)` → `false` → no mostraba "Ver →", no
   hacía la tarjeta clicable y `onClick` retornaba temprano.

**Causa raíz confirmada:** el backend y el serializer estaban (y están) correctos;
el eslabón roto era el mapeo interno de `DataContext`, que eliminaba
`nav_destino`/`nav_params` justo entre la API y el componente. Por eso la
notificación manual "asdddd / das" (sin envoltura real) tampoco mostraba "Ver →"
(es correcto que no lo muestre, salvo que el evento la genere con destino).

### 11.2 Solución

En `frontend/src/context/DataContext.jsx` el mapeo de notificaciones ahora
reenvía los metadatos de navegación que entrega la API:

```js
nav_destino: n.nav_destino || null,
nav_params:  n.nav_params || {},
```

Con esto el componente `Notificaciones.jsx` (afordance + indicador "Ver →" de §10)
reacciona: destino válido → tarjeta clicable/cursor/foco/Enter/Space y navega;
sin destino → texto normal, sin "Ver →", no rompe. La familia auto-selecciona el
hijo por `params.alumnoId` (FamiliaDashboard §8/§10). "Marcar como leída" sigue
con `stopPropagation` e independiente de la navegación.

### 11.3 Verificación con un evento REAL

- Nuevo test backend `NotificacionEventoRealNavegableTests.test_comunicado_real_expone_nav_navegable_en_api`
  (`test_notificaciones.py`): crea un comunicado real (E7), llama a su notificador
  y verifica en la respuesta de `GET /api/notificaciones/` que:
  - el mensaje visible está limpio (`[nav:` y `[ref:` ausentes)
  - `nav_destino == 'comunicados'` y `nav_params == {'comunicadoId': ...}`.
  Suite `test_notificaciones` → **19 OK**.
- Suite de notificaciones backend completa → **87 OK**; `manage.py check` solo W342.
- Frontend → **141 OK** (14 archivos); `npm run build` OK.

---

## 12. "Ver" autorizado por sección real del rol (2026-09-04)

Quinta ronda de correcciones post-cierre del Plan Maestro de Notificaciones
(§16). No se reabrieron las Partes 1–9. Sin cambios de base de datos ni
migraciones.

### 12.1 Problema

Con el fix de la ronda 11 (DataContext ya exponía `nav_destino`/`nav_params`)
se encontró una nueva inconsistencia: el componente mostraba **"Ver →"** y se
comportaba como botón cuando **cualquier** `nav_destino` era truthy, sin validar
que el **rol actual tuviera una vista real** donde consultar ese contenido. Como
`viewDesdeDestino(destino, rol)` devuelve `null` para muchas combinaciones, eso
producía tarjetas aparentemente clickeables que **no hacían nada** al hacer clic.
Además, algunos mapas de `utils/navDestinos.js` apuntaban destinos a una vista
"panel" que no mostraba el contenido correspondiente.

**Regla nueva (pedida por el usuario):** mostrar "Ver"/navegación **solo** si el
rol actual tiene un apartado/sección **real** que permita consultar el contenido
del destino. El mero `nav_destino` no es autorización; la **sección real del rol**
es la que autoriza.

### 12.2 Solución

- **`utils/navDestinos.js`**:
  - Se corrigieron/alimentaron los mapas con las secciones **reales** de cada rol
    (tomadas de los menús reales de cada dashboard — `sidebarMenu.js` y los
    `switch`/render):
    - `alumno`: +`rendiciones → 'previas'` (las rendiciones se consultan junto a
      las previas).
    - `preceptor`: +`asistencias`, `notas`, `horarios`.
    - `admin`: +`adelantos → 'adelantos-horas'`, `suplencias`, `actas`,
      `asistencias`, `horarios`, `notas`.
    - `docente`: `suplencias → 'docente'` (el `PanelDocente` lista sus
      suplencias); **se eliminó** `adelantos → 'docente'` porque el rol no tiene
      apartado de adelantos (queda sin navegación).
  - Las secciones a las que se mapea cada destino coinciden con los identificadores
    reales de `AlumnoDashboard`, `FamiliaDashboard`, `PanelProfesores`,
    `PreceptorDashboard`, `AdminDashboard` y `JefePreceptorDashboard`
    (normalizados por `ROL_EQUIV`: `jefe_preceptores → preceptor`,
    `director → admin`). No se inventaron vistas.

- **`components/Notificaciones.jsx`**: se importa `tieneVistaParaDestino` y se:
  - muestra `notificacion-item--navegable` + indicador "Ver →" + `role="button"`
    + `aria-label` + `tabIndex` **solo** si `nav_destino` **y**
    `tieneVistaParaDestino(nav_destino, userRole)`.
  - `handleNotificacionClick` y `handleNotificacionKeyDown` **no navegan** si el
    rol no tiene vista real (antes solo revisaban `nav_destino`, por lo que un clic
    en una tarjeta sin vista igual disparaba la navegación).

- **Se pasa `userRole` a `<Notificaciones />` desde todos los dashboards** (antes
  solo `Familia` lo pasaba): `Alumno → "alumno"`, `Preceptor → "preceptor"`,
  `Admin → user.role`, `JefePreceptor → "jefe_preceptores"`,
  `Docente → "docente"`. Con esto la regla por-rol funciona en toda la app.

Se mantiene: `stopPropagation` en "Marcar como leída" y la auto-selección del
hijo en Familia vía `params.alumnoId`.

### 12.3 Verificación

- Frontend `npm test` → **148 OK** (14 archivos), incluidos:
  - `navDestinos.test.js`: nuevos casos para los mapas corregidos (docente sin
    adelantos, admin con adelantos-horas/suplencias/actas/asistencias, preceptor
    con notas/asistencias/horarios, alumno rendiciones→previas, alumno sin
    suplencias/adelantos).
  - `Notificaciones.test.jsx`: rol sin vista real → **no** muestra "Ver" ni
    navega; `jefe_preceptores` → "Ver" y navega a `actas` (equivalencia);
    los tests de navegación existentes ahora pasan `userRole`.
- `npm run build` → OK.
- Backend `test_notificaciones` → **19 OK** (sin cambios de backend en esta
  ronda; confirma que el estado de la ronda 11 se mantiene). W342 preexistente.

---

## 13. Causa raíz real: useData() no exponía la navegación (2026-09-04)

Sexta ronda de correcciones post-cierre del Plan Maestro de Notificaciones
(§16). No se reabrieron las Partes 1–9. Sin cambios de base de datos ni
migraciones. La regla `tieneVistaParaDestino` **no se tocó** (funcionaba).

### 13.1 Síntoma

Con la ronda 12 (regla por rol) la validación quedó perfecta: "Ver →" aparecía
solo con apartado real. Pero la **navegación real** (clic) seguía sin cambiar de
sección, aunque la tarjeta se veía navegable. Se inspeccionó todo el flujo
sin agregar una implementación nueva.

### 13.2 Diagnóstico — prueba de aislamiento

Se montó un harness con el **`DataProvider` real** (api mockeados) + el
`useEffect` idéntico al de los dashboards + `Notificaciones`. El clic arrojó:

```
TypeError: navegarDesdeNotificacion is not a function
NAVINTENT_AFTER= (null)
VIEW_AFTER= perfil (no cambia)
```

**Causa raíz:** el hook `useData()` —el puente entre `DataContext.Provider` y
los consumidores— **nunca exponía `navegarDesdeNotificacion` ni `navIntent`**.
Solo los `marcar*` y los datos estaban en su objeto retornado. El `Provider.value`
sí los incluía, pero al volver a construir la respuesta, `useData()` los dejaba
fuera:
- `Notificaciones.jsx` recibía `navegarDesdeNotificacion === undefined` → al
  hacer clic, `TypeError` → no navegaba (el "Ver →" sí se veía porque
  `nav_destino` sí viaja dentro de `...ctx.data.notificaciones`).
- Todos los dashboards recibían `navIntent === undefined` → `if (navIntent &&
  navIntent.destino)` nunca entraba → el `useEffect` de navegación nunca se
  ejecutaba.

Este era el eslabón cortado que las rondas 11 y 12 no habían detectado porque
solo revisaban los datos y el componente, no el **puente de contexto**.

### 13.3 Solución

En `frontend/src/context/DataContext.jsx`, en **ambas** ramas del hook `useData()`
(de carga y de datos cargados) se añadieron:
- `navegarDesdeNotificacion: (...) => ctx.navegarDesdeNotificacion` (en la rama
  de carga un no-op estable).
- `navIntent: ctx.navIntent` (en la rama de carga `null`).

Con esto `Notificaciones` recibe la función real y los dashboards reciben
`navIntent`; el clic → `navegarDesdeNotificacion` → `setNavIntent` → cambio de
referencia (con `timestamp`) → `useEffect` → `viewDesdeDestino` → `setView` →
sección real. La navegación del **menú normal** no se tocó.

### 13.4 Verificación

Nuevo test de aislamiento/integración `frontend/src/components/NavIsolation.test.jsx`
con `DataProvider` real y los `useEffect` idénticos a cada dashboard:
- Alumno (`comunicados`), Preceptor (`actas`), JefePreceptor→preceptor (`actas`),
  Docente (`comunicados`), Admin (`suplencias`), Director→admin (`comunicados`)
  → la sección **cambia** al clic.
- Familia: además cambia la vista y fija el **Estudiante correcto** por
  `params.alumnoId`.
- Caso negativo: Docente con destino `adelantos` (sin apartado) → no navega.

Resultados: `npm test` → **156 OK (15 archivos)**; `npm run build` → OK.
Backend sin cambios.

---

## 14. Notificaciones en vivo: badge, campana y toast "Nueva notificación" (2026-09-04)

Séptima ronda de correcciones post-cierre del Plan Maestro de Notificaciones
(§16). Atiende los requisitos visuales **Partes 1–13** (todas las indicadas),
sobre la base ya establecida de navegación por rol (§12/§13). **Sin cambios de
base de datos, sin migraciones, sin commits/push**. El backend NO se tocó: el
sondeo reutiliza el endpoint existente `GET /notificaciones/`.

### 14.1 Qué cambió

- **`frontend/src/context/DataContext.jsx`**
  - Extracto `normalizarNotificacion(n)` (única normalización de una
    notificación API) y helper puro `detectarNuevas(raw, conocidos)` que
    identifica las notificaciones **realmente frescas** (id no conocido),
    deduplica dentro del mismo lote y actualiza el set de conocidas.
  - Estado de sesión: `nuevasNotificaciones` (cola del toast, id dedicado),
    `campanaPulse` (contador que se incrementa al llegar una nueva; dispara la
    animación), `idsInicialesRef` (línea base de ids ya vistos al cargar) y
    `pollEnCursoRef` (guarda anti-solapamiento).
  - **Línea base:** al terminar la carga inicial, los ids presentes se guardan
    como "ya conocidos" → las no leídas que existían al abrir **nunca** se
    muestran como "nueva" (Parte 5).
  - **Sondeo (Parte 6):** un único `setInterval` global por sesión (30 s) que
    llama a `getNotificaciones()`, detecta nuevas, las fusiona en
    `data.notificaciones` (sin duplicar por id) y las encola + pulsa la campana.
    El intervalo se limpia con `clearInterval` al desmontar el provider; la
    guarda evita peticiones solapadas y las fallas de red se ignoran.
  - `descartarNueva(id)` retira del toast una notificación.
  - Expone `nuevasNotificaciones`, `campanaPulse` y `descartarNueva` en
    `Provider.value` **y** en las dos ramas del hook `useData()` (lección de
    §13: el puente no debe volver a quedarse sin exponerlos).

- **`frontend/src/components/Shared/CampanaNotificaciones.jsx`** (nuevo, Parte 1/4)
  Badge reutilizable de campana para el menú lateral. **Fuente ÚNICA del
  contador**: calcula `notificaciones.filter(n => !n.leida).length` desde
  `useData()` (no hay lógica de recuento duplicada por rol). El badge baja solo
  al marcar leídas y sube al llegar nuevas; la cifra se limita a `99+`. Al
  incrementarse `campanaPulse` se re-anima la campana (`@keyframes
  campana-agitar`) sólo cuando hay un pulso > 0.

- **Los 6 sidebars** (`Alumno`, `Familia`, `Profesores`, `Preceptores`,
  `JefePreceptores`, `Administracion`) renderizan `<CampanaNotificaciones />`
  en el ítem `id === 'notificaciones'`, manteniendo el resto del menú intacto.

- **`frontend/src/components/Shared/NotificacionToast.jsx`** (nuevo, Partes 2/3/7/8)
  Toast apilado abajo-a-la-derecha con cada notificación nueva detectada en
  sesión: campana, título "Nueva notificación", asunto (título), mensaje,
  botón **"Ver →"** y botón de cierre. Comportamiento:
  - El "Ver →" **reutiliza** la navegación existente (`navegarDesdeNotificacion`
    + `nav_destino`/`nav_params`). No crea un sistema de navegación paralelo.
  - El "Ver →" **solo aparece si el rol tiene una vista real** para el destino
    (`tieneVistaParaDestino`), idéntico a la regla de §12.
  - Se autocierra (7 s) con animación de salida; el cierre lo descarta de la
    cola (no se vuelve a mostrar mientras el id siga en la línea base).
  - No se duplica: la cola descarta por id y la detección deduplica.
  - Responsivo: en pantallas ≤ 640 px ocupa el ancho disponible abajo.

- **`frontend/src/App.jsx`** — se renderiza `<NotificacionToast userRole={user.role} />`
  una única vez (todos los roles) junto al dashboard, dentro de `DataProvider`.
  El rol para el gating se toma de `user.role`; `tieneVistaParaDestino` ya
  resuelve los alias (`jefe_preceptores`→preceptor, `director`→admin).

- **`frontend/src/index.css`** — estilos de `.campana-notif` (badge + animación),
  del toast `.notificaciones-toast`/`.notif-toast` (entrada/salida, Ver, cerrar,
  responsive), y util `.visually-hidden`.

### 14.2 Cómo se detectan las nuevas (Parte 2/5/6)

El sondeo compara cada respuesta contra la **línea base de ids** (`idsInicialesRef`):
una notificación se considera **"nueva"** solo si su id no estaba en esa línea
base; la existente al cargar nunca dispara toast. "Nueva" es distinto de
"no leída": el badge cuenta no-leídas (incluye las que ya estaban), el toast
solo notifica las que llegaron en la sesión.

### 14.3 Verificación

- Nuevos tests:
  - `frontend/src/context/DataContextDetect.test.js` — `detectarNuevas`: solo
    desconocidas, sin duplicados en el lote, no marca las ya conocidas, tolera
    no-array, normaliza `leida`/`nav_destino`/`nav_params`.
  - `frontend/src/components/NotificacionesEnVivo.test.jsx` — badge: contador,
    oculto a 0, tope 99+, reacción al pulso; toast: no renderiza sin nuevas,
    muestra título+mensaje, "Ver" según rol/destino, sin "Ver" sin destino,
    cierre llama a `descartarNueva`, "Ver" descarta y navega.
- Suite completa: `npm test` → **172 OK (17 archivos)**; `npm run build` → OK.
- Backend sin cambios: `manage.py check` OK (solo W342 preexistente) y
  `test_notificaciones` → **19 OK**.

---

*Documento actualizado el 2026-09-04 · Proyecto Mi Secundaria 7*
