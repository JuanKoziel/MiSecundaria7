import { afterEach, describe, expect, it, vi } from 'vitest'
import confirmarEliminacion, { setConfirmHandler } from './confirmarEliminacion'

describe('confirmarEliminacion', () => {
  const originalWindowConfirm = window.confirm

  afterEach(() => {
    window.confirm = originalWindowConfirm
    setConfirmHandler(null)
  })

  it('usa window.confirm con el mensaje por defecto si no hay handler', async () => {
    const confirmSpy = vi.fn(() => true)
    window.confirm = confirmSpy

    const resultado = await confirmarEliminacion()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledWith('¿Está seguro de que desea eliminar este registro?')
    expect(resultado).toBe(true)
  })

  it('pasa el mensaje customizado a window.confirm', async () => {
    const confirmSpy = vi.fn(() => false)
    window.confirm = confirmSpy

    await confirmarEliminacion('¿Eliminar la materia?')

    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar la materia?')
  })

  it('usa el mensaje por defecto cuando se pasa una cadena vacía', async () => {
    const confirmSpy = vi.fn(() => true)
    window.confirm = confirmSpy

    await confirmarEliminacion('')

    expect(confirmSpy).toHaveBeenCalledWith('¿Está seguro de que desea eliminar este registro?')
  })

  it('usa el handler registrado en vez de window.confirm', async () => {
    const confirmSpy = vi.fn(() => true)
    window.confirm = confirmSpy
    const handler = vi.fn(() => Promise.resolve(true))
    setConfirmHandler(handler)

    const resultado = await confirmarEliminacion('¿Eliminar?', { nota: 'Se ocultará.' })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({
      message: '¿Eliminar?',
      nota: 'Se ocultará.',
    })
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(resultado).toBe(true)
  })

  it('el handler recibe el mensaje por defecto si no se pasa', async () => {
    const handler = vi.fn(() => false)
    setConfirmHandler(handler)

    await confirmarEliminacion()

    expect(handler).toHaveBeenCalledWith({
      message: '¿Está seguro de que desea eliminar este registro?',
    })
  })
})
