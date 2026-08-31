# Modification Flow & Codebase Rules — MiSecundaria7

> **Aplicación:** Monolito Django + React (Vite) · MySQL externo · `managed=False`
> **Autoridad:** Este documento reemplaza cualquier supuesto previo. Seguir al pie de la letra.

---

## 1. Flujo CLI Obligatorio Antes de Toda Modificación

Cada cambio en el código **debe** ejecutar la siguiente cadena de pasos, **en orden**, antes de tocar un solo archivo. Ningún paso es opcional.

### Fase 0 — Contexto del Cambio

```bash
# Registrar el archivo objetivo y el símbolo que se va a modificar.
# Ejemplo: se va a renombrar el campo "direccion" en el modelo Alumno.
TARGET_FIELD="direccion"
TARGET_MODEL="Alumno"
TARGET_FILE="backend/proyecto/escuela/models.py"
```

### Fase 1 — Referencia Global del Símbolo

```bash
# 1a. Búsqueda literal en TODO el repo (archivos de código).
rg --no-heading --line-number "${TARGET_FIELD}" \
  --include='*.py' --include='*.js' --include='*.jsx' --include='*.sql' \
  --include='*.json' --include='*.md' .

# 1b. Búsqueda exacta con word-boundary (evitar falsos positivos parciales).
rg --no-heading --line-number -w "${TARGET_FIELD}" \
  --include='*.py' --include='*.jsx' --include='*.js' .

# 1c. En el esquema SQL de referencia (DDL).
rg --no-heading --line-number "${TARGET_FIELD}" \
  "estructura base de datos/sistema_escolar.sql"
```

**Resultado esperado:** lista completa de TODAS las ubicaciones donde aparece el símbolo. Cada coincidencia debe ser revisada antes de continuar.

### Fase 2 — Cadena de Dependencias del Modelo

```bash
# 2a. Todos los ForeignKey/OneToOne que referencian el modelo.
rg -n "ForeignKey.*${TARGET_MODEL}\|OneToOne.*${TARGET_MODEL}" \
  backend/proyecto/escuela/models.py

# 2b. Serializers que usan el modelo.
rg -n "${TARGET_MODEL}" \
  backend/proyecto/escuela/serializers.py

# 2c. ViewSets que usan el serializer o el modelo.
rg -n "${TARGET_MODEL}\|QuerySet.*${TARGET_MODEL}" \
  backend/proyecto/escuela/views.py

# 2d. Rutas URL que exponen el ViewSet.
rg -n "${TARGET_MODEL}" \
  backend/proyecto/escuela/urls.py

# 2e. Frontend: funciones de api.js que llaman al endpoint del modelo.
rg -n "${TARGET_MODEL}" \
  frontend/src/services/api.js

# 2f. Frontend: componentes que importan o usan esas funciones.
rg -n "${TARGET_MODEL}" \
  frontend/src/ --include='*.jsx' --include='*.js'
```

### Fase 3 — Referencia Cruzada Frontend ↔ Backend

```bash
# 3a. Verificar que cada endpoint del backend tiene su función en api.js.
# Extraer endpoints del backend:
rg -o "router\.register\([^)]*\)" backend/proyecto/escuela/urls.py

# 3b. Verificar que cada función de api.js tiene su consumidor en componentes.
# Para una función específica (ej: getAlumnos):
rg -n "getAlumnos" frontend/src/ --include='*.jsx' --include='*.js'

# 3c. Verificar coherencia de nombres de campos entre serializer y frontend.
# Si el serializer expone "nombre_completo", verificar que el frontend usa ese key.
rg -n "nombre_completo" \
  backend/proyecto/escuela/serializers.py frontend/src/ \
  --include='*.py' --include='*.jsx' --include='*.js'
```

### Fase 4 — Migraciones y Esquema

```bash
# 4a. Verificar que NO existen migraciones pendientes.
ls -la backend/proyecto/escuela/migrations/

# 4b. Buscar si algún modelo tiene managed=True (PROHIBIDO).
rg -n "managed\s*=\s*True" backend/proyecto/escuela/models.py

# 4c. Verificar que el campo existe en el DDL de referencia.
rg -n "${TARGET_FIELD}" \
  "estructura base de datos/sistema_escolar.sql"

# ⚠ IMPORTANTE: El DDL NO es fuente de verdad. El DB live es la autoridad.
# Si hay discrepancia, documentar en DECISIONES.md antes de modificar el modelo.
```

### Fase 5 — Tests

```bash
# 5a. Correr tests del backend (afectados por el cambio).
cd backend && python manage.py test escuela --verbosity=2

# 5b. Correr tests del frontend.
cd frontend && npx vitest run

# 5c. Si hay tests fallidos, DETENERSE. No proceder con la modificación.
```

### Fase 6 — Verificación Post-Modificación

```bash
# 6a. Re-ejecutar Fase 1 con el símbolo nuevo para confirmar reemplazo completo.
rg -w "${NUEVO_SIMBOLO}" --include='*.py' --include='*.jsx' --include='*.js' .

# 6b. Verificar que NO quedaron residuos del símbolo viejo.
rg -w "${TARGET_FIELD}" --include='*.py' --include='*.jsx' --include='*.js' .

# 6c. Lint del backend (si hay configuración).
cd backend && python -m flake8 proyecto/ --max-line-length=120

# 6d. Build del frontend (compila sin errores).
cd frontend && npx vite build

# 6e. Re-ejecutar tests completos.
cd backend && python manage.py test escuela --verbosity=2
cd frontend && npx vitest run
```

---

## 2. Tabla de Referencia de Símbolos Críticos

Cada fila representa una categoría de símbolo con su ubicación de origen y todos los puntos que dependen de ella.

| Símbolo | Ubicación Origen | Puntos de Dependencia |
|---------|-----------------|----------------------|
| Modelo Django (ej: `Alumno`) | `models.py` | `models.py` (FKs), `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `utils.py`, `academico.py`, `test_runner.py`, `tests/*.py`, `management/commands/*.py`, `api.js`, todos los componentes JSX que consumen ese recurso |
| Campo de modelo (ej: `fecha_nacimiento`) | `models.py` | `models.py`, `serializers.py`, `views.py` (filtros/ordering), `admin/*.py`, `api.js` (filtros), componentes JSX (formularios, tablas, filtros) |
| Serializer (ej: `AlumnoListSerializer`) | `serializers.py` | `views.py` (`get_serializer_class`), `tests/` (factories) |
| ViewSet (ej: `AlumnoViewSet`) | `views.py` | `urls.py` (router.register), `permissions.py`, `tests/` |
| Ruta URL (ej: `alumnos`) | `urls.py` | `api.js` (funciones HTTP), `DataContext.jsx` (fetch), componentes JSX |
| Función API frontend (ej: `getAlumnos`) | `api.js` | `DataContext.jsx`, componentes JSX directamente |
| Constante (ej: `ACCION_CREAR`) | `utils.py` | `views.py` (todas las llamadas a `registrar_historial`) |
| Clase de permiso (ej: `PuedeVerHistorial`) | `permissions.py` | `views.py` (`permission_classes`) |
| Variable CSS (ej: `--primary-color`) | `index.css` (`:root`) | `index.css` (referencias) |
| Clase CSS (ej: `.badge-presente`) | `index.css` | JSX (`className="badge-presente"`) |
| Variable de entorno (ej: `DJANGO_SECRET_KEY`) | `settings.py` | `.env.example`, documentación |
| Contexto React (ej: `DataContext`) | `context/DataContext.jsx` | `main.jsx` (Provider), componentes (`useContext(DataContext)`) |

---

## 3. Checklist de Validación: Idioma Español Obligatorio

### 3.1 Variables de Entorno

| # | Verificación | Comando | Estado |
|---|-------------|---------|--------|
| EV-1 | Todas las variables de entorno en `.env.example` usan nombres en español | Revisar `backend/.env.example` y `frontend/.env.example` | ☐ |
| EV-2 | Ninguna variable nueva en inglés se agregue al `.env.example` | `rg -i "^[A-Z_]+=" backend/.env.example frontend/.env.example` — auditar cada nombre | ☐ |
| EV-3 | Las constantes en `settings.py` que leen env vars mantienen el prefijo descriptivo en español cuando sea posible | `rg "os.environ.get" backend/proyecto/settings.py` | ☐ |
| EV-4 | El prefijo `DJANGO_` se mantiene para vars de framework; las de dominio usan nombres en español (`DB_*` es aceptable por ser estándar de Django) | Revisión manual | ☐ |

### 3.2 Esquema de Base de Datos

| # | Verificación | Comando | Estado |
|---|-------------|---------|--------|
| DB-1 | Todos los nombres de tablas en `managed=False` `Meta.db_table` están en español | `rg -n "db_table" backend/proyecto/escuela/models.py` | ☐ |
| DB-2 | Todos los nombres de campos en `models.py` están en español | `rg -n "^\s\+[a-z_]\+ = models\." backend/proyecto/escuela/models.py` | ☐ |
| DB-3 | Ningún `related_name` contiene palabras en inglés | `rg -n "related_name" backend/proyecto/escuela/models.py \| rg -v "[áéíóúñ]"` — verificar cada uno | ☐ |
| DB-4 | Los `verbose_name` y `verbose_name_plural` en `Meta` están en español | `rg -n "verbose_name" backend/proyecto/escuela/models.py` | ☐ |
| DB-5 | El DDL de referencia (`sistema_escolar.sql`) usa nombres en español para tablas y columnas | `rg -n "CREATE TABLE\|CREATE INDEX" "estructura base de datos/sistema_escolar.sql"` | ☐ |
| DB-6 | Ninguna migración introduce nombres en inglés (verificar si se agregan migraciones futuras) | `rg -n "field\|model" backend/proyecto/escuela/migrations/*.py` | ☐ |

### 3.3 Nomenclatura del Código Backend

| # | Verificación | Comando | Estado |
|---|-------------|---------|--------|
| BE-1 | Todos los modelos Django usan nombres PascalCase en español | `rg "^class \w+" backend/proyecto/escuela/models.py` — auditar cada nombre | ☐ |
| BE-2 | Todos los serializers usan sufijo `Serializer` con nombre en español | `rg "^class \w*Serializer" backend/proyecto/escuela/serializers.py` | ☐ |
| BE-3 | Todos los ViewSets usan sufijo `ViewSet` con nombre en español | `rg "^class \w*ViewSet" backend/proyecto/escuela/views.py` | ☐ |
| BE-4 | Todas las funciones helper usan snake_case en español | `rg "^def \|^async def " backend/proyecto/escuela/views.py backend/proyecto/escuela/utils.py` | ☐ |
| BE-5 | Las constantes usan UPPER_SNAKE con palabras en español | `rg "^[A-Z_]+ = " backend/proyecto/escuela/utils.py backend/proyecto/escuela/views.py` | ☐ |
| BE-6 | Las URLs usan kebab-case/plural en español | `rg "router\.register\|path(" backend/proyecto/escuela/urls.py` | ☐ |
| BE-7 | Los comments y docstrings están en español | `rg "^#\|^\"\"\".*\"\"\"" backend/proyecto/escuela/*.py` — muestreo aleatorio | ☐ |
| BE-8 | Las clases de permiso usan nombres en español | `rg "^class \w*" backend/proyecto/escuela/permissions.py` | ☐ |
| BE-9 | Los management commands usan nombres en español | `ls backend/proyecto/escuela/management/commands/` | ☐ |

### 3.4 Nomenclatura del Código Frontend

| # | Verificación | Comando | Estado |
|---|-------------|---------|--------|
| FE-1 | Todos los componentes React usan nombres PascalCase en español | `rg "^export default function\|^function\|^const \w+ =" frontend/src/ --include='*.jsx'` | ☐ |
| FE-2 | Todos los archivos JSX usan nombres en español (excepto `main.jsx`) | `ls frontend/src/components/*/` | ☐ |
| FE-3 | Las funciones en `api.js` usan camelCase en español | `rg "^export (async )?function\|^const \w+ = " frontend/src/services/api.js` | ☐ |
| FE-4 | Las variables de estado usan camelCase en español | `rg "useState\|useRef" frontend/src/ --include='*.jsx' -o | sort -u` — auditar | ☐ |
| FE-5 | Las funciones auxiliares en `utils/` usan camelCase en español | `rg "^export function\|^function\|^const \w+ = " frontend/src/utils/ --include='*.js'` | ☐ |
| FE-6 | Las clases CSS usan kebab-case en español | `rg "^\.[a-z]" frontend/src/index.css` — muestreo | ☐ |
| FE-7 | Las strings UI (labels, mensajes, títulos) están en español | `rg "\"[A-Z]" frontend/src/ --include='*.jsx'` — muestreo | ☐ |
| FE-8 | Las constantes UPPER_SNAKE usan español | `rg "^[A-Z_]\+ =" frontend/src/ --include='*.js' --include='*.jsx'` | ☐ |
| FE-9 | Los nombres de carpetas de componentes están en español (excepto `Shared/`, `Login/`) | `ls frontend/src/components/` | ☐ |

### 3.5 Excepciones Permitidas (Mínimas y Controladas)

| Elemento | Inglés Permitido | Razón |
|----------|-----------------|-------|
| Nombres de framework/library | `useState`, `useEffect`, `createContext`, `ForeignKey`, `QuerySet` | API de terceros, no se puede cambiar |
| Constantes DRF/JWT | `SAFE_METHODS`, `IsAuthenticated`, `AllowAny`, `DEFAULT_AUTHENTICATION_CLASSES` | API de terceros |
| Variables CSS raíz | `--primary-color`, `--sidebar-bg`, `--card-bg` | Convención CSS estándar (documentada en DECISIONES.md §7) |
| Campos de Django Meta | `managed`, `ordering`, `verbose_name` | API de Django, no se puede cambiar |
| Estados React genéricos | `loading`, `error`, `success`, `saving` | Convención React universal (documentada en REGLAS_DESARROLLO.md) |
| Nombres de archivo de config | `package.json`, `requirements.txt`, `vite.config.js` | Estándar del ecosistema |
| Nombre `Dashboard` en `App.jsx` | `function Dashboard()` | Excepción registrada en DECISIONES.md |

**Cualquier nueva excepción debe registrarse en `DECISIONES.md` antes de implementarse.**

---

## 4. Flujo Completo de Modificación (Resumen Ejecutivo)

```
┌─────────────────────────────────────────────────────────┐
│  0. DEFINIR CAMBIO                                      │
│     → Archivo, símbolo, descripción                     │
├─────────────────────────────────────────────────────────┤
│  1. FASE 1: Referencia Global (rg -w)                   │
│     → Lista completa de ubicaciones del símbolo         │
├─────────────────────────────────────────────────────────┤
│  2. FASE 2: Cadena de Dependencias                      │
│     → FKs, Serializers, ViewSets, URLs, api.js, JSX     │
├─────────────────────────────────────────────────────────┤
│  3. FASE 3: Referencia Cruzada Front↔Back               │
│     → Verificar coherencia endpoint↔función↔componente  │
├─────────────────────────────────────────────────────────┤
│  4. FASE 4: Migraciones y Esquema                       │
│     → managed=False intacto, DDL consistente             │
├─────────────────────────────────────────────────────────┤
│  5. CHECKLIST ESPAÑOL                                   │
│     → Verificar 3.1, 3.2, 3.3, 3.4 para el cambio      │
├─────────────────────────────────────────────────────────┤
│  6. APLICAR MODIFICACIÓN                                │
│     → Editar archivos identificados en Fases 1-3        │
├─────────────────────────────────────────────────────────┤
│  7. FASE 6: Verificación Post-Modificación              │
│     → rg residuos, vite build, test backend, test front │
├─────────────────────────────────────────────────────────┤
│  8. DOCUMENTAR                                          │
│     → Actualizar PROYECTO.md si cambian modelos/rutas   │
│     → Actualizar REGLAS_DESARROLLO.md si cambian reglas │
│     → Registrar en DECISIONES.md si se crea excepción   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Reglas de Seguridad Transversales

| # | Regla | Severidad |
|---|-------|-----------|
| S-1 | Nunca commitear archivos `.env` — solo `.env.example` | CRÍTICO |
| S-2 | Nunca exponer `SECRET_KEY` en código fuente ni logs | CRÍTICO |
| S-3 | Nunca ejecutar `makemigrations` o `migrate` — el DB es `managed=False` | CRÍTICO |
| S-4 | Nunca agregar `managed=True` a un modelo existente | CRÍTICO |
| S-5 | Nunca hacer `SELECT *` en queries ORM — siempre `.only()` o campos explícitos | ALTO |
| S-6 | Nunca hardcodear credenciales de BD en código fuente | CRÍTICO |
| S-7 | Nunca saltarse el RBAC (`permission_classes`) al crear ViewSets | CRÍTICO |
| S-8 | Nunca hacer `force_push` o `git push` sin revisión de diff | ALTO |
| S-9 | Siempre verificar `eliminado=True` (soft delete) antes de operaciones CRUD | ALTO |
| S-10 | Nunca renombrar un endpoint URL sin actualizar TODOS los consumidores | CRÍTICO |

---

## 6. Comandos de Referencia Rápida

```bash
# Audit completa: encontrar todo lo que está en inglés en el código
rg -w "(student|teacher|class|grade|attendance|subject|schedule|parent|admin|dashboard|notification|profile|password|email|address|phone|birth|create|update|delete|fetch|submit|cancel|save|edit|remove|add|search|filter|sort|loading|error|success)" \
  --include='*.py' --include='*.jsx' --include='*.js' \
  --glob='!node_modules' --glob='!*.test.*' --glob='!*.config.*' .

# Contar modelos vs serializers vs viewsets
rg -c "^class \w+.*models\.Model" backend/proyecto/escuela/models.py
rg -c "^class \w*Serializer" backend/proyecto/escuela/serializers.py
rg -c "^class \w*ViewSet" backend/proyecto/escuela/views.py

# Verificar que cada modelo tiene serializer y viewset
for model in $(rg "^class (\w+).*models\.Model" -o backend/proyecto/escuela/models.py | sed 's/class //;s/(.*//'); do
  echo "--- ${model} ---"
  echo "Serializer: $(rg -c "${model}Serializer" backend/proyecto/escuela/serializers.py)"
  echo "ViewSet: $(rg -c "${model}" backend/proyecto/escuela/views.py)"
  echo "api.js: $(rg -c "${model}" frontend/src/services/api.js)"
  echo "JSX: $(rg -c "${model}" frontend/src/ --include='*.jsx')"
done

# Verificar que cada URL route tiene su api.js function
rg "router\.register\(" backend/proyecto/escuela/urls.py | rg -o "'[^']+'" | while read route; do
  clean=$(echo "$route" | tr -d "'")
  echo "${clean}: $(rg -c "${clean}" frontend/src/services/api.js)"
done
```

---

## 7. Flujo de Excepciones

Si durante una modificación se detecta que una palabra en inglés es **técnicamente inevitable** (API de terceros, convención de framework):

1. **Documentar** en `DECISIONES.md` con formato:
   ```markdown
   ## DEC-XXX: [Título]
   - **Fecha:** YYYY-MM-DD
   - **Contexto:** [Por qué se necesita esta excepción]
   - **Decisión:** Se permite usar "[palabra]" en [ubicación]
   - **Consecuencias:** [Qué se pierde en consistencia]
   - **Alternativas descartadas:** [Qué se evaluó]
   ```
2. **Actualizar** la tabla de Excepciones Permitidas en este documento (§3.5)
3. **Notificar** al revisor antes de hacer merge

---

*Documento generado el 2026-08-19 · Proyecto MiSecundaria7*
*Revisión: Se actualiza whenever se modifique la estructura del proyecto.*
