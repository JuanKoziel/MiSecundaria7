# Especificación de Requerimientos — Sistema de Gestión Escolar "Secundaria 7"

> **Alcance**: Este documento describe los requerimientos **implementados y en producción** en el repositorio actual. No es una lista de deseos: cada ítem corresponde a código real, endpoints existentes y UI funcional. Sirve como baseline para trazabilidad, testing, onboarding y evolución futura.

---

## 1. Arquitectura y Stack Técnico

| Aspecto | Detalle |
|---------|---------|
| **Frontend** | React 18 + Vite, Context API (Auth, Data), React Router (implícito via vistas) |
| **Backend API** | RESTful (Django REST Framework inferido), JWT Access + Refresh Token |
| **Autenticación** | Login usuario/contraseña → Access Token (localStorage) + Refresh Token → Header `Authorization: Bearer` |
| **Autorización** | RBAC por header `X-Rol-Activo` (valor: `preceptor`, `jefe_preceptores`, `admin`, `director`, `docente`, `familia`, `alumno`) |
| **Estado Global** | `DataContext`: carga inicial `Promise.all` (~25 endpoints), polling notificaciones 30s, selectores globales (año/curso, curso/materia, hijo) |
| **Estándar Visual** | `VISUAL_STANDARD.md`: header oscuro, sidebar acordeón, cards glassmorphism, FormModal/ConfirmDeleteModal con Portal, íconos FontAwesome |
| **Despliegue** | `npm run build` → estáticos servidos por backend o CDN |

---

## 2. Roles y Matriz de Acceso

| Rol | Label | Icono | Dashboards / Vistas Principales |
|-----|-------|-------|--------------------------------|
| `admin` | Administrador | fa-user-shield | Gestión completa: usuarios, roles, cursos, materias, horarios, suplencias, calendario, historial, actas, comunicados, notas, asistencias, preceptores, administradores, adelantos horas |
| `director` | Director | fa-user-tie | Igual que admin (mapeado en `ROL_EQUIV`) |
| `jefe_preceptores` | Jefe de Preceptores | fa-users-cog | Supervisión preceptores, estadísticas, asignación cursos, admin preceptores, comunicados jefe, actas, notas, asistencias, estudiantes, docentes, tutores, adelantos horas, calendario, historial |
| `preceptor` | Preceptor | fa-clipboard-user | Gestión diaria: estudiantes, tutores, docentes, asistencias (día/materia/docentes), notas/RITE, actas, libro temas, proyectos, actividades, adelantos horas, horarios, comunicados, notificaciones, calendario |
| `docente` | Docente | fa-chalkboard-teacher | Panel docente, planificaciones, libro temas, info, asistencia, actividades, actas docente, estudiantes, comunicados, notificaciones, diagnóstico, calendario, materias adeudadas |
| `familia` | Familia | fa-users | Resumen, calificaciones/RITE PDF, asistencias, actas, comunicados, horarios, actividades, info, notificaciones (personales/por hijo), calendario |
| `alumno` | Estudiante | fa-user-graduate | Perfil, calificaciones/RITE PDF, asistencias, materias adeudadas (intensificaciones/previas), horario, comunicados, notificaciones, info, calendario |

**Regla de selección de rol**: Usuario con múltiples roles elige al entrar; persiste en `sessionStorage` por username (`AuthContext.jsx:37-44`).

---

## 3. Entidades del Dominio (Modelo de Datos)

### 3.1 Entidades Principales

| Entidad | Campos Clave | Endpoints API | Usada por |
|---------|-------------|---------------|-----------|
| **Estudiante** | `id_alumno`, `dni`, `nombre`, `apellido`, `curso`, `id_curso`, `id_tutor`, `id_usuario`, `fecha_nacimiento`, `direccion`, `telefono`, `procedencia`, `usuario`, `usuario_estado` | `/alumnos/` | Todos |
| **Docente** | `id_docente`, `id_usuario`, `dni`, `nombre`, `apellido`, `correo`, `telefono`, `materia`, `asignaciones[]`, `ddjj_*`, `usuario_estado` | `/docentes/`, `/ddjj-docente/` | Admin, Preceptor, Jefe, Docente |
| **Preceptor** | `id_preceptor`, `id_usuario`, `dni`, `nombre`, `apellido`, `correo`, `telefono`, `cursos[]`, `usuario_estado` | `/preceptores/` | Admin, Jefe |
| **Directivo/Administrador** | `id_directivo`, `id_usuario`, `dni`, `nombre`, `apellido`, `correo`, `telefono`, `cargo`, `usuario_estado` | `/directivos/` | Admin |
| **Curso** | `id_curso`, `nombre_curso` (ej: "4°1"), `orientacion`, `id_preceptor`, `id_ciclo`, `activo`, `ciclo_anio` | `/cursos/` | Admin, Preceptor, Docente, Familia, Estudiante |
| **Materia** | `id_materia`, `nombre_materia`, `activo` | `/materias/` | Admin, Docente, Preceptor |
| **Curso-Materia** | `id_curso_materia`, `id_curso`, `id_materia`, `id_docente`, `curso_nombre`, `materia_nombre`, `docente_nombre` | `/curso-materia/` | **Entidad pivote central** |
| **Ciclo Lectivo** | `id_ciclo`, `anio` | `/ciclos-lectivos/` | Admin, Cursos |
| **Período** | `id_periodo`, `orden_periodo` (1=1er cuatri, 2=2do cuatri) | `/periodos/` | Calificaciones |

### 3.2 Entidades Académicas

| Entidad | Descripción | Endpoints |
|---------|-------------|-----------|
| **Calificación** | `id_calificacion`, `id_alumno`, `id_curso_materia`, `id_periodo`, `pre_nota`, `nota_numerica`, `diagnostico`, `curso_nombre`, `materia_nombre` | `/calificaciones/`, `/calificaciones/batch/` |
| **Asistencia** | `id_asistencia`, `id_alumno`, `id_curso_materia`, `fecha`, `hora`, `id_estado_asistencia`, `estado_nombre`, `curso_nombre`, `materia_nombre` | `/asistencias/`, `/asistencias/preceptor-materia/`, `/asistencias/alumno-detalle/`, `/asistencias/asistencia-diaria/`, `/asistencias/registro-diario/` |
| **Estado Asistencia** | `id_estado_asistencia`, `nombre_estado` (Presente, Ausente, Tarde, Retirado) | `/estados-asistencia/` |
| **Acta** | `id_acta`, `titulo`, `descripcion`, `fecha`, `id_tipo_acta`, `ruta_archivo`, `id_usuario_creador` | `/actas/`, `/acta-alumno/`, `/acta-curso/`, `/acta-docente/` |
| **Comunicado** | `id_comunicado`, `titulo`, `cuerpo`, `fecha`, `alcances[]` (curso, división, materia, ciclo), `archivos[]`, `creador_nombre` | `/comunicados/`, `/comunicado-archivo/` |
| **Notificación** | `id_notificacion`, `id_usuario`, `id_alumno`, `titulo`, `mensaje`, `fecha`, `leida`, `nav_destino`, `nav_params` | `/notificaciones/`, `/notificaciones/marcar_leida/`, `/notificaciones/marcar_todas_leidas/` |
| **Planificación** | `id_planificacion`, `id_docente`, `id_curso_materia`, `estado` (Borrador/Verificado), `contenido` (JSON: contenido, objetivos, salidas, fundamentacion), `ruta_archivo`, `fecha_subida` | `/planificaciones/`, `/planificaciones/{id}/verificar/` |
| **Suplencia** | `id_suplencia`, `id_curso_materia`, `id_docente_suplente`, `nivel` (1/2/3), `motivo`, `fecha_inicio`, `fecha_fin`, `estado`, `suplente_nombre`, `titular_nombre`, `docente_activo_hoy` | `/suplencias/`, `/suplencias/{id}/finalizar/` |
| **Horario** | `id_horario`, `id_curso_materia`, `id_modulo`, `dia_semana`, `aula`, `hora_inicio`, `hora_fin` | `/horarios/`, `/horarios-especiales/`, `/modulos/` |
| **Diagnóstico Grupal** | `id_diagnostico_grupal`, `id_curso`, `id_docente`, `fecha`, `descripcion` | `/diagnosticos-grupales/` |
| **Padre/Tutor** | `id_padre_tutor`, `id_usuario`, `dni`, `nombre`, `apellido`, `correo`, `telefono`, `vinculo` | `/padres-tutores/` |
| **Inscripción** | `id_inscripcion`, `id_alumno`, `id_curso_materia`, `anio_lectivo`, `curso` | `/inscripciones/` |
| **Adelanto Horas** | `id_adelanto_horas`, `id_docente`, `fecha`, `horas`, `motivo`, `estado` | `/adelantos-horas/` |
| **Evento Institucional** | `id_evento_institucional`, `titulo`, `fecha`, `tipo`, `descripcion`, `alcances` | `/eventos-institucionales/` |

### 3.3 Régimen Académico (Materias Adeudadas / Intensificaciones / Previas)

| Entidad | Descripción | Endpoints |
|---------|-------------|-----------|
| **Materia Adeudada** | `id_materia_adeudada`, `alumnoId`, `materia_nombre`, `curso_origen_nombre`, `estado` (ADEUDADA, RECURSANDO, APROBADA), `tipo_deuda` (RECURSADA, PREVIA), `fecha_aprobacion`, `observaciones` | `/materias-adeudadas/`, `/materias-adeudadas/{id}/rendir/` |
| **Rendición Materia Adeudada** | `id_rendicion`, `id_materia_adeudada`, `periodo`, `anio_rendicion`, `nota`, `estado`, `fecha_rendicion`, `resultado` | `/rendiciones-materias-adeudadas/` |
| **Actividad Materia Adeudada** | `id_actividad`, `materia_nombre`, `tipo` (INTENSIFICACION, PREVIA), `titulo`, `descripcion`, `periodo_intensificacion`, `archivo_pdf` | `/actividades-materias-adeudadas/` |
| **Intensificación Académica** | `id_intensificacion`, `materia_nombre`, `periodo`, `anio_rendicion`, `estado`, `nota`, `fecha_registro` | `/intensificaciones-academicas/` |
| **Registro Rendiciones Previas** | Historial de rendiciones de previas por estudiante/materia | `/registro-rendiciones-previas/` |

---

## 4. Requerimientos Funcionales por Módulo

### 4.1 Autenticación y Autorización (RF-AUTH)

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| RF-AUTH-01 | Login con usuario/contraseña → JWT Access + Refresh Token | `api.js:77-82`, `AuthContext.jsx:69-80` |
| RF-AUTH-02 | Refresh automático de Access Token ante 401 | `api.js:36-75` (interceptor) |
| RF-AUTH-03 | Selección de rol activo (multi-rol) con persistencia en sessionStorage | `AuthContext.jsx:12-14, 37-44, 82-97` |
| RF-AUTH-04 | Header `X-Rol-Activo` enviado en cada request autenticado | `api.js:28-34`, `AuthContext.jsx:58, 76, 92` |
| RF-AUTH-05 | Logout limpia tokens y sessionStorage | `AuthContext.jsx:108-116`, `api.js:84-87` |
| RF-AUTH-06 | Cambio de rol sin logout (vuelve a selector) | `AuthContext.jsx:99-106` |

### 4.2 Gestión de Usuarios y Roles (RF-USR) — Solo Admin/Director

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| RF-USR-01 | CRUD usuarios (crear, editar, des/habilitar, eliminar) | `Administracion/docentes.jsx` (para docentes), `Administracion/preceptores.jsx`, `Administracion/administradores.jsx`, `api.js:518-558` |
| RF-USR-02 | Asignación/quitar roles a usuarios | `api.js:538-558` (`quitarRolUsuario`, `getUsuariosConRol`, `getUsuariosSinRol`) |
| RF-USR-03 | Alta de docente con usuario, contraseña, DDJJ, estado, fechas programadas | `Administracion/docentes.jsx:296-308`, `api.js:574-586` |
| RF-USR-04 | Alta de preceptor con asignación de cursos | `Administracion/preceptores.jsx`, `api.js:163-181` |
| RF-USR-05 | Alta de administrador/directivo con cargo | `Administracion/administradores.jsx`, `api.js:158-161` |
| RF-USR-06 | DDJJ Docente: subida, verificación, vista previa, eliminación | `Administracion/docentes.jsx:36-131`, `api.js:109-114, 146-149, 140-144` |
| RF-USR-07 | Verificación de planificaciones docentes | `Administracion/docentes.jsx:194-206`, `api.js:655-658` |

### 4.3 Gestión Académica Base (RF-ACAD) — Admin

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| RF-ACAD-01 | CRUD Cursos (año, división, orientación auto 4°+: 1=Sociales, 2/3=Gestión) | `Administracion/cursos.jsx`, `utils/orientacion.js` |
| RF-ACAD-02 | Asignación de preceptor a curso | `Administracion/cursos.jsx:41-48` |
| RF-ACAD-03 | CRUD Materias | `Administracion/materias.jsx`, `api.js:208-216` |
| RF-ACAD-04 | Asignación Curso-Materia-Docente (titularidad) | `Administracion/asignacionMaterias.jsx`, `api.js:588-600` |
| RF-ACAD-05 | Ciclos Lectivos (años) | `Administracion/cursos.jsx:54-59`, `api.js:430-433` |
| RF-ACAD-06 | Módulos horarios (bloques de hora) | `Administracion/horarios.jsx`, `api.js:387-409` |
| RF-ACAD-07 | Horarios regulares y especiales por Curso-Materia | `Administracion/horarios.jsx`, `api.js:392-428` |
| RF-ACAD-08 | Calendario institucional / Eventos | `Administracion/CalendarioInstitucional.jsx`, `api.js:660-677` |

### 4.4 Asistencia (RF-ASIST) — Dual: Por Curso (Preceptor) y Por Materia (Docente)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-ASIST-01 | Asistencia por día (curso): lista estudiantes, estados (Presente/Ausente/Tarde/Retirado), guardar batch | `Preceptores/asistencias.jsx:290-340`, `api.js:269-272` | Preceptor |
| RF-ASIST-02 | Asistencia por materia (visualización): filtros materia/fecha/estudiante, justificación | `Preceptores/asistencias.jsx:410-556`, `api.js:252-257, 259-262` | Preceptor |
| RF-ASIST-03 | Asistencia docente: registro por preceptor (Presente/Ausente/Tarde), faltas anticipadas | `Preceptores/asistencias.jsx:560-704`, `api.js:298-324` | Preceptor, Jefe, Admin |
| RF-ASIST-04 | Planilla docente por materia: carga con validación de horario (servidor), ventana 20min "carga única" | `Profesores/PanelAsistencia.jsx`, `api.js:238-250, 269-272, 465-468` | Docente |
| RF-ASIST-05 | Bloqueo si docente ausente (marcado por preceptor) o evento institucional activo | `Profesores/PanelAsistencia.jsx:226-279` | Docente |
| RF-ASIST-06 | Justificación de inasistencias (checkbox, patch) | `Preceptores/asistencias.jsx:519-540`, `api.js:259-262` | Preceptor |
| RF-ASIST-07 | Historial / Registro diario por curso/estudiante/fecha | `Preceptores/asistencias.jsx:339-406`, `api.js:291-296` | Preceptor, Admin |
| RF-ASIST-08 | Vista unificada estudiante/familia: resumen 7 días, por materia, detalle con combinación de estados (Ausente+Ausente=Ausente, Presente+Presente=Presente, Ausente+Presente=Tarde, Presente+Ausente=Retirado) | `Shared/AsistenciasUnificada.jsx:41-60, 83-145` | Estudiante, Familia, Preceptor (readOnly) |
| RF-ASIST-09 | Estados de asistencia configurables | `api.js:274-277` | Admin |

### 4.5 Calificaciones y RITE (RF-CALIF)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-CALIF-01 | Carga de calificaciones por Curso-Materia-Período (pre-nota, nota, diagnóstico) | `Profesores/PanelActividades.jsx` (actividades), `Preceptores/notas.jsx` (vista RITE), `api.js:218-236` | Docente, Preceptor |
| RF-CALIF-02 | Guardado en batch (múltiples estudiantes una sola request) | `api.js:233-236` `guardarCalificacionesBatch` | Docente, Preceptor |
| RF-CALIF-03 | Períodos: 1 (1er cuatri), 2 (2do cuatri) → prenota1/nota1, prenota2/nota2 | `DataContext.jsx:433-469`, `utils/rite.js:17-22` | Todos |
| RF-CALIF-04 | Diagnóstico grupal por materia/curso | `DataContext.jsx:622-634`, `api.js:480-488` | Docente, Preceptor |
| RF-CALIF-05 | RITE consolidado por estudiante: tabla principal + previas + recursadas + intensificaciones (1er cuatri, dic, feb) | `utils/rite.js:161-240`, `components/RiteTablaPrincipal.jsx`, `RiteExtras.jsx` | Preceptor, Familia, Estudiante |
| RF-CALIF-06 | Exportación RITE PDF (ventana impresión, CSS @page A4) | `utils/rite.js:320-329`, `Familia/Calificaciones.jsx:88-104` | Preceptor, Familia, Estudiante |
| RF-CALIF-07 | Intensificaciones 1er cuatrimestre, diciembre, febrero | `utils/rite.js:24-52`, `hooks/useRiteAcademico.js` | Preceptor, Familia, Estudiante |
| RF-CALIF-08 | Materias adeudadas / recursadas / previas con estado y notas | `Alumno/PanelMateriasAdeudadasAlumno.jsx`, `api.js:768-800` | Estudiante, Familia, Docente (PanelMateriasAdeudadasDocente) |
| RF-CALIF-09 | Bloqueo de materias por intensificación | `utils/rite.js:32-34` `bloqueos_por_materia` | Preceptor, Familia, Estudiante |
| RF-CALIF-10 | Nota de aprobación = 7 (configurable en `previasRendicion.js:17`) | `utils/previasRendicion.js:19-22` | Todos |

### 4.6 Actas (RF-ACTA)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-ACTA-01 | Tipos de acta: Estudiante, Docente, Curso (resuelve tipo "Evaluación" por defecto) | `Preceptores/actas.jsx:31-43`, `api.js:331-334` | Preceptor, Docente, Jefe, Admin |
| RF-ACTA-02 | Crear acta con título, fecha, descripción, archivo (PDF/DOC/JPG), destinatario según tipo | `Preceptores/actas.jsx:47-167`, `api.js:336-339, 346-353, 356-359, 602-610` | Preceptor, Docente, Jefe |
| RF-ACTA-03 | Edición/eliminación con permisos (creador o admin/director) | `Preceptores/actas.jsx:195-204, 323-397` | Creador, Admin, Director |
| RF-ACTA-04 | Descarga/visualización archivo acta | `Preceptores/actas.jsx:508-512, 574-578, 638-642` | Todos (según visibilidad) |
| RF-ACTA-05 | Filtros año/curso, agrupación por estudiante/docente/curso, colapsables | `Preceptores/actas.jsx:470-665` | Preceptor, Jefe, Admin |
| RF-ACTA-06 | Vista solo lectura para Familia/Estudiante (actas del estudiante) | `Familia/Actas.jsx`, `EstudianteDashboard.jsx` (no hay vista actas en estudiante) | Familia |

### 4.7 Comunicados (RF-COM)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-COM-01 | CRUD comunicados con título, cuerpo, alcances (curso, división, materia, ciclo), archivos adjuntos | `Administracion/comunicados.jsx`, `api.js:612-629` | Admin, Preceptor, Jefe, Docente |
| RF-COM-02 | Filtrado por alcance para Familia/Estudiante (parsea curso → año/división, matchea alcances) | `Familia/Comunicados.jsx:4-18`, `utils/orientacion.js` | Familia, Estudiante |
| RF-COM-03 | Vista compartida `ComunicadosView` reutilizable por rol | `Shared/ComunicadosView.jsx` | Preceptor, Jefe, Docente, Familia, Estudiante |
| RF-COM-04 | Notificación automática al crear comunicado (endpoint `/notificaciones/enviar-carga-unica/`) | `api.js:455-458` | Admin |

### 4.8 Notificaciones (RF-NOTIF)

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| RF-NOTIF-01 | Polling cada 30s (`INTERVALO_POLL_NUEVAS`) detecta nuevas notificaciones | `DataContext.jsx:34-35, 807-835` |
| RF-NOTIF-02 | Deduplicación por ID, baseline de ids iniciales (no toast en carga inicial) | `DataContext.jsx:53-68, 669-671` |
| RF-NOTIF-03 | Toast push para nuevas notificaciones en sesión | `DataContext.jsx:828-829`, `NotificacionToast.jsx` |
| RF-NOTIF-04 | Navegación semántica: `nav_destino` + `nav_params` → `viewDesdeDestino(rol)` | `utils/navDestinos.js`, `Notificaciones.jsx:100-109` |
| RF-NOTIF-05 | Fallback por título si no hay `nav_destino` (legado) | `utils/navDestinos.js:99-106` |
| RF-NOTIF-06 | Autorización por sección real: solo navega si el rol tiene vista para ese destino | `Notificaciones.jsx:159-160`, `utils/navDestinos.js:91-93` |
| RF-NOTIF-07 | Marcar leída individual / todas | `DataContext.jsx:759-794`, `api.js:445-453` |
| RF-NOTIF-08 | Campana en sidebar con contador y animación pulse | `Shared/CampanaNotificaciones.jsx` |
| RF-NOTIF-09 | Familia: pestañas "Del Estudiante" (por hijo seleccionado) / "Personales" (sin alumnoId) | `Notificaciones.jsx:74-86, 274-309` |

### 4.9 Planificaciones y Libro de Temas (RF-PLAN)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-PLAN-01 | Planificación por Curso-Materia: contenido, objetivos, salidas, fundamentación (JSON en campo `descripcion`) | `Profesores/PanelPlanif.jsx:104-116`, `api.js:470-488` | Docente |
| RF-PLAN-02 | Adjunto PDF opcional, estado Borrador/Verificado | `Profesores/PanelPlanif.jsx:254-263`, `api.js:655-658` | Docente |
| RF-PLAN-03 | Verificación por Preceptor/Jefe/Admin (cambia estado a "Verificado", notifica) | `Administracion/docentes.jsx:194-206` | Preceptor, Jefe, Admin |
| RF-PLAN-04 | Libro de Temas: CRUD entradas por Curso-Materia (fecha, tema, contenido, observaciones) | `Preceptores/LibroTemasPreceptor.jsx`, `Profesores/PanelLibroTemas.jsx`, `api.js:742-759` | Docente, Preceptor |
| RF-PLAN-05 | Vista de diagnóstico grupal por curso | `Shared/DiagnosticosView.jsx`, `api.js:480-488` | Docente, Preceptor, Jefe, Admin, Familia, Estudiante |

### 4.10 Suplencias y Adelantos de Horas (RF-SUPL)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-SUPL-01 | Registro suplencia: curso → materia (muestra titular), docente existente o nuevo (crea usuario+docente), nivel (1/2/3), motivo, fechas | `Administracion/suplencias.jsx:32-185`, `api.js:699-721` | Admin |
| RF-SUPL-02 | Resolución docente activo por nivel (mayor nivel gana) y fecha | `utils/suplencias.js:26-35`, `DataContext.jsx:650-660` | Todos (via `mapSuplencias`) |
| RF-SUPL-03 | Indicador en UI: docente suplente activo, materias solo lectura para titular | `Profesores/PanelProfesores.jsx:162-181`, `Profesores/PanelAsistencia.jsx:307-322`, `Profesores/PanelActividades.jsx:464-479`, `Profesores/PanelPlanif.jsx:206-221` | Docente, Preceptor |
| RF-SUPL-04 | Finalizar suplencia (vuelve titular) | `Administracion/suplencias.jsx:287-308`, `api.js:718-721` | Admin |
| RF-SUPL-05 | Adelantos de horas: CRUD, lista | `Administracion/AdelantosHoras.jsx`, `Shared/AdelantosHoras.jsx`, `api.js:723-740` | Preceptor, Jefe, Admin |

### 4.11 Horarios y Vista Pública (RF-HOR)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-HOR-01 | Horarios por Curso-Materia con módulos, aula, día | `Administracion/horarios.jsx`, `api.js:392-409` | Admin |
| RF-HOR-02 | Horarios especiales (excepciones) | `api.js:411-428` | Admin |
| RF-HOR-03 | Vista horarios por curso (solo lectura) para Familia/Estudiante/Preceptor | `Administracion/VistaHorarios.jsx`, `FamiliaDashboard.jsx:104-115`, `EstudianteDashboard.jsx:215-220` | Familia, Estudiante, Preceptor |
| RF-HOR-04 | Horarios de hoy en panel docente (desde `serverInfo.horarios_hoy`) | `Profesores/PanelAsistencia.jsx:408-418` | Docente |

### 4.12 Historial y Auditoría (RF-HIST)

| ID | Requerimiento | Implementación | Rol |
|----|---------------|----------------|-----|
| RF-HIST-01 | Registro de cambios: `/historial/` con filtros, tipos de acción | `Administracion/historial.jsx`, `api.js:689-697` | Admin, Director |
| RF-HIST-02 | Tipos de acción catálogo | `api.js:694-697` | Admin |
| RF-HIST-03 | Trazabilidad en actas: `id_usuario_creador`, `fecha`, `autor` | `DataContext.jsx:483-528` | Todos |

### 4.13 Estadísticas y Supervisión (RF-STAT) — Jefe de Preceptores

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| RF-STAT-01 | Estadísticas de preceptoria: dashboard con métricas | `JefePreceptores/EstadisticasPreceptoria.jsx`, `api.js:679-682` |
| RF-STAT-02 | Supervisión de preceptores: lista, estado, cursos asignados | `JefePreceptores/SupervisionPreceptores.jsx`, `api.js:684-687` |
| RF-STAT-03 | Administración de preceptores (CRUD, asignación cursos) | `JefePreceptores/AdministracionPreceptores.jsx`, `JefePreceptores/AsignacionCursos.jsx` |

---

## 5. Requerimientos No Funcionales (RNF)

| ID | Requerimiento | Evidencia en Código |
|----|---------------|---------------------|
| RNF-01 | **Responsive / Mobile-first** para Familia y Estudiante (header compacto, sidebar colapsable, tablas scroll) | `FamiliaDashboard.jsx`, `EstudianteDashboard.jsx`, `VISUAL_STANDARD.md` |
| RNF-02 | **Accesibilidad básica**: `aria-label`, `role="button"`, `tabIndex`, focus visible, `aria-hidden` en íconos decorativos | `Notificaciones.jsx:166-169`, `CampanaNotificaciones.jsx:41-43`, `VISUAL_STANDARD.md` |
| RNF-03 | **Portal para modales** (FormModal, ConfirmDeleteModal, ModalActividad) → `document.body` para evitar z-index trapping | `Shared/FormModal.jsx`, `Shared/ConfirmDeleteModal.jsx`, `Profesores/PanelActividades.jsx:133-185, 215-305` |
| RNF-04 | **CSS Glassmorphism** via `::before` en `.card` (nunca `backdrop-filter` directo) | `VISUAL_STANDARD.md:104-106`, `index.css` |
| RNF-05 | **Polling eficiente**: guarda única, deduplicación, baseline inicial, evita solapamiento | `DataContext.jsx:141-149, 807-835` |
| RNF-06 | **Manejo de errores centralizado**: `mensajeErrorAmigable` normaliza respuestas backend | `utils/errores.js`, uso extendido en componentes |
| RNF-07 | **Confirmación antes de eliminar** (modal estándar con mensaje contextual) | `utils/confirmarEliminacion.js`, uso en todos los CRUD |
| RNF-08 | **Validación de formularios** en frontend (required, tipos, DNI formateado) | `utils/dni.js`, `Administracion/docentes.jsx:727-731` |
| RNF-09 | **Internacionalización parcial** (es-AR: fechas, números, moneda) | `utils/rite.js:174`, `utils/orientacion.js`, `Shared/AsistenciasUnificada.jsx:22-32` |
| RNF-10 | **Offline-first NO implementado** (todo requiere API) | Gap identificado en relevamiento |
| RNF-11 | **PWA / Service Worker NO implementado** | Gap identificado |
| RNF-12 | **SSO (Google/Microsoft/SAML) NO implementado** | Solo login usuario/contraseña |
| RNF-13 | **Firma digital / Validez legal de PDFs NO implementado** (RITE, actas) | Gap legal identificado |

---

## 6. Reglas de Negocio Críticas (RN)

| ID | Regla | Ubicación |
|----|-------|-----------|
| RN-01 | **Orientación automática**: 4° año en adelante: Div 1 = Sociales, Div 2/3 = Gestión | `utils/orientacion.js:29-35` |
| RN-02 | **Combinación estados asistencia** (orden cronológico): Ausente+Ausente=Ausente, Presente+Presente=Presente, Ausente+Presente=Tarde, Presente+Ausente=Retirado | `Shared/AsistenciasUnificada.jsx:47-60` |
| RN-03 | **Carga única asistencia**: Ventana 20 min otorgada por preceptor → una sola carga, luego bloqueo | `Profesores/PanelAsistencia.jsx:147-151, 195-206` |
| RN-04 | **Suplencia nivel superior gana**: Nivel 3 > 2 > 1 para determinar docente activo | `utils/suplencias.js:28-32` |
| RN-05 | **Nota de aprobación = 7** (constante `NOTA_APROBACION`) | `utils/previasRendicion.js:17` |
| RN-06 | **Secuencia de rendiciones previas/intensificaciones**: No se puede saltar períodos; `proximoPeriodoEditable` valida anteriores completos | `utils/previasRendicion.js:42-56` |
| RN-07 | **Acta tipo "Evaluación" por defecto** si existe, sino primer tipo | `Preceptores/actas.jsx:31-43` |
| RN-08 | **Permisos edición acta**: Creador o Admin/Director; Docente NO edita actas de docentes | `Preceptores/actas.jsx:195-204` |
| RN-09 | **Comunicados alcance**: Sin alcances = General (todos); Con alcances = match por año/división/materia/ciclo | `Familia/Comunicados.jsx:4-18` |
| RN-10 | **Notificación navega solo si rol tiene vista real** para ese destino (no solo si existe `nav_destino`) | `Notificaciones.jsx:159-160`, `utils/navDestinos.js:91-93` |
| RN-11 | **RITE PDF**: 2 páginas (p1: materias regulares + intensificaciones; p2: previas + recursadas), firma y sello | `utils/rite.js:176-239` |
| RN-12 | **Preceptor ve asistencia por materia SOLO lectura** (carga la hace docente) | `Preceptores/asistencias.jsx:412-415` |
| RN-13 | **Docente suplente**: Ve todo pero solo lectura hasta fin de suplencia | Múltiples paneles (ver RF-SUPL-03) |
| RN-14 | **Familia ve notificaciones separadas**: "Del Estudiante" (por hijo) vs "Personales" (sin alumnoId) | `Notificaciones.jsx:74-86` |

---

## 7. Flujos Principales (User Journeys)

### 7.1 Preceptor: Toma de Asistencia Diaria
1. Login → Selecciona rol `preceptor` → Dashboard
2. Sidebar → "Gestión Diaria" o "Asistencias" → Filtra Año/Curso
3. Tab "Asistencia por día" → Lista estudiantes del curso con botones de estado
4. Click estados → Click "Guardar" → Batch `createAsistencia` por estudiante
5. Refresh automático → Ve en "Registro" historial

### 7.2 Docente: Carga de Asistencia por Materia
1. Login → Selecciona rol `docente` → Panel Docente
2. Selecciona Curso + Materia → Sidebar → "Asistencia"
3. Panel verifica `serverInfo` (horario, evento, docente ausente, carga única)
4. Si `enHorarioEfectivo` y `esFechaHoy` → Botones de estado habilitados
5. Click estados → "Guardar Asistencia" → Batch `createAsistencia`
6. Si había "carga única" → `marcarCargaUnica` → Bloqueo posterior

### 7.3 Docente: Carga de Notas
1. Panel Docente → Selecciona Curso/Materia → "Actividades" o "Calificaciones" (según vista)
2. Crea actividad con título, descripción, archivos → `createActividad` (FormData)
3. Para notas formales: Preceptor usa "Notas" → RITE por estudiante → Exporta PDF

### 7.4 Admin: Crear Suplencia
1. Admin Dashboard → "Suplencias" → "Nueva Suplencia"
2. Selecciona Curso → Materia (ve titular actual) → Docente existente o "Crear nuevo docente"
3. Nivel (1/2/3), Motivo, Fechas → Crear
4. Sistema resuelve `docente_activo_hoy` por nivel y fecha → UI muestra badge en todas las vistas

### 7.5 Familia: Consulta RITE e Historial
1. Login → Selecciona rol `familia` → Elige hijo (si tiene varios)
2. Sidebar → "Calificaciones" → Ve tabla completa con intensificaciones, previas, recursadas
3. Botón "Descargar RITE PDF" → Ventana impresión → Guarda/Imprime
4. "Asistencias" → Resumen 7 días, por materia, detalle
5. "Comunicados" → Filtrados por curso del hijo
6. "Notificaciones" → Pestaña "Del Estudiante" / "Personales"

### 7.6 Estudiante: Autogestión Académica
1. Login → Rol `alumno` → Dashboard directo (sin selector de hijo)
2. "Calificaciones" → Tabla + PDF
3. "Asistencias" → Vista unificada (resumen + detalle por materia)
4. "Materias Adeudadas" → Estado, intensificaciones, previas, actividades de apoyo, PDF adjuntos
5. "Horarios" → Vista curso forzado

---

## 8. Endpoints API Referencia (Resumen)

> Ver `frontend/src/services/api.js` para lista completa (~80 endpoints). Categorías:

| Categoría | Endpoints Clave |
|-----------|-----------------|
| **Auth** | `POST /login/`, `POST /rol-activo/`, `GET /me/`, `POST /token/refresh/` |
| **Usuarios/Roles** | `GET/POST/PATCH/DELETE /usuarios/`, `POST /usuarios/quitar-rol/`, `GET /usuarios/con-rol/`, `GET /usuarios/sin-rol/` |
| **Personas** | `GET/POST/PATCH/DELETE /alumnos/`, `/docentes/`, `/preceptores/`, `/directivos/`, `/padres-tutores/` |
| **Académico Base** | `GET/POST/PATCH /cursos/`, `/materias/`, `/curso-materia/`, `/ciclos-lectivos/`, `/periodos/`, `/modulos/` |
| **Horarios** | `GET/POST/PATCH/DELETE /horarios/`, `/horarios-especiales/` |
| **Asistencia** | `GET/POST /asistencias/`, `GET /asistencias/preceptor-materia/`, `GET /asistencias/alumno-detalle/`, `GET /asistencias/asistencia-diaria/`, `GET /asistencias/registro-diario/`, `PATCH /asistencias/{id}/justificar/`, `GET/POST /asistencias-docentes/` |
| **Calificaciones** | `GET/POST/PATCH /calificaciones/`, `POST /calificaciones/batch/` |
| **Actas** | `GET/POST/PATCH/DELETE /actas/`, `/acta-alumno/`, `/acta-curso/`, `/acta-docente/` |
| **Comunicados** | `GET/POST/DELETE /comunicados/`, `POST /comunicado-archivo/` |
| **Notificaciones** | `GET /notificaciones/`, `PATCH /notificaciones/{id}/marcar_leida/`, `PATCH /notificaciones/marcar_todas_leidas/`, `POST /notificaciones/enviar-carga-unica/` |
| **Planificaciones** | `GET/POST/PATCH/DELETE /planificaciones/`, `POST /planificaciones/{id}/verificar/` |
| **Suplencias** | `GET/POST/PATCH/DELETE /suplencias/`, `POST /suplencias/{id}/finalizar/` |
| **Adelantos Horas** | `GET/POST/PATCH/DELETE /adelantos-horas/` |
| **Diagnósticos** | `GET/POST/DELETE /diagnosticos-grupales/` |
| **Régimen Académico** | `GET/POST /materias-adeudadas/`, `POST /materias-adeudadas/{id}/rendir/`, `GET /rendiciones-materias-adeudadas/`, `GET/POST/PATCH/DELETE /actividades-materias-adeudadas/`, `GET/POST/PATCH /intensificaciones-academicas/`, `GET /registro-rendiciones-previas/`, `GET /boletin-academico/{alumnoId}/` |
| **Historial** | `GET /historial/`, `GET /tipos-accion/` |
| **Estadísticas** | `GET /estadisticas-preceptoria/`, `GET /supervision-preceptores/` |
| **Eventos** | `GET/POST/PATCH/DELETE /eventos-institucionales/` |
| **Archivos** | `POST /upload/` |
| **Libro Temas** | `GET/POST/PATCH/DELETE /libro-temas/` |
| **DDJJ Docente** | `POST /ddjj-docente/mi-ddjj/`, `DELETE /ddjj-docente/mi-ddjj/`, `POST /ddjj-docente/{id}/verificar/` |
| **Actividades Docente** | `GET/POST/PATCH/DELETE /actividades-docente/`, `DELETE /actividades-docente/{id}/archivos/{idArchivo}/` |
| **Cargas Únicas** | `GET/POST /cargas-unica/`, `POST /cargas-unica/marcar/` |
| **Servidor** | `GET /asistencias/server-time/` |

---

## 9. Componentes Compartidos (Design System Interno)

| Componente | Props Clave | Uso |
|------------|-------------|-----|
| `FormModal` | `title`, `onClose`, `children` (form) | Todos los CRUD modales |
| `ConfirmDeleteModal` | `message`, `onConfirm`, `confirmText`, `loadingText` | Todas las eliminaciones |
| `CampanaNotificaciones` | `selectedChild` (familia) | Sidebar (badge + pulse) |
| `NotificacionToast` | `userRole` | Toast global nuevas notificaciones |
| `AsistenciasUnificada` | `alumnoId`, `cursoMateria`, `idCurso`, `userRole` | Familia, Estudiante, Preceptor (readOnly) |
| `ComunicadosView` | `userRole`, `cursoSeleccionado`, `materiaSeleccionada`, `selectedChild` | Preceptor, Jefe, Docente, Familia, Estudiante |
| `DiagnosticosView` | `userRole`, `cursoSeleccionado`, `cursosEditables`, `selectedChild` | Todos |
| `ActividadesView` | `userRole`, `cursoId`, `cursoNombre`, `selectedChild` | Preceptor, Familia, Estudiante |
| `RiteTablaPrincipal` / `RiteExtras` | `materias`, `intensificaciones_1c`, `bloqueos_por_materia`, `intensificaciones_posteriores`, `recursadas`, `previas`, `loading` | Preceptor, Familia, Estudiante |
| `VistaHorarios` | `cursosOptions`, `cursoForzado`, `mostrarTitulo` | Familia, Estudiante, Preceptor |
| `FiltrosAnioCurso` | `cursosObj`, `anioLectivo`, `curso`, `onAnioChange`, `onCursoChange` | Preceptor, Jefe, Admin |
| `FilePicker` | `accept`, `value`, `onChange` | Subida archivos (actas, comunicados, actividades, planificaciones, DDJJ) |
| `LoadingSpinner` | `text`, `size`, `inline` | Estados de carga |
| `LoadingScreen` | `fixed`, `text` | Pantalla carga inicial |
| `SidebarToggle` | — | Estudiante (hamburger mobile) |
| `CambiarRolButton` | — | Sidebar (volver a selector de rol) |
| `SeleccionRol` | — | Pantalla post-login multi-rol |
| `AccionesLeyenda` | — | Leyenda de iconos de acciones (editar, eliminar, ver, etc.) |

---

## 10. Utilidades de Dominio (Business Logic Frontend)

| Archivo | Funciones Exportadas | Propósito |
|---------|---------------------|-----------|
| `utils/orientacion.js` | `parseCurso`, `orientacionDeCurso`, `cursoConOrientacion` | Parseo "4°1" → {anio:4, division:1}, orientación automática |
| `utils/previasRendicion.js` | `PERIODOS_RENDICION`, `PERIODO_ORDEN`, `NOTA_APROBACION`, `proximoPeriodoEditable`, `notaGuardada`, `periodoAprobado` | Lógica de rendiciones previas/intensificaciones |
| `utils/rite.js` | `riteHTML`, `exportarRitePDF`, `RITE_CSS` | Generación HTML+CSS RITE oficial 2 páginas |
| `utils/suplencias.js` | `suplenciasActivasLista`, `suplenciasActivasEnFecha`, `esDocenteActivoEnMateria` | Resolución docente activo por nivel/fecha |
| `utils/navDestinos.js` | `viewDesdeDestino`, `tieneVistaParaDestino`, `destinoDesdeTitulo` | Navegación semántica notificaciones → vista por rol |
| `utils/roles.js` | `ROLE_INFO`, `getRoleInfo` | Labels e iconos de roles |
| `utils/dni.js` | `formatDNI`, `cleanDNI` | Formateo/limpieza DNI |
| `utils/errores.js` | `mensajeErrorAmigable` | Normalización errores backend |
| `utils/confirmarEliminacion.js` | `confirmarEliminacion` | Modal confirmación estándar |
| `utils/intensificaciones.js` | Lógica intensificaciones | Apoyo RITE |
| `hooks/useRiteAcademico.js` | `intensificaciones_1c`, `bloqueos_por_materia`, `intensificaciones_posteriores`, `recursadas`, `previas`, `loading` | Hook unificado datos RITE académico |

---

## 11. Gaps y Deuda Técnica Identificada

| Área | Gap | Impacto |
|------|-----|---------|
| **Offline** | No hay Service Worker, IndexedDB, ni sincronización diferida | Docentes en aulas sin señal pierden capacidad de cargar asistencia/notas |
| **PWA** | No manifest, no install prompt, no push nativo | Familia/Estudiante usan web, no "app" |
| **Firma Digital** | RITE y actas PDF sin firma digital ni código de verificación | Validez legal cuestionable |
| **SSO** | Solo login local | Integración con Google Workspace / Microsoft 365 / SAML no disponible |
| **Auditoría Granular** | `/historial/` existe pero no se auditan automáticamente todos los CRUD sensibles | Trazabilidad incompleta |
| **RBAC Granular** | Permisos por rol global, no por curso/materia (ej: preceptor suplente ve todo el curso) | Fuga de información, edición indebida |
| **Migración Datos** | No hay scripts/endpoint de importación masiva (Excel/CSV) para estudiantes, docentes, notas históricas | Puesta en producción requiere carga manual |
| **Integración Externa** | No hay endpoints documentados para SGA provincial, legajos, RRHH | Isla de información |
| **Testing** | Solo `vitest` configurado, sin tests unitarios/e2e visibles | Riesgo regresiones |
| **Logs Frontend** | `console.error` disperso, sin centralizado (Sentry, LogRocket, etc.) | Debugging producción difícil |

---

## 12. Checklist de Verificación Funcional (para QA)

### 12.1 Auth y Roles
- [ ] Login correcto + tokens guardados
- [ ] Refresh token automático tras expiración access
- [ ] Multi-rol: selector aparece, persiste elección, cambio de rol funciona
- [ ] Header `X-Rol-Activo` enviado en requests
- [ ] Logout limpia todo y vuelve a login

### 12.2 Preceptor
- [ ] Filtros Año/Curso funcionan y persisten en navegación
- [ ] Asistencia por día: carga batch, guarda, ve en registro
- [ ] Asistencia por materia: ve, justifica, no puede cargar (solo lectura)
- [ ] Asistencia docentes: registra presente/ausente/tarde, faltas anticipadas
- [ ] Notas: ve RITE por estudiante, exporta PDF individual
- [ ] Actas: crea 3 tipos, adjunta archivo, edita/elimina propias, ve todas (admin)
- [ ] Libro Temas: CRUD entradas
- [ ] Proyectos: CRUD
- [ ] Actividades: CRUD con archivos
- [ ] Adelantos Horas: CRUD
- [ ] Comunicados: crea con alcances, ve los del curso
- [ ] Notificaciones: ve, marca leída, navega por "Ver"

### 12.3 Docente
- [ ] Panel Docente: ve suplencias activas, aviso si suplente
- [ ] Planificaciones: crea/edita/elimina, adjunta PDF, ve estado verificado
- [ ] Libro Temas: CRUD
- [ ] Asistencia: solo en horario / carga única, ve horarios hoy, bloqueado si ausente/evento
- [ ] Actividades: CRUD con archivos, vista previa PDF/imagen
- [ ] Actas Docente: crea/ve propias
- [ ] Estudiantes/Info: ve lista, datos
- [ ] Materias Adeudadas: ve panel estudiantes con deudas

### 12.4 Jefe de Preceptores
- [ ] Panel: ve preceptor propio (o directivo con cargo preceptor)
- [ ] Supervisión: lista preceptores, estados
- [ ] Estadísticas: dashboard métricas
- [ ] Admin Preceptores / Asignación Cursos: CRUD
- [ ] Comunicados Jefe: propios
- [ ] Hereda vistas preceptor (estudiantes, docentes, tutores, asistencias, actas, notas) en readOnly

### 12.5 Admin / Director
- [ ] Usuarios: CRUD docentes, preceptores, administradores, estudiantes
- [ ] Roles: asignar/quitar, ver con/sin rol
- [ ] Cursos: CRUD, activar/desactivar, preceptor, orientación auto
- [ ] Materias: CRUD
- [ ] Asignación Materias: Curso-Materia-Docente
- [ ] Horarios: CRUD regulares + especiales
- [ ] Suplencias: CRUD + crear docente nuevo en flujo, finalizar, nivel, docente activo
- [ ] Calendario/Eventos: CRUD
- [ ] Historial: filtros, tipos acción
- [ ] Adelantos Horas: CRUD
- [ ] Comunicados/Actas/Notas/Asistencias: vistas admin (filtros globales)

### 12.6 Familia
- [ ] Selector de hijo (si múltiples)
- [ ] Resumen: datos estudiante
- [ ] Calificaciones: tabla completa, intensificaciones, previas, recursadas, **PDF**
- [ ] Asistencias: resumen 7 días, por materia, detalle combinado
- [ ] Actas: lista con ver PDF
- [ ] Comunicados: filtrados por curso del hijo
- [ ] Horarios: vista curso forzado
- [ ] Actividades: del hijo
- [ ] Info: diagnósticos
- [ ] Notificaciones: tabs "Del Estudiante" / "Personales", navega por "Ver"
- [ ] Calendario: readOnly

### 12.7 Estudiante
- [ ] Perfil: datos, recursadas
- [ ] Calificaciones: tabla + **PDF descarga**
- [ ] Asistencias: unificada (resumen + detalle)
- [ ] Materias Adeudadas: estado, intensificaciones (con PDF), previas (rendiciones + actividades), observaciones
- [ ] Horarios: curso forzado
- [ ] Comunicados: generales + curso
- [ ] Notificaciones: navega por "Ver"
- [ ] Info: diagnósticos
- [ ] Calendario: readOnly

### 12.8 Transversal
- [ ] Notificaciones polling 30s: llegan nuevas, toast, campana pulse, contador
- [ ] Navegación desde notificación: `nav_destino` → vista correcta por rol
- [ ] Sidebar acordeón: abre/cierra, scroll a sección, chevron rota
- [ ] Header: saludo, avatar con iniciales, badge rol, selectores (si aplica)
- [ ] Modales: Portal a body, no quedan atrapados por cards
- [ ] Responsive: mobile < 768px sidebar colapsable, tablas scroll horizontal
- [ ] Formateo fechas/es-AR, DNI, números consistente

---

## 13. Diccionario de Datos (Campos Críticos)

### 13.1 Usuario (Auth)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | int | PK usuario |
| `usuario` | string | Username login |
| `roles` | string[] | Array de roles asignados |
| `role` | string | Rol activo actual |
| `nombreCompleto` | string | "Apellido, Nombre" |
| `nombre`, `apellido` | string | Componentes nombre |

### 13.2 Estudiante
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` / `id_alumno` | int | PK |
| `dni` | string | Documento (formato XX.XXX.XXX) |
| `nombre`, `apellido` | string | |
| `curso` | string | Nombre curso ej: "4°1" |
| `id_curso` | int | FK Curso |
| `id_tutor` | int|null | FK PadreTutor |
| `id_usuario` | int|null | FK Usuario (para login estudiante) |
| `fecha_nacimiento` | date | |
| `direccion`, `telefono`, `procedencia` | string | |
| `usuario_estado` | bool|null | Habilitado para login |

### 13.3 Curso-Materia (Pivote)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` / `id_curso_materia` | int | PK |
| `id_curso` | int | FK Curso |
| `id_materia` | int | FK Materia |
| `id_docente` | int | FK Docente titular |
| `curso_nombre` | string | Denormalizado |
| `materia_nombre` | string | Denormalizado |
| `docente_nombre` | string | Denormalizado |

### 13.4 Calificación
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_calificacion` | int | PK |
| `id_alumno` | int | FK Estudiante |
| `id_curso_materia` | int | FK Curso-Materia |
| `id_periodo` | int | 1 o 2 (cuatrimestre) |
| `pre_nota` | string/number | Valoración preliminar |
| `nota_numerica` | number | Nota final numérica |
| `diagnostico` | string | Texto diagnóstico |
| `curso_nombre`, `materia_nombre` | string | Denormalizados |

### 13.5 Asistencia
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_asistencia` | int | PK |
| `id_alumno` | int | FK Estudiante |
| `id_curso_materia` | int | FK Curso-Materia |
| `fecha` | date | YYYY-MM-DD |
| `hora` | time | HH:MM |
| `id_estado_asistencia` | int | FK Estado |
| `estado_nombre` | string | "Presente", "Ausente", "Tarde", "Retirado" |
| `justificado` | bool | Si la inasistencia fue justificada |

### 13.6 Notificación
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_notificacion` | int | PK |
| `id_usuario` | int|null | Destinatario usuario |
| `id_alumno` | int|null | Estudiante relacionado (null = personal familia) |
| `titulo` | string | Título notificación |
| `mensaje` | string | Cuerpo |
| `fecha` | datetime | ISO 8601 |
| `leida` | bool | Estado lectura |
| `nav_destino` | string|null | Destino semántico (ej: "calificaciones") |
| `nav_params` | object | Parámetros extra (ej: `{alumnoId: 123}`) |

---

## 14. Versionado y Cambios Recientes (Changelog Interno)

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| **v1.0** | Base | Auth, Roles, Dashboards base, CRUD entidades |
| **v1.1** | +Asistencia | Dual curso/materia, carga única 20min, justificación, docentes |
| **v1.2** | +Calificaciones | Batch, RITE PDF 2 páginas, intensificaciones, previas, recursadas |
| **v1.3** | +Actas | 3 tipos, archivos, permisos creador/admin, filtros |
| **v1.4** | +Comunicados | Alcances, archivos, vista compartida, filtrado familia |
| **v1.5** | +Notificaciones | Polling 30s, deduplicación, toast, navegación semántica, campana pulse |
| **v1.6** | +Planificaciones | JSON estructurado, verificación, libro temas |
| **v1.7** | +Suplencias | Niveles 1/2/3, crear docente en flujo, docente activo dinámico, UI readOnly suplente |
| **v1.8** | +Régimen Académico | Materias adeudadas, intensificaciones, previas, rendiciones, actividades apoyo |
| **v1.9** | +Historial/Estadísticas | `/historial/`, estadísticas preceptoria, supervisión |
| **v1.10** | +Adelantos Horas, DDJJ, Eventos, Cargas Únicas | Módulos admin extendidos |
| **v1.11** | Estándar Visual | `VISUAL_STANDARD.md` aplicado a todos los roles, Portal modales, Glassmorphism |

---

## 15. Próximos Pasos Recomendados (Roadmap Técnico)

1. **Offline-First / PWA**: Service Worker + IndexedDB para asistencia/notas en aula sin conexión
2. **Firma Digital**: Integración certificados (PKI) para RITE y actas con validez legal
3. **RBAC Granular**: Permisos por `id_curso` / `id_curso_materia` (no solo rol global)
4. **Auditoría Automática**: Middleware backend que loguee todos los CRUD sensibles a `/historial/`
5. **Import/Export Masivo**: Endpoints `/import/alumnos`, `/import/docentes`, `/export/boletines` (CSV/Excel)
6. **SSO**: OAuth2/OIDC (Google, Microsoft, SAML) + mapeo roles
7. **Tests**: Unitarios (Vitest + React Testing Library) + E2E (Playwright/Cypress)
8. **Observabilidad**: Sentry / LogRocket + métricas frontend (Web Vitals)
9. **Integración SGA Provincial**: API documentada para sincronizar estudiantes, notas, asistencias
10. **App Móvil Nativa** (React Native / Capacitor) para Familia/Estudiante/Preceptor en patio

---

## 16. Referencias Cruzadas

| Documento | Ubicación |
|-----------|-----------|
| Estándar Visual | `VISUAL_STANDARD.md` |
| Relevamiento Necesidades | `RELEVAMIENTO_SISTEMA_SECUNDARIA7.md` |
| Código Frontend | `frontend/src/` |
| API Endpoints | `frontend/src/services/api.js` |
| Contexto Datos | `frontend/src/context/DataContext.jsx` |
| Contexto Auth | `frontend/src/context/AuthContext.jsx` |
| Utilidades Dominio | `frontend/src/utils/*.js` |
| Hooks | `frontend/src/hooks/*.js` |

---

> **Nota**: Este documento refleja el estado **actual del código en el repositorio**. Cualquier cambio en la implementación debe actualizarse aquí para mantener trazabilidad. Sirve como única fuente de verdad para QA, onboarding, auditoría y planificación de sprints.