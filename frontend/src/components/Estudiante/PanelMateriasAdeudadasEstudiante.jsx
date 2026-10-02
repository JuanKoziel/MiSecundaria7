import PanelMateriasAdeudadas from '../Shared/PanelMateriasAdeudadas';

/**
 * Punto 5.19 - portal del Alumno.
 *
 * La implementación vive en `Shared/PanelMateriasAdeudadas` porque el portal de
 * Familia muestra lo mismo en solo lectura (punto 5.20). Este archivo queda como
 * la envoltura del portal del Alumno para no cambiar el punto de importación que
 * ya usa `EstudianteDashboard`.
 */
function PanelMateriasAdeudadasEstudiante({ miEstudiante }) {
  return <PanelMateriasAdeudadas alumno={miEstudiante} />;
}

export default PanelMateriasAdeudadasEstudiante;
