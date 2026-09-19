# Guía de Testeo — Mi Secundaria 7

Guía completa para probar todas las funcionalidades de la página, organizada por usuario/rol, incluyendo la lógica de notificaciones (quién recibe qué).

---

## 0. Preparación

### Usuarios de prueba (extraídos de la base de datos real)

> **Todas las contraseñas son `123`** (verificado contra la DB). Usuarios con el sufijo `_prueba`.

**Directivos / gestión:**

| Usuario | Contraseña | Rol | Persona asociada |
|---|---|---|---|
| `admin_prueba` | `123` | Administrador | Directivo Prueba Admin (cargo Administrador) |
| `director_prueba` | `123` | Director (+ admin + familia) | Directivo/Tutor User Test (cargo Administrador) |
| `vicedirector1_prueba` | `123` | Director | Méndez Laura (Vicedirectora) |
| `vicedirector2_prueba` | `123` | Director | Ríos Pablo (Vicedirector) |
| `secretario_prueba` | `123` | Director | Torres Silvia (Secretaria) |
| `jefe_preceptores_prueba` | `123` | Jefe de Preceptores | Benítez Carolina (Jefa de Preceptores) |

**Preceptores:** cada uno tiene cursos asignados según el patrón de la tabla.

| Usuario | Contraseña | Rol | Persona asociada | Cursos a su cargo |
|---|---|---|---|---|
| `preceptor_1_prueba` | `123` | Preceptor (+ docente + tutor) | Gómez Federico | 1°1, 1°2, 1°3 |
| `preceptor_2_prueba` | `123` | Preceptor | Pérez Lucía | 2°1, 2°2, 2°3 |
| `preceptor_3_prueba` | `123` | Preceptor | Fernández Martín | 3°1, 3°2, 3°3 |
| `preceptor_4_prueba` | `123` | Preceptor | Acosta Andrea | 4°1, 4°2, 4°3 |
| `preceptor_5_prueba` | `123` | Preceptor | Navarro Nicolás | 5°1, 5°2, 5°3 |
| `preceptor_6_prueba` | `123` | Preceptor | Suárez Paula | 6°1, 6°2, 6°3 |

**Docentes:** `docente_01_prueba` … `docente_46_prueba` (`123`). Seleccionar uno con asignaciones reales:

| Usuario | Materias asignadas (ejemplos) |
|---|---|
| `docente_01_prueba` | 1°1 Prácticas del lenguaje · 2°3 Educación Física · 4°1 Física · 5°2 Química (roles: admin + docente + jefe) |
| `docente_02_prueba` | 1°1 Matemática · 2°3 Educación Artística · 4°1 NTICx · 5°2 Economía (roles: docente + jefe) |
| `docente_03_prueba` | 1°1 Ciencias Naturales · 2°3 Ciudadanía · 4°1 Psicología · 5°2 Derecho (solo doc.) |
| `docente_04_prueba` | 1°1 Ciencias Sociales · 2°3 Inglés · 4°2 Matemática (solo doc.) |
| `docente_05_prueba` | 1°1 Educación Física · 2°3 Biología · 4°2 E.F. · 5°3 Matemática (solo doc.) |
| `docente_09_prueba` | 1°2 Prácticas del lenguaje · 3°1 Prácticas del lenguaje (solo doc.) |
| `docente_10_prueba` | 1°2 Matemática · 3°1 Matemática (solo doc.) |

**Alumnos / familias:** `alumno_001_prueba`…`alumno_270_prueba` y `familia_001_prueba`…`familia_120_prueba` (`123`). Preferidos para este testeo:

| Usuario | Contraseña | Rol | Persona asociada | Datos precargados |
|---|---|---|---|---|
| `alumno_001_prueba` | `123` | Alumno | Prueba001 Alumno001 (1°1) | 4 calificaciones, 3 asistencias |
| `alumno_002_prueba` | `123` | Alumno | Prueba002 Alumno002 (1°1) | 2 calificaciones, 3 asistencias |
| `familia_002_prueba` | `123` | Familia | Familia002 José (tutor de Alumno001 y Alumno002) | — |
| `familia_001_prueba` | `123` | Familia | Familia001 María (tutor de Alumno121 de 3°3 y Alumno241 de 6°2) | — |

**Extras (creados desde la UI, útiles para verificar los flujos de alta):** `alumno_nuevo_prueba` (Manuel Pepe, 1°1), `Jefe_preceptores` (GIrnalda Ana), `nuevo_admin` (Admin Nuevo).

### Datos de prueba (confirmados en la DB)

- **Cursos activos**: los 18 cursos de 1° a 6° división 1-3 (1°1 … 6°3), ~15 alumnos por curso (270 alumnos en total).
- **Preceptores por curso**: 1° → Gómez Federico · 2° → Pérez Lucía · 3° → Fernández Martín · 4° → Acosta Andrea · 5° → Navarro Nicolás · 6° → Suárez Paula.
- **Docentes**: `docente_01_prueba` … `docente_46_prueba`, cada uno con 4 asignaciones (curso/materia). Ej.: Matemática de 1°1 → `docente_02_prueba`; Prácticas del lenguaje de 1°1 → `docente_01_prueba`.
- **Tutores**: `familia_00N_prueba` suelen tener 3 hijos vinculados (uno de 1°, uno de 3°, uno de 6°) para probar el selector.

### Reglas generales para el testeo de notificaciones

1. El poll de notificaciones del frontend se ejecuta **cada 30 segundos**. Si no aparece una notificación, esperar hasta 30 s o **refrescar la página**.
2. Al hacer clic en **"Ver"** de un toast/campana, debe navegar a la sección correcta según el rol (ej. calificación → sección Calificaciones).
3. La **deduplicación anti-spam** bloquea notificaciones idénticas al mismo usuario dentro de 5 minutos. Para probar una misma acción 2 veces seguidas, cambiar el contenido (ej. distinta nota, distinto alumno, distinto mensaje).
4. Los **limitadores diarios y por hora están desactivados** (por pedido del cliente, comentados en `backend/proyecto/escuela/notifications.py`). En este ciclo de testeo las notificaciones no se bloquean por cantidad.
5. El filtro `?id_alumno=` en la campana solo muestra los hijos permitidos de la familia logueada.

---

## 1. Alumno — `alumno_001_prueba` / `123`

**Iniciar sesión → Seleccionar rol "Alumno"** (si el sistema lo pide).

| # | Acción a realizar | Qué revisar |
|---|---|---|
| 1 | Entrar a **Perfil** | Que muestre sus datos (Prueba001 Alumno001), curso 1°1. |
| 2 | Entrar a **Calificaciones** | Que vea las notas cargadas (tiene 4 calificaciones precargadas). Probar filtros por período. |
| 3 | Entrar a **Asistencias** | Que vea el listado de asistencias (Presente/Ausente/Tarde) por fecha y materia. |
| 4 | Entrar a **Actividades** | Que vea las actividades publicadas por el docente en sus materias; probar abrir el detalle y descargar/ver adjuntos si hay. |
| 5 | Entrar a **Horarios** | Que vea el horario de su curso (materia, día, módulo, aula). |
| 6 | Entrar a **Comunicados** | Que vea comunicados "General" y del curso 1°1; revisar detalle, autor, fecha y adjuntos. |
| 7 | Entrar a **Calendario Institucional** | Que vean los eventos/feriados/suspensiones publicados. |
| 8 | **Campana de notificaciones** | Revisar contador, listado, marcar leída, marcar todas leídas. Probar que "Ver" navegue. |
| 9 | **Buscar un alumno que no existe / URL inválida** | Que no crashee, muestre mensaje amigable. |
| 10 | Cerrar sesión y volver a entrar | Que la sesión se cierre correctamente y pida login. |

### Checklist de notificaciones a recibir (marcar en la campana)

En **Alumno001 (1°1)** deberían llegar todas estas. Marcar con ✔ solo si llegó + "Ver" navega al módulo correcto:

- [ ] **E1/E6 — Calificación cargada o modificada**: cuando el docente (ej. `docente_02_prueba`) carga/modifica una nota en Matemática 1°1. Título "Calificación cargada" → navega a Calificaciones.
- [ ] **Prenota registrada**: cuando el docente guarda una prenota (TEP/TEA/TED) del alumno.
- [ ] **E3 — Inasistencia "Ausente"**: al ser marcado Ausente (un solo aviso acumulado por día, aunque haya varias ausencias el mismo día).
- [ ] **E4 — Acta de conducta/apercibimiento**: si una preceptora (o preceptor del curso) crea un acta de conducta para él.
- [ ] **E10 — Materia pasa a previa**: si alguna de sus materias pasa a estado de previa.
- [ ] **E11 — Rendición registrada**: si se registra una rendición de previa.
- [ ] **E12 — Intensificación**: si se le asigna una intensificación.
- [ ] **E13 — Promoción / no promoción** (boletín).
- [ ] **E14 — Cuenta habilitada/deshabilitada**: solo si se deshabilita/habilita su propio usuario.
- [ ] **E15 — Adelanto de horas aprobado** en su curso (1°1).
- [ ] **E16 — Evento institucional**: cuando el admin/director crea un evento (suspensión, feriado, jornada).
- [ ] **E17 — Suplencia asignada**: si suplentan una materia de su curso.
- [ ] **E18 — Recursada**: si se registra una recursada para él.
- [ ] **E19 — Bloqueo de horario** aplicado a él (crear y/o levantar).
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso 1°1**.
- [ ] **Comunicado alcance materia** (ej. Matemática) → solo los inscriptos en esa materia.
- [ ] **Actividad publicada** en alguna de sus materias → navega a Actividades.
- [ ] **Actividad de materia adeudada** (solo si tiene materia adeudada en ese curso).
- [ ] **Cambio de horario** de 1°1 (crear/editar/eliminar).
- [ ] **Falta de docente** en alguno de sus cursos.

**NO debe recibir:** actas de curso (E21), cargas masivas de notas/asistencias, alta de otros usuarios (E20), ni las notificaciones de calificaciones/inasistencias/actividades de **otros** alumnos.

---

## 2. Familia — `familia_002_prueba` / `123`

**Iniciar sesión → Seleccionar rol "Familia".** Este usuario es tutor de **Prueba001 Alumno001 (1°1)** y **Prueba002 Alumno002 (1°1)** → sirve para probar el selector de hijos.

| # | Acción a realizar | Qué revisar |
|---|---|---|
| 1 | Entrar a **Perfil** | Datos del tutor (Familia002 José). |
| 2 | Entrar a **Resumen** | Que muestre un resumen de los hijos (Alumno001 y Alumno002) con estado general (promedios, inasistencias, últimos comunicados). Probar cambiar de hijo. |
| 3 | Entrar a **Calificaciones** | Probar con el selector de hijo: para Alumno001 deben verse sus notas; para Alumno002, las de él. Validar que **no** se mezclen datos entre hijos. Revisar filtros por período/materia. |
| 4 | Entrar a **Asistencias** | Igual que calificaciones: verificar que al cambiar de hijo cambien los datos. |
| 5 | Entrar a **Actas** | Que vea las actas de sus hijos (informes, actas de evaluación, conducta). |
| 6 | Entrar a **Actividades** | Que vea las actividades de las materias de sus hijos. |
| 7 | Entrar a **Horarios** | Horarios de cada hijo según el selector. |
| 8 | Entrar a **Comunicados** | Ver comunicados General + los que alcancen los cursos de sus hijos. |
| 9 | Entrar a **Calendario Institucional** | Ver eventos publicados. |
| 10 | **Campana de notificaciones** | Revisar que las notificaciones muestren a **qué hijo** corresponden (filtro id_alumno). Probar marcar leída y "Ver". |
| 11 | Cambiar de hijo en campana | Con el filtro de alumno activo, que solo aparezcan las notificaciones del niño elegido. |

### Checklist de notificaciones a recibir (marcar en la campana)

El usuario **Familia002 José** es tutor de **Alumno001 y Alumno002** (ambos de 1°1). Debería recibir:

- [ ] **E1/E6 — Calificación** de Alumno001 y de Alumno002 (cargada o modificada) → verificar con el **selector de hijo** y el filtro de la campana `id_alumno`.
- [ ] **Prenota registrada** de cada hijo.
- [ ] **E3 — Inasistencia "Ausente"** de cada hijo (acumulada por día).
- [ ] **E4 — Acta de conducta/apercibimiento** de cada hijo.
- [ ] **E10 — Materia a previa** de cada hijo (si aplica) → navega a Calificaciones del hijo correspondiente.
- [ ] **E11 — Rendición registrada** de cada hijo.
- [ ] **E12 — Intensificación** de cada hijo.
- [ ] **E13 — Promoción / no promoción** (boletín) de cada hijo.
- [ ] **E18 — Recursada** de cada hijo (si aplica).
- [ ] **E14 — Cuenta habilitada/deshabilitada**: solo si se deshabilita/habilita la **propia cuenta** de la familia.
- [ ] **E15 — Adelanto de horas aprobado** en los cursos de sus hijos (1°1).
- [ ] **E16 — Evento institucional**.
- [ ] **E17 — Suplencia asignada** en materias de sus hijos.
- [ ] **E19 — Bloqueo de horario** aplicado a alguno de sus hijos.
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso 1°1** (solo si tiene un hijo allí).
- [ ] **Comunicado alcance materia** (ej. Matemática) de una materia de sus hijos.
- [ ] **Actividad publicada** en materias de sus hijos (navega a Actividades del hijo).
- [ ] **Actividad de materia adeudada** (solo para el/los hijo/s con materia adeudada).
- [ ] **Cambio de horario** de los cursos de sus hijos.
- [ ] **Falta de docente** en los cursos de sus hijos.

**Validar diferenciación entre hijos:** las notificaciones de Alumno001 y Alumno002 **no deben mezclarse** (con el selector de hijo activo solo deben aparecer las del niño elegido).

**NO debe recibir:** actas de curso (E21), cargas masivas, alta de usuarios (E20), ni datos de alumnos que **no** sean sus hijos.

---

## 3. Docente — `docente_02_prueba` / `123`

**Iniciar sesión → Seleccionar rol "Docente".** Docente02 Ana dicta Matemática (1°1) y Educación Artística (2°3), entre otras.

### 3.1. Acciones administrativas (sin notificación o de bajo impacto)

| # | Acción a realizar | Qué revisar |
|---|---|---|
| 1 | **Perfil** | Que muestre sus datos (Docente02 Ana) y las materias/cursos asignados. |
| 2 | **Libro de Temas** | Crear, editar y eliminar una entrada de tema para una fecha. Verificar que quede guardado y se vea en el listado. |
| 3 | **Diagnósticos grupales** | Crear un diagnóstico para un curso, verlo en detalle y eliminarlo. |
| 4 | **Actas** | Ver las actas del curso. |
| 5 | **Calendario Institucional** | Ver eventos. |
| 6 | **Comunicados** | Ver comunicados que le correspondan (General o de sus materias/cursos). |
| 7 | **Selector de curso/materia** | Cambiar entre Matemática 1°1, Artística 2°3 y otras asignadas → que todo (asistencia, alumnos, libro de temas) cambie acorde. |

### 3.2. Acciones con notificación (especificar destino)

| # | Acción a realizar | Qué revisar | Notificación y destinatarios |
|---|---|---|---|
| 8 | Cargar una **calificación** a Prueba001 Alumno001 (Matemática 1°1) y guardar | Que la nota se guarde y aparezca en sus calificaciones | **→ Alumno Prueba001** (alumno_001_prueba) **y su familia** (familia_002_prueba): "Calificación cargada". Navega a Calificaciones. Probar también **modificar una nota existente** (debe volver a notificar). |
| 9 | Cargar una **prenota (previa guardada como TED/TEP/TEA)** | Que quede registrada | **→ Alumno y familia** del alumno: "Prenota registrada". |
| 10 | Registrar **inasistencia "Ausente"** a un alumno del curso | Que quede en Asistencia y aparezca en el historial del alumno | **→ Alumno y familia**: "Inasistencia registrada" (se acumulan en un solo aviso por día si hay varias ausencias ese día). |
| 11 | **Publicar una actividad** (tarea/trabajo) con consigna y adjunto | Que se publique y se vea en Actividades del curso | **→ Alumnos del curso + sus familias**: "Actividad publicada". Navega a Actividades. Probar **editar la actividad** (debe volver a notificar). |
| 12 | Crear una **actividad para materia adeudada** (si existe alumno con materia adeudada en el curso) | Que se asocie correctamente | **→ Alumnos con MateriaAdeudada en estado ADEUDADA/RECURSANDO + sus familias**. |
| 13 | Crear/editar una **planificación (proyecto)** y dejarla en estado **Borrador** | Que se guarde | **→ Admin y Director** (directivos): "Planificación para revisión". |
| 14 | **Presentar Declaración Jurada (DDJJ)** | Que se registre | **→ Admin y Director**: "Declaración Jurada presentada". |
| 15 | **Marcarse ausente (falta de docente)** en la asistencia de docentes | Que quede registrada su falta | **→ Alumnos de sus cursos + familias + Jefe de Preceptores**: "Falta de docente". |
| 16 | **Carga única de notas / asistencias** (ventana de carga masiva) | Que se carguen en bloque para su curso/materia | **→ Admin/Director + Preceptores del curso**: "Notas cargadas" / "Notas actualizadas" / "Asistencias cargadas". |
| 17 | **Cambiar/crear un horario** de su materia (si tiene permiso) | Que el horario se actualice | **→ Alumnos del curso + familias + docente de la materia + preceptores + directivos**: "Horario modificado". |

### 3.3. Notas específicas

- La acción de **"Suplencia asignada"**: si el admin asigna a Ana como docente suplente → **Ana (docente_02_prueba) recibe** "Suplencia asignada" que navega a su **perfil docente** (donde se listan sus suplencias); y los **alumnos del curso + familias** también reciben aviso.
- **Adelanto de horas aprobado** vinculado a sus materias → le llega a él como docente titular, a preceptores, directivos, jefe y a los **alumnos del curso + familias**.

### 3.4. Checklist de notificaciones a recibir (marcar en la campana)

Como **Docente02 Ana** deberías recibir:

- [ ] **E17 — Suplencia asignada**: cuando el admin te designa docente suplente → "Suplencia asignada" que navega a tu **perfil docente** (donde se listan tus suplencias).
- [ ] **E15 — Adelanto de horas aprobado** en alguna de tus materias/cursos asignados (título "Adelanto de horas").
- [ ] **Cambio de horario** de las materias que dictás (ej. Matemática 1°1) → "Horario modificado".
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso** de un curso donde dictás (ej. 1°1).
- [ ] **Comunicado alcance materia** de una materia que dictás (ej. Matemática).
- [ ] **E16 — Evento institucional**.
- [ ] **E14 — Cuenta habilitada/deshabilitada**: solo si se deshabilita/habilita tu propia cuenta.
- [ ] **Falta de docente**: **NO** te llega a vos como docente, sino a los alumnos del curso + familias + Jefe de Preceptores (verificarlo con `docente_05_prueba` → `preceptor_1_prueba` NO recibe; los alumnos 1°1 SÍ).

**NOTA:** las notificaciones que **generás vos** (calificaciones, prenotas, asistencias, actividades, planificación en borrador, DDJJ) **no te llegan a vos** como destinatario; llegan a otros. No debe aparecer en tu campana un aviso por tu propia acción (a menos que el sistema admita una copia "de confirmación", que NO debe contar como notificación de destino).

**NO debe recibir:** actas de conducta (E4, van a alumno+familia+preceptores+jefe), actas de curso (E21), cargas masivas de notas/asistencias (van a directivos+preceptores), alta de usuarios (E20), ni las calificaciones de alumnos.

---

## 4. Preceptor — `preceptor_1_prueba` / `123`

**Iniciar sesión → Seleccionar rol "Preceptor".** Gómez Federico (cursos 1°1, 1°2, 1°3).

| # | Acción a realizar | Qué revisar | Notificación (si aplica) |
|---|---|---|---|
| 1 | **Perfil** | Datos de Gómez Federico, curso(s) asignados. |
| 2 | **Estudiantes** | Ver listado de alumnos; buscar por curso, nombre, DNI. Probar **crear** y **modificar** un estudiante. | Si el alta crea un usuario nuevo → **Preceptores + Jefe + Directivos** (E20, sin el actor). |
| 3 | **Tutores** | Ver tutores; agregar/editar un tutor y vincularlo a un alumno (alumnos sin tutor). |
| 4 | **Docentes** | Ver listado de docentes del establecimiento. |
| 5 | **Panel Diario** | Revisar el panel del día: clases, módulos, ausencias de docentes, alumnos. |
| 6 | **Asistencias** | Registrar asistencia de un curso: marcar **Ausente** a un alumno y guardar. | **→ Alumno y familia**: "Inasistencia registrada". Registrar varias ausencias el mismo día → debe ser **un solo** aviso acumulado. |
| 7 | **Calificaciones** | Ver notas por curso/materia (solo lectura o carga según disponga el sistema). |
| 8 | **Proyectos / Actividades** | Ver las planificaciones y actividades de los cursos (**solo lectura**; los crean los docentes). |
| 9 | **Actas** | Crear/linkear un **Acta de curso** (ej. acta de inicio de clases). | **→ Preceptores del curso + Jefe de Preceptores**: "Acta de curso". |
| 10 | **Acta de conducta/apercibimiento** a un alumno (si puede crearla) | | **→ Alumno + familia + preceptores del curso + Jefe de Preceptores**: "Acta de conducta". |
| 11 | **Horarios** | Ver horarios por curso. |
| 12 | **Adelantos de Horas** | Crear un adelanto de horas para una materia de un curso. | **→ Docente titular + preceptores + directivos + Jefe + alumnos del curso + familias**: "Adelanto de horas". |
| 13 | **Asistencias — marcar a un docente como Ausente** (falta de docente) | En Asistencias, registrar al docente de la materia como **Ausente** para el día. | **→ Alumnos del curso + familias + Jefe de Preceptores**: "Falta de docente". (El preceptor NO gestiona suplencias: eso es del Admin.) |
| 14 | **Panel Diario — Carga única** | En Panel Diario, ejecutar la **carga única** del libro de temas / ventana del día. | **Según el tipo de carga**: notas → **Directivos + preceptores del curso**; asistencias → **Directivos + preceptores del curso**. |
| 15 | **Comunicados** | Ver comunicados que alcancen sus cursos y sus adjuntos (**solo lectura**; los publican Admin y Jefe). |
| 16 | **Calendario Institucional** | Ver eventos. |
| 17 | **Campana de notificaciones** | Revisar contador, listado, "Ver" → navegación. |

### Checklist de notificaciones a recibir (marcar en la campana)

Como **Gómez Federico (preceptor de 1°1, 1°2, 1°3)** deberías recibir:

- [ ] **Actas de curso** (E21) de los cursos que tenés asignados → "Acta de curso" (al crear un acta de curso en 1°1/1°2/1°3).
- [ ] **Actas de conducta** (E4) de alumnos de tus cursos → también llegan a alumno+familia+jefe.
- [ ] **E20 — Alta de usuario nuevo** (alumno/docente/preceptor creado por otro usuario): llega a preceptores de cursos + jefe + directivos (**NO** a vos si fuiste el actor que lo creó).
- [ ] **E15 — Adelanto de horas** aprobado en cualquiera de tus cursos → "Adelanto de horas" (llega a docente titular + preceptores + directivos + jefe + alumnos + familias).
- [ ] **E17 — Suplencia asignada** en un curso que está a tu cargo → preceptores del curso + docente suplente + directivos + alumnos + familias. (El preceptor gestiona la parte de sus cursos, no la suplencia.)
- [ ] **Notas cargadas / actualizadas y Asistencias cargadas**: cuando un docente carga notas o asistencias de alguno de tus cursos (cada carga genera el aviso a directivos + preceptores del curso; título exacto "Notas cargadas", "Notas actualizadas" o "Asistencias cargadas", navega a notas/asistencias del curso-materia).
- [ ] **Cambio de horario** de tus cursos → "Horario modificado" (alumnos + familias + docente + preceptores + directivos).
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso** de 1°1, 1°2 o 1°3.
- [ ] **Comunicado alcance materia** de una materia de tus cursos.
- [ ] **E16 — Evento institucional**.
- [ ] **E14 — Cuenta habilitada/deshabilitada**: solo si se deshabilita/habilita tu propia cuenta.
- [ ] **Falta de docente** en tus cursos: **NO** te llega a vos como preceptor; llega a alumnos del curso + familias + **Jefe de Preceptores** (verificar que no aparece aunque marques Ausente a un docente).

**NO debe recibir:** calificaciones/pre-notas de alumnos (van a alumno+familia), inasistencias de alumnos (E3, son del alumno+familia), suplencias de cursos que NO son tuyos, ni las notificaciones del día de otros preceptores.

---

## 5. Jefe de Preceptores — `jefe_preceptores_prueba` / `123`

**Iniciar sesión → Seleccionar rol "Jefe de Preceptores".** Benítez Carolina.

| # | Acción a realizar | Qué revisar |
|---|---|---|
| 1 | **Perfil** | Datos propios. |
| 2 | **Administración de Preceptores** | Listar preceptores; **crear un preceptor nuevo** y asignarle cursos. |
| 3 | **Asignación de cursos** | Asignar/desasignar cursos a un preceptor. |
| 4 | **Estadísticas** | Revisar las estadísticas de preceptores (indicadores, tablero). |
| 5 | **Supervisión de preceptores** | Ver el estado de cada preceptor/curso. |
| 6 | **Estudiantes** | Ver listado de alumnos. |
| 7 | **Asistencias** | Ver asistencias por curso. |
| 8 | **Boletines / Notas** | Ver notas/boletines por curso. |
| 9 | **Actas** | Ver actas. |
| 10 | **Adelantos de Horas** | Ver/ingresar adelantos. |
| 11 | **Docentes / Tutores** | Ver listados de docentes y tutores. |
| 12 | **Comunicados** | Publicar un comunicado (General / curso / materia). Revisar que llegue según alcance. |
| 13 | **Calendario Institucional** | Ver eventos. |
| 14 | **Campana de notificaciones** | Revisar que le lleguen: actas de curso, faltas de docentes, comunicados, adelantos, eventos institucionales, carga de usuarios. Probar "Ver". |

### Notificaciones que el Jefe DEBE recibir
- **Acta de curso** creada → preceptores del curso + jefe.
- **Acta de conducta** → jefe (además de alumno/familia/preceptor).
- **Falta de docente** → jefe (además de alumnos/familias).
- **Comunicados publicados** según alcance.
- **Adelanto de horas** (autorizado en cualquier curso).
- **Eventos institucionales** (como todo el mundo).
- **Nuevo usuario creado** → preceptores + jefe + directivos.
- **No recibe** el aviso directo de "suplencia asignada" (eso llega al docente suplente, preceptores del curso y directivos); si la suplencia es de un curso con preceptor asignado a él, sí la recibe como preceptor.

### Checklist de notificaciones a recibir (marcar en la campana)

Como **Benítez Carolina (Jefa de Preceptores)** deberías recibir:

- [ ] **E21 — Acta de curso** creada en cualquier curso → te llega como Jefe (además de los preceptores del curso).
- [ ] **E4 — Acta de conducta / apercibimiento** de cualquier alumno → te llega (además de alumno, familia y preceptor del curso).
- [ ] **Falta de docente** (cuando un docente se marca Ausente en el día) → "Falta de docente" (alumnos del curso + familias + jefe).
- [ ] **E15 — Adelanto de horas** aprobado en cualquier curso → "Adelanto de horas".
- [ ] **E20 — Alta de usuario nuevo** (alumno/docente/preceptor creado por otro) → preceptores + jefe + directivos (NO si sos el actor).
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso** (de cualquier curso).
- [ ] **Comunicado alcance materia**.
- [ ] **E16 — Evento institucional**.
- [ ] **E14 — Cuenta habilitada/deshabilitada**: solo si se deshabilita/habilita tu propia cuenta.
- [ ] **E3 / E1 — Inasistencias y calificaciones de alumnos**: **NO** te llegan (van a alumno + familia). Verificar que no aparezcan.

**NOTA:** la "suplencia asignada" **no** te llega de forma directa como Jefe (solo al docente suplente, preceptores del curso y directivos). Si vos además tenés el rol preceptor de ese curso, sí la recibís como preceptor — para este testeo conviene usar un curso NO asignado a vos (ej. uno de `preceptor_1_prueba`).

---

## 6. Administrador — `admin_prueba` / `123`

**Iniciar sesión → Seleccionar rol "Administrador".** Directivo Prueba Admin.

### 6.1. Gestión de personas y estructura

| # | Acción a realizar | Qué revisar | Notificación |
|---|---|---|---|
| 1 | **Perfil** | Datos propios. |
| 2 | **Alumnos** | Crear, editar, buscar, eliminar/desactivar un alumno. Probar adjuntarle tutor y usuario. | **Crear usuario alumno** → preceptores + jefe + directivos (E20), excluyendo al actor. |
| 3 | **Docentes** | Crear/editar docente y asignarle materias/cursos. | Ídem anterior (E20) si crea el usuario. |
| 4 | **Preceptores** | Crear/editar preceptor y asignarle cursos. | Ídem (E20). |
| 5 | **Administradores** | Editar administradores existentes. **Debe estar deshabilitado el botón de crear/editar admins para el rol admin** (solo director tiene permiso). |
| 6 | **Cursos** | Crear/modificar/eliminar un curso. | **→ Directivos (excepto actor)**: "Cambio de estructura" (curso creado/modificado/eliminado). |
| 7 | **Materias** | Crear/modificar/eliminar una materia. | **→ Directivos (excepto actor)**: "Cambio de estructura". |
| 8 | **Suplencias Docentes** | Crear una suplencia para un docente. | **→ Docente suplente + preceptores del curso + directivos + alumnos del curso + familias**: "Suplencia asignada". |
| 9 | **Asignación de materias** | Asignar/desasignar materias a docentes (asignación curso-materia). |

### 6.2. Régimen académico

| # | Acción a realizar | Qué revisar | Notificación |
|---|---|---|---|
| 10 | **Horarios** | Crear/editar/eliminar un horario para un curso. | **→ Alumnos del curso + familias + docente de la materia + preceptores + directivos**: "Horario modificado". |
| 11 | **Adelantos de Horas** | Crear un adelanto. | **→ Docente titular + preceptores + directivos + jefe + alumnos del curso + familias**: "Adelanto de horas". |
| 12 | **Asistencias** | Cargar asistencia en bloque / por curso; marcar ausencias. | **Inasistencias** → alumno y familia. **Carga masiva** → directivos + preceptores del curso. |
| 13 | **Notas (Boletines)** | Cargar/editar notas. Revisar que el boletín se calcule y actualice. | **Calificación** → alumno + familia. **Boletín consolidado/promoción** → alumno + familia (E13). |
| 14 | **Actas** | Crear actas de curso/alumno. | **Acta de curso** → preceptores + jefe. |
| 15 | **Carga única** | Probar el flujo de carga única / intensificaciones si está disponible. | Según módulo (cargas de notas → directivos + preceptores; carga en ventana a docentes activos). |

### 6.3. Comunicación

| # | Acción a realizar | Qué revisar | Notificación |
|---|---|---|---|
| 16 | **Publicar Comunicado — alcance General** | Que todos los roles puedan verlo. | **→ Todos**: alumnos + familias + docentes + preceptores + jefe + directivos: "Nuevo comunicado". |
| 17 | **Publicar Comunicado — alcance curso (ej. 1°1)** | Que solo lo vea 1°1. | **→ Alumnos de 1°1 + sus familias + docentes con materias en 1°1 + preceptor de 1°1 + jefe + directivos**. NO debe llegar a 1°2 ni 2°1. |
| 18 | **Publicar Comunicado — alcance materia (ej. Matemática)** | Que solo lo vean los inscriptos en Matemática. | **→ Alumnos con Matemática en ese curso + familias + docente de Matemática + preceptores + jefe + directivos**. |
| 19 | **Adjuntar archivo a un comunicado** | Que se suba y sea descargable. |
| 20 | **Calendario Institucional — crear evento** (Suspensión, Feriado, Jornada Institucional, Otro) | Que aparezca en el calendario de todos. | **→ TODOS los roles**: "Evento institucional". |
| 21 | **Historial de cambios** | Revisar que se registren los cambios realizados. |

### 6.4. Estado de usuarios y misceláneos

| # | Acción a realizar | Qué revisar | Notificación |
|---|---|---|---|
| 22 | Deshabilitar / habilitar un usuario | Que el usuario pierda/recupere acceso. | **→ Usuario afectado**: "Cuenta deshabilitada/habilitada" (E14). |
| 23 | Reprocesar / verificar boletines (comandos o botones disponibles) | Que no haya errores. |
| 24 | **Campana de notificaciones** | Revisar llegada de: planificaciones para revisión, DDJJ, cambios de estructura, eventos, comunicados, suplencias, faltas, cargas. | |

### Checklist de notificaciones a recibir (marcar en la campana)

Como **Directivo Prueba Admin (admin_prueba)** deberías recibir:

- [ ] **E8 — Planificación para revisión**: cuando un docente (ej. `docente_02_prueba`) envía una planificación borrador → "Planificación pendiente de revisión".
- [ ] **E9 — DDJJ presentada**: cuando un docente completa la Declaración Jurada → "DDJJ presentada".
- [ ] **Falta de docente**: **NO** te llega como directivo (va a alumnos + familias + jefe). Verificar que no aparezca.
- [ ] **E15 — Adelanto de horas** aprobado → directivos.
- [ ] **E17 — Suplencia asignada** → "Suplencia asignada" (directivos + docente suplente + preceptores del curso + alumnos + familias).
- [ ] **E20 — Alta de usuario nuevo** → directivos (NO si vos fuiste el actor que creó el usuario; y si lo que se crea es un **admin**, solo los directores lo reciben, no otro admin).
- [ ] **Notas cargadas / actualizadas y Asistencias cargadas**: cuando cualquier docente carga o actualiza notas/asistencias → título exacto "Notas cargadas", "Notas actualizadas" o "Asistencias cargadas" (va a directivos + preceptores del curso, con navegación a notas/asistencias).
- [ ] **Cambio de estructura** (curso/materia creado, modificado o eliminado) → directivos (excepto el actor).
- [ ] **Cambio de horario** de cualquier curso → directivos.
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso / materia** (según los que publique otro admin o directivo).
- [ ] **E16 — Evento institucional**.
- [ ] **E14 — Cuenta habilitada/deshabilitada**: si se deshabilita/habilita tu propia cuenta.

- [ ] **E21 — Acta de curso**: **NO** debería llegarte (va solo a preceptores del curso + jefe).
- [ ] **E4 — Acta de conducta**: **NO** debería llegarte (va solo a alumno + familia + preceptores del curso + jefe).

**NO debe recibir (cont.):** calificaciones/pre-notas/inasistencias de alumnos (E1/E6/E3 van a alumno+familia), faltas de docente (alumnos+familias+jefe), ni notificaciones de los cursos ajenos a tu gestión.

---

## 7. Director — `director_prueba` / `123` (o `vicedirector1_prueba` / `123`)

**Iniciar sesión → Seleccionar rol "Director".** Comparte el panel de administración.

| # | Acción a realizar | Qué revisar |
|---|---|---|
| 1 | **Administradores** | **Crear y editar administradores** (permiso EXCLUSIVO del director). Verificar que con rol admin esa opción esté bloqueada. |
| 2 | Todas las acciones de la sección **Administrador (6.1 a 6.4)** | Mismas revisiones, más verificar que recibe las notificaciones de gestión (planificaciones para revisión, DDJJ, cambios de estructura) como el admin. |
| 3 | **Cambio de rol** | Probar que con el mismo usuario pueda operar como directivo. |
| 4 | **Campana** | Verificar notificaciones de: planificación para revisión, DDJJ presentada, actas, suplencias, eventos, comunicados, estructura, bloqueo de horario (levantarlo le llega como de todos). |

### Checklist de notificaciones a recibir (marcar en la campana)

Como **director_prueba (o vicedirector)** deberías recibir:

- [ ] **E8 — Planificación para revisión** (igual que admin) → "Planificación pendiente de revisión".
- [ ] **E9 — DDJJ presentada** → "DDJJ presentada".
- [ ] **E15 — Adelanto de horas** aprobado → directivos.
- [ ] **E17 — Suplencia asignada** → directivos.
- [ ] **E20 — Alta de administrador/a**: si otro director crea un **admin**, recibís E20 **solo por ser director** (un admin que no sea director NO lo recibe). Verificar la diferencia.
- [ ] **E14 — Cuenta habilitada/deshabilitada**: solo si se deshabilita/habilita tu propia cuenta.
- [ ] **Cambio de estructura** (curso/materia) → directivos (excepto actor).
- [ ] **Cambio de horario** de cualquier curso → directivos.
- [ ] **Notas cargadas / actualizadas y Asistencias cargadas**: cuando un docente carga o actualiza notas/asistencias → "Notas cargadas", "Notas actualizadas" o "Asistencias cargadas" (directivos + preceptores del curso).
- [ ] **Comunicado alcance General**.
- [ ] **Comunicado alcance curso / materia**.
- [ ] **E16 — Evento institucional**.
- [ ] **E21 — Acta de curso**: **NO** debería llegarte (va solo a preceptores del curso + jefe).
- [ ] **E4 — Acta de conducta**: **NO** debería llegarte (va solo a alumno + familia + preceptores del curso + jefe).

**NO debe recibir (cont.):** falta de docente (alumnos+familias+jefe), calificación/inasistencia de alumnos (E1/E3 → alumno+familia).

---

## 8. Matriz de Notificaciones por Evento (resumen rápido)

| Disparador (quién actúa) | Evento | Destinatarios |
|---|---|---|
| Docente/Admin carga calificación | E1/E6 | Alumno + familia del alumno |
| Prenota guardada | — | Alumno + familia |
| Inasistencia "Ausente" | E3 (DAILY) | Alumno + familia (un aviso/día, acumulado) |
| Acta de conducta/apercibimiento | E4 | Alumno + familia + preceptores del curso + jefe |
| Comunicado publicado | E7 | Según alcance (General → todos; curso → alumnos+familias+docentes+preceptores del curso + jefe + directivos; materia → inscriptos) |
| Planificación a revisión | E8 | Admin + director |
| DDJJ presentada | E9 | Admin + director |
| Materia pasa a previa | E10 | Alumno + familia |
| Rendición registrada | E11 | Alumno + familia |
| Intensificación | E12 | Alumno + familia |
| Promoción/no promoción (boletín) | E13 | Alumno + familia |
| Usuario habilitado/deshabilitado | E14 | Usuario afectado |
| Adelanto de horas aprobado | E15 | Docente titular + preceptores del curso + directivos + jefe + alumnos del curso + familias |
| Evento institucional | E16 | TODOS (alumnos, familias, docentes, preceptores, jefe, directivos) |
| Suplencia asignada | E17 | Docente suplente + preceptores del curso + directivos + alumnos del curso + familias |
| Recursada | E18 | Alumno + familia |
| Bloqueo horario (crear/levantar) | E19 | Alumno + familia |
| Nuevo usuario creado | E20 | Preceptores de cursos + jefe + directivos (no al actor; solo directores si es alta de admin) |
| Acta de curso | E21 | Preceptores del curso + jefe |
| Carga masiva de notas | — | Directivos + preceptores del curso |
| Carga masiva de asistencias | — | Directivos + preceptores del curso |
| Cambio de curso/materia (estructura) | — | Directivos (excepto actor) |
| Actividad publicada/actualizada | — | Alumnos del curso + familias |
| Actividad de materia adeudada | — | Alumnos con MateriaAdeudada + familias |
| Horario creado/modificado/eliminado | — | Alumnos del curso + familias + docente de la materia + preceptores + directivos |
| Falta de docente (Ausente) | — | Alumnos del curso + familias + jefe |

---

## 9. Pruebas transversales (todos los roles)

1. **Login**: usuario/contraseña correctos, incorrectos, campos vacíos.
2. **Selección de rol**: si un usuario tiene más de un rol, poder cambiar de rol.
3. **Navegación por menú lateral**: entrar y volver a cada sección sin errores.
4. **Responsive**: probar pantalla de escritorio y mobile/tablet.
5. **Filtros y búsquedas**: curso, materia, período, alumno — en cada pantalla que los tenga.
6. **Paginación**: listados largos (usuarios, comunicados, notificaciones).
7. **Botonera de exportación**: exportar listados a Excel/PDF/CSV si la pantalla lo ofrece.
8. **Mensajes de confirmación y toasts**: al guardar/eliminar/actualizar.
9. **Manejo de errores**: forzar campos requeridos vacíos, fechas inválidas, DNI duplicado.
10. **Notificaciones**: contador (badge) que se actualiza en ~30 s, listado, marcar leída, marcar todas, y navegación "Ver" según rol.
11. **Recarga de página**: no debe perder sesión ni datos visibles.

---

## 10. Checklist de cierre por rol

Completar solo cuando todo lo anterior esté probado:

- [ ] Docente: cargó calificación y **alumno + familia** recibieron la notificación.
- [ ] Docente: publicó actividad y **alumnos del curso + familias** recibieron la notificación.
- [ ] Docente: presentó planificación/DDJJ y **admin + director** la recibieron.
- [ ] Preceptor: registró ausencia y **alumno + familia** la recibieron (acumulada por día).
- [ ] Preceptor: creó acta de conducta → **alumno + familia + preceptores + jefe**.
- [ ] Admin: publicó comunicado General → **todos**; con alcance curso → **solo ese curso** (verificar que 1°2/2°1 NO reciban).
- [ ] Admin/Director: creó evento institucional → **todos** recibieron.
- [ ] Admin: creó usuario → **preceptores + jefe + directivos** (sin el actor).
- [ ] Admin: deshabilitó un usuario → **ese usuario** recibió aviso.
- [ ] Jefe: recibió falta de docente, actas, suplencias, adelantos y comunicados.
- [ ] Alumno y Familia: recibieron y pudieron navegar desde cada notificación al módulo correcto.
- [ ] Director: pudo crear administradores (y admin NO pudo).
- [ ] Limitadores diarios/horarios: **desactivados** (aviso al cliente para que lo recuerde).

---

## 11. Hallazgos del testeo masivo y estado

Resultados de los bugs reportados en el ciclo de testeo masivo (ciclo 2026-09):

| # | Bug reportado | Estado | Detalle / causa |
|---|---|---|---|
| 1 | Notificaciones: ningún rol recibía las notificaciones por rol activo | ✔ Corregido | Faltaba el campo `rol` en `Notificacion` para segmentar destinatarios. Migración `0004_notificaciones_rol`, campo `rol`, filtro en `NotificacionViewSet.get_queryset` (`Q(rol=segmento) \| Q(rol__isnull=True) \| Q(rol='universal')`). Emisores etiquetados en views.py. Verificado por ORM. |
| 2 | "Marcar todas las leídas" no funcionaba | ✔ Corregido | Filtraba por `id__in` en vez de `id_notificacion__in`. Verificado por ORM. |
| 3 | Preceptor no podía guardar horarios (error al guardar) | ✔ Corregido | `HorarioViewSet` y `HorarioEspecialViewSet` usaban `IsAdminOrDirectorForWrite`, que bloquea escrituras del preceptor. Nueva `PuedeGestionarHorarios` (lecturas: autenticado; escritura: admin/director/preceptor). Nota: el **jefe de preceptores NO** escribe horarios (alineado con `_check_preceptor_curso_access`). |
| 4 | Botones "Nuevo Tutor" / "Nuevo Docente" cuelgan la página | ✔ Corregido | `renderFormTutor()` se invocaba sin estar definido → ReferenceError durante el render. Ídem `<AsignacionesEditor />` en docentes. Se crearon `renderFormTutor`, `TutoresAlumnosEditor.jsx` y `AsignacionesEditor.jsx`. `npm run build` OK. |
| 5 | Crear preceptor/jefe: "id_usuario_existente: Introduzca un número entero válido" | ✔ Corregido | El payload envía `''` y DRF `IntegerField` lo rechaza incluso con `allow_null=True`. Se creó `EnteroOpcionalField` (convierte `''`/`None` → `None`) y se usó en los 5 serializers. Verificado: `ERRORES: {}`, `VALIDO: True`; `manage.py check` OK. |
| 6 | Boletines "no permite cambiar materia" | ⚠ No reproducible | El boletín (Alumno/Familia/Preceptor/PDF) es **consolidado por diseño**: muestra todas las materias del curso en una tabla, sin selector de materia. Único selector de materia relacionado está en `Administracion/notas.jsx` (vista de solo lectura) y funciona. Si el reporte era esa vista, revisar con qué curso/materia se probó. |
| 7 | Director al quitar rol admin: la persona sigue en la lista | ✔ Verificado OK | Repro extraído contra el servidor real (login `director_prueba` → `POST /api/usuarios/quitar-rol/` → `GET /api/usuarios/`): al quitar el rol, la persona **desaparece** del listado. La regla de negocio conserva al menos un rol (rechaza quitar el único rol). Roles de prueba usados en la verificación fueron restaurados en la DB. |

**Notas para próximos ciclos:**

- El `QuitarRolModal` solo lista personas con **más de un rol** (filtro `cantidad_roles > 1`); no es posible quitar el único rol de un usuario desde la UI.
- Verificación de roles/horarios en el shell de Django **no** replica la autenticación JWT custom; probar contra servidor real (`python manage.py runserver`) o por ORM.