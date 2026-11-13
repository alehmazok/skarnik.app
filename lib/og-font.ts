import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Inter Bold (SIL OFL, assets/fonts/OFL.txt), full TTF with Cyrillic incl. ў/і.
// Bundled so OG images never fetch fonts: no network, no timeouts, same glyphs every render.
// `outputFileTracingIncludes` in next.config.ts copies it into the standalone build.
export const OG_FONT_PATH = join(process.cwd(), 'assets/fonts/Inter-Bold.ttf')

// Read once at module load.
export const ogFont: Buffer = readFileSync(OG_FONT_PATH)
