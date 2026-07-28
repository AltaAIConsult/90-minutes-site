// 90-minutes-site/sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {media} from 'sanity-plugin-media' 
import {schemaTypes, documentActions} from './schemas/index.js'

export default defineConfig({
  name: 'default',
  title: '90 Minutes or More',
  
  projectId: 'llmrml4v',
  dataset: 'production',

  plugins: [
    structureTool(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },
  
  document: {
    actions: documentActions
  }
})