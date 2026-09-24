# Pendientes del Testeo Masivo — Ronda 2 (Verificación del cliente)

Verificación del cliente de la ronda anterior (C1-A26, M1-M20, B1-B15). Cada punto indica lo que aún falta corregir según la prueba real del usuario.

**Leyenda de estado:**
- ✅ = Funciona correctamente
- ❌ = Falló / falta corregir
- ⚠️ = Funciona parcialmente (algo falta)

---

## GLOBALES / TRANSVERSALES (se aplican a todos los usuarios)

| # | Regla | Qué se espera | Estado |
|---|---|---|---|
| G1 | **Cerrar formularios al guardar** | Cada vez que se hace "Guardar/Crear/Eliminar" o se termina cualquier acción dentro de un formulario, el formulario debe cerrarse automáticamente. Aplica a TODOS los formularios de TODOS los usuarios (A20). | ✅ Hecho |
| G2 | **Auto-actualización tras cada acción** | Cualquier acción que modifique datos (crear, editar, quitar rol, asignar, borrar) debe actualizar automáticamente las listas/tablas para que el cambio se vea reflejado de inmediato. Global (A17, A22). | ✅ Hecho |
| G3 | **Mensajes de error entendibles** | Los errores deben explicar en lenguaje simple qué pasó y qué hacer, SIN llaves, comillas, claves técnicas ni JSON. Aplica a todos los mensajes de la página, en todos los usuarios (B2). | ✅ Hecho |
| G4 | **Navegación cerrando/abriendo desplegables** | Al apretar un botón que redirige, se debe cerrar el desplegable actual, abrir el del apartado destino y mostrar el contenido. Aplica a todos los botones que redireccionan, en todos los usuarios (B1). | ✅ Hecho |
| G5 | **Leyenda de emojis de botones consistente** | La leyenda con emojis que explica las acciones debe verse igual en todos los apartados que usan los mismos botones. Si un apartado tiene 3 botones en vez de 4, mostrar solo las 3 leyendas correspondientes, con la misma visual (A14). | ✅ Hecho |
| G6 | **Notificaciones agrupadas / acumulables** | Idea general: en vez de una notificación por cada carga/actualización, agrupar en un mismo espacio las relacionadas (p. ej. notas de matemática cargada → actualizada → actualizada de nuevo), que se acumulen debajo de la anterior, se puedan expandir para ver todas, y las nuevas queden arriba de todo. Pensar mejor el diseño para no llenar de notificaciones en un mismo día (M12). | ✅ Hecho |
| G7 | **Separación notificaciones alumno vs familia** | Las notificaciones del familiar deben separarse: en el apartado de notificaciones del **estudiante** solo van las académicas; en las **personales** del familiar van las suyas. Las que no aparezcan en las del estudiante figuran en personales (M1). | ✅ Hecho |

---

## CRÍTICO — No funciona nada / crashea la página

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| C1 | Familia | ✅ | Hecho: la campana (`CampanaNotificaciones`) acepta `selectedChild` y cuenta solo las no leídas de ese hijo; `FamiliaDashboard` pasa el hijo seleccionado al sidebar y el selector del Header muestra "(N sin leer)" por hijo. "Marcar todas" ahora coincide con el contador del hijo activo. | `CampanaNotificaciones.jsx`, `Familia/FamiliaDashboard.jsx`, `Familia/sidebar/sidebar.jsx`, `Familia/header/header.jsx` |
| C2 | Preceptor | ✅ | Hecho: el crash era por `toggleAlumno`, que pasaba un updater `(prev) => ...` a un `setAlumnosIds` que espera el valor directo (quedaba una función guardada en `form.alumnos_ids` y `.includes` reventaba al renderizar). Ahora calcula desde el prop `alumnos_ids`. | `Shared/TutoresAlumnosEditor.jsx` |
| C3 | Preceptor | ✅ | Hecho: (1) el selector de materias ahora se filtra por curso con `getMateriasByCurso`; (2) el error al crear era 403: el preceptor no tenía permiso de escritura en `curso-materia` (`IsAdminOrDirectorForWrite`). Se agregó `PuedeGestionarCursoMateria` (admin/director/preceptor) con validación de curso en los `perform_*`; (3) por eso el docente no aparecía (sin asignación quedaba fuera del queryset del preceptor). Además se validan las asignaciones antes de crear el docente. | `Shared/AsignacionesEditor.jsx`, `Preceptores/docentes.jsx`, `permissions.py`, `views.py` |
| C4 | Admin/Jefe | ✅ | Se crea bien. La notificación de creación del usuario llega como "nuevo usuario creado: Preceptor". | — |
| C5 | Admin/Docente | ✅ | El error 404 de archivos de planificación ya no está. | — |
| C6 | Admin/Preceptor | ✅ | No muestra más el error 404 en actividades/proyectos. | — |
| C7 | Admin | ✅ | Corregido (selector de materia en boletines). | — |

---

## ALTA — Funcionalidad rota / no se puede usar

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| A1 | Todos | ✅ | Funciona. | — |
| A2 | Alumno/Familia | ✅ | Lo hizo bien. | — |
| A3 | Docente | ✅ | Hecho: el filtro por materia ahora considera los **alcances** del comunicado y su `id_materia`, y `materiaSeleccionada` está en las deps del `useMemo`. Ya no muestra comunicados de otra materia del mismo curso. | `Shared/ComunicadosView.jsx`, selector global |
| A4 | Docente/Alumno/Familia | ✅ | Hecho: en **alumno** la sección está en el desplegable "Contenidos" (nuevo ítem "Materias Adeudadas"); incluye **intensificación** además de previa (`SituacionMateriaAlumno.situacion='INTENSIFICANDO'` + `MateriaAdeudada`); se **diferencia visualmente** intensificación (borde naranja) vs previa (borde rojo) con badge y botón "Ver detalle"; en **familia** toma el **selector global** del hijo y las tarjetas son clickeables; en alumno usa el mismo formato que familia; preceptor/familia acotan por `curso`/`alumno`. | `Shared/ActividadesView.jsx`, `views.py` (`ActividadMateriaAdeudadaViewSet`, `_notificar_actividad_adeudada`), `Alumno/sidebarMenu.js`, `Alumno/AlumnoDashboard.jsx` |
| A5 | Docente | ✅ | Hecho: el mapeo de `planificaciones` en `DataContext.jsx` no incluía `estado` ni `id_planificacion`, así que "verificar" apuntaba a `/planificaciones/undefined/verificar/` (404 → "no encontrado"). Se completó el mapeo y se reorganizó la celda de acciones (A13) para que no choque con "Ver". | `DataContext.jsx`, `Administracion/docentes.jsx`, backend |
| A6 | Docente | ✅ | Hecho: `PanelDocente.jsx` muestra la DDJJ como "Verificada" cuando corresponde. | `Profesores/PanelDocente.jsx` |
| A7 | Docente/Admin | ✅ | Hecho: `_notificar_carga_notas` ahora envía **una notificación por nota (por alumno)** a directivos y preceptores, con `dedupe_key` por nota. | `views.py` (`_notificar_carga_notas`), `Profesores/PanelAlumnos.jsx` |
| A8 | Preceptor | ✅ | Funciona correctamente. | — |
| A9 | Preceptor | ✅ | Funciona correctamente. | — |
| A10 | Preceptor | ✅ | Funciona correctamente. | — |
| A11 | Preceptor | ✅ | Funciona correctamente. (Info: en la BD los DNIs viejos están sin puntuación; solo informativo, no tocar BD salvo indicación.) | — |
| A12 | Admin | ✅ | Creó bien los botones de acción de alumnos. | — |
| A13 | Admin | ✅ | Hecho: la celda de acciones se reorganizó en 3 filas de grid, con botones proporcionados y sin choque con otros elementos. | `Administracion/docentes.jsx` |
| A14 | Admin | ✅ | Funciona. G5 aplicada: leyenda de emojis unificada en `AccionesLeyenda.jsx`, presente en todos los apartados con los mismos botones (Preceptores docentes/alumnos/tutores, AdminPreceptores sin programar, administradores, preceptores). | `Shared/AccionesLeyenda.jsx` |
| A15 | Admin | ✅ | Hecho: los `get_queryset` de `CursoViewSet`/`MateriaViewSet`/`CursoMateriaViewSet` filtraban por `activo` también en detalle, así que "Reactivar" (que busca el objeto inactivo) daba "No curso matches the given query." Ahora el filtro aplica solo en `list`. | `views.py`, `Administracion/cursos.jsx` |
| A16 | Admin | ✅ | Corregido. | — |
| A17 | Jefe | ✅ | G2 aplicada: al quitar/agregar un curso a un preceptor se refrescan las tablas relacionadas (`AsignacionCursos.jsx` re-fetcha `fetchPreceptores()`). | `JefePreceptores/AsignacionCursos.jsx` |
| A18 | Jefe | ✅ | Deja crear un preceptor correctamente. | — |
| A19 | Jefe | ✅ | Hecho: la Jefatura muestra los **tres apartados** (actas de estudiantes, de docentes y de curso); `Preceptores/actas.jsx` excluye las actas de alumnos de la lista de actas de curso y `DataContext.jsx` filtra los links huérfanos de actas dadas de baja (eran las filas en blanco). | `JefePreceptores/JefePreceptorDashboard.jsx`, `Preceptores/actas.jsx`, `DataContext.jsx` |
| A20 | Jefe | ✅ | G1 aplicada: todos los formularios cierran tras guardar/crear/eliminar (única excepción corregida en `Administracion/comunicados.jsx`). | Todos los formularios |
| A21 | Preceptor | ✅ | Funciona. | — |
| A22 | Director/Admin | ✅ | G2 aplicada: al quitar un rol, la lista de usuarios sin rol se actualiza automáticamente (`tutores.jsx` `cargarPersonasSinRol()`, `administradores.jsx`). | `Administracion/administradores.jsx` |
| A23 | Responsive | ✅ | Hecho: **menú hamburguesa** (`Shared/SidebarToggle.jsx`) presente en todos los headers (Admin, Familia, Preceptor, Jefe, Docente, Alumno) que abre el sidebar como **drawer lateral** en mobile, con los **submenús apilados en vertical** y textos visibles (antes se abrían en horizontal y se cortaban). En PC el botón se oculta y el layout no cambia. | `Shared/SidebarToggle.jsx`, headers por rol, `index.css` |
| A24 | Preceptor/Admin | ✅ | - ~~Aparecen **materias que no son del curso** en el selector~~ ✅ resuelto con C3. <br>- ~~Hay un usuario que es **admin pero aparece en docentes**~~ ✅ corregido: `DocenteViewSet.get_queryset` (solo `list`) muestra docentes sin usuario o con rol `docente`, excluyendo admin/JC/preceptor. <br>- ~~al ingresar como `admin_prueba` **no deja cambiar de rol** (su `user.roles` solo trae `admin`)~~ ✅ resuelto: se asignaron a `admin_prueba` los **7 roles** en la BD; verificado por API que `POST /api/login/` devuelve `['admin','alumno','director','docente','familia','jefe_preceptores','preceptor']` y el botón "Cambiar rol" aparece (`CambiarRolButton` lo muestra si `roles.length >= 2`). | `views.py`, `Preceptores/docentes.jsx`, roles, BD |
| A25 | Preceptor | ✅ | Hecho: mensajes del backend abreviados y `ToastContext.jsx` sube la duración de los errores a 8s. | `Shared/AdelantosHoras.jsx`, `ToastContext.jsx` |
| A26 | Admin | ✅ | Hecho: se quitó el tipo de evento "No se cancelan las clases" y se agregó el **alcance** `sin_bloqueo` ("No se cancelan las clases (sin bloqueo)"); un evento con ese alcance anula suspensiones/feriados (no bloquea la plataforma). Migración de datos aplicada. | `Administracion/CalendarioInstitucional.jsx`, `models.py`, `views.py` |

---

## MEDIA — Funciona parcialmente / notificación faltante

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| M1 | Alumno/Familia | ⚠️ | Backend verificado: `_notificar_acta_curso` genera la notif del acta de curso al alumno como **académica** (id_alumno seteado, segmento alumno) y a la familia como **personal** (id_alumno nulo, segmento familia). Al testear se descubrieron y corrigieron **2 bugs** que rompían E21 (ver Registro). Falta la verificación visual del cliente. | `views.py` (`_notificar_acta_curso`) |
| M2 | Alumno/Familia | ✅ | Ok. | — |
| M3 | Alumno/Familia | ✅ | Verificado en transacción (rollback): `_notificar_recursada` emite "Recursada cargada" al cargar y "Resultado de recursada" (APROBADA/DESAPROBADA) al cambiar de estado; llega al alumno y a sus 5 familiares. | `views.py` (`_notificar_recursada`) |
| M4 | Alumno/Familia | ✅ | Aclarado: se refiere al evento **E19** "bloqueo de horario por superposición" (recursada superpuesta al horario regular). Verificado en transacción (rollback): `_notificar_bloqueo_horario` crea la notificación "Bloqueo de horario por superposición" al **alumno** (1) y a sus **5 familiares** (segmento familia). | `views.py` (`_notificar_bloqueo_horario`), `BloqueoHorarioAlumnoViewSet` |
| M5 | Alumno | ✅ | Funciona. | — |
| M6 | Alumno/Familia | ✅ | Ok. | — |
| M7 | Familia | ✅ | Se ven. | — |
| M8 | Docente | ✅ | Hecho: se vació la tabla `notificaciones` (12.189 filas) para arrancar de cero. La corrección de fondo (A1, segmentación por rol) ya evita que vuelvan a llegar notifs de otros segmentos. | `notificaciones` (limpieza de datos) |
| M9 | Preceptor | ✅ | Hecho: (1) el mensaje de `_notificar_acta_curso` ya no antepone "un acta de" (salía "acta de Acta de evaluación"): ahora es `Se cargó "Tipo" para el curso ...`. (2) El error de tilde venía de un `tipos_acta` duplicado con **mojibake** (`Acta de evaluaciÃ³n`, id 5): se reasignaron sus 2 actas a `Acta de evaluación` (id 2) y se eliminó el duplicado. Verificado y `check` OK. | `views.py` (`_notificar_acta_curso`), tabla `tipos_acta` |
| M10 | Preceptor | ✅ | Arreglado. | — |
| M11 | Preceptor | ✅ | Arreglado. | — |
| M12 | Preceptor | ✅ | Aplicada la **G6**: las notificaciones se agrupan por **día** y por **tema** en tarjetas expandibles; se muestra 1 como resumen y al expandir aparecen todas, con la más reciente arriba. Implementación verificada por código (agrupación en `Notificaciones.jsx` + clases CSS presentes) y build OK. Queda solo la confirmación visual del cliente. | `Notificaciones.jsx` |
| M13 | Preceptor | ✅ | Hecho: `Preceptores/actas.jsx` ya no mezcla actas de alumnos en las de curso y se filtran las filas en blanco (links a actas dadas de baja). | `Preceptores/actas.jsx`, `DataContext.jsx` |
| M14 | Jefe | ✅ | Llega bien. | — |
| M15 | Jefe | ✅ | Llega bien. | — |
| M16 | Jefe | ✅ | Hecho: `ActaDocenteViewSet.perform_create` ahora llama a `_notificar_acta_docente`. Notifica al docente, a los preceptores de los cursos donde dicta (titular o suplente, vía `_materias_docente_ids`), a jefes de preceptores y a directivos; **nunca al autor**. Test en transacción: 15 notifs (docente + 3 preceptores + 3 jefes + 8 directivos), autor excluido. | `views.py` |
| M17 | Admin | ✅ | Llega. | — |
| M18 | Admin | ✅ | Llega. | — |
| M19 | Admin | ✅ | Hecho: se agregó `_notificar_acta_alumno` (antes `_notificar_acta_conducta`, que solo avisaba actas de tipo conducta → por eso faltaban) y `_notificar_acta_docente` (no existía). Ahora admin/directivos reciben las **3 distintas**: "Acta de curso", "Acta de estudiante" y "Acta de docente". Test en transacción: los 8 directivos reciben las de estudiante y docente. | `views.py` |
| M20 | Director | ✅ | Ok. | — |

---

## BAJA — Cosas que faltan implementar / mejorar

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| B1 | Preceptor | ✅ | Hecho: el error "No se pudieron cargar los libros de temas" era porque `LibroTemasPreceptor` enviaba `curso=<nombre>` ("1°1") y el backend espera el **id** (500 `ValueError`). Ahora resuelve `id_curso` desde `cursosObj`. La G4 ya estaba aplicada. | `LibroTemasPreceptor.jsx` |
| B2 | Preceptor | ✅ | Hecho: al intentar marcar **Presencia** hoy a un docente fuera de su horario, el backend devuelve un mensaje **claro y sin llaves/comillas/tecnicismos** (views.py:4199-4204: "El docente no tiene clases programadas en este momento."), y el frontend lo exhibe con `mensajeErrorAmigable` (G3). Build OK. | `views.py`, `Preceptores/asistencias.jsx` |
| B3 | Preceptor | ✅ | Hecho: además de corregir la carga (id de curso), se agregó un **selector de materia** del curso; al elegirla se ven **todos sus libros** (filtrando por materia), con el **más reciente arriba** (fecha y hora descendente). El selector global sigue filtrando por curso. Build OK. | `LibroTemasPreceptor.jsx` |
| B4 | Jefe | ✅ | Hecho: `EstadisticasPreceptoria.jsx` rediseñado con **panel de cobertura** (cursos con preceptor %, barra de progreso), tarjetas-kpi (total preceptores, cursos con/sin preceptor, alumnos, tutores) y chips dinámicos. Build OK. | `EstadisticasPreceptoria.jsx` |
| B5 | Jefe | ✅ | Hecho: `SupervisionPreceptores.jsx` rediseñado con `ProgresoTarea` (barra de progreso + # de # + badges "Completado"/"Faltan N"/"Sin clase hoy"). La info-box ahora explica las tareas reales del preceptor: tomar asistencia de **docentes** por la mañana y verificar que los docentes **registren sus asistencias de estudiantes** (ya no muestra "asistencia de estudiantes tomada por el preceptor" como carga directa). Se quitó el texto de "último acceso" del render. Build OK. | `SupervisionPreceptores.jsx` |
| B6 | Jefe | ✅ | Hecho: era bug de backend. El usuario jefe de prueba tiene también el rol `familia` y `AlumnoViewSet.get_queryset` lo restringía a los hijos de su tutor (sin tutor → lista vacía). Ahora los roles amplios (`es_rol_amplio`: admin/director/jefe_preceptores/preceptor) se evalúan **antes** que familia/docente. Verificado vía API: el jefe ve **274 alumnos**. | `views.py` (`AlumnoViewSet.get_queryset`), `JefePreceptores/` (estudiantes) |
| B7 | Jefe | ✅ | Ok. | — |
| B8 | Jefe | ✅ | Ok. | — |
| B9 | Jefe | ✅ | Hecho: `docentes-disponibles` no aceptaba el rol `jefe_preceptores` (403 → lista vacía); ahora sí. En el panel de asistencias se **muestra el día de hoy por defecto** y, en modo solo lectura, desaparece el texto "Elegí una fecha…" (se ve un aviso de solo visualización). Verificado vía API: el jefe ve **59 docentes**. | `views.py` (`docentes_disponibles`), `Preceptores/asistencias.jsx` |
| B10 | Alumno/Jefe/Admin | ✅ | Funciona. | — |
| B11 | Preceptor | ✅ | Funciona. | — |
| B12 | Preceptor | ✅ | Hecho: dos lógicas agregadas en `enviar_carga_unica` sobre la carga única: <br>- Si el docente **sigue en horario de su clase** → el botón solo envía un **recordatorio** (cargar antes de que termine el horario) **sin activar temporizador** (backend responde `recordatorio: true`). <br>- Si el docente **no cargó en su horario** → se notifica a **los preceptores del curso+materia** ("no se cargaron asistencias/libro de temas en el horario"; backend responde `destinatarios: 'preceptores_curso'`). La notificación lleva `nav` `gestion_diaria` con `curso`/`anio`, y el dashboard del preceptor aplica esos params (filtro) para que **Ver** abra el panel diario de ese curso. <br>- El frontend (`GestionDiaria.toggleCargaUnica`) ahora maneja las **3 ramas** del backend: `recordatorio` → toast informativo sin temporizador; `destinatarios === 'preceptores_curso'` → toast de aviso a preceptores sin temporizador; flujo original → ventana de 20 min con temporizador. Build OK. Pendiente: verificar los flujos en el navegador. | `views.py` (`enviar_carga_unica`), `GestionDiaria.jsx`, `PreceptorDashboard.jsx`, `navDestinos.js` |
| B13 | Performance | ✅ | Hecho (root cause global eliminado): el arranque/refresco del `DataContext` descargaba **toda la tabla de asistencias** (la petición más pesada: unbounded, sin paginación ni filtros) dentro del `Promise.all` global, en cada montaje y en cada guardado. Se reemplazó por `Promise.resolve([])` **en la misma posición 8** (manteniendo el "map" posicional 25↔25; `asistenciasRaw` y `asistenciasAdmin/Familia` siguen intactos). Verificado por grep que **0 componentes consumen `data.asistencias`/`asistenciasAdmin`/`asistenciasFamilia`**; los paneles cargan por curso/fecha/materia con sus endpoints. El N+1 del backend ya estaba cacheado por request (`_resolver_modulo`) – no era eso. Build OK. | `DataContext.jsx`, `views.py` |
| B14 | Performance | ✅ | Se cubre con el mismo cambio que B13: al eliminar la descarga global de toda la tabla de asistencias, la carga de los paneles de asistencia del preceptor deja de esperar la bajada completa en el arranque global. El `refreshData()` global (que se dispara tras cada guardado) tampoco vuelve a pedirla. Build OK. | `DataContext.jsx` |
| B15 | Performance | ✅ | Hecho (cubierto cruzadamente por B13/B14 = misma causa raíz): lo que hacía lenta la creación/edición de alumnos era el **refresco global tras cada guardado**, que disparaba la bajada completa de la tabla de asistencias (la petición más pesada, unbounded). Al reemplazarla por `Promise.resolve([])` en el `DataContext`, el guardado de un alumno ya no espera esa descarga. Pendiente: confirmación visual en el navegador. | `DataContext.jsx` (mismo cambio que B13/B14), `Preceptores/alumnos.jsx` |

---

## RESUMEN POR COMPONENTE (referencia)

| Archivo | Issues | Estado |
|---|---|---|
| `Preceptores/tutores.jsx` | C2 | ✅ corregido (crash al seleccionar alumno) |
| `Preceptores/docentes.jsx` | C3, A24 | ✅ C3 corregido (materias filtradas + permiso curso-materia + asignaciones validadas); A24 corregido (admin excluido de docentes + `admin_prueba` con los 7 roles) |
| `Notificaciones.jsx` + backend | C1, M12 | ✅ contador por hijo corregido (C1); agrupación por día/tema hecha (G6/M12), falta confirmación visual |
| `Administracion/docentes.jsx` | A5, A13 | ✅ verificar corregido (mapeo planificaciones) + acciones reorganizadas |
| `Administracion/cursos.jsx` + backend | A15 | ✅ filtro `activo` solo en `list` (reactivar OK) |
| `Administracion/CalendarioInstitucional.jsx` + modelo | A26 | ✅ nuevo alcance `sin_bloqueo` (no un tipo de evento) |
| `PanelMateriasAdeudadasDocente.jsx` / `ActividadesView.jsx` | A4 | ✅ intensificación + formato alumno/familia + filtro global |
| `Preceptores/actas.jsx` | A19, M13 | ✅ actas de curso sin actas de alumnos + sin filas en blanco |
| `LibroTemasPreceptor.jsx` / `GestionDiaria.jsx` | B1, B3, B12 | ✅ B1/B3 resueltos (carga por id de curso + filtro por materia); B12 completo (recordatorio / preceptores_curso / ventana 20 min + nav al panel) |
| `JefePreceptores/` (estudiantes) | B6 | ✅ muestra el listado (roles amplios antes que familia) |
| `JefePreceptores/` (asistencia docentes) | B9 | ✅ rol jefe en `docentes-disponibles` + día de hoy por defecto |
| `EstadisticasPreceptoria.jsx` | B4 | ✅ panel de cobertura + kpis + chips dinámicos (build OK) |
| `SupervisionPreceptores.jsx` | B5 | ✅ `ProgresoTarea` + info-box real de tareas, sin "último acceso" (build OK) |
| `notifications.py` | M1, M8, M9, M16, M19 | ✅ mensaje/tipo de acta (M9), tabla vaciada (M8), actas de estudiante/docente (M16, M19); solo falta verificación visual de M1 |
| `Shared/` (menú responsive) | A23 | ✅ menú hamburguesa + drawer en mobile |
| `PanelAsistencia.jsx` | B13, B14 | ✅ ya no espera la bajada global de toda la tabla de asistencias |
| `Preceptores/alumnos.jsx` | B15 | ✅ guardado de alumno sin descarga global de asistencias (mismo cambio B13/B14) |

---

## CONTADOR (estado de la ronda 2)

| Prioridad | Total | Hecho ✅ | Falló / falta ❌ | Parcial ⚠️ |
|---|---|---|---|---|
| Crítico | 7 | 7 | 0 | 0 |
| Alta | 26 | 26 | 0 | 0 |
| Media | 20 | 19 | 0 | 1 |
| Baja | 15 | 15 | 0 | 0 |
| **Total** | **68** | **67** | **0** | **1** |

> Nota: los puntos marcados ⚠️ funcionan parcialmente pero tienen un faltante concreto (ver detalle en cada fila). Los contadores reflejan el estado de esta verificación.

---

## REGISTRO DE CAMBIOS REALIZADOS (ronda 2)

> Última actualización: 2026-09-24

- **Críticos C1–C3**: contador de notificaciones por hijo; crash de "Nuevo Tutor" (`TutoresAlumnosEditor`); materias filtradas por curso + permiso `PuedeGestionarCursoMateria` para preceptor (+ validación de asignaciones).
- **A3**: los comunicados se filtran por curso+materia (alcances e `id_materia`).
- **A4**: materias adeudadas (previa **e intensificación**) visibles para docente/alumno/familia, con diferenciación visual (rojo/naranja), detalle clickeable y filtro global (curso/hijo).
- **A5 + A13**: "Marcar como verificado" de planificaciones corregido (mapeo `id_planificacion`/`estado`) y celda de acciones reorganizada.
- **A6**: la DDJJ verificada se muestra en el panel del docente.
- **A7**: la carga de notas notifica **una por nota (por alumno)** a directivos y preceptores.
- **A15**: reactivar cursos corregido (filtro `activo` solo en el listado).
- **A19 + M13**: actas de curso sin actas de alumnos (jefe/preceptor) y sin filas en blanco.
- **A23**: menú hamburguesa responsive (drawer lateral con submenús verticales) en todos los roles; en PC no cambia.
- **A24**: el admin ya no aparece en la lista de docentes.
- **A25**: mensajes de error abreviados y con mayor tiempo en pantalla (8 s).
- **A26**: "No se cancelan las clases" pasó a ser un **alcance** (`sin_bloqueo`), no un tipo de evento.
- **Globales G1–G7**: cierre de formularios, auto-refresco tras acciones, mensajes entendibles, navegación de desplegables, leyenda de acciones unificada, agrupación de notificaciones y separación alumno/familia.

### Media (ronda 2)

- **M8**: se vació la tabla `notificaciones` (12.189 filas) para arrancar de cero; A1 (segmentación por rol) evita que vuelvan a llegar notifs de otros segmentos.
- **M9**: `_notificar_acta_curso` ya no antepone "un acta de" (salía "acta de Acta de evaluación"); además se corrigió un `tipos_acta` duplicado con mojibake (`Acta de evaluaciÃ³n`, id 5) → sus 2 actas se reasignaron a `Acta de evaluación` (id 2) y se eliminó el duplicado.
- **M16**: `ActaDocenteViewSet` ahora notifica las actas de docente (`_notificar_acta_docente`): al docente, preceptores de sus cursos (titular o suplente), jefes y directivos, **nunca al autor**.
- **M19**: `_notificar_acta_alumno` (antes `_notificar_acta_conducta`, que solo avisaba conducta) y `_notificar_acta_docente`; los directivos/admin reciben las 3 actas distintas: "Acta de curso", "Acta de estudiante" y "Acta de docente".
- **M3**: verificado `_notificar_recursada` ("Recursada cargada" y "Resultado de recursada") hacia el alumno y sus familias.
- **Bug E21 (2)**: `_notificar_acta_curso` fallaba con `NameError` (`SEGMENTO_ALUMNO`/`SEGMENTO_FAMILIA` sin importar) y con `ValueError` (`id_alumno` recibía un int en vez de la instancia `Alumno`). Ambos corregidos; el flujo de acta de curso generó 45 notifs en test (18 alumnos con vínculo académico, 15 familiares como personales, + preceptores/jefes/directivos).

### Cierre de pendientes (ronda 2, 2026-09-24)

- **A24**: se asignaron a `admin_prueba` los **7 roles** (`usuario_roles`) para que el botón "Cambiar rol" aparezca y funcione; verificado por API (`POST /api/login/` → 7 roles).
- **M4**: aclarado que "bloqueo de horarios" = evento **E19** (bloqueo por superposición de horario). Verificado `_notificar_bloqueo_horario` en transacción: notifica al alumno (1) + 5 familiares.
- **M12**: agrupación día/tema verificada por código (`Notificaciones.jsx` + CSS); build OK. Falta solo confirmación visual del cliente.
- **B12**: frontend `toggleCargaUnica` reescrito para las **3 ramas** del backend (`recordatorio` / `preceptores_curso` / ventana 20 min) sin arrancar temporizador en las dos primeras. Además la notificación a preceptores ahora lleva `nav` `gestion_diaria` con `curso`/`anio` (nuevo destino en `navDestinos.js`), y `PreceptorDashboard` aplica esos params para que **Ver** abra el panel diario del curso. Build OK.
- **B13/B14/B15 (performance)**: se corrigió además la desestructuración del `Promise.all` global en `DataContext.jsx` (faltaba `asistenciasRaw`, lo que rompía el login con `ReferenceError`). Backend con `runserver` limpio (`check`: 1 silenciado por W342, falso positivo de `UsuarioRol`).