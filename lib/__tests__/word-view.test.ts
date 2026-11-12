import { describe, it, expect } from 'vitest'
import { toWordView } from '../word-view'

const base = { id: 1, external_id: 5, direction: 'belrus', text: 'дом', stress: 'до́м', letter: 'д', redirect_to: null }

describe('toWordView', () => {
  it('sanitizes the translation and keeps the stress', () => {
    const view = toWordView('belrus', 5, { ...base, translation: '<font color="831b03">дом</font><script>x()</script>' })
    expect(view).toEqual({ dict: 'belrus', id: 5, text: 'дом', stress: 'до́м', html: '<font color="831b03">дом</font>', redirectTo: null })
  })

  it('turns an alias into the target id', () => {
    expect(toWordView('rusbel', 5, { ...base, translation: '', redirect_to: '1234' }).redirectTo).toBe(1234)
  })
})
