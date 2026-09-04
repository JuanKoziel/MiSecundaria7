import { describe, expect, it } from 'vitest'
import { viewDesdeDestino, tieneVistaParaDestino } from './navDestinos'

describe('viewDesdeDestino', () => {
  it('mapea calificaciones a calificaciones para alumno', () => {
    expect(viewDesdeDestino('calificaciones', 'alumno')).toBe('calificaciones')
  })

  it('mapea boletin a calificaciones para alumno', () => {
    expect(viewDesdeDestino('boletin', 'alumno')).toBe('calificaciones')
  })

  it('mapea eventos a calendario para alumno, familia y docente', () => {
    expect(viewDesdeDestino('eventos', 'alumno')).toBe('calendario')
    expect(viewDesdeDestino('eventos', 'familia')).toBe('calendario')
    expect(viewDesdeDestino('eventos', 'docente')).toBe('calendario')
  })

  it('mapea asistencias a asistencias para alumno y familia', () => {
    expect(viewDesdeDestino('asistencias', 'alumno')).toBe('asistencias')
    expect(viewDesdeDestino('asistencias', 'familia')).toBe('asistencias')
  })

  it('mapea comunicados a comunicados para todos los roles', () => {
    expect(viewDesdeDestino('comunicados', 'alumno')).toBe('comunicados')
    expect(viewDesdeDestino('comunicados', 'familia')).toBe('comunicados')
    expect(viewDesdeDestino('comunicados', 'docente')).toBe('comunicados')
    expect(viewDesdeDestino('comunicados', 'preceptor')).toBe('comunicados')
    expect(viewDesdeDestino('comunicados', 'admin')).toBe('comunicados')
  })

  it('mapea adelantos a adelantos-horas para preceptor', () => {
    expect(viewDesdeDestino('adelantos', 'preceptor')).toBe('adelantos-horas')
  })

  it('normaliza jefe_preceptores a preceptor', () => {
    expect(viewDesdeDestino('adelantos', 'jefe_preceptores')).toBe('adelantos-horas')
  })

  it('normaliza director a admin', () => {
    expect(viewDesdeDestino('comunicados', 'director')).toBe('comunicados')
  })

  it('devuelve null para destinos sin vista valida en el rol', () => {
    // El docente no tiene vista de previas/recursadas propias
    expect(viewDesdeDestino('previas', 'docente')).toBeNull()
    // El alumno no tiene vista de ddjj
    expect(viewDesdeDestino('ddjj', 'alumno')).toBeNull()
    // Rol desconocido
    expect(viewDesdeDestino('calificaciones', 'otro_rol')).toBeNull()
    // Destino inexistente
    expect(viewDesdeDestino('inexistente', 'alumno')).toBeNull()
  })

  it('no navega si el destino o el rol estan vacios', () => {
    expect(viewDesdeDestino('', 'alumno')).toBeNull()
    expect(viewDesdeDestino(null, 'alumno')).toBeNull()
    expect(viewDesdeDestino('calificaciones', '')).toBeNull()
    expect(viewDesdeDestino('calificaciones', null)).toBeNull()
  })
})

describe('tieneVistaParaDestino', () => {
  it('devuelve true solo si existe vista para el rol', () => {
    expect(tieneVistaParaDestino('comunicados', 'alumno')).toBe(true)
    expect(tieneVistaParaDestino('ddjj', 'alumno')).toBe(false)
  })
})