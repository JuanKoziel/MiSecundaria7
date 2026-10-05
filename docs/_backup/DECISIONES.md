# DECISIONES ARQUITECTÓNICAS — Mi Secundaria 7

> **Propósito:** Este documento explica POR QUÉ se tomaron las decisiones importantes del proyecto. No es un changelog (no registra qué cambió) ni documentación técnica (no explica cómo funciona el código). Es un registro de la justificación detrás de cada decisión arquitectónica, para que cualquier desarrollador o IA que trabaje en el proyecto pueda entender las razones y respetarlas.
>
> **Si no se entiende por qué algo se hizo de cierta manera, este documento debe ser la primera fuente de consulta.**

---

## Índice de decisiones

1. [Base de datos externa con `managed = False`](#1-base-de-datos-externa-con-managed--false)
2. [La base de datos real tiene prioridad sobre cualquier SQL de referencia](#2-la-base-de-datos-real-tiene-prioridad-sobre-cualquier-sql-de-referencia)
3. [Un único DataContext como fuente de verdad](#3-un-único-datacontext-como-fuente-de-verdad)
4. [Un único api.js para todas las llamadas HTTP](#4-un-único-apijs-para-todas-las-llamadas-http)
5. [Formularios desplegables en lugar de modales](#5-formularios-desplegables-en-lugar-de-modales)
6. [PDFs generados desde Django, no desde React](#6-pdfs-generados-desde-django-no-desde-react)
7. [Todo el proyecto utiliza español](#7-todo-el-proyecto-utiliza-español)
8. [Todos los módulos comparten el mismo diseño visual](#8-todos-los-módulos-comparten-el-mismo-diseño-visual)
9. [Reutilización de componentes antes de crear nuevos](#9-reutilización-de-componentes-antes-de-crear-nuevos)
10. [Mantener la arquitectura existente sin innovar](#10-mantener-la-arquitectura-existente-sin-innovar)
11. [Archivos monolíticos por capa (models.py, serializers.py, views.py)](#11-archivos-monolíticos-por-capa-modelspy-serializerspy-viewspy)
12. [Enrutamiento por estado en lugar de React Router](#12-enrutamiento-por-estado-en-lugar-de-react-router)
13. [Sin librerías externas de UI](#13-sin-librerías-externas-de-ui)
14. [Sin TypeScript](#14-sin-typescript)
15. [Sin tests automatizados](#15-sin-tests-automatizados)

---

## 1. Base de datos externa con `managed = False`

### Contexto

El sistema se construyó sobre una base de datos MySQL preexistente que ya contenía todas las tablas con su esquema definido. Esta base de datos fue creada y es mantenida por el equipo de administración de la escuela, independientemente del desarrollo del sistema web.

### Motivo

Django por defecto intenta gestionar el esquema de la base de datos mediante migraciones. Si se hubiera permitido que Django gestionara el esquema, habría entrado en conflicto con la base de datos existente: Django podría intentar crear tablas que ya existen, modificar columnas que tienen restricciones externas, o eliminar objetos que otros sistemas consumen.

### Beneficios

- El sistema Django puede trabajar sobre cualquier base de datos MySQL existente sin necesidad de modificarla.
- El equipo de base de datos puede seguir gestionando el esquema independientemente (agregar índices, modificar tipos de datos, optimizar consultas) sin coordinar con el desarrollo del sistema web.
- No hay riesgo de que Django borre o modifique datos accidentalmente a través de migraciones.
- La integración con sistemas legacy (posibles sistemas preexistentes en la escuela) es transparente.

### Qué problemas evita

- Conflictos de migraciones entre Django y la base de datos real.
- Pérdida accidental de datos por migraciones mal generadas.
- Dependencia del desarrollo web para hacer cambios en el esquema de la base de datos.
- Duplicación de la gestión del esquema (Django + DBA).

---

## 2. La base de datos real tiene prioridad sobre cualquier SQL de referencia

### Contexto

Durante el desarrollo inicial, se utilizó un archivo `sistema_escolar.sql` como referencia para conocer la estructura de la base de datos. Este archivo fue útil para entender las tablas y relaciones, pero con el tiempo se fue desactualizando: algunas columnas fueron agregadas directamente en MySQL, otras modificadas, y el archivo SQL no se mantuvo sincronizado.

### Motivo

Varios errores de desarrollo se originaron porque se confiaba en el SQL de referencia en lugar de verificar la base de datos real. Por ejemplo, se intentó acceder a columnas que ya no existían, o se asumió que ciertos campos tenían un tipo de datos que en realidad era diferente. La lección aprendida fue que el único referente confiable es la base de datos ejecutándose en MySQL.

### Beneficios

- Elimina la dependencia de un archivo que puede estar desactualizado.
- Reduce errores de desarrollo causados por asumir estructuras incorrectas.
- Fomenta la verificación directa contra la base de datos real, que es la práctica correcta en cualquier proyecto con base de datos externa.

### Qué problemas evita

- Errores 500 por acceder a columnas que no existen en la base de datos real.
- Inconsistencias entre el modelo Django y la estructura real de MySQL.
- Tiempo perdido debuggeando problemas que en realidad eran diferencias entre el SQL de referencia y la BD real.

---

## 3. Un único DataContext como fuente de verdad

### Contexto

En las primeras versiones del frontend, cada componente cargaba sus propios datos llamando a la API directamente. Esto provocaba que:
- Un mismo endpoint se llamara múltiples veces desde diferentes componentes en la misma pantalla.
- Los datos estuvieran desincronizados (un componente mostraba información desactualizada).
- La experiencia de usuario fuera lenta por la cantidad de llamadas redundantes.
- El código fuera difícil de mantener porque la lógica de carga de datos estaba dispersa.

### Motivo

Se necesitaba una fuente única de verdad centralizada que cargara todos los datos una sola vez y los pusiera a disposición de cualquier componente que los necesitara. DataContext resuelve este problema: se monta una vez cuando el usuario se autentica, carga ~26 endpoints en paralelo, procesa y normaliza los datos, y los expone a través del hook `useData()`.

### Beneficios

- Una sola llamada por endpoint en toda la sesión (las llamadas son paralelas, no secuenciales).
- Los datos están siempre sincronizados entre componentes (todos leen del mismo objeto `data`).
- Los componentes son más simples porque no manejan lógica de fetching (solo consumen datos).
- Si un endpoint falla, los demás continúan funcionando (cada llamada tiene `.catch(() => [])`).
- La carga inicial puede mostrar un spinner global mientras todo se prepara.

### Qué problemas evita

- Llamadas redundantes a la API desde múltiples componentes.
- Datos desincronizados entre componentes de la misma pantalla.
- Lógica de fetching dispersa en todo el códigobase.
- Dificultad para mantener y actualizar la forma en que se obtienen los datos.

---

## 4. Un único api.js para todas las llamadas HTTP

### Contexto

Inicialmente, cada componente importaba axios directamente y hacía sus propias llamadas. Esto llevó a:
- Configuración duplicada del interceptor de tokens JWT.
- URLs de endpoints escritas en múltiples lugares.
- Dificultad para cambiar la URL base o la configuración de axios.
- Inconsistencias en el manejo de errores y formatos de respuesta.

### Motivo

Centralizar todas las llamadas HTTP en un solo archivo (`api.js`) garantiza que:
- La configuración de axios (baseURL, headers, interceptores de JWT y refresh token) se define una sola vez.
- Todos los endpoints están listados en un solo lugar, facilitando su mantenimiento y descubrimiento.
- Cualquier cambio en la API (renombrar un endpoint, cambiar parámetros) se hace en un solo archivo.
- Los componentes nunca necesitan importar axios directamente.

### Beneficios

- Un solo lugar para mantener la configuración HTTP.
- Fácil descubrimiento de endpoints disponibles (abrir api.js y ver todas las funciones).
- Los componentes son más limpios porque solo importan funciones con nombre descriptivo.
- El interceptor de refresh token automático funciona globalmente.

### Qué problemas evita

- URLs de endpoints duplicadas y desincronizadas.
- Configuración de axios esparcida por todo el proyecto.
- Dificultad para migrar a una nueva URL base o agregar headers globales.
- Llamadas sin autenticación por olvidar el token JWT.

---

## 5. Formularios desplegables en lugar de modales

### Contexto

En muchas aplicaciones web, los formularios de creación/edición se implementan como modales (ventanas emergentes que se superponen al contenido). En este proyecto, se optó por un enfoque diferente: formularios desplegables inline que se muestran/ocultan dentro del mismo flujo de la página.

### Motivo

Los modales presentan varios problemas para este tipo de sistema escolar:
- En dispositivos móviles o pantallas pequeñas, los modales ocupan toda la pantalla y pierden el contexto.
- Los modales con múltiples campos y selectores son difíciles de manejar (scroll dentro del modal).
- Los modales dificultan la comparación visual con los datos existentes (el usuario no puede ver la tabla de datos mientras completa el formulario).
- Los formularios desplegables inline mantienen el contexto visual: el usuario ve la tabla y el formulario simultáneamente.

### Beneficios

- El usuario mantiene el contexto de los datos mientras completa el formulario.
- Mejor experiencia en dispositivos móviles (el formulario fluye naturalmente con el scroll de la página).
- No hay problemas de z-index, superposición o foco atrapado.
- El patrón es consistente en todo el sistema (todos los módulos lo usan igual).
- Es más accesible (no requiere manejo de foco especial como los modales).

### Qué problemas evita

- Modales que no funcionan bien en dispositivos móviles.
- Pérdida de contexto al editar datos (el usuario no ve la lista mientras completa el formulario).
- Complejidad adicional de manejar apertura/cierre de modales con estado.
- Problemas de accesibilidad con modales (foco, ARIA, teclado).

---

## 6. PDFs generados desde Django, no desde React

### Contexto

El sistema requiere generar documentos PDF: proyectos pedagógicos, boletines de calificaciones. La generación de PDFs desde el frontend (React) es posible usando librerías como jsPDF, html2pdf, o `window.print()`, pero presentan limitaciones significativas.

### Motivo

- **ReportLab** (la librería de PDF de Django) produce PDFs profesionales con tipografía, márgenes, encabezados, pies de página y formato consistente. Desde React, el resultado depende del navegador, la impresora configurada, y los estilos CSS.
- Los PDFs generados desde Django pueden almacenarse en el servidor y servir como respaldo oficial (auditoría). Los PDFs generados desde el frontend existen solo en el cliente y no quedan registrados.
- La generación desde Django permite reemplazar automáticamente versiones anteriores, mantener un histórico, y controlar el acceso (no cualquier usuario puede generar PDFs de cualquier proyecto).

### Beneficios

- PDFs consistentes independientemente del navegador o dispositivo del usuario.
- Los PDFs se almacenan en el servidor con ruta en la base de datos (auditoría, respaldo).
- Reemplazo automático de versiones anteriores (no se acumulan archivos obsoletos).
- Control de acceso (solo usuarios autorizados pueden generar/descargar).
- Nombres de archivo consistentes y sanitizados.

### Qué problemas evita

- PDFs que se ven diferentes en Chrome vs Firefox vs Safari.
- Dependencia de librerías JavaScript de terceros para generación de PDFs.
- Imposibilidad de auditar quién generó qué PDF y cuándo.
- Acumulación de archivos sin control de versiones.
- Riesgo de que el usuario modifique el PDF antes de guardarlo.

---

## 7. Todo el proyecto utiliza español

### Contexto

El sistema es utilizado por una escuela secundaria argentina. Todos los usuarios (administrativos, docentes, preceptores, alumnos, familias) hablan español. La base de datos preexistente ya tenía nombres de tablas y columnas en español.

### Motivo

Mezclar inglés y español en un proyecto crea confusión innecesaria. Si los nombres de las tablas están en español (`alumnos`, `materias`, `curso_materia`), los modelos Django deberían reflejar esos mismos nombres. Si los usuarios ven la interfaz en español, los componentes, variables y funciones deberían estar en el mismo idioma para mantener coherencia.

### Beneficios

- Coherencia total entre la base de datos (español), el backend (español), y el frontend (español).
- Los desarrolladores argentinos/latinoamericanos entienden el código sin traducción mental.
- Los nombres de las tablas coinciden con los nombres de los modelos y los endpoints de la API.
- No hay ambigüedad: `alumno` es el modelo, `alumnos` es la tabla y el endpoint.

### Qué problemas evita

- Confusión entre `Student` (modelo) y `alumnos` (tabla).
- Dificultad para mapear mentalmente entre la base de datos y el código cuando usan idiomas diferentes.
- Inconsistencias en la nomenclatura (mitad del código en inglés, mitad en español).
- Traducción forzada de términos que no tienen una equivalencia directa (ej: `curso` no es exactamente `course` en el contexto argentino).

---

## 8. Todos los módulos comparten el mismo diseño visual

### Contexto

El sistema tiene 5 roles (Admin, Preceptor, Docente, Alumno, Familia), cada uno con su propio dashboard y conjunto de vistas. Inicialmente, cada rol tenía ligeras variaciones de diseño que hacían que el sistema se sintiera como 5 aplicaciones diferentes en lugar de una sola.

### Motivo

La consistencia visual es fundamental para la experiencia de usuario en un sistema escolar donde:
- Un mismo usuario puede tener múltiples roles (ej: un docente que también es preceptor).
- Los usuarios cambian entre módulos constantemente.
- La falta de consistencia genera desconfianza: el usuario percibe el sistema como "desprolijo" o "incompleto".

### Beneficios

- El usuario percibe el sistema como una aplicación unificada, no como 5 paneles separados.
- Curva de aprendizaje reducida: si el usuario aprende a usar un módulo, sabe usar todos.
- El código es más mantenible porque los estilos y patrones se comparten.
- Los cambios de diseño se aplican globalmente (modificar una variable CSS afecta a todos los módulos).

### Qué problemas evita

- Módulos que parecen de aplicaciones diferentes.
- Usuarios confundidos por patrones de interacción inconsistentes.
- Duplicación de estilos CSS (cada módulo con sus propias reglas).
- Dificultad para hacer cambios globales de diseño.

---

## 9. Reutilización de componentes antes de crear nuevos

### Contexto

En las primeras etapas del proyecto, cada desarrollador creaba componentes desde cero para cada nueva funcionalidad, incluso cuando existían componentes similares en otros módulos. Esto resultó en múltiples implementaciones del mismo patrón (tablas de alumnos, tarjetas de perfil, formularios de búsqueda) con ligeras variaciones, lo que duplicaba el código y el esfuerzo de mantenimiento.

### Motivo

La reutilización es un principio fundamental de React. Cuando el mismo patrón aparece en múltiples módulos (ej: vista de comunicados en Admin, Docente, Alumno y Familia), debe existir un solo componente compartido en `Shared/` que todos los módulos importen. Esto reduce el código duplicado, centraliza las correcciones de bugs, y garantiza consistencia visual.

### Beneficios

- Menos código que mantener y testear.
- Las correcciones de bugs se aplican una sola vez y benefician a todos los módulos.
- Consistencia visual garantizada (todos los módulos usan el mismo componente).
- Los nuevos desarrolladores encuentran más rápido lo que necesitan (buscan en Shared/ primero).

### Qué problemas evita

- Múltiples implementaciones del mismo patrón con bugs diferentes.
- Correcciones de bugs que hay que aplicar en 4 lugares diferentes.
- Inconsistencias visuales entre módulos que deberían verse igual.
- Código inflado innecesariamente.

---

## 10. Mantener la arquitectura existente sin innovar

### Contexto

Cada vez que un nuevo desarrollador o IA trabaja en el proyecto, existe la tentación de introducir mejores prácticas modernas, nuevas librerías, o patrones diferentes a los existentes. Esto es contraproducente porque:
- Introduce deuda técnica por la mezcla de estilos.
- Rompe la consistencia del código.
- Dificulta el mantenimiento futuro (cada módulo usa un patrón diferente).

### Motivo

El proyecto tiene una arquitectura probada que funciona. Los patrones están establecidos y documentados. Cualquier nueva funcionalidad debe encajar en esta arquitectura, no crear una nueva. La innovación está permitida solo cuando está justificada por una necesidad real que la arquitectura actual no puede resolver.

### Beneficios

- El código mantiene un estilo uniforme y predecible.
- Cualquier desarrollador o IA puede entender cualquier parte del proyecto porque todos siguen los mismos patrones.
- Reducción de la deuda técnica (no se acumulan estilos divergentes).
- Mayor velocidad de desarrollo (no hay que decidir cómo hacer algo, solo seguir el patrón existente).

### Qué problemas evita

- Módulos escritos con estilos radicalmente diferentes.
- Dificultad para mantener el código cuando cada parte usa patrones distintos.
- Decisiones arbitrarias que después hay que revertir.
- "Arquitectura de catedral" donde cada capa se construyó con criterios diferentes.

---

## 11. Archivos monolíticos por capa (models.py, serializers.py, views.py)

### Contexto

En proyectos Django típicos, es común tener una estructura de archivos por modelo o por app: `models/alumno.py`, `views/docente.py`, etc. Este proyecto, en cambio, tiene un solo `models.py` con 21 modelos, un solo `serializers.py` con ~40 serializers, y un solo `views.py` con ~19 viewsets.

### Motivo

El proyecto tiene una sola app Django (`escuela`). La base de datos es externa, los modelos son solo mappings ORM con `managed=False`, y la lógica de negocio está en las vistas. Dividir en archivos separados no aportaría beneficios reales porque:
- Los modelos están fuertemente relacionados entre sí (CursoMateria conecta Curso, Materia y Docente).
- Separar en archivos dificultaría ver las relaciones entre modelos.
- Dado que no hay migraciones ni esquema gestionado por Django, la modularización no es necesaria.

### Beneficios

- Todas las relaciones entre modelos son visibles en un solo archivo.
- No hay que navegar entre 21 archivos diferentes para entender el esquema completo.
- El orden de definición de modelos es explícito (importante para claves foráneas).
- Menos archivos abiertos simultáneamente durante el desarrollo.

### Qué problemas evita

- Archivos de modelo individuales que necesitan importarse entre sí (referencias circulares).
- Dificultad para ver el panorama completo de la base de datos.
- Múltiples archivos con pocas líenas cada uno que añaden complejidad de navegación.

---

## 12. Enrutamiento por estado en lugar de React Router

### Contexto

La mayoría de las aplicaciones React modernas usan React Router para el enrutamiento. Este proyecto no lo usa. En su lugar, cada dashboard mantiene una variable de estado `view` que determina qué componente se renderiza, mediante un switch.

### Motivo

El sistema no es una aplicación con páginas independientes (cada una con su propia URL), sino un conjunto de dashboards donde el usuario navega entre vistas internas sin cambiar de página. Usar React Router habría añadido complejidad innecesaria:
- Habría que definir rutas para cada vista de cada rol.
- Cada cambio de vista implicaría un cambio de URL, lo que no tiene sentido para una SPA con dashboard.
- Los estados de la aplicación (curso seleccionado, materia activa, etc.) habría que persistirlos en la URL.

### Beneficios

- El cambio de vistas es instantáneo (no hay navegación real, solo cambio de estado).
- El estado de la aplicación (curso seleccionado, materia activa) se mantiene al cambiar de vista.
- No hay dependencia externa (React Router) por una funcionalidad que se resuelve con estado local.
- La estructura del código es más simple y directa.

### Qué problemas evita

- URLs que no representan páginas reales (no tiene sentido tener `/admin/alumnos` si todo es una SPA).
- Complejidad de sincronizar el estado de la aplicación con los parámetros de la URL.
- Dependencia de una librería de routing para una funcionalidad que no necesita rutas reales.
- Renderizados innecesarios al cambiar de ruta.

---

## 13. Sin librerías externas de UI

### Contexto

La mayoría de los proyectos web modernos utilizan librerías de UI como Material UI, Chakra UI, Bootstrap, o Ant Design para acelerar el desarrollo. Este proyecto no usa ninguna: todo el CSS es manual en `index.css`.

### Motivo

- Las librerías de UI imponen un estilo visual que no necesariamente se alinea con la identidad de la escuela.
- Agregan peso significativo al bundle (Material UI son ~100KB+).
- Personalizar una librería de UI para que se vea como un sistema escolar argentino requiere tanto o más trabajo que escribir el CSS manualmente.
- El CSS manual es más fácil de mantener a largo plazo (no hay dependencias de versiones de librerías).

### Beneficios

- Bundle más pequeño (no hay cientos de KB de componentes no utilizados).
- Control total sobre el diseño visual (cada píxel está en el código del proyecto).
- No hay dependencias de terceros que puedan romperse con actualizaciones.
- El diseño puede evolucionar sin estar limitado por la API de una librería.

### Qué problemas evita

- Dependencia de versiones de librerías de UI.
- Personalización forzada de componentes de terceros con `!important` en el CSS.
- Inconsistencias entre lo que la librería ofrece y lo que el proyecto necesita.
- Aumento innecesario del tamaño del bundle.

---

## 14. Sin TypeScript

### Contexto

El proyecto utiliza JavaScript puro con JSX, no TypeScript. Esto es una decisión deliberada, no una omisión.

### Motivo

- TypeScript agrega una capa de complejidad que no es necesaria para el tamaño y alcance del proyecto.
- El proyecto tiene menos de 30 componentes y ~20 modelos — los beneficios de TypeScript (tipado estático, detección temprana de errores) no justifican el costo de configuración y mantenimiento.
- El equipo que desarrolló el proyecto inicialmente tenía más experiencia en JavaScript que en TypeScript.
- Dado que la base de datos es externa y los modelos son mappings ORM, el tipado de los datos de la API sería difícil de mantener sincronizado con la BD real.

### Beneficios

- Desarrollo más rápido sin necesidad de definir tipos para cada respuesta de API.
- No hay configuración de TypeScript que mantener.
- Los archivos JSX son más cortos y legibles sin anotaciones de tipo.
- No hay fricción al cambiar la estructura de datos (no hay que actualizar interfaces).

### Qué problemas evita

- Mantenimiento de interfaces TypeScript que reflejen la estructura de la BD (que cambia externamente).
- Configuración de tsconfig, tipos de librerías, y resolución de módulos.
- Errores de compilación por tipos incorrectos en datos provenientes de la API.

---

## 15. Sin tests automatizados

### Contexto

El proyecto no tiene tests automatizados (ni unitarios, ni de integración, ni end-to-end). No hay archivos `test_*.py`, no hay Jest, no hay configuraciones de testing.

### Motivo

- El proyecto comenzó como un prototipo funcional para una escuela específica, no como un producto de software comercial.
- Los recursos de desarrollo eran limitados y se priorizó la funcionalidad sobre la cobertura de tests.
- La base de datos externa y el esquema cambiante hacen que los tests de integración sean difíciles de mantener (cada cambio en la BD puede romper tests).
- Los tests unitarios tendrían que mockear toda la capa de base de datos, lo que reduce su valor real.
- La validación se hace manualmente mediante el checklist post-modificación.

### Beneficios

- Desarrollo más rápido sin la sobrecarga de escribir y mantener tests.
- No hay falsos positivos ni falsos negativos por mocks desactualizados.
- El checklist post-modificación manual es más efectivo que tests automáticos que no cubren todos los escenarios.

### Qué problemas evita

- Tests que fallan porque la base de datos externa cambió.
- Mantenimiento constante de mocks y fixtures.
- Falsa sensación de seguridad por tests que no cubren los casos reales.
