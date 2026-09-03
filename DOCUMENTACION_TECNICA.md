# DOCUMENTACIÓN TÉCNICA — MiSecundaria 7

## Índice

1. [Descripción general del proyecto](#1-descripción-general-del-proyecto)
2. [Estructura completa del repositorio](#2-estructura-completa-del-repositorio)
3. [Backend](#3-backend)
4. [Frontend](#4-frontend)
5. [Sistema de usuarios](#5-sistema-de-usuarios)
6. [Flujo de autenticación](#6-flujo-de-autenticación)
7. [Flujo de datos](#7-flujo-de-datos)
8. [Base de datos](#8-base-de-datos)
9. [Componentes importantes](#9-componentes-importantes)
   - 9.1 [Tabla de Componentes por Dashboard](#91-tabla-de-componentes-por-dashboard)
10. [Context API](#10-context-api)
11. [Servicios (api.js)](#11-servicios-apijs)
12. [Convenciones del proyecto](#12-convenciones-del-proyecto)
13. [Módulos implementados](#13-módulos-implementados)
14. [Decisiones Arquitectónicas](#14-decisiones-arquitectónicas)
15. [Módulo Proyectos (ex Planificaciones)](#15-módulo-proyectos-ex-planificaciones)
    - 15.5 [Matriz Rol×Endpoint de Auditoría](#155-matriz-rolexendpoint-de-auditoría)
16. [Cómo agregar nuevos módulos](#16-cómo-agregar-nuevos-módulos)
17. [Errores comunes](#17-errores-comunes)
    - 17.2 [Estrategias de Debugging de Navegación](#172-estrategias-de-debugging-de-navegación)
    - 17.3 [Tabla de useState Críticas](#173-tabla-de-usestate-críticas)
18. [Recomendaciones para futuras IA](#18-recomendaciones-para-futuras-ia)
19. [Estándar Visual de Formularios](#19-estándar-visual-de-formularios)
20. [Consistencia Visual entre Módulos](#20-consistencia-visual-entre-módulos)
21. [Mi Perfil — Estadísticas por rol](#21-mi-perfil--estadísticas-por-rol)
22. [Checklist de Verificación de Modelos](#22-checklist-de-verificación-de-modelos)

---

## 1. Descripción general del proyecto

### 1.1 Objetivo

**MiSecundaria 7** es un sistema de gestión escolar diseñado para una escuela secundaria argentina. Reemplaza los procesos manuales (planillas en papel, registros físicos, comunicados impresos) por una plataforma digital donde cada actor del sistema educativo tiene un panel personalizado.

### 1.2 Qué resuelve

- Digitalización de calificaciones, asistencias y actas.
- Gestión de proyectos pedagógicos con generación automática de PDF.
- Comunicados dirigidos por curso, materia o nivel.
- Declaraciones Juradas digitales para docentes.
- Visualización de horarios, actividades y diagnóstico grupal.
- Notificaciones internas por usuario.
- Roles y permisos diferenciados (Admin, Director, Docente, Preceptor, Alumno, Familia).

### 1.3 Tecnologías utilizadas

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React 18 (Vite) | 18.3.1 |
| | React DOM | 18.3.1 |
| | Axios | 1.7.9 |
| | Vite | 5.4.1 |
| **Backend** | Django 6.0 (DRF) | 6.0 |
| | Django REST Framework | — |
| | SimpleJWT | — |
| | ReportLab (PDF) | — |
| | mysqlclient | — |
| **Base de datos** | MySQL 8+ | — |
| **Autenticación** | JWT (access + refresh tokens) | — |

### 1.4 Arquitectura

**SPA (Single Page Application)** con frontend React y backend Django REST API:

```
┌─────────────┐     JWT Auth     ┌──────────────┐     ┌──────────┐
│  React SPA  │ ──────────────►  │  Django API   │ ──► │  MySQL   │
│  (Vite)     │ ◄──────────────  │  (DRF)        │ ◄── │  DB      │
└─────────────┘     JSON/HTTP    └──────────────┘     └──────────┘
      │                                                    │
      │  localhost:5173                                    │  :3306
      └───────────────── Axios ────────────────────────────┘
```

No hay Server-Side Rendering. No hay BFF (Backend For Frontend). El frontend se comunica directamente con la API REST de Django.

---

## 2. Estructura completa del repositorio

```
/
├── DOCUMENTACION_TECNICA.md           # Este archivo
├── README.md                      # README original
│
├── backend/
│   └── proyecto/
│       ├── manage.py              # Entrypoint de Django
│       ├── requirements.txt       # Dependencias Python
│       ├── db.sqlite3             # (no usado en producción, BD real es MySQL)
│       ├── proyecto/              # Config de Django
│       │   ├── settings.py        # Config: BD, CORS, JWT, apps instaladas
│       │   ├── urls.py            # URL patterns del proyecto
│       │   ├── wsgi.py
│       │   └── asgi.py
│       └── escuela/               # App principal del sistema
│           ├── models.py          # TODOS los modelos
│           ├── serializers.py     # TODOS los serializers
│           ├── views.py           # TODAS las views y view sets
│           ├── urls.py            # Router de la API
│           ├── permissions.py     # Permisos personalizados
│           ├── auth_backend.py    # Backend de autenticación custom
│           ├── utils.py           # Utilidades (normalizar_dni, etc.)
│           ├── admin.py
│           ├── apps.py
│           └── tests.py
│
├── frontend/
│   ├── package.json               # Dependencias Node
│   ├── vite.config.js             # Config de Vite
│   ├── index.html                 # HTML raíz
│   └── src/
│       ├── main.jsx               # Entrypoint React
│       ├── App.jsx                # Router por roles
│       ├── index.css              # CSS global (variables, layout, componentes)
│       ├── context/
│       │   ├── AuthContext.jsx     # Contexto de autenticación
│       │   └── DataContext.jsx     # Contexto de datos globales
│       ├── services/
│       │   └── api.js             # Cliente Axios con TODAS las llamadas
│       ├── utils/
│       │   ├── dni.js             # Formateo de DNI
│       │   ├── orientacion.js     # Orientación de cursos (Sociales/Gestión)
│       │   ├── boletin.js         # Generación de boletín PDF
│       │   └── modulos.js         # (no utilizado actualmente)
│       ├── data/
│       │   └── mockData.js        # (no utilizado, legacy)
│       └── components/
│           ├── Login/
│           │   ├── login.jsx      # Pantalla de login
│           │   └── login.css      # Estilos de login
│           ├── Notificaciones.jsx  # Componente compartido
│           ├── Administracion/     # Panel de Admin/Director
│           ├── Alumno/             # Panel de Alumno
│           ├── Familia/            # Panel de Familia/Tutor
│           ├── Preceptores/        # Panel de Preceptor
│           ├── Profesores/         # Panel de Docente
│           └── Shared/             # Componentes compartidos
│
├── estructura base de datos/
│   └── sistema_escolar.sql        # DDL de la BD (solo referencia visual)
```

---

## 3. Backend

### 3.1 Organización

El backend es un proyecto Django con una sola app (`escuela`). Todos los modelos están en `models.py`, todos los serializers en `serializers.py`, todas las vistas en `views.py`.

**No hay separación por módulo.** Es un monolito dentro de Django. Esto es intencional: la base de datos es externa (MySQL, `managed = False` en todos los modelos) y el esquema no es gestionado por Django.

### 3.2 Configuración clave en settings.py

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'sistema_escolar',
        'USER': 'root',
        'PASSWORD': 'admin1234',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS
CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

# JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
}
```

### 3.3 Modelos (`models.py`)

**Todos los modelos tienen `managed = False`** porque la base de datos preexiste y Django no debe crear/modificar tablas.

#### Tabla de usuarios y roles

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `Usuario` | `usuarios` | Usuario del sistema con contraseña hasheada. No tiene email. |
| `Rol` | `roles` | Roles disponibles: `admin`, `director`, `docente`, `preceptor`, `alumno`, `familia` |
| `UsuarioRol` | `usuario_roles` | Many-to-many entre usuarios y roles |

#### Personas (cada una vinculada a un Usuario via OneToOneField)

| Modelo | Tabla | Campos principales |
|--------|-------|-------------------|
| `Directivo` | `directivos` | nombre, apellido, dni, telefono, cargo |
| `Docente` | `docentes` | nombre, apellido, dni, correo, telefono |
| `Preceptor` | `preceptores` | nombre, apellido, dni, correo, telefono |
| `Alumno` | `alumnos` | nombre, apellido, dni, fecha_nacimiento, direccion, telefono, procedencia |
| `PadreTutor` | `padres_tutores` | nombre, apellido, dni, telefono, direccion |

**Regla importante:** No todos los perfiles tienen los mismos campos:
- `correo` existe solo en Docente y Preceptor (NO en Alumno, PadreTutor, Directivo).
- `fecha_nacimiento` existe solo en Alumno.
- `direccion` existe solo en Alumno y PadreTutor.

#### Estructura académica

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `CicloLectivo` | `ciclos_lectivos` | Años lectivos (ej: 2024, 2025) |
| `Curso` | `cursos` | Curso/división (ej: "4°1") vinculado a un CicloLectivo y opcionalmente a un Preceptor |
| `Materia` | `materias` | Materias (ej: "Matemática") |
| `CursoMateria` | `curso_materia` | Asignación de una materia a un curso con un docente |
| `Modulos` | `modulos` | Módulos horarios (hora inicio, hora fin) |
| `Horario` | `horarios` | Horario de curso_materia por día, módulo, aula |
| `PeriodoEvaluacion` | `periodos_evaluacion` | Períodos (1° cuatrimestre, 2° cuatrimestre) |

#### Calificaciones y Asistencias

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `Calificacion` | `calificaciones` | Nota de un alumno en una materia para un período. Tiene pre_nota (cualitativa: "Logrado"/"En proceso") y nota_numerica. |
| `EstadoAsistencia` | `estados_asistencia` | Posibles estados: Presente, Ausente, Tarde, etc. |
| `Asistencia` | `asistencias` | Registro de asistencia de un alumno en una materia para una fecha/hora |

#### Contenido pedagógico

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `Planificacion` | `planificaciones` | Proyectos pedagógicos con contenido, objetivos, salidas, fundamentación + PDF auto-generado |
| `DiagnosticoGrupal` | `diagnosticos_grupales` | Diagnóstico de grupo por curso y docente |
| `ActividadDocente` | `actividades_docentes` | Actividades/ejercicios subidos por docente con archivos adjuntos |
| `DdjjDocente` | `ddjj_docente` | Declaración Jurada del docente (archivo PDF subido) |

#### Comunicación

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `Comunicado` | `comunicados` | Comunicados con título, cuerpo, fecha |
| `ComunicadoAlcance` | `comunicado_alcance` | Alcance del comunicado (ciclo, curso, división, materia) |
| `ComunicadoArchivo` | `comunicado_archivo` | Archivos adjuntos al comunicado |
| `Notificacion` | `notificaciones` | Notificaciones internas por usuario |

#### Actas

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `TipoActa` | `tipos_acta` | Tipos de acta (ej: "Acta de Examen") |
| `Acta` | `actas` | Acta con título, descripción, archivo adjunto |
| `ActaAlumno` | `acta_alumno` | Relación acta-alumno |
| `ActaCurso` | `acta_curso` | Relación acta-curso |
| `ActaDocente` | `acta_docente` | Relación acta-docente |

#### Auditoría

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `TipoAccion` | `tipos_accion` | Tipos de acción para historial |
| `HistorialCambio` | `historial_cambios` | Registro de cambios en el sistema |

### 3.4 Serializers (`serializers.py`)

El archivo tiene 1540 líneas con TODOS los serializers. Patrón general:

```python
class ModeloSerializer(serializers.ModelSerializer):
    campo_extra = serializers.SerializerMethodField()

    class Meta:
        model = Modelo
        fields = '__all__'  # o lista explícita
```

**Casos especiales:**

- `UsuarioSerializer` (179): Expone los roles via `SerializerMethodField`. Incluye campos write-only para crear/editar Directivo desde el mismo endpoint (`nombre`, `apellido`, `dni`, `telefono`, `cargo`). Los campos de Directivo se leen como `directivo_nombre`, `directivo_apellido`, etc.
- `PreceptorSerializer` (363): Expone `usuario` (username) via `source='id_usuario.usuario'`. Incluye `cursos_ids` write-only y `cursos_asignados` read-only.
- `DocenteSerializer` (768): Similar a Preceptor, expone usuario y asignaciones.
- `AlumnoSerializer` (941): Expone `usuario`, `curso_nombre` (del curso relacionado), `tutor_nombre`.
- `ComunicadoSerializer` (1391): Incluye alcances y archivos anidados (read-only).
- `PlanificacionSerializer` (1497): Básico, incluye `docente_nombre` como SerializerMethodField.

### 3.5 Views (`views.py`)

El archivo tiene 1881 líneas. Contiene:

#### Funciones regulares (no ViewSets)

| Función | Ruta | Propósito |
|---------|------|-----------|
| `login_view` | `POST /api/login/` | Autentica usuario, verifica estado, devuelve JWT |
| `me_view` | `GET /api/me/` | Devuelve info del usuario autenticado |
| `upload_file` | `POST /api/upload/` | Subida genérica de archivos |

#### Funciones helper

| Función | Propósito |
|---------|-----------|
| `_usuario_context(request)` | Obtiene contexto del usuario autenticado (username, roles, perfil) |
| `_preceptor_actual(request)` | Obtiene el preceptor vinculado al usuario actual |

#### ViewSets principales

| ViewSet | Endpoint | Propósito |
|---------|----------|-----------|
| `UsuarioViewSet` | `/api/usuarios/` | CRUD de usuarios + roles |
| `AlumnoViewSet` | `/api/alumnos/` | CRUD de alumnos |
| `DocenteViewSet` | `/api/docentes/` | CRUD de docentes |
| `PreceptorViewSet` | `/api/preceptores/` | CRUD de preceptores |
| `DirectivoViewSet` | `/api/directivos/` | CRUD de directivos |
| `PadreTutorViewSet` | `/api/padres-tutores/` | CRUD de padres/tutores |
| `CursoViewSet` | `/api/cursos/` | CRUD de cursos |
| `MateriaViewSet` | `/api/materias/` | CRUD de materias |
| `CursoMateriaViewSet` | `/api/curso-materia/` | CRUD de asignaciones |
| `CalificacionViewSet` | `/api/calificaciones/` | CRUD de calificaciones |
| `AsistenciaViewSet` | `/api/asistencias/` | CRUD de asistencias |
| `ActaViewSet` | `/api/actas/` | CRUD de actas |
| `ComunicadoViewSet` | `/api/comunicados/` | CRUD de comunicados con alcances |
| `PlanificacionViewSet` | `/api/planificaciones/` | CRUD de planificaciones + generación PDF |
| `DiagnosticoGrupalViewSet` | `/api/diagnosticos-grupales/` | CRUD de diagnósticos |
| `NotificacionViewSet` | `/api/notificaciones/` | CRUD de notificaciones |
| `HorarioViewSet` | `/api/horarios/` | CRUD de horarios |
| `DdjjDocenteViewSet` | `/api/ddjj-docente/` | CRUD de DDJJ + subida/descarga de archivos |
| `ActividadDocenteViewSet` | `/api/actividades-docente/` | CRUD de actividades + archivos adjuntos |
| `IntensificacionAcademicaViewSet` | `/api/intensificaciones-academicas/` | CRUD de intensificaciones; `create` puede resolver/crear el `HistorialAcademico` a partir de `id_alumno + id_curso_materia + anio_rendicion` cuando el historial del año activo aún no existe |

### 3.6 Permisos (`permissions.py`)

```python
class IsAdminOrDirectorForWrite(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        roles = get_roles_for_usuario(username)
        return 'admin' in roles or 'director' in roles
```

Este permiso permite lectura a cualquier usuario autenticado, pero restringe escritura solo a Admin/Director. Se usa en ViewSets de estructura como Cursos, Materias, etc.

La mayoría de los ViewSets NO tienen permisos personalizados y usan el default `IsAuthenticated`.

### 3.7 Autenticación

Ver sección [6. Flujo de autenticación](#6-flujo-de-autenticación).

### 3.8 Rutas (`urls.py`)

```python
router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'alumnos', views.AlumnoViewSet)
router.register(r'docentes', views.DocenteViewSet)
router.register(r'preceptores', views.PreceptorViewSet)
router.register(r'directivos', views.DirectivoViewSet)
router.register(r'padres-tutores', views.PadreTutorViewSet)
router.register(r'cursos', views.CursoViewSet)
router.register(r'materias', views.MateriaViewSet)
router.register(r'curso-materia', views.CursoMateriaViewSet)
router.register(r'horarios', views.HorarioViewSet)
router.register(r'calificaciones', views.CalificacionViewSet)
router.register(r'asistencias', views.AsistenciaViewSet)
router.register(r'actas', views.ActaViewSet)
router.register(r'comunicados', views.ComunicadoViewSet)
router.register(r'planificaciones', views.PlanificacionViewSet)
router.register(r'diagnosticos-grupales', views.DiagnosticoGrupalViewSet)
router.register(r'notificaciones', views.NotificacionViewSet)
router.register(r'ddjj-docente', views.DdjjDocenteViewSet)
router.register(r'actividades-docente', views.ActividadDocenteViewSet)
# ... y más

urlpatterns = [
    path('login/', views.login_view),
    path('me/', views.me_view),
    path('upload/', views.upload_file),
    path('', include(router.urls)),
]
```

**Convención de naming:**
- Plural, kebab-case: `alumnos`, `curso-materia`, `padres-tutores`
- `login` y `me` son excepciones (funciones, no ViewSets)
- `upload` es endpoint genérico de archivos

### 3.9 Generación de PDF

La generación de PDF se realiza exclusivamente en `PlanificacionViewSet._generar_pdf()` usando **ReportLab**. Ver [sección 15](#15-módulo-proyectos-ex-planificaciones) para detalles completos.

También existe generación de PDF del lado del frontend en `frontend/src/utils/boletin.js` para el boletín de calificaciones (usando `window.print()` y generación HTML a PDF).

### 3.10 Manejo de archivos

Hay dos estrategias de manejo de archivos:

1. **FileField de Django** (DdjjDocente, ActividadDocente): El archivo se sube directamente al campo FileField, Django lo guarda en `MEDIA_ROOT/{upload_to}` y la URL se genera automáticamente.

2. **CharField con ruta manual** (Planificacion, Acta, ComunicadoArchivo): La ruta del archivo se guarda como string en un CharField. La URL se construye manualmente concatenando `MEDIA_URL` + ruta.

3. **Endpoint genérico** (`upload_file`): Recibe archivo + carpeta y guarda en `MEDIA_ROOT/{carpeta}/`. Útil para subidas rápidas sin modelo asociado.

---

## 4. Frontend

### 4.1 Organización

El frontend es una SPA de React 18 con Vite. No usa React Router (el enrutamiento se hace por estado y roles en `App.jsx`). No usa librerías de UI externas (todo el CSS es propio en `index.css`).

```
frontend/src/
├── main.jsx                       # Entrypoint: renderiza AuthProvider + App
├── App.jsx                        # Router por roles (switch sobre user.role)
├── index.css                      # TODO el CSS del sistema
├── context/
│   ├── AuthContext.jsx             # Autenticación global
│   └── DataContext.jsx             # Datos globales (cargados una vez)
├── services/
│   └── api.js                     # Cliente Axios con TODOS los endpoints
├── utils/
│   ├── dni.js                     # cleanDNI, formatDNI, normalizeDNI
│   ├── orientacion.js             # parseCurso, orientacionDeCurso, cursoConOrientacion
│   └── boletin.js                 # boletinHTML, exportarBoletinPDF
└── components/
    ├── Login/                     # Pantalla de login
    ├── Administracion/            # Panel de Admin/Director
    ├── Alumno/                    # Panel de Alumno
    ├── Familia/                   # Panel de Familia/Tutor
    ├── Preceptores/               # Panel de Preceptor
    ├── Profesores/                # Panel de Docente
    └── Shared/                    # Componentes reutilizables
```

### 4.2 App.jsx — Enrutamiento por roles

```jsx
function Dashboard({ user, logout }) {
  const role = user.role || user.roles?.[0] || '';
  switch (role) {
    case 'preceptor':  return <PreceptorDashboard user={user} onLogout={logout} />;
    case 'admin':
    case 'director':   return <AdminDashboard user={user} onLogout={logout} />;
    case 'docente':    return <PanelProfesores user={user} onLogout={logout} />;
    case 'familia':    return <FamiliaDashboard user={user} onLogout={logout} />;
    case 'alumno':     return <AlumnoDashboard user={user} onLogout={logout} />;
    default:           return <div>Usuario sin panel asignado</div>;
  }
}
```

El primer rol de la lista `user.roles` determina qué dashboard se renderiza. El `DataProvider` envuelve a `Dashboard` para que todos los paneles tengan acceso a los datos globales.

### 4.3 main.jsx — Entrypoint

```jsx
<React.StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
</React.StrictMode>
```

### 4.4 index.css — CSS Global

**NO usa Tailwind, Bootstrap, ni librerías CSS.** El CSS es 100% propio. Usa:

- **Variables CSS** en `:root` para colores, bordes, sombras.
- **Clases de layout**: `.dashboard-layout`, `.main-content`, `.sidebar`, `.view-section`.
- **Componentes**: `.card`, `.card-header-flex`, `.badge`, `.badge-presente`, `.badge-ausente`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`.
- **Formularios**: `.form-group-filter`, `.filter-row`, `.preceptor-form-row`, `.preceptor-form-row--two`.
- **Tablas**: `.table-responsive`, `.table-download-btn`.
- **Sidebar**: `.sidebar`, `.sidebar-menu`, `.sidebar-menu-btn`, `.sidebar-brand`, `.sidebar-logout-btn`.
- **Materias grid**: `.materias-wrapper`, `.materias-grid`, `.materia-btn`, `.active-materia`.

### 4.5 Patrón de dashboard

Cada rol tiene un dashboard con:
1. **Sidebar** (izquierda): menú de navegación con items (definidos inline o en `sidebarMenu.js`)
2. **Header** (superior): bienvenida + badge de rol
3. **Contenido**: vista activa según estado `view`

Todas las clases CSS son consistentes entre dashboards. Los sidebars comparten la misma estructura HTML.

### 4.6 Patrón de componentes de perfil ("Mi Perfil")

Recientemente se agregó la sección "Mi Perfil" a todos los roles. El patrón es:

1. **Panel{NombreRol}.jsx**: Componente que recibe el perfil del usuario como prop (`miDocente`, `miPreceptor`, `miAlumno`, `miTutor`, `miDirectivo`).
2. Muestra datos personales en grid `repeat(auto-fit, minmax(240px, 1fr))` con fondo `#f8f9fa` y borde izquierdo `var(--primary-color)`.
3. Muestra una tabla con información contextual (asignaciones para docente, cursos para preceptor, hijos para tutor, etc.).
4. Se renderiza desde el dashboard cuando `view === 'perfil'`.

### 4.7 Componentes Shared (reutilizables)

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| `ActividadesView` | `Shared/ActividadesView.jsx` | Vista de actividades para alumno/familia |
| `AsistenciaMateriaDetalle` | `Shared/AsistenciaMateriaDetalle.jsx` | Detalle de asistencia por materia |
| `ComunicadosView` | `Shared/ComunicadosView.jsx` | Vista de comunicados (multi-rol) |
| `DiagnosticosView` | `Shared/DiagnosticosView.jsx` | Vista de diagnósticos grupales (multi-rol) |
| `Notificaciones` | `Notificaciones.jsx` | Campana de notificaciones |

### 4.8 Comunicación con el backend

Toda la comunicación usa Axios (configurado en `api.js`):
- Base URL: `http://localhost:8000/api`
- Auth: JWT en header `Authorization: Bearer {token}` (interceptor automático)
- Refresh automático de token expirado (interceptor de respuesta)
- Cada función exportada es `async` y retorna `response.data`

---

## 5. Sistema de usuarios

### 5.1 Administrador (rol: `admin`) y Director (`director`)

**Qué puede hacer:**
- CRUD completo de alumnos, docentes, preceptores, administradores.
- Gestión de cursos, materias, asignación curso-materia-docente.
- Gestión de horarios, calificaciones, asistencias.
- Creación de comunicados, actas, notificaciones.
- El rol `director` puede además gestionar otros administradores.

**Panel:** `AdminDashboard.jsx`
**Sidebar:** `sidebarMenu.js` (12 items, filtrados por `directorOnly`)
**Componentes específicos:**
- `alumnos.jsx` — CRUD de alumnos
- `docentes.jsx` — CRUD de docentes
- `preceptores.jsx` — CRUD de preceptores
- `administradores.jsx` — CRUD de admins (solo director)
- `cursos.jsx` — Gestión de cursos
- `materias.jsx` — Gestión de materias
- `asignacionMaterias.jsx` — Asignación docente-materia-curso
- `horarios.jsx` — Gestión de horarios
- `asistencias.jsx` — Gestión de asistencias
- `notas.jsx` — Gestión de calificaciones
- `comunicados.jsx` — Gestión de comunicados
- `PanelAdmin.jsx` — Perfil del administrador

**Datos de perfil:** Se almacenan en la tabla `directivos`. Se obtienen via `GET /api/directivos/`.

### 5.2 Docente (rol: `docente`)

**Qué puede hacer:**
- Ver su perfil con datos personales y DDJJ.
- Subir/ver Declaración Jurada (DDJJ).
- Ver alumnos de sus cursos/materias.
- Cargar calificaciones (pre-nota cualitativa + nota numérica).
- Registrar asistencias.
- Crear/editar/eliminar proyectos pedagógicos (con generación automática de PDF).
- Crear actividades con archivos adjuntos.
- Ver/enviar comunicados.
- Ver diagnosticos grupales.

**Panel:** `PanelProfesores.jsx`
**Sidebar:** `Sidebar.jsx` con `sidebarMenu.js` (items: docente, alumnos, info, planif, actividades, asistencia, comunicados, notificaciones)
**Componentes específicos:**
- `PanelDocente.jsx` — Perfil + DDJJ + asignaciones
- `PanelAlumnos.jsx` — Lista de alumnos con calificaciones
- `PanelInfo.jsx` — Diagnóstico grupal
- `PanelPlanif.jsx` — Proyectos (CRUD + PDF)
- `PanelActividades.jsx` — Actividades con archivos
- `PanelAsistencia.jsx` — Registro de asistencias

**Flujo de selección:** El docente selecciona un curso y una materia (sus asignaciones), y luego accede a las funcionalidades de ese curso/materia específico.

### 5.3 Preceptor (rol: `preceptor`)

**Qué puede hacer:**
- Ver su perfil con datos personales y cursos asignados.
- Gestionar alumnos.
- Registrar asistencias (por día o por materia).
- Cargar/editar calificaciones.
- Gestionar actas.
- Ver docentes, horarios, comunicados, notificaciones.

**Panel:** `PreceptorDashboard.jsx`
**Sidebar:** `sidebar.jsx` con `sidebarMenu.js` (items: perfil, alumnos, docentes, horarios, asistencias, notas, actas, comunicados, notificaciones)
**Componentes específicos:**
- `PanelPreceptor.jsx` — Perfil del preceptor
- `alumnos.jsx` — Gestión de alumnos
- `asistencias.jsx` — Registro de asistencias
- `notas.jsx` — Carga de calificaciones
- `actas.jsx` — Gestión de actas
- `docentes.jsx` — Lista de docentes

### 5.4 Alumno (rol: `alumno`)

**Qué puede hacer:**
- Ver su perfil con datos personales y curso.
- Ver calificaciones (solo lectura).
- Ver asistencias (solo lectura, resumen por día y detalle por materia).
- Ver actividades publicadas por docentes.
- Ver horarios de su curso.
- Ver comunicados y notificaciones.
- Descargar boletín PDF.

**Panel:** `AlumnoDashboard.jsx`
**Sidebar:** Inline en el JSX (7 items: perfil, calificaciones, asistencias, actividades, horarios, comunicados, notificaciones)
**Componentes específicos:**
- `PanelAlumno.jsx` — Perfil del alumno (nombre, DNI, teléfono, dirección, fecha nacimiento, usuario, curso)
- Las calificaciones, asistencias y horarios se renderizan directamente en `AlumnoDashboard.jsx`

### 5.5 Familia / Tutor (rol: `familia`)

**Qué puede hacer:**
- Ver su perfil con datos personales e hijos vinculados.
- Seleccionar un hijo y ver su información académica.
- Ver calificaciones del hijo (solo lectura).
- Ver asistencias del hijo (solo lectura).
- Ver actas del hijo.
- Ver horarios del hijo.
- Ver comunicados y notificaciones.

**Panel:** `FamiliaDashboard.jsx`
**Sidebar:** `sidebar/sidebar.jsx` con menú inline (8 items: perfil, resumen, calificaciones, asistencias, actas, horarios, actividades, comunicados, notificaciones)
**Componentes específicos:**
- `PanelFamilia.jsx` — Perfil del tutor (nombre, DNI, teléfono, dirección, usuario, hijos vinculados)
- `Resumen.jsx` — Resumen del hijo
- `Calificaciones.jsx` — Calificaciones del hijo
- `Asistencias.jsx` — Asistencias del hijo
- `Actas.jsx` — Actas del hijo

---

## 6. Flujo de autenticación

### 6.1 Paso a paso

1. **Usuario ingresa credenciales** en `Login.jsx`.
2. **`AuthContext.login(username, password)`** llama a `api.login()` que hace `POST /api/login/`.
3. **Backend** (`login_view`):
   - Busca `Usuario` por username.
   - Verifica que `usuario.estado == True`.
   - Usa `authenticate()` (Django) que invoca `UsuarioBackend.authenticate()`.
   - `UsuarioBackend` busca en tabla `usuarios`, verifica password con `check_password()`.
   - Si OK, obtiene roles via `get_roles_for_usuario()`.
   - Genera JWT access + refresh tokens con `RefreshToken.for_user()`.
   - Retorna `{ access, refresh, id_usuario, usuario, roles }`.
4. **Frontend** guarda tokens en `localStorage`, setea `user` en `AuthContext`.
5. **`App.jsx`** detecta `user`, renderiza `DataProvider` + `Dashboard` correspondiente al rol.
6. **En cada carga de página**, `AuthContext` verifica si hay `access_token` en localStorage.
   - Si existe, llama a `GET /api/me/` para validar el token y obtener datos del usuario.
   - Si falla (token expirado), intenta refresh automático via interceptor de Axios.

### 6.2 Refresh de tokens

El interceptor de Axios en `api.js` detecta errores 401 y automáticamente intenta refrescar el token con `POST /api/token/refresh/`. Si falla, limpia localStorage y recarga la página.

### 6.3 AuthContext

```jsx
// Estado
{ user, loading, login, logout }

// user = { id, username, roles: [...], role: roles[0] }
```

El `user` se almacena en `AuthContext` y se pasa como prop a cada dashboard. El `user.id` corresponde a `id_usuario` en la tabla `usuarios`.

---

## 7. Flujo de datos

### 7.1 DataContext — Carga global

`DataProvider` en `DataContext.jsx` se monta cuando hay un usuario autenticado. En `fetchData()` (llamado en `useEffect`):

```
fetchData()
  ├── Promise.all([...])  ← 26 llamadas paralelas a la API
  │   ├── getAlumnos()
  │   ├── getDocentes()
  │   ├── getPreceptores()
  │   ├── getCursos()
  │   ├── getMaterias()
  │   ├── getCursoMateria()
  │   ├── getCalificaciones()
  │   ├── getAsistencias()
  │   ├── getActas()
  │   ├── getActaAlumno()
  │   ├── getActaCurso()
  │   ├── getActaDocente()
  │   ├── getHorarios()
  │   ├── getModulos()
  │   ├── getCiclosLectivos()
  │   ├── getEstadosAsistencia()
  │   ├── getNotificaciones()
  │   ├── getInscripciones()
  │   ├── getPadresTutores()
  │   ├── getPeriodos()
  │   ├── getComunicados()
  │   ├── getDiagnosticosGrupales()
  │   ├── getPlanificaciones()
  │   └── (más, con .catch(() => []))
  │
  ├── Procesa cada array (mapea, filtra, normaliza)
  │   ├── alumnos: añade curso_nombre, ciclo_anio
  │   ├── docentes: agrupa asignaciones por curso-materia
  │   ├── preceptores: añade cursos_asignados
  │   ├── horarios: enriquece con curso_nombre, materia_nombre, etc.
  │   ├── calificaciones: agrupa por alumno+materia en notasDocenteAdmin
  │   ├── actas: enriquece con titulo, descripcion, autor
  │   ├── comunicados: parsea alcances, enriquece con curso/materia
  │   └── etc.
  │
  └── setData({...})  ← almacena todo en el estado del context
```

**Todas las llamadas tienen `.catch(() => [])`** para que si un endpoint falla, no se caiga toda la carga.

### 7.2 Flujo de escritura (ej: crear calificación)

```
Frontend (notas.jsx)
  ↓
api.createCalificacion(payload)
  ↓  POST /api/calificaciones/  + JWT en header
Backend (CalificacionViewSet.create())
  ↓
Serializer (validate + save)
  ↓
Modelo (Calificacion.objects.create())
  ↓
Base de datos (INSERT INTO calificaciones)
  ↓  (retorno)
Response JSON con serializador
  ↓
Frontend actualiza estado local o refresca DataContext
```

### 7.3 Carga diferida (fuera de DataContext)

Algunos componentes cargan datos por fuera de DataContext:
- `administradores.jsx` usa `getUsuarios()` directamente (no hay admins en DataContext).
- `PanelAdmin.jsx` usa `getDirectivos()` directamente (no hay directivos en DataContext).
- `PanelPlanif.jsx` usa `getPlanificaciones()` con filtro `curso_materia` (las planificaciones en DataContext son el listado general).

---

## 8. Base de datos

### 8.1 Tablas principales y relaciones

```
usuarios ──── usuario_roles ──── roles
  │
  ├─── directivos (1:1)   ← Admin/Director
  ├─── docentes (1:1)
  ├─── preceptores (1:1)
  ├─── alumnos (1:1)
  └─── padres_tutores (1:1)
```

**Cursos y estructura académica:**
```
ciclos_lectivos
  └─── cursos (FK a ciclo)
         ├─── preceptores (FK a preceptor, tutor del curso)
         └─── curso_materia
                ├─── materias (FK a materia)
                └─── docentes (FK a docente)
```

**Alumnos:**
```
alumnos ──── cursos (FK a curso)
  └─── padres_tutores (FK a padre/tutor)
```

**Calificaciones:**
```
calificaciones
  ├─── alumnos (FK)
  ├─── curso_materia (FK)
  ├─── docentes (FK)
  └─── periodos_evaluacion (FK)
```

**Asistencias:**
```
asistencias
  ├─── alumnos (FK)
  ├─── curso_materia (FK)
  ├─── usuarios (FK — quien cargó)
  └─── estados_asistencia (FK)
```

**Horarios:**
```
horarios
  ├─── curso_materia (FK)
  └─── modulos (FK)
```

### 8.2 Prioridad de la BD real sobre el SQL de referencia

**🔥 REGLA ABSOLUTA:** El archivo `estructura base de datos/sistema_escolar.sql` es solo una referencia visual. La base de datos MySQL real es la ÚNICA fuente de verdad.

- Nunca asumir que un campo existe porque aparece en el SQL de referencia.
- Antes de modificar un modelo Django, verificar la estructura real de MySQL con `DESCRIBE <tabla>;` o `SHOW COLUMNS FROM <tabla>;`.
- Si hay discrepancia entre el modelo Django y la BD real, la BD real tiene razón. Actualizar el modelo Django.
- No crear migraciones ni modificar el esquema desde Django (`managed = False` en todos los modelos).

### 8.3 Propósito de cada tabla

| Tabla | Propósito |
|-------|-----------|
| `usuarios` | Credenciales de acceso al sistema (usuario + contraseña hasheada + estado) |
| `roles` | Catálogo de roles disponibles |
| `usuario_roles` | Asignación de roles a usuarios (un usuario puede tener múltiples roles) |
| `directivos` | Datos personales de administradores/directores |
| `docentes` | Datos personales de docentes (tiene `correo`) |
| `preceptores` | Datos personales de preceptores (tiene `correo`) |
| `alumnos` | Datos personales de alumnos (tiene `fecha_nacimiento`, `direccion`, `procedencia`) |
| `padres_tutores` | Datos personales de padres/tutores (tiene `direccion`) |
| `ciclos_lectivos` | Años lectivos del sistema |
| `cursos` | Cursos/divisiones (ej: "4°1") con orientación opcional |
| `materias` | Materias del plan de estudios |
| `curso_materia` | Asignación de materia a curso con un docente específico |
| `modulos` | Bloques horarios (módulos de clase) |
| `horarios` | Horarios semanales por curso_materia |
| `periodos_evaluacion` | Períodos de evaluación (1° cuatrimestre, 2° cuatrimestre) |
| `calificaciones` | Notas de alumnos (pre-nota cualitativa + nota numérica + diagnóstico) |
| `estados_asistencia` | Catálogo de estados de asistencia |
| `asistencias` | Registro diario de asistencias por alumno y materia |
| `tipos_acta` | Tipos de acta |
| `actas` | Actas con título, descripción y archivo |
| `acta_alumno` | Relación N:M entre actas y alumnos |
| `acta_curso` | Relación N:M entre actas y cursos |
| `acta_docente` | Relación N:M entre actas y docentes |
| `comunicados` | Comunicados con título y cuerpo |
| `comunicado_alcance` | Alcance de cada comunicado (a qué niveles aplica) |
| `comunicado_archivo` | Archivos adjuntos a comunicados |
| `planificaciones` | Proyectos pedagógicos con campos de texto + PDF auto-generado |
| `diagnosticos_grupales` | Diagnósticos pedagógicos por curso |
| `ddjj_docente` | Declaraciones Juradas de docentes |
| `actividades_docentes` | Actividades/ejercicios creados por docentes |
| `notificaciones` | Notificaciones internas del sistema |
| `historial_cambios` | Auditoría de cambios (no implementado en frontend) |
| `inscripciones_materias` | Inscripciones de alumnos a materias |

---

## 9. Componentes importantes

### 9.1 DataContext (`DataContext.jsx`)

Es el componente más grande y complejo del frontend (702 líneas). Ver [sección 10](#10-context-api).

### 9.1 Tabla de Componentes por Dashboard

> **Fuente:** Información integrada de las auditorías de Frontend y Estado Global.

Este proyecto tiene **ninguna librería de routing** (`react-router` no está en `package.json`). En su lugar:

- **6 componentes Dashboard** cada uno con una variable de estado `const [view, setView] = useState('perfil')`
- **6 configuraciones de menú sidebar** (una por rol) que mapean strings `item.id` a llamadas `setView()`
- **Statements switch** en cada dashboard renderizan diferentes componentes según la cadena `view`
- **Sin sincronización de URL** — la barra de dirección del navegador siempre muestra `/`

| Dashboard | Archivo | Variable de Estado de Vista | Cantidad de Cases |
|-----------|---------|--------------------------|-------------------|
| Admin | `AdminDashboard.jsx:25` | `view` | 18 cases |
| Preceptor | `PreceptorDashboard.jsx:30` | `view` | 12 cases |
| Docente | `PanelProfesores.jsx:25` | `seccionActiva` | 8+ cases |
| Familia | `FamiliaDashboard.jsx:22` | `view` | 8 cases |
| Alumno | `AlumnoDashboard.jsx:30` | `view` | 8 cases |
| Jefe Preceptores | `JefePreceptorDashboard.jsx:27` | `view` | 12 cases |

### 9.2 PanelPlanif.jsx (Proyectos)

Ver [sección 15](#15-módulo-proyectos-ex-planificaciones).

### 9.3 PanelDocente.jsx (Perfil del Docente)

Componente que muestra el perfil del docente autenticado. Características:
- Recibe `miDocente` como prop.
- Muestra datos en grid responsive con fondo `#f8f9fa` y borde `--primary-color`.
- Incluye sección de DDJJ (subida de archivo, visualización, estado).
- Incluye tabla de materias y cursos asignados.
- Usa `formatDNI` de `utils/dni.js`.
- Usa `cursoMateria` y `cursosObj` de `useData()` para la tabla de asignaciones.

**Este componente sirvió como plantilla para todos los perfiles (Preceptor, Alumno, Familia, Admin).**

### 9.4 Administradores (`administradores.jsx`)

Componente de gestión de usuarios administradores (solo visible para Directores). Características:
- Carga usuarios via `getUsuarios()`.
- Filtra solo roles `admin` o `director`.
- CRUD completo con modal para crear/editar.
- Incluye manejo de habilitación/deshabilitación programada.
- Borrado lógico (deshabilita, no elimina realmente).

---

## 10. Context API

### 10.1 AuthContext

**Archivo:** `context/AuthContext.jsx` (48 líneas)

**Estado:**
```js
{ user, loading, login, logout }
```

**user:**
```js
{ id: id_usuario, username, roles: [...], role: roles[0] }
```

**Funcionamiento:**
- Cuando hay `access_token` en localStorage, al montarse llama a `getMe()`.
- `login()` llama a `apiLogin()` y setea el user.
- `logout()` limpia localStorage y setea user a null.
- El `loading` se usa en `App.jsx` para mostrar pantalla de carga hasta que se verifique el token.

### 10.2 DataContext

**Archivo:** `context/DataContext.jsx` (702 líneas)

**Estado:** Un objeto `data` con TODOS los arrays de datos del sistema (ver sección 7.1).

**Cómo funciona:**
1. `DataProvider` se monta y llama a `fetchData()` en un `useEffect`.
2. `fetchData()` hace ~26 llamadas paralelas a la API via `Promise.all()`.
3. Cada resultado se procesa (mapea, filtra, normaliza).
4. Todo se guarda en `setData({...})`.
5. `useData()` hook expone `{ loading, error, ...data }`.

**useData() hook:**
```js
function useData() {
  const ctx = useContext(DataContext);
  if (ctx.loading || !ctx.data) {
    return { loading: true, error, ...valoresPorDefecto };
  }
  return { loading: false, error: null, ...ctx.data };
}
```

**Valores por defecto:** Cuando `loading === true`, retorna arrays vacíos y funciones dummy para evitar errores en componentes hijos.

**refreshData:** La función `fetchData` se asigna a `data.refreshData` después de setear los datos, permitiendo que cualquier componente la llame para recargar.

**Helper functions expuestas:**
- `getAlumnoById(id)` — Busca alumno por ID
- `getAlumnosByCurso(curso)` — Filtra alumnos por curso
- `getMateriasByCurso(curso)` — Materias de un curso
- `getHorarioClase(materia)` — Horario de una materia
- `getActasByAlumnoId(id)` — Actas de un alumno
- `getHijoLabel(hijo)` — Label para selector de hijos (familia)
- `nombreCompleto(alumno)` — Apellido, Nombre
- `nombreCorto(alumno)` — Nombre Apellido

---

## 11. Servicios (api.js)

### 11.1 Organización

**Archivo:** `services/api.js` (519 líneas)

Todas las funciones siguen el mismo patrón:

```js
export async function getRecurso(params) {
  const { data } = await api.get('/recurso/', { params });
  return data;
}

export async function createRecurso(payload) {
  const { data } = await api.post('/recurso/', payload);
  return data;
}
```

### 11.2 Funciones por categoría

**Autenticación:**
`login`, `logout`, `getMe`

**CRUD de personas:**
`getAlumnos`, `createAlumno`, `updateAlumno`, `deleteAlumno`
`getDocentes`, `createDocente`, `updateDocente`, `deleteDocente`
`getPreceptores`, `createPreceptor`, `updatePreceptor`, `deletePreceptor`
`getDirectivos`
`getPadresTutores`
`getUsuarios`, `createUsuario`, `updateUsuario`, `deleteUsuario`

**Estructura académica:**
`getCursos`, `createCurso`, `updateCurso`
`getMaterias`, `createMateria`, `updateMateria`
`getCursoMateria`, `createCursoMateria`, `updateCursoMateria`, `deleteCursoMateria`
`getCiclosLectivos`
`getModulos`
`getPeriodos`
`getInscripciones`

**Horarios:**
`getHorarios`, `createHorario`, `updateHorario`, `deleteHorario`
`getHorariosEspeciales`, `createHorarioEspecial`, `updateHorarioEspecial`, `deleteHorarioEspecial`

**Calificaciones:**
`getCalificaciones`, `createCalificacion`, `updateCalificacion`

**Asistencias:**
`getAsistencias`, `createAsistencia`, `updateAsistencia`
`getEstadosAsistencia`
`getAsistenciasPreceptorMateria`
`patchJustificar`

**Actas:**
`getActas`, `createActa`, `updateActa`, `deleteActa`
`getActaAlumno`, `createActaAlumno`, `updateActaAlumno`, `deleteActaAlumno`
`getActaCurso`, `createActaCurso`, `deleteActaCurso`
`getActaDocente`, `createActaDocente`, `updateActaDocente`, `deleteActaDocente`
`getTiposActa`

**Comunicados:**
`getComunicados`, `createComunicado`, `deleteComunicado`
`createComunicadoArchivo`

**Planificaciones:**
`getPlanificaciones`, `createPlanificacion`, `updatePlanificacion`, `deletePlanificacion`

**Diagnósticos:**
`getDiagnosticosGrupales`, `createDiagnosticoGrupal`, `deleteDiagnosticoGrupal`

**Docente específico:**
`getMiDdjjDocente`, `uploadMiDdjjDocente`, `deleteMiDdjjDocente`, `getDdjjDocenteArchivo`
`getActividades`, `createActividad`, `updateActividad`, `deleteActividad`, `deleteActividadArchivo`

**Generales:**
`getRoles`
`getNotificaciones`, `createNotificacion`
`getServerTime`
`getAsistenciasAlumnoDetalle`
`uploadFile`

### 11.3 Convenciones

- Cada función retorna `response.data` (Axios ya parsea el JSON).
- No hay manejo de errores en api.js (se deja al componente).
- Los parámetros de filtro se pasan como objeto `params`.
- Para archivos, se usa `FormData` sin header `Content-Type` (se elimina en interceptor).

---

## 12. Convenciones del proyecto

### 12.1 Backend

- **Un solo archivo por capa:** Todos los modelos en `models.py`, serializers en `serializers.py`, vistas en `views.py`.
- **managed = False** en todos los modelos (la BD es externa).
- **Naming:** Modelos en singular con mayúscula (`Usuario`, `CursoMateria`), tablas en snake_case plural (`usuarios`, `curso_materia`).
- **Campos FK:** Se usa `db_column='nombre_columna'` para mapear a la columna real en BD.
- **Serializers:** Usar `SerializerMethodField` para campos derivados. Usar `source='id_relacion.campo'` para acceder a campos de relaciones.
- **Viewsets:** Usar `select_related` en `queryset` para optimizar queries.
- **Permisos:** `IsAuthenticated` como default. Solo usar `IsAdminOrDirectorForWrite` cuando se necesita restricción específica.
- **Fechas:** `datetime.now()` (naive) para timestamps. No se usa `timezone.now()` consistentemente.

### 12.2 Frontend

- **Un solo CSS global** (`index.css`). No hay CSS modules ni styled-components.
- **Sin librerías UI:** Todo el diseño es manual con variables CSS.
- **Naming de componentes:** PascalCase (`PanelDocente`, `AlumnoDashboard`).
- **Naming de archivos:** camelCase para JSX (`panelDocente.jsx`), pero inconsistente (algunos en PascalCase).
- **Sidebar menus:** Preferir `sidebarMenu.js` con array exportado (Docente, Preceptor, Admin). Alumno y Familia tienen menú inline.
- **DataContext:** Para datos globales que se usan en múltiples componentes.
- **API calls:** Solo en `api.js`. Nunca hacer fetch directo en componentes.
- **Formateo:** `utils/dni.js` para DNI, `utils/orientacion.js` para orientación de cursos.
- **Manejo de errores:** Cada componente maneja sus errores localmente (catch en async).
- **Perfiles:** Cada panel de perfil sigue exactamente el mismo patrón visual que `PanelDocente.jsx` (grid de datos + tabla contextual).

### 12.3 CSS

- **Variables:** `--primary-color`, `--sidebar-bg`, `--sidebar-hover`, `--card-bg`, `--border-color`, `--text-light`, `--radius`, etc.
- **Clases compartidas:** `.card`, `.card-header-flex`, `.btn`, `.btn-primary`, `.btn-secondary`, `.badge`, `.form-group-filter`, `.table-responsive`, `.sidebar-menu-btn`.
- **Layout:** `.dashboard-layout` (flex con sidebar fija + main content). `.main-header` con flex entre título y avatar.
- **Grid de datos de perfil:** `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid var(--primary-color);`

---

## 13. Módulos implementados

### 13.1 Cursos

**Backend:** `CursoViewSet` → `GET /api/cursos/`
**Frontend:** `Administracion/cursos.jsx` (Admin), filtros en múltiples componentes
**Tablas:** `cursos`, `ciclos_lectivos`, `preceptores`
**Propósito:** Gestión de cursos por año lectivo, con orientación y preceptor asignado.

### 13.2 Materias

**Backend:** `MateriaViewSet` → `GET /api/materias/`
**Frontend:** `Administracion/materias.jsx` (Admin)
**Tabla:** `materias`
**Propósito:** Catálogo de materias del plan de estudios.

### 13.3 Calificaciones

**Backend:** `CalificacionViewSet` → `GET/POST/PATCH /api/calificaciones/`
**Frontend:** `Profesores/PanelAlumnos.jsx` (Docente), `Preceptores/notas.jsx` (Preceptor), `Alumno/AlumnoDashboard.jsx` (Alumno - solo lectura), `Familia/Calificaciones.jsx` (Familia - solo lectura)
**Tablas:** `calificaciones`, `alumnos`, `curso_materia`, `docentes`, `periodos_evaluacion`
**Propósito:** Registro de notas numéricas y cualitativas por alumno, materia y período.
**Particularidad:** Cada alumno tiene dos períodos de evaluación. Cada período tiene pre-nota (cualitativa: "Logrado"/"En proceso"/"No logrado") y nota numérica.

### 13.4 Asistencias

**Backend:** `AsistenciaViewSet` → `GET/POST/PATCH /api/asistencias/`
**Frontend:** `Profesores/PanelAsistencia.jsx` (Docente), `Preceptores/asistencias.jsx` (Preceptor), `Alumno/AlumnoDashboard.jsx` (Alumno - solo lectura), `Familia/Asistencias.jsx` (Familia - solo lectura), `Administracion/asistencias.jsx` (Admin)
**Tablas:** `asistencias`, `alumnos`, `curso_materia`, `usuarios`, `estados_asistencia`
**Propósito:** Registro diario de asistencia (Presente/Ausente/Tarde) por alumno.

### 13.5 Horarios

**Backend:** `HorarioViewSet` → `GET/POST/PATCH/DELETE /api/horarios/`
**Frontend:** `Administracion/horarios.jsx` (Admin), `Administracion/VistaHorarios.jsx` (vista compartida), `Preceptores/` (enlace al componente de Admin)
**Tablas:** `horarios`, `curso_materia`, `modulos`
**Propósito:** Gestión de horarios semanales por curso/materia.

### 13.6 Comunicados

**Backend:** `ComunicadoViewSet` → `GET/POST/DELETE /api/comunicados/`
**Frontend:** `Administracion/comunicados.jsx` (Admin), `Shared/ComunicadosView.jsx` (vista para todos los roles)
**Tablas:** `comunicados`, `comunicado_alcance`, `comunicado_archivo`, `cursos`, `materias`, `ciclos_lectivos`
**Propósito:** Sistema de comunicados con alcance configurable (general, por año, por curso, por división, por materia). Soporta múltiples archivos adjuntos.

### 13.7 Actas

**Backend:** `ActaViewSet`, `ActaAlumnoViewSet`, `ActaCursoViewSet`, `ActaDocenteViewSet`
**Frontend:** `Preceptores/actas.jsx`, `Familia/Actas.jsx`
**Tablas:** `actas`, `acta_alumno`, `acta_curso`, `acta_docente`, `tipos_acta`
**Propósito:** Gestión de actas (exámenes, reuniones) vinculadas a alumnos, cursos y/o docentes. Soporta archivo adjunto.

### 13.8 Diagnóstico grupal

**Backend:** `DiagnosticoGrupalViewSet` → `GET/POST/DELETE /api/diagnosticos-grupales/`
**Frontend:** `Shared/DiagnosticosView.jsx` (compartido por todos los roles)
**Tablas:** `diagnosticos_grupales`, `cursos`, `docentes`
**Propósito:** Diagnósticos pedagógicos grupales por curso y docente.

### 13.9 Actividades docentes

**Backend:** `ActividadDocenteViewSet` → `GET/POST/PATCH/DELETE /api/actividades-docente/`
**Frontend:** `Profesores/PanelActividades.jsx` (Docente), `Shared/ActividadesView.jsx` (Alumno/Familia)
**Tablas:** `actividades_docentes`, `actividad_docente_archivos`, `curso_materia`
**Propósito:** Actividades/ejercicios creados por docentes con múltiples archivos adjuntos. Los alumnos pueden verlos.

### 13.10 DDJJ (Declaración Jurada)

**Backend:** `DdjjDocenteViewSet` → `GET/POST/DELETE /api/ddjj-docente/` (sin PUT/PATCH)
**Frontend:** `Profesores/PanelDocente.jsx` (Docente)
**Tablas:** `ddjj_docente`, `docentes`
**Propósito:** Permite a docentes subir un archivo PDF de Declaración Jurada. No permite reemplazo (solo subir una vez). Admin/Director pueden ver todas.

### 13.11 Notificaciones

**Backend:** `NotificacionViewSet` → `GET/PATCH /api/notificaciones/`
**Frontend:** `Notificaciones.jsx` (componente compartido)
**Tabla:** `notificaciones`
**Propósito:** Notificaciones internas por usuario. Se pueden marcar como leídas.

### 13.12 Perfiles ("Mi Perfil")

Implementado para todos los roles. Cada perfil usa el mismo patrón visual (grid de datos + tabla contextual).

| Rol | Componente | Fuente de datos | Tabla contextual |
|-----|-----------|----------------|-----------------|
| Docente | `PanelDocente.jsx` | `useData().docentes` | Materias y Cursos Asignados |
| Preceptor | `PanelPreceptor.jsx` | `useData().preceptores` | Cursos Asignados |
| Alumno | `PanelAlumno.jsx` | `useData().alumnos` | Cursando |
| Familia | `PanelFamilia.jsx` | `useData().padresTutores` | Hijos Vinculados |
| Admin | `PanelAdmin.jsx` | `getDirectivos()` | — (sin tabla extra) |

---

## 14. Decisiones Arquitectónicas

> **Fuente:** Decisiones arquitectónicas del proyecto — Registro de la justificación detrás de cada decisión arquitectónica importante.
>
> **Si no se entiende por qué algo se hizo de cierta manera, esta sección debe ser la primera fuente de consulta.**

### 14.1 Base de datos externa con `managed = False`

**Contexto:**
El sistema se construyó sobre una base de datos MySQL preexistente que ya contenía todas las tablas con su esquema definido. Esta base de datos fue creada y es mantenida por el equipo de administración de la escuela, independientemente del desarrollo del sistema web.

**Motivo:**
Django por defecto intenta gestionar el esquema de la base de datos mediante migraciones. Si se hubiera permitido que Django gestionara el esquema, habría entrado en conflicto con la base de datos existente: Django podría intentar crear tablas que ya existen, modificar columnas que tienen restricciones externas, o eliminar objetos que otros sistemas consumen.

**Beneficios:**
- El sistema Django puede trabajar sobre cualquier base de datos MySQL existente sin necesidad de modificarla.
- El equipo de base de datos puede seguir gestionando el esquema independientemente (agregar índices, modificar tipos de datos, optimizar consultas) sin coordinar con el desarrollo del sistema web.
- No hay riesgo de que Django borre o modifique datos accidentalmente a través de migraciones.
- La integración con sistemas legacy (posibles sistemas preexistentes en la escuela) es transparente.

**Qué problemas evita:**
- Conflictos de migraciones entre Django y la base de datos real.
- Pérdida accidental de datos por migraciones mal generadas.
- Dependencia del desarrollo web para hacer cambios en el esquema de la base de datos.
- Duplicación de la gestión del esquema (Django + DBA).

---

### 14.2 La base de datos real tiene prioridad sobre cualquier SQL de referencia

**Contexto:**
Durante el desarrollo inicial, se utilizó un archivo `sistema_escolar.sql` como referencia para conocer la estructura de la base de datos. Este archivo fue útil para entender las tablas y relaciones, pero con el tiempo se fue desactualizando: algunas columnas fueron agregadas directamente en MySQL, otras modificadas, y el archivo SQL no se mantuvo sincronizado.

**Motivo:**
Varios errores de desarrollo se originaron porque se confiaba en el SQL de referencia en lugar de verificar la base de datos real. Por ejemplo, se intentó acceder a columnas que ya no existían, o se asumió que ciertos campos tenían un tipo de datos que en realidad era diferente. La lección aprendida fue que el único referente confiable es la base de datos ejecutándose en MySQL.

**Beneficios:**
- Elimina la dependencia de un archivo que puede estar desactualizado.
- Reduce errores de desarrollo causados por asumir estructuras incorrectas.
- Fomenta la verificación directa contra la base de datos real, que es la práctica correcta en cualquier proyecto con base de datos externa.

**Qué problemas evita:**
- Errores 500 por acceder a columnas que no existen en la base de datos real.
- Inconsistencias entre el modelo Django y la estructura real de MySQL.
- Tiempo perdido debuggeando problemas que en realidad eran diferencias entre el SQL de referencia y la BD real.

---

### 14.3 Un único DataContext como fuente de verdad

**Contexto:**
En las primeras versiones del frontend, cada componente cargaba sus propios datos llamando a la API directamente. Esto provocaba que:
- Un mismo endpoint se llamara múltiples veces desde diferentes componentes en la misma pantalla.
- Los datos estuvieran desincronizados (un componente mostraba información desactualizada).
- La experiencia de usuario fuera lenta por la cantidad de llamadas redundantes.
- El código fuera difícil de mantener porque la lógica de carga de datos estaba dispersa.

**Motivo:**
Se necesitaba una fuente única de verdad centralizada que cargara todos los datos una sola vez y los pusiera a disposición de cualquier componente que los necesitara. DataContext resuelve este problema: se monta una vez cuando el usuario se autentica, carga ~26 endpoints en paralelo, procesa y normaliza los datos, y los expone a través del hook `useData()`.

**Beneficios:**
- Una sola llamada por endpoint en toda la sesión (las llamadas son paralelas, no secuenciales).
- Los datos están siempre sincronizados entre componentes (todos leen del mismo objeto `data`).
- Los componentes son más simples porque no manejan lógica de fetching (solo consumen datos).
- Si un endpoint falla, los demás continúan funcionando (cada llamada tiene `.catch(() => [])`).
- La carga inicial puede mostrar un spinner global mientras todo se prepara.

**Qué problemas evita:**
- Llamadas redundantes a la API desde múltiples componentes.
- Datos desincronizados entre componentes de la misma pantalla.
- Lógica de fetching dispersa en todo el códigobase.
- Dificultad para mantener y actualizar la forma en que se obtienen los datos.

---

### 14.4 Un único api.js para todas las llamadas HTTP

**Contexto:**
Inicialmente, cada componente importaba axios directamente y hacía sus propias llamadas. Esto llevó a:
- Configuración duplicada del interceptor de tokens JWT.
- URLs de endpoints escritas en múltiples lugares.
- Dificultad para cambiar la URL base o la configuración de axios.
- Inconsistencias en el manejo de errores y formatos de respuesta.

**Motivo:**
Centralizar todas las llamadas HTTP en un solo archivo (`api.js`) garantiza que:
- La configuración de axios (baseURL, headers, interceptores de JWT y refresh token) se define una sola vez.
- Todos los endpoints están listados en un solo lugar, facilitando su mantenimiento y descubrimiento.
- Cualquier cambio en la API (renombrar un endpoint, cambiar parámetros) se hace en un solo archivo.
- Los componentes nunca necesitan importar axios directamente.

**Beneficios:**
- Un solo lugar para mantener la configuración HTTP.
- Fácil descubrimiento de endpoints disponibles (abrir api.js y ver todas las funciones).
- Los componentes son más limpios porque solo importan funciones con nombre descriptivo.
- El interceptor de refresh token automático funciona globalmente.

**Qué problemas evita:**
- URLs de endpoints duplicadas y desincronizadas.
- Configuración de axios esparcida por todo el proyecto.
- Dificultad para migrar a una nueva URL base o agregar headers globales.
- Llamadas sin autenticación por olvidar el token JWT.

---

### 14.5 Formularios desplegables en lugar de modales

**Contexto:**
En muchas aplicaciones web, los formularios de creación/edición se implementan como modales (ventanas emergentes que se superponen al contenido). En este proyecto, se optó por un enfoque diferente: formularios desplegables inline que se muestran/ocultan dentro del mismo flujo de la página.

**Motivo:**
Los modales presentan varios problemas para este tipo de sistema escolar:
- En dispositivos móviles o pantallas pequeñas, los modales ocupan toda la pantalla y pierden el contexto.
- Los modales con múltiples campos y selectores son difíciles de manejar (scroll dentro del modal).
- Los modales dificultan la comparación visual con los datos existentes (el usuario no puede ver la tabla de datos mientras completa el formulario).
- Los formularios desplegables inline mantienen el contexto visual: el usuario ve la tabla y el formulario simultáneamente.

**Beneficios:**
- El usuario mantiene el contexto de los datos mientras completa el formulario.
- Mejor experiencia en dispositivos móviles (el formulario fluye naturalmente con el scroll de la página).
- No hay problemas de z-index, superposición o foco atrapado.
- El patrón es consistente en todo el sistema (todos los módulos lo usan igual).
- Es más accesible (no requiere manejo de foco especial como los modales).

**Qué problemas evita:**
- Modales que no funcionan bien en dispositivos móviles.
- Pérdida de contexto al editar datos (el usuario no ve la lista mientras completa el formulario).
- Complejidad adicional de manejar apertura/cierre de modales con estado.
- Problemas de accesibilidad con modales (foco, ARIA, teclado).

---

### 14.6 PDFs generados desde Django, no desde React

**Contexto:**
El sistema requiere generar documentos PDF: proyectos pedagógicos, boletines de calificaciones. La generación de PDFs desde el frontend (React) es posible usando librerías como jsPDF, html2pdf, o `window.print()`, pero presentan limitaciones significativas.

**Motivo:**
- **ReportLab** (la librería de PDF de Django) produce PDFs profesionales con tipografía, márgenes, encabezados, pies de página y formato consistente. Desde React, el resultado depende del navegador, la impresora configurada, y los estilos CSS.
- Los PDFs generados desde Django pueden almacenarse en el servidor y servir como respaldo oficial (auditoría). Los PDFs generados desde el frontend existen solo en el cliente y no quedan registrados.
- La generación desde Django permite reemplazar automáticamente versiones anteriores, mantener un histórico, y controlar el acceso (no cualquier usuario puede generar PDFs de cualquier proyecto).

**Beneficios:**
- PDFs consistentes independientemente del navegador o dispositivo del usuario.
- Los PDFs se almacenan en el servidor con ruta en la base de datos (auditoría, respaldo).
- Reemplazo automático de versiones anteriores (no se acumulan archivos obsoletos).
- Control de acceso (solo usuarios autorizados pueden generar/descargar).
- Nombres de archivo consistentes y sanitizados.

**Qué problemas evita:**
- PDFs que se ven diferentes en Chrome vs Firefox vs Safari.
- Dependencia de librerías JavaScript de terceros para generación de PDFs.
- Imposibilidad de auditar quién generó qué PDF y cuándo.
- Acumulación de archivos sin control de versiones.
- Riesgo de que el usuario modifique el PDF antes de guardarlo.

---

### 14.7 Todo el proyecto utiliza español

**Contexto:**
El sistema es utilizado por una escuela secundaria argentina. Todos los usuarios (administrativos, docentes, preceptores, alumnos, familias) hablan español. La base de datos preexistente ya tenía nombres de tablas y columnas en español.

**Motivo:**
Mezclar inglés y español en un proyecto crea confusión innecesaria. Si los nombres de las tablas están en español (`alumnos`, `materias`, `curso_materia`), los modelos Django deberían reflejar esos mismos nombres. Si los usuarios ven la interfaz en español, los componentes, variables y funciones deberían estar en el mismo idioma para mantener coherencia.

**Beneficios:**
- Coherencia total entre la base de datos (español), el backend (español), y el frontend (español).
- Los desarrolladores argentinos/latinoamericanos entienden el código sin traducción mental.
- Los nombres de las tablas coinciden con los nombres de los modelos y los endpoints de la API.
- No hay ambigüedad: `alumno` es el modelo, `alumnos` es la tabla y el endpoint.

**Qué problemas evita:**
- Confusión entre `Student` (modelo) y `alumnos` (tabla).
- Dificultad para mapear mentalmente entre la base de datos y el código cuando usan idiomas diferentes.
- Inconsistencias en la nomenclatura (mitad del código en inglés, mitad en español).
- Traducción forzada de términos que no tienen una equivalencia directa (ej: `curso` no es exactamente `course` en el contexto argentino).

---

### 14.8 Todos los módulos comparten el mismo diseño visual

**Contexto:**
El sistema tiene 5 roles (Admin, Preceptor, Docente, Alumno, Familia), cada uno con su propio dashboard y conjunto de vistas. Inicialmente, cada rol tenía ligeras variaciones de diseño que hacían que el sistema se sintiera como 5 aplicaciones diferentes en lugar de una sola.

**Motivo:**
La consistencia visual es fundamental para la experiencia de usuario en un sistema escolar donde:
- Un mismo usuario puede tener múltiples roles (ej: un docente que también es preceptor).
- Los usuarios cambian entre módulos constantemente.
- La falta de consistencia genera desconfianza: el usuario percibe el sistema como "desprolijo" o "incompleto".

**Beneficios:**
- El usuario percibe el sistema como una aplicación unificada, no como 5 paneles separados.
- Curva de aprendizaje reducida: si el usuario aprende a usar un módulo, sabe usar todos.
- El código es más mantenible porque los estilos y patrones se comparten.
- Los cambios de diseño se aplican globalmente (modificar una variable CSS afecta a todos los módulos).

**Qué problemas evita:**
- Módulos que parecen de aplicaciones diferentes.
- Usuarios confundidos por patrones de interacción inconsistentes.
- Duplicación de estilos CSS (cada módulo con sus propias reglas).
- Dificultad para hacer cambios globales de diseño.

---

### 14.9 Reutilización de componentes antes de crear nuevos

**Contexto:**
En las primeras etapas del proyecto, cada desarrollador creaba componentes desde cero para cada nueva funcionalidad, incluso cuando existían componentes similares en otros módulos. Esto resultó en múltiples implementaciones del mismo patrón (tablas de alumnos, tarjetas de perfil, formularios de búsqueda) con ligeras variaciones, lo que duplicaba el código y el esfuerzo de mantenimiento.

**Motivo:**
La reutilización es un principio fundamental de React. Cuando el mismo patrón aparece en múltiples módulos (ej: vista de comunicados en Admin, Docente, Alumno y Familia), debe existir un solo componente compartido en `Shared/` que todos los módulos importen. Esto reduce el código duplicado, centraliza las correcciones de bugs, y garantiza consistencia visual.

**Beneficios:**
- Menos código que mantener y testear.
- Las correcciones de bugs se aplican una sola vez y benefician a todos los módulos.
- Consistencia visual garantizada (todos los módulos usan el mismo componente).
- Los nuevos desarrolladores encuentran más rápido lo que necesitan (buscan en Shared/ primero).

**Qué problemas evita:**
- Múltiples implementaciones del mismo patrón con bugs diferentes.
- Correcciones de bugs que hay que aplicar en 4 lugares diferentes.
- Inconsistencias visuales entre módulos que deberían verse igual.
- Código inflado innecesariamente.

---

### 14.10 Mantener la arquitectura existente sin innovar

**Contexto:**
Cada vez que un nuevo desarrollador o IA trabaja en el proyecto, existe la tentación de introducir mejores prácticas modernas, nuevas librerías, o patrones diferentes a los existentes. Esto es contraproducente porque:
- Introduce deuda técnica por la mezcla de estilos.
- Rompe la consistencia del código.
- Dificulta el mantenimiento futuro (cada módulo usa un patrón diferente).

**Motivo:**
El proyecto tiene una arquitectura probada que funciona. Los patrones están establecidos y documentados. Cualquier nueva funcionalidad debe encajar en esta arquitectura, no crear una nueva. La innovación está permitida solo cuando está justificada por una necesidad real que la arquitectura actual no puede resolver.

**Beneficios:**
- El código mantiene un estilo uniforme y predecible.
- Cualquier desarrollador o IA puede entender cualquier parte del proyecto porque todos siguen los mismos patrones.
- Reducción de la deuda técnica (no se acumulan estilos divergentes).
- Mayor velocidad de desarrollo (no hay que decidir cómo hacer algo, solo seguir el patrón existente).

**Qué problemas evita:**
- Módulos escritos con estilos radicalmente diferentes.
- Dificultad para mantener el código cuando cada parte usa patrones distintos.
- Decisiones arbitrarias que después hay que revertir.
- "Arquitectura de catedral" donde cada capa se construyó con criterios diferentes.

---

### 14.11 Archivos monolíticos por capa (models.py, serializers.py, views.py)

**Contexto:**
En proyectos Django típicos, es común tener una estructura de archivos por modelo o por app: `models/alumno.py`, `views/docente.py`, etc. Este proyecto, en cambio, tiene un solo `models.py` con 21 modelos, un solo `serializers.py` con ~40 serializers, y un solo `views.py` con ~19 viewsets.

**Motivo:**
El proyecto tiene una sola app Django (`escuela`). La base de datos es externa, los modelos son solo mappings ORM con `managed=False`, y la lógica de negocio está en las vistas. Dividir en archivos separados no aportaría beneficios reales porque:
- Los modelos están fuertemente relacionados entre sí (CursoMateria conecta Curso, Materia y Docente).
- Separar en archivos dificultaría ver las relaciones entre modelos.
- Dado que no hay migraciones ni esquema gestionado por Django, la modularización no es necesaria.

**Beneficios:**
- Todas las relaciones entre modelos son visibles en un solo archivo.
- No hay que navegar entre 21 archivos diferentes para entender el esquema completo.
- El orden de definición de modelos es explícito (importante para claves foráneas).
- Menos archivos abiertos simultáneamente durante el desarrollo.

**Qué problemas evita:**
- Archivos de modelo individuales que necesitan importarse entre sí (referencias circulares).
- Dificultad para ver el panorama completo de la base de datos.
- Múltiples archivos con pocas líenas cada uno que añaden complejidad de navegación.

---

### 14.12 Enrutamiento por estado en lugar de React Router

**Contexto:**
La mayoría de las aplicaciones React modernas usan React Router para el enrutamiento. Este proyecto no lo usa. En su lugar, cada dashboard mantiene una variable de estado `view` que determina qué componente se renderiza, mediante un switch.

**Motivo:**
El sistema no es una aplicación con páginas independientes (cada una con su propia URL), sino un conjunto de dashboards donde el usuario navega entre vistas internas sin cambiar de página. Usar React Router habría añadido complejidad innecesaria:
- Habría que definir rutas para cada vista de cada rol.
- Cada cambio de vista implicaría un cambio de URL, lo que no tiene sentido para una SPA con dashboard.
- Los estados de la aplicación (curso seleccionado, materia activa, etc.) habría que persistirlos en la URL.

**Beneficios:**
- El cambio de vistas es instantáneo (no hay navegación real, solo cambio de estado).
- El estado de la aplicación (curso seleccionado, materia activa) se mantiene al cambiar de vista.
- No hay dependencia externa (React Router) por una funcionalidad que se resuelve con estado local.
- La estructura del código es más simple y directa.

**Qué problemas evita:**
- URLs que no representan páginas reales (no tiene sentido tener `/admin/alumnos` si todo es una SPA).
- Complejidad de sincronizar el estado de la aplicación con los parámetros de la URL.
- Dependencia de una librería de routing para una funcionalidad que no necesita rutas reales.
- Renderizados innecesarios al cambiar de ruta.

---

### 14.13 Sin librerías externas de UI

**Contexto:**
La mayoría de los proyectos web modernos utilizan librerías de UI como Material UI, Chakra UI, Bootstrap, o Ant Design para acelerar el desarrollo. Este proyecto no usa ninguna: todo el CSS es manual en `index.css`.

**Motivo:**
- Las librerías de UI imponen un estilo visual que no necesariamente se alinea con la identidad de la escuela.
- Agregan peso significativo al bundle (Material UI son ~100KB+).
- Personalizar una librería de UI para que se vea como un sistema escolar argentino requiere tanto o más trabajo que escribir el CSS manualmente.
- El CSS manual es más fácil de mantener a largo plazo (no hay dependencias de versiones de librerías).

**Beneficios:**
- Bundle más pequeño (no hay cientos de KB de componentes no utilizados).
- Control total sobre el diseño visual (cada píxel está en el código del proyecto).
- No hay dependencias de terceros que puedan romperse con actualizaciones.
- El diseño puede evolucionar sin estar limitado por la API de una librería.

**Qué problemas evita:**
- Dependencia de versiones de librerías de UI.
- Personalización forzada de componentes de terceros con `!important` en el CSS.
- Inconsistencias entre lo que la librería ofrece y lo que el proyecto necesita.
- Aumento innecesario del tamaño del bundle.

---

### 14.14 Sin TypeScript

**Contexto:**
El proyecto utiliza JavaScript puro con JSX, no TypeScript. Esto es una decisión deliberada, no una omisión.

**Motivo:**
- TypeScript agrega una capa de complejidad que no es necesaria para el tamaño y alcance del proyecto.
- El proyecto tiene menos de 30 componentes y ~20 modelos — los beneficios de TypeScript (tipado estático, detección temprana de errores) no justifican el costo de configuración y mantenimiento.
- El equipo que desarrolló el proyecto inicialmente tenía más experiencia en JavaScript que en TypeScript.
- Dado que la base de datos es externa y los modelos son mappings ORM, el tipado de los datos de la API sería difícil de mantener sincronizado con la BD real.

**Beneficios:**
- Desarrollo más rápido sin necesidad de definir tipos para cada respuesta de API.
- No hay configuración de TypeScript que mantener.
- Los archivos JSX son más cortos y legibles sin anotaciones de tipo.
- No hay fricción al cambiar la estructura de datos (no hay que actualizar interfaces).

**Qué problemas evita:**
- Mantenimiento de interfaces TypeScript que reflejen la estructura de la BD (que cambia externamente).
- Configuración de tsconfig, tipos de librerías, y resolución de módulos.
- Errores de compilación por tipos incorrectos en datos provenientes de la API.

---

### 14.15 Sin tests automatizados (actualizado)

**Contexto:**
El proyecto originalmente no tenía tests automatizados (ni unitarios, ni de integración, ni end-to-end). Sin embargo, **esto ha cambiado** — actualmente existen tests.

> **Nota actualizada:** El proyecto ahora cuenta con tests. Ejecutar la suite completa con `cd backend && python manage.py test escuela --verbosity=2`.

**Motivo original:**
- El proyecto comenzó como un prototipo funcional para una escuela específica, no como un producto de software comercial.
- Los recursos de desarrollo eran limitados y se priorizó la funcionalidad sobre la cobertura de tests.
- La base de datos externa y el esquema cambiante hacen que los tests de integración sean difíciles de mantener (cada cambio en la BD puede romper tests).
- Los tests unitarios tendrían que mockear toda la capa de base de datos, lo que reduce su valor real.
- La validación se hace manualmente mediante el checklist post-modificación.

**Beneficios:**
- Desarrollo más rápido sin la sobrecarga de escribir y mantener tests.
- No hay falsos positivos ni falsos negativos por mocks desactualizados.
- El checklist post-modificación manual es más efectivo que tests automáticos que no cubren todos los escenarios.

**Qué problemas evita:**
- Tests que fallan porque la base de datos externa cambió.
- Mantenimiento constante de mocks y fixtures.
- Falsa sensación de seguridad por tests que no cubren los casos reales.

---

## 15. Módulo Proyectos (ex Planificaciones)

### 15.1 Descripción general

El módulo **Proyectos** reemplaza al antiguo módulo "Planificaciones". Existe únicamente dentro del usuario **Docente**. Permite crear proyectos pedagógicos con cuatro campos de texto, generación automática de PDF, y CRUD completo.

### 15.2 Ubicación

- **Backend:** `PlanificacionViewSet` en `views.py:1556-1702`
- **Serializer:** `PlanificacionSerializer` en `serializers.py:1497-1507`
- **Modelo:** `Planificacion` en `models.py:505-527`
- **Frontend:** `Profesores/PanelPlanif.jsx` (289 líneas)
- **API:** `/api/planificaciones/`

### 15.3 Modelo

```python
class Planificacion(models.Model):
    id_planificacion = AutoField(primary_key=True)
    id_docente = ForeignKey(Docente)
    id_curso_materia = ForeignKey(CursoMateria)
    contenido = TextField()
    objetivos = TextField()
    salidas = TextField()
    fundamentacion = TextField()
    estado = CharField(max_length=20, default='Borrador')
    ruta_archivo = CharField(max_length=255)  # URL del PDF generado
    fecha_subida = DateTimeField()
    fecha_ultima_modificacion = DateTimeField()
```

### 15.4 Formulario

El formulario (`FormProyecto` en `PanelPlanif.jsx`) tiene **cuatro campos** en disposición de 2 columnas:
- **Contenido** (textarea, requerido)
- **Objetivos** (textarea, requerido)
- **Salidas educativas** (textarea, requerido)
- **Fundamentación** (textarea, requerido)

Estilo: fondo `var(--sidebar-hover)` (azul oscuro), labels blancos, en grid de 2 columnas responsivo.

### 15.5 Reglas de generación de PDF

- **Los PDFs se generan desde el backend** usando ReportLab (Django). No desde React.
- La única excepción es el boletín de calificaciones (`frontend/src/utils/boletin.js`) que usa `window.print()`.
- Al actualizar un proyecto, **se elimina automáticamente el PDF anterior** del disco antes de regenerar.
- **En la BD solo se guarda la ruta** (CharField), no el contenido del archivo.
- **Nombres consistentes:** `Proyecto_{Materia}_{Curso}_{Año}.pdf` (sanitizado).

### 15.6 Generación de PDF

Cuando se crea o actualiza un proyecto, el backend:

1. Toma los 4 campos de texto.
2. Los pasa a `_generar_pdf()` que usa **ReportLab**.
3. Genera un PDF con nombre: `Proyecto_{Materia}_{Curso}_{Año}.pdf`
   - El nombre se sanitiza (elimina `\/:*?"<>|` y reemplaza espacios con `_`).
4. Guarda el PDF en `MEDIA_ROOT/planificaciones/`.
5. Actualiza `ruta_archivo` con `MEDIA_URL/planificaciones/{filename}`.

En **update**, además elimina el PDF anterior del disco antes de regenerar.

### 15.7 Funcionalidades del frontend

- **Crear:** Botón "Crear proyecto", muestra formulario inline.
- **Ver:** Tabla con columnas: Archivo PDF, Fecha de carga, Docente, Acciones.
- **Editar:** Botón "Editar" expande formulario inline abajo de la fila.
- **Eliminar:** Botón "Eliminar" con confirmación.
- **Descargar:** Link directo al PDF.

### 15.8 Flujo de trabajo

1. Docente selecciona curso y materia (de sus asignaciones).
2. Navega a la sección "Proyectos".
3. Ve lista de proyectos existentes para ese curso+materia.
4. Puede crear, editar o eliminar proyectos.
5. Cada acción genera/regenera el PDF automáticamente.

### 15.9 Endpoints

- `GET /api/planificaciones/?curso_materia={id}` — Lista proyectos por curso_materia
- `POST /api/planificaciones/` — Crear proyecto (body: id_docente, id_curso_materia, contenido, objetivos, salidas, fundamentacion)
- `PATCH /api/planificaciones/{id}/` — Actualizar proyecto
- `DELETE /api/planificaciones/{id}/` — Eliminar proyecto

### 15.5 Matriz Rol×Endpoint de Auditoría

> **Fuente:** Matriz de permisos por ViewSet mostrando qué ViewSet tiene qué clases de permisos y su estado.

| ViewSet | Permission Classes | Estado |
|---------|-------------------|--------|
| `MateriaViewSet` | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `CursoMateriaViewSet` | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `SuplenciaDocenteViewSet` | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `AdelantoHorasViewSet` | `IsAuthenticated, PuedeGestionarAdelantos` | ✅ Gestión restringida |
| `EventoInstitucionalViewSet` | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `PeriodoEvaluacionViewSet` | `IsAuthenticated, IsAdminOrDirectorForWrite` | ✅ Escritura restringida |
| `HistorialCambioViewSet` | `IsAuthenticated, PuedeVerHistorial` | ✅ Solo roles amplios |
| `AsistenciaDocenteViewSet` | `IsAuthenticated` | ⚠️ Solo autenticación |
| `CalificacionViewSet` | `IsAuthenticated, PuedeEscribirCalificaciones` | ✅ Resuelto (admin, director, docente) |
| `UsuarioViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `AlumnoViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `DocenteViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `PreceptorViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `DirectivoViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `PadreTutorViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `CursoViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `AsistenciaViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `ComunicadoViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `PlanificacionViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `ActaViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `LibroTemaViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `DiagnosticoGrupalViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |
| `NotificacionViewSet` | `IsAuthenticated` | ✅ Resuelto con permisos personalizados |

> **Nota:** Antes de la resolución (2026-08-24), había 28 ViewSets sin `permission_classes` explícito que dependían del default `IsAuthenticated`. Esto fue corregido declarando puertas de permisos en `permissions.py` (clases en español) y cableándolas en `views.py`.

---

## 16. Cómo agregar nuevos módulos

### 16.1 Patrón recomendado

1. **Backend — Modelo:** Agregar en `models.py` (recordar `managed = False`, `db_table` correcta).
2. **Backend — Serializer:** Agregar en `serializers.py` (usar `ModelSerializer` con `fields` explícito o `'__all__'`).
3. **Backend — ViewSet:** Agregar en `views.py` (usar `ModelViewSet` con `select_related` y `queryset`).
4. **Backend — URL:** Registrar en `urls.py` con `router.register()`.
5. **Frontend — API:** Agregar funciones en `api.js` (get, create, update, delete).
6. **Frontend — Componente:** Crear componente en la carpeta del rol correspondiente.
7. **Frontend — Dashboard:** Importar y agregar case en el switch del dashboard.
8. **Frontend — Sidebar:** Agregar item en `sidebarMenu.js` o inline.

### 16.2 Consideraciones

- Si el módulo aplica a múltiples roles, crear el componente en `Shared/`.
- Si el módulo necesita datos globales, considerar agregarlo a `DataContext`.
- Si el módulo solo necesita datos específicos, hacer fetch en el componente.
- Mantener el mismo patrón visual (clases CSS existentes).
- No olvidar `select_related` en el queryset del ViewSet para evitar N+1 queries.

---

## 17. Errores comunes

### 17.1 Duplicar exports / imports

**Problema:** Exportar dos funciones con el mismo nombre desde `api.js`, o importar desde ruta incorrecta.

**Solución:** Verificar que cada función tenga nombre único en `api.js`. Usar imports relativos correctos (`../../context/DataContext`).

### 17.2 Inconsistencias entre modelo y base de datos

**Problema:** El modelo Django tiene un campo que no existe en la tabla MySQL, o viceversa.

**Solución:** Como `managed = False`, los modelos deben coincidir EXACTAMENTE con la estructura de la BD. Verificar `db_table` y `db_column`.

### 17.3 Serializer/modelo desincronizados

**Problema:** El serializer referencia un campo que no está en el modelo, o falta un campo que sí está.

**Solución:** Revisar que `Meta.fields` en el serializer coincida con los campos del modelo. Recordar que `SerializerMethodField` no necesita existir en el modelo.

### 17.4 Problemas con Context API

**Problema:** `useData()` retorna valores vacíos porque el componente se monta antes de que DataContext termine de cargar.

**Solución:** Usar `useData().loading` para mostrar un spinner o mensaje de carga mientras los datos no están listos.

### 17.5 Permisos

**Problema:** Usuario ve opciones que no debería, o no ve opciones que debería.

**Solución:** Verificar que el sidebar filtre correctamente por rol. Verificar que los ViewSets tengan los permisos adecuados.

### 17.6 Nombres de endpoints

**Problema:** Frontend llama a `/api/planificacion/` (singular) pero el endpoint es `/api/planificaciones/` (plural).

**Solución:** Todos los endpoints son plurales. Verificar en `urls.py` el nombre registrado.

### 17.7 Campos que no existen en ciertos modelos

**Problema:** Intentar mostrar `correo` en el perfil de un alumno o admin, cuando esos modelos no tienen ese campo.

**Solución:** Recordar qué campos tiene cada modelo (ver sección 5). Mostrar condicionalmente con `{campo && <div>...</div>}`.

### 17.8 DataContext no refresca después de crear/editar

**Problema:** Después de crear una calificación, la lista no se actualiza.

**Solución:** Llamar a `refreshData()` (de `useData()`) después de operaciones de escritura. Ver ejemplo en `PanelPlanif.jsx`.

### 17.9 Rules of Hooks — useMemo después de early return

**Problema:** Colocar `useMemo` (o cualquier hook) después de un `if (!data) return <Empty/>` causa un crash de React.

**Explicación:** En el primer render (data=null), la rama temprana ejecuta 4 hooks. Cuando data llega y se omite el early return, se ejecutan 5 hooks. React detecta que el número de hooks cambió y lanza: "Rendered fewer hooks than expected."

**Solución siempre:** Mover TODOS los hooks ANTES de cualquier early return. Poner el guardia DENTRO del callback de `useMemo`:

```jsx
// ❌ MAL — hook después de early return
if (!miDocente) return null;
const stats = useMemo(() => computeStats(miDocente), [miDocente]);

// ✅ BIEN — hook antes del early return
const stats = useMemo(() => {
  if (!miDocente) return null;
  return computeStats(miDocente);
}, [miDocente]);
if (!miDocente) return null;
```

Además, usar `?? []` en todas las colecciones provenientes de DataContext para evitar `undefined` en `.map()`, `.filter()`, etc.

### 17.2 Estrategias de Debugging de Navegación

> **Fuente:** Estrategias de debugging de navegación del frontend.
>
> ⚠ **Las Strategies 1, 3 y 4 modifican código.** No se aplican "para ver el error": primero Fase 0–6 de las reglas pre-ejecución (símbolo `setView` / `seccionActiva` en los 6 dashboards). Strategy 2 es solo inspección. Strategy 5 usa `cd frontend && npx vitest run`.

#### Strategy 1: Navigation Event Logger (Non-Invasive)

Add a development-only wrapper around `setView` that logs every navigation transition:

```jsx
// In any Dashboard component, temporarily wrap setView:
const [view, _setView] = useState('perfil');
const setView = useCallback((nextView) => {
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed(`[Nav] ${view} → ${nextView}`);
    console.trace();
    console.groupEnd();
  }
  _setView(nextView);
}, [view]);
```

This traces **every** transition with a stack trace showing which sidebar button or programmatic call triggered it.

#### Strategy 2: React DevTools State Inspection

1. Open React DevTools → Components tab
2. Find the Dashboard component (e.g., `AdminDashboard`)
3. Inspect the `view` state value in the hooks panel
4. Click sidebar items and observe state changes in real-time
5. For `PanelProfesores`, also inspect `seccionActiva`, `cursoId`, and `materiaSeleccionada` — navigation depends on all three

#### Strategy 3: Visual State Overlay (Development)

```jsx
// Render current navigation state as a debug overlay:
{process.env.NODE_ENV === 'development' && (
  <div style={{
    position: 'fixed', bottom: 0, right: 0, background: 'rgba(0,0,0,0.8)',
    color: '#0f0', padding: '8px 12px', fontSize: '11px', fontFamily: 'monospace', zIndex: 9999
  }}>
    view: {view} | anio: {anioLectivo} | curso: {curso}
  </div>
)}
```

#### Strategy 4: Simulated URL Sync (Lightweight Migration Path)

Without adopting React Router, you can add `history.pushState` to track view state:

```jsx
// Custom hook:
function useViewNavigation(defaultView) {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || defaultView;
  });

  const navigate = useCallback((nextView) => {
    setView(nextView);
    const url = new URL(window.location);
    url.searchParams.set('view', nextView);
    window.history.pushState({}, '', url);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setView(params.get('view') || defaultView);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [defaultView]);

  return [view, navigate];
}
```

This gives you: back/forward support, shareable URLs, and page refresh persistence — without introducing a routing library.

#### Strategy 5: Automated Navigation Testing

Since there are no routes, traditional route testing doesn't apply. Instead:

1. **Test sidebar click → view state → rendered component:**
   ```jsx
   render(<AdminDashboard user={mockUser} onLogout={jest.fn()} />);
   fireEvent.click(screen.getByText('Alumnos'));
   expect(screen.getByTestId('alumnos-component')).toBeInTheDocument();
   ```

2. **Test the switch statement exhaustiveness:**
   - Ensure every `case` in each dashboard's `renderView()` maps to a valid component
   - Ensure every `sidebarMenu.js` `id` has a matching `case`

3. **Test navigation state isolation:**
   - Verify that switching roles (via `cambiarRol`) resets `view` state
   - Verify that `DataProvider` refresh does not reset `view` state

#### Strategy 6: Mapping Navigation Flow Without a Router

Create a navigation map document for each role:

```
Admin: perfil → [alumnos, docentes, preceptores, jefes-preceptores, administradores,
                  horarios, adelantos-horas, asistencias, calendario, notas, comunicados,
                  cursos, materias, suplencias, historial, actas, info, notificaciones]

Docente: docente → [alumnos, info, planif, libro-temas, actividades, asistencia,
                     actas, comunicados, materias-adeudadas, calendario, notificaciones]
  (NOTE: alumnos/info/planif/etc. require cursoId + materiaSeleccionada to be set first)
```

This reveals the **precondition dependency** problem in `PanelProfesores`: clicking "Calificaciones" when no curso/materia is selected shows an empty state instead of the view — a UX issue that routes with params could solve.

### 17.3 Tabla de useState Críticas

> **Fuente:** Problemas conocidos de navegación por estado.

| # | Issue | Impact |
|---|-------|--------|
| 1 | **No deep linking** | Users cannot bookmark or share a URL to a specific view. Refreshing the page resets to `'perfil'`. |
| 2 | **Back/forward navigation broken** | Browser history is not updated. Pressing "Back" exits the app instead of navigating to the previous view. |
| 3 | **No scroll restoration** | Switching views does not preserve or restore scroll position. |
| 4 | **View state not persisted** | Page refresh always starts at default view. |
| 5 | **Programmatic navigation is fragile** | Any component needing to navigate must receive `setView` as a prop. There's no central navigation API. |
| 6 | **Docente uses different variable name** | `PanelProfesores` uses `seccionActiva` instead of `view`, breaking consistency. |
| 7 | **Nested conditional rendering** | `PanelProfesores.jsx` has a ternary chain of 10+ conditions (lines 215–367), making the render logic hard to follow and debug. |

---

## 18. Recomendaciones para futuras IA

### 18.1 Antes de modificar código

1. **Leer este documento completo** para entender la arquitectura.
2. **Identificar el módulo afectado** y revisar su implementación completa (modelo, serializer, viewset, API, componente, contexto).
3. **Buscar componentes similares** existentes antes de crear nuevos — reutilizar es prioridad.
4. **Verificar qué campos tiene el modelo** en la BD real (no asumir campos que no existen).
5. **Revisar el DataContext** para saber si los datos ya están disponibles globalmente.

### 18.2 Cómo modificar sin romper otros módulos

1. **No cambiar la firma de funciones** de `api.js` sin actualizar todos los llamados.
2. **No agregar campos requeridos** a modelos existentes sin verificar que todos los serializers y formularios los manejen.
3. **No cambiar la estructura del `user`** en `AuthContext` sin actualizar todos los dashboards.
4. **No eliminar propiedades del `data`** en `DataContext` sin verificar que ningún componente las use.
5. **Mantener `managed = False`** en todos los modelos — la estructura de BD es responsabilidad del DBA.

### 18.3 Patrones a mantener

- **Perfiles:** Siempre usar el mismo grid visual (repeat(auto-fit, minmax(240px, 1fr)), fondo #f8f9fa, borde --primary-color).
- **Formularios:** Usar clases `.form-group-filter`, `.filter-row`, `.preceptor-form-row--two`.
- **Sidebar:** Primero "Mi Perfil", luego módulos en orden lógico, separado del logout.
- **API calls:** Solo en `api.js`, nunca en componentes directamente.
- **DataContext:** Para datos compartidos entre múltiples componentes.
- **Manejo de errores:** Try/catch en componentes, `.catch(() => [])` en DataContext.

### 18.4 Reglas de oro

1. **No duplicar código.** Si ves un patrón repetido, refactoriza a un componente compartido.
2. **No cambiar el backend si el frontend puede resolverlo.** Preferir lógica del lado del cliente cuando sea posible.
3. **Un cambio en DataContext afecta a TODOS los dashboards.** Verificar que ningún otro rol se rompa.
4. **Los nombres de endpoints son plurales** en kebab-case (`/api/curso-materia/`).
5. **Todos los modelos tienen `managed = False`** — Django nunca debe crear/modificar tablas.
6. **El CSS es global** — no crear estilos inline a menos que sea absolutamente necesario.
7. **Los componentes de perfil siempre muestran datos condicionalmente** (`{campo && ...}`) porque no todos los roles tienen los mismos campos.
8. **Todos los hooks deben ir ANTES de cualquier early return.** Si un dato puede ser null en el primer render, poner el guardia dentro de `useMemo`/`useEffect`, no antes del hook.

### 18.5 Estructura a seguir para nuevos módulos

```
Backend:
  models.py      →  class NuevoModelo(models.Model): ...
  serializers.py →  class NuevoModeloSerializer(serializers.ModelSerializer): ...
  views.py       →  class NuevoModeloViewSet(viewsets.ModelViewSet): ...
  urls.py        →  router.register(r'nuevo-modelo', views.NuevoModeloViewSet)

Frontend:
  api.js         →  export async function getNuevoModelo() { ... }
  Componente.jsx →  function NuevoComponente() { ... }
  Dashboard.jsx  →  import + case en switch + sidebar item
```

### 18.6 Validación rápida de cambios

Después de cualquier modificación, verificar:

1. **Backend:** `python manage.py check` para errores de sintaxis.
2. **Frontend:** `npm run dev` sin errores de compilación.
3. **Consistencia:** Que el serializer devuelva los campos que el frontend espera.
4. **No regresión:** Que los perfiles existentes (todos los roles) sigan funcionando.
5. **CSS:** Que no se hayan introducido estilos que rompan el layout existente.
6. **Rules of Hooks:** Verificar que ningún hook esté después de un early return.

---

## 19. Estándar Visual de Formularios

### 19.1 Patrón obligatorio

Todos los formularios del sistema siguen este patrón visual. Cualquier formulario nuevo debe cumplirlo:

| Elemento | Especificación |
|----------|---------------|
| Botón para abrir | `.btn-primary` con texto "Crear", "Nuevo", "Agregar" |
| Estado inicial | Formulario oculto (no visible hasta hacer clic en el botón) |
| Cierre | Botón "Cancelar" → formulario se oculta |
| Labels | Texto legible en español, en negrita |
| Grid | 2 columnas responsivas (`.preceptor-form-row--two` o similar) |
| Campos largos | Ocupan ambas columnas (full width) |
| Botón Guardar | `.btn-success` o `.btn-primary` |
| Botón Cancelar | `.btn-secondary` |
| Validación | Mensajes de error visibles abajo del campo |

### 19.2 Clases CSS a usar

- Contenedor: `.preceptor-form-row`, `.filter-row`
- Grid de 2 columnas: `.preceptor-form-row--two`
- Botones: `.btn`, `.btn-primary`, `.btn-success`, `.btn-secondary`
- No crear nuevos estilos para formularios. Usar las clases existentes.

---

## 20. Consistencia Visual entre Módulos

### 20.1 Regla

Si un usuario cambia entre módulos (Perfil, Calificaciones, Comunicados, etc.), no debe percibir diferencias de diseño. Todos los módulos deben parecer parte del mismo sistema.

### 20.2 Cómo mantenerla

- Usar las mismas clases CSS en todos los módulos (`.card`, `.btn`, `.table-responsive`, `.badge`).
- Todos los dashboards usan el mismo layout: sidebar izquierdo + header superior + contenido central.
- Los perfiles (`Panel{Rol}.jsx`) tienen la misma estructura: grid de datos personales + tabla contextual + tarjetas de estadísticas.
- Los formularios usan el mismo patrón visual (ver sección 19).
- Los botones, tablas y tarjetas tienen los mismos colores, bordes y tamaños en todos los módulos.

### 20.3 Lo que nunca debe pasar

- Un módulo usa botones verdes y otro azules para la misma acción.
- Un módulo tiene el formulario visible por defecto y otro lo tiene oculto.
- Los colores de fondo, padding o márgenes cambian entre módulos.

---

## 21. Mi Perfil — Estadísticas por rol

Cada `Panel{Rol}.jsx` tiene una sección de tarjetas de estadísticas debajo de los datos personales, usando un `StatCard` local (no compartido) con el mismo grid responsivo.

### 21.1 Docente (`PanelDocente.jsx`)

- **Fuente de datos:** `miDocente` (de `data.docentes.find` por `user.id`).
- **Estadísticas:** materias asignadas, cursos a cargo, alumnos a cargo, proyectos creados, actas realizados, último ingreso (`—`), estado de cuenta.
- **Cálculos:** `asignaciones` filtradas por `id_docente`, `planificaciones` filtradas por `id_docente`, `actasDocente` filtradas por `docenteId`.

### 21.2 Preceptor (`PanelPreceptor.jsx`)

- **Fuente de datos:** `miPreceptor` (de `data.preceptores.find` por `user.id`).
- **Estadísticas:** cursos asignados, alumnos bajo seguimiento, comunicados, diagnósticos grupales, estado de cuenta.
- **Cálculos:** `cursosPreceptor` filtrados por `id_preceptor`; `alumnos`, `comunicados`, `diagnosticos` filtrados por `id_curso`.

### 21.3 Alumno (`PanelAlumno.jsx`)

- **Fuente de datos:** `miAlumno` (de `data.alumnos.find` por `user.id`).
- **Estadísticas:** curso actual, división, ciclo lectivo, materias, promedio general, inasistencias, estado académico.
- **Estado académico:** ≥7 → Promocionado, ≥4 → Regular, <4 → En seguimiento, sin calificaciones → Sin calificaciones.
- **Cálculos:** `calificacionesCompletas` filtradas por `id_alumno`, `asistenciasAdmin` filtradas por `alumnoId`.

### 21.4 Familia (`PanelFamilia.jsx`)

- **Fuente de datos:** `miFamilia` (de `data.padres_tutores.find` por `user.id`).
- **Estadísticas:** hijos vinculados, lista de alumnos asociados con nombre y curso, estado de cuenta (hardcoded "Activo" — no hay campo `usuario_estado` en PadreTutor).

### 21.5 Admin (`PanelAdmin.jsx`)

- **Fuente de datos:** `miAdmin` (de `data.directivos.find` por `user.id`).
- **Estadísticas:** 9 contadores del sistema (alumnos, docentes, preceptores, familias, cursos, materias, proyectos, comunicados, actas) + banner verde "Estado del sistema: todos los módulos funcionando con normalidad".
- **Cálculos:** Todos de las listas completas de DataContext (`.length`).

### 21.6 Reglas de implementación

- `useMemo` siempre ANTES del early return, con guardia `if (!data) return null` dentro del callback.
- Todas las colecciones de DataContext accedidas con `?? []`.
- `StatCard` local dentro de cada archivo (no importado) — no crear nuevos archivos.
- Si un stat no se puede calcular (dato faltante), mostrar `—` o "Sin información".

---

## 22. Checklist de Verificación de Modelos

> **Fuente:** Checklist de reverse-engineering de la base de datos, verificación de modelos contra MySQL.

### 22.1 Exportar y comparar esquema vivo

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

### 22.2 Inspectdb vs. modelos reales

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

### 22.3 Consistencia de Managers custom

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

### 22.4 Relaciones y restricciones

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

### 22.5 Checklist de reverse-engineering completo

- [ ] `mysqldump --no-data` exportado y comparado con `sistema_escolar.sql`
- [ ] `inspectdb` generado y comparado con `models.py`
- [ ] Todos los 55 modelos verificados: `db_table`, PKs, FKs, tipos, NULLs
- [ ] Managers `ActivoManager`/`PlanificacionManager` verificados
- [ ] `all_objects` presente donde corresponde
- [ ] FK constraints verificadas contra MySQL DDL
