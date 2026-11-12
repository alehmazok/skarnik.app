# skarnik.app end-to-end tests

Real-device browser tests on [BrowserStack Automate](https://www.browserstack.com/automate)
(open source sponsorship: Automate Mobile, 5 parallel sessions). WebdriverIO drives iOS Safari
and Android Chrome on the devices listed in `wdio.conf.js`.

They run against a deployed site (default `https://skarnik.app`), not a local build, because
word pages need Supabase.

```bash
cd e2e
npm install
BROWSERSTACK_USERNAME=… BROWSERSTACK_ACCESS_KEY=… npm test
BASE_URL=https://staging.example npm test   # another deployment
```

Results, videos and logs: BrowserStack Automate dashboard, project **skarnik.app**.

CI: `.github/workflows/browserstack.yml` runs after every successful Deploy, weekly, on manual
dispatch and on PRs that change `e2e/`. It needs repo secrets `BROWSERSTACK_USERNAME` and
`BROWSERSTACK_ACCESS_KEY` (BrowserStack → Account → Access Key).

This folder has its own `package.json` so the app's `bun.lock` and CI job do not pull in
WebdriverIO. Specs are named `*.e2e.js` so Vitest does not pick them up.
