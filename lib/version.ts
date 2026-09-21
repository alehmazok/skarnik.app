export interface VersionInfo {
  sha: string
  builtAt: string
}

export function getVersion(env: NodeJS.ProcessEnv = process.env): VersionInfo {
  return {
    sha: env.GIT_SHA || 'unknown',
    builtAt: env.BUILD_TIME || 'unknown',
  }
}
