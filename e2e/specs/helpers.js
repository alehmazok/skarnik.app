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

/**
 * Elements that stick out past the right edge of the viewport (they cause
 * horizontal scroll on a phone), as short descriptions; empty when none.
 * Only the outermost offender of each branch is listed.
 */
export async function overflowingElements() {
  return browser.execute(() => {
    const width = document.documentElement.clientWidth
    if (document.documentElement.scrollWidth <= width + 1) return []
    const out = []
    const describe = (el) => {
      const r = el.getBoundingClientRect()
      const cls = typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
      return `<${el.tagName.toLowerCase()}${cls}> right=${Math.round(r.right)} width=${Math.round(r.width)} viewport=${width} "${text}"`
    }
    const walk = (el) => {
      for (const child of el.children) {
        if (child.getBoundingClientRect().right > width + 1) {
          // Report the deepest single cause: descend while only one child overflows.
          const inner = [...child.children].filter((c) => c.getBoundingClientRect().right > width + 1)
          if (inner.length === 0) out.push(describe(child))
          else walk(child)
        } else {
          walk(child)
        }
      }
    }
    walk(document.body)
    return out.length ? out.slice(0, 5) : [`scrollWidth=${document.documentElement.scrollWidth} viewport=${width}`]
  })
}
