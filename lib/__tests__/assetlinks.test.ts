import { describe, it, expect } from 'vitest'
import { getAssetLinks, ANDROID_PACKAGE_NAME, ANDROID_SHA256_CERT_FINGERPRINTS } from '../assetlinks'
import { GET } from '@/app/.well-known/assetlinks.json/route'

describe('getAssetLinks', () => {
  it('delegates all URLs to the Android app', () => {
    const [statement, ...rest] = getAssetLinks()
    expect(rest).toHaveLength(0)
    expect(statement.relation).toEqual(['delegate_permission/common.handle_all_urls'])
    expect(statement.target.namespace).toBe('android_app')
    expect(statement.target.package_name).toBe('by.mazokaleh.skarnik')
    expect(ANDROID_PACKAGE_NAME).toBe('by.mazokaleh.skarnik')
  })

  it('lists well-formed SHA-256 fingerprints', () => {
    const { sha256_cert_fingerprints } = getAssetLinks()[0].target
    expect(sha256_cert_fingerprints.length).toBeGreaterThan(0)
    expect(sha256_cert_fingerprints).toEqual([...ANDROID_SHA256_CERT_FINGERPRINTS])
    for (const fp of sha256_cert_fingerprints) {
      // 32 uppercase hex bytes separated by colons, as Android expects
      expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/)
    }
  })
})

describe('GET /.well-known/assetlinks.json', () => {
  it('answers 200 with JSON', async () => {
    const res = GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.json()).toEqual(getAssetLinks())
  })
})
