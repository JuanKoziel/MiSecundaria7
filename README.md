# MiSecundaria 7

Sistema de gestión escolar con backend Django y frontend React (Vite).

## Requisitos

- Python 3.11+
- Node.js 18+

## Instalación

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
```

### Frontend

```bash
cd frontend
npm install
```

## Ejecución

Abrir **dos terminales**:

### 1. Backend (puerto 8000)

```bash
cd backend
python manage.py runserver
```

### 2. Frontend (puerto 5173)

```bash
cd frontend
npm run dev
```

Abrí http://localhost:5173

## Usuarios de demostración

| Usuario   | Contraseña     | Rol        |
|-----------|----------------|------------|
| admin     | admin123       | Administrador |
| preceptor | preceptor123   | Preceptor  |
| cgomez    | docente123     | Docente    |
| lperez    | docente123     | Docente    |
| familia   | familia123     | Familia    |

La familia `familia` está vinculada a Agustín Hoffer (1°1) y Sofía Martínez (1°2).

## API

Base: `http://127.0.0.1:8000/api/`

- `POST /api/auth/login/` — login (devuelve token)
- `GET /api/me/` — usuario actual
- `GET /api/alumnos/` — listado de alumnos
- `POST /api/calificaciones/bulk/` — guardar notas (docente)
- `POST /api/asistencias-diarias/bulk/` — guardar asistencia (preceptor)
- `POST /api/sesiones-clase/` — guardar asistencia de clase (docente)
- `GET /api/familia/hijos/` — hijos vinculados (familia)
- `GET /api/actas-alumno/?alumno_id=` — actas del alumno

El frontend usa proxy de Vite hacia el backend en desarrollo.

## Variables de entorno (opcional)

```bash
DJANGO_SECRET_KEY=tu-clave-secreta
DJANGO_DEBUG=True
```
