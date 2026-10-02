import EstudiantesPreceptor from '../Preceptores/estudiantes';

// 5.5 — Administración reutiliza la vista de Estudiantes del Preceptor, pero antes
// la renderizaba sin props: el componente caía en modo no controlado, con año y
// curso locales vacíos, así que `filtrosCompletos` nunca se cumplía y la tabla
// quedaba permanentemente en estado vacío. Reenviar las props del header hace
// que sea controlado por el selector global y consuma la misma selección que el
// resto de las vistas de Administración (sin selectores duplicados).
function Estudiantes(props) {
  return <EstudiantesPreceptor {...props} />;
}

export default Estudiantes;
