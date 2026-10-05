# MiSecundaria7

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

## Esquema de la base (importante)

Todos los modelos de `escuela` usan `managed = False`: `migrate` **no** crea ni
altera esas tablas. Para ampliar el esquema físico hay que pasar por la
especificación declarativa de `backend/proyecto/escuela/schema.py`.

```bash
# comparar el esquema físico con los modelos (sale con código 1 si hay desvío)
python manage.py verificar_esquema

# aplicar el DDL faltante (idempotente y no destructivo)
python manage.py verificar_esquema --aplicar

# aplicar las migraciones (incluye la sincronización del esquema)
python manage.py migrate

# garantizar los estados de asistencia base (idempotente; ya lo hace la
# migración 0008, sirve para reponerlos si alguien los borró)
python manage.py seed_estados_asistencia

# tests (crean una base `test_*` aparte; nunca tocan la real)
python manage.py test escuela
```

## Datos maestros (Administración → Configuración)

Los catálogos base —ciclos lectivos, módulos horarios, períodos de evaluación,
estados de asistencia y tipos de acta— se administran desde
**Administración → Configuración** (solo `admin` y `director`), sin necesidad de
`INSERT` manuales en MariaDB. Crear, editar, desactivar y reactivar está
disponible en pantalla; donde el registro está en uso, la interfaz lo explica y
la API responde `HTTP 400` en vez de fallar.

Dos comandos de diagnóstico recorren el flujo completo contra la base real
(crean datos de prueba y **los borran al terminar**):

```bash
# flujo mínimo de punta a punta + guardas de borrado + permisos
python manage.py verificar_flujo_configuracion

# borrar datos de una corrida anterior que haya quedado a medias
python manage.py verificar_flujo_configuracion --limpiar
```

Detalles en `docs/DOCUMENTACION_TECNICA.md` y
`docs/HISTORIAL.md` §16.

Para que los tests puedan crear su base efímera, el usuario de la aplicación
necesita el privilegio sobre el patrón `test\_%`:

```sql
GRANT ALL PRIVILEGES ON `test\_%`.* TO 'misecundaria7'@'%';
FLUSH PRIVILEGES;
```

Detalles en `docs/DOCUMENTACION_TECNICA.md` §14.3 y
`docs/REFERENCIA_BD.md` §19.

## Despliegue del frontend

El frontend se sirve desde un host externo, no desde este servidor. El build
incluye el `base` path `/misecundaria7/`, así que hay que subir el contenido de
`frontend/dist` (o el zip `frontend/misecundaria7-frontend.zip`) a la raíz del
sitio, de modo que los assets queden bajo `/misecundaria7/`.

```bash
cd frontend
npm run build
cd dist && zip -r -X ../misecundaria7-frontend.zip . -x '.*' && cd ..
```

## Documentación

Todo en [`docs/`](docs):

- [`DOCUMENTACION_TECNICA.md`](docs/DOCUMENTACION_TECNICA.md) — arquitectura, esquema de BD, despliegue
- [`REFERENCIA_BD.md`](docs/REFERENCIA_BD.md) — modelo de datos tabla por tabla
- [`HISTORIAL.md`](docs/HISTORIAL.md) — bitácora de cambios
- [`REGLAS_DESARROLLO.md`](docs/REGLAS_DESARROLLO.md) — reglas de código
- [`ESTANDARES_UI.md`](docs/ESTANDARES_UI.md) y [`VISUAL_STANDARD.md`](docs/VISUAL_STANDARD.md) — criterios visuales
- [`GUIA_TESTEO_MiSecundaria7.md`](docs/GUIA_TESTEO_MiSecundaria7.md) — cómo probar
- [`PLAN_*.md`](docs) — planes de correcciones y pendientes
- [`RELEVAMIENTO_SISTEMA_SECUNDARIA7.md`](docs/RELEVAMIENTO_SISTEMA_SECUNDARIA7.md) y [`REQUERIMIENTOS_SISTEMA_SECUNDARIA7.md`](docs/REQUERIMIENTOS_SISTEMA_SECUNDARIA7.md) — relevamiento y requisitos
- [`docs/_backup/`](docs/_backup) — versiones anteriores de los análisis (consulta histórica)

## Git

El repositorio ignora dependencias instaladas, entornos virtuales y archivos temporales mediante `.gitignore`.
