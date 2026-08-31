# REGLAS DE DESARROLLO — Mi Secundaria 7

> **Propósito:** Este documento define las reglas absolutas que cualquier agente de IA debe seguir al modificar el código del proyecto. Cada regla está extraída directamente del código existente. No es una guía de buenas prácticas genérica; es una especificación vinculante derivada del proyecto real.
>
> **Antes de escribir cualquier línea de código, leer este documento completo y ejecutar los Checklists (secciones 20 y 21).**

---

## 1. Filosofía del Proyecto

1.1. **El frontend es una app React con Vite (no CRA).** No migrar a otro framework. No instalar librerías externas de UI (Material UI, Chakra, Bootstrap, Tailwind, etc.). Todo el estilo está en `frontend/src/index.css` (~2350 líneas). No hay CSS modules, styled-components, ni librerías CSS de ningún tipo.

1.2. **El backend es Django 6 + Django REST Framework.** No migrar a otro backend. No instalar librerías pesadas innecesarias. No hay GraphQL, no hay WebSockets, no hay BFF.

1.3. **La base de datos es preexistente y externa (MySQL 8+).** Todas las tablas tienen `managed = False`. Django NUNCA debe crear, modificar ni eliminar tablas. No ejecutar `makemigrations` ni `migrate`.

1.4. **No hay separación de archivos por modelo.** Todo está en archivos monolíticos por capa: `models.py` (647 líneas, 21 modelos), `serializers.py` (~1540 líneas), `views.py` (~1881 líneas). No crear nuevos archivos para nuevos modelos/serializers/views — agregar al archivo existente. No crear archivos como `modelo_nuevo.py`.

1.5. **No hay tests automatizados.** No escribir tests. No crear archivos `test_*.py`. No configurar frameworks de testing.

1.6. **El proyecto usa español en TODO el código.** Nombres de componentes, variables, endpoints, strings visibles, comentarios, nombres de archivos — siempre en español. No mezclar inglés y español.

1.7. **La BD real tiene prioridad absoluta sobre cualquier archivo SQL de referencia.** El archivo `estructura base de datos/sistema_escolar.sql` es solo una referencia visual, NO es la fuente de verdad. La fuente de verdad es la base de datos MySQL en ejecución. Nunca asumir que un campo existe porque aparece en el SQL de referencia; siempre verificar contra MySQL.

---

## 2. Arquitectura General

### 2.1. Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                          │
│  localhost:5173                                              │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────────┐ │
│  │ AuthCtx   │  │ DataCtx    │  │ Componentes por rol       │ │
│  │ (JWT)     │  │ (estado    │  │ ┌────────┬────────┬────┐ │ │
│  │           │  │  global)   │  │ │ Admin  │Preceptor│ ...│ │ │
│  └──────────┘  └────────────┘  │ └────────┴────────┴────┘ │ │
│                                 │ ┌──────────────────────┐ │ │
│                                 │ │ Shared (reutiliz.)    │ │ │
│                                 │ └──────────────────────┘ │ │
│                                └──────────────────────────┘ │
│                                        │                     │
│                               axios (api.js)                 │
│                               JWT en headers                 │
└──────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   Django REST API (:8000)                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────────┐ │
│  │ Login/Me  │  │ ViewSets    │  │ Serializers              │ │
│  │ (JWT)     │  │ (19 V.S.)   │  │ (~40 serializers)        │ │
│  └──────────┘  └────────────┘  └──────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Models (21 modelos, managed=False)                       ││
│  │ Permissions, Middleware, Utils                           ││
│  └──────────────────────────────────────────────────────────┘│
│                                        │                     │
│                          mysqlclient (no ORM schema)          │
└──────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    MySQL 8+ (:3306)                           │
│              sistema_escolar (BD preexistente)                 │
│          ~35 tablas, todas con managed=False                   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2. Principios arquitectónicos

2.2.1. **SPA pura:** No hay Server-Side Rendering. No hayrutas del lado del servidor. Todo el enrutamiento es por estado en React (switches de `view`).

2.2.2. **API REST única:** El frontend se comunica exclusivamente con la API de Django. No hay otras fuentes de datos.

2.2.3. **Autenticación JWT:** Access token + refresh token. El access token tiene expiración corta; el refresh token se usa automáticamente via interceptor de Axios.

2.2.4. **Estado global centralizado:** DataContext es el único store de datos compartidos. No hay Redux, Zustand, u otra librería de estado.

2.2.5. **Sin librerías UI externas:** Todo el diseño visual es manual con CSS vanilla y variables CSS en `:root`.

2.2.6. **Monolito Django con una sola app:** La app `escuela` contiene todo. No hay múltiples apps Django.

2.2.7. **Base de datos externa no gestionada:** Django no controla el esquema. Los modelos son solo un mapping ORM de lectura/escritura.

### 2.3. Stack tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | React | 18.3.1 | UI components |
| Frontend | Vite | 5.4.1 | Build tool |
| Frontend | Axios | 1.7.9 | HTTP client |
| Backend | Django | 6.0 | Web framework |
| Backend | Django REST Framework | — | API REST |
| Backend | SimpleJWT | — | JWT auth |
| Backend | ReportLab | — | PDF generation |
| Backend | mysqlclient | — | MySQL driver |
| BD | MySQL | 8+ | Database |
| Auth | JWT (access + refresh) | — | Authentication |

---

## 3. Organización del Repositorio

### 3.1. Estructura completa

```
/
├── PROYECTO.md                       # Documentación de referencia del proyecto
├── REGLAS_DESARROLLO.md             # Este archivo — reglas para IA
├── README.md                         # README original
│
├── backend/
│   └── proyecto/
│       ├── manage.py                 # Entrypoint de Django
│       ├── requirements.txt          # Dependencias Python
│       └── proyecto/                 # Config de Django
│           ├── settings.py           # Config: BD, CORS, JWT, apps instaladas
│           ├── urls.py               # URL patterns del proyecto
│           ├── wsgi.py
│           └── asgi.py
│       └── escuela/                  # App principal (ÚNICA app del sistema)
│           ├── models.py             # 21 modelos — TODO en un solo archivo
│           ├── serializers.py        # ~1540 líneas — TODOS los serializers
│           ├── views.py              # ~1881 líneas — TODAS las vistas
│           ├── urls.py               # Router de la API (DefaultRouter)
│           ├── permissions.py        # Permisos personalizados por rol
│           ├── auth_backend.py       # Backend de autenticación custom
│           ├── utils.py              # Utilidades (normalizar_dni, etc.)
│           ├── admin.py
│           ├── apps.py
│           └── tests.py
│
├── frontend/
│   ├── package.json                  # Dependencias Node
│   ├── vite.config.js                # Config de Vite
│   ├── index.html                    # HTML raíz
│   └── src/
│       ├── main.jsx                  # Entrypoint React
│       ├── App.jsx                   # Router por roles (switch sobre user.role)
│       ├── index.css                 # CSS global — ÚNICO archivo de estilos
│       ├── context/
│       │   ├── AuthContext.jsx        # Autenticación global
│       │   └── DataContext.jsx        # Datos globales (702 líneas)
│       ├── services/
│       │   └── api.js               # Cliente Axios con TODAS las llamadas (519 líneas)
│       ├── utils/
│       │   ├── dni.js               # Formateo de DNI
│       │   ├── orientacion.js       # Orientación de cursos
│       │   ├── boletin.js           # Generación de boletín PDF (frontend)
│       │   └── modulos.js           # (no utilizado actualmente)
│       ├── data/
│       │   └── mockData.js          # (no utilizado, legacy)
│       └── components/
│           ├── Login/
│           │   ├── login.jsx        # Pantalla de login
│           │   └── login.css        # Excepción: estilos de login (legacy)
│           ├── Notificaciones.jsx    # Campana de notificaciones
│           ├── Administracion/       # Panel de Admin/Director (~15 componentes)
│           ├── Alumno/               # Panel de Alumno (dashboard inline)
│           ├── Familia/              # Panel de Familia/Tutor (~6 componentes)
│           ├── Preceptores/          # Panel de Preceptor (~8 componentes)
│           ├── Profesores/           # Panel de Docente (~10 componentes)
│           └── Shared/               # Componentes reutilizables entre roles
│
├── estructura base de datos/
│   └── sistema_escolar.sql          # DDL de referencia — NO es fuente de verdad
```

### 3.2. Reglas de organización

3.2.1. **Nunca crear nuevas apps Django.** Una sola app (`escuela`) contiene todo.

3.2.2. **Nunca crear nuevos archivos Python en `backend/proyecto/escuela/`.** Todo se agrega a los archivos existentes (models.py, serializers.py, views.py, urls.py, permissions.py).

3.2.3. **Nunca crear nuevos archivos CSS.** Todo va en `frontend/src/index.css`.

3.2.4. **Nunca crear nuevos contextos.** Los datos compartidos van en DataContext. La autenticación va en AuthContext.

3.2.5. **Los componentes de cada rol van en su carpeta correspondiente.** Los componentes reutilizables entre roles van en `Shared/`.

---

## 4. Flujo Obligatorio Antes de Modificar Código

### 4.1. Regla absoluta

**🔥 NUNCA comenzar a escribir código sin haber entendido primero cómo funciona el módulo existente.** No importa cuán pequeño sea el cambio: primero leer, comprender, buscar, analizar — recién después modificar.

### 4.2. Procedimiento obligatorio (orden estricto)

Cada paso debe completarse antes de pasar al siguiente. No saltar pasos.

**Paso 1 — Leer la documentación del proyecto**
- Leer `PROYECTO.md` completo para entender qué módulos existen, qué hacen, cómo se relacionan.
- Leer `REGLAS_DESARROLLO.md` completo para conocer las reglas vinculantes.
- Si existe `DECISIONES.md`, leerlo para entender el porqué de las decisiones arquitectónicas.

**Paso 2 — Comprender la arquitectura existente**
- Identificar qué capas participan: backend (modelo → serializer → view → url) y frontend (api.js → DataContext → componente).
- Identificar el módulo afectado entre los 5 posibles: Administración, Preceptores, Profesores, Alumno, Familia.
- Determinar si el cambio afecta a un solo rol o a múltiples roles.

**Paso 3 — Leer el archivo completo que se va a modificar**
- Leer el archivo completo (no fragmentos). No asumir la estructura.
- Identificar el patrón exacto: cómo están nombrados los campos, cómo se escriben los viewsets, cómo se definen las rutas, cómo se estructuran los componentes.

**Paso 4 — Buscar si ya existe una implementación similar**
- Buscar en `Shared/` componentes reutilizables que puedan servir.
- Buscar en `api.js` funciones existentes antes de agregar nuevas.
- Buscar en `index.css` clases CSS existentes antes de agregar nuevas.
- Buscar en `sidebarMenu.js` items existentes antes de agregar nuevos.
- Si ya existe algo similar, reutilizarlo o extenderlo. No duplicar.

**Paso 5 — Revisar referencias cruzadas en todo el proyecto**
- Antes de renombrar o modificar una función/componente/modelo/variable CSS/clase, buscar TODAS sus ocurrencias con `grep` o `rg` en backend + frontend.
- Verificar que ningún otro módulo dependa del código que se va a cambiar.
- Para cambios en DataContext: verificar que ningún componente de ningún rol se rompa.

**Paso 6 — Analizar impacto en frontend y backend**
- ¿El cambio requiere modificar el backend? ¿El frontend? ¿Ambos?
- ¿Afecta la generación de PDFs?
- ¿Afecta los permisos por rol?
- ¿Afecta la consistencia visual entre módulos?
- ¿Requiere actualizar el sidebar?

**Paso 7 — Recién después de completar los pasos 1 a 6, comenzar a modificar código**
- Hacer cambios pequeños y localizados.
- Verificar después de cada cambio que todo siga funcionando.

### 4.3. Reglas complementarias

4.3.1. **No modificar código que funciona.** Si el código cumple su función y no hay bug reportado, no refactorizar. No "mejorar" código que ya funciona correctamente.

4.3.2. **Verificar la estructura real de MySQL antes de modificar modelos.** La BD real es la fuente de verdad. No confiar en el SQL de referencia ni asumir campos.

4.3.3. **Verificar que el sidebar filtre correctamente por rol.** No mostrar opciones que el rol no pueda usar.

4.3.4. **Si no se entiende un fragmento de código, leer los archivos relacionados antes de modificar.** No adivinar.

---

## 5. Reglas del Backend (Django + DRF)

### 5.1. Estructura general

5.1.1. El backend es un proyecto Django con una sola app (`escuela`). Los archivos clave son:
  - `models.py` — 21 modelos Django (~647 líneas)
  - `serializers.py` — Todos los serializers (~1540 líneas)
  - `views.py` — Todos los viewsets y vistas (~1881 líneas)
  - `urls.py` — Rutas (usa DefaultRouter)
  - `permissions.py` — Lógica de permisos por rol
  - `auth_backend.py` — Backend de autenticación custom para tabla `usuarios`

5.1.2. **Nunca crear nuevos archivos Python en `backend/proyecto/escuela/`.** Todo va en los archivos existentes.

### 5.2. Modelos (`models.py`)

5.2.1. Todos los modelos extienden `models.Model`.

5.2.2. Todas las tablas tienen `managed = False` en la clase `Meta`. **Nunca cambiar esto.**

5.2.3. Todas las tablas tienen `db_table` explícito en `Meta`. El nombre de la tabla es en snake_case plural (ej: `usuarios`, `alumnos`, `curso_materia`).

5.2.4. La clave primaria siempre es un `AutoField` con nombre `<modelo>_id` (ej: `id_alumno`, `id_curso`, `id_docente`). Nunca usar `id` como nombre de PK.

5.2.5. Convención de nombres de campos:
  - Claves foráneas: `id_<tabla_referencia>` (ej: `id_curso`, `id_docente`)
  - Texto corto: `CharField(max_length=N)`
  - Texto largo: `TextField()`
  - Fechas: `DateField()` o `DateTimeField()`
  - Booleanos: `BooleanField(default=...)`
  - Numéricos: `IntegerField()`, `DecimalField(max_digits=N, decimal_places=N)`
  - Archivos: `FileField(upload_to='carpeta/')`
  - La mayoría de campos no-PK son opcionales: `blank=True, null=True`

5.2.6. Claves foráneas usan `on_delete=models.CASCADE` (o `SET_NULL` si son opcionales) y siempre especifican `db_column='<columna_exacta_en_BD>'`.

5.2.7. `__str__` se define en modelos principales para mostrar nombre legible.

5.2.8. **🔥 REGLA CRÍTICA — Protocolo para modificar modelos:**

  Antes de agregar, modificar o eliminar un campo en un modelo, verificar TODAS estas capas:

  1. **Base de datos real (MySQL):** Verificar que la columna existe en la tabla real. `DESCRIBE <tabla>;` o `SHOW COLUMNS FROM <tabla>;`. El SQL de referencia en `/estructura base de datos/` puede estar desactualizado. La BD real es la fuente de verdad.

  2. **Serializer:** Actualizar `Meta.fields` y `SerializerMethodField` si es necesario. Verificar que el serializer de lectura y el de escritura estén sincronizados.

  3. **ViewSet:** Verificar que `get_queryset()` no se rompa. Si se agrega una relación, considerar `select_related`.

  4. **DataContext:** Si el campo se usa en el frontend, actualizar la transformación/normalización en `fetchData()`.

  5. **Componentes React:** Buscar con grep todos los componentes que referencian el campo. Actualizar cada uno.

  6. **PDFs:** Si el campo se muestra en PDF (boletín, planificación), actualizar la generación.

  7. **Consultas ORM:** Buscar todas las referencias al campo en `views.py` y `utils.py`.

  8. **api.js:** Si el cambio afecta la estructura de respuesta, actualizar la función correspondiente.

5.2.9. **Nunca agregar nuevos modelos sin verificar que la tabla ya existe en la BD real MySQL.** Si la tabla no existe, no se puede agregar sin coordinación con el administrador de la BD.

### 5.3. Serializers (`serializers.py`)

5.3.1. Todos los serializers extienden `serializers.ModelSerializer` (a menos que sea necesario un serializer plano).

5.3.2. El `Meta` siempre incluye `model` y `fields = '__all__'` o una lista explícita.

5.3.3. Convención de nombres de serializers: `<Modelo>Serializer`, `<Modelo>ListSerializer`, `<Modelo>DetailSerializer`, `<Modelo>CreateSerializer`, etc.

5.3.4. Los serializers de listado (`ListSerializer`) incluyen campos de las tablas relacionadas (ej: `curso_nombre` en lugar de `id_curso`). Se definen como `SerializerMethodField` o `ReadOnlyField` con `source`.

5.3.5. Para permisos o seguridad: `pre_nota` y `nota_numerica` solo son visibles para `docente` y `admin` (rol_id >= 3 en el contexto del serializer).

5.3.6. Los serializers de creación/escritura (`CreateSerializer`, `UpdateSerializer`) usan los IDs reales (ej: `id_curso`, `id_docente`) y pueden incluir validación adicional.

5.3.7. Cada modelo suele tener al menos 2 serializers: uno de lectura (con nombres legibles) y uno de escritura (con IDs). Ejemplo: `CursoSerializer` (lectura) y `CursoCreateSerializer` (escritura).

5.3.8. **No duplicar serializers.** Si ya existe un serializer que hace lo que necesitas, reutilizarlo. No crear `NuevoModeloSerializer2`.

### 5.4. Views (`views.py`)

5.4.1. La mayoría de las vistas son `ModelViewSet`. Excepciones conocidas: `login_view`, `me_view`, `upload_file`.

5.4.2. Convención de nombres: `<Modelo>ViewSet` para viewsets.

5.4.3. Cada ViewSet define `queryset`, `serializer_class`, y `permission_classes`.

5.4.4. Cuando un ViewSet necesita diferentes serializers para lectura/escritura, se sobrescribe `get_serializer_class()`.

5.4.5. Cuando un ViewSet necesita filtrar por usuario/rol, se sobrescribe `get_queryset()`.

5.4.6. Las acciones personalizadas usan `@action(detail=True/False, methods=['get', 'post', ...])`.

5.4.7. Patrones de filtrado por rol en `get_queryset()`:
  - **Admin/Director:** Ve todo (sin filtro adicional).
  - **Preceptor:** Filtra por cursos asignados (`id_preceptor` en el modelo Curso) o por ids específicos según el modelo.
  - **Docente:** Filtra por `id_docente` usando `CursoMateria` como puente.
  - **Alumno:** Filtra por `id_alumno`.
  - **Familia:** Filtra por alumnos asociados al tutor (vía el alumno).

5.4.8. Para obtener el usuario/rol actual se usa `request.user` y el helper `get_role_or_none(request)`.

5.4.9. Roles: `admin` = 1, `director` = 1, `preceptor` = 2, `docente` = 3, `alumno` = 4, `familia` = 5.

5.4.10. Los viewsets de administración suelen tener permisos `IsAdminOrDirector`. Los de preceptores `IsPreceptorOrAdmin`. Los de docentes `IsDocenteOrAdmin`. Los de alumnos/familia suelen tener permisos más restrictivos.

5.4.11. **No cambiar la firma de endpoints existentes sin actualizar todos los llamados en el frontend.**

### 5.5. URLs (`urls.py`)

5.5.1. Se usa un solo `DefaultRouter` para registrar todos los viewsets.

5.5.2. Registro: `router.register(r'<endpoint>', <ViewSet>, basename='<nombre>')`.

5.5.3. Las vistas que no son ViewSet (funciones) se agregan con `urlpatterns` adicional.

5.5.4. Prefijo de API: todas las rutas comienzan con `api/`.

5.5.5. Convención de nombres de endpoints: plural, kebab-case (ej: `cursos`, `curso-materia`, `padres-tutores`, `acta-alumno`).

### 5.6. Permisos (`permissions.py`)

5.6.1. Cada clase de permiso define `has_permission(self, request, view)`.

5.6.2. Algunos permisos también definen `has_object_permission(self, request, view, obj)` para permisos a nivel de objeto.

5.6.3. Permisos comunes:
  - `IsAdminOrDirector`: Solo rol 1
  - `IsPreceptorOrAdmin`: Roles 1 o 2
  - `IsDocenteOrAdmin`: Roles 1 o 3
  - `IsAlumnoOrAdmin`: Roles 1 o 4
  - `IsFamiliaOrAdmin`: Roles 1 o 5

5.6.4. Uso del helper `get_role_or_none(request)` para obtener el rol del usuario autenticado.

5.6.5. **Nunca modificar permisos sin verificar cómo afecta a todos los roles que usan ese endpoint.**

---

## 6. Reglas del Frontend (React)

### 6.1. Estructura general

6.1.1. El frontend está en `frontend/src/`. Estructura de carpetas:
  - `components/Administracion/` — Módulo de administración (~15 componentes)
  - `components/Preceptores/` — Módulo de preceptores (~8 componentes)
  - `components/Profesores/` — Módulo de docentes (~10 componentes)
  - `components/Alumno/` — Módulo de alumnos (dashboard inline)
  - `components/Familia/` — Módulo de familia/tutores (~6 componentes)
  - `components/Shared/` — Componentes reutilizables entre roles
  - `context/` — Contextos de React (AuthContext, DataContext)
  - `services/` — Servicios de API (api.js)
  - `utils/` — Utilidades (dni.js, orientacion.js, boletin.js)

6.1.2. **No hay estilos por componente.** Todo el CSS está en `frontend/src/index.css`. No crear archivos `.css` adicionales. La única excepción es `login.css` (legacy).

6.1.3. **No hay TypeScript.** El proyecto usa JavaScript puro con JSX. No convertir a TypeScript.

6.1.4. **No hay React Router.** El enrutamiento se hace por estado (variable `view` en cada dashboard) y switches de rol en `App.jsx`.

### 6.2. Estado global (`DataContext.jsx`)

6.2.1. **DataContext es la única fuente de verdad para datos compartidos.** Todo estado global debe estar en DataContext. No crear nuevos contextos para datos compartidos. No usar Redux, Zustand, u otra librería.

6.2.2. Al cargar, DataContext hace ~26 llamadas API en paralelo con `Promise.all()` y almacena todo en un solo objeto `data`.

6.2.3. El hook `useData()` expone todos los datos y helpers. Siempre usarlo con destructuring: `const { alumnos, cursos } = useData();`.

6.2.4. **🔥 REGLA CRÍTICA — No duplicar estado:** Si un dato está disponible en `useData()`, no almacenarlo en estado local del componente. No hacer fetch del mismo dato en el componente. Siempre referenciarlo desde `useData()`.

6.2.5. Datos expuestos por `useData()`:
  - `alumnos`, `docentes`, `preceptores`
  - `cursos` (array de strings), `cursosObj` (array de objetos)
  - `materias` (array de strings), `materiasObj` (array de objetos)
  - `materiasPorCurso` (objeto `{ curso: [materias] }`)
  - `horariosClase`, `horarios`, `modulos`
  - `aniosLectivos`, `ciclosLectivos`, `periodos`
  - `estadosAsistencia`, `inscripciones`, `asignacionesDocente`
  - `cursoMateria`, `notasDocenteAdmin`, `asistenciasAdmin`
  - `actas`, `actasAlumno`, `actasDocente`
  - `hijosFamilia`, `calificacionesFamilia`, `asistenciasFamilia`, `comunicadosFamilia`
  - `comunicados`, `diagnosticos`, `planificaciones`
  - `calificacionesCompletas`, `padresTutores`
  - Helpers: `nombreCompleto(alumno)`, `nombreCorto(alumno)`
  - Helpers de búsqueda: `getAlumnoById(id)`, `getHijoLabel(hijo)`, `getAlumnosByCurso(curso)`, `getMateriasByCurso(curso)`, `getHorarioClase(materia)`, `getActasByAlumnoId(alumnoId)`
  - `refreshData`, `loading`, `error`

6.2.6. Admin adicional: `adminCursos`, `adminMaterias`, `adminCursoMateria` y sus respectivos `refreshAdminCursos`, `refreshAdminMaterias`, `refreshAdminCursoMateria`.

6.2.7. **🔥 REGLA CRÍTICA — refreshData:** Después de crear, actualizar o eliminar un registro, llamar a `refreshData()` (de `useData()`) para recargar los datos globales. Ver ejemplo en `PanelPlanif.jsx`.

6.2.8. **Regla de hooks en DataContext:** Todos los hooks (`useMemo`, `useCallback`) deben estar ANTES de cualquier early return. Ver sección de errores comunes para más detalles.

### 6.3. Servicios API (`api.js`)

6.3.1. **🔥 REGLA ABSOLUTA — Todas las llamadas HTTP deben pasar por `api.js`.** Nunca usar `axios` o `fetch` directamente en componentes. Nunca importar axios directamente.

6.3.2. La instancia de axios se configura con `baseURL` desde variable de entorno y el token JWT se añade automáticamente desde `localStorage` via interceptor.

6.3.3. Convención de nombres de funciones:
  - Lectura: `get<Recurso>(params?)` — ej: `getCursos()`, `getAlumnos(params)`
  - Creación: `create<Recurso>(payload)` — ej: `createAlumno(payload)`
  - Actualización: `update<Recurso>(id, payload)` — ej: `updateActa(id, payload)`
  - Eliminación: `delete<Recurso>(id)` — ej: `deleteComunicado(id)`
  - Acción especial: nombre descriptivo, ej: `uploadFile(file, carpeta)`

6.3.4. Todas las funciones retornan `data` (el body de la respuesta). No hay manejo de errores en api.js (se deja al componente).

6.3.5. **🔥 REGLA CRÍTICA — No duplicar funciones:** Buscar siempre en `api.js` si la función que necesitas ya existe, antes de crear una nueva. Hay 519 líneas con funciones para cada endpoint. Las funciones duplicadas causan confusión y bugs.

6.3.6. Funciones que existen actualmente:
  - CRUD completo para: Alumnos, Docentes, Preceptores, Cursos, Materias, CursoMateria, Calificaciones, Asistencias, Actas, ActaAlumno, ActaCurso, ActaDocente, Horarios, Notificaciones, Comunicados, Inscripciones, PadresTutores, DiagnósticosGrupales, Planificaciones, Usuarios
  - Upload de archivos: `uploadFile(file, carpeta)`
  - Autenticación: `login`, `logout`, `getMe`
  - Otras: `getRoles`, `getServerTime`, `getMiDdjjDocente`, etc.

### 6.4. Autenticación (`AuthContext.jsx`)

6.4.1. `useAuth()` expone: `user`, `login(username, password)`, `logout()`, `loading`.

6.4.2. El token JWT se guarda en `localStorage` con clave `access_token`.

6.4.3. El rol del usuario se determina del objeto `user` retornado por la API (`user.role` o `user.roles[0]`).

6.4.4. Roles: `admin`/`director`, `preceptor`, `docente`, `alumno`, `familia`.

6.4.5. **No modificar la estructura del `user` en AuthContext sin actualizar todos los dashboards que lo consumen.**

### 6.5. Componentes

6.5.1. **Cada módulo tiene su propia carpeta** dentro de `components/`.

6.5.2. Los componentes reutilizables entre roles van en `components/Shared/`.

6.5.3. Convención de nombres: PascalCase, sufijo según tipo:
  - `Nuevo<Recurso>.jsx` — Formularios de creación
  - `Editar<Recurso>.jsx` — Formularios de edición
  - `<Recurso>Lista.jsx` — Listados/Tablas
  - `<Recurso>Card.jsx` — Tarjetas de detalle
  - `<Recurso>Modal.jsx` — Modales
  - `Panel<Rol>.jsx` — Perfil de un rol (ej: `PanelDocente.jsx`, `PanelPreceptor.jsx`)
  - `<Rol>Dashboard.jsx` — Dashboard de un rol (ej: `AdminDashboard.jsx`)
  - `Mis<Recurso>.jsx` — Vistas específicas de un rol (ej: `MisMaterias.jsx`)

6.5.4. **No usar fragmentos `<></>`.** Usar `<div>` con clase CSS o el contenedor apropiado.

6.5.5. **Todos los strings visibles al usuario deben estar en español.**

6.5.6. **No crear componentes de layout genéricos.** Cada pantalla usa `LayoutDashboard` (de Shared) y define su propio contenido.

6.5.7. **🔥 REGLA CRÍTICA — Reutilizar antes de crear:** Antes de crear un nuevo componente, buscar en `Shared/` y en los módulos existentes si ya existe uno similar que pueda reutilizarse o extenderse. Especialmente:
  - Tablas: usar el patrón de `.table-responsive` existente
  - Botones: usar `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
  - Formularios: usar el patrón de `.form-group-filter`, `.filter-row`
  - Confirmaciones: usar `window.confirm()` si no hay modal
  - Tarjetas: usar `.card`, `.card-header-flex`
  - Perfiles: seguir el patrón exacto de `PanelDocente.jsx`

6.5.8. **🔥 REGLA CRÍTICA — Si un componente aplica a múltiples roles, debe estar en `Shared/`**, no duplicado en cada módulo. Ejemplos: `ComunicadosView.jsx`, `ActividadesView.jsx`, `DiagnosticosView.jsx`.

### 6.6. Estilos (`index.css`)

6.6.1. **🔥 REGLA CRÍTICA — No modificar clases CSS existentes sin verificar todos los componentes que las usan.** Las clases tienen nombres en español o BEM y son compartidas entre múltiples componentes de diferentes módulos. Usar grep para encontrar todos los usos antes de cambiar.

6.6.2. **No agregar estilos en línea** (`style={{}}`) en JSX a menos que sea estrictamente dinámico (ej: color basado en estado, ancho calculado).

6.6.3. Los nombres de clases reflejan el componente que estilizan (ej: `.login-container`, `.admin-curso-materia`, `.materia-btn`).

6.6.4. Preferir clases sobre selectores de elemento. No usar `div { ... }` a menos que sea absolutamente necesario.

6.6.5. **No crear nuevas variables CSS** a menos que sean necesarias y no exista una variable equivalente.

6.6.6. Variables CSS existentes en `index.css`:
  - `--primary-color`, `--primary-hover`, `--primary-light`
  - `--sidebar-bg`, `--sidebar-hover`, `--sidebar-text`
  - `--card-bg`, `--border-color`, `--text-light`, `--text-muted`
  - `--success`, `--danger`, `--warning`
  - `--radius`, `--shadow`, `--transition`

---

## 7. Base de Datos: Reglas Absolutas

### 7.1. `managed = False` en TODOS los modelos

7.1.1. El esquema de la BD se gestiona externamente (por DBA o por migraciones manuales en MySQL). Django nunca debe crear, modificar ni eliminar tablas.

7.1.2. **No ejecutar `python manage.py makemigrations` ni `python manage.py migrate`.** No tienen efecto (por `managed=False`) pero podrían causar conflictos o crear archivos de migración que no deben existir.

### 7.2. La BD real es la fuente de verdad absoluta

7.2.1. **🔥 REGLA ABSOLUTA:** El archivo `estructura base de datos/sistema_escolar.sql` es solo una referencia visual. Puede estar desactualizado, incompleto o ser incorrecto.

7.2.2. **Nunca asumir que un campo existe porque aparece en el SQL de referencia.** Siempre verificar contra la base de datos real MySQL.

7.2.3. **Antes de modificar un modelo Django, verificar la estructura real de MySQL primero.** Usar `DESCRIBE <tabla>;` o `SHOW COLUMNS FROM <tabla>;`.

7.2.4. **Si hay discrepancia entre el modelo Django y la BD real, la BD real tiene razón.** Actualizar el modelo Django para reflejar la BD real.

### 7.3. Para agregar un nuevo modelo

7.3.1. Verificar que la tabla ya existe en la base de datos MySQL externa.

7.3.2. Si la tabla no existe, no se puede agregar sin coordinación con el administrador de la BD. No crear tablas desde Django.

7.3.3. Una vez verificada la existencia, agregar el modelo con `managed = False` y `db_table = '<nombre_exacto_tabla>'`.

### 7.4. Restricciones adicionales

7.4.1. **No usar señales (`post_save`, `pre_save`, etc.)** que modifiquen datos. Toda la lógica de negocio va en las vistas.

7.4.2. **No usar `db_constraint=False`** a menos que sea estrictamente necesario y esté documentado con un comentario explicando por qué.

7.4.3. **Los nombres de tablas son en snake_case plural** (`usuarios`, `alumnos`, `curso_materia`, `acta_alumno`). No cambiar esto.

---

## 8. Flujo para Crear un Nuevo Módulo/Entidad

### 8.1. Backend (orden estricto)

1. **Verificar que la tabla existe** en la BD externa MySQL (no confiar en el SQL de referencia).
2. **Agregar el modelo** en `models.py`:
   - `managed = False`
   - `db_table = '<tabla_existente>'`
   - Campo PK con `AutoField(primary_key=True)`
   - FKs con `db_column='id_<tabla>'`
3. **Agregar serializers** en `serializers.py`:
   - Serializer de lectura: incluir nombres legibles (no solo IDs)
   - Serializer de escritura: incluir IDs para POST/PATCH
4. **Agregar ViewSet** en `views.py`:
   - `queryset` con `.all()`
   - `get_serializer_class()` que retorne el serializer según la acción
   - `get_queryset()` con filtrado por rol (si aplica)
   - `permission_classes`
   - `select_related` en queryset para optimizar
5. **Registrar la ruta** en `urls.py` con `router.register()`.

### 8.2. Frontend (orden estricto)

1. **Agregar funciones API** en `api.js` siguiendo el patrón `get<Recurso>`, `create<Recurso>`, etc.
2. **Agregar carga en DataContext**:
   - Importar la función API en `DataContext.jsx`
   - Agregar la llamada en el `Promise.all()` de `fetchData`
   - Procesar/normalizar los datos (mapear, filtrar, enriquecer)
   - Exponer en el objeto `data` y en `useData()`
3. **Crear componentes** en la carpeta del módulo correspondiente.
4. **Agregar las rutas** en el dashboard (case en el switch de `view`).
5. **Agregar item en el sidebar** (sidebarMenu.js o inline según el módulo).

### 8.3. Reglas obligatorias

8.3.1. **El nuevo módulo debe seguir exactamente la misma arquitectura que los existentes.** No crear un diseño diferente.

8.3.2. **Reutilizar el sidebar existente.** No crear un nuevo sistema de navegación.

8.3.3. **Reutilizar DataContext.** Los datos globales deben cargarse allí, no en el componente.

8.3.4. **Reutilizar api.js.** No crear un nuevo servicio API.

8.3.5. **Reutilizar estilos existentes.** No crear nuevas clases CSS si ya existe una que cumple la función.

---

## 9. Flujo para Modificar un Módulo/Entidad Existente

### 9.1. Orden estricto

1. **Leer el modelo** en `models.py` para conocer los campos exactos.
2. **Leer el serializer** en `serializers.py` para saber cómo se serializa.
3. **Leer el ViewSet** en `views.py` para entender la lógica de negocio y filtrado por rol.
4. **Buscar en qué componentes del frontend se usa** ese endpoint/dato (grep en todo el proyecto).
5. **Modificar el backend primero**: serializer → view → urls (si aplica).
6. **Modificar `api.js`** si cambian los endpoints o parámetros.
7. **Modificar `DataContext.jsx`** si cambia la estructura de los datos devueltos.
8. **Modificar los componentes** que consumen esos datos.
9. **Verificar que el cambio sea consistente** en todos los roles que usan esa entidad.
10. **Verificar que el cambio no rompa la generación de PDFs** si aplica.

### 9.2. Reglas obligatorias

9.2.1. **No cambiar la firma de funciones de `api.js`** sin actualizar todos los llamados (DataContext + componentes).

9.2.2. **No cambiar la estructura del `user` en `AuthContext`** sin actualizar todos los dashboards.

9.2.3. **No eliminar propiedades del objeto `data` en `DataContext`** sin verificar que ningún componente (de ningún rol) las use.

9.2.4. **No agregar campos requeridos a modelos existentes** sin verificar que todos los serializers y formularios los manejen.

---

## 10. Formularios: Estándar Visual Obligatorio

### 10.1. Patrón visual que sigue TODO el sistema

Todos los formularios del sistema siguen exactamente este patrón. Cualquier formulario nuevo DEBE cumplirlo:

```
┌──────────────────────────────────────────────┐
│  Título del Formulario                        │
│  ┌──────────────────────────────────────────┐ │
│  │  ┌───────┐    ┌───────┐                   │ │
│  │  │ Campo  │    │ Campo  │                   │ │
│  │  └───────┘    └───────┘                   │ │
│  │  ┌───────┐    ┌───────┐                   │ │
│  │  │ Campo  │    │ Campo  │                   │ │
│  │  └───────┘    └───────┘                   │ │
│  │  ┌──────────────────────────────────┐      │ │
│  │  │ Campo largo (textarea)           │      │ │
│  │  └──────────────────────────────────┘      │ │
│  │                                           │ │
│  │  [ Guardar ]  [ Cancelar ]                │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 10.2. Especificación visual

| Elemento | Especificación |
|----------|---------------|
| Botón para abrir | `.btn-primary` con texto "Crear", "Nuevo", "Agregar" |
| Estado inicial | Formulario oculto (no visible hasta hacer clic en el botón) |
| Apertura | Clic en botón → formulario se muestra (slide down o toggle) |
| Cierre | Botón "Cancelar" → formulario se oculta |
| Fondo | `var(--sidebar-hover)` o fondo institucional consistente |
| Labels | Texto legible en español, en negrita |
| Padding interno | `padding: 16-20px` |
| Márgenes | `margin-bottom: 16px` entre grupos de campos |
| Bordes | `border-radius: 8px`, borde `1px solid var(--border-color)` |
| Separación entre campos | `gap: 12-16px` en grid |
| Grid | 2 columnas responsivas (`.preceptor-form-row--two` o similar) |
| Campos largos | Ocupan ambas columnas (full width) |
| Botón Guardar | `.btn-success` o `.btn-primary` |
| Botón Cancelar | `.btn-secondary` |
| Inputs | `padding: 8-12px`, `border-radius: 6px`, borde sutil |
| Placeholder | Texto en gris claro indicando qué ingresar |
| Validación | Mensajes de error visibles abajo del campo correspondiente |

### 10.3. Clases CSS que usar

- Contenedor: usar las clases existentes de cada módulo (`.preceptor-form-row`, `.filter-row`, etc.)
- Grid de 2 columnas: `.preceptor-form-row--two` o `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`
- Botones: `.btn`, `.btn-primary`, `.btn-success`, `.btn-secondary`
- Inputs: usar las clases nativas del CSS global (input, select, textarea ya estilizados)

### 10.4. Reglas obligatorias

10.4.1. **No crear nuevos estilos para formularios.** Usar las clases y patrones existentes.

10.4.2. **No usar placeholders como labels.** Los labels deben estar visibles arriba o al lado del campo.

10.4.3. **Validar antes de enviar.** Usar `onSubmit` con `preventDefault` y validación de campos requeridos.

10.4.4. **Manejar estados de carga.** Deshabilitar botón "Guardar" mientras se envía.

---

## 11. Componentes: Reutilización Obligatoria

### 11.1. Regla de oro

**ANTES de crear un nuevo componente, buscar en TODO el proyecto si ya existe uno similar que pueda:**

- Usarse directamente
- Extenderse con props
- Refactorizarse a Shared/ para ambos usos

### 11.2. Qué reutilizar

| Tipo | Qué buscar | Dónde |
|------|-----------|-------|
| Tablas | Patrón `.table-responsive` + estructura de columnas | Todos los módulos |
| Botones | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success` | index.css |
| Formularios | `.form-group-filter`, `.filter-row`, `.preceptor-form-row--two` | Preceptores, Admin |
| Confirmaciones | `window.confirm()` antes de eliminar | Todos los módulos |
| Tarjetas | `.card`, `.card-header-flex` | Shared, todos los módulos |
| Perfiles | `Panel{Rol}.jsx` — grid de datos + tabla contextual | Cada módulo (rol) |
| Sidebar | `sidebarMenu.js` + `sidebar.jsx` | Preceptor, Docente, Admin |
| Header | `header.jsx` | Shared |
| Dashboard | `<Rol>Dashboard.jsx` patrón: sidebar + header + contenido | Cada módulo |

### 11.3. Reglas obligatorias

11.3.1. **No duplicar componentes compartidos.** Si un componente sirve para múltiples roles (ej: vista de comunicados), debe estar en `Shared/` y ser importado por cada dashboard.

11.3.2. **No crear `StatCard` como componente separado.** Usar el patrón inline (local dentro de cada archivo) que ya existe en todos los `Panel{Rol}.jsx`.

11.3.3. **No crear componentes que ya existen.** Buscar siempre antes de crear.

---

## 12. Nuevos Módulos: Deben Seguir la Arquitectura Existente

### 12.1. Regla absoluta

**Cualquier módulo nuevo debe seguir EXACTAMENTE la misma arquitectura que los módulos existentes.** No crear un diseño diferente, no cambiar el patrón, no innovar en la estructura.

### 12.2. Qué debe reutilizar obligatoriamente

12.2.1. **Sidebar:** Usar `sidebarMenu.js` o el menú inline existente. No crear un nuevo sistema de navegación.

12.2.2. **DataContext:** Los datos globales se cargan en DataContext, no en el componente.

12.2.3. **api.js:** Todas las llamadas API van en api.js, no en el componente.

12.2.4. **CRUD existente:** Seguir el mismo patrón de creación/edición/eliminación.

12.2.5. **Estilos existentes:** Usar las clases CSS existentes. No crear nuevas clases a menos que sea estrictamente necesario.

12.2.6. **Dashboard:** Cada módulo se integra en el dashboard del rol correspondiente como un case más en el switch de `view`.

### 12.3. Estructura de integración

```
Dashboard.jsx:
  const [view, setView] = useState('default');
  switch (view) {
    case 'nuevo-modulo': return <NuevoModulo ... />;
    case 'otro': return <Otro ... />;
  }

sidebarMenu.js:
  { id: 'nuevo-modulo', label: 'Nuevo Módulo', icon: '📄' },
```

---

## 13. Generación de PDFs

### 13.1. Reglas absolutas

13.1.1. **🔥 REGLA ABSOLUTA — Los PDFs SIEMPRE se generan desde el backend (Django + ReportLab).** Nunca generar PDFs desde React. La única excepción existente es el boletín de calificaciones (`frontend/src/utils/boletin.js`) que usa `window.print()` — no replicar este patrón.

13.1.2. **Al generar un PDF, reemplazar automáticamente la versión anterior** (si existe). En update, eliminar el PDF anterior del disco antes de regenerar.

13.1.3. **Guardar únicamente la ruta en la base de datos.** No guardar el contenido del PDF en la BD. Usar `CharField` con la ruta relativa (ej: `planificaciones/Proyecto_Matematica_4°1_2025.pdf`).

13.1.4. **Usar nombres de archivo consistentes.** Patrón: `{Tipo}_{Materia}_{Curso}_{Año}.pdf`. Sanitizar el nombre eliminando caracteres inválidos (`\/:*?"<>|`) y reemplazando espacios con `_`.

13.1.5. **La URL del PDF se construye concatenando `MEDIA_URL` + ruta guardada.** No guardar la URL completa en la BD.

### 13.2. Ubicación de la lógica

- **Planificaciones:** `PlanificacionViewSet._generar_pdf()` en `views.py`
- **Boletín (excepción):** `exportarBoletinPDF()` en `frontend/src/utils/boletin.js` (usa `window.print()`)

---

## 14. Nomenclatura: Español Obligatorio

### 14.1. Regla absoluta

**TODO el proyecto utiliza español.** Está prohibido mezclar inglés y español.

Esto incluye:

| Elemento | Regla | Ejemplo correcto | Ejemplo incorrecto |
|----------|-------|-----------------|-------------------|
| Componentes React | PascalCase en español | `NuevoAlumno`, `PanelDocente` | `NewStudent`, `TeacherPanel` |
| Archivos JSX | PascalCase en español | `NuevoAlumno.jsx` | `NewStudent.jsx` |
| Variables JS | camelCase en español | `alumnosData`, `esLoading` | `studentsData`, `isLoading` |
| Funciones JS | camelCase en español | `getAlumnos`, `createCurso` | `getStudents`, `createCourse` |
| Endpoints API | kebab-case plural en español | `/api/alumnos/`, `/api/curso-materia/` | `/api/students/`, `/api/course-subject/` |
| Textos visibles | Español | "Guardar", "Eliminar", "Crear alumno" | "Save", "Delete", "Create student" |
| Nombres de tablas BD | snake_case plural en español | `alumnos`, `materias`, `curso_materia` | `students`, `subjects` |
| Nombres de modelos | PascalCase singular en español | `Alumno`, `CursoMateria` | `Student`, `CourseSubject` |
| Nombres de campos BD | snake_case en español | `nombre`, `apellido`, `fecha_nacimiento` | `name`, `last_name`, `birth_date` |
| Clases CSS | kebab-case en español | `.admin-curso`, `.materia-card` | `.admin-course`, `.subject-card` |
| Comentarios en código | Español | `// Obtener alumno por ID` | `// Get student by ID` |

---

## 15. Permisos por Rol

### 15.1. Regla obligatoria

**Cualquier modificación debe respetar los permisos por rol. Nunca mostrar opciones que el rol no pueda utilizar.**

### 15.2. Implementación

15.2.1. **Frontend — Sidebar:** El sidebar solo debe mostrar items que el rol actual puede usar. Verificar en `sidebarMenu.js` que cada item tenga el filtro de rol correcto.

15.2.2. **Frontend — Componentes:** No renderizar botones de "Crear", "Editar", "Eliminar" si el rol no tiene permiso para esas acciones. Usar `user.role` o `user.roles` para condicionar.

15.2.3. **Frontend — Rutas:** Los dashboards solo renderizan vistas permitidas para el rol. El switch en el dashboard no debe tener cases para vistas que el rol no puede ver.

15.2.4. **Backend — ViewSets:** Usar `permission_classes` y `get_queryset()` para filtrar datos por rol. Nunca devolver datos que el rol no debería ver.

15.2.5. **Backend — Permisos personalizados:** Usar las clases existentes en `permissions.py` (`IsAdminOrDirector`, `IsPreceptorOrAdmin`, `IsDocenteOrAdmin`, etc.).

### 15.3. Roles y lo que pueden ver

| Rol | Sidebar items | Acciones de escritura |
|-----|--------------|----------------------|
| Admin/Director | Todos | CRUD completo en todo |
| Preceptor | Perfil, Alumnos, Docentes, Horarios, Asistencias, Notas, Actas, Comunicados | Gestión de cursos asignados |
| Docente | Perfil, Alumnos, Info, Proyectos, Actividades, Asistencia, Comunicados | Solo de sus materias |
| Alumno | Perfil, Calificaciones, Asistencias, Actividades, Horarios, Comunicados | Solo lectura |
| Familia | Perfil, Resumen, Calificaciones, Asistencias, Actas, Horarios, Actividades, Comunicados | Solo lectura de datos de sus hijos |

---

## 16. Consistencia Visual

### 16.1. Regla absoluta

**Si un usuario cambia entre módulos (ej: de Perfil a Calificaciones a Comunicados), no debe percibir diferencias de diseño. Todos los módulos deben parecer parte del mismo sistema.**

### 16.2. Cómo garantizarla

16.2.1. **Usar las mismas clases CSS** en todos los módulos. `.card`, `.btn`, `.table-responsive`, `.badge` deben verse igual en Admin, Preceptor, Docente, Alumno y Familia.

16.2.2. **Usar el mismo layout de dashboard:** sidebar izquierdo + header superior + contenido central. Todos los dashboards siguen este patrón.

16.2.3. **Los perfiles (`Panel{Rol}.jsx`) deben tener la misma estructura visual:** grid de datos personales + tabla contextual + tarjetas de estadísticas. El diseño de `PanelDocente.jsx` es la plantilla.

16.2.4. **Los formularios deben usar el mismo patrón visual** (ver sección 10).

16.2.5. **Los botones deben tener los mismos colores y tamaños** en todos los módulos.

16.2.6. **Las tablas deben tener la misma estructura:** `.table-responsive` con las mismas variables de color, bordes, y hover.

16.2.7. **Las tarjetas de estadísticas (`StatCard`) deben tener el mismo diseño** en todos los perfiles: icono, número, label, color de acento.

### 16.3. Lo que NUNCA debe pasar

- Un módulo usa botones verdes y otro usa botones azules para la misma acción
- Un módulo usa `border-radius: 4px` y otro usa `border-radius: 12px`
- Un módulo tiene el formulario visible por defecto y otro lo tiene oculto
- Un módulo usa un grid de 3 columnas y otro usa un layout diferente
- Los colores de fondo, padding, márgenes cambian entre módulos

---

## 17. Mejores Prácticas

### Backend

17.1. Usar `@extend_schema` de `drf-spectacular` para documentar endpoints (cuando sea necesario agregar).

17.2. Las vistas de listado deben devolver datos planos (no anidados) para facilitar el consumo del frontend.

17.3. Usar `select_related` y `prefetch_related` en `get_queryset()` para optimizar consultas N+1.

17.4. Las vistas de creación deben validar permisos de acceso antes de crear.

17.5. Usar `status` de DRF explícitamente (ej: `status.HTTP_201_CREATED`, `status.HTTP_400_BAD_REQUEST`).

17.6. **No duplicar lógica de negocio.** Si una función helper existe (ej: `_usuario_context`, `_preceptor_actual`), reutilizarla.

17.7. **No duplicar exports.** No exportar dos funciones con el mismo nombre desde `serializers.py` o `views.py`.

### Frontend

17.8. Usar `useMemo` y `useCallback` para evitar re-renderizados innecesarios en componentes pesados.

17.9. Todos los fetch/carga de datos deben hacerse en DataContext, no en componentes individuales.

17.10. Las listas/tablas deben usar `key` único en cada fila.

17.11. Manejar siempre el estado de carga (`loading`) y error (`error`) en componentes que usan datos asíncronos.

17.12. Los formularios deben validar antes de enviar. Usar `onSubmit` con `preventDefault`.

17.13. Las operaciones de eliminación deben pedir confirmación (usar `window.confirm` si no hay modal personalizado).

17.14. **No duplicar funciones en `api.js`.** Verificar que la función no exista antes de crearla.

17.15. **No modificar código sin comprenderlo completamente.** Leer el archivo completo antes de hacer cambios.

17.16. **No eliminar código sin revisar todas las referencias** con grep en todo el proyecto.

17.17. **Mantener el estilo de código del proyecto.** Si el proyecto usa `function Componente(props)` no usar `const Componente: React.FC<Props> = ...`.

17.18. **Usar `?? []` en todas las colecciones provenientes de DataContext** para evitar errores de `.map()` en `undefined`.

17.19. **Poner todos los hooks ANTES de cualquier early return.** Mover guardias de null dentro de `useMemo`.

### Generales

17.20. **Si una IA no entiende un fragmento de código, debe leer los archivos relacionados antes de modificar.**

17.21. **Preferir cambios pequeños y localizados sobre cambios grandes y dispersos.**

17.22. **No cambiar el backend si el frontend puede resolverlo.** Preferir lógica del lado del cliente cuando sea posible.

---

## 18. Convenciones de Commits

### 18.1. Formato obligatorio

Todos los commits deben seguir el formato:

```
<tipo>(<ámbito>): <descripción breve>
```

- **`<tipo>`:** Indica la naturaleza del cambio (ver abajo).
- **`<ámbito>`:** Opcional. Indica el módulo o archivo afectado (ej: `docente`, `planificaciones`, `api`, `admin`).
- **`<descripción breve>`:** En español, presente de indicativo, sin mayúscula inicial, sin punto final. Máximo 72 caracteres.

### 18.2. Tipos de commit

| Tipo | Cuándo usarlo | Ejemplo |
|------|---------------|---------|
| `feat` | Nueva funcionalidad para el usuario (backend o frontend) | `feat(docente): agregar módulo Proyectos` |
| `fix` | Corrección de un bug | `fix(planificaciones): corregir estado nulo al crear proyecto` |
| `refactor` | Cambio interno que no agrega funcionalidad ni corrige bugs | `refactor(api): unificar funciones de login` |
| `style` | Cambios de formato, CSS, diseño visual | `style(perfil): mejorar diseño del perfil docente` |
| `docs` | Cambios exclusivos en documentación | `docs: actualizar PROYECTO.md con nuevos módulos` |
| `chore` | Cambios en herramientas, configuraciones, dependencias | `chore: agregar axios a dependencias` |

### 18.3. Reglas

18.3.1. **Siempre en español.** El tipo (`feat`, `fix`, etc.) va en inglés (convención universal), pero el ámbito y la descripción van en español.

18.3.2. **Un commit por cambio lógico.** Si un cambio afecta backend y frontend, va en un solo commit. No dividir un cambio en múltiples commits.

18.3.3. **Descripciones claras.** Usar presente de indicativo: `agregar`, `corregir`, `actualizar`, `eliminar`. No usar pasado: `agregado`, `corregido`.

18.3.4. **Ámbito opcional pero recomendado.** Usar ámbito cuando el cambio sea específico de un módulo. Omitir para cambios globales (`docs: ...`, `chore: ...`).

18.3.5. **No incluir `docs` para cambios que también modifican código.** Si se agrega una funcionalidad y se documenta, usar `feat`.

18.3.6. **No usar `style` para cambios de lógica.** `style` es exclusivamente para CSS, formato, diseño visual. No confundir con `refactor`.

### 18.4. Ejemplos adicionales

```
feat(preceptor): agregar vista de horarios

fix(admin): corregir error al eliminar alumno sin tutor

refactor(DataContext): unificar carga de calificaciones

style(sidebar): mejorar contraste del menú activo

style(comunicados): rediseñar tarjeta de comunicado

docs: agregar sección de commits a REGLAS_DESARROLLO.md

chore: actualizar dependencias de frontend

feat(api): agregar endpoint de horarios especiales

fix(login): corregir mensaje de error cuando usuario está inhabilitado
```

---

## 19. Errores Comunes y Cómo Evitarlos

| # | Error | Causa | Solución |
|---|-------|-------|----------|
| 1 | Agregar modelo sin `managed=False` | Olvido | Siempre verificar `class Meta` |
| 2 | Crear archivo separado para modelo/serializer/view | Hábito de otros proyectos | Agregar al archivo existente |
| 3 | Usar `id` como nombre de campo FK | Convención de django por defecto | Usar `db_column='id_<tabla>'` |
| 4 | Duplicar estado de DataContext en componente | Desconocimiento del proyecto | Usar `useData()` siempre |
| 5 | Llamar axios directamente | Desconocimiento de api.js | Todas las llamadas van en api.js |
| 6 | Agregar estilo en línea | Prisa | Usar clases CSS en index.css |
| 7 | Crear migraciones | Hábito de otros proyectos | `makemigrations` y `migrate` prohibidos |
| 8 | Usar nombres en inglés | Olvido | Todo en español |
| 9 | Agregar librería UI externa | Desconocimiento | index.css es la única fuente de estilo |
| 10 | Modificar CSS de una clase usada en múltiples componentes | Falta de grep | Buscar clase antes de modificar |
| 11 | Poner `<select>` sin value inicial controlado | Olvido | Siempre usar `value={state} onChange={handler}` |
| 12 | Hacer fetch en un componente en lugar de DataContext | Desconocimiento | DataContext carga todo al inicio |
| 13 | **Duplicar funciones en api.js** | No buscar antes de crear | Buscar función existente antes de agregar |
| 14 | **Modificar modelos sin verificar MySQL** | Confiar en SQL de referencia | Verificar estructura real con `DESCRIBE tabla;` |
| 15 | **Asumir columnas que no existen en ciertos modelos** | Confundir campos entre modelos | Verificar el modelo exacto (`correo` no existe en Alumno) |
| 16 | **Romper DataContext al cambiar estructura de respuesta** | No actualizar la transformación | Si cambia el backend, actualizar `fetchData()` |
| 17 | **Cambiar endpoints innecesariamente** | "Mejorar" sin razón | No cambiar lo que funciona |
| 18 | **Crear componentes que ya existen** | No buscar en Shared/ | Siempre buscar antes de crear |
| 19 | **Romper la consistencia visual entre módulos** | No revisar el diseño de otros módulos | Verificar que el cambio se vea igual en todos los roles |
| 20 | **Hooks después de early return** | Desconocimiento de Rules of Hooks | Poner hooks ANTES de cualquier return |
| 21 | **No llamar refreshData después de crear/editar** | Olvido | Llamar `refreshData()` después de operaciones de escritura |
| 22 | **Mostrar opciones que el rol no puede usar** | No verificar permisos en frontend | Condicionar con `user.role` |

---

## 20. Checklist Obligatorio — Antes de Modificar (LEER antes de escribir cualquier código)

### Preliminares
- [ ] **Leí PROYECTO.md** para entender el contexto del módulo afectado.
- [ ] **Leí REGLAS_DESARROLLO.md** completo (este documento).
- [ ] **Leí el archivo completo** que voy a modificar para entender el patrón existente.

### Verificaciones de búsqueda
- [ ] **Busqué referencias cruzadas** con grep para no romper otro módulo.
- [ ] **Busqué funciones existentes** en api.js antes de agregar nuevas.
- [ ] **Busqué componentes existentes** en Shared/ y otros módulos antes de crear nuevos.
- [ ] **Busqué clases CSS existentes** antes de agregar nuevas.

### Backend
- [ ] **No estoy creando** un nuevo archivo Python donde no debe ir.
- [ ] **No estoy agregando** un nuevo modelo sin `managed=False`.
- [ ] **Verifiqué la estructura real de MySQL** antes de modificar un modelo (no confiar en SQL de referencia).
- [ ] **Verifiqué campos de cada modelo** (`correo` no existe en Alumno, `fecha_nacimiento` solo en Alumno, etc.).
- [ ] **Actualicé serializer, viewset, y urls** si modifiqué el modelo.

### Frontend
- [ ] **No estoy duplicando** estado que ya existe en DataContext.
- [ ] **No estoy llamando** `axios` directamente en un componente (todo va en api.js).
- [ ] **No estoy agregando** una librería externa de UI.
- [ ] **No estoy agregando** estilos CSS fuera de `index.css`.
- [ ] **Estoy siguiendo** el estándar visual de formularios (sección 10).
- [ ] **Estoy reutilizando** componentes existentes antes de crear nuevos.

### Permisos y navegación
- [ ] **Verifiqué que el sidebar filtre** correctamente por rol.
- [ ] **No estoy mostrando** opciones que el rol no pueda usar.
- [ ] **Los strings visibles** están en español.
- [ ] **Los nombres** de componentes, funciones, archivos y variables siguen la convención (español).

### Ejecución
- [ ] **No estoy ejecutando** `makemigrations` o `migrate`.
- [ ] **Puse todos los hooks** ANTES de cualquier early return.
- [ ] **Usé `?? []`** en todas las colecciones de DataContext.
- [ ] **Llamo a `refreshData()`** después de operaciones de escritura.

### Verificación final
- [ ] **El cambio es consistente** en todos los roles que usan esa entidad.
- [ ] **No se rompe la consistencia visual** entre módulos.
- [ ] **No se rompe la generación de PDFs** (si aplica).
- [ ] **No eliminé propiedades** del `data` en DataContext sin verificar todos los consumidores.

---

## 21. Checklist Obligatorio — Después de Modificar (Validación)

> **Ninguna modificación debe considerarse terminada sin completar este checklist.** Después de cada cambio, ejecutar estas validaciones en orden.

### Backend
- [ ] Ejecuté `python manage.py runserver` y el servidor arranca sin errores.
- [ ] Probé los endpoints modificados con curl, Postman, o directamente desde el frontend.
- [ ] No hay errores 500 ni 400 inesperados en las respuestas.
- [ ] Los permisos funcionan correctamente para cada rol que usa el endpoint.
- [ ] Si modifiqué modelos: la estructura coincide con MySQL real (`DESCRIBE <tabla>;`).
- [ ] Si modifiqué serializers: los campos devueltos coinciden con lo que espera el frontend.
- [ ] Si modifiqué la generación de PDF: el PDF se genera correctamente y se puede descargar.

### Frontend
- [ ] Ejecuté `npm run dev` y el servidor arranca sin errores de compilación.
- [ ] No hay errores en la consola del navegador (F12 → Console).
- [ ] No hay errores en la pestaña Network (F12 → Network — todas las llamadas HTTP responden OK).
- [ ] La interfaz se renderiza correctamente sin errores de React (no hay "rendered fewer hooks" ni errores similares).
- [ ] Los datos se cargan correctamente desde DataContext (no hay valores `undefined` ni `null` inesperados).
- [ ] Si agregué funciones a `api.js`: se importan correctamente en DataContext o en el componente.

### Sistema
- [ ] **CRUD funcionando:** Crear, leer, actualizar y eliminar funcionan correctamente.
- [ ] **Permisos correctos:** Cada rol ve solo lo que debe ver. No hay opciones que un rol no debería tener.
- [ ] **DataContext funcionando:** Los datos globales se cargan y están disponibles en `useData()`.
- [ ] **api.js funcionando:** Todas las funciones API retornan datos correctos.
- [ ] **PDFs funcionando:** Si el cambio afecta planificaciones, el PDF se genera y descarga correctamente.
- [ ] **Navegación funcionando:** Todos los items del sidebar llevan a la vista correcta.
- [ ] **Responsive correcto:** La interfaz se ve bien en diferentes tamaños de pantalla (probado al menos en 1366px y 1920px).
- [ ] **Diseño consistente:** El cambio no introduce diferencias visuales respecto al resto del sistema (mismos colores, bordes, paddings, tipografía).
- [ ] **Sin errores en F12:** La consola del navegador no muestra errores de JS, React, ni llamadas HTTP fallidas.
- [ ] **Sin errores en Django:** El servidor de Django no muestra errores ni warnings.

### Regresión
- [ ] Los módulos existentes que NO fueron modificados siguen funcionando correctamente.
- [ ] Los perfiles de todos los roles se renderizan sin errores.
- [ ] El login, logout y refresh de token funcionan correctamente.

---

## 22. Roles de Usuario y sus Permisos en el Sistema

| Rol | Backend ID | Nivel | Permisos |
|-----|-----------|-------|----------|
| Admin / Director | 1 | Total | Acceso total a todo. CRUD completo en todas las entidades. |
| Preceptor | 2 | Medio-Alto | Gestión de cursos asignados, asistencias, actas, comunicados, calificaciones. |
| Docente | 3 | Medio | Gestión de calificaciones, asistencias, planificaciones, diagnósticos — solo de sus materias asignadas. |
| Alumno | 4 | Bajo (solo lectura) | Vista de sus propias calificaciones, asistencias, horarios, comunicados, actividades. |
| Familia | 5 | Bajo (solo lectura) | Vista de datos de sus hijos (alumnos asociados al tutor). Misma información que Alumno pero agrupada por hijo. |

---

## 23. Mapa de Datos: Cómo se Conectan las Entidades

```
Usuario (id_usuario)
  ├── Directivo (id_usuario) — rol 1
  ├── Preceptor (id_usuario) — rol 2
  │     └── Curso (id_preceptor)
  ├── Docente (id_usuario) — rol 3
  │     └── CursoMateria (id_docente)
  │           ├── Calificacion (id_curso_materia)
  │           ├── Asistencia (id_curso_materia)
  │           ├── Horario (id_curso_materia)
  │           ├── InscripcionMateria (id_curso_materia)
  │           ├── Planificacion (id_curso_materia)
  │           └── ActividadDocente (id_curso_materia)
  ├── Alumno (id_usuario) — rol 4
  │     ├── Curso (id_curso)
  │     ├── Calificacion (id_alumno)
  │     ├── Asistencia (id_alumno)
  │     ├── ActaAlumno (id_alumno)
  │     ├── InscripcionMateria (id_alumno)
  │     └── PadreTutor (id_tutor)
  └── PadreTutor (id_usuario) — rol 5
        └── Alumno (id_tutor)

Curso (id_curso)
  ├── CicloLectivo (id_ciclo)
  ├── Preceptor (id_preceptor)
  └── CursoMateria (id_curso)

Acta (id_acta)
  ├── TipoActa (id_tipo_acta)
  ├── ActaAlumno (id_acta)
  ├── ActaCurso (id_acta)
  └── ActaDocente (id_acta)

Comunicado (id_comunicado)
  ├── ComunicadoAlcance (id_comunicado)
  └── ComunicadoArchivo (id_comunicado)

Notificacion (id_usuario)
HistorialCambio (id_usuario, id_tipo_accion)
```

---

## 24. Resolución de Problemas Comunes

### "El componente no encuentra el dato que necesita"
→ Buscar en `useData()` qué está disponible. Si no está, verificar DataContext.fetchData(). Si no se carga allí, el componente no debería cargarlo por su cuenta — agregarlo a DataContext.

### "Necesito filtrar datos del lado del backend"
→ Modificar `get_queryset()` en el ViewSet correspondiente. Seguir el patrón de filtrado por rol que ya existe.

### "Necesito un nuevo endpoint"
→ Agregar función en `api.js` → Si trae nuevos datos, agregar a DataContext. Si es operación, usarla directamente en el componente.

### "Hay un bug en un componente"
→ Revisar si el bug está en el componente, en los datos (DataContext), o en la API (backend). Leer el archivo completo antes de hacer cambios.

### "Necesito cambiar la estructura de un dato"
→ Modificar: backend serializer → (si aplica) backend model → DataContext transformación → componentes que lo usan. Siempre verificar todos los consumidores con grep.

### "La BD real no coincide con el modelo Django"
→ La BD real tiene razón. Actualizar el modelo Django para reflejar la BD real. La BD es la fuente de verdad absoluta.

### "El SQL de referencia dice una cosa pero MySQL dice otra"
→ MySQL tiene razón. El SQL de referencia puede estar desactualizado. Ignorar el SQL de referencia y usar la estructura real de MySQL.

---

## 25. Referencia Rápida de Archivos

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `backend/proyecto/escuela/models.py` | ~647 | 21 modelos Django (managed=False) |
| `backend/proyecto/escuela/serializers.py` | ~1540 | Serializers DRF (~40 serializers) |
| `backend/proyecto/escuela/views.py` | ~1881 | Viewsets DRF (~19 ViewSets + funciones) |
| `backend/proyecto/escuela/urls.py` | ~60 | Rutas API (DefaultRouter + urlpatterns) |
| `backend/proyecto/escuela/permissions.py` | ~150 | Permisos por rol (5 clases) |
| `backend/proyecto/escuela/auth_backend.py` | ~80 | Backend de autenticación custom |
| `frontend/src/services/api.js` | ~519 | Funciones API (~50 funciones) |
| `frontend/src/context/DataContext.jsx` | ~702 | Estado global (26 llamadas paralelas) |
| `frontend/src/context/AuthContext.jsx` | ~120 | Autenticación (JWT + user) |
| `frontend/src/index.css` | ~2350 | Todos los estilos del sistema |
| `frontend/src/App.jsx` | ~60 | Router por roles |
| `PROYECTO.md` | ~1468 | Documentación del proyecto |
| `REGLAS_DESARROLLO.md` | ~700+ | **Este archivo** — reglas para IA |
