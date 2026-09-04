# PLAN DE CORRECCIONES — MiSecundaria7

## Objetivo

Reunir los errores y mejoras detectados en la revisión manual del sistema y trabajarlos por **tramos grandes**, como se hizo con Notificaciones.

Cuando se indique **“Avanza con la Parte X”**, trabajar únicamente esa parte.

### Reglas generales

- Inspeccionar primero la implementación actual.
- No modificar la BD sin autorización explícita.
- No ejecutar SQL de escritura.
- No crear migraciones.
- No hacer commit ni push.
- No usar `git clean` ni `git reset --hard`.
- Mantener las funcionalidades que ya funcionan.
- Mantener permisos y reglas existentes salvo que esta lista indique un cambio.
- Terminología visible: **Docente/Docentes** y **Estudiante/Estudiantes**.
- No renombrar identificadores técnicos solamente para cambiar textos visibles.
- Investigar si el problema está en frontend, backend, persistencia, consultas o presentación antes de corregir.
- Ejecutar las verificaciones correspondientes.
- Actualizar la documentación/historial al terminar cada parte.

---

# PARTE 1 — Identidad, perfiles y presentación general

## Objetivo

Corregir información redundante o incorrecta en los perfiles y encabezados de todos los roles.

### General

- La bienvenida debe mostrar **nombre completo**, no username.
  - Ejemplo: `Bienvenido Juan Pérez`.
- Todo campo visible de **Autor** debe mostrar nombre y apellido, no username.

### Preceptor

Eliminar del perfil:
- texto descriptivo:
  > Responsable del seguimiento diario de los estudiantes, asistencia, comunicación institucional y acompañamiento escolar.
- estado de cuenta del bloque informativo, porque ya aparece arriba a la derecha.

### Docente

Eliminar del perfil:
- estado de cuenta del bloque informativo;
- último ingreso;
- texto:
  > Desde este panel puede administrar calificaciones, asistencias, proyectos, actas y el seguimiento académico de sus cursos.

Además:
- hacer la sección de **DDJJ** más visible y estética, sin cambiar su funcionalidad.

### Familia

En Mi Perfil:
- eliminar selector de hijo;
- eliminar texto:
  > Desde aquí puede realizar el seguimiento académico de sus hijos, visualizar comunicados, asistencias y calificaciones.
- mostrar un poco más de información útil del Estudiante, utilizando solamente datos que ya existan.

### Alumno

En Mi Perfil:
- eliminar División por ser redundante;
- mostrar promedio general solamente cuando existan calificaciones suficientes;
- eliminar Estado académico si es redundante;
- eliminar texto:
  > Desde este perfil puede consultar calificaciones, asistencias, horarios, comunicados y toda su información académica.
- ocultar el apartado "Cursando" normalmente;
- mostrarlo solamente cuando el Estudiante realmente deba cursar otro curso por una recursada.

---

# PARTE 2 — Calificaciones e Intensificaciones

## Objetivo

Unificar la experiencia de Calificaciones y resolver los errores relacionados con intensificaciones.

### Terminología

Cambiar visualmente:

> Notas → Calificaciones

No cambiar nombres técnicos de modelos, endpoints, variables o columnas.

### Administrador

La sección actual de "Notas" debe adaptarse al modelo visual actual de **Calificaciones**, manteniendo las funciones administrativas necesarias.

### Preceptor

Debe poder visualizar correctamente las intensificaciones que correspondan a los Estudiantes bajo su alcance.

### Familia

Debe visualizar las Calificaciones del Estudiante de forma equivalente al modelo esperado de Alumno, incluyendo intensificaciones cuando corresponda.

### Alumno

Debe visualizar correctamente:
- calificaciones normales;
- intensificaciones del 1° Cuatrimestre;
- Diciembre;
- Febrero;
- resultados correspondientes.

### Bug confirmado: guardado de intensificación

Desde Docente:
1. se carga una nota;
2. aparece mensaje de éxito;
3. la casilla vuelve a quedar vacía;
4. otro usuario no ve la nota.

Investigar el flujo completo:

> formulario → payload → endpoint → backend → persistencia → GET → serializer → frontend

La nota guardada correctamente debe persistir y aparecer en todas las vistas autorizadas.

### Bug confirmado: Febrero

Caso:
- 1° Cuatrimestre desaprobado;
- Diciembre desaprobado;
- Febrero debería habilitarse;
- actualmente aparece:
  > No se puede cargar la Intensificación de Febrero: no desaprobó la Intensificación de Diciembre.

Corregir la lógica completa frontend/backend.

Reglas esperadas:
- desaprobación del 1° Cuatrimestre → habilita su intensificación;
- Diciembre se habilita según las reglas existentes;
- Diciembre desaprobado → habilita Febrero;
- Febrero aprobado → aprobado;
- Febrero desaprobado → pasa a Previa.

No inventar una nueva nota mínima de aprobación.

### Bug confirmado: creación sin archivo

Crear una intensificación sin archivo actualmente produce HTTP 500.

Determinar si el archivo es realmente opcional según la implementación actual. Si es opcional, debe poder crearse sin archivo. Si es obligatorio en algún caso, mostrar validación clara, nunca 500.

---

# PARTE 3 — Asistencias y Actividades

## Objetivo

Unificar la experiencia de Alumno y Familia.

### Alumno — Asistencias

Debe mostrar:
- resumen de días recientes;
- estado del día actual;
- al seleccionar una materia, todas las asistencias de esa materia.

Distinguir correctamente:
- presente;
- ausente;
- pendiente/sin registro, cuando corresponda.

### Familia — Asistencias

Debe seguir el mismo modelo de Alumno:
- resumen reciente;
- asistencia de hoy;
- "Pendiente" si todavía no existe registro;
- selección de materia para consultar todo su historial.

"Pendiente" no significa ausencia.

### Alumno — Actividades

Cambiar la presentación a tarjetas/cuadros clickeables, similar a Classroom.

### Familia — Actividades

Utilizar el mismo modelo visual/funcional de Alumno, reutilizando componentes cuando sea posible.

No crear sistemas paralelos innecesarios.

---

# PARTE 4 — Comunicados, Calendario y alcance de información

## Objetivo

Corregir el alcance de información institucional y el comportamiento cuando cambian las asignaciones.

### Comunicados

Si una persona recibe una asignación posteriormente, por ejemplo:

> se asigna un Preceptor a 1°1

debe poder visualizar los **comunicados anteriores de 1°1 que continúen vigentes**.

No mostrar comunicados vencidos.

Determinar la vigencia usando el modelo real existente.

### Calendario Institucional — Familia

Eliminar el selector de hijos.

El calendario institucional no debe requerir seleccionar un hijo cuando no sea necesario.

### Información de eventos

Mantener coherencia con el alcance real de cada evento y no mostrar fechas de creación cuando lo que corresponde es la fecha en que ocurrirá el evento.

---

# PARTE 5 — Administrador: personas, suplencias y adelantos

## Objetivo

Corregir la administración de personas y la representación del Docente responsable.

### Jefes de Preceptores

Al crear un Jefe de Preceptores debe poder seleccionarse una persona existente en el sistema que corresponda, por ejemplo:

- Docente;
- Preceptor;
- Administrador.

No duplicar personas innecesariamente.

Primero inspeccionar las relaciones reales entre usuarios y roles.

### Suplencia + Adelanto

Existe una suplencia de Matemática de 1°1.

Debe seguir siendo posible crear el adelanto correspondiente.

Pero al mostrar el responsable debe aparecer la persona que actualmente realiza la suplencia, con un indicador visual:

> **Suplente**

Ejemplo:

> Matemática — 1°1  
> Juan Pérez — **Suplente**

No romper la regla actual que permite crear el adelanto.

---

# PARTE 6 — Historial administrativo y permisos

## Objetivo

Mejorar la trazabilidad de cambios y corregir permisos que actualmente son demasiado amplios.

### Historial administrativo

Debe ser más fácil de entender y mostrar claramente:
- quién realizó el cambio;
- qué modificó;
- sobre qué persona/entidad;
- cuándo;
- qué acción realizó.

El responsable debe mostrarse con nombre completo, no username.

No inventar información histórica inexistente.

### Docente — Previas

Si un Estudiante tiene:

> Previa de Inglés

solamente el Docente correspondiente a Inglés debe poder verla/cargarla.

Un Docente de otra materia no debe poder cargarla.

La restricción debe estar también en backend, no solamente ocultando elementos en React.

Utilizar las relaciones reales Docente ↔ Curso ↔ Materia.

### Docente — Actas

El Docente no debe poder crear **actas de Docentes**.

La restricción debe existir:
- en frontend;
- en backend.

No afectar otras actas que sí correspondan al Docente.

---

# PARTE 7 — Revisión transversal y cierre

## Objetivo

Revisar que las correcciones realizadas en las partes anteriores sean consistentes entre roles.

### Revisar

- nombres y bienvenida;
- autores;
- Calificaciones;
- Intensificaciones;
- Asistencias;
- Actividades;
- perfiles;
- permisos;
- comunicados;
- suplencias;
- historial.

### Verificación

Para cada parte terminada:

1. revisar los cambios;
2. ejecutar tests disponibles;
3. ejecutar build frontend;
4. ejecutar `manage.py check` si corresponde;
5. revisar imports/referencias;
6. comprobar que no hubo cambios de BD;
7. actualizar documentación;
8. informar archivos modificados;
9. informar tests/build/check;
10. indicar cualquier problema pendiente.

---

# ORDEN DE TRABAJO

1. **Parte 1** — Identidad, perfiles y presentación general.
2. **Parte 2** — Calificaciones e Intensificaciones.
3. **Parte 3** — Asistencias y Actividades.
4. **Parte 4** — Comunicados, Calendario y alcance.
5. **Parte 5** — Administrador, personas, suplencias y adelantos.
6. **Parte 6** — Historial administrativo y permisos.
7. **Parte 7** — Revisión transversal y cierre.

---

# REGLA PARA LA IA

Cuando el usuario diga:

> **"Avanza con la Parte X"**

deberás:

1. Leer este documento completo.
2. Trabajar solamente la Parte X.
3. Inspeccionar primero la implementación actual.
4. No adelantarte a otras partes.
5. Resolver completamente los puntos de esa parte.
6. Si aparece un problema perteneciente a otra parte, documentarlo y no modificarlo salvo que sea una dependencia estrictamente necesaria.
7. No modificar la BD.
8. No ejecutar SQL de escritura.
9. No crear migraciones.
10. No hacer commit ni push.
11. Ejecutar verificaciones.
12. Actualizar documentación/historial.
13. Informar qué se hizo y qué quedó pendiente.

## ESTADO

- ⬜ Parte 1 — Pendiente
- ⬜ Parte 2 — Pendiente
- ⬜ Parte 3 — Pendiente
- ⬜ Parte 4 — Pendiente
- ⬜ Parte 5 — Pendiente
- ⬜ Parte 6 — Pendiente
- ⬜ Parte 7 — Pendiente
