import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'Application Tracker for LinkedIn',
  description: pkg.description,
  version: pkg.version,
  icons: {
    48: 'public/favicon.png',
  },
  action: {
    default_icon: {
      48: 'public/favicon.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'storage',
  ],
  host_permissions: [
    'https://api.application-tracker.lucassenarj.dev/*',
    'https://local.api.application-tracker.lucassenarj.dev/*',
  ],
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://www.linkedin.com/jobs/view/*'],
  }],
  options_page: 'src/options/index.html',
})
