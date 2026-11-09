import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'llmrml4v',
    dataset: 'production'
  },
  studioHost: 'studios-90m',
  deployment: {
    appId: 'ih5m1m9sepj03n43cmrl9zlg',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  }
})