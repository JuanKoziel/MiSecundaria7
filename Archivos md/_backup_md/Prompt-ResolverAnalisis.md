# Prompt — Resolver hallazgos CRÍTICO / ALTO / P0 de los Análisis

> Copiá **todo este archivo** (desde «Rol» inclusive) y pegalo como primer mensaje de una sesión nueva de IA, en el repo `MiSecundaria7`.
> Este archivo **no implementa** correcciones: es la instrucción para que otra IA las implemente.

---

## Rol

Sos un agente de implementación del monolito **MiSecundaria7** (Django + React/Vite + MySQL `managed=False`). Tu trabajo es **re-verificar** los hallazgos de los tres documentos de análisis contra el código actual y **corregir solo** los ítems CRÍTICO / ALTO / P0 listados abajo.

No sos un auditor libre. No reescribís arquitectura. No “mejorás de paso” P1/P2 ni ítems MEDIO/BAJO. Si un hallazgo del análisis ya no está en el código, lo marcás como falso positivo y seguís.

---

## Autoridad de documentos (este orden gana siempre)

1. `Modification-Flow&CodebaseRules.md` — **autoridad máxima**. Reemplaza cualquier supuesto previo. Fases 0–6 **antes de cada edición**. Español. `managed=False`. Sin `makemigrations` / `migrate`.
2. `DECISIONES.md` — no partir archivos monolíticos, no React Router, un solo `api.js`, un solo `DataContext`, PDFs desde Django, sin librerías de UI, sin TypeScript.
3. `REGLAS_DESARROLLO.md` — filosofía del monolito.
4. `Analisis-DatabaseBackend.md`, `Analisis-Frontend&GlobalState.md`, `Analisis-UI&InstitutionalDesign.md` — backlog. **No son la fuente de verdad.** Cada hallazgo se confirma contra el código de hoy.

**Conflicto de tests:** `REGLAS_DESARROLLO.md` §1.5 y `DECISIONES.md` §15 dicen que no hay tests. El repo **sí** tiene `backend/proyecto/escuela/tests/` y Vitest. `Modification-Flow&CodebaseRules.md` manda correrlos. Resolución: **correr los tests existentes**. No borres el runner. No instales otro framework. Podés agregar casos en `test_permisos.py` (ya existe, patrón `cliente_para` + `crear_usuario`) solo si un agujero RBAC que acabás de cerrar quedaría sin red.

Los tres análisis ya tienen una sección **Reglas Obligatorias Pre-Ejecución**. Respetala: lectura (`rg`, inspección) sí; cualquier edición es **MUTANTE** y exige Fases 0–6.

---

## Prohibiciones absolutas

- No `makemigrations`, no `migrate`, no `managed=True` (S-3, S-4).
- No commitear `.env`. No exponer `SECRET_KEY`. No hardcodear credenciales (S-1, S-2, S-6).
- No partir `models.py` / `serializers.py` / `views.py` / `permissions.py` / `api.js` / `DataContext.jsx` / `index.css` en archivos nuevos por modelo o por componente (salvo el move a `Shared/FiltrosAnioCurso.jsx` de este lote).
- No React Router. No Tailwind / Bootstrap / MUI. No TypeScript. No Redux.
- No `force_push`. No `git push` salvo que el usuario lo pida.
- No introducir variables CSS nuevas en inglés (`--danger`, `--success`, etc.) en este lote. Si hiciera falta una excepción, primero `DECISIONES.md` §7 — y en este lote **no hace falta**.
- No instrumentar loggers de navegación, overlays de debug, ni `history.pushState`.
- No ejecutar management commands mutantes (`actualizar_estados_usuarios`, `limpiar_eventos_temporales`).
- No `SELECT *` nuevo en ORM: `.only()` o campos explícitos (S-5).
- Nombres nuevos en **español** (checklists §3.1–§3.4). Excepciones solo las de §3.5, o registradas en `DECISIONES.md` **antes** de usarlas.
- Soft delete: `marcar_eliminado` / `estado=False` / `eliminado=True`. Este lote **no** cambia `HorarioEspecialViewSet.perform_destroy`.

---

## Lectura obligatoria, en este orden, antes de editar

1. `Modification-Flow&CodebaseRules.md` (completo).
2. `DECISIONES.md` (al menos §§1–4, 7, 9–14).
3. `REGLAS_DESARROLLO.md` (filosofía + checklists 20/21 si existen).
4. Los tres `Analisis-*.md`, sobre todo:
   - Backend: §4 RBAC, §4.5 matriz rol×endpoint, Resumen de Hallazgos.
   - Frontend: §1 `api.js`, Resumen de Critical Findings.
   - UI: Part 5 P0, Part 3.3 extracción Shared.
5. Código vivo:
   - `backend/proyecto/escuela/permissions.py`
   - `backend/proyecto/escuela/views.py` (ViewSets citados)
   - `backend/proyecto/escuela/urls.py`
   - `backend/proyecto/escuela/tests/test_permisos.py`
   - `frontend/src/services/api.js`
   - `frontend/.env.example`
   - `frontend/src/index.css` (bloques ~400–430 y ~1886–1941)
   - `frontend/src/components/Administracion/FiltrosAnioCurso.jsx`
   - `frontend/src/components/Preceptores/FiltrosAnioCurso.jsx`
   - imports de `FiltrosAnioCurso` en ambos roles

No empieces a codear hasta tener el inventario del Paso 0 escrito.

---

## Alcance — solo esto se implementa (si el código actual lo confirma)

| # | Origen | Ítem | Severidad |
|---|--------|------|-----------|
| B1 | Backend | ViewSets que escriben con solo `IsAuthenticated` (o sin `permission_classes` y caen al default). El análisis habla de ~28. Recontar. | CRÍTICO |
| B2 | Backend | `CalificacionViewSet` y `UsuarioViewSet`: un `alumno`/`familia` no puede crear/editar/borrar | CRÍTICO |
| B3 | Backend | Escritura restringida por rol en: `Alumno`, `Docente`, `Preceptor`, `Directivo`, `PadreTutor`, `Curso`, `Asistencia`, `Planificacion`, `Acta` | ALTO |
| F1 | Frontend | `API_BASE` hardcodeado (`http://localhost:8000/api` en `api.js`). Ya existe `VITE_API_URL` en `frontend/.env.example` | ALTO |
| F2 | Frontend | Race de refresh 401: N requests concurrentes disparan N `POST /token/refresh/` | ALTO |
| F3 | Frontend | Funciones duplicadas en `api.js` (`createActaCurso`, `createActaAlumno` según el análisis) | pedido explícito — **re-verificar** |
| U1 | UI | Selectores duplicados: `.main-header`, `.card`, `.table-responsive`, `.user-avatar` (hoy hay doble definición ~400 y ~1886) | P0 |
| U2 | UI | Unificar `FiltrosAnioCurso` (Administracion + Preceptores) en `Shared/FiltrosAnioCurso.jsx` | P0 |

Si al re-verificar un ítem **ya no existe** (ejemplo: F3 hoy cada `createActa*` aparece una sola vez), lo registrás como falso positivo y **no** lo “arreglés”.

---

## Fuera de alcance — documentar, no codear

Aunque el análisis los marque ALTO/P0/P1, **no los implementes** en esta sesión:

- Boletín client-side → ReportLab (`DECISIONES.md` §6; queda para otro lote).
- Rate limiting en `login_view`.
- `HorarioEspecialViewSet.perform_destroy` con `delete()` físico.
- `UsuarioEstadoProgramadoMiddleware` en cada request.
- PDF de actas / actividades adeudadas.
- Over-fetch de `DataContext` (23 endpoints por rol).
- Errores tragados con `.catch(() => [])`.
- Memoizar `value` del Provider / quitar `data.refreshData = fetchData`.
- Sync de URL, `history.pushState`, React Router, overlays de debug.
- Extraer `StatCard`, `TablaCRUD`, `ProfileGrid`, `EmptyState`.
- Variables CSS nuevas (`--danger`, `--success`, `--radius-sm`, spacing).
- `aria-*` masivo, clases huérfanas, sacar `style={{}}`.
- Completar la matriz UI Part 2.3 (salvo anotar lo que veas al pasar).

---

## Paso 0 — Inventario (obligatorio, solo lectura)

Para **cada** fila B1–U2 producí una tabla:

| ID | Hallazgo del análisis | ¿Sigue en el código? (archivo:línea) | Decisión | Motivo |
|----|----------------------|--------------------------------------|----------|--------|
| … | … | sí / no / parcial | implementar / skip / falso positivo | … |

Reglas del inventario:

- Usá `rg -n` / lectura de archivos. No edites nada.
- B1: listá ViewSets con y sin `permission_classes`. Distinguí “solo `IsAuthenticated`” vs “ya tiene `IsAdminOrDirectorForWrite` / `PuedeVerHistorial` / `PuedeGestionarAdelantos`”.
- F1: confirmá si `api.js` ignora `import.meta.env.VITE_API_URL`.
- F3: `rg -n "export async function createActa" frontend/src/services/api.js`.
- U1: las dos definiciones de cada selector; anotá qué propiedades conflictúan (padding, radius, width).
- U2: diff conceptual entre las dos implementaciones (Administracion usa `cursoFilters.js` y estado interno; Preceptores usa `useData()` y props controladas). La unificación **no puede romper** ninguno de los dos call sites.

Cuando el inventario esté completo, implementá **solo** las filas `implementar`, en el orden del Paso 1.

---

## Paso 1 — Un ítem a la vez, Fases 0–6

**Orden:** B2 → B3 → B1 (lo que quede) → F1 → F2 → F3 (si sigue duplicado) → U1 → U2.

Para **cada** ítem `implementar`, en orden, sin saltar fases:

### Fase 0 — Contexto

Definí `TARGET_FIELD`, `TARGET_MODEL` (si aplica), `TARGET_FILE`. Ejemplo: `TARGET_FIELD=permission_classes`, `TARGET_MODEL=Calificacion`, `TARGET_FILE=backend/proyecto/escuela/views.py`.

### Fase 1 — Referencia global

```bash
rg --no-heading --line-number -w "${TARGET_FIELD}" \
  --glob '*.py' --glob '*.js' --glob '*.jsx' --glob '*.css' --glob '*.md' .
```

Revisá **todas** las coincidencias antes de editar.

### Fase 2 — Cadena de dependencias

Modelo → serializers → views → urls → `api.js` → JSX. Para CSS: todas las `className` del selector. Para Shared: todos los `import` del componente.

### Fase 3 — Front ↔ back

Si tocás un ViewSet o una función de `api.js`, confirmá endpoint ↔ función ↔ consumidor. No renombres URLs (S-10).

### Fase 4 — Esquema

No toques modelos ni DDL en este lote. Si un cambio de permiso te tienta a agregar un campo: **stop**. Documentalo y seguí.

### Checklist español (§3)

Nombres nuevos en español. Clases de permiso PascalCase español (`Puede…`, `Es…`). Componentes Shared PascalCase español. `VITE_API_URL` ya está en `.env.example`: no la renombres a inglés nuevo; no agregues `API_BASE_URL`.

### Tests **antes** de editar (Fase 5)

```bash
cd backend && python manage.py test escuela --verbosity=2
cd frontend && npx vitest run
```

Si fallan **antes** de tu cambio: **DETENERSE**. No “arregles el suite” salvo que el fallo sea causado por tu entorno (decilo). No enmascares tests.

### Aplicar la modificación

Cambio mínimo. Un símbolo / un ViewSet / un selector a la vez cuando sea posible. Agrupar ViewSets solo si comparten **exactamente** la misma clase de permiso ya existente.

### Fase 6 — Después

- `rg -w` del símbolo viejo: sin residuos.
- `cd backend && python manage.py test escuela --verbosity=2`
- `cd frontend && npx vitest run`
- Tras F1/F2/U1/U2: `cd frontend && npx vite build`
- Lint backend si existe flake8: `python -m flake8 proyecto/ --max-line-length=120` (si no está instalado, no lo instales; anotalo).

Si un test nuevo o viejo falla **por tu cambio**: revertí ese ítem o arreglalo. No dejes la rama en rojo.

---

## Cómo implementar cada grupo

### B1–B3 — RBAC

Objetivo: un usuario autenticado con rol `alumno` o `familia` **no** escribe recursos que no le corresponden. Un `docente` **sí** puede `POST` calificaciones/asistencias de **su** materia. Un `preceptor` **sí** puede gestionar actas/asistencias de **sus** cursos. `get_queryset` **no alcanza** para escritura: hace falta `permission_classes` (y `has_object_permission` / validación en `perform_create` cuando el alcance es por objeto).

**Reutilizá** lo que ya está en `permissions.py`:

- `IsAdminOrDirectorForWrite` — lectura autenticada, escritura admin/director. Ya usado en `Materia`, `CursoMateria`, `SuplenciaDocente`, `EventoInstitucional`, `PeriodoEvaluacion`.
- `PuedeVerHistorial` — admin/director/jefe_preceptores.
- `PuedeGestionarAdelantos` — admin/director/jefe/preceptor.
- Helpers: `roles_de_request`, `es_rol_amplio`, `docente_del_usuario`, `alumnos_permitidos`.

**No inventes** un framework de ACL. Si hace falta una clase nueva (ej. escritura de calificaciones para docente en su materia, o actas para preceptor), creala en `permissions.py` con nombre en español, docstring en español, y tests en `test_permisos.py` al estilo `MatrizPermisosMateriasTests`.

Guía de asignación (ajustá si el código de `perform_create` / `get_queryset` demuestra otra regla de negocio; documentá el desvío):

| ViewSet | Escritura permitida | Notas |
|---------|---------------------|-------|
| `UsuarioViewSet` | admin, director | CRÍTICO. Alumno no crea usuarios ni cambia contraseña ajena. Si el ViewSet tiene acción “cambiar mi contraseña”, restringila al propio usuario; el resto de CRUD a admin/director. |
| `CalificacionViewSet` | admin, director, docente (solo sus `CursoMateria`) | CRÍTICO. Alumno/familia: GET de lo propio, nunca POST/PATCH/DELETE. |
| `Alumno`, `Docente`, `Preceptor`, `Directivo`, `PadreTutor`, `Curso` | admin, director (mismo patrón que materias) | ALTO |
| `AsistenciaViewSet` | admin, director, preceptor (cursos asignados); docente si el código **ya** le deja cargar asistencia de su materia — no se lo saques | ALTO. Confirmá `get_queryset` / `perform_create` actuales. |
| `ActaViewSet` | admin, director, jefe_preceptores, preceptor | ALTO. Docente/alumno/familia no crean actas. |
| `PlanificacionViewSet` | admin, director, docente (las suyas) | ALTO |
| ViewSets restantes del listado ~28 | Si son catálogos (`EstadoAsistencia`, `TipoActa`, `Modulo`, `TipoAccion`): `IsAdminOrDirectorForWrite`. Si son anidados de un padre que ya restringís (`ActaAlumno`, etc.): alineados al padre. Si son flujo académico avanzado (`MateriaAdeudada`, recursadas, etc.): **no los dejes abiertos a alumno**; usá admin/director o el rol que el `get_queryset` actual ya asuma. Si no podés demostrar el rol correcto, restringí escritura a admin/director y anotalo. |

Matriz mínima a cubrir con tests (análisis §4.5; adaptá URLs reales de `urls.py`):

- `alumno` → `POST /api/usuarios/` → 403
- `alumno` → `POST /api/calificaciones/` → 403
- `alumno` → `DELETE /api/alumnos/1/` → 403
- `alumno` → `POST /api/actas/` → 403
- `familia` → `POST /api/calificaciones/` → 403
- `docente` → `POST /api/calificaciones/` de su materia → 201 (si el serializer lo permite con el payload de factories)
- `docente` → `POST /api/actas/` → 403
- `preceptor` → `POST /api/actas/` → 201 (payload mínimo válido)
- `alumno` → `GET /api/historial/` → 403 (si el ViewSet ya usa `PuedeVerHistorial`, solo confirmá)

No rompas los tests que ya existen de materias/suplencias/adelantos.

### F1 — `API_BASE`

- En `api.js`, `baseURL` debe salir de `import.meta.env.VITE_API_URL` (fallback de desarrollo: el valor ya documentado en `frontend/.env.example`).
- El `axios.post` del refresh **también** debe usar esa base (hoy concatena `API_BASE`).
- No dejes `http://localhost:8000/api` como única fuente. `rg` de `localhost:8000` en `frontend/src` después del cambio: sin residuos de la constante vieja, salvo comentarios.
- No renombres `VITE_API_URL`. Actualizá `frontend/.env.example` solo si falta una línea de comentario en español.

### F2 — Race de refresh

- Un mutex/cola en el interceptor: el primer 401 dispara el refresh; los demás esperan el mismo promise y reintentan con el token nuevo.
- Seguí usando `axios.post` crudo (no `api.post`) para el refresh, para no reentrar al interceptor.
- Si el refresh falla: borrar `access_token` y `refresh_token`, mismo comportamiento actual (`reload`). No agregues toast ni router.
- No extraigas un archivo nuevo de “auth client” salvo que sea inevitable; preferí el cambio local en `api.js`.

### F3 — Duplicados `api.js`

- Solo si `rg` muestra dos `export` del mismo nombre o dos wrappers del mismo path.
- Dejá una función. Actualizá consumidores. No cambies la firma si alguien ya la usa.

### U1 — Selectores CSS duplicados

Hay dos bloques: el de ~400 (layout original) y el de ~1886 (redefinición). **Una sola definición debe ganar.**

Procedimiento:

1. Diff de propiedades de `.main-header`, `.user-avatar`, `.card`, `.table-responsive` entre las dos copias.
2. Elegí el conjunto que coincida con lo que la UI institucional realmente muestra (cards con radius del segundo bloque + `.table-responsive` con borde/sombra si eso es lo que se ve en tablas). Documentá en el comentario de cierre / en el análisis qué se conservó.
3. Eliminá el bloque duplicado. No dejes reglas vacías.
4. `rg` de cada clase en JSX: nada debe quedar huérfano; nada debe cambiar de nombre.
5. No toques el bloque responsive 992/768 que **también** se duplica (~1999+) en este lote, salvo que esté **dentro** de los cuatro selectores P0 y sea estrictamente necesario para no dejar un override huérfano de esos cuatro.

### U2 — `FiltrosAnioCurso` → Shared

Las dos copias **no son iguales**:

- `Administracion/FiltrosAnioCurso.jsx` — estado interno, `cursoFilters.js`, props `cursosObj`, `onCursoChange`, `onCursoObjChange`, `defaultToFirst`.
- `Preceptores/FiltrosAnioCurso.jsx` — controlado por props (`anioLectivo`, `curso`, `onAnioChange`, `onCursoChange`), lee `useData()`.

Unificación correcta:

1. Fase 1: `rg` de `FiltrosAnioCurso` en todo `frontend/src`.
2. El Shared debe cubrir **ambos** contratos (props del admin y props del preceptor) **o** adaptar los call sites a un contrato único, sin perder comportamiento (ciclo lectivo, año, división, reset de división al cambiar año, `defaultToFirst`).
3. El Shared **no** lee `user.role`. Datos por props o por `useData()` ya global — no imports desde carpetas de rol.
4. `cursoFilters.js` se mueve con el Shared o se importa desde un `utils/` existente si ya es el lugar natural; no dejes un helper de admin importado por Shared.
5. Actualizá **todos** los imports. Borrá los dos originales. Nunca dejes original + Shared.
6. Nombre: `FiltrosAnioCurso.jsx` (ya está en español).
7. Vitest + `vite build`.

---

## Cierre de sesión

1. Re-ejecutar tests backend y frontend + `vite build`.
2. En cada `Analisis-*.md`, junto al hallazgo resuelto, marcá **RESUELTO** con fecha y archivos tocados. No reescribas el análisis entero.
3. No actualices `PROYECTO.md` salvo que hayas cambiado rutas o modelos (no deberías).
4. No crees excepción en `DECISIONES.md` salvo que hayas usado inglés inevitable (no deberías en este lote).
5. Reporte final obligatorio:

```
## Reporte

### Implementado
- ID: qué, archivos, tests que cubren

### Falso positivo / ya no aplica
- ID: evidencia (rg / líneas)

### Skip (fuera de alcance)
- lista breve

### Tests
- backend: pass/fail (comando)
- frontend vitest: pass/fail
- vite build: pass/fail

### Riesgos / follow-up
- lo que viste y no tocaste
```

---

## Criterios de hecho

- Alumno/familia no pueden POST/PATCH/DELETE calificaciones ni usuarios.
- ViewSets ALTO de personas/cursos/actas/planificaciones/asistencia no quedan en “cualquier autenticado escribe”.
- `api.js` no depende de un host hardcodeado; el refresh 401 no dispara N refresh en paralelo.
- `index.css` define una sola vez `.main-header`, `.card`, `.table-responsive`, `.user-avatar`.
- Hay un solo `FiltrosAnioCurso` en `Shared/`; Administracion y Preceptores importan de ahí; los duplicados de rol están borrados.
- `managed=False` intacto. Sin migraciones nuevas. Tests existentes en verde. Build frontend en verde.
- Ningún ítem de “Fuera de alcance” aparece en el diff salvo menciones en markdown de análisis/reporte.
