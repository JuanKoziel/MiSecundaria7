import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import App from './App'
import './index.css'

import { ErrorOverlayProvider } from './context/ErrorOverlayContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <ErrorOverlayProvider>
            <App />
          </ErrorOverlayProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
)
