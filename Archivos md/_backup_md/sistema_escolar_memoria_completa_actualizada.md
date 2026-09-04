# Registro general de la base de datos — Sistema Escolar

Este archivo es la **referencia general y estructurada de la base de datos** del sistema escolar. No es un registro de la conversación. Su objetivo es servir como documento de contexto para futuras cargas SQL, modificaciones, consultas, validaciones y generación de datos.

## 1. Reglas generales

- La información de este documento debe considerarse la referencia disponible para trabajar con la base.
- No inventar registros, IDs, relaciones ni datos que no estén documentados.
- Mantener los IDs existentes cuando se realicen cargas o actualizaciones.
- Respetar las claves foráneas y las restricciones de integridad de la base.
- La información eliminada definitivamente no debe volver a cargarse.
- Los períodos académicos son **2 cuatrimestres**, no 3 trimestres.
- La tabla `horarios_especiales` es complementaria a la tabla de horarios normales y no debe mezclarse con ella.
- La mayoría de los registros de `horarios_especiales` corresponden a Educación Física, pero no debe asumirse esa materia para un registro sin verificar su `id_curso_materia`.

## 2. Roles de usuario

| ID | Rol |
|---:|---|
| 1 | admin |
| 2 | docente |
| 3 | preceptor |
| 4 | familia |
| 5 | alumno |
| 6 | director |
| 7 | jefe_preceptores |

Estos IDs son definitivos y deben respetarse.

## 3. Materias

La materia **`Historial Test 99` (ID 38)** fue eliminada definitivamente y **NO forma parte de la base actual**. No debe aparecer en futuras cargas SQL ni en listados de materias.


## Estructura y datos actualmente documentados

# Sistema Escolar — Memoria completa de estructura, contenido y reglas de carga

**Fecha de generación:** 2026-08-26  
**Ciclo de trabajo actual:** 2026  
**Base de datos:** `sistema_escolar`  
**Tecnologías conocidas del proyecto:** Django + Django REST Framework, React, MariaDB/MySQL, DBeaver.

> Este archivo reúne lo que quedó establecido en la conversación y en los archivos de proyecto disponibles. Cuando un dato exacto no quedó recuperable de los materiales consultados, se marca como pendiente en vez de inventarlo.

---

## 1. Reglas generales de conservación

1. La base de datos es preexistente y Django usa modelos con `managed = False`; Django no debe crear ni modificar las tablas.
2. El esquema real de MySQL/MariaDB es la referencia operativa. El archivo SQL de referencia/documentación no necesariamente coincide con todos los modelos Django.
3. No borrar contenido existente que no se haya indicado expresamente borrar.
4. Al cargar datos de prueba, conservar los IDs y relaciones existentes cuando ya están definidos.
5. No crear duplicados.
6. En `curso_materia` debe respetarse la restricción:
   - `UNIQUE (id_curso, id_materia)`
   - nombre de la restricción: `uk_curso_materia`
7. Si una relación curso-materia ya existe, se debe actualizar esa relación cuando corresponda (por ejemplo, para asignar docente) y NO crear otra fila.
8. Los horarios deben referenciar `curso_materia` mediante `id_curso_materia` y `modulos` mediante `id_modulo`.
9. Las horas y nombres de los módulos salen de `modulos`; `horarios` no almacena directamente nombre/hora del módulo.
10. La carga académica solicitada corresponde al ciclo lectivo 2026.
11. Los períodos de evaluación son DOS cuatrimestres, no tres trimestres:
    - `1er Cuatrimestre`, orden 1
    - `2do Cuatrimestre`, orden 2
12. No inventar horarios faltantes. Los horarios fueron enviados progresivamente y el último bloque completa los registros hasta el ID 486.

---

# 2. Estructura conceptual de la base

## Usuarios y roles

```text
usuarios
 └── usuario_roles ─── roles
       │
       ├── directivos
       ├── docentes
       ├── preceptores
       ├── alumnos
       └── padres_tutores
```

Roles definidos:

| ID | Rol |
|---:|---|
| 1 | admin / director |
| 2 | preceptor |
| 3 | docente |
| 4 | alumno |
| 5 | familia |

Personas vinculadas 1:1 a usuario:

- `directivos`: nombre, apellido, DNI, teléfono, cargo.
- `docentes`: nombre, apellido, DNI, correo, teléfono.
- `preceptores`: nombre, apellido, DNI, correo, teléfono.
- `alumnos`: nombre, apellido, DNI, fecha de nacimiento, dirección, teléfono, procedencia.
- `padres_tutores`: nombre, apellido, DNI, teléfono, dirección.

Regla importante:
- `correo` existe en docente y preceptor, no en alumno/padre/directivo.
- `fecha_nacimiento` existe en alumno.
- `direccion` existe en alumno y padre/tutor.

---

# 3. Estructura académica

```text
ciclos_lectivos
 └── cursos
      ├── preceptores
      └── curso_materia
           ├── materias
           └── docentes
```

Alumnos:

```text
alumnos
 └── cursos
 └── padres_tutores
```

Calificaciones:

```text
calificaciones
 ├── alumnos
 ├── curso_materia
 ├── docentes
 └── periodos_evaluacion
```

Asistencias:

```text
asistencias
 ├── alumnos
 ├── curso_materia
 ├── usuarios
 └── estados_asistencia
```

Horarios:

```text
horarios
 ├── curso_materia
 └── modulos
```

---

# 4. Tablas académicas reales confirmadas

## `ciclos_lectivos`

Campos:

```text
id_ciclo INT PK AUTO_INCREMENT
anio YEAR NOT NULL
fecha_inicio DATE NULL
fecha_fin DATE NULL
estado TINYINT(1) DEFAULT 1
fecha_eliminacion DATETIME NULL
```

En el esquema recuperado, el `AUTO_INCREMENT` estaba en 9.

## `cursos`

Campos:

```text
id_curso INT PK AUTO_INCREMENT
id_preceptor INT NULL FK -> preceptores.id_preceptor
id_ciclo INT NULL FK -> ciclos_lectivos.id_ciclo
nombre_curso VARCHAR(50) NOT NULL
activo TINYINT(1) DEFAULT 1
orientacion VARCHAR(50) NULL
estado TINYINT(1) DEFAULT 1
fecha_eliminacion DATETIME NULL
```

## `materias`

Catálogo utilizado para la carga:

| ID | Materia |
|---:|---|
| 1 | Prácticas del lenguaje |
| 2 | Matemática |
| 3 | Ciencias Naturales |
| 4 | Ciencias Sociales |
| 5 | Educación Física |
| 6 | Educación Artística |
| 7 | Construcción de Ciudadanía |
| 8 | Inglés |
| 9 | Biología |
| 10 | Físico Química |
| 11 | Historia |
| 12 | Geografía |
| 13 | Literatura |
| 14 | Salud y Adolescencia |
| 15 | Introducción a la Física |
| 16 | NTICx |
| 17 | Sistemas de Información Contable |
| 18 | Teoría de las Organizaciones |
| 19 | Política y Ciudadanía |
| 20 | Introducción a la Química |
| 21 | Elementos de Micro y Macroeconomía |
| 22 | Derecho |
| 23 | Gestión Organizacional |
| 24 | Trabajo y Ciudadanía |
| 25 | Arte |
| 26 | Filosofía |
| 27 | Economía Política |
| 28 | Proyectos Organizacionales |
| 29 | Comunicación, Cultura y Sociedad |
| 30 | Psicología |
| 31 | Sociología |
| 32 | Proyecto de Investigación en Ciencias Sociales |

## `curso_materia`

Campos confirmados:

```text
id_curso_materia INT PK AUTO_INCREMENT
id_curso INT NOT NULL FK -> cursos
id_materia INT NOT NULL FK -> materias
id_docente INT NULL FK -> docentes
activo TINYINT(1) DEFAULT 1
estado TINYINT(1) DEFAULT 1
fecha_eliminacion DATETIME NULL
```

Restricción crítica:

```text
UNIQUE KEY uk_curso_materia (id_curso, id_materia)
```

En el esquema consultado el `AUTO_INCREMENT` estaba en 230.

Regla de carga:

```text
SI existe (id_curso, id_materia):
    actualizar esa relación si hace falta
SI no existe:
    crearla
NUNCA duplicar
```

La relación ya contenía 182 asignaciones en el trabajo anterior y varias estaban inicialmente sin docente.

---

# 5. Cursos definidos para 2026

| ID | Curso | Orientación |
|---:|---|---|
| 1 | 1°1 | — |
| 2 | 1°2 | — |
| 3 | 1°3 | — |
| 4 | 2°1 | — |
| 5 | 2°2 | — |
| 6 | 2°3 | — |
| 7 | 3°1 | — |
| 8 | 3°2 | — |
| 9 | 3°3 | — |
| 10 | 4°1 | Sociales |
| 11 | 4°2 | Economia |
| 12 | 4°3 | Economia |
| 13 | 5°1 | Sociales |
| 14 | 5°2 | Economia |
| 15 | 5°3 | Economia |
| 16 | 6°1 | Sociales |
| 17 | 6°2 | Economia |
| 18 | 6°3 | Economia |

---

# 6. Períodos de evaluación 2026

Se reemplazó la idea inicial de tres trimestres.

NO usar:

```text
1er Trimestre
2do Trimestre
3er Trimestre
```

Usar:

```text
ID 1 — 1er Cuatrimestre — orden 1
ID 2 — 2do Cuatrimestre — orden 2
```

La tabla es:

```text
periodos_evaluacion
```

Las calificaciones apuntan a `id_periodo`.

Cada alumno debe tener dos períodos de evaluación.

---

# 7. Módulos horarios

Módulos utilizados:

| ID | Nombre | Inicio | Fin |
|---:|---|---|---|
| 1 | Módulo 1 | 07:30 | 08:30 |
| 2 | Módulo 2 | 08:30 | 09:30 |
| 3 | Módulo 3 | 09:55 | 10:55 |
| 4 | Módulo 4 | 10:55 | 11:55 |
| 5 | Módulo 5 | 12:00 | 13:00 |
| 6 | Módulo 6 | 13:05 | 14:05 |
| 7 | Módulo 7 | 14:05 | 15:05 |
| 8 | Módulo 8 | 15:30 | 16:30 |
| 9 | Módulo 9 | 16:30 | 17:30 |
| 10 | Módulo 10 | 17:30 | 18:30 |

Tabla real:

```text
modulos
```

Campos confirmados por el uso:

```text
id_modulo
nombre
hora_inicio
hora_fin
```

---

# 8. Horarios

Tabla:

```text
horarios
```

Campos confirmados:

```text
id_horario INT PK AUTO_INCREMENT
id_curso_materia INT NOT NULL FK -> curso_materia
dia_semana VARCHAR(20)
aula VARCHAR(50)
id_modulo INT FK -> modulos
```

El esquema recuperado tenía:

```text
AUTO_INCREMENT = 495
```

Los horarios entregados en la conversación llegan hasta:

```text
ID 486
```

No se debe interpretar el nombre del módulo ni las horas como columnas de `horarios`; salen de `modulos`.

La visualización/consulta correcta debe unir:

```text
horarios
 → curso_materia
 → cursos
 → materias
 → modulos
```

Días usados:

```text
Lunes
Martes
Miércoles
Jueves
Viernes
```

---

# 9. Horarios 2026 proporcionados

Se entregó progresivamente el horario completo de:

```text
1°1
1°2
1°3
2°1
2°2
2°3
3°1
3°2
3°3
4°1
4°2
4°3
5°1
5°2
5°3
6°1
6°2
6°3
```

El último bloque entregado fue:

```text
475  205  Miércoles  7
476  205  Miércoles  8
477  198  Miércoles 10
478  202  Jueves     6
479  202  Jueves     7
480  197  Jueves     8
481  197  Jueves     9
482  205  Viernes    6
483  205  Viernes    7
484  203  Viernes    8
485  203  Viernes    9
486  198  Miércoles  9
```

Estos registros completan el horario de 6°3.

---

# 10. Horarios entregados — regla de interpretación

Los datos que el usuario entregó originalmente tenían una forma enriquecida:

```text
id_horario
id_curso_materia
dia
numero_modulo
nombre_modulo
hora_inicio
hora_fin
id_curso
nombre_curso
id_materia
nombre_materia
```

Pero la tabla real `horarios` no guarda todos esos campos.

Por lo tanto, al generar SQL se debe traducir a:

```sql
INSERT INTO horarios
(id_horario, id_curso_materia, dia_semana, aula, id_modulo)
VALUES (...);
```

El curso y la materia se obtienen de `curso_materia`.

El nombre y horario del módulo se obtienen de `modulos`.

No duplicar información redundante en `horarios`.

---

# 11. Calificaciones

Tabla:

```text
calificaciones
```

Campos confirmados:

```text
id_calificacion
id_alumno
id_curso_materia
id_docente
id_periodo
pre_nota
nota_numerica
diagnostico
fecha_carga
intensificacion_1c
diciembre
febrero
calificacion_final
```

FK:

```text
id_alumno -> alumnos
id_curso_materia -> curso_materia
id_docente -> docentes
id_periodo -> periodos_evaluacion
```

Regla:

- Cada alumno trabaja con 2 períodos.
- La pre-nota es cualitativa.
- La nota numérica es decimal.
- No crear una calificación apuntando a un período inexistente.
- El docente debe corresponder a la asignación de `curso_materia`.

---

# 12. Asistencias

La tabla relaciona:

```text
alumnos
curso_materia
usuarios
estados_asistencia
```

Estados conceptuales documentados:

```text
Presente
Ausente
Tarde
```

No inventar columnas basándose únicamente en `models.py`, porque documentación y SQL tuvieron divergencias históricas.

---

# 13. Otras tablas académicas/conexiones confirmadas

## `inscripciones_materias`

```text
id_inscripcion
id_alumno
id_curso_materia
estado
fecha_inscripcion
```

FK a:

```text
alumnos
curso_materia
```

## `historial_cursos_alumno`

```text
id_historial_curso
id_alumno
id_curso
anio_lectivo
estado
fecha_ingreso
fecha_finalizacion
observaciones
```

Estados:

```text
CURSANDO
FINALIZADO
PROMOVIDO
REPITENTE
EGRESADO
```

Tiene:

```text
UNIQUE (id_alumno, anio_lectivo)
```

## `horarios_especiales`

```text
id_horario_especial
id_curso_materia
dia_semana
hora_inicio
hora_fin
aula
```

FK a `curso_materia`.

---

# 14. Actas

Tablas:

```text
tipos_acta
actas
acta_alumno
acta_curso
acta_docente
```

Relaciones:

```text
actas -> usuarios
actas -> tipos_acta

acta_alumno -> actas + alumnos
acta_curso -> actas + cursos
acta_docente -> actas + docentes
```

---

# 15. Comunicados

Tablas:

```text
comunicados
comunicado_alcance
comunicado_archivo
```

`comunicado_alcance` puede vincular:

```text
ciclo
curso
division
materia
```

`comunicado_archivo` vincula archivos al comunicado.

---

# 16. Contenido pedagógico

Tablas documentadas:

```text
planificaciones
diagnosticos_grupales
actividades_docentes
actividad_docente_archivos
ddjj_docente
libro_temas
```

El módulo "Proyectos" reemplazó al nombre anterior "Planificaciones" en frontend.

Proyecto pedagógico:

```text
contenido
objetivos
salidas
fundamentacion
```

y genera PDF automáticamente.

---

# 17. Auditoría y notificaciones

Tablas documentadas:

```text
notificaciones
historial_cambios
tipos_accion
```

`historial_cambios` guarda:

```text
id_usuario
id_tipo_accion
tabla_modificada
id_registro
valor_anterior
valor_nuevo
fecha
```

---

# 18. Sistema de previas/recursadas

Tablas/modelos relevantes:

```text
historial_academico
materias_adeudadas
recursadas_materias
bloqueos_materias_recursadas
bloqueos_horarios_alumno
intensificaciones_academicas
situaciones_materias_alumno
promociones_alumno
```

Estados de `SituacionMateriaAlumno` definidos:

```text
CURSANDO
APROBADA
INTENSIFICANDO
ADEUDADA
RECURSANDO
BLOQUEADA
```

En el código analizado se detectó que actualmente solo `BLOQUEADA` se escribe automáticamente.

No alterar estas reglas al preparar una carga de prueba salvo que se solicite expresamente.

---

# 19. Problemas/reglas detectados durante el proyecto

## `curso_materia`

La BD sí tiene:

```text
UNIQUE (id_curso, id_materia)
```

aunque el modelo Django no lo reflejaba originalmente.

Consecuencia:

```text
crear duplicado → IntegrityError de MySQL/MariaDB
```

Por eso la regla definitiva es:

```text
UPDATE si ya existe.
INSERT solamente si no existe.
```

## Esquema SQL vs models.py

El análisis del proyecto indicó que:

- 21 tablas estaban en models.py pero no en el SQL documental.
- Había campos divergentes entre SQL y modelos.
- El SQL de referencia es documentación, no el mecanismo real de creación de la BD.
- La base real existe y funciona.

Por eso, para cambios de datos, priorizar el esquema real recuperado de MySQL.

---

# 20. Reglas específicas para la carga 2026

### Ciclo

Usar:

```text
2026
```

### Cursos

Usar exactamente:

```text
1°1
1°2
1°3
2°1
2°2
2°3
3°1
3°2
3°3
4°1 Sociales
4°2 Economia
4°3 Economia
5°1 Sociales
5°2 Economia
5°3 Economia
6°1 Sociales
6°2 Economia
6°3 Economia
```

### Materias

Usar los IDs/nombres proporcionados, incluyendo:

```text
```

No tratar la materia de prueba como una materia curricular normal salvo que se solicite.

### Evaluación

Usar exclusivamente:

```text
1 — 1er Cuatrimestre
2 — 2do Cuatrimestre
```

### Horarios

Usar los horarios proporcionados por el usuario.

No inventar horarios.

No reemplazar los IDs de `curso_materia` que ya fueron proporcionados.

### Integridad

Siempre respetar:

```text
FK
PK
UNIQUE
```

Especialmente:

```text
curso_materia(id_curso, id_materia)
```

---

# 21. Datos que NO deben darse por inventados

Cuando no exista información explícita en la conversación/archivos:

- no inventar docentes;
- no inventar preceptores;
- no inventar alumnos;
- no inventar padres/tutores;
- no inventar DNI;
- no inventar aulas;
- no inventar relaciones;
- no inventar calificaciones;
- no inventar asistencias;
- no inventar IDs existentes.

Si se necesitan datos de prueba, deben identificarse claramente como datos nuevos de prueba y respetar las FK.

---

# 22. Consultas útiles

## Ver cursos 2026

```sql
SELECT *
FROM cursos
WHERE id_ciclo = (
    SELECT id_ciclo
    FROM ciclos_lectivos
    WHERE anio = 2026
);
```

## Ver materias por curso

```sql
SELECT
    c.nombre_curso,
    m.id_materia,
    m.nombre_materia,
    cm.id_curso_materia,
    cm.id_docente
FROM curso_materia cm
JOIN cursos c ON c.id_curso = cm.id_curso
JOIN materias m ON m.id_materia = cm.id_materia
WHERE c.id_ciclo = (
    SELECT id_ciclo
    FROM ciclos_lectivos
    WHERE anio = 2026
)
ORDER BY c.id_curso, m.id_materia;
```

## Ver horario completo

```sql
SELECT
    h.id_horario,
    c.nombre_curso,
    m.nombre_materia,
    h.dia_semana,
    mo.nombre,
    mo.hora_inicio,
    mo.hora_fin,
    h.aula
FROM horarios h
JOIN curso_materia cm
    ON cm.id_curso_materia = h.id_curso_materia
JOIN cursos c
    ON c.id_curso = cm.id_curso
JOIN materias m
    ON m.id_materia = cm.id_materia
JOIN modulos mo
    ON mo.id_modulo = h.id_modulo
WHERE c.id_ciclo = (
    SELECT id_ciclo
    FROM ciclos_lectivos
    WHERE anio = 2026
)
ORDER BY
    c.id_curso,
    FIELD(
        h.dia_semana,
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes'
    ),
    mo.id_modulo;
```

## Ver períodos

```sql
SELECT *
FROM periodos_evaluacion
ORDER BY orden;
```

## Detectar duplicados curso-materia

```sql
SELECT
    id_curso,
    id_materia,
    COUNT(*) AS cantidad
FROM curso_materia
GROUP BY id_curso, id_materia
HAVING COUNT(*) > 1;
```

Esta última consulta debería devolver **0 filas**.

---

# 23. Estado actual de la memoria

Lo último definido en la conversación fue:

- períodos ya cambiados a dos cuatrimestres;
- horarios de 1°1 a 6°3 proporcionados;
- último horario recibido: ID 486;
- se pidió conservar esta información para poder generar posteriormente la carga completa de datos 2026;
- se solicitó guardar esta memoria en un archivo para no tener que reconstruirla nuevamente.

---

# 24. Fuentes utilizadas

Esta memoria se construyó a partir de:

- conversación del proyecto;
- esquema SQL `sistema_escolar`;
- documentación `PROYECTO.md`;
- documentación `REGLAS_DESARROLLO.md`;
- datos de cursos, materias, períodos y horarios proporcionados directamente en la conversación;
- reglas y decisiones técnicas establecidas durante el desarrollo.

**Regla de oro:** ante una contradicción entre una suposición y el esquema real/una decisión explícita del proyecto, no inventar una solución. Revisar primero la estructura real y las decisiones registradas.


## Tabla `horarios_especiales`

Se incorpora esta tabla a la estructura y a las reglas de carga. Está vinculada a `curso_materia` mediante `id_curso_materia` con `ON DELETE CASCADE`.

```sql
CREATE TABLE `horarios_especiales` (
  `id_horario_especial` int NOT NULL AUTO_INCREMENT,
  `id_curso_materia` int NOT NULL,
  `dia_semana` varchar(20) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `aula` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_horario_especial`),
  KEY `idx_horario_especial_curso_materia` (`id_curso_materia`),
  CONSTRAINT `fk_horario_especial_curso_materia`
    FOREIGN KEY (`id_curso_materia`)
    REFERENCES `curso_materia` (`id_curso_materia`)
    ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37
  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### Datos existentes de `horarios_especiales`

| ID | Curso-materia | Día | Inicio | Fin |
|---:|---:|---|---|---|
| 1 | 28 | Martes | 13:00 | 14:00 |
| 2 | 28 | Viernes | 12:00 | 13:00 |
| 3 | 36 | Miércoles | 08:00 | 09:00 |
| 4 | 36 | Viernes | 08:00 | 09:00 |
| 5 | 44 | Lunes | 13:15 | 14:15 |
| 6 | 44 | Miércoles | 13:15 | 14:15 |
| 7 | 54 | Lunes | 15:15 | 16:15 |
| 8 | 54 | Miércoles | 15:15 | 16:15 |
| 9 | 64 | Miércoles | 08:00 | 09:00 |
| 10 | 64 | Viernes | 08:00 | 09:00 |
| 11 | 74 | Martes | 13:15 | 14:15 |
| 12 | 74 | Jueves | 13:15 | 14:15 |
| 13 | 84 | Martes | 13:15 | 14:15 |
| 14 | 84 | Jueves | 12:10 | 13:10 |
| 15 | 94 | Martes | 11:10 | 12:10 |
| 16 | 94 | Jueves | 11:10 | 12:10 |
| 17 | 104 | Martes | 13:15 | 14:15 |
| 18 | 104 | Jueves | 13:15 | 14:15 |
| 19 | 110 | Martes | 10:10 | 11:10 |
| 20 | 110 | Jueves | 10:10 | 11:10 |
| 21 | 121 | Lunes | 14:15 | 15:15 |
| 22 | 121 | Miércoles | 14:15 | 15:15 |
| 23 | 133 | Lunes | 18:40 | 19:40 |
| 24 | 133 | Miércoles | 17:40 | 18:40 |
| 25 | 145 | Martes | 08:00 | 09:00 |
| 26 | 145 | Jueves | 08:00 | 09:00 |
| 27 | 156 | Martes | 14:15 | 15:15 |
| 28 | 156 | Jueves | 14:15 | 15:15 |
| 29 | 168 | Lunes | 08:00 | 09:00 |
| 30 | 168 | Miércoles | 08:00 | 09:00 |
| 31 | 180 | Martes | 12:00 | 13:00 |
| 32 | 180 | Jueves | 12:00 | 13:00 |
| 33 | 190 | Martes | 12:00 | 13:00 |
| 34 | 190 | Jueves | 12:00 | 13:00 |
| 35 | 199 | Lunes | 17:40 | 18:40 |
| 36 | 199 | Miércoles | 18:40 | 19:40 |

> Nota: según lo indicado, la mayoría de estos horarios especiales corresponden a Educación Física. No se debe asumir que todos lo son sin verificar la relación `id_curso_materia`.

## 4. Horarios normales

La tabla de horarios normales contiene **410 registros efectivos y definitivos**.

### Rango y cantidad

- Primer ID considerado: **42**
- Último ID considerado: **486**
- Cantidad de registros efectivos: **410**
- Los IDs ausentes dentro del rango 42–486 **no deben crearse ni rellenarse automáticamente**.

### Estructura de cada registro

Los registros se expresan como:

`id_horario | id_curso_materia | dia_semana | id_modulo`

Los nombres y horarios de los módulos se obtienen de `modulos`; no se duplican dentro de `horarios`.

### Registros definitivos

| ID horario | Curso-materia | Día | Módulo |
|---:|---:|---|---:|
| 42 | 24 | Lunes | 1 |
| 43 | 24 | Lunes | 2 |
| 44 | 24 | Martes | 3 |
| 45 | 24 | Martes | 4 |
| 46 | 27 | Miércoles | 3 |
| 47 | 27 | Miércoles | 4 |
| 49 | 29 | Lunes | 3 |
| 50 | 29 | Lunes | 4 |
| 52 | 30 | Martes | 1 |
| 53 | 30 | Martes | 2 |
| 54 | 27 | Martes | 5 |
| 55 | 26 | Miércoles | 1 |
| 56 | 26 | Miércoles | 2 |
| 57 | 25 | Jueves | 1 |
| 58 | 25 | Jueves | 2 |
| 59 | 26 | Jueves | 3 |
| 60 | 26 | Jueves | 4 |
| 61 | 27 | Jueves | 5 |
| 62 | 25 | Viernes | 1 |
| 63 | 25 | Viernes | 2 |
| 64 | 31 | Viernes | 3 |
| 65 | 31 | Viernes | 4 |
| 67 | 34 | Lunes | 6 |
| 68 | 34 | Lunes | 7 |
| 69 | 32 | Lunes | 8 |
| 70 | 32 | Lunes | 9 |
| 71 | 37 | Lunes | 10 |
| 72 | 34 | Martes | 6 |
| 73 | 34 | Martes | 7 |
| 74 | 33 | Martes | 8 |
| 75 | 33 | Martes | 9 |
| 77 | 35 | Miércoles | 6 |
| 78 | 35 | Miércoles | 7 |
| 79 | 38 | Miércoles | 8 |
| 80 | 38 | Miércoles | 9 |
| 81 | 35 | Jueves | 6 |
| 82 | 35 | Jueves | 7 |
| 83 | 39 | Jueves | 8 |
| 84 | 39 | Jueves | 9 |
| 86 | 33 | Viernes | 6 |
| 87 | 33 | Viernes | 7 |
| 88 | 32 | Viernes | 8 |
| 89 | 32 | Viernes | 9 |
| 90 | 37 | Viernes | 10 |
| 91 | 42 | Lunes | 1 |
| 92 | 42 | Lunes | 2 |
| 93 | 47 | Lunes | 3 |
| 94 | 47 | Lunes | 4 |
| 96 | 43 | Martes | 1 |
| 97 | 43 | Martes | 2 |
| 98 | 41 | Martes | 3 |
| 99 | 41 | Martes | 4 |
| 100 | 43 | Miércoles | 1 |
| 101 | 43 | Miércoles | 2 |
| 102 | 45 | Miércoles | 3 |
| 103 | 45 | Miércoles | 4 |
| 104 | 46 | Miércoles | 5 |
| 106 | 42 | Jueves | 1 |
| 107 | 42 | Jueves | 2 |
| 108 | 40 | Jueves | 3 |
| 109 | 40 | Jueves | 4 |
| 110 | 40 | Viernes | 1 |
| 111 | 40 | Viernes | 2 |
| 112 | 41 | Viernes | 3 |
| 113 | 41 | Viernes | 4 |
| 114 | 46 | Viernes | 5 |
| 115 | 57 | Lunes | 1 |
| 116 | 57 | Lunes | 2 |
| 117 | 48 | Lunes | 3 |
| 118 | 48 | Lunes | 4 |
| 120 | 52 | Martes | 1 |
| 121 | 52 | Martes | 2 |
| 122 | 55 | Martes | 3 |
| 123 | 55 | Martes | 4 |
| 124 | 53 | Martes | 5 |
| 125 | 50 | Miércoles | 1 |
| 126 | 50 | Miércoles | 2 |
| 127 | 49 | Miércoles | 3 |
| 128 | 49 | Miércoles | 4 |
| 129 | 53 | Miércoles | 5 |
| 131 | 51 | Jueves | 1 |
| 132 | 51 | Jueves | 2 |
| 133 | 56 | Jueves | 3 |
| 134 | 56 | Jueves | 4 |
| 135 | 49 | Viernes | 1 |
| 136 | 49 | Viernes | 2 |
| 137 | 48 | Viernes | 3 |
| 138 | 48 | Viernes | 4 |
| 139 | 58 | Lunes | 6 |
| 140 | 58 | Lunes | 7 |
| 141 | 66 | Lunes | 8 |
| 142 | 66 | Lunes | 9 |
| 143 | 63 | Lunes | 10 |
| 144 | 60 | Martes | 6 |
| 145 | 60 | Martes | 7 |
| 146 | 62 | Martes | 8 |
| 147 | 62 | Martes | 9 |
| 149 | 61 | Miércoles | 6 |
| 150 | 61 | Miércoles | 7 |
| 151 | 58 | Miércoles | 8 |
| 152 | 58 | Miércoles | 9 |
| 153 | 59 | Jueves | 6 |
| 154 | 59 | Jueves | 7 |
| 155 | 65 | Jueves | 8 |
| 156 | 65 | Jueves | 9 |
| 157 | 65 | Jueves | 10 |
| 159 | 67 | Viernes | 6 |
| 160 | 67 | Viernes | 7 |
| 161 | 59 | Viernes | 8 |
| 162 | 59 | Viernes | 9 |
| 163 | 75 | Lunes | 1 |
| 164 | 75 | Lunes | 2 |
| 165 | 70 | Lunes | 3 |
| 166 | 70 | Lunes | 4 |
| 167 | 76 | Lunes | 5 |
| 168 | 68 | Martes | 1 |
| 169 | 68 | Martes | 2 |
| 170 | 69 | Martes | 3 |
| 171 | 69 | Martes | 4 |
| 173 | 73 | Miércoles | 1 |
| 174 | 73 | Miércoles | 2 |
| 175 | 68 | Miércoles | 3 |
| 176 | 68 | Miércoles | 4 |
| 177 | 72 | Jueves | 1 |
| 178 | 72 | Jueves | 2 |
| 179 | 77 | Jueves | 3 |
| 180 | 77 | Jueves | 4 |
| 182 | 69 | Viernes | 1 |
| 183 | 69 | Viernes | 2 |
| 184 | 71 | Viernes | 3 |
| 185 | 71 | Viernes | 4 |
| 186 | 76 | Viernes | 5 |
| 187 | 79 | Lunes | 1 |
| 188 | 79 | Lunes | 2 |
| 189 | 82 | Lunes | 3 |
| 190 | 82 | Lunes | 4 |
| 191 | 81 | Martes | 1 |
| 192 | 81 | Martes | 2 |
| 193 | 83 | Martes | 3 |
| 194 | 83 | Martes | 4 |
| 195 | 85 | Martes | 5 |
| 197 | 86 | Miércoles | 1 |
| 198 | 86 | Miércoles | 2 |
| 199 | 79 | Miércoles | 3 |
| 200 | 79 | Miércoles | 4 |
| 201 | 78 | Jueves | 1 |
| 202 | 78 | Jueves | 2 |
| 203 | 80 | Jueves | 3 |
| 204 | 80 | Jueves | 4 |
| 206 | 87 | Viernes | 1 |
| 207 | 87 | Viernes | 2 |
| 208 | 78 | Viernes | 3 |
| 209 | 78 | Viernes | 4 |
| 210 | 85 | Viernes | 5 |
| 211 | 93 | Lunes | 6 |
| 212 | 93 | Lunes | 7 |
| 213 | 88 | Lunes | 8 |
| 214 | 88 | Lunes | 9 |
| 216 | 90 | Martes | 6 |
| 217 | 90 | Martes | 7 |
| 218 | 92 | Martes | 8 |
| 219 | 92 | Martes | 9 |
| 220 | 89 | Martes | 10 |
| 221 | 88 | Miércoles | 6 |
| 222 | 88 | Miércoles | 7 |
| 223 | 96 | Miércoles | 8 |
| 224 | 96 | Miércoles | 9 |
| 225 | 89 | Miércoles | 10 |
| 227 | 97 | Jueves | 6 |
| 228 | 97 | Jueves | 7 |
| 229 | 95 | Jueves | 8 |
| 230 | 95 | Jueves | 9 |
| 231 | 89 | Viernes | 6 |
| 232 | 89 | Viernes | 7 |
| 233 | 91 | Viernes | 8 |
| 234 | 91 | Viernes | 9 |
| 235 | 98 | Lunes | 1 |
| 236 | 98 | Lunes | 2 |
| 237 | 107 | Lunes | 3 |
| 238 | 107 | Lunes | 4 |
| 239 | 103 | Martes | 1 |
| 240 | 103 | Martes | 2 |
| 241 | 101 | Martes | 3 |
| 242 | 101 | Martes | 4 |
| 243 | 105 | Martes | 5 |
| 245 | 98 | Miércoles | 1 |
| 246 | 98 | Miércoles | 2 |
| 247 | 99 | Miércoles | 3 |
| 248 | 99 | Miércoles | 4 |
| 249 | 106 | Jueves | 1 |
| 250 | 106 | Jueves | 2 |
| 251 | 102 | Jueves | 3 |
| 252 | 102 | Jueves | 4 |
| 254 | 100 | Viernes | 1 |
| 255 | 100 | Viernes | 2 |
| 256 | 99 | Viernes | 3 |
| 257 | 99 | Viernes | 4 |
| 258 | 105 | Viernes | 5 |
| 259 | 117 | Lunes | 6 |
| 260 | 117 | Lunes | 7 |
| 261 | 116 | Lunes | 8 |
| 262 | 116 | Lunes | 9 |
| 263 | 116 | Lunes | 10 |
| 265 | 118 | Martes | 6 |
| 266 | 118 | Martes | 7 |
| 267 | 114 | Martes | 8 |
| 268 | 114 | Martes | 9 |
| 269 | 115 | Martes | 10 |
| 270 | 113 | Miércoles | 6 |
| 271 | 113 | Miércoles | 7 |
| 272 | 108 | Miércoles | 8 |
| 273 | 111 | Miércoles | 9 |
| 274 | 111 | Miércoles | 10 |
| 276 | 115 | Jueves | 6 |
| 277 | 115 | Jueves | 7 |
| 278 | 108 | Jueves | 8 |
| 279 | 108 | Jueves | 9 |
| 280 | 109 | Jueves | 10 |
| 281 | 109 | Viernes | 6 |
| 282 | 109 | Viernes | 7 |
| 283 | 112 | Viernes | 8 |
| 284 | 112 | Viernes | 9 |
| 285 | 120 | Lunes | 1 |
| 286 | 120 | Lunes | 2 |
| 287 | 125 | Lunes | 3 |
| 288 | 125 | Lunes | 4 |
| 289 | 122 | Lunes | 5 |
| 291 | 127 | Martes | 1 |
| 292 | 127 | Martes | 2 |
| 293 | 120 | Martes | 3 |
| 294 | 119 | Martes | 4 |
| 295 | 130 | Martes | 5 |
| 296 | 129 | Miércoles | 1 |
| 297 | 129 | Miércoles | 2 |
| 298 | 122 | Miércoles | 3 |
| 299 | 124 | Miércoles | 4 |
| 300 | 124 | Miércoles | 5 |
| 302 | 126 | Jueves | 1 |
| 303 | 126 | Jueves | 2 |
| 304 | 128 | Jueves | 3 |
| 305 | 128 | Jueves | 4 |
| 306 | 130 | Jueves | 5 |
| 307 | 119 | Viernes | 1 |
| 308 | 119 | Viernes | 2 |
| 309 | 123 | Viernes | 3 |
| 310 | 123 | Viernes | 4 |
| 311 | 138 | Lunes | 6 |
| 312 | 138 | Lunes | 7 |
| 313 | 139 | Lunes | 8 |
| 314 | 139 | Lunes | 9 |
| 315 | 131 | Lunes | 10 |
| 316 | 132 | Martes | 6 |
| 317 | 132 | Martes | 7 |
| 318 | 132 | Martes | 8 |
| 319 | 132 | Martes | 9 |
| 320 | 134 | Martes | 10 |
| 321 | 136 | Miércoles | 6 |
| 322 | 136 | Miércoles | 7 |
| 323 | 142 | Miércoles | 8 |
| 324 | 142 | Miércoles | 9 |
| 326 | 131 | Jueves | 6 |
| 327 | 131 | Jueves | 7 |
| 328 | 137 | Jueves | 8 |
| 329 | 137 | Jueves | 9 |
| 330 | 141 | Jueves | 10 |
| 331 | 140 | Viernes | 6 |
| 332 | 140 | Viernes | 7 |
| 333 | 135 | Viernes | 8 |
| 334 | 135 | Viernes | 9 |
| 335 | 141 | Viernes | 10 |
| 336 | 144 | Lunes | 6 |
| 337 | 144 | Lunes | 7 |
| 338 | 148 | Lunes | 8 |
| 339 | 148 | Lunes | 9 |
| 340 | 150 | Lunes | 10 |
| 342 | 153 | Martes | 6 |
| 343 | 153 | Martes | 7 |
| 344 | 146 | Martes | 8 |
| 345 | 146 | Martes | 9 |
| 346 | 206 | Miércoles | 6 |
| 347 | 206 | Miércoles | 7 |
| 348 | 151 | Miércoles | 8 |
| 349 | 151 | Miércoles | 9 |
| 350 | 151 | Miércoles | 10 |
| 352 | 152 | Jueves | 6 |
| 353 | 152 | Jueves | 7 |
| 354 | 150 | Jueves | 8 |
| 355 | 150 | Jueves | 9 |
| 356 | 153 | Jueves | 10 |
| 357 | 147 | Viernes | 6 |
| 358 | 147 | Viernes | 7 |
| 359 | 143 | Viernes | 8 |
| 360 | 143 | Viernes | 9 |
| 361 | 143 | Viernes | 10 |
| 362 | 164 | Lunes | 1 |
| 363 | 164 | Lunes | 2 |
| 364 | 162 | Lunes | 3 |
| 365 | 162 | Lunes | 4 |
| 366 | 154 | Lunes | 5 |
| 367 | 155 | Martes | 1 |
| 368 | 155 | Martes | 2 |
| 369 | 163 | Martes | 3 |
| 370 | 163 | Martes | 4 |
| 371 | 160 | Martes | 5 |
| 373 | 161 | Miércoles | 1 |
| 374 | 161 | Miércoles | 2 |
| 375 | 165 | Miércoles | 3 |
| 376 | 165 | Miércoles | 4 |
| 377 | 160 | Miércoles | 5 |
| 378 | 157 | Jueves | 1 |
| 379 | 157 | Jueves | 2 |
| 380 | 159 | Jueves | 3 |
| 381 | 159 | Jueves | 4 |
| 382 | 158 | Jueves | 5 |
| 384 | 164 | Viernes | 1 |
| 385 | 164 | Viernes | 2 |
| 386 | 154 | Viernes | 3 |
| 387 | 154 | Viernes | 4 |
| 388 | 158 | Viernes | 5 |
| 390 | 170 | Lunes | 6 |
| 391 | 170 | Lunes | 7 |
| 392 | 177 | Lunes | 8 |
| 393 | 177 | Lunes | 9 |
| 394 | 167 | Lunes | 10 |
| 395 | 175 | Martes | 6 |
| 396 | 175 | Martes | 7 |
| 397 | 172 | Martes | 8 |
| 398 | 172 | Martes | 9 |
| 399 | 166 | Martes | 10 |
| 401 | 173 | Miércoles | 6 |
| 402 | 173 | Miércoles | 7 |
| 403 | 169 | Miércoles | 8 |
| 404 | 169 | Miércoles | 9 |
| 405 | 176 | Miércoles | 10 |
| 406 | 174 | Jueves | 6 |
| 407 | 174 | Jueves | 7 |
| 408 | 176 | Jueves | 8 |
| 409 | 176 | Jueves | 9 |
| 410 | 171 | Jueves | 10 |
| 411 | 166 | Viernes | 6 |
| 412 | 166 | Viernes | 7 |
| 413 | 176 | Viernes | 8 |
| 414 | 176 | Viernes | 9 |
| 415 | 184 | Lunes | 6 |
| 416 | 184 | Lunes | 7 |
| 417 | 183 | Lunes | 8 |
| 418 | 183 | Lunes | 9 |
| 419 | 181 | Lunes | 10 |
| 421 | 185 | Martes | 6 |
| 422 | 185 | Martes | 7 |
| 423 | 186 | Martes | 8 |
| 424 | 186 | Martes | 9 |
| 425 | 181 | Martes | 10 |
| 426 | 187 | Miércoles | 6 |
| 427 | 187 | Miércoles | 7 |
| 428 | 179 | Miércoles | 8 |
| 429 | 179 | Miércoles | 9 |
| 430 | 179 | Miércoles | 10 |
| 432 | 178 | Jueves | 6 |
| 433 | 178 | Jueves | 7 |
| 434 | 182 | Jueves | 8 |
| 435 | 182 | Jueves | 9 |
| 436 | 183 | Viernes | 6 |
| 437 | 183 | Viernes | 7 |
| 438 | 178 | Viernes | 8 |
| 439 | 178 | Viernes | 9 |
| 440 | 195 | Lunes | 1 |
| 441 | 195 | Lunes | 2 |
| 442 | 192 | Lunes | 3 |
| 443 | 192 | Lunes | 4 |
| 444 | 195 | Lunes | 5 |
| 445 | 196 | Martes | 1 |
| 446 | 196 | Martes | 2 |
| 447 | 193 | Martes | 3 |
| 448 | 193 | Martes | 4 |
| 450 | 188 | Miércoles | 1 |
| 451 | 188 | Miércoles | 2 |
| 452 | 191 | Miércoles | 3 |
| 453 | 191 | Miércoles | 4 |
| 454 | 189 | Miércoles | 5 |
| 455 | 189 | Jueves | 1 |
| 456 | 189 | Jueves | 2 |
| 457 | 188 | Jueves | 3 |
| 458 | 188 | Jueves | 4 |
| 460 | 196 | Viernes | 1 |
| 461 | 196 | Viernes | 2 |
| 462 | 194 | Viernes | 3 |
| 463 | 194 | Viernes | 4 |
| 464 | 197 | Lunes | 6 |
| 465 | 197 | Lunes | 7 |
| 466 | 200 | Lunes | 8 |
| 467 | 200 | Lunes | 9 |
| 469 | 204 | Martes | 6 |
| 470 | 204 | Martes | 7 |
| 471 | 201 | Martes | 8 |
| 472 | 201 | Martes | 9 |
| 473 | 198 | Martes | 10 |
| 474 | 204 | Miércoles | 6 |
| 475 | 205 | Miércoles | 7 |
| 476 | 205 | Miércoles | 8 |
| 477 | 198 | Miércoles | 10 |
| 478 | 202 | Jueves | 6 |
| 479 | 202 | Jueves | 7 |
| 480 | 197 | Jueves | 8 |
| 481 | 197 | Jueves | 9 |
| 482 | 205 | Viernes | 6 |
| 483 | 205 | Viernes | 7 |
| 484 | 203 | Viernes | 8 |
| 485 | 203 | Viernes | 9 |
| 486 | 198 | Miércoles | 9 |

Estos **410 registros son la fuente definitiva** para futuras cargas y validaciones de la tabla `horarios`.

Para SQL, deben traducirse a:

```sql
INSERT INTO horarios
(id_horario, id_curso_materia, dia_semana, aula, id_modulo)
VALUES (...);
```

El campo `aula` permanece vacío cuando no fue proporcionado. No deben inventarse aulas ni otros datos.

## 5. Horarios especiales

Tabla:

```sql
CREATE TABLE `horarios_especiales` (
  `id_horario_especial` int NOT NULL AUTO_INCREMENT,
  `id_curso_materia` int NOT NULL,
  `dia_semana` varchar(20) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `aula` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_horario_especial`),
  KEY `idx_horario_especial_curso_materia` (`id_curso_materia`),
  CONSTRAINT `fk_horario_especial_curso_materia`
    FOREIGN KEY (`id_curso_materia`)
    REFERENCES `curso_materia` (`id_curso_materia`)
    ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
```

Registros definitivos:

| ID | Curso-Materia | Día | Inicio | Fin | Aula |
|---:|---:|---|---|---|---|
| 1 | 28 | Martes | 13:00 | 14:00 | |
| 2 | 28 | Viernes | 12:00 | 13:00 | |
| 3 | 36 | Miércoles | 08:00 | 09:00 | |
| 4 | 36 | Viernes | 08:00 | 09:00 | |
| 5 | 44 | Lunes | 13:15 | 14:15 | |
| 6 | 44 | Miércoles | 13:15 | 14:15 | |
| 7 | 54 | Lunes | 15:15 | 16:15 | |
| 8 | 54 | Miércoles | 15:15 | 16:15 | |
| 9 | 64 | Miércoles | 08:00 | 09:00 | |
| 10 | 64 | Viernes | 08:00 | 09:00 | |
| 11 | 74 | Martes | 13:15 | 14:15 | |
| 12 | 74 | Jueves | 13:15 | 14:15 | |
| 13 | 84 | Martes | 13:15 | 14:15 | |
| 14 | 84 | Jueves | 12:10 | 13:10 | |
| 15 | 94 | Martes | 11:10 | 12:10 | |
| 16 | 94 | Jueves | 11:10 | 12:10 | |
| 17 | 104 | Martes | 13:15 | 14:15 | |
| 18 | 104 | Jueves | 13:15 | 14:15 | |
| 19 | 110 | Martes | 10:10 | 11:10 | |
| 20 | 110 | Jueves | 10:10 | 11:10 | |
| 21 | 121 | Lunes | 14:15 | 15:15 | |
| 22 | 121 | Miércoles | 14:15 | 15:15 | |
| 23 | 133 | Lunes | 18:40 | 19:40 | |
| 24 | 133 | Miércoles | 17:40 | 18:40 | |
| 25 | 145 | Martes | 08:00 | 09:00 | |
| 26 | 145 | Jueves | 08:00 | 09:00 | |
| 27 | 156 | Martes | 14:15 | 15:15 | |
| 28 | 156 | Jueves | 14:15 | 15:15 | |
| 29 | 168 | Lunes | 08:00 | 09:00 | |
| 30 | 168 | Miércoles | 08:00 | 09:00 | |
| 31 | 180 | Martes | 12:00 | 13:00 | |
| 32 | 180 | Jueves | 12:00 | 13:00 | |
| 33 | 190 | Martes | 12:00 | 13:00 | |
| 34 | 190 | Jueves | 12:00 | 13:00 | |
| 35 | 199 | Lunes | 17:40 | 18:40 | |
| 36 | 199 | Miércoles | 18:40 | 19:40 | |

## 6. Reglas para futuras cargas SQL

1. No volver a crear `Historial Test 99` / materia ID 38.
2. Usar exactamente los IDs de roles definidos en este documento.
3. Trabajar con **2 cuatrimestres**.
4. Para horarios normales, usar únicamente los **410 registros efectivos** suministrados; no completar los IDs ausentes entre 42 y 486.
5. Mantener `horarios_especiales` como registros independientes de los horarios normales.
6. Respetar `curso_materia` como referencia de los horarios.
7. Antes de insertar relaciones nuevas, verificar las restricciones `UNIQUE` existentes para evitar duplicados.
8. No reemplazar registros existentes con datos inventados para completar huecos.
9. Si un dato necesario no está documentado, solicitar únicamente ese dato faltante en lugar de reconstruirlo por suposición.

## 7. Estado de referencia

Este documento debe utilizarse como **contexto base de la BD** en futuras conversaciones del proyecto. Cuando se entregue junto con un pedido de SQL, primero se debe revisar este documento y utilizar sus IDs, relaciones, eliminaciones y reglas antes de solicitar información adicional.
