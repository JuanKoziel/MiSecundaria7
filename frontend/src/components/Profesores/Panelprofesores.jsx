import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import PanelAlumnos from './PanelAlumnos';
import PanelInfo from './PanelInfo';
import PanelPlanif from './PanelPlanif';
import PanelAsistencia from './PanelAsistencia';

function App() {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('1er Año B'); // Inicializado para pruebas
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('Matemática');
  const [seccionActiva, setSeccionActiva] = useState('alumnos'); // 'alumnos', 'info', 'planif', 'asistencia'

  const reiniciarPantalla = () => {
    setCursoSeleccionado('');
    setMateriaSeleccionada('');
    setSeccionActiva('');
  };

  return (
    // Se fuerza el block para saltar la validación JS de tu CSS original
    <div className="dashboard-layout" style={{ display: 'block' }}> 
      <Sidebar 
        seccionActiva={seccionActiva} 
        onCambiarSeccion={setSeccionActiva} 
        onReiniciar={reiniciarPantalla}
      />

      <main className="main-content">
        <TopHeader 
          cursoSeleccionado={cursoSeleccionado} 
          materiaSeleccionada={materiaSeleccionada} 
        />

        {/* Filtros de Selección Superior */}
        <div className="card">
          <div className="filter-row">
            <div className="form-group-filter">
              <label>Curso Activo</label>
              <select 
                value={cursoSeleccionado} 
                onChange={(e) => setCursoSeleccionado(e.target.value)}
              >
                <option value="">Seleccione un curso...</option>
                <option value="1°1">1°1</option>
                <option value="1°2">1°2</option>
                <option value="1°3">1°3</option>
                <option value="5to Año A">5to Año "A"</option>
                <option value="6to Año C">6to Año "C"</option>
              </select>
            </div>

            <div className="form-group-filter">
              <label>Materia</label>
              <select 
                value={materiaSeleccionada} 
                onChange={(e) => setMateriaSeleccionada(e.target.value)}
                disabled={!cursoSeleccionado}
              >
                <option value="">Seleccione una materia...</option>
                <option value="Matemática">Matemática</option>
                <option value="Lengua y Lit.">Lengua y Lit.</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenedor de Secciones dinámicas con tus clases de animación */}
        {materiaSeleccionada ? (
          <>
            <div className={`view-section ${seccionActiva === 'alumnos' ? 'active' : ''}`}>
              {seccionActiva === 'alumnos' && <PanelAlumnos />}
            </div>
            <div className={`view-section ${seccionActiva === 'info' ? 'active' : ''}`}>
              {seccionActiva === 'info' && <PanelInfo />}
            </div>
            <div className={`view-section ${seccionActiva === 'planif' ? 'active' : ''}`}>
              {seccionActiva === 'planif' && <PanelPlanif />}
            </div>
            <div className={`view-section ${seccionActiva === 'asistencia' ? 'active' : ''}`}>
              {seccionActiva === 'asistencia' && <PanelAsistencia />}
            </div>
          </>
        ) : (
          <div className="card text-center" style={{ padding: '60px' }}>
            <p style={{ color: '#666' }}>Por favor, seleccione un curso y una materia para desplegar las planillas de trabajo.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;