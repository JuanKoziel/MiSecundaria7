import React, { useState } from 'react';
import SidebarProfesores from './components/SidebarProfesores';
import HeaderProfesores from './components/HeaderProfesores';
import SelectorDepartamentos from './components/SelectorDepartamentos';
import MenuApartados from './components/MenuApartados';
import PanelStaffDocente from './components/PanelStaffDocente';
import PanelInfoGeneral from './components/PanelInfoGeneral';
import PanelDocumentacion from './components/PanelDocumentacion';
import PanelAsistenciaReunion from './components/PanelAsistenciaReunion';

export default function PanelProfesores() {
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState(null);

  const reiniciarPantalla = () => {
    setCursoSeleccionado(null);
    setMateriaSeleccionada(null);
    setSeccionActiva(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Barra lateral de navegación */}
      <SidebarProfesores 
        cursoSeleccionado={cursoSeleccionado} 
        onSelectCurso={setCursoSeleccionado} 
        onReiniciar={reiniciarPantalla}
      />

      {/* Contenedor de Contenido Principal */}
      <div className="main-content" style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* Encabezado Principal */}
        <HeaderProfesores 
          cursoSeleccionado={cursoSeleccionado} 
          materiaSeleccionada={materiaSeleccionada} 
        />

        {/* Grid de Departamentos (Solo si hay sede seleccionada) */}
        {cursoSeleccionado && (
          <SelectorDepartamentos 
            materiaSeleccionada={materiaSeleccionada} 
            onSelectMateria={setMateriaSeleccionada} 
            onResetSeccion={() => setSeccionActiva(null)}
          />
        )}

        {/* Espacio de trabajo dividido (Solo si hay un departamento seleccionado) */}
        {materiaSeleccionada && (
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '25px', alignItems: 'start', marginTop: '25px' }}>
            
            {/* Submenú de Apartados (Columna Izquierda) */}
            <MenuApartados 
              seccionActiva={seccionActiva} 
              onSelectSeccion={setSeccionActiva} 
            />

            {/* Contenedor Dinámico de Paneles (Columna Derecha) */}
            <div className="card" style={{ marginTop: 0, padding: '25px', minHeight: '350px' }}>
              {!seccionActiva && (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '60px 0', fontSize: '1.05rem' }}>
                  Seleccione un apartado de la lista izquierda para visualizar la información del personal.
                </div>
              )}
              {seccionActiva === 'alumnos' && <PanelStaffDocente />}
              {seccionActiva === 'info' && <PanelInfoGeneral />}
              {seccionActiva === 'planif' && <PanelDocumentacion />}
              {seccionActiva === 'asistencia' && <PanelAsistenciaReunion />}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
