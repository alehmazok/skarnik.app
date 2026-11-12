'use client'

import { useEffect, useState } from 'react'
import { hasInstallPrompt, isStandalone, subscribeInstallPrompt } from '@/lib/install-prompt'
import { installUi, PWA_INSTALL_PROMOTED, type InstallUi } from '@/lib/pwa'

/** What the install UI should show on this device right now; 'none' on the server and on phones. */
export function useInstallUi(): InstallUi {
  const [ui, setUi] = useState<InstallUi>('none')

  useEffect(() => {
    if (!PWA_INSTALL_PROMOTED) return
    const update = () =>
      setUi(
        installUi({
          userAgent: navigator.userAgent,
          maxTouchPoints: navigator.maxTouchPoints ?? 0,
          standalone: isStandalone(),
          hasInstallPrompt: hasInstallPrompt(),
        }),
      )
    update()
    return subscribeInstallPrompt(update)
  }, [])

  return ui
}
