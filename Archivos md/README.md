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

# tests (crean una base `test_*` aparte; nunca tocan la real)
python manage.py test escuela
```

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
