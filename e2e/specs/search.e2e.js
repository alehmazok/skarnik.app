import { browser, $, $$, expect } from '@wdio/globals'
import { open, overflowingElements } from './helpers.js'

describe('Search', () => {
  before(async () => {
    await open('/search')
  })

  it('finds a Belarusian word typed on a Russian keyboard', async () => {
    const input = await $('input[type="search"]')
    await input.setValue('прывитанне')
    const first = await $('ul a[href^="/r/"]')
    await first.waitForDisplayed({ timeout: 20000 })
    expect(await first.getText()).toContain('прывітанне')
  })

  it('keeps the query in the address and out of the index', async () => {
    await browser.waitUntil(async () => (await browser.getUrl()).includes('/search?q='), {
      timeoutMsg: 'query did not reach the address bar',
    })
    await open('/search?q=%D0%B4%D0%BE%D0%BC')
    await expect($('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect($('input[type="search"]')).toHaveValue('дом')
  })

  it('filters by dictionary', async () => {
    await $('button=Тлумачальны').click()
    await browser.waitUntil(
      async () => {
        const links = await $$('ul a[href^="/r/"]')
        if (links.length === 0) return false
        const hrefs = await Promise.all(links.map(l => l.getAttribute('href')))
        return hrefs.every(h => h.startsWith('/r/tsbm/'))
      },
      { timeout: 20000, timeoutMsg: 'results were not limited to Тлумачальны' },
    )
  })

  it('does not scroll sideways', async () => {
    expect(await overflowingElements()).toEqual([])
  })

  it('opens the word page on a phone', async () => {
    const first = await $('ul a[href^="/r/"]')
    const href = await first.getAttribute('href')
    await first.click()
    await browser.waitUntil(async () => (await browser.getUrl()).endsWith(href), {
      timeoutMsg: 'tapping a result did not open the word page',
    })
    await expect($('h1')).toBeDisplayed()
  })
})
