import { browser, $, expect } from '@wdio/globals'
import { open, hasHorizontalScroll, waitForLoad } from './helpers.js'

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
    expect(await hasHorizontalScroll()).toBe(false)
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
    const about = await $('button=Пра Скарнік')
    await about.scrollIntoView()
    await about.click()
    const dialog = await $('dialog')
    await expect(dialog).toBeDisplayed()
    await expect(dialog).toHaveText('skarnik.by', { containing: true })
    await $('button[aria-label="Закрыць"]').click()
    await expect(dialog).not.toBeDisplayed()
  })
})
