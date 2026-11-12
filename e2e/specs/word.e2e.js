import { browser, $, expect } from '@wdio/globals'
import { open, hasHorizontalScroll } from './helpers.js'

// The example shared link from the mobile app (see CLAUDE.md).
const WORD_PATH = '/r/belrus/27890'

describe('Shared word page', () => {
  before(async () => {
    await open(WORD_PATH)
  })

  it('renders the headword and its translation', async () => {
    const h1 = await $('h1')
    await expect(h1).toBeDisplayed()
    expect((await h1.getText()).trim().length).toBeGreaterThan(0)

    const translation = await $('.translation-html')
    await expect(translation).toBeDisplayed()
    expect((await translation.getText()).trim().length).toBeGreaterThan(0)

    await expect($('span=пераклад на рускую мову')).toExist()
  })

  it('has a canonical URL and word title', async () => {
    const canonical = await $('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toMatch(/\/r\/belrus\/27890$/)
    await expect(browser).toHaveTitle('пераклад на рускую мову', { containing: true })
  })

  it('does not scroll sideways', async () => {
    expect(await hasHorizontalScroll()).toBe(false)
  })

  it('redirects a zero-padded id to the canonical URL', async () => {
    await browser.url('/r/belrus/027890')
    await browser.waitUntil(async () => (await browser.getUrl()).endsWith(WORD_PATH), {
      timeoutMsg: 'did not redirect to the canonical word URL',
    })
  })

  it('shows 404 for an unknown dictionary', async () => {
    await browser.url('/r/nope/1')
    await expect($('h1')).toHaveText('404', { containing: true })
  })
})
