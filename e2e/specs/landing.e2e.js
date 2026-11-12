import { browser, $, expect } from '@wdio/globals'
import { open, overflowingElements, waitForLoad } from './helpers.js'

describe('Landing page', () => {
  before(async () => {
    await open('/')
  })

  it('shows the sample headword and title', async () => {
    await expect(browser).toHaveTitle('Skarnik.app', { containing: true })
    const h1 = await $('h1')
    await expect(h1).toBeDisplayed()
    await expect(h1).toHaveText('добразычл', { containing: true })
  })

  it('links to the app stores', async () => {
    await expect($('a[href*="apps.apple.com"]')).toExist()
    await expect($('a[href*="play.google.com"]')).toExist()
    await expect($('a[href*="appgallery.huawei.com"]')).toExist()
  })

  it('does not scroll sideways', async () => {
    expect(await overflowingElements()).toEqual([])
  })

  it('cycles the theme: auto → light → dark → auto', async () => {
    const toggle = await $('button[title="Тэма"]')
    const theme = () => browser.execute(() => document.documentElement.getAttribute('data-theme'))
    // Start from auto whatever an earlier spec left in localStorage.
    await browser.execute(() => {
      localStorage.removeItem('skarnik-theme')
      document.documentElement.removeAttribute('data-theme')
    })
    await browser.refresh()
    await waitForLoad()

    await toggle.click()
    await browser.waitUntil(async () => (await theme()) === 'light', { timeoutMsg: 'theme did not become light' })
    await toggle.click()
    await browser.waitUntil(async () => (await theme()) === 'dark', { timeoutMsg: 'theme did not become dark' })
    await toggle.click()
    await browser.waitUntil(async () => (await theme()) === null, { timeoutMsg: 'theme did not return to auto' })
  })

  it('opens and closes the "Пра Скарнік" dialog', async () => {
    // Checks the dialog's `open` state: WebDriver's isDisplayed misreports
    // top-layer <dialog> elements in older iOS Safari.
    const isOpen = () => browser.execute(() => document.querySelector('dialog')?.open === true)
    const about = await $('button=Пра Скарнік')
    await about.scrollIntoView()
    await about.click()
    await browser.waitUntil(isOpen, { timeoutMsg: 'dialog did not open' })
    const text = await browser.execute(() => document.querySelector('dialog')?.textContent ?? '')
    expect(text).toContain('skarnik.by')
    await $('button[aria-label="Закрыць"]').click()
    await browser.waitUntil(async () => !(await isOpen()), { timeoutMsg: 'dialog did not close' })
  })
})
