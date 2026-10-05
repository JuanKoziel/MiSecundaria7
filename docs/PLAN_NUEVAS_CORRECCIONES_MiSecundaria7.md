# PLAN DE NUEVAS CORRECCIONES — MiSecundaria7

## Reglas generales
- No modificar la base de datos.
- No ejecutar SQL.
- No crear migraciones.
- No hacer INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE ni cambios directos sobre la BD.
- No hacer commits ni push.
- Inspeccionar primero la implementación actual antes de modificar.
- No revertir funcionalidades que ya funcionan.
- No crear sistemas paralelos: reutilizar componentes, endpoints y utilidades existentes.
- Los permisos importantes deben validarse en backend.
- Al terminar cada parte, informar qué se encontró, qué se modificó y qué verificaciones se ejecutaron.

---

# PARTE 1 — USUARIOS, PERSONAS, ROLES Y ASIGNACIONES

## 1.1 Persona existente o nueva

Al crear un usuario/perfil debe poder elegirse claramente:
- Persona existente
- Nueva persona

Debe aplicarse a los perfiles correspondientes: Estudiante, Docente, Preceptor, Tutor/Familia, Jefe de Preceptores, Director, Vicedirector, Secretario, Administrador, etc.

### Persona existente
- Reutilizar el `id_usuario` existente.
- No crear un usuario duplicado.
- Permitir múltiples roles sobre el mismo usuario.
- Cargar automáticamente los datos existentes.
- No pedir contraseña si el usuario ya existe.
- No duplicar la persona.

### Nueva persona
- Mantener la lógica actual de creación.
- Crear usuario/persona solamente cuando corresponda.

Antes de modificar, inspeccionar las relaciones reales entre `usuarios`, `docentes`, `preceptores`, `padres_tutores`, `alumnos`, `directivos` y roles. No asumir columnas ni relaciones.

## 1.2 Jefe de Preceptores

Al crear/asignar un Jefe de Preceptores:
- Permitir persona existente o nueva.
- Si es existente, reutilizar su usuario.
- No duplicar persona/usuario.

### Asignación automática
El Jefe de Preceptores debe quedar asociado a todos los cursos y a los preceptores correspondientes a esos cursos.

### Regla crítica
Asignar cursos al Jefe NO debe quitar esos cursos a los Preceptores.

Correcto:
```text
Curso 1°1
 ├── Preceptor → Preceptor 1
 └── Jefe de Preceptores → Jefe 1
```

Incorrecto:
```text
Curso 1°1
 └── Jefe de Preceptores → Jefe 1
      ❌ Preceptor 1 eliminado
```

Inspeccionar endpoints, serializers, modelos y lógica de asignación antes de modificar. No corregir datos existentes automáticamente.

## 1.3 Diseño visual

Mejorar visualmente la elección de persona existente/nueva. Debe ser clara, consistente y fácil de entender, por ejemplo:

```text
┌─────────────────────────────────────┐
│ ¿Cómo desea crear el perfil?       │
│                                     │
│ ◉ Persona existente                 │
│   Asignar un nuevo rol a alguien    │
│   ya registrado.                    │
│                                     │
│ ○ Nueva persona                     │
│   Crear persona y usuario desde cero│
└─────────────────────────────────────┘
```

---

# PARTE 2 — CALIFICACIONES, BOLETÍN Y PREVIAS

## 2.1 RITE

Actualmente el RITE sigue mostrando solamente calificaciones normales.

Debe mostrar, cuando corresponda:
- Calificación normal.
- Intensificación 1.º Cuatrimestre.
- Intensificación de Diciembre.
- Intensificación de Febrero.

Revisar el flujo completo para Estudiante, Familia, Docente, Preceptor, Jefe de Preceptores y Administrador.

Reutilizar `RiteTablaPrincipal`, `RiteExtras` y componentes existentes. No crear otro sistema paralelo.

## 2.2 Error al guardar Febrero

Escenario:
1. 1.º Cuatrimestre → DESAPROBADA.
2. Diciembre → DESAPROBADA.
3. Febrero se desbloquea visualmente.
4. Se introduce una nota.
5. Al guardar aparece:

```text
No se puede cargar la Intensificación de Febrero:
no desaprobó la Intensificación de Diciembre.
```

Esto es incorrecto.

Regla:
> Febrero está habilitada cuando la Intensificación de Diciembre correspondiente está DESAPROBADA.

Frontend y backend deben usar la misma regla. No eliminar la validación del backend.

Verificar estudiante, curso/materia, año de rendición, instancia de Diciembre, estado y posibles duplicados.

## 2.3 Previas

Las notas/rendiciones de Previas se cargan únicamente desde Calificaciones.

Buscar cualquier otra pantalla/formulario que permita cargar una nota de Previa y eliminar solamente esa vía duplicada.

Mantener visualización, consultas e historial donde correspondan.

---

# PARTE 3 — ASISTENCIAS

## 3.1 Asistencia por día

Debe seguir exactamente esta lógica:

| Registro 1 | Registro 2 | Resultado |
|---|---|---|
| Faltó | Faltó | Ausente |
| Presente | Presente | Presente |
| Faltó | Presente | Tarde |
| Presente | Faltó | Retirado |

Primero inspeccionar cómo se almacenan los registros y dónde se calcula el estado diario.

No inventar estados nuevos si ya existen equivalentes.

Verificar backend y frontend.

---

# PARTE 4 — ACTIVIDADES Y FAMILIA

## 4.1 Actividades — Diseño estilo Classroom

La sección de **Actividades** debe utilizar un diseño visual inspirado en Google Classroom y mantener una navegación en dos niveles.

### Nivel 1 — Selección de Materia y Docente

Las actividades deben comenzar mostrando tarjetas grandes y clickeables, con un diseño similar al de las tarjetas de materias de Google Classroom.

Cada tarjeta debe representar una combinación específica de:

**Materia + Docente**

La tarjeta debe contener únicamente:

* Nombre de la materia.
* Nombre completo del Docente correspondiente.

Características visuales:

* Bordes redondeados.
* Encabezado visual destacado.
* Diseño limpio y moderno.
* Sin fotos de perfil.
* Sin botones, iconos ni opciones en la parte inferior.
* Toda la tarjeta debe ser clickeable.

Ejemplo conceptual:

```text
┌──────────────────────────────────────┐
│                                      │
│  Matemática                          │
│                                      │
│  Christian Chiramberro               │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

### Nivel 2 — Actividades de la Materia y Docente seleccionado

Al hacer clic sobre una tarjeta de **Materia + Docente**, debe abrirse la vista correspondiente y mostrar únicamente las actividades asociadas a esa combinación.

Las actividades deben mostrarse con un diseño inspirado en el listado de publicaciones de Google Classroom, utilizando **recuadros horizontales separados**, con bordes redondeados y espaciado entre cada actividad.

Cada publicación debe mostrar, como mínimo:

* Un icono que permita distinguir visualmente el tipo de publicación, por ejemplo **Material** o **Actividad**.
* El nombre completo del Docente.
* El tipo de publicación y el título del material o actividad.
* La fecha de publicación.
* Si corresponde, indicar que la publicación fue editada.
* Si el título es demasiado largo, puede truncarse visualmente sin romper el diseño.
* Un menú de opciones representado visualmente mediante tres puntos cuando corresponda.

Ejemplo conceptual:

```text
┌──────────────────────────────────────────────────────────────┐
│  📖   Christian Chiramberro publicó un nuevo material:     ⋮ │
│       Módulo 4 - Base de Datos.                              │
│       5 de mayo (Editado el 5 de mayo)                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📋   Christian Chiramberro publicó una nueva actividad:   ⋮ │
│       Estructura de un proyecto.                             │
│       5 de mayo                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  📋   Christian Chiramberro publicó una nueva actividad:   ⋮ │
│       Node.js - Express - Postman.                            │
│       5 de mayo                                               │
└──────────────────────────────────────────────────────────────┘
```

Los recuadros deben tener una apariencia visual semejante al ejemplo proporcionado:

* Fondo visual diferenciado respecto del fondo general.
* Bordes redondeados.
* Icono dentro de un área circular o contenedor visual.
* Información organizada claramente entre publicación y fecha.
* Espaciado suficiente entre publicaciones.
* Diseño responsive para adaptarse correctamente a diferentes tamaños de pantalla.
* Apariencia limpia, moderna y similar a Google Classroom.

El listado debe mostrar **todas las actividades y materiales correspondientes a la Materia + Docente seleccionados**, respetando el orden existente de las publicaciones.

No deben mezclarse actividades de otros Docentes aunque pertenezcan a la misma materia.

La navegación debe funcionar de la siguiente manera:

1. El usuario visualiza las tarjetas de **Materia + Docente**.
2. El usuario selecciona una tarjeta.
3. El sistema identifica la combinación exacta de materia y Docente seleccionada.
4. Se abre el listado de publicaciones correspondiente.
5. Se muestran únicamente las actividades y materiales de esa materia y ese Docente.
6. El usuario puede seleccionar una publicación para acceder a su detalle utilizando la funcionalidad existente.

Debe funcionar de la misma manera para **Estudiante y Familia**, respetando los permisos y el alcance correspondiente de cada usuario.

No se deben mostrar fotos de perfil ni las opciones inferiores que aparecen en las tarjetas originales de Google Classroom.

Reutilizar `ActividadesView.jsx` y los componentes y utilidades existentes cuando sea posible. No crear un sistema paralelo de actividades ni modificar innecesariamente la lógica existente de creación, edición o visualización.

Antes de realizar cambios, inspeccionar cómo se relacionan actualmente las actividades con las materias, Docentes, cursos y Estudiantes para garantizar que el filtrado por **Materia + Docente** sea correcto y no se produzcan mezclas de actividades entre Docentes.


## 4.2 Familia — Restaurar selectores de Estudiante

Restaurar los selectores de Estudiante donde la información dependa del hijo.

Debe poder seleccionarse el Estudiante para consultar:
- Calificaciones.
- Intensificaciones.
- Asistencias.
- Actividades.
- Información académica.
- Otras vistas dependientes del estudiante.

### Excepción
Calendario Institucional debe seguir sin requerir selector de Estudiante.

No hacer rollback global de los cambios anteriores.

---

# PARTE 5 — ADELANTOS DE HORAS Y REVISIÓN VISUAL

## 5.1 Adelanto de horas

En Administración → Adelanto de Horas falta gran parte del bloque superior que contextualizaba la información de la tabla.

Restaurar el bloque original de información contextual comparando con la implementación existente/histórica.

No reemplazarlo simplemente por un título.

Conservar filtros, selección, explicación y datos necesarios para interpretar la tabla.

No alterar la lógica funcional.

## 5.2 Indicador Suplente

Mantener:

```text
Docente: Juan Pérez [Suplente]
```

cuando corresponda por una suplencia activa.

Si existe `dangerouslySetInnerHTML` únicamente para renderizar el badge, reemplazarlo por JSX normal:

```jsx
<span>{nombreDocente}</span>
{esSuplente && (
    <span className="badge-suplente">Suplente</span>
)}
```

No cambiar la lógica de detección salvo que se encuentre un error real.

---

# PARTE 6 — REVISIÓN FINAL

## Administrador
- Persona existente/nueva.
- Múltiples roles.
- Jefe de Preceptores.
- Jefe asociado a todos los cursos/preceptores.
- Preceptores conservan sus cursos.
- Adelanto de horas visualmente completo.

## Docente
- Materias asignadas.
- Calificaciones.
- Intensificaciones.
- Febrero después de Diciembre desaprobada.
- Previas únicamente desde Calificaciones.
- Actividades.
- Asistencias.

## Preceptor
- Cursos propios.
- Asistencias.
- Calificaciones.
- Actividades.
- Previas.
- Comunicados.

## Jefe de Preceptores
- Cursos supervisados.
- Preceptores correspondientes.
- No elimina asignaciones de los Preceptores.

## Familia
- Selector de Estudiante donde corresponde.
- Calificaciones.
- Intensificaciones.
- Asistencias.
- Actividades.
- Comunicados.
- Calendario Institucional sin selector.

## Estudiante
- Calificaciones.
- Intensificaciones.
- Asistencias.
- Actividades.
- Comunicados.

## Permisos

Comprobar que modificar IDs, parámetros o requests directos a la API no permita acceder a información de otro ámbito.

## Verificaciones técnicas

Ejecutar:

```bash
npm run build
python manage.py check
```

Ejecutar las pruebas existentes si están disponibles.

Informar warnings preexistentes por separado.

---

# AUDITORÍA DE ESTADO (2026-09-05)

Auditoría sobre el código actual (working tree, incluye cambios sin commitear).

## ✅ PARTE 1 — Usuarios, personas, roles y asignaciones → HECHO

- **1.1 Persona existente o nueva**: aplicado a Estudiante, Docente, Preceptor, Tutor/Familia, Jefe de Preceptores y Directivos/Administrador.
  - Backend: campo `id_usuario_existente` (write-only) en `UsuarioSerializer`, `PadreTutorSerializer`, `PreceptorSerializer`, `DocenteSerializer`, `AlumnoSerializer`. Reutiliza el `Usuario` existente (valida que exista), no duplica, no toca contraseña/estado/fechas y permite múltiples roles vía `_assign_role`.
  - Guardas anti-duplicado de persona: Preceptor reutiliza su propia fila (evita el conflicto OneToOne); Docente/Estudiante/PadreTutor devuelven error si ya tienen perfil; Directivo se actualiza sin duplicarse.
  - Frontend: `administradores.jsx`, `preceptores.jsx`, `AdminPreceptores.jsx`, `estudiantes.jsx`, `docentes.jsx`, `tutoresFamilias.jsx` envían `id_usuario_existente`, no piden contraseña en modo existente y autocompletan los datos.
- **1.2 Jefe de Preceptores**: hecho. Al crear/editar un jefe `PreceptorSerializer.create/update` NO escribe `Curso.id_preceptor` → los Preceptores conservan sus cursos. El alcance del jefe es dinámico (todos los cursos) vía `_comunicado_visible_para_ctx` (`views.py:630` → `True`).
- **1.3 Diseño visual**: hecho. Componente compartido `ModoCreacionPersona` + `PersonaSelector` en todos los flujos con elección clara "Persona existente / Nueva persona".
- Verificación: `python manage.py check` OK (solo warning preexistente W342) y `npm run build` OK.

## ⚠️ PARTE 2 — Calificaciones, RITE y Previas → PARCIAL

- **2.1 RITE**: parcial. RITE compartido (Estudiante/Familia/Preceptor) muestra nota normal + Intensificación 1.º C en la tabla principal; Diciembre y Febrero quedan **vacíos en la tabla principal** (`RiteTablaPrincipal.jsx:90-91`) y solo aparecen en las secciones extra y en el PDF (`RiteExtras.jsx:189-205`, `utils/rite.js`). El RITE de Administración es una tabla paralela con `RiteExtras` vacío (`Administracion/notas.jsx:128-196`). El Jefe de Preceptores no tiene vista de RITE. El Docente no tiene vista de RITE.
- **2.2 Error al guardar Febrero**: parcial. Backend valida "Febrero requiere Diciembre DESAPROBADA" por **mismo historial** (`views.py:4490-4491`); frontend desbloquea Febrero por **materia sin filtrar año/historial** (`frontend/src/utils/intensificaciones.js:51`) → si la Diciembre desaprobada es de otro historial, la UI habilita pero el backend rechaza, reproduciendo el error reportado.
- **2.3 Previas**: parcial. Única carga funcional en Calificaciones (`Profesores/PanelEstudiantes.jsx` → `rendirMateriaAdeudada`). La vía duplicada de `Profesores/PanelMateriasAdeudadasDocente.jsx` quedó desactivada (se removieron handlers) PERO dejó un formulario JSX residual roto con referencias a `deudas`/`selectedDeuda`/`handleRendirPrevia` inexistentes (líneas 83-177) → **limpiar ese bloque**.

## ⚠️ PARTE 3 — Asistencias → PARCIAL

- **3.1 Asistencia por día**: la tabla de verdad NO se cumple en las 4 combinaciones. Backend (`views.py:2852-2872`) y frontend (`AsistenciasUnificada.jsx:42-56`) combinan con `set`, que pierde el orden → **Faltó+Presente devuelve "Retiro" en vez de "Tarde"** (la regla de Tarde es inalcanzable). Además no hay `ORDER BY hora` → el registro 1/2 es indefinido. "Retiro/Retirado" es un estado inventado (no existe en `estados_asistencia`, cuyo seed es Presente/Ausente/Tarde/Justificado); el docente guarda "Retiro" como id 4 = "Justificado" (`PanelAsistencia.jsx:140-141`) y el preceptor recibe 400 al intentar guardar "Retiro" de docentes (`views.py:3260-3262`).

## ⚠️ PARTE 4 — Actividades y Familia → PARCIAL

- **4.1 Actividades estilo Classroom**: Nivel 1 HECHO — tarjetas Materia+Docente clickeables, sin fotos ni botones inferiores, filtradas por la combinación exacta (`ActividadesView.jsx:66-85,318-330`). Nivel 2 PARCIAL — lista filtrada por materia+docente y recuadros horizontales OK (`ActividadesView.jsx:234,266-291`), pero **faltan**: icono que distinga Material/Actividad (icono fijo `fa-clipboard-list`, `:273-275`), etiqueta de tipo, indicador "Editado" y menú de tres puntos. El backend no expone tipo ni fecha de edición en `ActividadDocente`.
- **4.2 Familia — selectores de Estudiante**: HECHO. Selector de hijo restaurado en el header (`FamiliaDashboard.jsx:149-157`, `Familia/header/header.jsx:1,23-38`); todas las vistas dependientes usan `hijoSeleccionado` (Calificaciones, Intensificaciones, Asistencias, Actividades, Horarios, Comunicados, Información académica, Actas, Resumen). Calendario Institucional correctamente sin selector (`header.jsx:5`).

## ⚠️ PARTE 5 — Adelantos de horas y revisión visual → PARCIAL

- **5.1 Adelanto de horas**: parcial. Se restauraron las columnas del encabezado de la tabla (Docente, Fecha, Horario, Módulos, Horario original, Motivo, Autorizado por, Estado — `AdelantosHoras.jsx:459-467`) pero **falta el bloque superior contextual** (filtros por curso/materia/fecha, selección, explicación ampliada, leyenda/datos): hoy solo hay un párrafo + botón + checkbox "solo activos" (`AdelantosHoras.jsx:421-441`). Nota: en el historial del repo nunca existió un bloque más rico para este componente; debe construirse según lo que pide el plan.
- **5.2 Indicador Suplente**: HECHO. Reemplazado `dangerouslySetInnerHTML` por JSX (`AdelantosHoras.jsx:486-491`); hoy hay 0 usos de `dangerouslySetInnerHTML` en `frontend/src`; la lógica de detección de suplencia activa quedó intacta.

## ⏳ PARTE 6 — Revisión final → PENDIENTE

- Depende de cerrar Partes 2–5. Verificaciones técnicas ya ejecutadas y OK: `npm run build` y `python manage.py check` (solo warning W342 preexistente). Revisión integral de permisos pendiente.

---

# ESTADO

- ✅ Parte 1 — Usuarios, personas, roles y asignaciones (HECHO)
- ⚠️ Parte 2 — Calificaciones, RITE y Previas (parcial: 2.1, 2.2, 2.3)
- ⚠️ Parte 3 — Asistencias (parcial: 3.1)
- ⚠️ Parte 4 — Actividades y Familia (4.1 parcial, 4.2 HECHO)
- ⚠️ Parte 5 — Adelantos de horas y revisión visual (5.1 parcial, 5.2 HECHO)
- ⏳ Parte 6 — Revisión final (pendiente)

## Próximos pasos (lo que falta por hacer)

1. **PARTE 2**:
   - 2.1 Completar el RITE: mostrar Diciembre y Febrero en la tabla principal de `RiteTablaPrincipal`; unificar el RITE de Administración con los componentes compartidos; agregar vistas de RITE para Jefe de Preceptores (y evaluar Docente).
   - 2.2 Alinear frontend y backend con la misma regla de Febrero basada en el **historial** (no solo por materia/año).
   - 2.3 Eliminar el formulario residual roto de `PanelMateriasAdeudadasDocente.jsx` (deudas/selectores/handler).
2. **PARTE 3**: corregir la combinación diaria por **orden** (tuplas ordenadas por `hora`, no `set`) en `views.py:2852-2872` y `AsistenciasUnificada.jsx:42-56`; agregar `ORDER BY hora`; definir "Retiro/Retirado" como estado real o eliminarlo de las opciones de guardado; corregir el guardado de "Retiro" en `PanelAsistencia.jsx` y la opción de `Preceptores/asistencias.jsx:603`.
3. **PARTE 4.1**: agregar en el Nivel 2 el icono y etiqueta de tipo (Material/Actividad), el indicador "Editado" y el menú de tres puntos; evaluar exponer tipo/fecha de edición en el backend.
4. **PARTE 5.1**: construir el bloque superior contextual completo de Adelanto de Horas (filtros por curso/materia/fecha, selección, explicación y leyenda/datos).
5. **PARTE 6**: revisión final de permisos y verificación integral (`npm run build`, `python manage.py check`).

## Criterio de cierre

Una parte no se considera completada solamente porque compile.

Debe verificarse que:
1. La funcionalidad solicitada funciona.
2. No se rompe una funcionalidad anterior.
3. Los permisos siguen siendo correctos.
4. No se duplican personas/usuarios.
5. No se generan relaciones incorrectas.
6. No se modifica la BD.
7. No se crean migraciones.
8. No se hacen commits ni push.
