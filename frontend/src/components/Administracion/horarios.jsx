import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { createHorario, updateHorario, deleteHorario } from '../../services/api';
import { MODULOS, DIAS_SEMANA, moduloPorNumero } from '../../utils/modulos';
import { cursoConOrientacion } from '../../utils/orientacion';
import FiltrosAnioCurso from './FiltrosAnioCurso';

const FORM_VACIO = {
  id: null,
  id_curso_materia: '',
  dia_semana: '',
  numero_modulo: '',
  aula: '',
};

function Horarios() {
  const { cursoMateria, horarios, cursosObj, refreshData } = useData();
  const [form, setForm] = useState(FORM_VACIO);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const horariosFiltrados = useMemo(() => {
    const lista = filtroCurso
      ? horarios.filter((h) => h.curso_nombre === filtroCurso)
      : horarios;
    return [...lista].sort((a, b) => {
      const dia = DIAS_SEMANA.indexOf(a.dia_semana) - DIAS_SEMANA.indexOf(b.dia_semana);
      if (dia !== 0) return dia;
      return (a.numero_modulo || 0) - (b.numero_modulo || 0);
    });
  }, [horarios, filtroCurso]);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const resetForm = () => {
    setForm(FORM_VACIO);
    setMensaje('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    if (!form.id_curso_materia || !form.dia_semana || !form.numero_modulo) {
      setMensaje('Completá curso/materia, día y módulo.');
      return;
    }
    const modulo = moduloPorNumero(form.numero_modulo);
    if (!modulo) {
      setMensaje('Módulo inválido.');
      return;
    }
    const payload = {
      id_curso_materia: Number(form.id_curso_materia),
      dia_semana: form.dia_semana,
      numero_modulo: Number(form.numero_modulo),
      hora_inicio: `${modulo.hora_inicio}:00`,
      hora_fin: `${modulo.hora_fin}:00`,
      aula: form.aula || null,
    };
    setGuardando(true);
    try {
      if (form.id) {
        await updateHorario(form.id, payload);
      } else {
        await createHorario(payload);
      }
      await refreshData();
      resetForm();
    } catch {
      setMensaje('Error al guardar el horario.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (h) => {
    setForm({
      id: h.id,
      id_curso_materia: String(h.id_curso_materia),
      dia_semana: h.dia_semana,
      numero_modulo: String(h.numero_modulo || ''),
      aula: h.aula || '',
    });
    setMensaje('');
  };

  const handleEliminar = async (h) => {
    if (!window.confirm('¿Eliminar este horario?')) return;
    try {
      await deleteHorario(h.id);
      await refreshData();
    } catch {
      setMensaje('Error al eliminar el horario.');
    }
  };

  const etiquetaCursoMateria = (cm) =>
    `${cursoConOrientacion(cm.curso_nombre)} · ${cm.materia_nombre || '—'}${
      cm.docente_nombre ? ` · ${cm.docente_nombre}` : ''
    }`;

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Horarios</h3>
      </div>

      <form onSubmit={handleSubmit} className="horario-form">
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="horario-cm">Curso / Materia / Docente</label>
            <select
              id="horario-cm"
              value={form.id_curso_materia}
              onChange={(e) => handleChange('id_curso_materia', e.target.value)}
            >
              <option value="">Seleccione...</option>
              {cursoMateria.map((cm) => (
                <option key={cm.id} value={cm.id}>
                  {etiquetaCursoMateria(cm)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="horario-dia">Día</label>
            <select
              id="horario-dia"
              value={form.dia_semana}
              onChange={(e) => handleChange('dia_semana', e.target.value)}
            >
              <option value="">Día...</option>
              {DIAS_SEMANA.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="horario-modulo">Módulo</label>
            <select
              id="horario-modulo"
              value={form.numero_modulo}
              onChange={(e) => handleChange('numero_modulo', e.target.value)}
            >
              <option value="">Módulo...</option>
              {MODULOS.map((m) => (
                <option key={m.numero} value={m.numero}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="horario-aula">Aula (opcional)</label>
            <input
              id="horario-aula"
              type="text"
              value={form.aula}
              onChange={(e) => handleChange('aula', e.target.value)}
              placeholder="Ej: Aula 5"
            />
          </div>
        </div>

        {mensaje && <p className="form-error-message">{mensaje}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {form.id ? 'Actualizar horario' : 'Agregar horario'}
          </button>
          {form.id && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <FiltrosAnioCurso
        cursosObj={cursosObj}
        defaultToFirst={false}
        onCursoChange={setFiltroCurso}
        className="filter-row"
      />

      {horariosFiltrados.length === 0 ? (
        <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
          No hay horarios cargados.
        </p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Materia</th>
                <th>Docente</th>
                <th>Día</th>
                <th>Módulo</th>
                <th>Horario</th>
                <th>Aula</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horariosFiltrados.map((h) => (
                <tr key={h.id}>
                  <td>{cursoConOrientacion(h.curso_nombre)}</td>
                  <td>{h.materia_nombre || '—'}</td>
                  <td>{h.docente_nombre || '—'}</td>
                  <td>{h.dia_semana || '—'}</td>
                  <td>{h.numero_modulo ? `Módulo ${h.numero_modulo}` : '—'}</td>
                  <td>
                    {h.hora_inicio
                      ? `${String(h.hora_inicio).slice(0, 5)} - ${String(h.hora_fin).slice(0, 5)}`
                      : '—'}
                  </td>
                  <td>{h.aula || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditar(h)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleEliminar(h)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Horarios;
