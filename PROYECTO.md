# PROYECTO — MiSecundaria 7

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
10. [Context API](#10-context-api)
11. [Servicios (api.js)](#11-servicios-apijs)
12. [Convenciones del proyecto](#12-convenciones-del-proyecto)
13. [Módulos implementados](#13-módulos-implementados)
14. [Módulo Proyectos (ex Planificaciones)](#14-módulo-proyectos-ex-planificaciones)
15. [Cómo agregar nuevos módulos](#15-cómo-agregar-nuevos-módulos)
16. [Buenas prácticas del proyecto](#16-buenas-prácticas-del-proyecto)
17. [Errores comunes](#17-errores-comunes)
18. [Recomendaciones para futuras IA](#18-recomendaciones-para-futuras-ia)

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
├── PROYECTO.md                    # Este archivo
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

La generación de PDF se realiza exclusivamente en `PlanificacionViewSet._generar_pdf()` usando **ReportLab**. Ver [sección 14](#14-módulo-proyectos-ex-planificaciones) para detalles completos.

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

### 8.2 Propósito de cada tabla

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

### 9.2 PanelPlanif.jsx (Proyectos)

Ver [sección 14](#14-módulo-proyectos-ex-planificaciones).

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

## 14. Módulo Proyectos (ex Planificaciones)

### 14.1 Descripción general

El módulo **Proyectos** reemplaza al antiguo módulo "Planificaciones". Existe únicamente dentro del usuario **Docente**. Permite crear proyectos pedagógicos con cuatro campos de texto, generación automática de PDF, y CRUD completo.

### 14.2 Ubicación

- **Backend:** `PlanificacionViewSet` en `views.py:1556-1702`
- **Serializer:** `PlanificacionSerializer` en `serializers.py:1497-1507`
- **Modelo:** `Planificacion` en `models.py:505-527`
- **Frontend:** `Profesores/PanelPlanif.jsx` (289 líneas)
- **API:** `/api/planificaciones/`

### 14.3 Modelo

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

### 14.4 Formulario

El formulario (`FormProyecto` en `PanelPlanif.jsx`) tiene **cuatro campos** en disposición de 2 columnas:
- **Contenido** (textarea, requerido)
- **Objetivos** (textarea, requerido)
- **Salidas educativas** (textarea, requerido)
- **Fundamentación** (textarea, requerido)

Estilo: fondo `var(--sidebar-hover)` (azul oscuro), labels blancos, en grid de 2 columnas responsivo.

### 14.5 Generación de PDF

Cuando se crea o actualiza un proyecto, el backend:

1. Toma los 4 campos de texto.
2. Los pasa a `_generar_pdf()` que usa **ReportLab**.
3. Genera un PDF con nombre: `Proyecto_{Materia}_{Curso}_{Año}.pdf`
   - El nombre se sanitiza (elimina `\/:*?"<>|` y reemplaza espacios con `_`).
4. Guarda el PDF en `MEDIA_ROOT/planificaciones/`.
5. Actualiza `ruta_archivo` con `MEDIA_URL/planificaciones/{filename}`.

En **update**, además elimina el PDF anterior del disco antes de regenerar.

### 14.6 Funcionalidades del frontend

- **Crear:** Botón "Crear proyecto", muestra formulario inline.
- **Ver:** Tabla con columnas: Archivo PDF, Fecha de carga, Docente, Acciones.
- **Editar:** Botón "Editar" expande formulario inline abajo de la fila.
- **Eliminar:** Botón "Eliminar" con confirmación.
- **Descargar:** Link directo al PDF.

### 14.7 Flujo de trabajo

1. Docente selecciona curso y materia (de sus asignaciones).
2. Navega a la sección "Proyectos".
3. Ve lista de proyectos existentes para ese curso+materia.
4. Puede crear, editar o eliminar proyectos.
5. Cada acción genera/regenera el PDF automáticamente.

### 14.8 Endpoints

- `GET /api/planificaciones/?curso_materia={id}` — Lista proyectos por curso_materia
- `POST /api/planificaciones/` — Crear proyecto (body: id_docente, id_curso_materia, contenido, objetivos, salidas, fundamentacion)
- `PATCH /api/planificaciones/{id}/` — Actualizar proyecto
- `DELETE /api/planificaciones/{id}/` — Eliminar proyecto

---

## 15. Cómo agregar nuevos módulos

### 15.1 Patrón recomendado

1. **Backend — Modelo:** Agregar en `models.py` (recordar `managed = False`, `db_table` correcta).
2. **Backend — Serializer:** Agregar en `serializers.py` (usar `ModelSerializer` con `fields` explícito o `'__all__'`).
3. **Backend — ViewSet:** Agregar en `views.py` (usar `ModelViewSet` con `select_related` y `queryset`).
4. **Backend — URL:** Registrar en `urls.py` con `router.register()`.
5. **Frontend — API:** Agregar funciones en `api.js` (get, create, update, delete).
6. **Frontend — Componente:** Crear componente en la carpeta del rol correspondiente.
7. **Frontend — Dashboard:** Importar y agregar case en el switch del dashboard.
8. **Frontend — Sidebar:** Agregar item en `sidebarMenu.js` o inline.

### 15.2 Consideraciones

- Si el módulo aplica a múltiples roles, crear el componente en `Shared/`.
- Si el módulo necesita datos globales, considerar agregarlo a `DataContext`.
- Si el módulo solo necesita datos específicos, hacer fetch en el componente.
- Mantener el mismo patrón visual (clases CSS existentes).
- No olvidar `select_related` en el queryset del ViewSet para evitar N+1 queries.

---

## 16. Buenas prácticas del proyecto

### 16.1 Consistencia visual

- Usar las clases CSS existentes (`.card`, `.btn`, `.badge`, `.table-responsive`, etc.).
- Para formularios, usar `.form-group-filter` + `.filter-row`.
- Para grids de dos columnas, usar `.preceptor-form-row--two`.
- No crear nuevos estilos si ya existe uno que cumple la función.

### 16.2 Consistencia de datos

- Los datos de perfil personal se obtienen de las tablas de personas (docentes, preceptores, alumnos, padres_tutores, directivos).
- Los datos de usuario (username, rol) se obtienen del usuario autenticado via `AuthContext`.
- `correo` solo existe en Docente y Preceptor. No intentar mostrarlo en otros roles.
- `fecha_nacimiento` solo existe en Alumno.
- `direccion` solo existe en Alumno y PadreTutor.

### 16.3 Naming de archivos

- Componentes de dashboard: `{Rol}Dashboard.jsx` (AdminDashboard, AlumnoDashboard, etc.)
- Componentes de perfil: `Panel{Rol}.jsx` (PanelDocente, PanelPreceptor, etc.)
- Sidebar menus: `sidebarMenu.js` (exporta `menuItems` array)
- Sidebar component: `sidebar.jsx`
- Header component: `header.jsx`

### 16.4 Manejo de errores

- En DataContext, todas las llamadas tienen `.catch(() => [])` para no romper la carga.
- En componentes individuales, usar try/catch y mostrar mensajes de error.
- Usar `mensajeError(err)` para extraer mensajes de respuesta de API.

### 16.5 Memoización

- Usar `useMemo` para datos derivados (miDocente, misAsignaciones, etc.).
- Usar `useCallback` para funciones que se pasan como props o se usan en useEffect.

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
