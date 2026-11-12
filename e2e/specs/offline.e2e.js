import { browser, $, expect } from '@wdio/globals'
import { open, overflowingElements } from './helpers.js'

// «Афлайн доступ» (#24): download a dictionary on a real phone, read a word from it, delete it.
describe('Offline dictionaries', () => {
  before(async () => {
    await open('/search')
  })

  it('opens «Афлайн доступ» with the three dictionaries', async () => {
    await $('button=Афлайн доступ').click()
    await expect($('[data-dict="belrus"]')).toBeDisplayed()
    await $('[data-dict="belrus"] button=Спампаваць для афлайн доступу').waitForEnabled({ timeout: 120000 })
    expect(await overflowingElements()).toEqual([])
  })

  it('downloads the Belarusian–Russian dictionary', async () => {
    await $('[data-dict="belrus"] button=Спампаваць для афлайн доступу').click()
    await browser.waitUntil(async () => (await $('[data-dict="belrus"]').getText()).includes('Спампавана'), {
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
    await $('[data-dict="belrus"] button=Выдаліць афлайн-копію').click()
    await $('[data-dict="belrus"] button=Выдаліць афлайн-копію').click()
    await expect($('[data-dict="belrus"]*=Афлайн-копія слоўніка выдалена.')).toBeDisplayed()
  })
})
