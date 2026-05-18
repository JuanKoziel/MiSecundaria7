import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import PanelProfesores from './components/profesores'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PanelProfesores/>
  </React.StrictMode>
)
