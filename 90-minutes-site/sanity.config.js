// sanity.config.js

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Import your schemas
import hero from './schemas/hero.js'
import podcast from './schemas/podcast.js'
import product from './schemas/product.js'

// Import your custom structure
import {myStructure} from './deskStructure.js'

export default defineConfig({
  name: 'default',
  title: '90-minutes-site',

  projectId: 'llmrml4v',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: myStructure, // Use our custom structure
    }),
  ],

  schema: {
    types: [hero, podcast, product],
  },
})