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

Detalles en `Archivos md/DOCUMENTACION_TECNICA.md` y
`Archivos md/HISTORIAL.md` §16.

Para que los tests puedan crear su base efímera, el usuario de la aplicación
necesita el privilegio sobre el patrón `test\_%`:

```sql
GRANT ALL PRIVILEGES ON `test\_%`.* TO 'misecundaria7'@'%';
FLUSH PRIVILEGES;
```

Detalles en `Archivos md/DOCUMENTACION_TECNICA.md` §14.3 y
`Archivos md/REFERENCIA_BD.md` §19.

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

## Git

El repositorio ignora dependencias instaladas, entornos virtuales y archivos temporales mediante `.gitignore`.
