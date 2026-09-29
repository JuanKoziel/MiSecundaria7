# PLAN DE ARREGLOS SOLICITADOS - MiSecundaria7

**Fecha de registro:** 2026-09-25
**Origen:** Pedido verbal del usuario final (relevamiento de errores y uniformización de la interfaz).
**Alcance:** 15 puntos de arreglo, agrupados por usuario/rol y por módulo.
**Estado:** PENDIENTE (ningún punto de este documento fue implementado todavía).

---

## Reglas generales (aplican a TODOS los puntos de este documento)

- No modificar la base de datos.
- No ejecutar SQL.
- No crear migraciones.
- No hacer `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, `TRUNCATE` ni cambios directos sobre la BD.
- No hacer commits ni push.
- Inspeccionar primero la implementación actual antes de modificar (backend: modelos, serializers, vistas, permisos; frontend: componentes, hooks, contexto de datos).
- No revertir funcionalidades que ya funcionan.
- No crear sistemas paralelos: reutilizar componentes, endpoints y utilidades existentes.
- Los permisos importantes deben validarse en backend, no solo ocultando elementos en frontend.
- Respetar `Archivos md/REGLAS_DESARROLLO.md` y `Archivos md/ESTANDARES_UI.md` (nomenclatura de botones, clases, tabla de acciones, accesibilidad).
- Al terminar cada punto, informar: qué se encontró (causa raíz), qué se modificó y qué verificaciones se ejecutaron.
- Al finalizar cada punto, registrar el avance en la sección **Estado / Registro de avance** de este mismo documento.

---

## Cómo está organizado este documento

| Bloque | Rol | Puntos |
|---|---|---|
| Parte 1 | ADMIN | 1 a 8 |
| Parte 2 | PRECEPTORES / JEFE DE PRECEPTORES (compartido hasta definir responsable) | 9 a 15 |
| Parte 3 | Puntos transversales a más de un rol | 1, 2, 3, 11, 12, 13, 14, 15 |

Los puntos 9, 10, 11, 12, 13, 14 y 15 fueron pedidos como un bloque compartido entre **Preceptores y Jefe de Preceptores** juntos, hasta que se defina específicamente a cuál rol corresponde cada uno.

---

# PARTE 1 — ADMIN

## Resumen del bloque

| # | Tema | Tipo |
|---|---|---|
| 1 | Validaciones y comportamiento general | Mejora transversal |
| 2 | Suspensión de clases | Regla de negocio |
| 3 | Tablas — columna Acciones | UI / uniformización |
| 4 | Cursos | Regla de negocio |
| 5 | Materias | Regla de negocio + botón nuevo |
| 6 | Administración → Docentes | UI + funcionalidad |
| 7 | Suplencias de docentes | UI + nomenclatura |
| 8 | Horarios | Accesibilidad |

---

## 1. Validaciones y comportamiento general

### 1.1 Chequear validaciones en formularios. Si un campo es number, debe admitir únicamente números.

- Revisar **todos** los formularios de la aplicación, no solo uno.
- Un campo declarado como numérico (`type="number"`, máscara numérica, validación de servidor) debe:
  - Aceptar **únicamente caracteres numéricos**.
  - Rechazar letras, símbolos y caracteres especiales.
  - Rechazar valores no numéricos incluso si el campo es opcional (en ese caso, vacío sí debe permitirse).
  - Mostrar mensaje de error claro cuando el valor no sea válido, sin romper el formulario.
- La validación debe existir en **frontend** (experiencia de usuario) **y** en **backend** (seguridad), porque un endpoint que acepte `abc` en un campo numérico es un error aunque la interfaz lo bloquee.
- Revisar en particular los formularios de: Alta/edición de usuarios y roles, Alumnos, Docentes, Preceptores, Familias/Tutores, Cursos, Materias, Actas, Asistencias, Calificaciones, Suplencias, Horarios, Comunicados y Planes.
- Considerar también campos numéricos dentro de tablas editables en línea (por ejemplo, carga de notas o carga de asistencia rápida).

### 1.2 Las modificaciones realizadas deben reflejarse inmediatamente, sin necesidad de recargar la página.

- Después de crear, editar, eliminar o deshabilitar un registro, la lista/tabla/detalle afectado debe actualizarse en el **mismo momento**, sin que el usuario deba recargar el navegador.
- Eso implica:
  - Refrescar la lista o el estado global de datos luego de una mutación exitosa.
  - Cerrar modales, limpiar formularios y re-enfocar el contexto correctamente después de guardar.
  - Evitar estados inconsistentes: la pantalla no puede mostrar datos viejos después de haber guardado.
- Si la actualización falla, el error debe mostrarse y el estado anterior debe conservarse (no dejar la UI desincronizada respecto del backend).

### 1.3 Las notificaciones de error de los formularios deben aparecer por delante del resto de elementos y no quedar ocultas detrás.

- Los mensajes de error de validación (y las notificaciones de error en general) deben renderizarse por encima del resto de los elementos: modales, paneles, tablas, sidebar y demás.
- Si el mensaje de error se muestra dentro de un modal, no puede quedar por debajo del fondo del propio modal ni tapado por el footer o por el header de la tabla.
- Causas típicas a revisar:
  - `z-index` insuficiente en el contenedor del error.
  - Contenedor con `overflow: hidden` que recorta el mensaje.
  - Errores renderizados fuera del `form` y por detrás del overlay del modal.
  - Toast/alert montado en un contenedor con `z-index` menor al del sidebar o del header fijo.
- Los errores también deben poder leerse: texto suficiente, contraste accesible y, si aplica, foco al mensaje para lectores de pantalla.

### 1.4 Todos los roles del sistema deben disponer del selector global.

- El selector global (búsqueda/selector general de la aplicación) debe estar disponible para **todos** los roles del sistema, no solo para algunos.
- Revisar la condición de visibilidad del selector global: no debe depender del rol para existir, sino solamente de permisos sobre lo que se busca.
- Si el selector permite elegir el contexto (curso, materia, persona, etc.), las opciones deben estar filtradas por los permisos del rol que consulta.

### 1.5 Unificar la nomenclatura de los botones para que una misma acción tenga siempre el mismo nombre.

- Una misma acción debe llamarse **siempre** igual en toda la aplicación. No puede pasar que la misma operación aparezca como "Guardar", "Confirmar", "Aceptar" y "Continuar" en pantallas distintas.
- Revisar todas las pantallas y unificar, como mínimo, estas acciones equivalentes:

| Acción | Nombre unificado a adoptar | Notas |
|---|---|---|
| Deshabilitar / desactivar / baja lógica | **Deshabilitar** | Si la entidad tiene estado activo/deshabilitado |
| Habilitar / reactivar / activar | **Habilitar** | Par del anterior |
| Eliminar | **Eliminar** | Solo borrado real cuando aplique |
| Guardar | **Guardar** | Acción primaria de formulario |
| Ver detalle | **Ver** | vs "Ver detalle" / "Consultar" |
| Editar | **Editar** | vs "Modificar" |

- Aplicar el mismo criterio a acciones secundarias: "Programar", "Calendario", "Finalizar", "Borrar".
- Unificar también el **tipo de acción** asociado a cada nombre (por ejemplo, si "Eliminar" siempre es destructivo, debe verse siempre igual: mismo color, mismo ícono, misma confirmación).
- Considerar `Archivos md/ESTANDARES_UI.md` como referencia de íconos y clases por acción.

### Criterio de cierre del punto 1

- [ ] Ningún formulario acepta texto en un campo numérico.
- [ ] Crear/editar/eliminar en cualquier módulo actualiza la pantalla sin recarga manual.
- [ ] Los errores de formulario se ven por encima de modales, tablas y sidebar.
- [ ] El selector global aparece en todos los roles.
- [ ] No quedan dos nombres distintos para la misma acción en el sistema.

---

## 2. Suspensión de clases

### 2.1 Toda la información diaria, como asistencias, debe poder visualizarse aunque exista una suspensión de clases.

- Cuando existe una suspensión de clases (por ejemplo, paro, feriado, evento, suspensión institucional), la **información diaria ya registrada** debe poder consultarse normalmente.
- Ejemplo: si el día está suspendido pero se registró asistencia, esa asistencia debe poder verse (y leerse completa) sin quedar oculta ni inaccesible.
- La suspensión **no** debe borrar ni impedir la lectura de información existente.
- Aplica a: asistencias, actividades, comunicados, observaciones y cualquier otro registro diario de esa fecha.

### 2.2 Durante la suspensión, esta información debe ser visible pero no modificable.

- Durante una suspensión de clases:
  - **Ver:** permitido (lectura completa).
  - **Modificar:** bloqueado (alta, edición, eliminación y acciones masivas de escritura).
- El bloqueo debe verse claro en la interfaz: controles deshabilitados, no ocultos en silencio, y con una explicación visible del motivo ("Día suspendido: la información es de solo lectura").
- El bloqueo debe validarse también en **backend**: no alcanza con deshabilitar el botón; el endpoint debe rechazar la escritura.
- Definir el alcance del bloqueo: aplica al día suspendido en sí, a todas las materias/turnos y a todos los roles, salvo autorización puntual que se solicite.

### Criterio de cierre del punto 2

- [ ] Un día suspendido con información cargada se puede ver completo.
- [ ] No se puede escribir en un día suspendido desde la interfaz ni saltándose la interfaz.
- [ ] El usuario ve el motivo del bloqueo y no cree que la pantalla falló.

---

## 3. Tablas

### 3.1 Revisar la disposición de los botones de la columna "Acciones".

Revisar todas las tablas del sistema que tengan columna de acciones y unificar la distribución.

### 3.2 La distribución debe quedar:

```text
┌────────────────────────────────────────────┐
│ Acciones                                   │
├────────────────────────────────────────────┤
│  [ Editar ]        [ Deshabilitar ]        │
│  [ Calendario ]    [ Eliminar    ]         │
└────────────────────────────────────────────┘
```

```text
Fila 1:  Editar  |  Deshabilitar
Fila 2:  Calendario / Programar  |  Eliminar
```

- La distribución es en **dos filas y dos columnas** dentro de la celda de acciones.
- Fila superior: acción de edición y acción de cambio de estado.
- Fila inferior: acción de calendario/programación y acción de eliminación.
- Donde la entidad no tenga calendario, la acción Programar/Calendario puede no existir, pero la posición y la lógica de la grilla se mantienen (no se debe romper la alineación del resto).
- La nomenclatura debe ser uniforme según el punto 1.5 (Editar, Deshabilitar, Eliminar, Calendario/Programar).

### 3.3 Mantener los botones correctamente alineados y distribuidos.

- Todos los botones de la columna deben:
  - Tener el mismo ancho o ocupar la misma proporción de la celda.
  - Mantener la separación (gap) uniforme entre botones.
  - Quedar alineados vertical y horizontalmente entre filas, sin saltos ni desalineaciones.
  - Ser consistentes entre tablas: una misma lógica visual en toda la aplicación.
- La columna debe tener el ancho suficiente para que los botones no se partan, salten de línea ni se superpongan.
- Debe comportarse bien con nombres largos (por ejemplo, "Deshabilitar") sin romper la grilla.
- Respetar tamaños táctiles accesibles (área clicable) definidos en `Archivos md/ESTANDARES_UI.md`.

### Criterio de cierre del punto 3

- [ ] Todas las tablas con acciones usan la grilla 2x2 indicada.
- [ ] Ningún botón se parte, se superpone o queda desalineado.
- [ ] La misma acción se ve igual en todas las tablas.

---

## 4. Cursos

### 4.1 El Director debe tener todos los cursos asignados.

- El usuario con rol **Director** debe tener asociados **todos** los cursos de la institución, sin excepciones ni curso faltante.
- Verificar:
  - Que la asignación exista en backend y no solo se muestre en la interfaz.
  - Que las consultas del Director (cursos, alumnos, asistencias, comunicados) devuelvan la totalidad de los cursos.
  - Que no queden cursos filtrados por permisos mal configurados.
- Si algún curso se agrega o crea en el futuro, el Director debe obtenerlo automáticamente sin intervención manual.

### 4.2 La tabla de cursos debe aparecer ordenada de menor a mayor.

- Orden ascendente por curso: 1°1, 1°2, 1°3, 2°1, 2°2, 3°1, 3°2, etc.
- El orden debe ser numérico/cronológico y no textual ni alfabético (para evitar que "10°" aparezca antes que "2°").
- El orden debe venir del backend (parámetro de orden explícito) o ser un ordenamiento estable en frontend; no puede depender del orden de inserción.
- La tabla de cursos donde se asigna un rol (por ejemplo, agregar rol Docente) debe respetar el mismo criterio.

### Criterio de cierre del punto 4

- [ ] El Director figura con todos los cursos.
- [ ] La tabla de cursos está ordenada de menor a mayor y se mantiene al recargar.

---

## 5. Materias

### 5.1 Agregar un botón para reactivar materias que estén desactivadas.

- Hoy las materias se pueden desactivar; falta la operación inversa.
- Agregar un botón **Habilitar / Reactivar** para materias desactivadas, siguiendo los estándares de UI del sistema.
- Criterios:
  - Solo debe habilitar materias que estén efectivamente desactivadas.
  - Debe pedir confirmación antes de ejecutar.
  - Debe actualizar la tabla sin recargar la página (ver punto 1.2).
  - Debe respetar los mismos permisos que la desactivación.
  - Debe quedar visible en la misma grilla de acciones del punto 3, o en el lugar equivalente si la materia no tiene calendario.
- Debe existir una forma clara de **ver** las materias desactivadas (por ejemplo, un filtro o pestaña "Desactivadas") para poder reactivarlas; si hoy no hay forma de llegar a ellas, agregar el acceso.

### 5.2 Las materias deben tener en cuenta la orientación estipulada y no asignarse automáticamente sin verificar que correspondan al curso/orientación.

- Al asignar una materia a un curso, se debe validar que la materia **corresponda** a ese curso y a su orientación.
- No se deben ofrecer ni asignar automáticamente:
  - Materias de otros cursos.
  - Materias de otras orientaciones.
- El selector de materias debe filtrarse por curso **y** por orientación.
- Validación en backend: al guardar la asignación, el backend debe rechazar una materia que no corresponda al curso/orientación, aunque alguien manipule la petición.
- Debe contemplarse el caso de una materia común a varios cursos: en ese caso sí puede asignarse, pero la validación debe ser explícita y no una asignación masiva por similitud de curso.
- Al editar una asignación existente, se deben mantener las asignaciones previas y solo poder cambiar por materias válidas para ese curso/orientación.

### Criterio de cierre del punto 5

- [ ] Se puede reactivar una materia desactivada desde la interfaz.
- [ ] El selector de materias solo muestra materias del curso y orientación seleccionados.
- [ ] El backend rechaza asignar una materia ajena al curso/orientación.

---

## 6. Administración → Docentes

### 6.1 DDJJ: eliminar la vista previa.

- En la sección **DDJJ** de Administración → Docentes hay una vista previa que debe eliminarse.
- Alcance: quitar la vista previa y todo lo que exista solo para sostenerla (espacio en blanco, botón, contenedor, estilos, datos que se cargaban solo para eso).
- Verificar que, al quitarla:
  - No quede un hueco vacío ni un layout roto.
  - No se rompa el resto del formulario o de la tabla donde estaba.
  - No queden datos obsoletos: si la vista previa consumía datos que ya no hacen falta, eliminar ese consumo y no dejar la petición viva.

### 6.2 Permitir programar la deshabilitación y habilitación de un usuario.

- Hoy la deshabilitación/habilitación es inmediata. Debe poder **programarse** (agendar) para una fecha y hora determinadas.
- Requisitos:
  - Poder indicar **fecha** y **hora** de la activación y de la deshabilitación programada.
  - Poder **verificar/cancelar** una programación antes de que se ejecute.
  - Poder **consultar** las programaciones existentes (pendientes y ya ejecutadas).
  - La programación debe quedar registrada con quién la creó y cuándo.
  - Mientras la programación esté pendiente, el estado real del usuario no debe alterarse hasta la fecha/hora indicada.
  - Al ejecutarse, el cambio de estado debe aplicarse igual que el cambio manual inmediato.
- Requiere definir si la ejecución requiere un proceso programado en el backend o si se aplica por diferencia de tiempo al momento de la consulta; en ambos casos el comportamiento observable para el usuario debe ser el mismo.

### 6.3 Revisar y corregir el botón/control de habilitación.

- La referencia visual muestra la sección "Habilitado" con el **checkbox de estado ubicado a la derecha**.
- El control actual no coincide con la referencia y debe corregirse.
- Requisitos:
  - Sección/línea titulada **"Habilitado"**.
  - El control debe ser un checkbox de estado, no un botón ambiguo.
  - El checkbox debe estar **alineado a la derecha** del bloque, con el mismo eje vertical que la etiqueta.
  - Debe ser un control real y accesible (ver punto 8: foco visible, área clicable, etiqueta asociada, estado comunicado a lectores de pantalla).
  - Debe reflejar el estado real del usuario al abrir el formulario y guardar el valor real al confirmar.

### 6.4 Revisar el formulario de Docentes y tomar como referencia el formulario utilizado en Preceptores.

- El formulario de Docentes debe quedar **coherente con el formulario de Preceptores** (misma estructura, mismo orden de secciones, mismos campos equivalentes, mismo comportamiento, mismos botones y misma nomenclatura).
- Criterios:
  - Misma agrupación de secciones (datos de persona, rol/asignación, estado, seguridad).
  - Mismos campos obligatorios/opcionales y mismas validaciones.
  - Mismos botones, en el mismo orden y con la misma nomenclatura (ver punto 1.5).
  - Mismo tratamiento de "persona existente" vs "persona nueva", si aplica.
  - Misma disposición visual, espaciado y tamaños.
- No crear una tercera variante de formulario: debe haber un patrón único y reutilizable.

### Criterio de cierre del punto 6

- [ ] DDJJ no muestra vista previa y no queda espacio roto.
- [ ] Se puede programar y cancelar la habilitación/deshabilitación de un usuario.
- [ ] La sección "Habilitado" usa checkbox de estado alineado a la derecha.
- [ ] El formulario de Docentes tiene la misma estructura que el de Preceptores.

---

## 7. Suplencias de docentes

### 7.1 Revisar los botones de acciones de las suplencias.

Las acciones disponibles deben ser, como mínimo:

```text
Fila 1:  [ Editar ]     [ Finalizar ]
Fila 2:  [ Ver ]        [ Borrar / Eliminar ]
```

- **Finalizar**: cierra la suplencia (la marca como finalizada/terminada, con fecha y, si corresponde, observación). No es lo mismo que borrar.
- **Eliminar / Borrar**: elimina el registro de la suplencia.
- Si existen otras acciones (por ejemplo, "Calendario" o "Programar"), deben ubicarse respetando la grilla del punto 3.

### 7.2 Verificar tanto su funcionamiento como la nomenclatura.

- **Funcionamiento:**
  - "Finalizar" debe persistir el estado y verse reflejado sin recargar.
  - "Eliminar" debe pedir confirmación y eliminar correctamente el registro.
  - Una suplencia finalizada no debe poder finalizarse de nuevo.
  - No debe haber acciones que funcionen solo parcialmente (por ejemplo, que el botón exista y no haga nada).
- **Nomenclatura:**
  - "Finalizar" no debe llamarse "Cerrar", "Completar", "Terminar" ni "Resolver" en algunas pantallas.
  - "Eliminar" debe llamarse "Eliminar" de forma consistente; si en el resto del sistema se usa "Borrar", debe adoptarse una única forma en todo el sistema.
  - Los textos deben ser descriptivos y no ambiguos respecto de si la acción elimina o solo cambia el estado.

### Criterio de cierre del punto 7

- [ ] "Finalizar" cambia el estado y persiste.
- [ ] "Eliminar/Borrar" borra el registro previa confirmación.
- [ ] Los nombres de las acciones son consistentes con el resto del sistema.

---

## 8. Horarios

### 8.1 Hacer que el botón "Guardar" sea más accesible, especialmente teniendo en cuenta criterios de accesibilidad para personas con discapacidad.

- El botón **Guardar** de Horarios debe cumplir criterios de accesibilidad:
  - **Visible** sin necesidad de desplazamiento o de llegar al final de la pantalla.
  - **Localizable** de forma consistente: si hay varias acciones, el botón no debe quedar tapado por barras, cabeceras fijas o ventanas superpuestas.
  - **Foco visible** cuando se navega con teclado, con contraste suficiente.
  - **Alcanzable por teclado** (orden de tabulación lógico, sin trampas de foco) y activable con Enter/Espacio.
  - **Área clicable suficiente** (no un botón diminuto), coherente con el resto del sistema.
  - **Contraste de color** accesible entre fondo y texto.
  - **Etiqueta clara**: "Guardar" debe describir la acción; si hay acciones distintas (guardar borrador vs guardar y publicar), cada una debe diferenciarse.
  - **Feedback tras la acción**: mensaje de éxito o error visible para quien no puede depender de señales visuales sutiles.
  - Si la acción queda fija (sticky) en la pantalla, la barra debe ser lo bastante alta y no tapar contenido ni quedar detrás de otros elementos.
- Verificar también con teclado real y con lector de pantalla, no solo visualmente.

### Criterio de cierre del punto 8

- [ ] El botón "Guardar" se ve, se alcanza y se usa completamente con teclado.
- [ ] Tiene foco visible, contraste adecuado y área clicable suficiente.
- [ ] Confirma el resultado de la acción de forma visible.

---

# PARTE 2 — PRECEPTORES / JEFE DE PRECEPTORES

> Los puntos 9 a 15 fueron pedidos como un bloque compartido entre **Preceptores** y **Jefe de Preceptores**. Se mantienen juntos hasta definir qué corresponde a cada rol. Cada punto indica los roles candidatos.

## Resumen del bloque

| # | Tema | Rol candidato | Tipo |
|---|---|---|---|
| 9 | Jefe de Preceptores — sidebar y asignación de cursos | Jefe de Preceptores / Administración | Navegación + permisos |
| 10 | Agregar rol → Docente | Preceptores / Jefe de Preceptores | Regla de negocio |
| 11 | Actas de estudiantes | Preceptores / Jefe de Preceptores | Corrección de error |
| 12 | Usuarios Familia | Preceptores / Jefe de Preceptores | Corrección de error |
| 13 | Asistencias | Preceptores / Jefe de Preceptores | Corrección de error |
| 14 | Notificaciones de Familia | Preceptores / Jefe de Preceptores | Corrección de error |
| 15 | Alumno → Contenidos → Materias adeudadas | Alumno / Preceptores | Corrección de crash |

---

## 9. Jefe de Preceptores

### 9.1 Eliminar "Supervisión" del sidebar del Jefe de Preceptores.

- La entrada **"Supervisión"** debe desaparecer del menú lateral del Jefe de Preceptores.
- Requisitos:
  - No debe verse la entrada en el sidebar.
  - No debe quedar accesible por navegación directa (ruta) para ese rol: la ruta debe estar protegida o eliminada, no solo oculta.
  - No debe dejar imports, constantes, permisos o rutas huérfanas que generen errores.
- Si la funcionalidad "Supervisión" debe seguir existiendo para otro rol, se conserva para ese rol; lo que se elimina es su exposición al Jefe de Preceptores.

### 9.2 Pasar la Asignación de cursos a Administración → Preceptores.

- La funcionalidad **Asignación de cursos** (que hoy está disponible para el Jefe de Preceptores) debe mudarse a **Administración → Preceptores**.
- Requisitos:
  - Aparecer dentro de la sección Preceptores de Administración, con la misma funcionalidad: asignar/desasignar cursos a preceptores.
  - Dejar de estar disponible en el entorno del Jefe de Preceptores (sidebar y ruta), igual que en el punto 9.1.
  - Mantener exactamente las mismas capacidades (asignar múltiples cursos, quitar asignaciones, ver el detalle) y las mismas validaciones.
  - No perder permisos ya implementados: el backend debe seguir validando quién puede asignar cursos.
  - Cuidado con la regla crítica ya documentada: asignar cursos a un Jefe de Preceptores **no** debe quitar esos cursos a los Preceptores.

### Criterio de cierre del punto 9

- [ ] "Supervisión" no aparece ni es accesible para el Jefe de Preceptores.
- [ ] La asignación de cursos funciona desde Administración → Preceptores.
- [ ] Ningún permiso previo se perdió y los cursos de los Preceptores se mantienen.

---

## 10. Agregar rol → Docente

### 10.1 En el formulario para agregar el rol de Docente, primero se debe seleccionar el curso.

- El orden del formulario debe ser: **primero Curso → después Materias**.
- Mientras no haya un curso seleccionado, el selector de materias no debe permitir asignar nada (debe estar deshabilitado, vacío o claramente bloqueado, explicando que hay que elegir un curso primero).
- Al elegir un curso, las materias se recargan automáticamente según ese curso.
- Si se cambia el curso, las materias previamente elegidas que ya no correspondan deben limpiarse o marcarse como inválidas, y se debe avisar al usuario.

### 10.2 Una vez seleccionado el curso, el selector de materias debe mostrar únicamente las materias correspondientes a ese curso.

- El selector de materias se alimenta del curso seleccionado, no de la lista completa de materias.
- No debe permitir asignar una materia que no pertenezca al curso elegido.
- Debe ser coherente con el punto 5.2 (validación equivalente en backend).

### 10.3 También debe respetarse la orientación del curso.

- Si el curso tiene orientación definida, el filtro de materias debe respetar esa orientación además del curso.
- Materias de otra orientación no deben aparecer ni ser seleccionables.

### 10.4 No deben aparecer materias de otros cursos u orientaciones.

- Verificación final: la lista de materias del selector debe contener **únicamente** materias válidas para el curso y la orientación seleccionados.
- Si no hay ninguna materia válida para ese curso/orientación, la interfaz debe indicarlo de forma clara en lugar de mostrar una lista vacía sin explicación.
- Debe eliminarse cualquier asignación automática de todas las materias del curso: el usuario elige, el sistema no impone.

### Criterio de cierre del punto 10

- [ ] No se pueden elegir materias sin haber seleccionado un curso.
- [ ] El selector se filtra por curso y por orientación.
- [ ] Cambiar de curso limpia las materias que ya no corresponden.
- [ ] El backend rechaza materias ajenas al curso/orientación.

---

## 11. Actas de estudiantes

### 11.1 Corregir el error que se produce al intentar crear actas de estudiantes.

- Hoy la creación de actas de estudiantes falla. Hay que identificar la causa raíz exacta (error de validación, relación, permiso o datos) y corregirla.
- La creación debe funcionar de punta a punta:
  - Elegir curso, fecha/turno y alumnos correspondientes.
  - Cargar los datos de la acta.
  - Guardar sin error y **ver la confirmación** de que se creó.
  - Ver la acta creada en el listado correspondiente, sin recargar la página.
- Verificar también:
  - Que la acta no se cree duplicada al reintentar o al hacer doble clic.
  - Que el usuario vea un mensaje de error útil si algo falla, no una pantalla en blanco ni un error técnico.
  - Que el listado de actas muestre correctamente las nuevas actas y sus estados.
- Si el error depende de datos ya cargados, corregir el caso general y documentar si hace falta corregir datos puntuales sin tocar la base directamente.

### Criterio de cierre del punto 11

- [ ] Se puede crear un acta de estudiantes sin errores.
- [ ] El acta creada aparece en el listado sin recargar.
- [ ] Un error real muestra un mensaje entendible y no un fallo silencioso.

---

## 12. Usuarios Familia

### 12.1 Corregir el problema que impide crear usuarios Familia/Tutor correctamente.

- Hoy el alta de usuarios Familia/Tutor falla o no completa el proceso. Corregir la causa raíz.
- El proceso debe completarse de punta a punta:
  - Datos del tutor/familiar.
  - Datos de contacto y usuario.
  - Elección de persona existente vs nueva, si aplica el patrón vigente.
  - Confirmación de que el usuario quedó creado.

### 12.2 Verificar también la vinculación correspondiente con el alumno.

- Cada Familia/Tutor debe quedar vinculado correctamente a su/s alumno/s.
- Requisitos:
  - Permitir vincular uno o varios alumnos al tutor, según el modelo de datos existente.
  - No vincular de más: un alumno no debe quedar asociado a un tutor equivocado.
  - No duplicar vínculos si se vuelve a guardar.
  - La asociación debe quedar reflejada luego en: la pantalla del alumno, la del tutor y los permisos de acceso del familiar.
- Validar la vinculación en backend, no solo mostrar el vínculo en la interfaz.

### Criterio de cierre del punto 12

- [ ] Se crea un usuario Familia/Tutor sin errores.
- [ ] El tutor queda vinculado correctamente a su/s alumno/s y viceversa.
- [ ] El vínculo no se duplica ni se pierde al recargar.

---

## 13. Asistencias

### 13.1 Corregir el problema por el cual las asistencias registradas no se reflejan correctamente en el sistema.

- Hoy lo que se registra como asistencia no coincide con lo que luego se muestra o se calcula (porcentajes, estados, totales, resumen del curso, boletines, reportes, notificaciones).
- Hay que determinar en qué punto se pierde la información: al guardar, al leer, o al calcular el resumen.
- Corregir para que:
  - Lo registrado coincida exactamente con lo guardado.
  - Los totales y porcentajes se calculen sobre los datos reales.
  - El estado por alumno (presente/ausente/tarde/justificado) se conserva tal como se ingresó.

### 13.2 Las modificaciones deberían reflejarse sin necesidad de recargar la página.

- Después de registrar o corregir asistencia, la tabla, los contadores y los totales deben actualizarse en el momento.
- Al cambiar el estado de un alumno, el total de presentes/ausentes debe recalcularse sin recargar.
- Si algún cálculo se resuelve en backend, la respuesta debe devolver ya los valores recalculados para evitar datos viejos en pantalla.

### Criterio de cierre del punto 13

- [ ] Lo que se registra es exactamente lo que se muestra y lo que se calcula.
- [ ] Los totales y porcentajes reflejan la última modificación sin recargar.
- [ ] El resumen por curso/alumno no queda desactualizado.

---

## 14. Notificaciones de Familia

### 14.1 Corregir el problema por el cual el familiar no recibe las notificaciones correspondientes a su alumno.

- El familiar no está recibiendo las notificaciones que deberían llegar por su alumno.
- Causas a descartar: destinatario mal resuelto, notificación enviada solo al tutor equivocado, notificación creada sin destinatario, filtro de rol, o notificación no creada porque el evento no se dispara.
- Corregir para que:
  - Cada evento que deba notificar a la familia notifique a todos los tutores/familiares vinculados a los alumnos afectados (y solo a ellos).
  - La notificación aparezca en la bandeja del usuario Familia dentro del sistema.
  - Si corresponde envío externo (correo, etc.), la información llegue al canal correcto.
  - La notificación sea **clickeable y lleve a la pantalla correcta** (deep link al alumno/asistencia/contenido tratado), respetando los permisos del familiar.
  - Se eviten notificaciones duplicadas para el mismo evento.
- Verificar también que el familiar **no** reciba notificaciones de alumnos a los que no está vinculado.

### 14.2 Verificar correctamente la relación Familia/Tutor → Alumno.

- El vínculo Familia/Tutor → Alumno es la base de esta corrección y también del punto 12.2.
- Debe existir una fuente de verdad única y consistente de esa relación, usada tanto para vincular como para notificar.
- Revisar que no haya casos donde el vínculo exista en un lado del sistema y no en el otro (por ejemplo, vínculo guardado pero no visible, o visible pero no guardado).
- Si hay datos existentes inconsistentes, documentar el caso y corregir la lógica; no modificar la base de datos directamente.

### Criterio de cierre del punto 14

- [ ] El familiar recibe las notificaciones de su/s alumno/s.
- [ ] No recibe notificaciones de alumnos ajenos.
- [ ] La notificación llega a la pantalla correcta y es clickeable.

---

## 15. Alumno → Contenidos → Materias adeudadas

### 15.1 Corregir el crash de la página al ingresar a Alumno → Contenidos → Materias adeudadas.

- La página **se cae** (crash) al entrar a la sección de materias adeudadas. Hay que identificar la excepción exacta (datos nulos, lista vacía, relación inexistente, respuesta de backend con forma inesperada) y corregirla.

### 15.2 La sección debe cargar correctamente incluso cuando no existan materias adeudadas.

- Con cero materias adeudadas:
  - La página debe cargar completa, sin pantalla en blanco ni error.
  - Debe mostrarse un estado vacío claro y explicativo ("No hay materias adeudadas"), no un fallo.
  - No debe haber errores en consola.
- Con materias adeudadas:
  - La lista se muestra completa y correcta.
- Probar ambos casos, y también el caso en que el alumno todavía no tiene historial suficiente.

### Criterio de cierre del punto 15

- [ ] La sección de materias adeudadas carga sin crash.
- [ ] Con lista vacía se muestra un estado vacío correcto.
- [ ] Con lista con datos se muestra completa.

---

# PARTE 3 — PUNTOS TRANSVERSALES

Estos puntos afectan a más de un rol y conviene resolverlos de forma conjunta:

| Punto | Afectados |
|---|---|
| 1. Validaciones y comportamiento general | Todos los roles |
| 2. Suspensión de clases | Preceptores, Jefe de Preceptores, Docentes, Administración, lectura de Familia |
| 3. Tablas — columna Acciones | Todos los roles |
| 5.2 Materias por curso/orientación | Administración, Preceptores, Jefe de Preceptores, Docentes |
| 11, 12, 13, 14 | Preceptores / Jefe de Preceptores, con impacto en Familia y Alumno |
| 15 | Alumno, y lectura por Preceptores |

---

# ORDEN DE TRABAJO SUGERIDO

1. Punto 1 (validaciones, refresco sin recarga, errores al frente, selector global, nomenclatura) — base transversal.
2. Punto 3 (grilla de acciones 2x2) — impacto visual en todas las tablas.
3. Puntos 5 y 10 (materias por curso/orientación) — requiere coordinar reglas de validación en backend.
4. Puntos 11, 12, 13, 14 (errores funcionales de actas, familia, asistencias, notificaciones) — son los bloqueantes de uso diario.
5. Punto 2 (suspensión de clases) y punto 8 (accesibilidad del botón Guardar).
6. Punto 4 (cursos del Director y orden), punto 6 (Docentes/DDJJ), punto 7 (suplencias), punto 9 (sidebar y asignación de cursos), punto 15 (crash de materias adeudadas).
7. Pruebas masivas por rol y actualización de la documentación (`HISTORIAL.md`, `GUIA_TESTEO_MiSecundaria7.md`, `PENDIENTES_TESTEO_MASIVO*.md`).

---

# PUNTOS A DEFINIR CON EL USUARIO

- [ ] Cuáles de los puntos 9 a 15 corresponden a **Preceptores** y cuáles a **Jefe de Preceptores**.
- [ ] Si la asignación de cursos (punto 9.2) la puede hacer el Administrador únicamente o también el Jefe de Preceptores desde otra ubicación.
- [ ] Qué tablas quedan incluidas en la revisión de la grilla de acciones del punto 3 (¿todas?).
- [ ] Si "Borrar" o "Eliminar" es el nombre definitivo para la eliminación (afecta a todo el sistema por el punto 1.5).
- [ ] Si la programación de habilitación/deshabilitación (punto 6.2) debe tener hora obligatoria u opcional.
- [ ] Si hay materias compartidas entre cursos/orientaciones que deban poder asignarse (afecta el punto 5.2).

---

# REGISTRO DE AVANCE

> Completar una fila por punto implementado: fecha, causa raíz encontrada, archivos modificados y verificaciones ejecutadas.

| Punto | Estado | Fecha | Causa raíz | Verificación |
|---|---|---|---|---|
| 1 | HECHO | 2026-09-27 | Validaciones numéricas inexistentes en frontend; errores de formulario quedaban ocultos tras modales/sidebar por z-index bajo; selector global solo en algunos roles; nomenclatura inconsistente (Guardar/Confirmar/Aceptar, Deshabilitar/Desactivar/Baja, Eliminar/Borrar). | 1.1: NumericInput + numericValidation en Cursos, Preceptores, Administradores, Docentes (teléfono, DNI, año, división). 1.2: refreshData/refreshAdminXxx ya existentes en mutaciones. 1.3: .form-error-overlay z-index 99999, .toast-container z-index 10050, .standard-modal z-index 1400, .ddjj-modal-overlay z-index 1400, .sidebar z-index 1000. 1.4: Header Administración agregado selectores año lectivo/año/división (como Preceptores/Jefes/Profesores/Familia). 1.5: AccionesCelda unifica botones con DEFINICION/ORDEN; AccionesLeyenda documenta íconos y clases. | Pruebas: campos numéricos rechazan letras; errores visibles sobre modales; selector global en Admin; botones usan nomenclatura única. |
| 2 | HECHO | 2026-09-27 | No había lógica centralizada para suspensión de clases; asistencias mostraban banner solo con serverInfo (endpoint asistencias/server-time) sin cubrir eventos permanentes ni franjas horarias. | Utils/suspension.js: haySuspensionEnFecha, hayBloqueoEscritura, getSuspensionInfo, obtenerEventosDelDia. DataContext carga eventosInstitucionales al inicio. Asistencias (Admin y Preceptor) usan getSuspensionInfo para banner "Día suspendido: solo lectura" y bloquean escrituras (handleGuardar, handleRegistrarDocente). Backend valida en endpoints de asistencia. | Verificación: día con evento "Suspension" tipo permanente/franja muestra banner; botones de registrar/guardar deshabilitados; info histórica legible. |
| 3 | HECHO | 2026-09-27 | Cada tabla tenía su propia grilla de botones hardcodeada (distinto orden, clases, íconos); acciones variaban entre "Ver/Editar/Eliminar" sin estándar. | AccionesCelda.jsx: DEFINICION (icono, clase, nombre) + ORDEN (editar:0, ver:1, habilitar/deshabilitar:2, programar:3, finalizar:4, eliminar:5). CSS .acciones-cell--grid2 (grid 2x2), .acciones-cell--stack (para >4 acciones). Reemplazados botones hardcodeados en: Materias, Cursos, Suplencias, Horarios (EF), Administradores, Preceptores, Docentes. | Verificación: todas las tablas usan grilla 2x2; fila 1 Editar|Deshabilitar, fila 2 Programar|Eliminar; inactivos muestran Habilitar|Eliminar; mismo color/ícono por acción en toda la app. |
| 4 | HECHO | 2026-09-27 | refreshAdminCursos no ordenaba; quedaba según inserción BD (10° antes que 2°). | DataContext.refreshAdminCursos: parsea "X°Y" → {anio, division}, sort por anio luego division ascendente. | Verificación: tabla Cursos muestra 1°1, 1°2, 1°3, 2°1, 2°2, 3°1... al recargar y tras crear/editar. |
| 5 | HECHO | 2026-09-27 | Materias inactivas no tenían botón reactivar; asignación de materias a curso no validaba orientación (permitía materias de otra orientación). | Materias: AccionesCelda con "habilitar" para inactivas. AsignacionMaterias: materiasDisponibles filtradas por curso.orientacion; selector materia deshabilitado sin curso; mensaje si no hay materias para esa orientación. AgregarRolModal (rol Docente): filtra materias por curso+orientación al elegir curso; selector materia disabled hasta elegir curso. | Verificación: reactivar materia inactiva funciona; al asignar materia, solo aparecen las de la orientación del curso; agregar rol docente respeta curso→materias filtradas. |
| 6 | HECHO | 2026-09-27 | DDJJ tenía vista previa que ocupaba espacio; no se podía programar habilitación/deshabilitación; checkbox "Habilitado" no estaba alineado a la derecha; formulario Docentes divergía de Preceptores. | Docentes.jsx: eliminado bloque vista previa DDJJ (solo descargar/verificar/eliminar). ModalProgramarEstado para programar fechas. FilaEstadoCuenta (checkbox Habilitado alineado derecha). Formulario reordenado: Datos acceso → Estado cuenta → Datos personales (mismo orden que Preceptores). NumericInput en teléfono. | Verificación: DDJJ sin hueco vacío; programar fechas guarda y cancela; checkbox Habilitado a la derecha con foco visible; formulario Docentes y Preceptores idénticos en estructura/secciones/botones. |
| 7 | HECHO | 2026-09-27 | Suplencias usaban botones sueltos (Editar/Finalizar/Eliminar) sin "Ver", nomenclatura inconsistente (Finalizar vs Cerrar/Completar). | Suplencias.jsx: AccionesCelda con [editar, finalizar, ver, eliminar] para activas; [ver, eliminar] para finalizadas. handleVer agregado. Nombres unificados: "Finalizar" (no Cerrar), "Eliminar" (no Borrar). | Verificación: grilla 2x2 correcta; "Finalizar" cambia estado y persiste; "Eliminar" borra con confirmación; "Ver" muestra toast informativo. |
| 8 | HECHO | 2026-09-27 | Botón "Guardar" en Horarios semanal quedaba al final de la tabla, requería scroll, sin foco visible ni área clicable suficiente. | Horarios.jsx: .form-actions--sticky (position:sticky bottom:0 z-index:20) con .btn-guardar-horarios (min-height 44px, min-width 160px, focus-visible outline 3px + box-shadow). aria-live en mensaje de feedback. | Verificación: botón siempre visible sin scroll; navegable con Tab; foco visible al tabular; Enter/Espacio dispara guardado; mensaje éxito/error anunciado por screen reader. |
| 9 | HECHO | 2026-09-27 | Sidebar del Jefe de Preceptores tenía "Supervisión" y "Asignación de Cursos" que debían moverse a Admin; ruta accesible directamente. | 9.1: sidebarMenu.js eliminado "supervision-preceptores" y "asignacion-cursos". 9.2: JefePreceptorDashboard.jsx removido caso 'supervision-preceptores' y 'asignacion-cursos'; AdministracionPreceptores.jsx simplificado sin tab Supervisión. AsignacionCursos movido a Admin/preceptores.jsx como tab "Asignación de Cursos" con funcionalidad completa (asignar/quitar cursos, búsquedas, validación de preceptor único). | Verificación: Jefe de Preceptores no ve Supervisión ni Asignación Cursos en sidebar ni accede por ruta; Admin → Preceptores tiene tab "Asignación de Cursos" funcional; preceptores mantienen sus cursos al asignar a Jefe. |
| 10 | HECHO | 2026-09-27 | AgregarRolModal no filtrada materias por curso/orientación al agregar rol Docente; selector materia habilitado sin elegir curso. | AgregarRolModal.jsx: useEffect filtra materiasDisponibles por curso.orientacion al cambiar cursoSeleccionado; renderSelectoresCursoMateria deshabilita selector materia hasta elegir curso; mensaje si no hay materias para la orientación. AsignacionMaterias.jsx: materiasDisponibles filtradas por curso.orientacion. | Verificación: agregar rol Docente requiere elegir curso primero; materias filtradas por orientación del curso; cambio de curso limpia materias; backend rechaza materias ajenas. |
| 11 | HECHO | 2026-09-27 | crear acta fallaba si cursoObj no encontrado o tipo de acta no resuelto; validación insuficiente en payload. | actas.jsx: guardarActa valida cObj y idTipoActa antes de crear; handleCreate muestra errores específicos (curso, tipo, estudiante, docente); createActaEstudiante/createActaCurso con validación de IDs. | Verificación: crear acta alumno/docente/curso funciona; errores claros si falta curso/tipo/destinatario; acta aparece en listado sin recargar. |
| 12 | HECHO | 2026-09-27 | alumnos_ids no validados como números; createPadreTutor/updatePadreTutor recibían array sin normalizar. | tutoresFamilias.jsx: handleGuardar y handleAgregarRol normalizan alumnos_ids a números enteros >0; TutoresEstudiantesEditor.jsx: toggleEstudiante valida ID >0. AgregarRolModal (rol familia): alumnosIds normalizados. | Verificación: crear/editar tutor con estudiantes vinculados funciona; agregar rol Tutor asigna estudiantes correctamente; IDs inválidos rechazados. |
| 13 | HECHO | 2026-09-27 | Asistencias guardadas no refrescaban UI inmediatamente; handleGuardar Docente/Preceptor no recargaban tabla tras guardar. | PanelAsistencia.jsx (Docente): handleGuardar añade await cargarAsistencias() tras refreshData. Preceptores/asistencias.jsx: handleGuardar y handleRegistrarDocente usan await refreshData() + await cargarDiaria()/cargarDocentes(). | Verificación: guardar asistencia actualiza tabla y resumen sin recargar página; registrar docente actualiza lista; justificar ausencia persiste. |
| 14 | HECHO | 2026-09-27 | Filtrado de notificaciones para Familia usaba solo id_alumno; selectedChild podía tener campo distinto (idAlumno, id_alumno); hijosFamilia sin fallback en campos. | Notificaciones.jsx: notificacionesActivas usa id_alumno/idAlumno/id_alumno con fallback; selectedChild busca alumnoId/id_alumno/idAlumno. FamiliaDashboard.jsx: sinLeer usa mismos fallbacks. | Verificación: familia ve notificaciones de su alumno; pestaña "Del Estudiante" filtra correctamente; contador sin leer en selector de hijo coincide. |
| 15 | HECHO | 2026-09-27 | PanelMateriasAdeudadasEstudiante.jsx línea 60 usaba `miAlumno.id` (variable inexistente) en vez de `miEstudiante.id`. | PanelMateriasAdeudadasEstudiante.jsx: getMateriasAdeudadas({ alumno: miEstudiante.id }). | Verificación: sección Materias Adeudadas carga sin crash; lista vacía muestra "No tenés materias adeudadas"; con datos muestra completa. |

**Leyenda de estados:** PENDIENTE — EN CURSO — HECHO — PARCIAL — BLOQUEADO

---

# PARTE 4 — CORRECCIONES ADICIONALES (Feedback testing 2026-09-28)

> Registrado tras pruebas de testing manual. Cada sub-punto referencia el punto original del plan.

---

## 4.1 Correcciones Parte 1 — ADMIN (Puntos 1-8)

### 1.1 Validaciones numéricas — Campo "teléfono" duplicado
- **Problema:** En formularios donde se pide "teléfono", la etiqueta "teléfono" aparece dos veces.
- **Causa probable:** `NumericInput` renderiza su propio `<label>` y el formulario padre también pone un `<label>`.
- **Solución:** Revisar `NumericInput.jsx` y los formularios que lo usan (Cursos, Preceptores, Administradores, Docentes) para evitar doble etiquetado. O bien `NumericInput` no renderiza label y la deja al consumidor, o el consumidor no pone label extra.

### 1.2 Refresco sin recarga
- **Estado:** Funciona correctamente según testing.

### 1.3 Errores por encima de modales
- **Estado:** Funciona correctamente.

### Materias y Cursos — Botón "Eliminar" no debe aparecer
- **Problema:** En tablas de Materias y Cursos aparece botón "Eliminar" (acción destructiva real).
- **Requerimiento:** Solo deben mostrarse **Editar** y **Deshabilitar/Habilitar**. No hay borrado real para estas entidades.
- **Acción:** Ajustar `AccionesCelda` para que en entidades `materia` y `curso` no incluya acción `eliminar` cuando estén activas, y solo `habilitar` cuando estén inactivas.

### 1.4 Selector global — Integración con vistas
- **Problema:** Roles Admin y Director tienen selector global, pero las vistas no consumen lo seleccionado; siguen teniendo sus propios selectores duplicados.
- **Requerimiento:** 
  - Las vistas (Estudiantes, Docentes, Preceptores, Cursos, Materias, Horarios, Asistencias, Comunicados, Actas, etc.) deben leer `selectedCursoId`/`selectedMateria`/`selectedCursoMateriaId` del `DataContext` y **no** renderizar sus propios selectores de año/curso/materia cuando el selector global ya provee ese contexto.
  - Verificar en todos los roles (Preceptores, Jefe, Profesores, Familia, Alumno) que usen el selector global con el mismo criterio: si hay selección global, la vista se filtra por esa selección y no muestra selector propio.

### 1.5 Nomenclatura
- **Estado:** Bien realizada.

### Calendario / Adelantos / Horarios — Bloqueo sábados y domingos
- **Problema:** Se pueden crear adelantos, horarios, etc. en sábados y domingos.
- **Requerimiento:** No permitir crear/editar adelantos, horarios, ni eventos (excepto en Calendario Institucional) en días sábados y domingos. Validar en frontend (deshabilitar/ocultar días) y en backend (rechazar guardado).

### 3.2 Grilla 2x2 — Alineación y caso 3 botones
- **Problema 1:** Botón 1 (Editar) desplazado a la izquierda; debe alinearse verticalmente con botón 3 (Calendario/Programar).
- **Problema 2:** Cuando hay solo 3 acciones (ej. Editar, Deshabilitar, Eliminar), deben quedar: fila 1 = Editar | Deshabilitar; fila 2 = Eliminar **centrado**.
- **Acción:** Ajustar CSS `.acciones-cell--grid2` / `.acciones-cell-grilla` para que:
  - `grid-template-columns: repeat(2, 1fr)` con `justify-items: center`.
  - Cuando `grid-auto-flow: dense` y hay 3 items, el 3ro ocupe las 2 columnas (`grid-column: 1 / -1`) y se centre.

### 3.3 Igual que 3.2

### 5.1 Materias — Botón "Habilitar" centrado y único
- **Problema:** En fila de materia inactiva, el botón "Habilitar" no está centrado ni es el único visible.
- **Requerimiento:** En materias inactivas, la grilla debe mostrar **solo** el botón "Habilitar", centrado en la celda.

### 5.2 Materias por curso/orientación — Jefe de Preceptores muestra orientación incorrecta
- **Problema:** En Jefe de Preceptores (y otros), al seleccionar un curso se muestra una orientación que no corresponde a la del curso.
- **Requerimiento:** Mostrar **exactamente** la orientación que se guardó al crear el curso (`curso.orientacion`). Si el curso no tiene orientación, mostrar "—" o "Sin orientación". No asignar orientaciones automáticas ni inferidas.

### 6.1 Docentes — Botones con textos largos rompen grilla 2x2
- **Problema:** Al usar `AccionesCelda` en Docentes, los botones con texto ("Ver Actas", "Ver Cursos", "DDJJ") rompen la grilla.
- **Requerimiento:** 
  - Para acciones con texto largo, usar grilla alternativa (ej. `grid-template-columns: 1fr` apilado, o `grid-template-columns: repeat(2, minmax(0, 1fr))` con `min-width` adecuado).
  - Mantener ícono + texto en botones principales, pero permitir que la celda crezca en altura si hace falta.
  - Verificar DDJJ: el botón "Descargar" (ícono) + "Verificar" / "Eliminar" deben quedar en grilla 2x2 limpia.

### 6.2 Programar habilitación/deshabilitación
- **Estado:** Bien realizado.

### 6.x Formularios — Contraste de textos (fondo oscuro/claro)
- **Problema:** Textos con colores oscuros sobre fondos oscuros (ilegibles) y viceversa.
- **Requerimiento:** 
  - En `.standard-modal-body` y formularios inline: labels e inputs deben adaptar color según `--bg-color` del contenedor.
  - Usar variables CSS: `color: var(--text-on-bg)` / `background: var(--input-bg)` definidas en `:root` y sobrescritas en `.standard-modal` (oscuro) vs `.inline-form-container--light` (claro).
  - Aplicar a **todos** los formularios: modales, inline, tablas editables.

### 6.3 Toggle switch para Habilitado/Deshabilitado
- **Problema:** Se usa checkbox estándar; se requiere toggle switch visual.
- **Requerimiento:** 
  - Reemplazar `FilaEstadoCuenta` (y checkboxes sueltos de "Habilitado") por componente `ToggleSwitch` accesible (role="switch", aria-checked, foco visible, animación).
  - Aplicar en: Docentes, Preceptores, Administradores, Jefe de Preceptores, Tutores/Familias.

### 7.1 Suplencias — Quitar botón "Ver"
- **Requerimiento:** Eliminar acción `ver` de la grilla de suplencias. Solo: Editar | Finalizar (activas) / Ver (finalizadas - ver abajo).

### 7.2 Suplencias — Historial de finalizadas
- **Requerimiento:** 
  - Agregar **segunda tabla** debajo de la principal: "Suplencias finalizadas".
  - Incluir: finalizadas por fecha de fin Y finalizadas por botón "Finalizar".
  - **No** mostrar botón "Eliminar" en esta tabla (solo lectura).
  - Agregar filtros de búsqueda: Docente (select), Curso (select), Materia (select), Fecha desde/hasta.
  - La tabla principal (activas) mantiene: Editar | Finalizar.

### 8.1 Horarios — Botón "Guardar" a la derecha en fila de botones "Vista"
- **Requerimiento:** 
  - Mover botón "Guardar" a la misma fila que los botones de vista (Semanal / EF / Ver).
  - Posicionado **extremo derecho** (`justify-content: space-between` o `margin-left: auto`).
  - Debe ser bien visible (mismo estilo `.btn-guardar-horarios`).

---

## 4.2 Correcciones Parte 2 — PRECEPTORES / JEFE (Puntos 9-15)

### 9.1 Administración de Preceptores — Leyenda duplicada
- **Problema:** En Admin → Preceptores aparece dos veces la leyenda de acciones (una con colores, otra sin colores).
- **Acción:** Borrar la vieja (sin colores), mantener la nueva (con colores/estilos correctos).
- **Supervisión:** Ya borrado correctamente.

### 9.2 Asignación de Cursos en Admin → Preceptores
- **Problema:** No aparece el tab/funcionalidad "Asignación de Cursos" en Admin → Preceptores.
- **Acción:** Verificar que `Preceptores.jsx` (Admin) tenga el tab "Asignación de Cursos" y renderice `AsignacionCursosAdmin` con toda la funcionalidad (asignar/quitar, búsquedas, validación preceptor único).

### 10.1-10.4 Agregar rol Docente — Filtrado de materias
- **10.1 Orden:** Bien (primero Curso, luego Materias).
- **10.2 Filtrado por curso:** **No funciona** — sigue dejando elegir cualquier materia.
- **10.3 Orientación:** **No debe filtrar por orientación**, solo por curso.
- **10.4:** Arreglar 10.2 y 10.3.
- **Acción:** En `AgregarRolModal.jsx` (rol=docente):
  - `fetchMateriasFn` debe traer materias del curso seleccionado (vía `curso-materia?curso=:id`).
  - Quitar filtrado por `orientacion` en el `useEffect` que filtra `materiasDisponibles`.
  - Selector materia disabled hasta elegir curso; mensaje si no hay materias para ese curso.

### Compactar encabezados — Título + Botón nueva en misma línea
- **Problema:** Título y botón "Nueva..." en líneas separadas, desperdiciando espacio vertical.
- **Requerimiento:** En todas las tarjetas (`card-header-flex`): título a la izquierda, botón primaria a la derecha, **misma línea**.
- **Aplicar a:** Actas, Materias, Cursos, Docentes, Preceptores, Administradores, Suplencias, Horarios, Comunicados, Calendario, Tutores/Familias, Estudiantes, etc.

### 11.1 Actas — Error al crear + modal de error no cierra
- **Problema 1:** Sigue fallando al crear acta (error de validación/relación).
- **Problema 2:** Modal de error muestra "Error: Ocurrió un error. Inténtalo de nuevo." con botón "Cerrar" **que no funciona** (no cierra el modal).
- **Acción:** 
  - Revisar `guardarActa` / `handleCreate` en `actas.jsx`: validar `cObj`, `idTipoActa`, IDs requeridos antes de llamar API.
  - En `FormModal` / `FormActa`: el botón "Cerrar" del overlay de error debe llamar a `onClearError` y cerrar el portal.

### Formularios — Selector de archivo no debe mover otros campos
- **Problema:** Al cargar archivo, el selector de estudiante (u otro campo de arriba) baja de línea.
- **Ejemplo actual:**
  ```
  Estudiante (selector)    Archivo (cargar)
                           ↓ tras cargar
                           Archivo (cargar)
  Estudiante (selector)    Archivo (quitar)
  ```
- **Requerimiento:** El campo "Archivo" debe estar en su propia fila (`grid-column: 1 / -1`) o en columna fija; el selector de arriba **no debe bajar**. Usar `grid-template-areas` o `flex-wrap` controlado.

### 12.1 Tutores/Familias — Error "id_usuario existente" en usuario nuevo
- **Problema:** Al crear tutor nuevo, error dice "id_usuario existente" pero el usuario no existe.
- **Acción:** Revisar `createPadreTutor` payload: si `id_usuario_existente` se envía vacío/null, backend no debe validar duplicado. Verificar que `handleGuardar` y `handleAgregarRol` no envíen `id_usuario_existente` en creación nueva.

### 12.2 Un alumno ↔ Múltiples tutores
- **Requerimiento:** Confirmar que el modelo permite N:M (un alumno con varios tutores). `alumnos_ids` en tutor es array; backend debe permitir mismo `alumno_id` en varios tutores. No duplicar vínculos al re-guardar.

### 13.1 Asistencias — Selector estudiante/fecha se limpian mutuamente
- **Requerimiento:** En tab "Registro" (Preceptor/Admin): si se selecciona estudiante, limpiar fecha; si se selecciona fecha, limpiar estudiante. Mostrar solo uno a la vez.

### 13.x Selector de fecha — Predeterminado hoy + bloqueo fechas inválidas
- **Requerimiento:** 
  - Todos los `<input type="date">` deben tener `value` por defecto = hoy (`new Date().toISOString().split('T')[0]`).
  - Bloquear fechas inválidas (ej. 30 feb): usar `min`/`max` según contexto, o validar en `onChange` + `onBlur`.

### 13.2 Asistencias — Refresco
- **Estado:** Bien corregido.

### 14.1 Notificaciones Familia — Crear datos de prueba
- **Acción:** Documentar en este plan cómo crear notificaciones de prueba para verificar llegada a Familia/Tutores.
- **Ejemplo:** Endpoint/manual para generar notificación de tipo "asistencia", "calificación", "comunicado" vinculada a alumno X, y verificar que llega a tutor vinculado.

### 14.2 Relación Familia-Tutor ↔ Alumno
- **Pendiente:** Verificar fuente de verdad única.

### 15.1 Materias Adeudadas — Familia/Tutores no refleja cambio de alumno en intensificaciones/previas
- **Problema:** En panel Familia/Tutores, al cambiar alumno seleccionado, no se actualizan intensificaciones/previas.
- **Acción:** En `PanelFamilia` / `ActividadesView` (rol familia), suscribirse a `selectedChild` / `hijoSeleccionado` y recargar datos.

### 15.2 Materias Adeudadas — Historial de instancias no aprobadas
- **Requerimiento:** En Alumno → Materias Adeudadas, bajo "Aprobada" mostrar **todas las instancias previas** con sus notas:
  ```
  Prácticas del Lenguaje (1°1) — Aprobada
  ¡Aprobada! Fecha: 6/9/26. Nota: 7 (Julio 2026)
  ── Historial de instancias ──
  Intensificación - Diciembre 2025 - Desaprobada - Nota: 2
  Previa - Julio 2025 - Desaprobada - Nota: 3
  Intensificación - Marzo 2025 - Desaprobada - Nota: 1
  ```
- **Datos:** Usar `rendiciones` + `actividades` + `intensificaciones` ya cargadas en `PanelMateriasAdeudadasEstudiante`, agrupar por `materia_nombre` y mostrar todas con estado/nota/fecha.

---

## 4.3 Tareas transversales / UI General

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| UI-1 | ToggleSwitch accesible para todos los "Habilitado/Deshabilitado" | Alta |
| UI-2 | Variables CSS de tema (oscuro/claro) en todos los formularios | Alta |
| UI-3 | Headers compactos: título + botón acción en misma línea (`card-header-flex`) | Media |
| UI-4 | Grilla 2x2 con 3er botón centrado (`grid-column: 1 / -1`) | Alta |
| UI-5 | Eliminar botón "Eliminar" en Materias/Cursos (solo Deshabilitar) | Alta |
| UI-6 | Bloquear sábados/domingos en creaciones (excepto Calendario) | Media |
| UI-7 | Selector global consume contexto en todas las vistas | Alta |
| UI-8 | Tabla historial suplencias finalizadas (filtros docente/curso/materia) | Media |
| UI-9 | Botón Guardar Horarios a la derecha en header de vistas | Media |
| UI-10 | Selector fecha: default hoy + validación fechas inválidas | Media |

---

## 4.4 Pendientes de definición con usuario (reiterados + nuevos) — **RESPONDIDOS**

- [x] **¿Eliminar en Materias/Cursos es solo "Deshabilitar" o hay borrado real para super-admin?** → **Solo "Deshabilitar"**. No existe ni debe existir borrado real para ningún usuario ni super-admin. El botón "Eliminar" no debe aparecer en Materias/Cursos.
- [x] **¿Programación habilitación (6.2) requiere hora obligatoria u opcional?** → **Debe brindarse hora**. Si se brinda hora de habilitación, el usuario debe estar deshabilitado; si no, no dejar guardar. Si se brinda hora de deshabilitación, el usuario debe estar habilitado. **No obligar** a poner ambas: puede ponerse solo una de las dos o las dos.
- [x] **¿Materias compartidas entre cursos/orientaciones permitidas?** → **La materia solo depende del curso, no de la orientación**. La orientación depende del curso pero no tiene nada que ver con la materia. No filtrar por orientación.
- [x] **¿Asignación de cursos (9.2) solo Admin o también Jefe Preceptores?** → En Admin está bien hecho. El cambio a realizar es en **Jefe de Preceptores** (allí no aparece). Además, en ese mismo lugar (Jefe de Preceptores) estaría bueno que marque todos los cursos y sus respectivos preceptores, así si algún curso no tiene preceptor asignado se distingue fácil. **Este criterio agrégalo también a Admin**.
- [x] **¿Qué tablas entran en grilla 2x2 del punto 3?** → Las que tengan **4 botones de acción**. En las que tengan **3**, la grilla debe distribuirse con **2 botones arriba y 1 abajo** usando el mismo espacio del 2x2. En caso de **más de 4 botones**, buscar grilla conveniente para que queden ordenados sin superponerse, mostrando texto y/o logos correctamente.
- [x] **¿En 10.3 orientación se filtra o no?** → **Los filtros deben ser por curso y ahí mostrar las materias de ese curso**. La parte de orientación **no se debe tomar en cuenta** en estos casos.
- [x] **¿Notificaciones de prueba: quién las crea y cómo se disparan para testing?** → **La idea es que las crees vos, pero no simplemente las agregues**. Deben dispararse desde la acción real: ej. se le carga una nota → se dispara la notificación → testear si llega correctamente al tutor/familia.

---

## 4.5 Próximos pasos sugeridos (orden de ataque)

1. **UI-1 + UI-2 + UI-5**: ToggleSwitch, temas formularios, quitar Eliminar en Materias/Cursos (base visual).
2. **UI-4 + 3.2**: Grilla 2x2 centrada + caso 3 botones.
3. **1.4 + UI-7**: Selector global consume contexto (eliminar selectores duplicados).
4. **1.1**: Fix label duplicado en NumericInput/teléfono.
5. **5.2 + 10.2/10.3**: Filtrado materias por curso (sin orientación).
6. **6.1 + 6.3**: Docentes botones + ToggleSwitch Habilitado.
7. **7.2**: Tabla historial suplencias finalizadas.
8. **8.1**: Guardar Horarios a la derecha.
9. **11.1 + 12.1**: Fix crear actas + crear tutores.
10. **13.x + 14.x + 15.2**: Fechas default hoy + notificaciones prueba + historial materias adeudadas.
11. **UI-6 + UI-3 + UI-9**: Bloqueo fines de semana + headers compactos + Guardar Horarios derecha.
12. **9.2 + UI-8**: Asignación Cursos en Admin + historial suplencias.

---

## Registro de avance — Parte 4 (testing del usuario)

> Se agrega al final del documento. No se modifica ni se elimina nada de lo
> registrado anteriormente.

### R-01. URLs de archivos caían en 404 (todo el sistema)
- **Causa raíz:** `POST /api/upload/` devuelve la ruta ya con `MEDIA_URL`
  (`/media/carpeta/archivo.pdf`), pero el frontend concatenaba `API_BASE`
  (`http://localhost:8000/api`) sobre esa ruta. El resultado era
  `http://localhost:8000/api/media/...`, que no existe: por eso el error
  "Failed to load resource: 404 (Not Found)" al abrir o descargar archivos.
- **Cambio:** nuevo helper `frontend/src/utils/medios.js` → `buildMediaUrl(ruta)`
  (devuelve vacío si no hay ruta, respeta URLs absolutas y antepone el origen,
  nunca `/api`). Reemplazado en 12 archivos: actas (Preceptor y Docente),
  Familia/Actas, Libro de Temas, Planificaciones, Actividades, Comunicados y
  documentos de Docentes. Las 4 funciones duplicadas `getAbsoluteFileUrl` /
  `resolveUrl` ahora delegan en el helper.
- **Estado:** SOLUCIONADO. Verificación: abrir el archivo de un acta, de un
  libro de temas, de una planificación y descargar un comunicado; ninguno debe
  dar 404.

### R-02. "id_usuario existente" al crear un tutor o docente nuevo
- **Causa raíz:** en `PadreTutorSerializer.create` y `DocenteSerializer.create`
  había una rama `else` que, cuando `id_usuario_existente` era `None` (es decir,
  al crear una cuenta nueva), ejecutaba
  `filter(id_usuario_id=None)` → `id_usuario_id IS NULL`, una comprobación sin
  sentido que podía disparar "El usuario seleccionado ya tiene perfil de
  tutor/familia" aunque el usuario no existiera.
- **Cambio:** eliminada esa rama `else` en ambos serializers. El duplicado de
  `usuario_nombre` ya lo valida `_build_usuario_account`.
- **Estado:** SOLUCIONADO. Verificación: crear un tutor nuevo y un docente nuevo
  con un usuario que no existía; deben crearse sin error.

### R-03. Permisos de actas evaluados con todos los roles
- **Causa raíz:** `actas.jsx` decidía con `user.roles` (todos los roles), mientras
  el backend usa solo el rol activo (`roles_efectivos` / header `X-Rol-Activo`).
  Un usuario multirrol que operaba como preceptor quedaba con la creación de
  actas deshabilitada aunque el backend sí lo autorizaba.
- **Cambio:** `rolesEfectivos` en `actas.jsx` = rol activo si existe, si no todos
  los roles, replicando exactamente el criterio del backend.
- **Estado:** SOLUCIONADO. Verificación: entrar con un usuario que tenga
  preceptor + admin, operar como preceptor y crear un acta.

### R-04. Actas duplicadas por doble clic
- **Causa raíz:** `setGuardando(true)` solo llega al render en el ciclo
  siguiente, así que un doble clic rápido disparaba dos `guardarActa`.
- **Cambio:** candado `guardandoRef` en `actas.jsx` que corta el segundo intento
  en el mismo tick.
- **Estado:** SOLUCIONADO. Verificación: hacer doble clic en "Crear" y confirmar
  que se crea una sola acta.

### R-05. Modal de error sin estilos y campo "Archivo" que movía los selectores
- **Causa raíz:** al compactar el bloque CSS de `.standard-modal` se habían
  perdido las reglas `.form-error-overlay`, `.form-error-overlay-card` y
  `.form-error-overlay-text`. Sin `position: fixed` ni `z-index`, el overlay se
  renderizaba al final del flujo y el botón "Cerrar" quedaba fuera de alcance,
  por lo que parecía no funcionar.
- **Cambio:** clases restauradas y migradas a variables de tema
  (`--form-error-bg/-border/-text`); y en `FormActa` el campo "Archivo" pasó a su
  propia fila con `preceptor-form-group--full` (`grid-column: 1 / -1`) para que
  cargar o quitar un archivo no desplace los selectores de arriba.
- **Estado:** SOLUCIONADO. Verificación: provocar un error y cerrar el overlay con
  el botón y con Escape; cargar un archivo y comprobar que el selector de
  estudiante no baja.

### R-06. `fechaHoy()` devolvía el día siguiente
- **Causa raíz:** usaba `toISOString()` (UTC). En Argentina (UTC-3) a partir de
  las 21:00 devolvía el día siguiente, dejando formularios con la fecha de mañana.
- **Cambio:** nuevo `frontend/src/utils/fechas.js` con `hoy()` usando las partes
  locales, más `esFechaValida` (rechaza 30 feb), `sumarDias`, `limitesFecha` y
  `validarCambioFecha`. `preceptorUtils.fechaHoy` ahora delega en `hoy()`.
- **Estado:** SOLUCIONADO.

### R-07. Filtros de fecha y estudiante que se aplicaban a la vez (13.1)
- **Causa raíz:** en el tab "Registro" de Asistencias se podían elegir fecha y
  estudiante simultáneamente, y ambos se mandaban como filtro.
- **Cambio:** son excluyentes; elegir uno limpia el otro. El registro arranca en
  la fecha de hoy.
- **Decisión del usuario:** el predeterminado "hoy" se aplica solo a fechas de
  evento (Actas, Registro de Asistencias). Los filtros de rango (Historial
  "desde/hasta", Calendario, Suplencias inicio/fin) quedan sin predeterminado
  porque ponerles hoy los deja sin resultados.
- **Estado:** SOLUCIONADO.

### R-08. Guardar de Horarios alineado a la derecha (8.1 / UI-9)
- **Cambio:** `.form-actions--sticky` con `justify-content: flex-end` y mensaje
  alineado a la derecha; fondo por variable de tema para que respete el modo
  oscuro.
- **Estado:** SOLUCIONADO.

### R-09. Historial de suplencias finalizadas (7.2)
- **Cambio:** `suplencias.jsx` ahora separa la tabla de suplencias **activas**
  (derivada de `estado` y `fecha_fin`) de una segunda tabla de **historial de
  finalizadas**, con filtros por docente (titular o suplente), curso y materia, y
  sin acciones de borrado. Una sola petición: la fuente es `getSuplencias()` y
  ambas tablas se derivan de ella.
- **Estado:** SOLUCIONADO.

### R-10. Botón "Eliminar" sin uso en Materias y Cursos
- **Decisión del usuario:** no tocar los botones visibles del resto de vistas;
  solo eliminar el código muerto.
- **Cambio:** borradas las funciones `handleEliminar` de `materias.jsx` y
  `cursos.jsx`, que quedaron sin uso al quitar la acción del array. No queda
  borrado real en ninguna de las dos vistas.
- **Estado:** SOLUCIONADO.

### R-11. Formularios en blanco (regresión de UI-2)
- **Causa raíz:** al crear las variables `--form-*` les puse valores propios
  (`#ffffff` para el fondo y para los inputs) en vez de mapearlas a la paleta
  que el proyecto ya tenía. Como `.standard-modal-body` y `.standard-modal-footer`
  no tenían background (son transparentes y dejan ver el gradiente azul del
  modal), agregarles `background: var(--form-bg)` pinta todo el interior del
  modal de blanco. Además `--form-input-bg: #ffffff` se aplicó a los campos de
  fuera del modal, que antes heredaban `--table-row-bg`.
- **Cambio:** las variables ahora **mapean a los tokens existentes**
  (`--form-bg: var(--sidebar-hover)`, `--form-label: var(--text-light)`,
  `--form-input-bg: var(--table-row-bg)`, etc.), se restauró el fondo transparente
  de `.standard-modal-body`/`.standard-modal-footer`, y `.standard-modal-header`
  vuelve a `rgba(255,255,255,0.08)` + `#ffffff`. Verificado que cada variable
  resuelve exactamente al mismo color que usaba el archivo antes del cambio.
- **Nota:** los campos **dentro** del modal sí son blancos a propósito (existe una
  regla histórica `.standard-modal-body input { background: #ffffff }`).
- **Estado:** SOLUCIONADO.

### R-12. Fechas: no se podía escribir y no venían por defecto
- **Síntoma 1 — se borraba el día tipeado:** había puesto
  `validarCambioFecha(e.target.value).valor` dentro del `onChange` del
  `<input type="date">`. Ese input edita por segmentos (día → mes → año) y
  mientras se tipea emite valores parciales/incompletos; como es controlado, React
  reescribía el campo y el día se perdía al pasar al mes o al año.
- **Síntoma 2 — no mostraba la fecha de hoy:** `abrirNuevo()` hacía
  `setFormData({ ...formVacio })` (fecha `''`) en vez de usar el factory con la
  fecha de hoy. Además el `useState` inicial tampoco traía la fecha.
- **Cambio:**
  - El `onChange` de todas las fechas ahora copia el valor crudo; la
    normalización/validación pasó a `onBlur`.
  - `abrirNuevo` y el estado inicial usan el factory con `hoy()` (actas de
    Preceptor, actas de Docente, Adelantos de Horas).
  - Se eliminó el conflicto de 13.1 que vaciaba los filtros: elegir estudiante
    limpiaba la fecha y al revés, dejando los dos campos vacíos.
- **Estado:** SOLUCIONADO.

### R-13. Fecha de hoy con `toISOString()` en 5 lugares
- **Causa raíz:** los mismos `new Date().toISOString().slice(0, 10)` que.views R-06
  seguían en `asistencias.jsx` (2), `PanelInfo.jsx`, `PanelLibroTemas.jsx` y
  `AdelantosHoras.jsx`. Devuelven el día siguiente a partir de las 21:00 (UTC-3).
- **Cambio:** los 5 usan `hoy()` de `utils/fechas.js`. Ya no queda ninguna
  aparición de `toISOString().slice(0, 10)` en el frontend.
- **Estado:** SOLUCIONADO.

### R-14. UI-6: fines de semana
- **Cambio:** nuevos helpers `esFinDeSemana` y `proximaLaborable` en
  `utils/fechas.js`. Aplicados en actas de Preceptor, actas de Docente y
  Adelantos de Horas: si se elige sábado/domingo, al salir del campo la fecha se
  lleva al lunes siguiente y se muestra un aviso. La normalización va en
  `onBlur` por lo de R-12.
- **Bug encontrado al testear:** `new Date('2026-09-26')` se interpreta como
  **UTC**, y en Argentina (UTC-3) el sábado se reportaba como viernes. Se corrigió
  con un helper `aDateLocal()` que arma el `Date` con los números sueltos.
  Verificado: sábado → lunes, domingo → lunes, cruza mes y cruza año.
- **Excluido por decisión previa:** el Calendario Institucional no se toca
  (precarga la fecha del día que abriste) ni los filtros de rango de Historial.
- **Estado:** SOLUCIONADO.

### Pendiente de verificación en el navegador
- Comprobar que la creación de actas funcione de punta a punta con el rol activo
  correcto. Si el error continúa, hace falta el mensaje exacto de la respuesta.
- 14.1 (notificaciones de prueba), 15.1/15.2 (materias adeudadas), UI-3, UI-8
  y 9.2 siguen pendientes.

---

## R-15. Auditoría de los puntos 1-6 (el usuario reportó que casi todos estaban mal)

Revisión punto por punto con evidencia en el código, sin confiar en los estados
"HECHO" anteriores. Resultado: varios requisitos nunca se implementaron y al menos
uno quedó peor de lo que se había anotado.

### 5.2 Orientación de los cursos: se INFERÍA en vez de leerse (NO estaba hecho)
- **Causa raíz:** `utils/orientacion.js` derivaba la orientación del nombre del
  curso (`4°1` → "Sociales", `4°2`/`4°3` → "Gestión"). Eso es exactamente lo que el
  requisito prohíbe. El modelo ya tiene `Curso.orientacion` y `CursoSerializer`
  usa `fields = '__all__'`, así que el dato ya llegaba al front y se ignoraba.
- **Cambio:** `orientacionDeCurso` ahora lee `curso.orientacion` y no infiere nada.
  Se agregó `orientacionDeCursoPorNombre` para resolver el curso dentro de la
  lista que ya viene del backend. `cursoConOrientacion` acepta el objeto curso y,
  si se le pasa solo un nombre, devuelve el nombre sin orientación (no inventa).
- **Consumidores actualizados:** headers de Jefe de Preceptores y de Preceptores,
  `Shared/FiltrosAnioCurso`, `Administracion/docentes.jsx` (tabla de
  asignaciones) y el RITE (`Administracion/notas.jsx` → `utils/rite.js`, que ahora
  recibe `cursoOrientacion`).
- **Nuevo campo de solo lectura** `curso_orientacion` en `CursoMateriaSerializer`
  para que las tablas que solo reciben el vínculo curso-materia muestren la
  orientación real. No requiere migración ni cambio en la base de datos.
- **Sin orientación:** los badges muestran "—" en lugar de ocultarse.

### 10.2 Materias por curso al agregar rol de docente (agregado en 5.2/10.2)
- **Dos bugs, no uno:**
  1. El `useEffect` sobrescribía `materiasDisponibles` con la lista ya filtrada, así
     que al cambiar de curso el nuevo se quedaba sin materias.
  2. El filtro comparaba `m.id_curso` / `m.curso_id`, pero la lista viene de
     `getMaterias()` (materias de la escuela, **sin** `id_curso`). El filtro no
     trouvaba nunca nada y el desplegable decía "No hay materias para la
     orientación de este curso". La asignación curso-materia estaba rota.
- **Cambio:** la lista completa se conserva en `todasMaterias` y las opciones se
  derivan con `useMemo` de `cursoMateriasDisponibles` (que sí trae `id_curso`,
  `id_materia` y `materia_nombre`), deduplicadas por materia. El mensaje de
  vacío ya no menciona orientación.

### 6.1 / 3.3 Botones con texto largo dentro de la grilla 2x2
- **Causa raíz:** `.acciones-cell--grid2 > .btn` (especificidad 0,2,0) le ganaba a
  `.btn-accion-con-texto` (0,1,0) y le imponía `width: 40px; min-width: 0; padding: 0`.
  Los botones con texto ("Ver Actas", "Ver Cursos", "Descargar DDJJ") quedaban
  encajados en 40 px con el texto desbordando.
- **Cambio:** reglas de igual especificidad que restauran `width: 100%`,
  `min-height` y ajuste de línea para los botones con texto dentro de
  `grid1`/`grid2`/sub-grilla; el 3er botón (ancho completo) se ajusta a su
  contenido. `grid2` pasó a `minmax(0, 1fr)` para que el texto pueda envolver.

### 1.4 El selector global no lo consumían las vistas de Administración
- `selectedCursoId` solo se leía en `PanelProfesores` y `TopHeader`. Las vistas de
  Administración (`asistencias`, `notas`) manejaban su propio estado de curso y
  mostraban un `FiltrosAnioCurso` con Año lectivo / Año / División duplicando los
  del header.
- **Cambio:** `AdminDashboard` publica en el contexto global lo que se elige en el
  header. `asistencias` y `notas` leen `selectedCursoId` y ya no renderizan el
  filtro de curso. Se quitó el auto-seleccionar el primer curso para que el header
  y las vistas nunca se desincronicen. Se conserva el selector de Materia, que sí
  es propio de la vista.

### 1.5 Nomenclatura
- `Preceptores/SelectorModo.jsx` ofrecía "Modificar" y "Borrar". Ahora muestra
  "Editar" y "Eliminar" (los `id` internos no cambian para no romper el estado).

### Verificados como correctos (sin cambios)
- **1.1** No hay etiqueta duplicada: `NumericInput` pinta su propio `<label>` y
  ningún consumidor lo vuelve a declarar. `AdminPreceptores` tiene un solo label.
- **4.2** `refreshAdminCursos` ordena numéricamente (parsea el "°"), no por texto.
- **5.1** En materia inactiva solo queda "Habilitar", y `acciones-cell--grid1` lo
  centra.
- **No se filtra por orientación**, tal como se decidió en 4.4.

### Sigue pendiente
- 1.2 (refresco sin recarga) y 1.3 (errores por encima del modal) solo están
  anotados como correctos: no se revalidaron de forma independiente.
- 6.3: `Administracion/docentes.jsx` no muestra un `ToggleSwitch`; usa otro control
  para "Habilitado". Falta revisar la alineación contra la especificación.
- 2.x (suspensión) y 6.2 (programación) sin revalidar.
- Todo lo de esta auditoría necesita confirmación en navegador.

**Estado:** PARCIAL (código corregido y compilando, falta validar en navegador).

---

## PARTE 5 — Correcciones generales reportadas por el usuario

### 5.1 Notificaciones — Auto-selección de contexto al abrir
- Al hacer clic en "Ver" en una notificación, la vista destino debe auto-seleccionar toda la información que conlleva:
  - Ejemplo: cambio de horario de 2°1 → al ir al apartado, 2°1 debe aparecer seleccionado.
  - Si requiere materia también, que quede seleccionada.
- Ámbito: todas las notificaciones que navegan a vistas con selectores (horarios, actas, comunicados, etc.).
- Implementación: leer `navIntent` en el contexto y setear `selectedCursoId`, `selectedMateria`, `selectedCursoMateriaId` antes de renderizar la vista.

### 5.2 Campos teléfono — Solo números
- Todos los `<input>` de teléfono (ya usan `NumericInput` o `type="tel"`) deben permitir **solo dígitos**.
- Verificar que `NumericInput` filtre entrada no numérica y que no haya `type="text"` sueltos para teléfono.

### 5.3 Admin — Sección Tutores/Familias
- En el dashboard de Admin debe aparecer el apartado **Tutores/Familias**, idéntico al que tiene el usuario Preceptor.
- Incluir tabla con columnas: Tutor, Estudiantes asignados, Teléfono, Email, Acciones.
- **Estudiantes asignados** debe mostrar la lista de alumnos vinculados a ese tutor.

### 5.4 Admin — Materias / Asignación de materias
- Al agregar una materia a un curso, el selector de materias debe listar **todas las materias habilitadas** (no solo las del curso/orientación).
- Eliminar cualquier filtro restrictivo que impida elegir materias existentes.

### 5.5 Selectores duplicados — Consumir selector global
Las siguientes vistas **no deben renderizar sus propios selectores** de Año/Curso/División; deben leer `selectedCursoId` / `selectedMateria` / `selectedCursoMateriaId` del contexto:
- **Admin → Estudiantes**
- **Admin → Horarios** (selector de curso)
- **Admin → Adelanto de horas**: quitar el selector Curso/División (usar global) y **agregar filtro por Materia**.
- **Admin → Actas**: quitar selector local (ya consume global, pero el UI duplica).
- **Admin → Comunicados**: quitar selectores Año lectivo / Curso / División; usar global.
- **Preceptores → Actas / Estudiantes**: verificar que no dupliquen.

### 5.6 Selector global — Multiselección de cursos (Admin y Jefe Preceptores)
- El selector global en Admin y Jefe de Preceptores debe permitir **seleccionar varios cursos a la vez** mediante checkboxes.
- `selectedCursoId` pasa a ser `selectedCursoIds: string[]` (array).
- Vistas que consumen el selector deben manejar array (p. ej. tablas que filtran por `curso IN (...)`).

### 5.7 Admin — Comunicados — Botones Descargar / Borrar en misma línea
- En la tabla de comunicados, los botones **Descargar archivo** y **Borrar** deben quedar en la misma fila (no ocupar una línea extra).
- Usar la grilla de acciones 2×2 existente.

### 5.8 Admin → Docentes — Reorganización de 10 botones
Estado actual: 10 botones en la celda de acciones (Ver Actas, Ver Cursos, DDJJ×4, Editar, Habilitar/Deshabilitar, Programar, Eliminar).
Requerido:
1. **Agregar "Ver DDJJ"**: al hacer clic, despliega una tabla con toda la info de la DDJJ del docente (misma UX que Ver Actas / Ver Cursos).
2. **Agrupar los 4 botones de DDJJ** (Descargar, Verificar, Eliminar, Notificar) **dentro** de "Ver DDJJ" (no sueltos en la grilla principal).
3. **Fila principal (una sola línea)**: `Editar | Habilitar/Deshabilitar | Programar | Eliminar` — estos 4 juntos, en ese orden.
4. **Fila secundaria (expandible o fija debajo)**: `Ver Actas | Ver Cursos | Ver DDJJ` — tres botones de "ver" alineados.
- Resultado: grilla 2×2 canónica + fila de "ver" consistente, sin botones sueltos.

### 5.9 Programación de fechas — Lógica de validación cruzada
- Si el usuario **está habilitado**: permitir fecha de **habilitación posterior** a una fecha de deshabilitación ya existente (no bloquear por "fecha anterior").
- Si el usuario **está deshabilitado**: permitir fecha de **deshabilitación posterior** a una fecha de habilitación ya existente.
- En resumen: validar que la fecha nueva no sea **anterior a la fecha opuesta ya programada**, no a la fecha actual.

### 5.10 Toggle Switch — Confirmar presencia en todos los formularios
- El componente `FilaEstadoCuenta` + `ToggleSwitch` ya existe y se usa en Docentes.
- Verificar que **Preceptores, Administradores, Tutores/Familias** también lo usen (no queden checkboxes sueltos ni botones "Habilitar/Deshabilitar" en formularios de edición).

### 5.11 Suplencias Docentes — Solo 2 botones de acción
- En la tabla de suplencias (Admin y Preceptores), la celda de acciones debe mostrar **solo**: `Editar` y `Finalizar`.
- Quitar `Ver` y `Eliminar`.

### 5.12 Horarios — Botón Guardar visible en la barra superior
- En las vistas donde se editan horarios (Admin, Preceptores, Jefe), el botón **Guardar** debe aparecer en la **misma línea** que los botones "Horario semanal", "Educación física", "Ver horarios", alineado a la **derecha**, separado y visible sin scroll.

### 5.13 Jefe Preceptores → Administración de Preceptores
1. **Leyenda duplicada**: hay dos leyendas de botones; eliminar la que **no tiene colores** (la que solo texto).
2. **Agregar "Asignar cursos"**: idéntico al apartado que tiene Admin en este mismo módulo (pestaña/tab "Asignación de cursos").

### 5.14 Jefe Preceptores y Admin → Asignación de cursos de preceptores
- En la vista de asignación de cursos a preceptores, mostrar una **alerta/avisador** si hay **cursos sin preceptor asignado**.
- Ejemplo: banner `warning` arriba: "⚠️ Hay X curso(s) sin preceptor asignado".

### 5.15 Fechas — Default "hoy" consistente
- Todos los campos de fecha de **evento/creación** (actas, asistencias, adelantos, actas docente, calendario) deben traer **hoy por defecto** y permitir cambiarlo.
- Los campos de **filtro/rango** no traen default.
- Revisar cada formulario y unificar comportamiento.

### 5.16 Actas Estudiante — Error al crear + Botón cerrar no funciona
- Al intentar crear un acta de estudiante, salta error (revisar consola/red para mensaje exacto).
- El modal de error/confirmación tiene un botón **Cerrar** que no cierra el modal.
- Corregir ambos.

### 5.17 Tutores/Familias — Columna "Estudiantes asignados"
- En **todos los usuarios** que ven la tabla de Tutores/Familias, la columna **Estudiantes asignados** debe mostrar la lista de alumnos vinculados a ese tutor (no vacía ni guion).

### 5.18 Alumno y Familia — Asistencias no se reflejan
- En el portal de **Alumno** y en **Familia → Resumen**, las asistencias tomadas no se muestran correctamente.
- Verificar endpoint, serializador y renderizado de la tabla/gráfico de asistencias.

### 5.19 Alumno — Materias adeudadas (15.1) **PENDIENTE**
- Implementar la vista completa: listado de materias que el alumno debe, con estado (pendiente, cursando, aprobada), botón para ver detalle / generar acta de intensificación.

### 5.20 Familia — Materias adeudadas (15.2) **PENDIENTE**
- Misma funcionalidad que 15.1 pero en el portal de Familia, con vista de solo lectura y notificación a tutores.

---

**Prioridad sugerida de ataque:**
1. 5.1 (notificaciones - navega todo)
2. 5.5 (selectores duplicados - limpieza transversal)
3. 5.16 (actas estudiante - bloqueante)
4. 5.8 (docentes botones - UX crítica)
4. 5.10 (toggle switch - consistencia)
5. 5.3, 5.17 (tutores/familias - datos faltantes)
6. 5.18 (asistencias alumno/familia)
7. 5.6 (multiselección global - cambio de modelo)
8. 5.9, 5.15 (fechas - lógica)
9. 5.2, 5.4, 5.7, 5.11, 5.12, 5.13, 5.14 (ajustes puntuales)
10. 5.19, 5.20 (15.1 / 15.2 - nuevas features)

---

**Leyenda de estados:** PENDIENTE — EN CURSO — HECHO — PARCIAL — BLOQUEADO
