import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Headword from '../Headword'

const props = { lang: 'be', fontSize: '4rem' }

describe('Headword', () => {
  it('renders the plain word when there is no stress', () => {
    const { container } = render(<Headword text="мова" stress={null} {...props} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('мова')
    expect(container.querySelectorAll('[data-stress]')).toHaveLength(0)
  })

  it('wraps the stressed vowel with its acute and keeps the full text', () => {
    const { container } = render(
      <Headword text="добразычлівасць" stress="добразычлі́васць" {...props} />,
    )
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toBe('добразычлі́васць')
    const marks = container.querySelectorAll<HTMLElement>('[data-stress]')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('і́')
    expect(marks[0].style.getPropertyValue('--i')).toBe('0')
  })

  it('staggers several stressed variants in order', () => {
    const { container } = render(
      <Headword text="творог" stress="тво́рог | творо́г" {...props} />,
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('тво́рог | творо́г')
    const marks = [...container.querySelectorAll<HTMLElement>('[data-stress]')]
    expect(marks.map(m => m.style.getPropertyValue('--i'))).toEqual(['0', '1'])
  })

  it('passes lang and font size to the heading', () => {
    render(<Headword text="мова" stress={null} lang="ru" fontSize="3rem" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveAttribute('lang', 'ru')
    expect(h1.style.fontSize).toBe('3rem')
  })
})
