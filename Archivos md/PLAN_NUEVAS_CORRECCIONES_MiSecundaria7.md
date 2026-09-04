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

Debe aplicarse a los perfiles correspondientes: Alumno, Docente, Preceptor, Tutor/Familia, Jefe de Preceptores, Director, Vicedirector, Secretario, Administrador, etc.

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

## 2.1 Boletín

Actualmente el Boletín sigue mostrando solamente calificaciones normales.

Debe mostrar, cuando corresponda:
- Calificación normal.
- Intensificación 1.º Cuatrimestre.
- Intensificación de Diciembre.
- Intensificación de Febrero.

Revisar el flujo completo para Alumno, Familia, Docente, Preceptor, Jefe de Preceptores y Administrador.

Reutilizar `BoletinTablaPrincipal`, `BoletinExtras` y componentes existentes. No crear otro sistema paralelo.

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

Verificar alumno, curso/materia, año de rendición, instancia de Diciembre, estado y posibles duplicados.

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


## 4.2 Familia — Restaurar selectores de Alumno

Restaurar los selectores de Alumno donde la información dependa del hijo.

Debe poder seleccionarse el Alumno para consultar:
- Calificaciones.
- Intensificaciones.
- Asistencias.
- Actividades.
- Información académica.
- Otras vistas dependientes del estudiante.

### Excepción
Calendario Institucional debe seguir sin requerir selector de Alumno.

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
- Selector de Alumno donde corresponde.
- Calificaciones.
- Intensificaciones.
- Asistencias.
- Actividades.
- Comunicados.
- Calendario Institucional sin selector.

## Alumno
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

# ESTADO

- ⏳ Parte 1 — Usuarios, personas, roles y asignaciones
- ⏳ Parte 2 — Calificaciones, Boletín y Previas
- ⏳ Parte 3 — Asistencias
- ⏳ Parte 4 — Actividades y Familia
- ⏳ Parte 5 — Adelantos de horas y revisión visual
- ⏳ Parte 6 — Revisión final

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
