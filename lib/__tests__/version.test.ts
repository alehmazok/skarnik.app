import { describe, it, expect } from 'vitest'
import { getVersion } from '../version'

describe('getVersion', () => {
  it('reads sha and build time from env', () => {
    const env = { GIT_SHA: 'df10860', BUILD_TIME: '2026-09-21T12:33:50Z' } as unknown as NodeJS.ProcessEnv
    expect(getVersion(env)).toEqual({ sha: 'df10860', builtAt: '2026-09-21T12:33:50Z' })
  })

  it('falls back to unknown when env is missing or empty', () => {
    expect(getVersion({} as NodeJS.ProcessEnv)).toEqual({ sha: 'unknown', builtAt: 'unknown' })
    expect(getVersion({ GIT_SHA: '' } as unknown as NodeJS.ProcessEnv).sha).toBe('unknown')
  })
})
