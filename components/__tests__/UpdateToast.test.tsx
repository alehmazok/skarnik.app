import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { UpdateToast } from '../ServiceWorkerManager'

describe('UpdateToast', () => {
  it('offers the update and calls back on press', () => {
    const onUpdate = vi.fn()
    render(<UpdateToast onUpdate={onUpdate} />)
    expect(screen.getByText('Ёсць новая версія')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Абнавіць' }))
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})
