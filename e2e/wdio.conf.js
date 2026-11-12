// WebdriverIO config for skarnik.app on BrowserStack Automate (real devices).
// Run: BROWSERSTACK_USERNAME=… BROWSERSTACK_ACCESS_KEY=… npm test
// Optional: BASE_URL (default https://skarnik.app).

const user = process.env.BROWSERSTACK_USERNAME
const key = process.env.BROWSERSTACK_ACCESS_KEY
if (!user || !key) {
  throw new Error('Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY (repo secrets in CI).')
}

const buildName = process.env.GITHUB_RUN_NUMBER
  ? `skarnik.app #${process.env.GITHUB_RUN_NUMBER} (${process.env.GITHUB_EVENT_NAME})`
  : `skarnik.app local ${new Date().toISOString().slice(0, 16)}`

// The sponsored plan is Automate Mobile with 5 parallel sessions: one session
// per device below. Device names must match BrowserStack's device list
// (https://www.browserstack.com/list-of-browsers-and-platforms/automate).
const devices = [
  { browserName: 'safari', deviceName: 'iPhone 16', osVersion: '18' },
  { browserName: 'safari', deviceName: 'iPhone 15', osVersion: '17' },
  { browserName: 'safari', deviceName: 'iPad Pro 12.9 2022', osVersion: '16' },
  { browserName: 'chrome', deviceName: 'Samsung Galaxy S24', osVersion: '14.0' },
  { browserName: 'chrome', deviceName: 'Google Pixel 8', osVersion: '14.0' },
]

export const config = {
  user,
  key,
  hostname: 'hub.browserstack.com',
  runner: 'local',
  specs: ['./specs/**/*.e2e.js'],
  maxInstances: devices.length,
  capabilities: devices.map(({ browserName, deviceName, osVersion }) => ({
    browserName,
    'bstack:options': {
      deviceName,
      osVersion,
      realMobile: 'true',
      projectName: 'skarnik.app',
      buildName,
      sessionName: `${deviceName} · ${browserName}`,
      debug: 'true',
      networkLogs: 'true',
      consoleLogs: 'errors',
    },
  })),
  baseUrl: process.env.BASE_URL || 'https://skarnik.app',
  logLevel: 'warn',
  waitforTimeout: 15000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 2,
  // Real-device sessions sometimes drop; one retry keeps a flaky device from failing the run.
  specFileRetries: 1,
  services: [
    ['browserstack', {
      browserstackLocal: false,
      testObservability: false,
      setSessionName: false,
      setSessionStatus: true,
    }],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 120000 },
}
