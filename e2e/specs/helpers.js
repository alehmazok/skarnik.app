import { browser, $ } from '@wdio/globals'

/** Waits until the page has loaded, so React has hydrated and buttons respond. */
export async function waitForLoad() {
  await browser.waitUntil(
    async () => (await browser.execute(() => document.readyState)) === 'complete',
    { timeoutMsg: 'page did not finish loading' },
  )
}

/**
 * Opens a path and dismisses the PostHog cookie banner by rejecting it, so
 * test sessions are never counted in analytics and the banner never covers
 * the footer. The banner appears after hydration, so wait briefly for it.
 */
export async function open(path) {
  await browser.url(path)
  await waitForLoad()
  const reject = await $('button=Адхіліць')
  try {
    await reject.waitForDisplayed({ timeout: 5000 })
    await reject.click()
    await reject.waitForExist({ reverse: true })
  } catch {
    // No banner: consent already given or rejected in this session.
  }
}

/** True when the page is wider than the viewport (horizontal scroll on a phone). */
export async function hasHorizontalScroll() {
  return browser.execute(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
}
