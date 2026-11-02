// Digital Asset Links for Android App Links: lets Android 12+ open skarnik.app share links straight in the app.
// https://developer.android.com/training/app-links/verify-android-applinks
//
// The fingerprint is the SHA-256 of the Play app signing key, copied from
// Play Console → Protected with Play → App signing → Digital Asset Links JSON (2026-11-02).
// The upload key has the same fingerprint, so Firebase App Distribution builds verify too.
// Fingerprints are public, not secrets.

export const ANDROID_PACKAGE_NAME = 'by.mazokaleh.skarnik'

export const ANDROID_SHA256_CERT_FINGERPRINTS = [
  '08:1A:0F:C3:7C:3C:81:38:3B:3F:4B:E2:FA:AE:82:7F:47:22:4B:7E:B8:7E:DF:9C:3C:20:82:7B:7F:BB:A0:C7',
] as const

export interface AssetLinkStatement {
  relation: string[]
  target: {
    namespace: 'android_app'
    package_name: string
    sha256_cert_fingerprints: string[]
  }
}

export function getAssetLinks(): AssetLinkStatement[] {
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: [...ANDROID_SHA256_CERT_FINGERPRINTS],
      },
    },
  ]
}
