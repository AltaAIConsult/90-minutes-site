// sanity.config.js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {media} from 'sanity-plugin-media' // Added back the media plugin for your multi-uploads
import {schemaTypes, documentActions} from './90-minutes-site/schemas/index.js' // <--- POINTS TO THE NESTED FOLDER

export default defineConfig({
  name: 'default',
  title: '90 Minutes or More',
  
  projectId: 'llmrml4v',
  dataset: 'production',

  plugins: [
    structureTool(),
    media(), // <--- IMPORTANT: Make sure this plugin is still listed!
  ],

  schema: {
    types: schemaTypes,
  },
  
  document: {
    actions: documentActions
  }
})