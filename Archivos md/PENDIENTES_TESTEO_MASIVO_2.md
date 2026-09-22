# Pendientes del Testeo Masivo — Ronda 2 (Verificación del cliente)

Verificación del cliente de la ronda anterior (C1-A26, M1-M20, B1-B15). Cada punto indica lo que aún falta corregir según la prueba real del usuario.

**Leyenda de estado:**
- ✅ = Funciona correctamente
- ❌ = Falló / falta corregir
- ⚠️ = Funciona parcialmente (algo falta)

---

## GLOBALES / TRANSVERSALES (se aplican a todos los usuarios)

| # | Regla | Qué se espera |
|---|---|---|
| G1 | **Cerrar formularios al guardar** | Cada vez que se hace "Guardar/Crear/Eliminar" o se termina cualquier acción dentro de un formulario, el formulario debe cerrarse automáticamente. Aplica a TODOS los formularios de TODOS los usuarios (A20). |
| G2 | **Auto-actualización tras cada acción** | Cualquier acción que modifique datos (crear, editar, quitar rol, asignar, borrar) debe actualizar automáticamente las listas/tablas para que el cambio se vea reflejado de inmediato. Global (A17, A22). |
| G3 | **Mensajes de error entendibles** | Los errores deben explicar en lenguaje simple qué pasó y qué hacer, SIN llaves, comillas, claves técnicas ni JSON. Aplica a todos los mensajes de la página, en todos los usuarios (B2). |
| G4 | **Navegación cerrando/abriendo desplegables** | Al apretar un botón que redirige, se debe cerrar el desplegable actual, abrir el del apartado destino y mostrar el contenido. Aplica a todos los botones que redireccionan, en todos los usuarios (B1). |
| G5 | **Leyenda de emojis de botones consistente** | La leyenda con emojis que explica las acciones debe verse igual en todos los apartados que usan los mismos botones. Si un apartado tiene 3 botones en vez de 4, mostrar solo las 3 leyendas correspondientes, con la misma visual (A14). |
| G6 | **Notificaciones agrupadas / acumulables** | Idea general: en vez de una notificación por cada carga/actualización, agrupar en un mismo espacio las relacionadas (p. ej. notas de matemática cargada → actualizada → actualizada de nuevo), que se acumulen debajo de la anterior, se puedan expandir para ver todas, y las nuevas queden arriba de todo. Pensar mejor el diseño para no llenar de notificaciones en un mismo día (M12). |
| G7 | **Separación notificaciones alumno vs familia** | Las notificaciones del familiar deben separarse: en el apartado de notificaciones del **estudiante** solo van las académicas; en las **personales** del familiar van las suyas. Las que no aparezcan en las del estudiante figuran en personales (M1). |

---

## CRÍTICO — No funciona nada / crashea la página

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| C1 | Familia | ❌ | El contador de **notificaciones nuevas** no descuenta bien: al apretar "Marcar todas como leídas" bajan algunas pero no la cantidad correcta. Además el número debe cambiar **por hijo** (cada hijo tiene su propio contador). | `Notificaciones.jsx`, backend notificaciones |
| C2 | Preceptor | ❌ | El botón "Nuevo Tutor" se puede apretar, pero **al seleccionar un alumno se crashea de nuevo**. | `Preceptores/tutores.jsx` |
| C3 | Preceptor | ❌ | En **asignaciones (curso-materia)** del nuevo docente aparecen TODAS las materias de la BD; solo debe mostrar las del curso seleccionado. Al crearlo tira un error pero **igual lo crea**, y lo creado **no aparece en la lista**. | `Preceptores/docentes.jsx` |
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
| A3 | Docente | ⚠️ | Funciona, pero **sigue el filtro cruzado**: si se selecciona 1°1 Matemática, muestra comunicados de 1°1 Prácticas del Lenguaje. No es tan grave, pero ideal corregir. | `ComunicadosView.jsx`, selector global |
| A4 | Docente/Alumno/Familia | ❌ | - En **docente** funciona. <br>- En **alumno** debe estar en el desplegable "Contenidos". <br>- Solo funciona para **previa**; falta que aparezca cuando el alumno está en condición de **intensificación**. <br>- Diferenciar mejor visualmente actividades de **intensificación** vs **previas**. <br>- En **familia**, al pasar a "materias adeudadas" no toma el selector global para filtrar, y no deja presionar las actividades. <br>- En **alumno**, las materias adeudadas deben tener el mismo formato que en familia. <br>- El mismo problema de filtro aplica a todos los usuarios que ven la sección. | `PanelMateriasAdeudadasDocente.jsx`, `ActividadesView.jsx`, Alumno/Familia |
| A5 | Docente | ❌ | El botón "Marcar como verificado" está, pero al apretarlo figura **"no encontrado"** y no verifica. Mejorar distribución para que no choque con el botón "Ver" ni con el mensaje de "borrador". | `Administracion/docentes.jsx`, backend verificar |
| A6 | Docente | ⚠️ | El botón de verificar DDJJ está y funciona. **Falta** que al docente le aparezca en su pantalla (donde carga la DDJJ) que está **verificada**. | `Profesores/` (panel DDJJ) |
| A7 | Docente/Admin | ❌ | Le llega una notificación general "se cargaron las notas de la materia" en vez de **una notificación por nota** (por alumno). | `notifications.py`, `PanelAlumnos.jsx` |
| A8 | Preceptor | ✅ | Funciona correctamente. | — |
| A9 | Preceptor | ✅ | Funciona correctamente. | — |
| A10 | Preceptor | ✅ | Funciona correctamente. | — |
| A11 | Preceptor | ✅ | Funciona correctamente. (Info: en la BD los DNIs viejos están sin puntuación; solo informativo, no tocar BD salvo indicación.) | — |
| A12 | Admin | ✅ | Creó bien los botones de acción de alumnos. | — |
| A13 | Admin | ❌ | Se agregaron los botones, pero están **muy mal distribuidos** en el espacio ("tema anchor"). Reordenar para que todos los botones queden bien proporcionados, sin ocupar demasiado alto ni ancho. | `Administracion/docentes.jsx` |
| A14 | Admin | ⚠️ | Funciona. Falta aplicar la G5: la **leyenda de emojis** de los botones de acción debe verse igual que en este apartado en los demás apartados con los mismos botones (si hay 3 botones, solo 3 leyendas, misma visual). | Todos los paneles con acciones |
| A15 | Admin | ❌ | El botón "Reactivar" está, pero al apretarlo da **"No curso matches the given query."** y no reactiva. | `Administracion/cursos.jsx`, backend |
| A16 | Admin | ✅ | Corregido. | — |
| A17 | Jefe | ⚠️ | Funciona, pero se debe aplicar G2: al **quitar/agregar** un curso a un preceptor, todas las tablas relacionadas deben actualizarse automáticamente. | `JefePreceptores/AsignacionCursos.jsx` |
| A18 | Jefe | ✅ | Deja crear un preceptor correctamente. | — |
| A19 | Jefe | ❌ | Se entendió mal: debe mostrar **los tres apartados** (Actas de estudiantes, Actas de docentes, Actas de curso). El problema real era que en "Actas de curso" aparecían **actas de estudiantes** (deben estar separadas). Además ahora la tabla que quedó tiene **2 filas en blanco** inútiles. | `JefePreceptores/` (sección actas), `Preceptores/actas.jsx` |
| A20 | Jefe | ⚠️ | Lo hizo correctamente. Queda aplicar **G1** (cerrar formularios tras guardar) en todos los formularios de todos los usuarios. | Todos los formularios |
| A21 | Preceptor | ✅ | Funciona. | — |
| A22 | Director/Admin | ⚠️ | Funciona, pero se debe aplicar **G2**: al quitar un rol, la lista de usuarios sin ese rol debe actualizarse automáticamente. | `Administracion/administradores.jsx` |
| A23 | Responsive | ❌ | Los desplegables se abren **hacia la derecha, de forma horizontal**, y no se puede ver lo que contienen. Implementar otra forma en **responsive**: un **menú de barras** (hamburguesa) que al apretarlo muestre los lugares de navegación. En navegador de pc debe seguir igual. | `Shared/` (menú/sidebar) |
| A24 | Preceptor/Admin | ❌ | - Aparecen **materias que no son del curso** en el selector; filtrar por curso. <br>- Hay un usuario que es **admin pero aparece en docentes**. <br>- Al ingresar como ese usuario **no deja cambiar de rol** (admin_prueba, usuario 123). | `Preceptores/docentes.jsx`, roles |
| A25 | Preceptor | ⚠️ | Funciona bien, pero el mensaje de error es **muy largo** y permanece **muy poco tiempo** en pantalla. | `Shared/AdelantosHoras.jsx` |
| A26 | Admin | ❌ | Se hizo mal: NO debe agregar un nuevo **tipo de evento** "No se cancelan las clases". Debe crear un nuevo **alcance horario** que implique que **no haya ningún bloqueo** en la plataforma. | `CalendarioInstitucional.jsx`, modelo eventos |

---

## MEDIA — Funciona parcialmente / notificación faltante

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| M1 | Alumno/Familia | ❌ | No le llega la notificación de **actas de curso** a la familia ni al alumno. Al familiar le debe llegar en el apartado **personales**. Aplicar **G7**: separar notificaciones del alumno (académicas) de las personales del familiar. | `notifications.py` |
| M2 | Alumno/Familia | ✅ | Ok. | — |
| M3 | Alumno/Familia | ❌ | Sin testear. | — |
| M4 | Alumno/Familia | ❌ | No se entiende a qué evento se refiere "bloqueo de horarios"; se necesitan datos más específicos para comprobarlo. | — (pendiente aclaración) |
| M5 | Alumno | ✅ | Funciona. | — |
| M6 | Alumno/Familia | ✅ | Ok. | — |
| M7 | Familia | ✅ | Se ven. | — |
| M8 | Docente | ⚠️ | Arreglado. **Queda eliminar las notificaciones viejas** (las que ya no deberían llegar). | notifications, limpieza |
| M9 | Preceptor | ❌ | La notificación de acta salió "Se cargo un acta de acta de evaluación" para el curso 1°1: **duplica "acta"** y tiene **error de tilde** en "evaluación". | `notifications.py` |
| M10 | Preceptor | ✅ | Arreglado. | — |
| M11 | Preceptor | ✅ | Arreglado. | — |
| M12 | Preceptor | ⚠️ | El anti-spam está bien. Aplica la idea **G6**: agrupar/acumular notificaciones del mismo tema en una misma tarjeta expandible, con las nuevas arriba. Pensar mejor el diseño para más organización. | `notifications.py`, `Notificaciones.jsx` |
| M13 | Preceptor | ❌ | Mismo error que en jefe (A19): en la lista de **actas de curso** de preceptores aparecen filtradas **actas de alumnos** (solo deben verse en la lista de actas de alumno) y hay **filas en blanco** sin contenido. | `Preceptores/actas.jsx` |
| M14 | Jefe | ✅ | Llega bien. | — |
| M15 | Jefe | ✅ | Llega bien. | — |
| M16 | Jefe | ❌ | Era que **las actas de docente no llegaban**. Si se le hace un acta al docente, debe llegarle al docente y de **preceptor para arriba** (preceptor, jefe, directivos), con las reglas: preceptores solo si el docente está en su cargo, y al propio autor nunca. | `notifications.py` |
| M17 | Admin | ✅ | Llega. | — |
| M18 | Admin | ✅ | Llega. | — |
| M19 | Admin | ❌ | Llega únicamente el **Acta de curso**. Deben llegar los **tres tipos de actas** en notificaciones distintas: faltan las de **estudiantes** y las de **docentes**. | `notifications.py` |
| M20 | Director | ✅ | Ok. | — |

---

## BAJA — Cosas que faltan implementar / mejorar

| # | Rol | Estado | Problema / Verificación y qué falta | Dónde |
|---|---|---|---|---|
| B1 | Preceptor | ⚠️ | El botón "Ver" de libro de temas funciona, pero el apartado muestra **"No se pudieron cargar los libros de temas."**. Aplicar **G4**: al apretar "Ver" se debe cerrar el desplegable actual, abrir el del libro de temas y mostrar el contenido. | `LibroTemasPreceptor.jsx`, `GestionDiaria.jsx` |
| B2 | Preceptor | ⚠️ | Funciona lo de fechas. Al intentar marcar **Presencia** hoy a un docente fuera de su horario, salta un error: el mensaje debe ser **claro y sin llaves/comillas/tecnicismos**, explicando solo qué pasó. Aplicar **G3** a todos los mensajes. | `Preceptores/asistencias.jsx` |
| B3 | Preceptor | ❌ | Salta el mismo error de "No se pudieron cargar los libros de temas". Debe poder ver **todos los libros subidos de la materia**, con el **más reciente arriba**, tomando el **selector global como filtro** (select primero la materia). | `LibroTemasPreceptor.jsx` |
| B4 | Jefe | ❌ | No se agregó ningún dato (se borró el texto). Si no hay más datos, hacer el apartado **más dinámico**, que se vea mejor y **rellene más el espacio**. | `EstadisticasPreceptoria.jsx` |
| B5 | Jefe | ⚠️ | Funciona. Corregir: el preceptor **no carga asistencias de estudiantes**; sus tareas diarias son tomar asistencia a los **docentes** y verificar que suban **libro de temas** y tomen sus asistencias. **Eliminar "último acceso"**. Hacerlo más dinámico y visualmente agradable. | `SupervisionPreceptores.jsx` |
| B6 | Jefe | ❌ | Ahora **no muestra el listado de estudiantes** en jefe de preceptores. | `JefePreceptores/` (estudiantes) |
| B7 | Jefe | ✅ | Ok. | — |
| B8 | Jefe | ✅ | Ok. | — |
| B9 | Jefe | ❌ | No debe tomar todo el componente de preceptores tal cual. El jefe **no toma asistencia**, así que **no debe aparecer** el texto "Elegí una fecha para ver los docentes con clase ese día. Hoy figura primero. Las fechas futuras permiten registrar faltas anticipadas." Con fecha de hoy dice que **no hay docentes** cuando sí los hay (debe mostrar varios). Si no se selecciona fecha, mostrar los del día de hoy. | `JefePreceptores/` (asistencias docentes) |
| B10 | Alumno/Jefe/Admin | ✅ | Funciona. | — |
| B11 | Preceptor | ✅ | Funciona. | — |
| B12 | Preceptor | ⚠️ | El botón funciona (envía notificación y activa temporizador). Agregar dos lógicas: <br>- Si el docente **sigue en horario de su clase**, el botón solo envía un **recordatorio** (cargar antes de que termine el horario) **sin activar temporizador**. <br>- Si el docente **no cargó en su horario**, al preceptor del curso+materia debe llegarle una notificación de "no se cargaron asistencias/libro de temas en el horario"; al apretar **Ver**, lo lleva al panel diario. | `GestionDiaria.jsx`, `carga_unica.py` |
| B13 | Performance | ❌ | Verificar más casos de errores que ralentizan la página: por ejemplo **cargar asistencias tarda un montón** también. | PanelAsistencia / asistencias |
| B14 | Performance | ❌ | **Sigue tardando bastante** la carga de asistencias. | `PanelAsistencia.jsx` |
| B15 | Performance | ❌ | **Tarda** la creación/edición de alumnos. | `Preceptores/alumnos.jsx` |

---

## RESUMEN POR COMPONENTE (referencia)

| Archivo | Issues | Estado |
|---|---|---|
| `Preceptores/tutores.jsx` | C2 | ❌ crashea al seleccionar alumno |
| `Preceptores/docentes.jsx` | C3, A24 | ❌ materias sin filtrar + aparece admin en docentes + no deja cambiar rol |
| `Notificaciones.jsx` + backend | C1, M12 | ❌ contador por hijo + agrupación |
| `Administracion/docentes.jsx` | A5, A13 | ❌ "no encontrado" al verificar + distribución |
| `Administracion/cursos.jsx` + backend | A15 | ❌ "No curso matches the given query." |
| `Administracion/CalendarioInstitucional.jsx` + modelo | A26 | ❌ alcance horario en vez de tipo de evento |
| `PanelMateriasAdeudadasDocente.jsx` / `ActividadesView.jsx` | A4 | ❌ intensificación + formato alumno/familia + filtro global |
| `Preceptores/actas.jsx` | A19, M13 | ❌ filas de alumnos en actas de curso + filas en blanco |
| `LibroTemasPreceptor.jsx` / `GestionDiaria.jsx` | B1, B3, B12 | ❌ libros no cargan + lógica recordatorio/temporizador + G4 |
| `JefePreceptores/` (estudiantes) | B6 | ❌ no muestra el listado |
| `JefePreceptores/` (asistencia docentes) | B9 | ❌ texto/horario incorrectos + mostrar hoy por defecto |
| `EstadisticasPreceptoria.jsx` | B4 | ❌ más dinámico y que rellene espacio |
| `SupervisionPreceptores.jsx` | B5 | ⚠️ quitar "último acceso", más visual |
| `notifications.py` | M1, M8, M9, M16, M19 | ❌ separación alumno/familia, limpieza, duplicación "acta de acta", actas de docente, 3 tipos de actas |
| `Shared/` (menú responsive) | A23 | ❌ menú de barras en mobile |
| `PanelAsistencia.jsx` | B13, B14 | ❌ sigue tardando |
| `Preceptores/alumnos.jsx` | B15 | ❌ tarda |

---

## CONTADOR (estado de la ronda 2)

| Prioridad | Total | Hecho ✅ | Falló / falta ❌ | Parcial ⚠️ |
|---|---|---|---|---|
| Crítico | 7 | 4 | 3 | 0 |
| Alta | 26 | 10 | 9 | 7 |
| Media | 20 | 11 | 7 | 2 |
| Baja | 15 | 4 | 7 | 4 |
| **Total** | **68** | **29** | **26** | **13** |

> Nota: los puntos marcados ⚠️ funcionan parcialmente pero tienen un faltante concreto (ver detalle en cada fila). Los contadores reflejan el estado de esta verificación.