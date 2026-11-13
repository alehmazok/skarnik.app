import { browser, $, expect } from '@wdio/globals'
import { open, overflowingElements } from './helpers.js'

// «Афлайн доступ» (#24): download a dictionary on a real phone, read a word from it, delete it.
const belrus = () => $('[data-dict="belrus"]')
const belrusButton = text => belrus().$(`button=${text}`)

describe('Offline dictionaries', function () {
  // Runs right after a deploy, while the server builds the dictionaries (about a minute), then downloads 3.9 MB.
  this.timeout(360000)

  before(async () => {
    // BrowserStack's default script timeout is ~0 ms, too short for the IndexedDB read below.
    await browser.setTimeout({ script: 30000 })
    await open('/search')
  })

  it('opens «Афлайн доступ» with the three dictionaries', async () => {
    await $('button=Афлайн доступ').click()
    await expect(belrus()).toBeDisplayed()
    // Right after a deploy the server answers 503 while it builds the dictionaries; the panel retries.
    await belrusButton('Спампаваць для афлайн доступу').waitForEnabled({ timeout: 240000, interval: 2000 })
    expect(await overflowingElements()).toEqual([])
  })

  it('downloads the Belarusian–Russian dictionary', async () => {
    await belrusButton('Спампаваць для афлайн доступу').click()
    await browser.waitUntil(async () => (await belrus().getText()).includes('Спампавана'), {
      timeout: 180000,
      timeoutMsg: 'the dictionary did not finish downloading',
    })
    const stored = await browser.executeAsync(done => {
      const req = indexedDB.open('skarnik-offline')
      req.onsuccess = () => {
        const get = req.result.transaction('words').objectStore('words').get(['belrus', 27890])
        get.onsuccess = () => done(get.result ? get.result.text : null)
        get.onerror = () => done(null)
      }
      req.onerror = () => done(null)
    })
    expect(stored).toBe('добразычлівасць')
  })

  it('deletes the offline copy', async () => {
    await belrusButton('Выдаліць афлайн-копію').click()
    await belrusButton('Выдаліць афлайн-копію').click()
    await browser.waitUntil(async () => (await belrus().getText()).includes('Афлайн-копія слоўніка выдалена.'), {
      timeoutMsg: 'the offline copy was not deleted',
    })
  })
})
