// sanity.config.js

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import hero from './schemas/hero.js'
import podcast from './schemas/podcast.js'

import {myStructure} from './deskStructure.js'

export default defineConfig({
  name: 'default',
  title: '90-minutes-site',

  projectId: 'llmrml4v',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: myStructure,
    }),
  ],

  schema: {
    types: [hero, podcast],
  },
})