# 📚 Documentación API - MiSecundaria7

## 🔐 Autenticación

### Login
**POST** `/api/auth/login/`

Realiza el login del usuario y retorna tokens JWT.

**Request:**
```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "usuario": {
    "id_usuario": 1,
    "usuario": "admin",
    "estado": true,
    "roles": [...],
    "rol_nombres": ["admin"]
  },
  "rol_actual": "admin"
}
```

### Refresh Token
**POST** `/api/auth/refresh/`

Refresca el access token usando el refresh token.

**Request:**
```json
{
  "refresh": "token_refresh_aqui"
}
```

**Response (200 OK):**
```json
{
  "access": "nuevo_token_access"
}
```

### Logout
**POST** `/api/auth/logout/`

Valida que el usuario esté autenticado (no hace nada especial).

**Headers requeridos:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "mensaje": "Sesión cerrada correctamente"
}
```

---

## 👥 Usuarios

### Obtener usuario actual
**GET** `/api/usuarios/me/`

Obtiene los datos del usuario autenticado.

**Response (200 OK):**
```json
{
  "id_usuario": 1,
  "usuario": "admin",
  "estado": true,
  "ultimo_acceso": "2026-05-29T10:30:00Z",
  "roles": [...],
  "rol_nombres": ["admin"]
}
```

### Listar todos los usuarios (solo admin)
**GET** `/api/usuarios/`

**Parámetros query opcionales:**
- `search`: Buscar por usuario
- `page`: Número de página (default: 1)

### Crear usuario (solo admin)
**POST** `/api/usuarios/`

**Request:**
```json
{
  "usuario": "nuevo_usuario",
  "contrasena": "password123",
  "estado": true,
  "roles": [1, 2]
}
```

---

## 👨‍🏫 Docentes

### Obtener perfil del docente autenticado
**GET** `/api/docentes/me/`

**Response (200 OK):**
```json
{
  "id_docente": 1,
  "nombre": "Juan",
  "apellido": "García",
  "dni": "25123456",
  "correo": "juan@escuela.com",
  "telefono": "1123456789",
  "usuario": {
    "id_usuario": 2,
    "usuario": "prof_juan",
    "estado": true
  },
  "cursos_materias": [
    {
      "id_curso_materia": 1,
      "id_curso": 1,
      "materia": {
        "id_materia": 1,
        "nombre_materia": "Matemática"
      },
      "docente": {...},
      "horarios": [...]
    }
  ]
}
```

### Listar docentes
**GET** `/api/docentes/`

**Parámetros query:**
- `search`: Buscar por nombre, apellido, dni
- `dni`: Filtrar por DNI
- `correo`: Filtrar por correo

### Obtener docente específico
**GET** `/api/docentes/{id}/`

### Crear docente (solo admin)
**POST** `/api/docentes/`

**Request:**
```json
{
  "nombre": "María",
  "apellido": "López",
  "dni": "26987654",
  "correo": "maria@escuela.com",
  "telefono": "1187654321",
  "usuario_id": 3
}
```

---

## 👨‍🎓 Alumnos

### Obtener perfil del alumno autenticado
**GET** `/api/alumnos/me/`

**Response (200 OK):**
```json
{
  "id_alumno": 1,
  "nombre": "Lucas",
  "apellido": "Martínez",
  "dni": "29777666",
  "fecha_nacimiento": "2010-05-15",
  "direccion": "Calle Principal 123",
  "telefono": "1155556666",
  "procedencia": "Primaria Local",
  "usuario": {...},
  "tutor": {...},
  "curso": {...}
}
```

### Listar alumnos (según permisos)
**GET** `/api/alumnos/`

**Parámetros query:**
- `search`: Buscar por nombre, apellido, dni
- `dni`: Filtrar por DNI
- `id_curso`: Filtrar por curso

**Permisos:**
- Admin: ve todos
- Preceptor: ve alumnos de sus cursos
- Docente: ve alumnos de sus clases
- Familia: ve solo sus hijos
- Alumno: ve solo su información

### Obtener alumno específico
**GET** `/api/alumnos/{id}/`

### Crear alumno (solo admin)
**POST** `/api/alumnos/`

**Request:**
```json
{
  "nombre": "Lucas",
  "apellido": "Martínez",
  "dni": "29777666",
  "fecha_nacimiento": "2010-05-15",
  "direccion": "Calle Principal 123",
  "telefono": "1155556666",
  "procedencia": "Primaria Local",
  "usuario_id": 8,
  "id_tutor": 1,
  "id_curso": 1
}
```

---

## 👨‍👩‍👧 Padres/Tutores

### Obtener perfil del padre/tutor autenticado
**GET** `/api/padres/me/`

**Response (200 OK):**
```json
{
  "id_tutor": 1,
  "nombre": "Anna",
  "apellido": "Martínez",
  "dni": "28999888",
  "telefono": "1155556666",
  "direccion": "Calle Principal 123",
  "usuario": {...},
  "hijos": [
    {
      "id_alumno": 1,
      "nombre": "Lucas",
      "apellido": "Martínez",
      "dni": "29777666",
      ...
    }
  ]
}
```

### Listar padres/tutores (solo admin)
**GET** `/api/padres/`

**Parámetros query:**
- `search`: Buscar por nombre, apellido, dni
- `dni`: Filtrar por DNI

---

## 📚 Cursos y Materias

### Listar cursos
**GET** `/api/cursos/`

**Parámetros query:**
- `search`: Buscar por nombre_curso, turno
- `id_ciclo`: Filtrar por ciclo lectivo

### Obtener curso específico
**GET** `/api/cursos/{id}/`

### Listar materias
**GET** `/api/materias/`

**Parámetros query:**
- `search`: Buscar por nombre_materia

### Listar relaciones curso-materia-docente
**GET** `/api/curso-materia/`

**Parámetros query:**
- `id_curso`: Filtrar por curso
- `id_docente`: Filtrar por docente

### Listar ciclos lectivos
**GET** `/api/ciclos-lectivos/`

---

## 🔒 Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Solicitud exitosa sin contenido |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 👥 Roles y Permisos

### Roles disponibles
- **admin**: Acceso total al sistema
- **docente**: Puede ver alumnos y calificar
- **preceptor**: Gestiona asistencia y comunicados
- **familia**: Ve calificaciones y asistencia de sus hijos
- **alumno**: Ve su propia información académica

### Filtrado automático según rol

Muchos endpoints retornan datos filtrados según el rol del usuario autenticado:

**Docente:**
- Ve solo alumnos de sus clases
- Ve solo sus materias

**Preceptor:**
- Ve alumnos de sus cursos
- Ve docentes de su institución

**Familia:**
- Ve solo a sus hijos

**Alumno:**
- Ve solo su información

---

## 📖 Ejemplos de uso en Frontend

### Usando el cliente API

```javascript
import apiClient from './services/apiClient';

// Login
async function handleLogin(usuario, contrasena) {
  try {
    const response = await apiClient.login(usuario, contrasena);
    console.log('Login exitoso:', response.usuario);
  } catch (error) {
    console.error('Error de login:', error);
  }
}

// Obtener perfil del usuario actual
async function loadCurrentUser() {
  try {
    const user = await apiClient.getCurrentUser();
    console.log('Usuario:', user);
  } catch (error) {
    console.error('Error cargando usuario:', error);
  }
}

// Obtener alumnos (filtrado por rol)
async function loadAlumnos() {
  try {
    const response = await apiClient.getAlumnos({
      search: 'lucas',
      page: 1
    });
    console.log('Alumnos:', response.results);
  } catch (error) {
    console.error('Error cargando alumnos:', error);
  }
}

// Obtener perfil del docente con sus materias
async function loadDocentePerfil() {
  try {
    const perfil = await apiClient.getDocentePerfil();
    console.log('Perfil docente:', perfil);
    console.log('Materias del docente:', perfil.cursos_materias);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🚀 Iniciar Backend

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py crear_datos_prueba
python manage.py runserver
```

El servidor estará disponible en: `http://localhost:8000`
La API estará en: `http://localhost:8000/api`

---

## ✅ Datos de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | admin |
| prof_juan | docente123 | docente |
| prof_maria | docente123 | docente |
| preceptor_carlos | preceptor123 | preceptor |
| familia_anna | familia123 | familia |
| alumno_lucas | alumno123 | alumno |

