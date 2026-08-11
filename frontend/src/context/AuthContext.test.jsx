import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { login as apiLogin, logout as apiLogout, getMe, seleccionarRol as apiSeleccionarRol } from '../services/api'

vi.mock('../services/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  seleccionarRol: vi.fn(),
}))

function Probe({ onReady }) {
  const auth = useAuth()
  useEffect(() => {
    onReady?.(auth)
  }, [auth, onReady])
  return (
    <div>
      <span data-testid="user">{JSON.stringify(auth.user)}</span>
      <span data-testid="rol">{auth.rolActivo ?? ''}</span>
      <span data-testid="loading">{String(auth.loading)}</span>
      <button onClick={() => auth.login('juan', 'pass')}>login</button>
      <button onClick={() => auth.seleccionarRol('docente')}>seleccionar</button>
      <button onClick={() => auth.cambiarRol()}>cambiar</button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  )
}

function renderConAuth(onReady) {
  render(
    <AuthProvider>
      <Probe onReady={onReady} />
    </AuthProvider>,
  )
}

function loguearConRoles(roles, usuario = 'juan', id = 7) {
  localStorage.setItem('access_token', 'token-de-prueba')
  getMe.mockResolvedValue({ id_usuario: id, usuario, roles })
}

const dataRoles = (roles, usuario = 'juan', id = 7) => ({ id_usuario: id, usuario, roles })

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('sin token, queda deslogueado y deja de cargar', async () => {
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('rol')).toHaveTextContent('')
    expect(getMe).not.toHaveBeenCalled()
  })

  it('con un único rol entra directo sin pasar por el selector', async () => {
    loguearConRoles(['preceptor'])
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('preceptor'))
  })

  it('conserva el rol guardado en sessionStorage si pertenece al usuario', async () => {
    sessionStorage.setItem('rol_activo_juan', 'docente')
    loguearConRoles(['preceptor', 'docente'])
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('docente'))
  })

  it('con varios roles y sin rol guardado, requiere elegir', async () => {
    loguearConRoles(['preceptor', 'docente'])
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('rol')).toHaveTextContent('')
    const usuario = JSON.parse(screen.getByTestId('user').textContent)
    expect(usuario.role).toBe('')
    expect(usuario.roles).toEqual(['preceptor', 'docente'])
  })

  it('ignora un rol guardado que ya no pertenece al usuario', async () => {
    sessionStorage.setItem('rol_activo_juan', 'admin')
    loguearConRoles(['preceptor', 'docente'])
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('rol')).toHaveTextContent('')
  })

  it('si getMe falla, hace logout y limpia el usuario', async () => {
    localStorage.setItem('access_token', 'token-invalido')
    getMe.mockRejectedValue(new Error('token inválido'))
    renderConAuth()
    await waitFor(() => expect(apiLogout).toHaveBeenCalled())
    expect(screen.getByTestId('rol')).toHaveTextContent('')
  })

  it('login con un único rol entra directo', async () => {
    apiLogin.mockResolvedValue(dataRoles(['docente'], 'maria', 3))
    let auth
    renderConAuth((a) => { auth = a })
    screen.getByRole('button', { name: 'login' }).click()
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('docente'))
    expect(auth.user.username).toBe('maria')
  })

  it('seleccionarRol llama al backend, actualiza el rol y lo guarda', async () => {
    loguearConRoles(['preceptor', 'docente'])
    apiSeleccionarRol.mockResolvedValue(dataRoles(['preceptor', 'docente']))
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    screen.getByRole('button', { name: 'seleccionar' }).click()
    await waitFor(() => expect(apiSeleccionarRol).toHaveBeenCalledWith('docente'))
    expect(sessionStorage.getItem('rol_activo_juan')).toBe('docente')
    expect(screen.getByTestId('rol')).toHaveTextContent('docente')
  })

  it('seleccionarRol rechaza un rol no asignado al usuario', async () => {
    loguearConRoles(['preceptor'])
    let auth
    renderConAuth((a) => { auth = a })
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await expect(auth.seleccionarRol('admin')).rejects.toThrow(
      'El rol seleccionado no está asignado a tu usuario.',
    )
    expect(apiSeleccionarRol).not.toHaveBeenCalled()
  })

  it('cambiarRol borra el rol guardado y vuelve al selector', async () => {
    sessionStorage.setItem('rol_activo_juan', 'preceptor')
    loguearConRoles(['preceptor', 'docente'])
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('preceptor'))
    screen.getByRole('button', { name: 'cambiar' }).click()
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent(''))
    expect(sessionStorage.getItem('rol_activo_juan')).toBeNull()
  })

  it('logout llama a la api y limpia el estado y el rol guardado', async () => {
    sessionStorage.setItem('rol_activo_juan', 'preceptor')
    loguearConRoles(['preceptor'])
    renderConAuth()
    await waitFor(() => expect(screen.getByTestId('rol')).toHaveTextContent('preceptor'))
    screen.getByRole('button', { name: 'logout' }).click()
    await waitFor(() => expect(apiLogout).toHaveBeenCalled())
    expect(screen.getByTestId('rol')).toHaveTextContent('')
    expect(sessionStorage.getItem('rol_activo_juan')).toBeNull()
  })
})
