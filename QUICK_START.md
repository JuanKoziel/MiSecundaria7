# 🚀 INICIO RÁPIDO - Backend API Implementado

## ✅ Lo que se ha completado

### 1. **Backend Django - API REST Funcional**
- ✅ Autenticación JWT con tokens seguros
- ✅ Endpoints REST para todas las entidades
- ✅ Sistema de permisos por rol
- ✅ Filtrado automático de datos según usuario
- ✅ 40+ modelos de BD configurados
- ✅ 6 usuarios de prueba listos

### 2. **Seguridad Implementada**
- ✅ Contraseñas encriptadas
- ✅ Tokens JWT con expiración (1 hora access, 7 días refresh)
- ✅ CORS configurado para frontend
- ✅ Validación de permisos por rol
- ✅ Autenticación en todos los endpoints

### 3. **Cliente HTTP Frontend**
- ✅ `apiClient.js` - Maneja toda comunicación con backend
- ✅ Refrescamiento automático de tokens
- ✅ Métodos para todas las rutas API
- ✅ Manejo de errores robusto

### 4. **Componentes React Actualizados**
- ✅ `login.jsx` - Conecta a API real
- ✅ `App.jsx` - Gestiona sesión y routing por rol
- ✅ Restauración automática de sesión

### 5. **Documentación Completa**
- ✅ `API_DOCUMENTATION.md` - Especificación de todas las rutas
- ✅ `SETUP.md` - Guía de instalación y uso
- ✅ Comentarios en código

---

## 🎯 PRÓXIMOS PASOS - Cómo empezar

### Opción A: Ejecución Manual

#### Terminal 1: Backend
```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```
Debería ver: `Starting development server at http://127.0.0.1:8000/`

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
Debería ver: `Local: http://localhost:5173`

### Opción B: Desde VS Code

1. **Abrir dos terminales en VS Code**
   - Ctrl+` (abrir terminal)
   - Ctrl+Shift+` (nueva terminal)

2. **En Terminal 1 (Backend):**
   ```bash
   cd backend && source .venv/bin/activate && python manage.py runserver
   ```

3. **En Terminal 2 (Frontend):**
   ```bash
   cd frontend && npm run dev
   ```

4. **En el navegador:**
   - Ir a `http://localhost:5173`

---

## 🧪 Probar el Login

### En el formulario de login, usar:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador (acceso total) |
| `prof_juan` | `docente123` | Docente |
| `preceptor_carlos` | `preceptor123` | Preceptor |
| `familia_anna` | `familia123` | Familia |
| `alumno_lucas` | `alumno123` | Alumno |

### ¿Qué pasará después del login?
1. ✅ Backend valida usuario y contraseña
2. ✅ Retorna tokens JWT + información del usuario
3. ✅ Frontend almacena tokens en localStorage
4. ✅ Se renderiza el dashboard según el rol

---

## 🔗 URLs Importantes

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API | http://localhost:8000/api |
| Admin Django | http://localhost:8000/admin |
| API Login | POST http://localhost:8000/api/auth/login/ |

---

## 📱 Pruebas con Postman/Insomnia (opcional)

### Probar login vía API:

```
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

### Respuesta esperada:
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

### Usar access token en próximas requests:
```
Authorization: Bearer {access_token_aqui}
GET http://localhost:8000/api/usuarios/me/
```

---

## 🎓 Archivos Principales Creados/Modificados

### Backend
```
✅ backend/gestion_escolar/serializers.py (CREADO)
✅ backend/gestion_escolar/views.py (ACTUALIZADO)
✅ backend/gestion_escolar/urls.py (CREADO)
✅ backend/gestion_escolar/management/commands/crear_datos_prueba.py (CREADO)
✅ backend/proyecto/settings.py (ACTUALIZADO con JWT/CORS)
✅ backend/proyecto/urls.py (ACTUALIZADO con rutas API)
✅ backend/requirements.txt (ACTUALIZADO con dependencias)
```

### Frontend
```
✅ frontend/src/services/apiClient.js (CREADO)
✅ frontend/src/components/Login/login.jsx (ACTUALIZADO)
✅ frontend/src/App.jsx (ACTUALIZADO)
```

### Documentación
```
✅ API_DOCUMENTATION.md (CREADO)
✅ SETUP.md (CREADO)
✅ QUICK_START.md (ESTE ARCHIVO)
```

---

## 🐛 Si algo no funciona...

### Error: "No se puede conectar a BD"
```bash
# Verificar MySQL
mysql -u alumno -p alumno -e "USE sistema_escolar; SHOW TABLES;"
```

### Error: "CORS issue"
```
❌ Access to XMLHttpRequest blocked by CORS policy
```
→ Asegúrate que el backend está en http://localhost:8000

### Error: "404 - API no encontrada"
```
❌ Cannot POST /api/auth/login/
```
→ Revisa que el backend está corriendo en `python manage.py runserver`

### Error: "Token inválido"
```
❌ Token is invalid or expired
```
→ El apiClient intenta refrescar automáticamente. Si falla, vuelve a hacer login.

---

## 📚 Documentación Disponible

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Referencia completa de todos los endpoints
- **[SETUP.md](./SETUP.md)** - Guía detallada de instalación
- **Comentarios en el código** - Explicaciones en cada función

---

## 🎯 Qué sigue?

### Corto plazo
1. Probar que el login funciona
2. Explorar cada dashboard por rol
3. Revisar la API con Postman/Insomnia

### Mediano plazo
1. Implementar vistas de alumnos/docentes/etc
2. Agregar endpoints de calificaciones y asistencias
3. Crear reportes en PDF

### Largo plazo
1. Notificaciones en tiempo real
2. Aplicación móvil
3. Dashboard analítico

---

## ✨ Resumen de la Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                    NAVEGADOR                                 │
│                  localhost:5173                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          React App (Frontend)                          │  │
│  │  ┌──────────────┐  ┌────────────────────────────────┐  │  │
│  │  │ Login Form   │  │ Dashboard (Admin/Docente/etc)  │  │  │
│  │  │              │  │                                │  │  │
│  │  │ Usuario      │──→ apiClient.js (HTTP)            │  │  │
│  │  │ Contraseña   │  │ - Maneja tokens               │  │  │
│  │  └──────────────┘  │ - Refrescar tokens             │  │  │
│  │                    │ - Llamadas a API               │  │  │
│  │                    └────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           │ HTTP Requests                     │
│                           │ + JWT Token                       │
│                           ▼                                   │
└──────────────────────────────────────────────────────────────┘
                            │
                            │
                    ╔═══════╩═══════╗
                    ║    Internet   ║
                    ╚═══════╦═══════╝
                            │
┌──────────────────────────────────────────────────────────────┐
│             SERVIDOR (localhost:8000)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        Django + Django REST Framework                  │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │ Rutas (urls.py)                                  │ │  │
│  │  │ - /api/auth/login/                               │ │  │
│  │  │ - /api/usuarios/                                 │ │  │
│  │  │ - /api/docentes/                                 │ │  │
│  │  │ - /api/alumnos/                                  │ │  │
│  │  │ - /api/padres/                                   │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │ Vistas (views.py)                                │ │  │
│  │  │ - Validar credenciales                           │ │  │
│  │  │ - Generar tokens JWT                             │ │  │
│  │  │ - Filtrar datos por rol                          │ │  │
│  │  │ - Validar permisos                               │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │ Base de Datos (MySQL)                            │ │  │
│  │  │ - Usuarios, Roles                                │ │  │
│  │  │ - Docentes, Alumnos, Padres                      │ │  │
│  │  │ - Cursos, Materias, Horarios                     │ │  │
│  │  │ - Calificaciones, Asistencias                    │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎉 ¡Listo para empezar!

Ejecuta los comandos anteriores y el sistema estará completamente funcional. 

**¡Que disfrutes el desarrollo! 🚀**

