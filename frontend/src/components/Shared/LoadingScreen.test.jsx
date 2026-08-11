import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LoadingScreen from './LoadingScreen'

describe('LoadingScreen', () => {
  it('muestra el texto por defecto', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('Cargando')).toBeInTheDocument()
  })

  it('muestra un texto customizado', () => {
    render(<LoadingScreen text="Cargando horarios..." />)
    expect(screen.getByText('Cargando horarios...')).toBeInTheDocument()
  })

  it('anuncia el estado a lectores de pantalla', () => {
    render(<LoadingScreen />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('agrega la clase fixed cuando se indica', () => {
    const { container } = render(<LoadingScreen fixed />)
    expect(container.querySelector('.loading-screen')).toHaveClass('loading-screen--fixed')
  })

  it('agrega la clase dark cuando se indica', () => {
    const { container } = render(<LoadingScreen dark />)
    expect(container.querySelector('.loading-screen')).toHaveClass('loading-screen--dark')
  })

  it('incluye el logo con el alt por defecto', () => {
    render(<LoadingScreen />)
    expect(screen.getByAltText('Logo de la institución')).toBeInTheDocument()
  })
})
