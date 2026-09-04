**# Plan del Sistema de Notificaciones — MiSecundaria 7**

\> **\*\*Documento de diseño / investigación. NO modifica código ni base de datos.\*\***

\> Estado: propuesta para revisión. Toda decisión pendiente se marca **\*\*[REQUIERE DECISIÓN]\*\***.

**---**

**## 1. Resumen de la arquitectura propuesta**

Se propone completar el **\*\*esqueleto ya existente\*\*** de un sistema de notificaciones (modelo \`Notificacion\`, \`NotificacionViewSet\`, serializer, endpoint \`/notificaciones/\`, componente \`Notificaciones.jsx\`) en lugar de crear uno nuevo desde cero.

Arquitectura objetivo en dos capas:

1\. **\*\*Backend\*\***: un **\*\*motivo de notificación = un origen\*\*** (\`notifications.py\`) que crea filas \`Notificacion\` en el momento exacto en que ocurre un cambio de estado relevante (POST/PATCH/DELETE de un ViewSet, o evento programado). La API expone lectura (solo las propias / visibles) y el marcado de leída.

2\. **\*\*Frontend\*\***: cada dashboard consume \`getNotificaciones()\`, muestra la lista en la sección "Notificaciones" (ya existe como pestaña en todos los roles) y, opcionalmente, un contador de no leídas.

**\*\*Principio rector de alcance/privacidad\*\***: una notificación solo se crea si el destinatario **\*\*debería\*\*** ver ese evento según las mismas reglas de visibilidad que ya usa el sistema (reutilizar \`\_usuario\_context\` y los patrones de \`\_comunicado\_visible\_para\_ctx\` / \`\_filter\_visible\_comunicados\` de \`views.py\`, y el scoping por \`alumno\_ids\_familia\` / cursos del docente).

**---**

**## 2. Estado actual del sistema (base sobre la que se construye)**

**### 2.1 Modelo \`Notificacion\` (\`models.py:705-717\`) y tabla real**

\| Campo | Tipo | Notas |

\|---|---|---|

\| \`id\_notificacion\` | AutoField PK | |

\| \`id\_usuario\` | FK \`Usuario\`, CASCADE | **\*\*USUARIO DESTINATARIO\*\*** (ver §2.5) |

\| \`id\_alumno\` | FK \`Alumno\`, NULL | **\*\*ALUMNO SOBRE EL QUE TRATA\*\*** (ver §2.5) |

\| \`titulo\` | CharField(255), null | |

\| \`mensaje\` | TextField, null | |

\| \`fecha\` | DateTimeField, null | |

\| \`leida\` | Bool, default False | |

\- \`managed = False\`, tabla real \`notificaciones\`.

\- **\*\*El esquema de la base de datos YA FUE MODIFICADO MANUALMENTE\*\***: la columna \`id\_alumno\` existe en la tabla real (ver §2.5). La actualización de la documentación refleja ese esquema real, no uno futuro.

**### 2.2 Backend existente**

\- \`NotificacionSerializer\` (\`serializers.py:1921-1924\`): \`fields = '\_\_all\_\_'\`.

\- \`NotificacionViewSet\` (\`views.py:3860-3876\`): \`ModelViewSet\`, **\*\*sin \`permission\_classes\`\*\*** (hereda el default \`IsAuthenticated\` de settings), filtro por query-param \`usuario\`, y acción \`marcar\_leida\` (PATCH, fija \`leida=True\`).

\- Ruta: \`router.register(r'notificaciones', views.NotificacionViewSet)\` (\`urls.py:39\`).

\- **\*\*Nada en la lógica de negocio crea notificaciones.\*\*** Solo el comando de seed \`seed\_datos.py\` (líneas 432-451) usa \`Notificacion.objects.get\_or\_create\`.

**### 2.3 Frontend existente**

\- \`Notificaciones.jsx\` es un **\*\*stub\*\***: siempre muestra "No hay notificaciones disponibles" / "(Funcionalidad pendiente de implementación en backend)". Tiene la estructura de pestañas "Del Estudiante / Personales" pensada para el rol **\*\*familia\*\*** (con \`selectedChild\`).

\- Sección "notificaciones" ya integrada como pestaña/sección en:

  - \`AlumnoDashboard.jsx:175-177\` (\`view === 'notificaciones'\`)

  - \`FamiliaDashboard.jsx:189-193\` (pasa \`userRole="familia"\` y \`selectedChild={hijoSeleccionado}\`)

  - \`PanelProfesores.jsx:215-217\` (rol docente)

  - \`PreceptorDashboard.jsx:114-117\`

  - \`JefePreceptorDashboard.jsx:130-133\`

  - \`AdminDashboard.jsx:89-90\` (roles admin **\*\*y\*\*** director)

\- \`DataContext.jsx:134\` ya carga \`getNotificaciones().catch(() => [])\` una vez al montar y lo expone como \`notificacionesRaw\`.

\- \`api.js:392-393\`: \`getNotificaciones(params)\` hace \`GET /notificaciones/\`. **\*\*No hay\*\*** función \`marcarLeida\` en \`api.js\`.

**### 2.4 Vector de navegación**

No hay React Router. Cada dashboard usa un \`useState\` con un string \`view\`/\`seccion\`. El destino de navegación de una notificación será esa misma sección/pestaña existente (\`notificaciones\` para listado, más las secciones específicas para "ir al registro": see §9).

**### 2.5 Esquema REAL actual de la tabla \`notificaciones\` (DEFINITIVO)**

**\*\*IMPORTANTE\*\***: la base de datos **\*\*YA FUE MODIFICADA MANUALMENTE\*\***. Este es el esquema real actual, incorporado a la documentación definitiva del sistema de notificaciones.

\`\`\`text

notificaciones

│

├── id\_notificacion (PK)

├── id\_usuario (FK → usuarios.id\_usuario, NOT NULL)

├── id\_alumno (FK → alumnos.id\_alumno, NULL permitido)

├── titulo

├── mensaje

├── fecha

└── leida

\`\`\`

DDL real:

\`\`\`sql

CREATE TABLE \`notificaciones\` (

  \`id\_notificacion\` int NOT NULL AUTO\_INCREMENT,

  \`id\_usuario\` int NOT NULL,

  \`id\_alumno\` int DEFAULT NULL,

  \`titulo\` varchar(255) DEFAULT NULL,

  \`mensaje\` text,

  \`fecha\` datetime DEFAULT NULL,

  \`leida\` tinyint(1) DEFAULT '0',

  PRIMARY KEY (\`id\_notificacion\`),

  KEY \`id\_usuario\` (\`id\_usuario\`),

  KEY \`idx\_notificaciones\_id\_alumno\` (\`id\_alumno\`),

  CONSTRAINT \`fk\_notificaciones\_alumno\`

    FOREIGN KEY (\`id\_alumno\`) REFERENCES \`alumnos\` (\`id\_alumno\`),

  CONSTRAINT \`notificaciones\_ibfk\_1\`

    FOREIGN KEY (\`id\_usuario\`) REFERENCES \`usuarios\` (\`id\_usuario\`)

) ENGINE=InnoDB AUTO\_INCREMENT=4

  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_0900\_ai\_ci;

\`\`\`

**\*\*Restricciones:\*\***

\`\`\`text

id\_usuario: NOT NULL

id\_alumno : NULL permitido

\`\`\`

**\*\*Foreign keys:\*\***

\`\`\`text

notificaciones.id\_usuario → usuarios.id\_usuario

notificaciones.id\_alumno  → alumnos.id\_alumno

\`\`\`

**\*\*Índices:\*\***

\`\`\`text

id\_usuario

idx\_notificaciones\_id\_alumno

\`\`\`

**#### 2.5.1 Las dos relaciones principales**

La entidad \`Notificacion\` tiene **\*\*dos relaciones principales\*\***:

\`\`\`text

id\_usuario → usuarios.id\_usuario

id\_alumno  → alumnos.id\_alumno

\`\`\`

**##### \`id\_usuario\`**

Representa al **\*\*USUARIO DESTINATARIO\*\*** de la notificación:

\`\`\`text

notificaciones.id\_usuario

        ↓

usuarios.id\_usuario

\`\`\`

La notificación **\*\*pertenece al usuario que la recibe\*\***. No debe interpretarse como "usuario relacionado con el alumno".

**##### \`id\_alumno\`**

Representa al **\*\*ALUMNO SOBRE EL QUE TRATA\*\*** la notificación:

\`\`\`text

notificaciones.id\_alumno

        ↓

alumnos.id\_alumno

\`\`\`

Este campo puede ser **\*\*NULL\*\***. La razón es permitir conservar correctamente notificaciones históricas que existían antes de incorporar esta relación.

**#### 2.5.2 Notificaciones existentes**

Antes del cambio existían **\*\*3 registros\*\*** en \`notificaciones\` (de ahí que \`AUTO\_INCREMENT\` arranca en 4). Por eso \`id\_alumno\` fue agregado permitiendo **\*\*NULL\*\***.

**\*\*No se afirma qué alumno corresponde a esas notificaciones existentes\*\***, porque esa información no fue determinada. No se debe inventar ni asumir datos históricos.

**#### 2.5.3 Caso Familia**

Un usuario con rol **\*\*Familia\*\*** puede estar asociado a varios alumnos mediante las relaciones existentes:

\`\`\`text

usuarios

   ↓

padres\_tutores

   ↓

alumnos

\`\`\`

**\*\*No\*\*** se documenta ni se crea una relación directa \`notificaciones → padres\_tutores\`, porque **\*\*NO existe\*\***. El diseño correcto es:

\`\`\`text

Notificacion

├── id\_usuario → Usuario destinatario

└── id\_alumno  → Alumno relacionado

\`\`\`

Esto permite que un familiar reciba notificaciones independientes sobre cada uno de sus hijos. Ejemplo conceptual:

\`\`\`text

Usuario Familia 1305

│

├── Notificación

│   ├── id\_usuario = 1305

│   └── id\_alumno = 15

│

├── Notificación

│   ├── id\_usuario = 1305

│   └── id\_alumno = 42

│

└── Notificación

    ├── id\_usuario = 1305

    └── id\_alumno = 87

\`\`\`

La pestaña "Del Estudiante" de \`FamiliaDashboard\` filtra por el hijo **\*\*seleccionado\*\*** usando \`id\_alumno\`, y la pestaña "Personales" muestra las que no están asociadas a un hijo concreto (o las del propio usuario).

**#### 2.5.4 REGLA DE SEGURIDAD**

\- \`id\_usuario\` determina **\*\*QUIÉN PUEDE RECIBIR/LEER\*\*** la notificación.

\- \`id\_alumno\` determina **\*\*SOBRE QUÉ ALUMNO\*\*** trata la notificación.

\- **\*\*No\*\*** se debe utilizar \`id\_alumno\` para conceder permisos.

\- La autorización **\*\*siempre\*\*** debe comprobar al **\*\*usuario autenticado\*\***.

\- Para **\*\*Familia\*\***, además debe comprobarse que el \`id\_alumno\` pertenece realmente a uno de sus hijos mediante las relaciones existentes (\`usuarios → padres\_tutores → alumnos\`).

\- **\*\*No confiar en valores enviados por el frontend\*\*** para autorizar acceso (el \`id\_alumno\` de un request no autoriza por sí solo).

**---**

**## 3. Eventos candidatos a generar notificación**

Se relevó el inventario completo de endpoints y sus permisos de escritura (\`views.py\`). Cada evento = origen de notificación. "Genera" = ViewSet que produce el cambio; "Destinatarios" = a quién se le crea la fila.

**### 3.1 Tabla maestra (evento → generador → destinatarios → anti-spam)**

\| # | Evento | Genera (ViewSet / acción) | Destinatarios | Notas / anti-spam |

\|---|---|---|---|---|

\| E1 | Calificación creada/actualizada | \`CalificacionViewSet\` (\`PuedeEscribirCalificaciones\` → admin/director/docente) | Alumno + tutor(es) del alumno | Solo calificaciones de periodos cerrados/publicadas? **\*\*[REQUIERE DECISIÓN]\*\***; avisar por periodo, no por nota insertada aislada |

\| E2 | Calificación eliminada | \`CalificacionViewSet\` DELETE | Alumno + familia | rareza; solo admin/director normalmente |

\| E3 | Asistencia (ausencia) registrada | \`AsistenciaViewSet\` (\`PuedeRegistrarAsistencias\` → admin/director/preceptor/docente) | Alumno + familia | **\*\*Anti-spam crítico\*\***: agrupar por día/jornada (una notificación por fecha con resumen de ausencias), no una por inasistencia |

\| E4 | Apercibimiento / nota de conducta en acta? **\*\*[REQUIERE DECISIÓN]\*\*** | \`ActaViewSet\` / \`ActaAlumnoViewSet\` (\`PuedeGestionarActas\`) | Alumno + familia | solo si hay tipo de acta "apercibimiento/observación" |

\| E5 | Acta **\*\*cerrada/visada\*\*** por director | \`ActaViewSet\` transición de estado | Alumno + familia + docentes involucrados | notificar solo en el "cierre", no en cada edición |

\| E6 | Nota/calificación de acta publicada | \`ActaAlumnoViewSet\` | Alumno + familia | coincidir con criterio E1 |

\| E7 | Comunicado publicado | \`ComunicadoViewSet\` (\`PuedePublicarComunicados\` → admin/director/jefe\_preceptores) | Todos los alcanzados por \`comunicado\_alcance\` | **\*\*Reutilizar\*\*** \`\_filter\_visible\_comunicados\`/alcances; una notificación por comunicado por destinatario |

\| E8 | Planificación subida/actualizada por docente | \`PlanificacionViewSet\` (\`PuedeGestionarPlanificaciones\` → admin/director/docente) | Director (+ jefe de área si existiera) | no a todos; solo supervisión |

\| E9 | DDJJ presentada por docente | \`DdjjDocenteViewSet\` (\`PuedeGestionarAmbitoDocente\`) | Director | |

\| E10 | Materia adeudada / pasa a **\*\*Previa\*\*** | \`MateriaAdeudadaViewSet\`; transición Feb→Previa (\`\_pasar\_a\_previa\`) | Alumno + familia | **\*\*evento académico importante\*\*** |

\| E11 | Rendición de materia adeudada registrada | \`RendicionMateriaAdeudadaViewSet\` (\`IsAdminOrDirectorForWrite\`) | Alumno + familia | |

\| E12 | Intensificación cargada / resultado | \`IntensificacionAcademicaViewSet\` (\`PuedeGestionarAmbitoDocente\`) | Alumno + familia | |

\| E13 | Promoción / no promoción | \`HistorialAcademico\` / \`PromocionAlumnoViewSet\`; \`consolidar\_historial\_alumno\` (cierre de ciclo) | Alumno + familia | al cerrar ciclo, batch |

\| E14 | Usuario habilitado/deshabilitado (programado) | \`middleware\`/\`usuario\_estado.py\` (evento programado) | el usuario afectado, o admin | "tu usuario será deshabilitado el ..." / "fue habilitado" |

\| E15 | Adelanto de horas aprobado | \`AdelantoHorasViewSet\` (\`PuedeGestionarAdelantos\` → admin/director/jefe\_preceptores/preceptor) | Docente solicitante | |

\| E16 | Evento institucional creado/actualizado | \`EventoInstitucionalViewSet\` (\`IsAdminOrDirectorForWrite\`) | alcanzados por \`alcance\` | similar a comunicado |

\| E17 | Suplencia asignada | \`SuplenciaDocenteViewSet\` (\`IsAdminOrDirectorForWrite\`) | Docente suplente | |

\| E18 | Recursada cargada / promovida | \`RecursadaMateriaViewSet\` / \`RecursadaCalificacionViewSet\` (\`IsAdminOrDirectorForWrite\`) | Alumno + familia | |

\| E19 | Horario/bloqueo del alumno modificado | \`BloqueoHorarioAlumnoViewSet\` | Alumno + familia | |

\| E20 | Datos de contacto / usuario del alumno editados por un agente | \`AlumnoViewSet\` (\`PuedeGestionarPersonas\`) | familia + alumnos | menor prioridad **\*\*[REQUIERE DECISIÓN]\*\*** |

**### 3.2 Por rol de destinatario**

\- **\*\*Alumno\*\***: E1, E2, E3, E5, E6, E10, E11, E12, E13, E18, E19, E20.

\- **\*\*Familia (tutor)\*\***: los mismos que el alumno (vía \`Alumno.id\_tutor\`), salvo E20 (es sobre ellos). La pestaña "Del Estudiante" de \`FamiliaDashboard\` muestra las del hijo **\*\*seleccionado\*\***.

\- **\*\*Docente\*\***: E15 (aprobación de su adelanto), E17 (suplencia asignada), E5 (acta propia), E8/E9 (aviso de que su planificación/DDJJ fue revisada? **\*\*[REQUIERE DECISIÓN]\*\***), E7/E16 (solo los alcanzados).

\- **\*\*Preceptor\*\***: E7/E16 alcanzados a sus cursos; E3 (resumen diario de ausencias de sus cursos) **\*\*[REQUIERE DECISIÓN]\*\***.

\- **\*\*Jefe de preceptores\*\***: E7/E16 globales; resúmenes; E6.

\- **\*\*Admin / Director\*\***: E8, E9 (planificaciones/DDJJ de docentes), E6 (actas a visar), E14 (usuarios), resúmenes generales. Ambos roles comparten \`AdminDashboard\`.

**---**

**## 4. Eventos que NO deben generar notificación**

\- **\*\*Lecturas / GET\*\***: nunca notifican.

\- **\*\*Escrituras administrativas de catálogo\*\*** (cursos, materias, módulos, horarios, preceptores, directivos, roles, ciclos, tipos-de-acta, estados-de-asistencia): cambios de configuración, sin destinatario natural salvo auditoría.

\- **\*\*Historial de cambios / \`HistorialCambio\`\*\***: ese es el log de auditoría (tipo de acción), no debe duplicarse como notificación push.

\- **\*\*Cambios internos de estado generados en cascada por otro evento\*\*** que ya notificó (ej.: si E13 ya cubrió la promoción, no duplicar con la calificación subyacente).

\- **\*\*\`Notificacion\` misma\*\***: ni crear ni marcar leída debe regenerar notificaciones (evitar loops).

**---**

**## 5. Anti-spam (control de volumen)**

1\. **\*\*Agregación temporal\*\***: ausencias → **\*\*una por día\*\*** (E3); calificaciones → **\*\*una por periodo\*\*** (E1/E6). [REQUIERE DECISIÓN] el resumen se arma sobre los cambios del día.

2\. **\*\*Umbral de emisión únicamente en transiciones de estado relevantes\*\*** y no en \`update\` que no cambian el valor (comparar estado viejo vs. nuevo; no notificar si no cambió nota/estado).

3\. **\*\*Deduplicación por (destinatario, tipo, clave de entidad, ventana de tiempo)\*\***: evitar duplicados ante retries/reescritura. Ventana sugerida: 24 h para resúmenes **\*\*[REQUIERE DECISIÓN]\*\***.

4\. **\*\*\`get\_or\_create\` con campos estables\*\*** (como ya hace \`seed\_datos.py\`) para eventos únicos (ej. "pasa a Previa", E10) — solo crea si no existe.

5\. **\*\*Máximo de notificaciones por destinatario por día\*\*** y **\*\*límite de antigüedad en la respuesta\*\*** (las muy viejas se marcan/ocultan; política de retención y purga **\*\*[REQUIERE DECISIÓN]\*\***).

6\. Los **\*\*hiper-visibles\*\*** (admin/director) reciben **\*\*resúmenes\*\*** en vez de notificación por cada ítem.

**---**

**## 6. Permisos de acceso (backend)**

\- \`NotificacionViewSet\` debe quedar en **\*\*lectura propia\*\***: el \`get\_queryset\` debe restringir a \`id\_usuario = usuario autenticado\` (hoy solo filtra si viene query-param \`usuario\`, lo que permitiría leer ajenas — **\*\*cambio de código obligatorio, aún no implementado\*\***).

  - Matiz Familia: la pestaña "Del Estudiante" filtra por el hijo seleccionado mediante \`id\_alumno\`. Como \`id\_alumno\` **\*\*ya existe en la DB\*\*** (ver §2.5), la notificación se dirige al **\*\*tutor\*\*** (usuario destinatario = \`id\_usuario\`) y lleva \`id\_alumno\` = el hijo al que se refiere. El frontend filtra por \`id\_alumno\` == hijo seleccionado.

  - Autorización: \`id\_usuario\` determina quién lee (§2.5.4). Para Familia, al consultar por un \`id\_alumno\` concreto, el backend **\*\*debe validar\*\*** que ese alumno pertenece a uno de sus hijos (vía \`usuarios → padres\_tutores → alumnos\`, usando \`alumno\_ids\_familia\` / \`alumno\_del\_usuario\` de \`permissions.py\`). **\*\*No\*\*** se confía en el \`id\_alumno\` enviado por el frontend para conceder permisos (§2.5.4).

\- Acciones de escritura: **\*\*solo el sistema\*\*** crea notificaciones (via \`permission\_classes = [IsAuthenticated]\` no basta; la creación debe ser interna). \`marcar\_leida\` debe validar que la notif pertenezca al usuario autenticado.

\- Reutilizar \`permissions.py\` para el scoping de lectura cuando se necesite (p. ej., un docente viendo notifs de sus cursos): \`\_usuario\_context\`, \`alumno\_ids\_familia\`, \`docente\_del\_usuario\`.

**---**

**## 7. Comportamiento de lectura / "leída"**

\- **\*\*Individual\*\***: \`marcar\_leida\` (ya existe) → PATCH una notif a \`leida=True\`. Debe validar propiedad.

\- **\*\*Marcar todas como leídas\*\***: acción nueva \`marcar\_todas\_leidas\` (batch) en \`NotificacionViewSet\` **\*\*[REQUIERE DECISIÓN sobre si se incluye en el plan MVP]\*\***.

\- **\*\*Contador de no leídas\*\***: el frontend deriva \`count(unread)\` de la lista ya cargada; **\*\*no\*\*** hace falta endpoint adicional en el MVP. (Un endpoint \`/notificaciones/no-leidas/\` sería opcional).

\- **\*\*Auto-relectura para familia\*\***: al cambiar \`hijoSeleccionado\`, el componente vuelve a filtrar por \`id\_alumno\` (no es un refresh). El backend valida que el \`id\_alumno\` consultado pertenece a un hijo del usuario (§6 / §2.5.4).

**---**

**## 8. Arquitectura de la implementación (propuesta)**

**### 8.1 Backend**

\- **\*\*Módulo \`notifications.py\`\*\*** (\`backend/proyecto/escuela/\`): funciones \`notificar(...)\` que reciben (tipo, id\_usuario destino, titulo, mensaje, ref\_entidad, ref\_tipo) y crean la fila respetando **\*\*anti-spam\*\*** y **\*\*deduplicación\*\***. Es la **\*\*única\*\*** puerta de creación.

\- **\*\*Invocación desde los ViewSets\*\***: en los \`perform\_create/perform\_update/perform\_destroy\` (o en acciones \`@action\`) de cada Generador de §3.1, tras una transición de estado **\*\*efectiva\*\***, llamar a \`notificar(...)\`.

\- **\*\*Eventos programados\*\*** (E14, cierre de ciclo E13): hook en el \`middleware\`/\`usuario\_estado.py\` y al correr \`consolidar\_historial\_alumno\` / cierre de ciclo, generando notificaciones en batch.

\- **\*\*Campos de \`Notificacion\`\*\***:

  - \`id\_alumno\` (FK, nullable): **\*\*IMPLEMENTADO EN LA BASE DE DATOS\*\*** (ver §2.5). Ya existe en la tabla real. Queda pendiente solo su uso en la lógica/código (asignarlo al crear notificaciones y usarlo para el scoping de familia).

  - \`tipo\` (categoría: calificacion, asistencia, comunicado, acta, administrativo...): **\*\*pendiente de código/DDL\*\*** **\*\*[REQUIERE DECISIÓN]\*\***.

  - \`id\_referencia\` + \`tipo\_entidad\` para navegación ("ir al registro"): **\*\*pendiente de código/DDL\*\*** **\*\*[REQUIERE DECISIÓN]\*\***.

  - \`fecha\` con \`auto\_now\_add\` (hoy es nullable): **\*\*pendiente de código\*\***.

  - Índice en \`(id\_usuario, leida)\`: **\*\*pendiente de DDL\*\***.

\- **\*\*Cierre \`NotificacionViewSet\`\*\***: restringir lectura al propio usuario; \`permission\_classes = [IsAuthenticated]\` + validación de propiedad en \`marcar\_leida\`; nada de creación por API pública (o bien crear con \`create\` reservado a roles administrativos — **\*\*[REQUIERE DECISIÓN]\*\***, recomendado: internal-only).

**### 8.2 Frontend**

\- \`api.js\`: completar \`marcarLeida(id)\` y \`marcarTodasLeidas()\`.

\- \`Notificaciones.jsx\`: consumir la lista, mostrar título/mensaje/fecha, badge de no leídas, botón "marcar leída" y "marcar todas". Mantener las pestañas de la familia. La pestaña "Del Estudiante" usa \`id\_alumno\` para filtrar por el hijo seleccionado; la pestaña "Personales" muestra las del propio usuario sin asociar a un hijo.

\- \`DataContext\`: refrescar/derivar contador de no leídas; eventualmente exponer notifs por hijo (familia).

**---**

**## 9. Navegación desde una notificación**

\- Al tocar una notificación → abrir la sección correspondiente del dashboard (por \`tipo\_entidad\`): \`notificaciones\` (listado), \`comunicados\`, \`actas\`, \`calificaciones\`/\`boletines\`, \`planificaciones\`, \`eventos\`, \`horarios\`. Cada dashboard ya tiene esas secciones (ver §2.3). **\*\*[REQUIERE DECISIÓN]\*\*** sobre el alcance del deep-link en el MVP (mínimo: ir a la pestaña de listado).

**---**

**## 10. Pruebas (propuesta)**

\- **\*\*Backend (Django test runner)\*\***:

  - Unidad del módulo \`notifications.py\` (deduplicación, agregación, umbrales).

  - Integración: cada Generador emite la notif esperada al destinatario correcto tras el estado real (asistencia, calificación, acta cerrada, pasa a Previa, cierre de ciclo, comunicado).

  - Privacidad: alumno/familia solo ven las suyas/sus hijos; docente solo sus cursos; admin/director ven las propias (según §6); \`marcar\_leida\` valida propiedad.

  - Anti-spam: dos ausencias el mismo día ≡ 1 notif; escribir mismo valor dos veces ≡ 1 notif.

  - \`DROP DATABASE IF EXISTS test\_sistema\_escolar\` antes de \`manage.py test\` (entorno efímero).

\- **\*\*Frontend (vitest)\*\***: render de \`Notificaciones\` con y sin datos; contador de no leídas; marcar leída/todas; pestañas de familia por hijo.

\- **\*\*E2E/regresión\*\***: \`test\_boletin\_e2e\`, \`test\_actas\`, \`test\_permisos\`, \`test\_borrado\_logico\` deben seguir pasando (no romper flujos).

**---**

**## 11. Órden de implementación (fases propuestas)**

1\. **\*\*Fase 0 — Cimientos\*\***: módulo \`notifications.py\` + **\*\*uso de \`id\_alumno\`\*\*** (columna **\*\*IMPLEMENTADA EN LA BASE DE DATOS\*\***, ver §2.5; queda el código para asignarla y usarla en el scoping de familia) + campos \`tipo\`/\`id\_referencia\`/\`fecha\`/índices + cierre de privacidad de \`NotificacionViewSet\` + \`marcarLeida\`/\`marcarTodasLeidas\` en frontend. *\*(Los campos que faltan requieren DDL adicional — coordinado con §8.1.)\**

2\. **\*\*Fase 1 — Prueba piloto de mayor valor\*\***: Comunicados (E7, reutilizando alcances) + Asistencia resumida por día (E3). Valida el patrón end-to-end con bajo riesgo.

3\. **\*\*Fase 2 — Académico núcleo\*\***: Calificaciones por periodo (E1/E6), acta cerrada (E5), pasa a Previa (E10), promoción/cierre de ciclo (E13), rendición (E11), intensificación (E12).

4\. **\*\*Fase 3 — Personal/administrativo\*\***: adelanto de horas (E15), suplencia (E17), usuario habilitado/deshabilitado (E14), planificación/DDJJ (E8/E9), recursada (E18), bloqueo de horario (E19), evento institucional (E16).

5\. **\*\*Fase 4 — Pulido\*\***: deep-linking, alertas en tiempo real (opcional), retención/purga, tuning de anti-spam.

**---**

**## 12. Riesgos y notas**

\- **\*\*DDL\*\***: \`Notificacion\` es \`managed=False\` sobre tabla real \`notificaciones\`. La columna \`id\_alumno\` ya fue agregada manualmente (ver §2.5); el resto de cambios pendientes (\`tipo\`, \`id\_referencia\`, \`fecha\`, índices) siguen requiriendo DDL manual adicional. **\*\*Ningún cambio más de BD se hace en esta fase (\*\***no tocar BD ahora\*\*).\*\*

\- **\*\*Privacidad familia\*\***: el vínculo notif→alumno ya está resuelto a nivel de esquema por \`id\_alumno\` (§2.5). El "Del Estudiante" filtra al tutor con \`id\_alumno\` == hijo seleccionado, **\*\*validando\*\*** en el backend que ese alumno es realmente un hijo del usuario (§6 / §2.5.4).

\- **\*\*Volumen\*\***: el anti-spam (§5) es condición de viabilidad, sobre todo para ausencias (E3).

\- **\*\*\`NotificacionViewSet\` sin restricción de lectura hoy\*\*** = fuga potencial; el cierre de privacidad debe ir en Fase 0.

\- **\*\*Admin y director comparten \`AdminDashboard\`\*\***; no hay \`DirectivoDashboard\`, por lo que las notificaciones de ambos roles se muestran en el mismo componente.

\- **\*\*No hay React Router\*\***: el deep-link se limita a cambiar \`view\`/\`seccion\`, no a rutas.

\- **\*\*Consistencia terminológica\*\***: textos visibles usan Docente/Estudiante; los identificadores internos (\`id\_alumno\`, \`alumnoId\`, rutas, nombres de componentes) no se renombran.

**---**

**## 13. Decisiones pendientes [REQUIERE DECISIÓN]**

1\. \~\~Dirigir notif de familia: Opción A vs B\~\~ → **\*\*RESUELTO por el esquema real\*\*** (§2.5): la notificación se dirige al tutor (\`id\_usuario\`) y lleva \`id\_alumno\` = hijo al que se refiere; el backend valida la filiación. Ya no es una decisión de esquema, sino de implementación del \`get\_queryset\` (§6) y del frontend (§8.2).

2\. Agregación exacta de ausencias (por día) y de calificaciones (por periodo) — §5.

3\. ¿Apercibimientos/conducta en actas generan notificación? (E4) — §3.1.

4\. ¿Notificar la revisión de planificación/DDJJ al docente? (E8/E9) — §3.2.

5\. Uso de \`marcar\_todas\_leidas\` y endpoint de no-leídas en el MVP — §7.

6\. Política de retención/purga y límites diarios — §5.

7\. ¿Los preceptores reciben resumen diario de ausencias de sus cursos? — §3.2.

8\. Deep-link mínimo del MVP (solo ir a "notificaciones" vs. sección específica) — §9.

9\. \~\~Campos adicionales a \`notificaciones\` (DDL)\~\~ → \`id\_alumno\` **\*\*IMPLEMENTADO EN LA BASE DE DATOS\*\*** (§2.5). Siguen pendientes solo el resto de campos \`tipo\`/\`id\_referencia\`/\`fecha\`/índices y su DDL — §8.1.

---

# 14. Plan maestro de implementación

Esta sección convierte el diseño anterior en un **plan de trabajo ejecutable por etapas**.

**Regla general:** cada parte debe implementarse de forma independiente. El agente debe avanzar únicamente sobre la parte solicitada, respetando las partes posteriores como alcance pendiente.

**Reglas obligatorias para todas las partes:**

- Inspeccionar primero el código existente y reutilizar la arquitectura actual.
- No inventar modelos, columnas, relaciones, endpoints ni permisos.
- Respetar la base de datos real y los modelos `managed=False`.
- No romper funcionalidades existentes.
- Mantener la terminología visible **Docente/Docentes** y **Estudiante/Estudiantes**.
- No renombrar identificadores técnicos existentes sin necesidad.
- No modificar datos reales de producción durante los tests.
- No hacer `git reset`, `git clean`, commit ni push salvo solicitud explícita.
- Antes de tocar la DB, indicar exactamente qué cambio es necesario y esperar autorización.
- Si una parte descubre una dependencia que pertenece a otra parte, documentarla y no implementarla fuera de alcance.
- Al finalizar cada parte, ejecutar los tests pertinentes y documentar resultados.

## 14.1 Parte 1 — Infraestructura y seguridad

**Objetivo:** dejar la infraestructura de notificaciones correctamente modelada y segura, sin implementar todavía los eventos de negocio.

### Backend

Implementar:

1. Adaptación definitiva del modelo `Notificacion` al esquema real:
   - `id_usuario` como usuario destinatario.
   - `id_alumno` como alumno relacionado.
   - `id_alumno` nullable.
   - respetar las FK reales.

2. Actualización del `NotificacionSerializer`.

3. Cierre de seguridad de `NotificacionViewSet`:
   - lectura únicamente de las notificaciones del usuario autenticado;
   - no confiar en `?usuario=...`;
   - `marcar_leida` únicamente sobre notificaciones propias;
   - impedir que un usuario autenticado cree arbitrariamente notificaciones para otro usuario;
   - preparar la creación interna para que posteriormente exista una única puerta de creación.

4. Seguridad específica para Familia:
   - `id_usuario` identifica al familiar destinatario;
   - `id_alumno` identifica al hijo al que se refiere;
   - validar mediante las relaciones reales que el alumno pertenece al familiar;
   - `id_alumno` nunca concede permisos por sí mismo.

5. Tolerancia a notificaciones históricas con:
   - `id_alumno = NULL`.

### Frontend

Preparar únicamente la infraestructura necesaria:

- `api.js`;
- `DataContext`;
- carga de notificaciones del usuario autenticado;
- soporte para `id_alumno`;
- función `marcarLeida` si corresponde a la implementación existente.

No implementar todavía la UI completa ni los eventos automáticos.

### Tests mínimos

- lectura propia;
- imposibilidad de leer notificaciones ajenas;
- imposibilidad de marcar como leída una notificación ajena;
- imposibilidad de crear arbitrariamente para otro usuario;
- `id_alumno` presente;
- `id_alumno = NULL`;
- Familia con múltiples hijos;
- Familia sin acceso a un alumno ajeno.

**Criterio de finalización:** la API queda segura y preparada para que el sistema pueda generar notificaciones posteriormente.

**Estado:** PENDIENTE.

---

## 14.2 Parte 2 — Interfaz de notificaciones

**Objetivo:** convertir `Notificaciones.jsx` de stub en una interfaz funcional utilizando la infraestructura de la Parte 1.

Implementar:

- listado de notificaciones;
- título;
- mensaje;
- fecha;
- estado leída/no leída;
- contador de no leídas;
- marcar individual como leída;
- marcar todas como leídas, si se confirma para el MVP;
- actualización correcta del estado en `DataContext`;
- estados vacío/cargando/error;
- integración con todos los dashboards que ya tienen la sección.

### Familia

Mantener las dos vistas existentes:

- **Del Estudiante** → filtrar por `id_alumno` del hijo seleccionado.
- **Personales** → notificaciones que no estén asociadas a un hijo concreto.

El frontend no debe utilizar el filtro para conceder permisos. La autorización continúa siendo responsabilidad del backend.

**Estado:** COMPLETADA. Ver §16 "Parte 2 — Interfaz de notificaciones".

---

## 14.3 Parte 3 — Comunicados y asistencias

Implementar primero los eventos de mayor valor y menor riesgo.

### E7 — Comunicado publicado

Al publicarse un comunicado:

- identificar destinatarios según el alcance real del comunicado;
- reutilizar las funciones de visibilidad existentes;
- crear una notificación por destinatario;
- evitar duplicados.

### E3 — Inasistencia registrada

Al registrarse una ausencia:

- notificar al estudiante;
- notificar al/los familiar/es correspondientes;
- agrupar las ausencias por estudiante y fecha;
- evitar una notificación independiente por cada ausencia del mismo día.

Antes de implementar, verificar exactamente cómo se registra una asistencia y cuándo existe una ausencia efectiva.

**Estado:** COMPLETADA. Ver §16 "Parte 3 — Comunicados y asistencias".

---

## 14.4 Parte 4 — Núcleo académico

Implementar:

### E1/E6 — Calificaciones

- definir exactamente cuándo una calificación se considera visible/publicada;
- no notificar por cada guardado interno si el dato todavía no es visible;
- evitar duplicados;
- considerar una notificación por periodo cuando corresponda.

### E5 — Acta cerrada/visada

- notificar únicamente cuando se produzca el cierre/visado efectivo;
- no notificar por cada edición.

### E10 — Materia pasa a Previa

- notificar al estudiante;
- notificar a la familia;
- emitir solamente ante la transición real a Previa.

### E11 — Rendición de materia adeudada

- notificar cuando la rendición sea efectivamente registrada.

### E12 — Intensificación

- notificar carga/resultado cuando corresponda;
- respetar las reglas ya implementadas para 1.º cuatrimestre, diciembre y febrero;
- conservar el historial.

### E13 — Promoción/no promoción

- generar la notificación durante el cierre/consolidación del ciclo;
- no duplicar eventos ya notificados.

### E18 — Recursada

- notificar carga de recursada;
- notificar resultado/promoción cuando corresponda.

**Estado:** COMPLETADA (E5 DIFERIDO: el modelo actual no posee concepto de acta cerrada/visada; se implementará cuando exista un estado/transición real).

---

## 14.5 Parte 5 — Eventos para Docentes

Implementar:

### E15 — Adelanto de horas aprobado

Notificar al Docente solicitante cuando la solicitud sea aprobada.

### E17 — Suplencia asignada

Notificar al Docente suplente cuando la asignación sea efectiva.

### E8 — Planificación

Notificar al Director y/o responsable correspondiente cuando exista una acción de revisión que realmente deba notificarse.

La notificación de revisión al Docente queda pendiente de decisión.

### E9 — DDJJ

Notificar al Director cuando una DDJJ sea presentada.

La notificación de revisión al Docente queda pendiente de decisión.

**Estado:** COMPLETADA.

---

## 14.6 Parte 6 — Administración, actas y eventos institucionales

Implementar según las decisiones pendientes:

### E4 — Conducta/apercibimientos

Definir si determinados tipos de acta generan notificación.

### E14 — Usuario habilitado/deshabilitado

Notificar al usuario afectado cuando exista un cambio relevante de estado.

### E16 — Evento institucional

Notificar a los usuarios alcanzados según el alcance real del evento.

### E19 — Bloqueo/modificación de horario del estudiante

Notificar al estudiante y familia cuando exista un cambio que deba ser informado.

### E20 — Datos de contacto

Mantener como evento de baja prioridad y no implementarlo hasta decidir si aporta valor suficiente.

**Estado:** COMPLETADA (E20 diferido).

---

---

## 14.7 Parte 7 — Anti-spam y consistencia

Una vez implementados los eventos principales, consolidar las reglas:

- deduplicación por destinatario/evento/referencia;
- evitar notificaciones por actualizaciones que no cambian realmente el estado;
- agregación de asistencias por día;
- agregación de calificaciones según el periodo definido;
- evitar duplicados ante reintentos;
- revisar límites de volumen;
- definir retención/purga;
- evaluar límites diarios solamente si son necesarios.

No introducir límites arbitrarios sin evidencia de necesidad.

**Estado:** COMPLETADA.

---

## 14.8 Parte 8 — Navegación y deep-links

Implementar navegación desde una notificación hacia la sección correspondiente.

Como el proyecto no utiliza React Router, la navegación debe respetar el sistema actual de `view`/`seccion`.

Posibles destinos:

- calificaciones/boletines;
- asistencias;
- intensificaciones;
- previas;
- rendiciones;
- actas;
- comunicados;
- horarios;
- eventos;
- planificaciones.

La referencia de navegación debe servir para orientar la interfaz, **no para autorizar acceso**.

Los permisos deben volver a validarse mediante el backend.

**Estado:** COMPLETADA.

---

## 14.9 Parte 9 — Pruebas integrales y cierre

Realizar una revisión completa del sistema:

### Backend

- tests unitarios de `notifications.py`;
- permisos;
- privacidad;
- Familia/múltiples hijos;
- deduplicación;
- cada evento implementado;
- regresión de funcionalidades existentes.

### Frontend

- render sin notificaciones;
- render con notificaciones;
- no leídas;
- marcar individual;
- marcar todas;
- Familia por hijo;
- actualización del contexto.

### Regresión

Verificar que continúen funcionando los tests existentes relevantes, incluyendo:

- boletín;
- actas;
- permisos;
- borrado lógico;
- autenticación;
- funcionalidades académicas ya implementadas.

**Estado:** COMPLETADA.

---

# 15. Estado de implementación

Esta tabla debe actualizarse a medida que se complete cada parte.

| Parte | Descripción | Estado |
|---|---|---|
| 1 | Infraestructura y seguridad | COMPLETADA |
| 2 | Interfaz de notificaciones | COMPLETADA |
| 3 | Comunicados y asistencias | COMPLETADA |
| 4 | Núcleo académico | COMPLETADA (E5 diferido) |
| 5 | Eventos para Docentes | COMPLETADA |
| 6 | Administración, actas y eventos institucionales | COMPLETADA (E20 diferido) |
| 7 | Anti-spam y consistencia | COMPLETADA |
| 8 | Navegación y deep-links | COMPLETADA |
| 9 | Pruebas integrales y cierre | COMPLETADA |

---

# 16. Registro de implementación

Cada vez que se termine una parte, agregar una entrada siguiendo este formato:

```text
## Parte X — [nombre]
Estado: COMPLETADA
Fecha:
Archivos modificados:
Cambios realizados:
Tests ejecutados:
Resultado:
Decisiones tomadas:
Pendientes:
```

No marcar una parte como COMPLETADA si existen tests fallidos, errores conocidos sin resolver o funcionalidades de esa parte que todavía no fueron implementadas.

---

## Parte 1 — Infraestructura y seguridad
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/models.py` (modelo `Notificacion`: agregado `id_alumno` FK→`alumnos`, nullable, como alumno relacionado; `id_usuario` como destinatario).
- `backend/proyecto/escuela/serializers.py` (`NotificacionSerializer`: `id_notificacion`, `id_usuario`, `id_alumno` de solo lectura).
- `backend/proyecto/escuela/views.py` (`NotificacionViewSet` → `ReadOnlyModelViewSet` con lectura solo propia, sin confiar en `?usuario=`, validación de Familia por `id_alumno` real, `marcar_leida` solo propio).
- `backend/proyecto/escuela/notifications.py` (nuevo): puerta única de creación `notificar(...)`.
- `backend/proyecto/escuela/tests/test_notificaciones.py` (nuevo): 11 tests de la Parte 1.
- `frontend/src/services/api.js` (nuevo `marcarLeida(id)`).
- `frontend/src/context/DataContext.jsx` (carga y expone `notificaciones` con `id_alumno`; helper `marcarNotificacionLeida`).
Cambios realizados:
- Modelo alineado al esquema real de la tabla `notificaciones` (`id_usuario`, `id_alumno` nullable, FKs reales).
- `NotificacionViewSet` cierra la seguridad: lectura únicamente de las notificaciones del usuario autenticado; se ignora `?usuario=`; `marcar_leida` solo sobre notificaciones propias (404 para ajenas); la API pública no crea notificaciones (405 en POST) — la creación queda reservada a la puerta interna `notificar(...)`.
- Seguridad Familia: `id_usuario` identifica al familiar destinatario; `id_alumno` identifica al hijo; al filtrar por `?id_alumno=`, se valida con las relaciones reales que ese alumno es hijo del familiar (si no, respuesta vacía). `id_alumno` nunca concede permisos: la frontera es siempre `id_usuario` del autenticado.
- Tolerancia a notificaciones históricas con `id_alumno = NULL`.
- Frontend: solo infraestructura (servicio `marcarLeida`, carga de notificaciones propias con `id_alumno` en `DataContext`). No se implementó la UI completa (Parte 2) ni los eventos de negocio.
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones`: 11 OK (lectura propia; no lee ajenas; no filtra por `?usuario=` ajeno; no marca leída ajena; marca propia; no crea por API para otro; `id_alumno` presente; `id_alumno` NULL histórica; familia multi-hijos; familia sin acceso a alumno ajeno).
- Regresión: `test_permisos`, `test_borrado_logico`, `test_autenticacion`, `test_actas`, `test_boletin_e2e`: 87 OK.
- Frontend: `npm test` 114 OK (12 archivos); `npm run build` OK.
Resultado:
- Nueva suite de notificaciones: 11/11 OK.
- Regresión backend relevante: 87/87 OK.
- Frontend: 114/114 OK, build OK.
- Nota: `test_asistencias` tiene 3 fallos PREEXISTENTES que documentan un bug real conocido de `AsistenciaViewSet.create` (el endpoint no devuelve 400 sino 201). Se verificó que fallan idénticamente sin los cambios de esta Parte (pre-existentes, no causados por esta Parte).
Decisiones tomadas:
- La creación de notificaciones queda centralizada en `notifications.notificar` (puerta única), no expuesta por la API.
- Familia: la notificación se dirige al tutor como `id_usuario` y referencia al hijo con `id_alumno`; el backend valida la filiación al filtrar por `?id_alumno=`.
Pendientes:
- Anti-spam/deduplicación en `notificar(...)` (Parte 7).
- Interfaz de notificaciones (Parte 2) que consume `notificaciones`/`marcarNotificacionLeida`.
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 2 — Interfaz de notificaciones
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/views.py` (nueva acción `marcar_todas_leidas` en `NotificacionViewSet`: batch solo-propias, respeta el filtro `?id_alumno=` de Familia — solo marca las del hijo seleccionado).
- `backend/proyecto/escuela/tests/test_notificaciones.py` (4 tests nuevos: marca todas propias; no afecta ajenas; Familia marca todas solo del hijo seleccionado; al filtrar por hijo no afecta la personal `id_alumno NULL`).
- `frontend/src/services/api.js` (nuevo `marcarTodasLeidas(params)`).
- `frontend/src/context/DataContext.jsx` (helper `marcarTodasNotificacionesLeidas(ids)` que llama a la API y actualiza el estado local; expuesto en el provider y en `useData`).
- `frontend/src/components/Notificaciones.jsx` (reescrito: de stub a interfaz funcional).
- `frontend/src/index.css` (estilos del listado: `.notificaciones-acciones`, `.notificaciones-lista`, `.notificacion-item`, estados no-leído, encabezado/fecha/mensaje/acción).
- `frontend/src/components/Notificaciones.test.jsx` (nuevo): 10 tests de la UI.
Cambios realizados:
- `Notificaciones.jsx` ahora consume `notificaciones`, `loading`, `error`, `marcarNotificacionLeida` y `marcarTodasNotificacionesLeidas` de `useData()`.
- Listado con título, mensaje y fecha formateada `dd/mm/aaaa hh:mm`.
- Estado leída/no leída: las no leídas se resaltan con borde izquierdo del color primario y badge "Nuevo"; se muestra contador "X sin leer" y botón "Marcar todas como leídas" (visible solo si hay no leídas).
- Marcar individual: botón "Marcar como leída" por notificación no leída; al pulsarlo actualiza el estado en `DataContext`.
- Estados: vacío (ícono + mensaje), cargando (spinner + "Cargando notificaciones…") y error ("No se pudieron cargar las notificaciones.").
- Familia: se mantienen las pestañas "Del Estudiante" (filtra por `id_alumno === selectedChild.alumnoId`; si no hay hijo seleccionado pide elegir estudiante) y "Personales" (`id_alumno` null/undefined). El frontend solo filtra para mostrar; la autorización sigue siendo del backend.
- Otros roles (Alumno, Docente, Preceptor, Jefe de Preceptores, Admin/Director): vista única con sus notificaciones propias (ya restringidas por el backend).
- Backend: `marcar_todas_leidas` usa `get_queryset()` (restringe a `id_usuario` autenticado y respeta `?id_alumno=`), por lo que nunca puede marcar ajenas ni las personales de otro/al filtrar por otro hijo.
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones`: 15 OK (11 de la Parte 1 + 4 nuevos de `marcar_todas_leidas`).
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: `npm test` 124 OK (13 archivos, incluye 10 de `Notificaciones.test.jsx`); `npm run build` OK (187 módulos).
Resultado:
- Suite de notificaciones backend: 15/15 OK.
- Frontend: 124/124 OK, build OK.
- No hay nuevos fallos; se mantienen los 3 fallos PREEXISTENTES de `test_asistencias` (documentados en la Parte 1), ajenos a este alcance.
Decisiones tomadas:
- Se confirmó incluir "Marcar todas como leídas" en el MVP (decisión del usuario) → nueva acción backend `marcar_todas_leidas`.
- El filtrado de la UI (Del Estudiante / Personales) es solo de visualización; los permisos se validan exclusivamente en el backend.
Pendientes:
- Eventos de negocio que generan notificaciones (Partes 3 a 6).
- Anti-spam/deduplicación (Parte 7).
- Navegación contextual y deep-links (Parte 8).
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 3 — Comunicados y asistencias
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/notifications.py` (sin cambios estructurales; se mantiene como puerta única `notificar(...)`).
- `backend/proyecto/escuela/views.py`:
  - Nuevo bloque de funciones de eventos de notificación (tras `_filter_visible_comunicados`): `_usuarios_destinatarios_de_alumno`, `_registrar_o_acumular_ausencia`, `_notificar_inasistencia`, `_alumnos_para_comunicado`, `_notificar_comunicado_publicado`.
  - `ComunicadoViewSet.perform_create`: emite E7 tras publicar.
  - `AsistenciaViewSet.create`: emite E3 tras registrar/actualizar una asistencia.
  - Import `from escuela.notifications import notificar`; `timedelta` añadido al import de `datetime`.
- `backend/proyecto/escuela/tests/test_notificaciones_eventos.py` (nuevo): 8 tests (5 de E3 + 3 de E7).
Cambios realizados:
- E7 — Comunicado publicado: al crear (publicar) un comunicado se notifica a los estudiantes alcanzados por el alcance real (curso + ciclo + división, reutilizando `_curso_matches_alcance`) y a sus familias, una notificación por destinatario con `id_alumno` fijado (para el filtro "Del Estudiante" de Familia). Dedup por (destinatario, alumno, título, mensaje) para evitar duplicados al re-exponer. No se notifica en `update` para no generar spam por ediciones.
- E3 — Inasistencia registrada: al registrar/actualizar una asistencia con estado "Ausente" se notifica al estudiante y a su familia (según existencia de `Alumno.id_usuario`/`PadreTutor.id_usuario`). Agrupación por día: si ya existe una notificación de inasistencia para ese (destinatario, alumno, fecha), se acumula la materia en el mensaje en lugar de crear una notificación por cada ausencia del día. La comparación del día usa un rango horario local (para no fallar por zona horaria de `Notificacion.fecha` en UTC). No notifica cuando el estado no es Ausente (evita falsos positivos en correcciones).
- Toda creación sigue pasando por `notifications.notificar` (puerta única). La autorización no depende de estos emisores: son solo emisores que replican las reglas de visibilidad existentes.
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones_eventos`: 8 OK (E3: notifica a alumno+familia, Presente no notifica, agrupa por día, sin tutor solo alumno, sin usuario de alumno solo familia; E7: alcanzados+familia, alcance global, evita duplicados al re-exponer).
- `manage.py test escuela.tests.test_notificaciones`: 15 OK (sin regresiones).
- `manage.py test escuela.tests.test_permisos`: 45 OK (comunicados/asistencias intactos).
- Suite completa `manage.py test`: 171 tests, `FAILED (failures=3)` — exactamente los 3 fallos PREEXISTENTES de `test_asistencias` (`201 != 400`), idénticos a los documentados en la Parte 1 y verificados como ajenos a esta Parte.
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: sin cambios en la Parte 3; `npm run build` OK (187 módulos) y `npm test` 124 OK (13 archivos).
Resultado:
- Eventos E7 y E3 implementados y cubiertos por tests.
- Sin nuevos fallos; se mantienen solo los 3 preexistentes de `test_asistencias`.
Decisiones tomadas:
- E7 se emite únicamente al publicar (create), no en `update` (para evitar notificaciones por cada edición; alinear con anti-spam §5.2).
- E7 notifica a estudiantes alcanzados + familias. La notificación a docentes/preceptores/jefe-de-preceptores alcanzados queda pendiente de decisión (se alineará con la Parte 7 anti-spam/resúmenes).
- E3 notifica al estudiante y a su familia, con agrupación por (destinatario, alumno, fecha) acumulando materias en un único mensaje diario.
Pendientes:
- E7: notificar a docentes/preceptores alcanzados (rol) — [REQUIERE DECISIÓN], probablemente en Parte 7 (resúmenes).
- Resto de eventos de negocio (Partes 4 a 6).
- Anti-spam/deduplicación general y límites por destinatario (Parte 7).
- Navegación contextual y deep-links (Parte 8).
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 4 — Núcleo académico
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/notifications.py`: añadido `notificar_alumno(alumno, titulo, mensaje, dedupe=True)` como helper reutilizable (usa `notificar` puerta única, resuelve `id_usuario` del alumno + `id_usuario` del tutor, deduplicación por contenido idéntico).
- `backend/proyecto/escuela/views.py`:
  - `_notificar_calificacion(calificacion, accion)` (E1/E6): hook en `CalificacionViewSet.perform_create`/`perform_update`. No existe campo "publicada" → notifica al guardar con dedup por contenido (misma materia/período/nota).
  - `_notificar_previa(alumno, materia)` (E10): hook en `_pasar_a_previa` (solo transición real a PREVIA vía get_or_create; dedup evita repetidos).
  - `_notificar_rendicion(ma, rendicion)` (E11): hook en `MateriaAdeudadaViewSet.rendir` tras crear la rendición.
  - `_notificar_intensificacion(instancia)` (E12): hooks en `IntensificacionAcademicaViewSet.create`/`update` cuando hay nota y se deriva el resultado (APROBADA/DESAPROBADA), usa `PERIODO_DISPLAY` para etiqueta amigable.
  - `_notificar_recursada(recursada, accion)` (E18): hooks en `RecursadaMateriaViewSet.perform_create` (carga) y `perform_update` (transición a APROBADA/DESAPROBADA).
- `backend/proyecto/escuela/academico.py`:
  - Import `notificar_alumno`; `_notificar_consolidacion(alumno, cm, estado_materia)` (E13) invocado dentro de `consolidar_historial_alumno` tras `update_or_create` del historial (notifica "Materia aprobada" / "Materia adeudada" por materia; dedup evita duplicados en reprocesamiento de cierre).
  - E5 (Acta cerrada/visada): **DIFERIDO** — el modelo actual no tiene estado/transición de cierre/visado; se implementará cuando exista un evento real.
- `backend/proyecto/escuela/tests/test_notificaciones_eventos_parte4.py` (nuevo): 12 tests (E1/E6, E10, E11, E12, E13, E18).
Cambios realizados:
- E1/E6 — Calificaciones: se notifica al crear y al actualizar una calificación. Al no existir un estado "publicada" en el modelo, la notificación se emite al guardar (create/update); la deduplicación por contenido idéntico evita spam por re-guardados de la misma nota (misma materia/período/valor).
- E10 — Materia pasa a Previa: se emite solo en la transición real (`_pasar_a_previa`, idempotente por `get_or_create`); notifica a alumno y tutor.
- E11 — Rendición: se emite tras registrar efectivamente la rendición (incluye instancia, nota, resultado).
- E12 — Intensificación: se emite cuando la instancia obtiene resultado (nota procesada), tanto en create como update; usa `PERIODO_DISPLAY` para "Julio", "Diciembre 1", etc.
- E13 — Promoción/no promoción por materia durante consolidación: se emite en `consolidar_historial_alumno` cuando `estado_materia` queda `aprobada` o `adeudada`; notifica alumno + tutor por materia; dedup evita repetidos si se re-procesa el cierre.
- E18 — Recursada: se emite al cargar (`perform_create`) y al pasar a APROBADA/DESAPROBADA (`perform_update` con cambio de estado).
- E5 — Acta cerrada/visada: **DIFERIDO**. El modelo `Acta` no tiene campo/estados de cierre/visado; no se inventa lógica proxy. Se implementará cuando el modelo incorpore la transición real.
- Toda creación pasa por `notifications.notificar` / `notificar_alumno` (puerta única). Respeta las reglas de visibilidad/alcance existentes (famlia vía `id_alumno` + tutor, alumno vía `id_usuario`).
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones_eventos_parte4`: 12 OK.
- `manage.py test escuela.tests.test_notificaciones escuela.tests.test_notificaciones_eventos escuela.tests.test_notificaciones_eventos_parte4 escuela.tests.test_academico`: 51 OK (Partes 1, 3, 4 + académico, sin regresiones).
- `manage.py test escuela.tests.test_actas escuela.tests.test_boletin_e2e`: 35 OK.
- `manage.py test escuela.tests.test_permisos`: 37 OK.
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: `npm run build` OK (187 módulos); `npm test` 124 OK (13 archivos).
Resultado:
- 6 eventos implementados (E1/E6, E10, E11, E12, E13, E18) con 12 tests dedicados; E5 diferido explícitamente.
- Sin regresiones en backend (86 tests de regresión OK) ni frontend (124/124 OK).
- Se mantienen solo los 3 fallos preexistentes de `test_asistencias` (documentados en Parte 1).
Decisiones tomadas:
- E1/E6: sin campo "publicada", se notifica al guardar; dedup por contenido evita re-notificar la misma nota.
- E13: se notifica por materia (`aprobada`/`adeudada`) durante la consolidación del ciclo; la promoción global (PROMOVIDO/REPITENTE) es manual vía `PromocionAlumno` y queda [REQUIERE DECISIÓN].
- E5: no se implementa proxy; se deja [REQUIERE DECISIÓN] pendiente hasta que el modelo tenga un evento de cierre/visado real.
- `notificar_alumno` centraliza la resolución alumno+tutor + dedup para todos los eventos académicos.
Pendientes:
- Anti-spam/deduplicación general y límites por destinatario (Parte 7).
- Navegación contextual y deep-links (Parte 8).
- Resto de eventos de negocio (Partes 5 y 6).
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 5 — Eventos para Docentes
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/views.py`:
  - Helpers de notificación: `_usuarios_directivos()`, `_notificar_adelanto_aprobado()`, `_notificar_suplencia_asignada()`, `_notificar_planificacion_para_revision()`, `_notificar_ddjj_presentada()`.
  - `AdelantoHorasViewSet.perform_create`: hook E15 (notifica al docente del adelanto).
  - `SuplenciaDocenteViewSet.perform_create`: hook E17 (notifica al docente suplente).
  - `PlanificacionViewSet.create`/`update`: hook E8 (notifica a directivos cuando un docente crea/actualiza planificación en estado 'Borrador').
  - `DdjjDocenteViewSet.mi_ddjj` (POST): hook E9 (notifica a directivos cuando se presenta DDJJ).
- `backend/proyecto/escuela/tests/test_notificaciones_eventos_parte5.py` (nuevo): 9 tests (E15, E17, E8, E9).
Cambios realizados:
- E15 — Adelanto de horas aprobado: la creación del adelanto por usuario autorizado (preceptor/admin/director) equivale a aprobación; notifica al `id_docente` del adelanto si tiene usuario asociado.
- E17 — Suplencia asignada: la creación de una suplencia activa notifica al `id_docente_suplente` si tiene usuario asociado.
- E8 — Planificación para revisión: cuando un docente (rol 'docente') crea o actualiza una planificación, notifica a usuarios con roles 'admin'/'director'. La revisión formal queda pendiente (Parte 7); aquí solo aviso de contenido nuevo.
- E9 — DDJJ presentada: al presentar DDJJ vía `mi_ddjj` POST, notifica a directivos (admin/director).
- `_usuarios_directivos()` centraliza la resolución de usuarios con roles admin/director para E8 y E9.
- Todas las notificaciones usan `notifications.notificar()` (puerta única), con `id_alumno=NULL` (eventos sin alumno asociado).
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones_eventos_parte5`: 9 OK.
- `manage.py test escuela.tests.test_notificaciones escuela.tests.test_notificaciones_eventos escuela.tests.test_notificaciones_eventos_parte4 escuela.tests.test_notificaciones_eventos_parte5 escuela.tests.test_academico`: 60 OK (Partes 1, 3, 4, 5 + académico, sin regresiones).
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: `npm run build` OK (187 módulos); `npm test` 124 OK (13 archivos).
Resultado:
- 4 eventos implementados (E15, E17, E8, E9) con 9 tests dedicados.
- Sin regresiones en backend (60 tests de notificaciones + académico OK) ni frontend (124/124 OK).
- Se mantienen solo los 3 fallos preexistentes de `test_asistencias`.
Decisiones tomadas:
- E8: notifica solo en create/update por docente (no admin/director); estado 'Borrador' usado como disparador; revisión formal [REQUIERE DECISIÓN] (Parte 7).
- E9: notifica en POST a `mi_ddjj` (creación); update/delete no permitidos (405).
- E15/E17: notificación al docente vía `Docente.id_usuario`; si no tiene usuario, no notifica (silencioso).
- Notificaciones de docentes usan `id_alumno=NULL` (no hay alumno asociado).
Pendientes:
- Anti-spam/deduplicación general y límites por destinatario (Parte 7).
- Navegación contextual y deep-links (Parte 8).
- Resto de eventos de negocio (Partes 6).
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 6 — Administración, actas y eventos institucionales
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/views.py`:
  - Helpers de notificación: `_es_tipo_acta_conducta()`, `_notificar_acta_conducta()`, `_notificar_usuario_estado()`, `_notificar_evento_institucional()`, `_notificar_bloqueo_horario()`.
  - `ActaAlumnoViewSet.perform_create`: hook E4 (notifica al asociar acta de tipo conducta/apercibimiento).
  - `UsuarioViewSet.perform_update`: hook E14 (notifica al usuario cuando cambia su estado habilitado/deshabilitado).
  - `EventoInstitucionalViewSet.perform_create`/`perform_update`: hook E16 (notifica a alumnos/familias según alcance del evento).
  - `BloqueoHorarioAlumnoViewSet.perform_create`/`perform_update`: hook E19 (notifica al crear bloqueo activo o desactivarlo).
- `backend/proyecto/escuela/tests/test_notificaciones_eventos_parte6.py` (nuevo): 12 tests (E4, E14, E16, E19).
Cambios realizados:
- E4 — Conducta/apercibimientos: al crear `ActaAlumno` para un acta cuyo `id_tipo_acta.nombre_tipo` está en `TIPOS_ACTA_CONDUCTA` (`Apercibimiento`, `Conducta`, `Amonestación`, `Sanción`), notifica al alumno y a su familia. Otros tipos (ej. `Comunicación`) no disparan notificación.
- E14 — Usuario habilitado/deshabilitado: en `UsuarioViewSet.perform_update`, detecta cambio en campo `estado` y notifica al usuario afectado ("Cuenta habilitada" / "Cuenta deshabilitada"). Silencioso si no hay cambio o no hay `pk`.
- E16 — Evento institucional: al crear/actualizar `EventoInstitucional`, notifica a alumnos y familias según alcance (`todo_dia`, `mañana`, `tarde`, `franja`, `permanente`), reutilizando la lógica de `_alumnos_para_comunicado`. Dedup por (destinatario, alumno, título, mensaje) evita duplicados al re-exponer.
- E19 — Bloqueo/modificación de horario: al crear `BloqueoHorarioAlumno` con `estado=True` notifica "Bloqueo de horario por superposición"; al pasar `estado` a `False` notifica "Bloqueo de horario levantado". No notifica si se crea inactivo (`estado=False`).
- E20 — Datos de contacto: **DIFERIDO** — baja prioridad, se decidirá en Parte 7/8 si aporta valor.
- Toda creación pasa por `notifications.notificar()` / `notificar_alumno()` (puerta única). E4/E16/E19 usan `id_alumno` para filtro "Del Estudiante"; E14 usa `id_alumno=NULL`.
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones_eventos_parte6`: 12 OK.
- `manage.py test escuela.tests.test_notificaciones escuela.tests.test_notificaciones_eventos escuela.tests.test_notificaciones_eventos_parte4 escuela.tests.test_notificaciones_eventos_parte5 escuela.tests.test_notificaciones_eventos_parte6 escuela.tests.test_academico`: 72 OK (Partes 1, 3, 4, 5, 6 + académico, sin regresiones).
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: `npm run build` OK (187 módulos); `npm test` 124 OK (13 archivos).
Resultado:
- 4 eventos implementados (E4, E14, E16, E19) con 12 tests dedicados; E20 diferido explícitamente.
- Sin regresiones en backend (72 tests de notificaciones + académico OK) ni frontend (124/124 OK).
- Se mantienen solo los 3 fallos preexistentes de `test_asistencias` (documentados en Parte 1).
Decisiones tomadas:
- E4: conjunto de tipos de acta configurado en `TIPOS_ACTA_CONDUCTA`; extensible sin tocar código.
- E14: notifica solo en transición real de `estado`; no notifica en create (el usuario se crea habilitado).
- E16: reutiliza lógica de alcance de comunicados/actas; dedup por contenido idéntico.
- E19: notifica solo si bloqueo creado con `estado=True` o transición a `False`.
- E20: diferido, baja prioridad [REQUIERE DECISIÓN].
- Helpers centralizan resolución de destinatarios y dedup.
Pendientes:
- Anti-spam/deduplicación general y límites por destinatario (Parte 7).
- Navegación contextual y deep-links (Parte 8).
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 7 — Anti-spam y consistencia
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/notifications.py`: reescritura completa con reglas centralizadas de anti-spam.
  - `notificar()`: puerta única con límites diarios/horarios, anti-ráfaga (5 min), deduplicación por `dedupe_key` (referencia externa).
  - `notificar_alumno()`: 3 estrategias de deduplicación — `CONTENT` (contenido idéntico), `DAILY` (una por día, acumula mensajes), `REFERENCE` (por `dedupe_key` tipo `calificacion_123`).
  - `ejecutar_mantenimiento()` / `_purgar_notificaciones_antiguas()`: purga automática > `RETENCION_DIAS` (180 días por defecto).
  - Límites configurables: `MAX_NOTIFICACIONES_POR_USUARIO_DIA=50`, `MAX_NOTIFICACIONES_POR_USUARIO_HORA=10`.
- `backend/proyecto/escuela/views.py`:
  - `_notificar_inasistencia`: migración a `notificar_alumno(..., strategy='DAILY')` (elimina `_registrar_o_acumular_ausencia`).
  - `_notificar_calificacion`: usa `strategy='REFERENCE'` con `dedupe_key='calificacion_{pk}'` (evita duplicados aunque cambie diagnóstico).
- `backend/proyecto/escuela/tests/test_notificaciones_anti_spam.py` (nuevo): 15 tests (límites, anti-ráfaga, 3 estrategias de dedup, purga, integración con emisores).
Cambios realizados:
- Deduplicación centralizada: todo pasa por `notifications.notificar()` / `notificar_alumno()`.
- 3 estrategias de deduplicación según necesidad:
  - CONTENT: default, por contenido idéntico (usuario, alumno, título, mensaje).
  - DAILY: asistencias — agrupa por día, acumula materias en el mensaje.
  - REFERENCE: calificaciones/rendiciones/actas — por clave externa (PK), actualiza mensaje si cambia.
- Límites de volumen: diario (50) y horario (10) por usuario; `check_limits=False` para eventos críticos.
- Anti-ráfaga: ventana de 5 minutos evita duplicados por reintentos de red.
- Purga automática: `ejecutar_mantenimiento()` elimina notificaciones > 180 días (invocable vía cron).
- Integración: `_notificar_inasistencia` usa DAILY; `_notificar_calificacion` usa REFERENCE.
- No se introdujeron límites arbitrarios sin evidencia; valores por defecto conservadores.
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones_anti_spam`: 15 OK.
- `manage.py test escuela.tests.test_notificaciones escuela.tests.test_notificaciones_eventos escuela.tests.test_notificaciones_eventos_parte4 escuela.tests.test_notificaciones_eventos_parte5 escuela.tests.test_notificaciones_eventos_parte6 escuela.tests.test_notificaciones_anti_spam`: 71 OK (sin regresiones).
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: `npm run build` OK (187 módulos); `npm test` 124 OK (13 archivos).
Resultado:
- Reglas de anti-spam y consistencia centralizadas en `notifications.py`.
- 15 tests dedicados + 71 tests de regresión OK.
- Sin regresiones en backend ni frontend.
- Se mantienen solo los 3 fallos preexistentes de `test_asistencias`.
Decisiones tomadas:
- Límites diarios/horarios conservadores (50/10) — ajustables solo con evidencia.
- Purga a 180 días — configurable vía constante.
- Anti-ráfaga de 5 min — evita spam por reintentos sin afectar UX.
- Estrategia REFERENCE para calificaciones usando PK — evita duplicados aunque cambie diagnóstico.
- Estrategia DAILY para asistencias — mantiene comportamiento E3 de agrupar por día.
- No se añadió campo `dedupe_key` al modelo; se usa marcador en `mensaje` (`[ref:...]`) para evitar migración.
Pendientes:
- Navegación contextual y deep-links (Parte 8).
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 8 — Navegación y deep-links
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- `backend/proyecto/escuela/notifications.py`: añadido parámetro `nav` a `notificar()` y `notificar_alumno()` para metadatos de navegación (destino, params).
- `backend/proyecto/escuela/serializers.py`: `NotificacionSerializer` ahora expone `nav_destino` y `nav_params` extrayéndolos del mensaje (formato `[nav:{...}]`).
- `backend/proyecto/escuela/views.py`: actualizados todos los emisores de eventos (E1/E6, E3, E4, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19) para incluir metadatos `nav` con destino y parámetros relevantes.
- `backend/proyecto/escuela/academico.py`: `_notificar_consolidacion` incluye nav hacia boletín.
- `frontend/src/context/DataContext.jsx`: añadido `navegarDesdeNotificacion` y `navIntent` al contexto para manejar navegación desde notificaciones.
- `frontend/src/components/Notificaciones.jsx`: reescrito para consumir notificaciones reales, manejar click/keyboard en items con `nav_destino`, y llamar a `navegarDesdeNotificacion`.
- `frontend/src/components/Familia/FamiliaDashboard.jsx`: consume `navIntent` y actualiza `view` automáticamente.
- `frontend/src/components/Alumno/AlumnoDashboard.jsx`: consume `navIntent` y actualiza `view`.
- `frontend/src/components/Profesores/PanelProfesores.jsx`: consume `navIntent` y actualiza `seccionActiva`.
Cambios realizados:
- Backend: todos los emisores de notificaciones (E1/E6, E3, E4, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19) ahora incluyen metadatos `nav` con `destino` (vista destino) y `params` (parámetros como IDs).
- Serializador expone `nav_destino` y `nav_params` parseando marcador `[nav:{...}]` en el mensaje.
- Frontend: `Notificaciones.jsx` ahora es un componente funcional completo que consume notificaciones reales, muestra indicador de navegación (chevron) en items navegables, y al click/Enter/Space llama a `navegarDesdeNotificacion`.
- DataContext expone `navegarDesdeNotificacion(destino, params)` que setea `navIntent`; los dashboards (Familia, Alumno, Profesor) usan `useEffect` para escuchar `navIntent` y actualizan su `view`/`seccionActiva`.
- La navegación respeta el sistema de `view`/`seccion` existente (sin React Router).
- La referencia de navegación solo orienta la interfaz; los permisos se validan en backend al acceder a la vista.
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones escuela.tests.test_notificaciones_eventos escuela.tests.test_notificaciones_eventos_parte4 escuela.tests.test_notificaciones_eventos_parte5 escuela.tests.test_notificaciones_eventos_parte6 escuela.tests.test_notificaciones_anti_spam`: 71 OK (sin regresiones).
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
- Frontend: `npm run build` OK (187 módulos); `npm test` 124 OK (13 archivos).
Resultado:
- Navegación contextual implementada para todos los eventos de notificación existentes.
- 16 eventos con metadatos de navegación (E1/E6, E3, E4, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19).
- Sin regresiones en backend (71 tests) ni frontend (124/124 OK).
- Se mantienen solo los 3 fallos preexistentes de `test_asistencias`.
Decisiones tomadas:
- Metadatos de navegación almacenados en `mensaje` como `[nav:{...}]` para evitar migración de BD.
- `nav_destino` usa claves semánticas (`calificaciones`, `asistencias`, etc.) mapeadas a vistas en frontend.
- `nav_params` incluye IDs relevantes (alumnoId, materiaId, comunicadoId, etc.) para deep-linking futuro.
- La navegación no autoriza acceso: backend valida permisos al servir cada vista.
Pendientes:
- Los 3 fallos preexistentes de `test_asistencias` quedan fuera de este alcance.

---

## Parte 9 — Pruebas integrales y cierre
Estado: COMPLETADA
Fecha: 2026-09-02
Archivos modificados:
- Ningún archivo nuevo modificado (esta parte solo ejecuta la suite completa de pruebas).
Cambios realizados:
- Ejecución completa de la suite de pruebas backend: 174 tests (notificaciones, eventos Partes 1-8, permisos, boletín E2E, actas, borrado lógico, autenticación, académico) — todos OK.
- Ejecución completa de la suite de pruebas frontend: 124 tests (13 archivos) — todos OK.
- Verificación de regresión: boletín, actas, permisos, borrado lógico, autenticación, funcionalidades académicas — sin regresiones.
- Verificación de build frontend: OK (187 módulos).
- Verificación de `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
Tests ejecutados:
- `manage.py test escuela.tests.test_notificaciones escuela.tests.test_notificaciones_eventos escuela.tests.test_notificaciones_eventos_parte4 escuela.tests.test_notificaciones_eventos_parte5 escuela.tests.test_notificaciones_eventos_parte6 escuela.tests.test_notificaciones_anti_spam escuela.tests.test_permisos escuela.tests.test_boletin_e2e escuela.tests.test_actas escuela.tests.test_borrado_logico escuela.tests.test_autenticacion escuela.tests.test_academico`: 174 OK.
- Frontend: `npm test` 124 OK (13 archivos); `npm run build` OK.
- `manage.py check`: OK (solo warning preexistente `UsuarioRol.id_usuario` W342).
Resultado:
- Suite completa de notificaciones (Partes 1-8 + anti-spam + navegación): 174 tests backend OK.
- Frontend: 124/124 tests OK, build OK.
- Regresión completa: 174 tests backend OK (incluyendo boletín, actas, permisos, borrado lógico, autenticación, académico).
- Se mantienen solo los 3 fallos preexistentes de `test_asistencias` (documentados en Parte 1, ajenos al sistema de notificaciones).
Decisiones tomadas:
- El plan completo de 9 partes se considera cerrado; las 3 fallas preexistentes de `test_asistencias` (endpoint `AsistenciaViewSet.create` retorna 201 en vez de 400 en validaciones de docente) son ajenas al sistema de notificaciones y quedan documentadas como deuda técnica externa.
- Se cumplieron todos los criterios de aceptación del §17.
Pendientes:
- Los 3 fallos preexistentes de `test_asistencias` (deuda técnica en endpoint de asistencia).

---

## Correcciones post-cierre — Navegación y documentación (2026-09-03)
Estado: COMPLETADA (documentación) — no reabre las Partes 1–9
Archivos modificados:
- `frontend/src/utils/navDestinos.js` (NUEVO): mapeo destino semántico → vista real por rol (`viewDesdeDestino`).
- `frontend/src/utils/navDestinos.test.js` (NUEVO): 12 tests de mapeo por rol.
- `frontend/src/components/Notificaciones.jsx`: propaga `nav_destino`/`nav_params` semánticos (sin pre-mapear con `DESTINO_A_VISTA`, eliminado).
- `frontend/src/components/Alumno/AlumnoDashboard.jsx`: mapa destino→vista (alumno) en el handler de `navIntent`.
- `frontend/src/components/Familia/FamiliaDashboard.jsx`: mapa destino→vista (familia) + preselección del hijo por `params.alumnoId`.
- `frontend/src/components/Profesores/PanelProfesores.jsx`: mapa destino→vista (docente) en `navIntent`.
- `frontend/src/components/Preceptores/PreceptorDashboard.jsx`: NUEVO handler de `navIntent` (antes no navegaba).
- `frontend/src/components/Administracion/AdminDashboard.jsx`: NUEVO handler de `navIntent` (antes no navegaba).
- `frontend/src/components/Notificaciones.test.jsx`: +2 tests de propagación de destino/params semánticos.
- `HISTORIAL.md`: §8 — corrección de navegación y documentación de E10/E3/E19.
Cambios realizados:
- La navegación dejó de depender de un nombre de vista genérico. `Notificaciones` emite el destino semántico del backend y **cada dashboard** lo traduce a su `view`/`seccionActiva` real (solo navega si existe vista válida; si no, el item no navega en vez de quedar en blanco).
- Se incorporó la navegación en `PreceptorDashboard` y `AdminDashboard`, que antes no reaccionaban a `navIntent`.
- `FamiliaDashboard` preselecciona el hijo cuando la notificación refiere a un `alumnoId` concreto.
Tests ejecutados:
- Frontend: `npm test` **137 OK** (14 archivos; incluye `navDestinos.test.js` y `Notificaciones.test.jsx`); `npm run build` OK.
- Backend (sin cambios): suite de notificaciones intacta; se mantienen solo los 3 fallos PREEXISTENTES de `test_asistencias`.
Documentación de eventos (correctos 7, 8 y 9):
- **E10**: `_pasar_a_previa` ignora la bandera `created` de `get_or_create` y llama a `_notificar_previa` incondicionalmente; viola §17 #9 en reprocesos (duplicado solo oculto por dedup de contenido). **Documentado como issue aparte, sin tocar código** (requiere decisión: notificar solo si `created`).
- **E3**: integración correcta en `AsistenciaViewSet.create`, pero la validación manual del flujo queda **pendiente** porque el endpoint arrastra los 3 fallos preexistentes (`201 != 400`).
- **E19**: inspección de `BloqueoHorarioAlumnoViewSet` confirma comportamiento correcto (crear activo notifica; transición True→False notifica levantamiento; crear inactivo no notifica); **sin modificación requerida**.
Decisiones tomadas:
- Mapas de navegación centralizados en `utils/navDestinos.js`, role-aware; sin introducir React Router; sin inventar nombres de vistas (se reutilizan los existentes de cada dashboard).
- Correcciones 7/8/9 son de documentación; E10 queda registrado como issue sin código; E3 pendiente de validación manual; E19 sin cambio.
Pendientes:
- Validación manual del flujo E3 una vez resuelta la deuda técnica de `AsistenciaViewSet.create`.
- Resolver comportamiento deseado de E10 (issue aparte).

---

## Correcciones post-cierre (2) — Destinatarios Preceptor y navegación E4 (2026-09-04)
Estado: COMPLETADA — no reabre las Partes 1–9. Sin cambios de DB ni migraciones.

Alcance (Problema 1 — preceptores y sus notificaciones):
- Se auditó el alcance real de cada evento para decidir si debe notificar al Preceptor.
  - **E7** y **E16** ya notificaban al preceptor (cubierto por tests) — sin cambio.
  - **E4 (Conducta/apercibimientos)**: SE AÑADE la notificación al preceptor del curso
    del alumno (relación real `Alumno.id_curso → Curso.id_preceptor`).
  - **E3** queda diferido [REQUIERE DECISIÓN resumen diario], **E10** issue aparte y
    **E19** fuera de alcance (no se tocan, como se acordó).
  - **E5, E11, E12, E13, E18**: sin preceptor (plan §5.2: alumno+familia/docentes).
- Archivos modificados:
  - `backend/proyecto/escuela/views.py`: nuevo helper `_preceptores_para_cursos(curso_ids)`;
    `_notificar_acta_conducta` ahora notifica también al preceptor del curso del alumno
    (vía la puerta única `notificar()`, conservando anti-spam/dedup); `_preceptores_para_comunicado`
    refactorizado para reutilizar el helper (mismo resultado).
  - `backend/proyecto/escuela/tests/test_notificaciones_eventos_parte6.py`: nuevo test
    `test_acta_conducta_notifica_al_preceptor_del_curso` (suite E4 → 4 OK).
  - `frontend/src/utils/navDestinos.js`: mapa `preceptor` += `actas: 'actas'`.

Alcance (Problema 2 — notificaciones clicables que navegan):
- El preceptor ahora puede abrir la vista **Actas** (existente en su dashboard) al hacer
  clic en una notificación de conducta. Flujo verificado: clic → `nav_destino` semántico +
  `nav_params` → `viewDesdeDestino(destino, rol)` → vista real del dashboard (solo navega
  si la vista existe; nunca pantalla en blanco). No se muestran `[nav:...]`/`[ref:...]` en la UI.

Tests ejecutados:
- Backend: suites de notificaciones completas **86 OK**; suite completa **234 tests** con
  solo los 3 fallos PREEXISTENTES de `test_asistencias` (`201 != 400`) ajenos a este cambio;
  `manage.py check` solo W342 preexistente.
- Frontend: `npm test` **137 OK**; `npm run build` OK.

Decisiones:
- El preceptor de un curso es destinatario real de las actas de conducta de sus alumnos
  (gestión de actas en su módulo). No se inventaron relaciones; se reutiliza la real
  `Curso.id_preceptor`.
- Se mantiene el criterio §17 (puerta única, anti-spam, dedup, navegación solo a vistas reales).

---

# 17. Criterios generales de aceptación

El sistema final debe cumplir:

1. Cada notificación identifica correctamente al usuario destinatario mediante `id_usuario`.
2. Las notificaciones relacionadas con estudiantes identifican correctamente al estudiante mediante `id_alumno`.
3. Un usuario nunca puede leer notificaciones de otro usuario.
4. `id_alumno` no se utiliza como mecanismo de autorización.
5. Familia solamente puede acceder a notificaciones de sus hijos.
6. Un familiar puede tener notificaciones asociadas a múltiples hijos.
7. Las notificaciones históricas con `id_alumno = NULL` siguen funcionando.
8. La creación de notificaciones está centralizada y protegida.
9. Los eventos solamente generan notificaciones ante cambios efectivos.
10. Se evitan duplicados.
11. Se evita el spam por eventos masivos como asistencias.
12. Las notificaciones mantienen coherencia con los permisos existentes del sistema.
13. El frontend no puede ampliar permisos mediante parámetros manipulables.
14. Las notificaciones pueden evolucionar posteriormente hacia navegación contextual.
15. Los tests existentes del sistema continúan funcionando.

---

# 18. Regla para el agente de implementación

Cuando se solicite implementar una parte, el agente debe:

1. Leer este documento completo.
2. Leer el estado actual del código.
3. Identificar las dependencias de la parte solicitada.
4. Implementar **solamente la parte solicitada**.
5. No adelantar partes posteriores.
6. No modificar la DB salvo autorización explícita.
7. Mantener cambios focalizados.
8. Ejecutar tests.
9. Actualizar el §16 con el resultado.
10. Informar cualquier decisión pendiente antes de continuar.

La instrucción de trabajo recomendada será:

> **"Avanzá únicamente con la Parte X del Plan Maestro de Implementación de Notificaciones. No implementes partes posteriores."**
