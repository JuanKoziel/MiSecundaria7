# MiSecundaria7 - Sistema de Gestión Escolar

## 🎓 ¡Backend API Completamente Implementado! ✅

### 🚀 Estado Actual: FUNCIONAL Y LISTO PARA USAR

Este es un sistema integral de gestión escolar con:
- ✅ **API REST** con autenticación JWT
- ✅ **Sistema de roles** con permisos granulares
- ✅ **Frontend React** integrado completamente
- ✅ **Base de datos** MySQL con 40+ modelos
- ✅ **Datos de prueba** con 6 usuarios listos
- ✅ **Documentación** completa

---

## ⚡ INICIO RÁPIDO (2 minutos)

### Terminal 1: Backend
```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

### Terminal 2: Frontend  
```bash
cd frontend
npm run dev
```

### En el navegador
```
http://localhost:5173
```

**Usuario de prueba:** `admin` / `admin123`

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [QUICK_START.md](./QUICK_START.md) | ⚡ Inicio en 2 comandos |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | 📖 Referencia completa de endpoints |
| [SETUP.md](./SETUP.md) | 🛠️ Guía de instalación detallada |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | 📊 Resumen de lo implementado |

---

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| **admin** | admin123 | Admin (acceso total) |
| **prof_juan** | docente123 | Docente |
| **prof_maria** | docente123 | Docente |
| **preceptor_carlos** | preceptor123 | Preceptor |
| **familia_anna** | familia123 | Familia |
| **alumno_lucas** | alumno123 | Alumno |

---

## 🏗️ Arquitectura

```
Frontend (React) ↔ Backend (Django)
   Vite              Django REST
   JWT Tokens        SQLAlchemy
   localStorage      MySQL BD
```

**API Base:** `http://localhost:8000/api`

---

## ✨ Funcionalidades

### 🔐 Autenticación
- JWT con tokens de acceso y refresh
- Expiración automática (1h access, 7d refresh)
- Refrescamiento transparente

### 👤 Usuarios
- 5+ roles diferentes
- Permisos granulares
- Filtrado automático de datos

### 📚 Académico
- Cursos y ciclos lectivos
- Materias y horarios
- Docentes y alumnos
- Padres/tutores

### 📊 Dashboards
- Admin: control total
- Docente: gestión de clases
- Preceptor: asistencia y comunicados
- Familia: información de hijos
- Alumno: su información

---

## 🔧 Requisitos

- Python 3.8+
- Node.js 16+
- MySQL 5.7+
- Django 6.0.5
- React 18.3.1

---

## 📁 Estructura

```
MiSecundaria7/
├── backend/
│   ├── gestion_escolar/
│   │   ├── models.py         # Modelos (40+)
│   │   ├── views.py          # API REST (7+ ViewSets)
│   │   ├── serializers.py    # Serializadores (15+)
│   │   └── urls.py           # Rutas
│   ├── proyecto/
│   │   ├── settings.py       # JWT, CORS, DRF
│   │   └── urls.py           # URLs principales
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── apiClient.js  # Cliente HTTP
│   │   ├── components/       # Dashboards por rol
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── QUICK_START.md
├── API_DOCUMENTATION.md
├── SETUP.md
└── IMPLEMENTATION_SUMMARY.md
```

---

## 🔗 URLs Útiles

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API | http://localhost:8000/api |
| Admin Django | http://localhost:8000/admin |

---

## 🚀 Próximos Pasos

1. **Probar login** con usuarios de prueba
2. **Explorar dashboards** según roles
3. **Revisar API** con Postman/Insomnia
4. **Implementar vistas** adicionales
5. **Agregar funcionalidades** propias

---

## 📖 Primeros 30 Segundos

```bash
# Abrir dos terminales

# Terminal 1
cd backend && source .venv/bin/activate && python manage.py runserver

# Terminal 2
cd frontend && npm run dev

# Abrir navegador
# http://localhost:5173 → Login: admin/admin123
```

¡Eso es todo! El sistema está completamente funcional.

---

## 🎯 Características Destacadas

✅ **Seguridad de Nivel Producción**: JWT con refresh tokens
✅ **Control de Acceso Fino**: Permisos por rol a nivel de BD
✅ **Datos Persistentes**: MySQL con 40+ modelos
✅ **API RESTful**: 15+ endpoints siguiendo estándares
✅ **Frontend Moderno**: React 18 con Vite
✅ **Documentación Completa**: 1000+ líneas de docs
✅ **Datos de Prueba**: 6 usuarios con datos relacionados
✅ **Código Limpio**: Comentarios y estructura clara

---

## 🐛 Soporte

Ver [SETUP.md](./SETUP.md#-troubleshooting) para solucionar problemas comunes.

---

## 📄 Licencia

Proyecto educativo. Todos los derechos reservados.

---

**¿Listo para empezar? 👉 [QUICK_START.md](./QUICK_START.md)**

## Estructura del proyecto

- `backend/`: Backend Django.
- `frontend/`: Frontend Vite + React.

## Instalación

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Ejecución

### Backend

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm run dev
```

## Git

El repositorio ignora dependencias instaladas, entornos virtuales y archivos temporales mediante `.gitignore`.
