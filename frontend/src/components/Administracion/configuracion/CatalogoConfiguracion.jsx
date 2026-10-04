import { useEffect, useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import AccionesCelda from '../../Shared/AccionesCelda';
import confirmarEliminacion from '../../../utils/confirmarEliminacion';
import { mensajeErrorAmigable } from '../../../utils/errores';

/**
 * CatalogoConfiguracion — armazón común de los cinco catálogos de
 * Administración → Configuración.
 *
 * Replica el patrón ya establecido en `Administracion/materias.jsx`: tabla con
 * "Mostrar registros inactivos", modal de alta/edición con `FormModal`, celda
 * de acciones con `AccionesCelda` y confirmación con `confirmarEliminacion`.
 * Cada catálogo aporta su formulario, sus columnas y su forma de guardar.
 *
 * Dos modos de borrado, según lo que soporte cada entidad:
 *   - `desactivar`: la entidad tiene `estado`/`fecha_eliminacion` (ciclos
 *     lectivos y períodos de evaluación). DELETE = desactivar; reactivar es un
 *     PATCH con `{ estado: true }`.
 *   - `eliminar`: borrado físico (módulos horarios, estados de asistencia,
 *     tipos de acta), siempre que el backend confirme que no está en uso.
 *
 * Tras cada cambio llama a `refreshCatalogosMaestros()` para que los selects
 * del resto de la aplicación vean el cambio sin recargar la página ni volver
 * a iniciar sesión.
 */
export default function CatalogoConfiguracion({
  singular,
  botonNuevo,
  descripcion,
  columnas,
  itemKey,
  cargar,
  alGuardar,
  formVacio,
  Form,
  toPayload,
  toFormData,
  onGuardado,
  permiteInactivos = false,
  modo = 'eliminar',
  mensajeVacio,
  mensajeSinInactivos,
  mensajeDesactivar,
  noEditable = () => false,
  sinEliminar = () => null,
}) {
  const { refreshCatalogosMaestros } = useData();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const recargar = async (incluir = mostrarInactivos) => {
    setCargando(true);
    try {
      const raw = await cargar(incluir);
      setItems(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setItems([]);
      toast.error(mensajeErrorAmigable(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    recargar(mostrarInactivos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  // Refresco puntual de los catálogos del contexto global: sin esto, crear un
  // ciclo lectivo desde Configuración no alcanzaría al select del formulario
  // de cursos hasta recargar la página.
  const refrescarGlobal = async () => {
    if (typeof refreshCatalogosMaestros === 'function') {
      await refreshCatalogosMaestros();
    }
    if (typeof onGuardado === 'function') await onGuardado();
  };

  const limpiar = () => {
    setShowNewForm(false);
    setEditing(null);
    setFormData(formVacio);
    setError('');
  };

  const abrirNuevo = () => {
    limpiar();
    setFormData({ ...formVacio });
    setShowNewForm(true);
  };

  const abrirEditar = (item) => {
    limpiar();
    setEditing(item);
    setFormData(toFormData(item));
  };

  const handleSubmit = async (e, esEdicion) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await alGuardar(esEdicion ? editing : null, toPayload(formData, esEdicion));
      toast.success(
        esEdicion
          ? `${singular} actualizado correctamente.`
          : `${singular} creado correctamente.`,
      );
      limpiar();
      await recargar();
      await refrescarGlobal();
    } catch (err) {
      setError(mensajeErrorAmigable(err));
      toast.error(mensajeErrorAmigable(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (item) => {
    await confirmarEliminacion(mensajeDesactivar(item), {
      title: 'Confirmar desactivación',
      note: 'No se elimina ningún dato: el registro queda desactivado y se puede reactivar.',
      confirmText: 'Desactivar',
      loadingText: 'Desactivando...',
      onConfirm: async () => {
        try {
          await alGuardar(item, { __desactivar: true });
          toast.success(`${singular} desactivado correctamente.`);
          await recargar();
          await refrescarGlobal();
        } catch (err) {
          toast.error(mensajeErrorAmigable(err));
        }
      },
    });
  };

  const handleReactivar = async (item) => {
    try {
      await alGuardar(item, { __reactivar: true });
      toast.success(`${singular} reactivado correctamente.`);
      await recargar();
      await refrescarGlobal();
    } catch (err) {
      toast.error(mensajeErrorAmigable(err));
    }
  };

  const handleEliminar = async (item) => {
    await confirmarEliminacion(
      `${singular} "${columnas[0].valor(item)}" se eliminará definitivamente.\n\n` +
        'Esta acción no se puede deshacer.\n\n' +
        '¿Desea continuar?',
      {
        title: 'Confirmar eliminación',
        // El borrado es físico: la nota por defecto ("ocultará el registro")
        // sería falsa, así que se reemplaza por una que describe lo real.
        note: 'El registro se borrará de la base de datos y no podrá recuperarse.',
        confirmText: 'Eliminar',
        loadingText: 'Eliminando...',
        onConfirm: async () => {
          try {
            await alGuardar(item, { __eliminar: true });
            toast.success(`${singular} eliminado correctamente.`);
            await recargar();
            await refrescarGlobal();
          } catch (err) {
            toast.error(mensajeErrorAmigable(err));
          }
        },
      },
    );
  };

  const esActivo = (item) => (permiteInactivos ? item.estado !== false : true);

  const accionesDe = (item) => {
    const acciones = [];
    if (!noEditable(item)) {
      acciones.push({ accion: 'editar', onClick: () => abrirEditar(item) });
    }

    if (modo === 'desactivar') {
      // `AccionesCelda` es un componente compartido que rotula estas acciones
      // "Habilitar"/"Deshabilitar". Acá el borrado es lógico y reversible, así
      // que se rotula "Desactivar"/"Reactivar" (tooltip y `aria-label`) para no
      // sugerir una eliminación que no ocurre.
      if (esActivo(item)) {
        acciones.push({
          accion: 'deshabilitar',
          onClick: () => handleDesactivar(item),
          titulo: `Desactivar ${singular.toLowerCase()}`,
        });
      } else {
        acciones.push({
          accion: 'habilitar',
          onClick: () => handleReactivar(item),
          titulo: `Reactivar ${singular.toLowerCase()}`,
        });
      }
      return acciones;
    }

    // Borrado físico. Un registro protegido (por ejemplo, un estado base)
    // muestra el botón deshabilitado con el motivo como tooltip.
    const bloqueo = sinEliminar(item);
    acciones.push({
      accion: 'eliminar',
      onClick: () => handleEliminar(item),
      disabled: Boolean(bloqueo),
      titulo: bloqueo || `Eliminar ${singular.toLowerCase()}`,
    });
    return acciones;
  };

  const totalColumnas = columnas.length + 1;

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {descripcion && <div className="info-box">{descripcion}</div>}

      <div className="flex-row--between mb-16">
        {permiteInactivos ? (
          <label style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Mostrar registros inactivos
          </label>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          <i className="fas fa-plus" aria-hidden="true" /> {botonNuevo}
        </button>
      </div>

      {showNewForm && (
        <Form
          formData={formData}
          setFormData={setFormData}
          editing={null}
          guardando={guardando}
          onSubmit={(e) => handleSubmit(e, false)}
          onCancel={limpiar}
          error={error}
          onClearError={() => setError('')}
        />
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.clave}>{c.etiqueta}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!cargando && items.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} className="empty-state-message">
                  {mostrarInactivos && permiteInactivos && mensajeSinInactivos
                    ? mensajeSinInactivos
                    : mensajeVacio}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const activo = esActivo(item);
                return (
                  <tr key={itemKey(item)}>
                    {columnas.map((c) => (
                      <td key={c.clave} className={c.clase || ''}>
                        {c.render ? c.render(item, activo) : c.valor(item)}
                      </td>
                    ))}
                    <AccionesCelda
                      acciones={accionesDe(item)}
                      entidad={singular.toLowerCase()}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Form
          formData={formData}
          setFormData={setFormData}
          editing={editing}
          guardando={guardando}
          onSubmit={(e) => handleSubmit(e, true)}
          onCancel={limpiar}
          error={error}
          onClearError={() => setError('')}
        />
      )}
    </div>
  );
}