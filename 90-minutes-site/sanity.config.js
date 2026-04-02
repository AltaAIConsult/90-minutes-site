import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes, documentActions} from './schemas/index.js'

export default defineConfig({
  name: 'default',
  title: '90 Minutes or More',
  
  projectId: 'llmrml4v',
  dataset: 'production',

  plugins: [
    structureTool(),
  ],

  schema: {
    types: schemaTypes,
  },
  
  document: {
    actions: documentActions
  }
})