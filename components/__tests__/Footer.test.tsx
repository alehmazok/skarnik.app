import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Footer from '../Footer'

beforeAll(() => {
  // jsdom does not implement <dialog> methods
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Footer', () => {
  it('renders About button', () => {
    render(<Footer />)
    expect(screen.getByRole('button', { name: 'About' })).toBeInTheDocument()
  })

  it('modal contains correct text', () => {
    render(<Footer />)
    expect(screen.getByText(/электронны руска-беларускі слоўнік/)).toBeInTheDocument()
    expect(screen.getByText(/Сайт skarnik.by пачаў працаваць/)).toBeInTheDocument()
  })

  it('clicking About calls showModal', () => {
    render(<Footer />)
    fireEvent.click(screen.getByRole('button', { name: 'About' }))
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1)
  })

  it('close button calls close', () => {
    render(<Footer />)
    fireEvent.click(screen.getByRole('button', { name: 'About' }))
    fireEvent.click(screen.getByRole('button', { name: 'Закрыць' }))
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1)
  })

  it('backdrop click calls close', () => {
    render(<Footer />)
    fireEvent.click(screen.getByRole('button', { name: 'About' }))
    const dialog = document.querySelector('dialog')!
    fireEvent.click(dialog, { target: dialog })
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1)
  })
})
