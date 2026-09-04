import { describe, expect, it } from 'vitest'
import { detectarNuevas } from './DataContext'

function notif(id, extra = {}) {
  return {
    id_notificacion: id,
    titulo: `T${id}`,
    mensaje: `M${id}`,
    leida: false,
    ...extra,
  }
}

describe('detectarNuevas (sondeo de notificaciones nuevas - Parte 6/17)', () => {
  it('devuelve solo las desconocidas y actualiza el set de conocidas', () => {
    const conocidos = new Set([1, 2])
    const nuevas = detectarNuevas([notif(2), notif(3), notif(4)], conocidos)
    expect(nuevas.map((n) => n.id)).toEqual([3, 4])
    expect([...conocidos].sort()).toEqual([1, 2, 3, 4])
  })

  it('no duplica ids repetidos dentro del mismo lote', () => {
    const conocidos = new Set([1])
    const nuevas = detectarNuevas([notif(9), notif(9), notif(9)], conocidos)
    expect(nuevas.map((n) => n.id)).toEqual([9])
  })

  it('NO marca como nuevas las que ya existian en la carga inicial', () => {
    const conocidos = new Set([100])
    const nuevas = detectarNuevas([notif(100)], conocidos)
    expect(nuevas).toEqual([])
  })

  it('tolera entrada no-array', () => {
    expect(detectarNuevas(null, new Set())).toEqual([])
    expect(detectarNuevas(undefined, new Set())).toEqual([])
  })

  it('normaliza leida/nav_destino/nav_params para el toast', () => {
    const conocidos = new Set()
    const [n] = detectarNuevas(
      [
        notif(5, {
          leida: 0,
          nav_destino: 'calificaciones',
          nav_params: { alumnoId: 3 },
        }),
      ],
      conocidos,
    )
    expect(n.leida).toBe(false)
    expect(n.nav_destino).toBe('calificaciones')
    expect(n.nav_params.alumnoId).toBe(3)
  })
})