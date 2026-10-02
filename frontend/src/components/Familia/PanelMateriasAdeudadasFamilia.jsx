import PanelMateriasAdeudadas from '../Shared/PanelMateriasAdeudadas';

/**
 * Punto 5.20 - portal de Familia, vista de solo lectura.
 *
 * Reutiliza el panel compartido. El texto está escrito en tercera persona porque
 * la familia está mirando a su hijo, no a sí misma.
 */
function PanelMateriasAdeudadasFamilia({ estudiante }) {
  return (
    <PanelMateriasAdeudadas
      alumno={estudiante}
      descripcion="Materias que el estudiante todavía debe: si tiene que intensificarla, si pasó a previa o si ya la aprobó (con fecha y nota). Esta vista es de solo lectura."
      textoSinDeudas="El estudiante no tiene materias adeudadas actualmente."
    />
  );
}

export default PanelMateriasAdeudadasFamilia;
