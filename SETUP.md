# 🎓 MiSecundaria7 - Sistema de Gestión Escolar

## 📋 Descripción

MiSecundaria7 es un sistema integral de gestión escolar desarrollado con **React** (frontend) y **Django** (backend). Permite a administradores, docentes, preceptores y familias gestionar y acceder a información académica de manera segura.

## 🏗️ Arquitectura

### Frontend (React + Vite)
- **Vite**: Build tool moderno y rápido
- **React 18**: Framework de UI
- **Componentes por rol**: Dashboards específicos para cada tipo de usuario
- **Cliente HTTP**: Integración completa con la API REST

### Backend (Django + DRF)
- **Django 6.0.5**: Framework web de Python
- **Django REST Framework**: API REST robusta
- **Autenticación JWT**: Tokens seguros con djangorestframework-simplejwt
- **MySQL**: Base de datos relacional
- **CORS**: Comunicación segura entre frontend y backend

## 🚀 Requisitos Previos

- Python 3.8+
- Node.js 16+
- MySQL 5.7+
- Git

## 📦 Instalación y Configuración

### Backend

#### 1. Navegar a la carpeta del backend
```bash
cd backend
```

#### 2. Crear y activar entorno virtual
```bash
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
```

#### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

#### 4. Configurar BD MySQL
La base de datos ya está configurada en `proyecto/settings.py`:
- **Host**: 127.0.0.1
- **Puerto**: 3306
- **Usuario**: alumno
- **Contraseña**: alumno
- **BD**: sistema_escolar

Asegúrate de que MySQL esté corriendo:
```bash
# En Linux
sudo service mysql status

# En macOS
brew services list

# En Windows
mysql --version
```

#### 5. Aplicar migraciones
```bash
python manage.py migrate
```

#### 6. Crear datos de prueba
```bash
python manage.py crear_datos_prueba
```

#### 7. Iniciar servidor Django
```bash
python manage.py runserver
```

El backend estará disponible en: **http://localhost:8000**
La API estará en: **http://localhost:8000/api**

### Frontend

#### 1. Navegar a la carpeta del frontend
```bash
cd frontend
```

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Crear archivo .env (opcional)
```bash
REACT_APP_API_URL=http://localhost:8000/api
```

Si no se especifica, por defecto es `http://localhost:8000/api`

#### 4. Iniciar servidor Vite
```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol | Acceso a |
|---------|-----------|-----|---------|
| **admin** | admin123 | Admin | Todo el sistema |
| **prof_juan** | docente123 | Docente | Mis alumnos, mis clases |
| **prof_maria** | docente123 | Docente | Mis alumnos, mis clases |
| **preceptor_carlos** | preceptor123 | Preceptor | Alumnos, asistencia |
| **familia_anna** | familia123 | Familia | Info de sus hijos |
| **alumno_lucas** | alumno123 | Alumno | Su propia información |

## 🔐 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario ingresa credenciales en el frontend              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/auth/login/ con usuario y contraseña           │
│    Validar credenciales en BD                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Retornar tokens JWT (access + refresh)                   │
│    Información del usuario con sus roles                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend almacena tokens en localStorage                 │
│    Renderiza dashboard según rol del usuario                │
└─────────────────────────────────────────────────────────────┘
```

## 📚 API REST

### Endpoints Principales

#### Autenticación
- **POST** `/api/auth/login/` - Login
- **POST** `/api/auth/refresh/` - Refrescar token
- **POST** `/api/auth/logout/` - Logout

#### Usuarios
- **GET** `/api/usuarios/` - Listar usuarios (admin)
- **GET** `/api/usuarios/me/` - Perfil del usuario actual
- **POST** `/api/usuarios/` - Crear usuario (admin)

#### Docentes
- **GET** `/api/docentes/` - Listar docentes
- **GET** `/api/docentes/me/` - Perfil del docente autenticado
- **GET** `/api/docentes/{id}/` - Obtener docente

#### Alumnos
- **GET** `/api/alumnos/` - Listar alumnos (filtrado por rol)
- **GET** `/api/alumnos/me/` - Perfil del alumno autenticado
- **POST** `/api/alumnos/` - Crear alumno

#### Padres/Tutores
- **GET** `/api/padres/` - Listar padres
- **GET** `/api/padres/me/` - Perfil con hijos

#### Académico
- **GET** `/api/cursos/` - Listar cursos
- **GET** `/api/materias/` - Listar materias
- **GET** `/api/curso-materia/` - Relaciones curso-materia-docente
- **GET** `/api/ciclos-lectivos/` - Ciclos lectivos

Para más detalles, ver [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🎯 Funcionalidades por Rol

### 👤 Administrador
- ✅ Gestión de usuarios (crear, editar, eliminar)
- ✅ Gestión de docentes
- ✅ Gestión de alumnos
- ✅ Gestión de preceptores
- ✅ Visualizar todas las calificaciones
- ✅ Visualizar todas las asistencias

### 👨‍🏫 Docente
- ✅ Ver lista de alumnos
- ✅ Registrar asistencia
- ✅ Cargar calificaciones
- ✅ Crear planificaciones
- ✅ Ver sus materias y horarios

### 👨‍⚖️ Preceptor
- ✅ Gestionar alumnos del curso
- ✅ Registrar asistencias
- ✅ Ver docentes
- ✅ Ver calificaciones
- ✅ Generar comunicados

### 👨‍👩‍👧 Familia
- ✅ Ver calificaciones de sus hijos
- ✅ Ver asistencias
- ✅ Leer comunicados
- ✅ Ver actas relevantes
- ✅ Resumen académico

### 👨‍🎓 Alumno
- ✅ Ver su información personal
- ✅ Ver sus calificaciones (próximamente)
- ✅ Ver su asistencia (próximamente)

## 🔒 Seguridad

### Implementado
- ✅ **Autenticación JWT**: Tokens que expiran en 1 hora
- ✅ **Refresh Token**: Válido por 7 días
- ✅ **Validación de permisos**: Por rol a nivel de API
- ✅ **CORS**: Solo permite frontend en localhost
- ✅ **Encriptación de contraseñas**: SHA256 + salt
- ✅ **Filtrado automático**: Datos filtrados según rol del usuario

### A Mejorar (Producción)
- [ ] HTTPS obligatorio
- [ ] Rate limiting
- [ ] 2FA (Autenticación de dos factores)
- [ ] Audit logging más detallado
- [ ] Refresh token rotation automático

## 🛠️ Estructura de Carpetas

```
MiSecundaria7/
├── backend/
│   ├── gestion_escolar/
│   │   ├── models.py              # Modelos de BD
│   │   ├── views.py               # Vistas REST API
│   │   ├── serializers.py         # Serializadores
│   │   ├── urls.py                # Rutas de API
│   │   ├── admin.py               # Admin de Django
│   │   └── management/
│   │       └── commands/
│   │           └── crear_datos_prueba.py
│   ├── proyecto/
│   │   ├── settings.py            # Configuración Django
│   │   ├── urls.py                # Rutas principales
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login/
│   │   │   ├── Administracion/
│   │   │   ├── Profesores/
│   │   │   ├── Preceptores/
│   │   │   └── Familia/
│   │   ├── services/
│   │   │   └── apiClient.js       # Cliente HTTP
│   │   ├── App.jsx                # Componente principal
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── API_DOCUMENTATION.md           # Documentación de API
└── README.md                      # Este archivo
```

## 🔄 Flujo de Desarrollo

### 1. Crear nueva funcionalidad en Backend

```python
# 1. Agregar modelo en models.py (si es necesario)
# 2. Crear migrations
python manage.py makemigrations

# 3. Aplicar migrations
python manage.py migrate

# 4. Crear serializer en serializers.py
# 5. Crear view en views.py
# 6. Agregar ruta en urls.py
```

### 2. Consumir API en Frontend

```javascript
// Usar apiClient para llamar a la API
import apiClient from './services/apiClient';

// GET
const data = await apiClient.getAlumnos();

// POST
const newAlumno = await apiClient.createAlumno({
  nombre: 'Juan',
  apellido: 'Pérez',
  ...
});

// PUT
const updated = await apiClient.updateAlumno(id, data);

// DELETE
await apiClient.delete(`/alumnos/${id}/`);
```

## 📝 Comandos Útiles

### Backend

```bash
# Crear superusuario Django
python manage.py createsuperuser

# Ver BD de Django
python manage.py shell

# Crear datos de prueba
python manage.py crear_datos_prueba

# Ejecutar tests
python manage.py test

# Ver queries SQL generadas
python manage.py runserver --verbosity=2
```

### Frontend

```bash
# Build para producción
npm run build

# Preview del build
npm run preview

# Linter (si está configurado)
npm run lint
```

## 🐛 Troubleshooting

### Error de conexión a BD
```
django.db.utils.OperationalError: (1045, "Access denied for user 'alumno'@'localhost'")
```
**Solución**: Verificar que MySQL esté corriendo y las credenciales sean correctas en `settings.py`

### Error de CORS
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución**: Agregar el origen del frontend en `CORS_ALLOWED_ORIGINS` en `settings.py`

### Token expirado
```
401 Unauthorized: Token is invalid
```
**Solución**: El apiClient intenta refrescar automáticamente. Si falla, debe hacer login nuevamente.

## 📊 Próximas Mejoras

- [ ] Panel de alumno completo
- [ ] Implementar calificaciones y asistencias en API
- [ ] Sistema de notificaciones en tiempo real
- [ ] Reportes en PDF
- [ ] Integración con correo electrónico
- [ ] Aplicación móvil
- [ ] Dashboard analítico
- [ ] Calendario escolar

## 📄 Licencia

Este proyecto es de uso educativo. Todos los derechos reservados.

## 👨‍💻 Autor

Desarrollado para MiSecundaria7 - Sistema de Gestión Escolar

---

**¿Preguntas o problemas?** Revisa la [documentación de API](./API_DOCUMENTATION.md) o contacta al equipo de desarrollo.
