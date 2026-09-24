# Documento de Relevamiento — Sistema de Gestión Escolar "Secundaria 7"

---

## 1. Stakeholders a Entrevistar

| Stakeholder | Rol en el Sistema | Justificación |
|-------------|-------------------|---------------|
| Preceptor | Gestión diaria de cursos: asistencia, notas, actas, comunicados, tutores | Usuario principal operativo; define flujos de trabajo reales |
| Jefe de Preceptores | Supervisión de preceptores, estadísticas, asignación de cursos, administración de preceptores | Rol de gestión media; necesita vistas consolidadas y reportes |
| Administrador / Director | Gestión completa: usuarios, roles, cursos, materias, horarios, suplencias, calendario, historial | Dueño del sistema; define políticas, permisos y configuración global |
| Docente (Profesor) | Carga de planificaciones, libro de temas, actividades, asistencia por materia, actas docente, calificaciones | Usuario intensivo en carga de datos académicos; define flujos por materia |
| Familia (Tutor/Padre) | Consulta de calificaciones, asistencias, comunicados, horarios, RITE, actas de sus hijos | Usuario de solo lectura/consulta; necesita información clara y oportuna |
| Estudiante (Estudiante) | Consulta de calificaciones, asistencias, horario, comunicados, RITE PDF, materias adeudadas | Usuario final estudiante; UX simple, mobile-first, autogestión básica |

---

## 2. Preguntas de Relevamiento

### A. Sobre la Situación Actual

| # | Pregunta | Información que se Busca | Importancia |
|---|----------|--------------------------|-------------|
| 1 | ¿Cómo se gestiona actualmente la información académica y administrativa? | Procesos manuales, planillas Excel, papel, sistemas legacy, WhatsApp | Entender el *as-is* para detectar dolores y migración |
| 2 | ¿Qué herramientas utilizan hoy cada rol? | Papel, planillas, SGA anterior, Google Drive, grupos WhatsApp, otros | Identificar qué se reemplaza, qué se integra, hábitos |
| 3 | ¿Qué información registran actualmente por rol? | Campos que capturan: estudiante (DNI, curso, tutor), docente (DDJJ, materia), preceptor (asistencia, notas), admin (usuarios, cursos) | Definir modelo de datos mínimo y migración |
| 4 | ¿Dónde se almacena esa información? | Archivos locales, servidor, Drive, base de datos legacy, papel | Evaluar migración, seguridad, backup |
| 5 | ¿Quién realiza cada tarea operativa? | Responsables por actividad: toma de asistencia, carga de notas, firma de actas, envío de comunicados | Mapear roles, permisos y flujos de aprobación |
| 6 | ¿Qué procedimientos son manuales y repetitivos? | Carga masiva de notas, generación de actas, notificaciones a familias, armado de horarios | Priorizar automatización y batch operations |
| 7 | ¿Qué problemas, errores o quejas aparecen actualmente? | Datos inconsistentes, demoras, pérdida de información, falta de trazabilidad, accesos indebidos | Convertir en requisitos funcionales y no funcionales |

### B. Sobre los Usuarios y Roles

| # | Pregunta | Información que se Busca | Importancia |
|---|----------|--------------------------|-------------|
| 8 | ¿Quiénes utilizarán el sistema en producción? | Lista real de actores con acceso por establecimiento | Definir matriz de usuarios y onboarding |
| 9 | ¿Qué tipos de usuarios/roles existirán? | preceptor, jefe_preceptores, admin, director, docente, familia, estudiante | Diseñar RBAC y navegación por rol |
| 10 | ¿Qué necesidades tiene cada rol? | Casos de uso por rol: preceptor (gestión diaria), docente (planificación), familia (consulta) | Priorizar MVP por valor y frecuencia de uso |
| 11 | ¿Qué información necesita consultar cada rol? | Vistas, dashboards, reportes, filtros por rol | Diseñar UI/UX y permisos de lectura |
| 12 | ¿Qué información puede crear/modificar/eliminar cada rol? | Permisos de escritura por entidad: estudiante, nota, asistencia, acta, comunicado | Definir reglas de autorización y auditoría |
| 13 | ¿Un usuario puede tener múltiples roles simultáneos? | Ej: docente que también es preceptor, admin que es director | Selección de rol activo, permisos compuestos |

### C. Sobre la Gestión Académica (Núcleo del Sistema)

| # | Pregunta | Información que se Busca | Importancia |
|---|----------|--------------------------|-------------|
| 14 | ¿Cómo se organizan los cursos y divisiones? | Años (1° a 6°), divisiones (1,2,3), orientaciones, ciclos lectivos | Estructura base de datos y navegación |
| 15 | ¿Cómo se asignan materias a cursos y docentes? | Curso-Materia-Docente, titularidad, suplencias, horas cátedra | Motor de asignaciones y suplencias |
| 16 | ¿Cómo se gestiona la inscripción de estudiantes a cursos? | Proceso: manual, automática, por tutores, lista de espera | Flujo de alta/baja de estudiantes |
| 17 | ¿Cómo se toma y registra la asistencia? | Por curso (preceptor), por materia (docente), estados: presente, ausente, tarde, justificado | Módulo de asistencia dual (curso/materia) |
| 18 | ¿Cómo se registran y validan las calificaciones? | Períodos (1er cuatrimestre, 2do cuatrimestre), pre-notas, notas finales, diagnósticos, batch | Motor de calificaciones con validaciones |
| 19 | ¿Cómo se generan y firman las actas? | Tipos de acta, firmantes, circuito de aprobación, versión digital vs. papel | Módulo de actas con trazabilidad |
| 20 | ¿Cómo se gestionan las planificaciones y libro de temas? | Entrega por docente, verificación por preceptor/jefe, adjuntos, estados (borrador/aprobado) | Seguimiento pedagógico |
| 21 | ¿Cómo se comunican novedades a familias y estudiantes? | Canales: sistema, email, WhatsApp, papel; alcances: general, curso, materia, estudiante | Módulo de comunicados con alcances |
| 22 | ¿Cómo se gestionan horarios y calendarios? | Módulos horarios, aulas, horarios especiales, eventos institucionales, feriados | Motor de horarios y calendario |
| 23 | ¿Cómo se manejan suplencias y adelantos de horas? | Registro de suplente, fechas, nivel, docente original, horas a recuperar | Gestión de ausencias docentes |
| 24 | ¿Cómo se procesan materias adeudadas, intensificaciones y previas? | Inscripción a rendición, actividades de recuperación, bloqueos por materia | Régimen académico y promoción |

### D. Sobre Situaciones Especiales y Excepciones

| # | Pregunta | Información que se Busca | Importancia |
|---|----------|--------------------------|-------------|
| 25 | ¿Qué ocurre si un estudiante cambia de curso/división durante el año? | Reasignación de notas, asistencias, comunicados, tutores | Integridad referencial y migración de datos |
| 26 | ¿Qué ocurre si un docente toma licencia prolongada? | Suplencia, reasignación de curso-materia, validación de notas | Continuidad pedagógica |
| 27 | ¿Cómo se corrigen errores en notas o asistencias ya cargadas? | Ventana de corrección, quién autoriza, log de cambios, notificación | Trazabilidad y control de calidad |
| 28 | ¿Qué pasa si un tutor no tiene acceso digital? | Alternativas: papel, presencial, delegación en preceptor | Inclusión y accesibilidad |
| 29 | ¿Cómo se gestionan estudiantes con situaciones especiales? | Inclusión, adaptaciones curriculares, certificados médicos | Datos sensibles y visibilidad restringida |
| 30 | ¿Qué ocurre en cierre de ciclo lectivo? | Promoción, repitencia, intensificación, actas de cierre, archivo | Proceso de fin de año |

### E. Sobre Información, Seguridad y Privacidad

| # | Pregunta | Información que se Busca | Importancia |
|---|----------|--------------------------|-------------|
| 31 | ¿Qué datos personales se almacenan por tipo de usuario? | Estudiante: DNI, fecha nac, dirección, teléfono, tutor, médica. Docente: DDJJ, título, cargo. Familia: vínculo, contacto | Cumplimiento Ley 25.326 (Datos Personales) |
| 32 | ¿Quién puede acceder a cada tipo de dato? | Matriz de acceso: admin (todo), preceptor (sus cursos), docente (sus materias), familia (sus hijos), estudiante (suyo) | Principio de menor privilegio |
| 33 | ¿Qué información es pública, privada o restringida? | Calificaciones (privadas), horarios (públicos), actas (restringidas), diagnósticos (docente/preceptor) | Clasificar datos y definir visibilidad |
| 34 | ¿Se necesitan diferentes niveles de acceso dentro de un rol? | Preceptor titular vs. suplente; docente titular vs. suplente; admin vs. director | Jerarquía fina de permisos |
| 35 | ¿Es obligatorio registrar quién, cuándo y qué modificó? | Auditoría completa: user, timestamp, entidad, campo, valor anterior, valor nuevo | Trazabilidad legal y operativa |
| 36 | ¿Qué políticas de backup y retención existen? | Frecuencia, retención, recuperación ante desastres, prueba de restore | Continuidad del negocio |
| 37 | ¿Hay requisitos de firma digital o validación biométrica? | Actas, notas, comunicados oficiales | Validez legal de documentos |

### F. Sobre la Solución Esperada y Aspectos Técnicos

| # | Pregunta | Información que se Busca | Importancia |
|---|----------|--------------------------|-------------|
| 38 | ¿Qué espera obtener la institución como resultado global? | "Unificar información", "reducir papel", "trazabilidad", "comunicación fluida", "reportes automáticos" | Alinear expectativas y definir éxito |
| 39 | ¿Qué funcionalidades son imprescindibles (MVP)? | Must-have: login multi-rol, asistencia, notas, actas, comunicados, notificaciones | Alcance mínimo viable |
| 40 | ¿Qué funcionalidades son deseables (fase 2+)? | Nice-to-have: app móvil nativa, firma digital, integración SGA provincial, analíticas avanzadas | Roadmap |
| 41 | ¿Qué dispositivos utilizarán principalmente cada rol? | Preceptor/Admin: desktop. Docente: desktop/notebook. Familia/Estudiante: móvil (celular) | Responsive / PWA / mobile-first por rol |
| 42 | ¿Desde qué contextos se usa el sistema? | Oficina (preceptor/admin), aula (docente), hogar (familia/estudiante), movimiento (preceptor en patio) | Diseño contextual y offline-first |
| 43 | ¿Existen sistemas actuales con los que integrarse? | SGA provincial, sistema de legajos, RRHH, facturación, web institucional, Google/Microsoft | APIs, SSO, import/export |
| 44 | ¿Qué condiciones debe cumplir la solución para considerarse exitosa? | KPIs: tiempo de carga de notas, % adopción docentes, reducción papel, satisfacción familias | Criterios de aceptación medibles |
| 45 | ¿Qué infraestructura técnica dispone la escuela? | Servidor propio, nube, ancho de banda, dispositivos disponibles, soporte IT | Arquitectura de despliegue |
| 46 | ¿Hay normativas provinciales/nacionales que obliguen formatos? | RITE oficial, actas modelo, planificaciones obligatorias, reportes estadísticos | Cumplimiento normativo |

---

## 3. Información Ya Conocida (HECHOS)

| Ítem | Descripción | Fuente |
|------|-------------|--------|
| Proyecto | Sistema web de gestión escolar "Secundaria 7" | Repositorio / Código actual |
| Roles implementados | preceptor, jefe_preceptores, admin, director, docente, familia, estudiante | `AuthContext.jsx`, `App.jsx` |
| Arquitectura | React 18 + Vite, Context API (Auth, Data), Axios, JWT + Refresh Token, RBAC por header `X-Rol-Activo` | `package.json`, `AuthContext.jsx`, `api.js` |
| Entidades principales | Estudiantes, Docentes, Preceptores, Directivos, Cursos, Materias, Curso-Materia, Calificaciones, Asistencias, Actas, Comunicados, Notificaciones, Horarios, Planificaciones, Libro Temas, Suplencias, Adelantos Horas, Diagnósticos, Padres/Tutores/familias/familias, Inscripciones, Períodos, Ciclos Lectivos, Eventos Institucionales | `DataContext.jsx`, `api.js` |
| Funcionalidades core implementadas | Login multi-rol, selector de rol, dashboard por rol, sidebar acordeón, header estándar, notificaciones push (polling 30s), navegación desde notificaciones, filtros año/curso, carga batch de notas, gestión de suplencias, RITE PDF, historial académico | Código fuente completo |
| Estándar visual | `VISUAL_STANDARD.md` aplicado: header oscuro, sidebar acordeón, cards glassmorphism, FormModal/ConfirmDeleteModal con Portal, íconos FontAwesome | `VISUAL_STANDARD.md`, componentes Shared |
| API Backend | RESTful, endpoints por entidad (CRUD + batch + acciones específicas: verificar, finalizar, marcar leída, etc.) | `api.js` (828 líneas, ~80 endpoints) |
| Notificaciones | Polling cada 30s, detección de nuevas, toast, navegación semántica (`nav_destino`, `nav_params`), campana con pulse | `DataContext.jsx` (líneas 34-68, 141-149, 807-835) |
| Selección de rol | Usuario con múltiples roles elige al entrar; persiste en `sessionStorage` por usuario | `AuthContext.jsx` (líneas 12-14, 37-44, 82-97) |
| Filtros globales | Año lectivo y curso en header (preceptor, jefe, admin); curso/materia en docente; hijo en familia | `DataContext.jsx` (líneas 124-139), dashboards |

---

## 4. Información Pendiente (PENDIENTE DE RELEVAR)

> **Todas las respuestas a las 46 preguntas de la Sección 2 están PENDIENTES DE RELEVAR.**
> No se ha realizado ninguna entrevista ni observación de campo con los stakeholders reales de la institución "Secundaria 7".

Ejemplos críticos pendientes:
- Proceso real de toma de asistencia (curso vs. materia) y validación (P17)
- Reglas de negocio de calificaciones: períodos, pre-notas, decimales, redondeo, diagnóstico obligatorio (P18)
- Circuito de firma/aprobación de actas y planificaciones (P19, P20)
- Alcances reales de comunicados (curso, materia, estudiante, general) y adjuntos (P21)
- Reglas de suplencia: niveles, límites, notificación a docente titular (P23)
- Régimen de promociones, intensificaciones, previas según normativa vigente (P24)
- Matriz real de permisos por dato sensible (DNI, médica, DDJJ) (P31-P33)
- Auditoría: ¿qué entidades requieren log completo? (P35)
- Integración con SGA provincial / legajos / RRHH (P43)
- KPIs de éxito definidos por la dirección (P44)
- Infraestructura de despliegue y soporte IT (P45)
- Formatos obligatorios de RITE, actas, planificaciones (P46)

---

## 5. Supuestos Detectados (SUPUESTOS)

| Supuesto | Origen en Código | Riesgo si es Falso | Validación Necesaria |
|----------|------------------|-------------------|---------------------|
| "Los preceptores gestionan asistencia por curso y docentes por materia" | `Asistencias` (preceptor) vs `PanelAsistencia` (docente) | Puede haber cruce: preceptor también carga por materia | P17, entrevistas |
| "Las calificaciones se cargan en batch por curso-materia-período" | `guardarCalificacionesBatch` en `api.js` + `PanelActividades`/`Notas` | Docentes pueden cargar uno a uno; batch es opcional | P18 |
| "Las actas tienen circuito de firma digital" | `Actas` + `ActaDocente` + `createActaDocente` | Puede ser solo registro, sin firma legal | P19, P37 |
| "Los comunicados tienen alcances flexibles (curso, materia, estudiante)" | `comunicados` con `alcances[]` en `DataContext` | Puede ser solo general o solo curso | P21 |
| "Suplencias tienen niveles (1, 2, 3...) y fechas definidas" | `suplencias.nivel` en `api.js` y `DataContext` | Niveles pueden no usarse o tener otra semántica | P23 |
| "El RITE PDF usa formato oficial de la provincia" | `riteHTML` + `exportarRitePDF` en `utils/rite.js` | Formato puede requerir ajustes legales | P46 |
| "Materias adeudadas/intensificaciones/previas siguen reglamento actual" | Endpoints `/materias-adeudadas`, `/intensificaciones-academicas`, `/registro-rendiciones-previas` | Reglamento puede haber cambiado | P24 |
| "Notificaciones push (polling 30s) son suficientes" | `INTERVALO_POLL_NUEVAS = 30000` en `DataContext` | Puede necesitar WebSockets para tiempo real | P41, P42 |
| "El sistema es mobile-first para familia/estudiante" | `EstudianteDashboard` y `FamiliaDashboard` usan header/sidebar responsive | Puede necesitar PWA o app nativa | P41 |
| "No hay integración SSO (Google/Microsoft/SAML)" | Login solo usuario/contraseña + JWT en `api.js` | Institución puede requerir SSO | P43 |

---

## 6. Problemas Identificados (Derivados del Código y Preguntas Típicas)

| Problema | Evidencia en Código / Pregunta Relacionada | Impacto si No Se Resuelve |
|----------|--------------------------------------------|---------------------------|
| **Doble circuito de asistencia** (curso vs. materia) sin sincronización clara | `Asistencias` (preceptor) usa `getAsistenciasPreceptorMateria`; `PanelAsistencia` (docente) usa mismo endpoint pero distinta UI | Datos inconsistentes, doble carga, confusión |
| **Carga de calificaciones sin validación de reglas de negocio en frontend** | `guardarCalificacionesBatch` acepta cualquier payload; `PanelActividades`/`Notas` no validan rango, decimal, diagnóstico obligatorio | Errores en RITE, reclamos, reprocesos |
| **Actas sin trazabilidad de firmas/estados** | `Actas` CRUD básico; `ActaDocente` separada; no hay campo `estado_firma` ni `firmantes` | Imposible auditar validez legal |
| **Comunicados sin confirmación de lectura por destinatario** | `ComunicadosView` solo muestra; no hay `leido_por` ni acuse de recibo | No hay prueba de notificación fehaciente |
| **Suplencias sin notificación automática al docente titular** | `createSuplencia` / `finalizarSuplencia` existen; no hay trigger de notificación | Docente titular no enterado, conflictos |
| **Historial académico (RITE) sin versión oficial firmada** | `getRiteAcademico` + PDF generado en cliente | PDF manipulable, sin validez legal |
| **Permisos basados solo en rol, sin granularidad por curso/materia** | `X-Rol-Activo` header; `puedeEditar` en docente solo por suplencia | Preceptor suplente ve todo; docente ve todo el curso |
| **No hay offline-first para docentes en aula sin conectividad** | Todo requiere API; `PanelAsistencia`, `PanelActividades` fallan sin red | Pérdida de datos, frustración |
| **Backup y recuperación no documentados ni probados** | No hay endpoints de backup/restore; solo API CRUD | Riesgo de pérdida catastrófica |
| **Migración de datos legacy no planificada** | Sistema nuevo convive con procesos manuales/Excel | Datos históricos incompletos, duplicados |

---

## 7. Necesidades Identificadas (Derivadas de Problemas y Código)

| Necesidad | Tipo | Prioridad | Stakeholder Beneficiado | Componente Relacionado |
|-----------|------|-----------|------------------------|------------------------|
| **Unificación de asistencia curso/materia** con vista consolidada | Funcional | Alta | Preceptor, Docente, Jefe, Admin | `Asistencias`, `PanelAsistencia`, `AsistenciasUnificada` |
| **Validación de reglas de negocio en carga de notas** (rangos, diagnósticos, períodos) | Funcional | Alta | Docente, Preceptor, Admin | `Notas`, `PanelActividades`, `guardarCalificacionesBatch` |
| **Circuito de firma/aprobación de actas y planificaciones** (estados: borrador → revisión → firmado) | Funcional | Alta | Preceptor, Jefe, Docente, Admin | `Actas`, `ActaDocente`, `Planificaciones` |
| **Acuse de recibo de comunicados** (confirmación lectura por familia/estudiante) | Funcional | Media | Familia, Estudiante, Preceptor, Admin | `ComunicadosView`, `Comunicados` |
| **Notificación automática en suplencias** (a docente titular, preceptor, estudiantes) | Funcional | Media | Docente, Preceptor, Estudiante | `Suplencias`, `Notificaciones` |
| **RITE oficial con firma digital / código de verificación** | Funcional / Legal | Alta | Admin, Familia, Estudiante | `riteHTML`, `exportarRitePDF`, `getRiteAcademico` |
| **RBAC granular por curso/materia** (no solo rol global) | No Funcional | Alta | Todos | `AuthContext`, `X-Rol-Activo`, `puedeEditar` |
| **Auditoría completa de cambios sensibles** (notas, asistencias, actas, usuarios) | No Funcional | Alta | Admin, Director, Legal | `Historial` (`/historial/`), `getHistorialCambios` |
| **Modo offline / sincronización diferida** para docentes en aula | No Funcional | Media | Docente, Preceptor | `PanelAsistencia`, `PanelActividades`, `PanelLibroTemas` |
| **PWA / App móvil nativa** para familia y estudiante | No Funcional | Media | Familia, Estudiante | `FamiliaDashboard`, `EstudianteDashboard` |
| **Integración SSO (Google / Microsoft / SAML)** | No Funcional | Baja | Todos | `AuthContext`, `login` |
| **Import/Export masivo** (estudiantes, docentes, notas, horarios) desde Excel/CSV | Funcional | Media | Admin, Preceptor | `Alumnos`, `Docentes`, `Notas`, `Horarios` |
| **Dashboard analítico para Jefe/Admin** (KPIs: asistencia, notas, cobertura docente) | Funcional | Media | Jefe, Admin, Director | `EstadisticasPreceptoria`, `SupervisionPreceptores` |
| **Gestión de documentos adjuntos versionada** (planificaciones, DDJJ, actas, comunicados) | Funcional | Media | Docente, Preceptor, Admin | `Planificaciones`, `DDJJ`, `Actas`, `Comunicados` |

---

## 8. Preguntas que la IA Ayudó a Incorporar

> *Estas preguntas surgieron al aplicar el prompt de la clase sobre la información real del repositorio. La IA no inventó respuestas; solo expandió la cobertura basándose en el código existente.*

| Categoría | Pregunta Adicional | Por Qué Es Importante |
|-----------|-------------------|----------------------|
| **Asistencia** | ¿La asistencia por curso (preceptor) y por materia (docente) deben ser consistentes o son independientes? | Define si hay validación cruzada o son procesos separados |
| **Asistencia** | ¿Existe "asistencia docente" separada de la de estudiantes? | `asistencias-docentes/` endpoints sugieren que sí; ¿cómo se usa? |
| **Calificaciones** | ¿Las pre-notas (prenota1/prenota2) son obligatorias o opcionales? | `Notas` UI muestra ambas; ¿regla de negocio? |
| **Calificaciones** | ¿El diagnóstico grupal es obligatorio por materia/período? | `DiagnosticosView` + `diagnostico` en calificaciones |
| **Actas** | ¿Las actas de estudiante (`acta-alumno`) y docente (`acta-docente`) firman el mismo documento o son actas distintas? | Modelo de datos y flujo de firma |
| **Suplencias** | ¿El campo `nivel` en suplencias indica jerarquía (titular/suplente 1/2) o tipo de suplencia? | `suplencias.nivel ?? 1` en `DataContext` |
| **Planificaciones** | ¿El estado "Borrador" → "Verificado" tiene circuito de aprobación formal? | `verificarPlanificacion` endpoint existe |
| **DDJJ Docente** | ¿La Declaración Jurada es anual y obligatoria para todos los docentes? | `ddjj_presentada`, `ddjj_verificada`, `verificarDdjj` |
| **Materias Adeudadas** | ¿La inscripción a rendición (`rendirMateriaAdeudada`) la hace el estudiante o el preceptor/admin? | `PanelMateriasAdeudadasAlumno` sugiere autogestión |
| **Intensificaciones** | ¿Las intensificaciones académicas son por materia o transversales? | `intensificaciones-academicas` endpoints |
| **Comunicados** | ¿Los archivos adjuntos en comunicados tienen control de versión o caducidad? | `comunicado-archivo` + `archivos[]` en `comunicados` |
| **Notificaciones** | ¿El `nav_destino`/`nav_params` cubre todos los destinos necesarios o faltan? | `viewDesdeDestino` en `navDestinos.js` |
| **Historial** | ¿El `/historial/` registra automáticamente todos los CRUD o solo acciones marcadas? | `getHistorialCambios` + `tipos-accion` |
| **Calendario** | ¿Los eventos institucionales (`eventos-institucionales`) son visibles para todos los roles? | `CalendarioInstitucional` con `readOnly` |
| **Usuarios** | ¿El alta/baja de usuarios y asignación de roles la hace solo admin o hay delegación? | `createUsuario`, `quitarRolUsuario`, `getUsuariosConRol` |

---

## 9. Observaciones del Grupo

1. **El sistema ya tiene código funcional extenso** (~80 endpoints API, 6 dashboards, 100+ componentes). El relevamiento no es "desde cero" sino **validar y completar** lo implementado contra la realidad institucional.

2. **Diferencia crítica entre "qué tiene el código" y "qué necesita la escuela"**: El código implementa *supuestos* de los desarrolladores. El relevamiento debe confirmar si `Asistencias` (curso) y `PanelAsistencia` (materia) reflejan la realidad pedagógica o son una invención técnica.

3. **RBAC actual es por rol global (`X-Rol-Activo`)**, pero la operación real requiere granularidad por curso/materia (ej: preceptor suplente solo ve su curso; docente suplente no edita notas). El relevamiento debe definir la matriz real.

4. **Trazabilidad legal es prioridad**: Actas, notas, RITE, DDJJ requieren auditoría inmutable (`/historial/`). Sin confirmar requisitos legales (P35, P37, P46), el sistema carece de validez oficial.

5. **Familia y Estudiante son "mobile-first" por contexto de uso** (hogar, celular). El código usa header/sidebar responsive, pero no hay PWA, service worker ni offline. Validar si es suficiente (P41, P42).

6. **Notificaciones por polling (30s) funcionan pero no son "tiempo real"**. Para suplencias urgentes, cambios de horario, comunicados críticos, evaluar WebSockets o push nativo (P41).

7. **Migración de datos es el mayor riesgo técnico**: Estudiantes, docentes, cursos, notas históricas, actas previas. Sin plan de migración validado (P1, P3, P4), el sistema nace sin historia.

8. **Normativa provincial define formatos obligatorios** (RITE, actas, planificaciones). El código genera PDF propio (`riteHTML`). El relevamiento debe traer los modelos oficiales (P46).

9. **Integración con SGA provincial / legajos / RRHH** (P43) define si el sistema es "isla" o nodo en ecosistema. Sin API documentada del otro lado, la integración es especulativa.

10. **Criterios de éxito medibles (P44) no existen aún**. Definirlos *antes* de seguir desarrollando: "% docentes cargando notas en sistema", "tiempo de generación de actas", "satisfacción familias (encuesta)", "cero papel en comunicados".

---

## 10. Próximos Pasos Inmediatos

1. **Agendar entrevistas** con los 6 stakeholders (Sección 1) usando las preguntas de la Sección 2 como guía.
2. **Ejecutar observación in situ** (etapa OBSERVAR): preceptor en patio, docente en aula, familia en home, admin en oficina.
3. **Completar matriz HECHO / SUPUESTO / PENDIENTE DE RELEVAR** tras cada entrevista (Regla fundamental de la clase).
4. **Consolidar respuestas** y transformar en **Requisitos Funcionales (RF) y No Funcionales (RNF)** priorizados (MoSCoW).
5. **Validar requisitos** con stakeholders antes de pasar a Diseño / Sprint Planning.
6. **Definir KPIs de éxito (P44)** y línea base actual para medir impacto post-implementación.

---

> **Nota final**: Este documento es vivo. Cada entrevista lo actualiza. La regla de oro: **nada pasa a requisitos sin estar confirmado como HECHO**. El código actual representa *hipótesis de solución*; el relevamiento las valida o las descarta.