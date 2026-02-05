import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import hero from './schemas/hero.js'
import podcast from './schemas/podcast.js'
import product from './schemas/product.js'
import article from './schemas/article.js'
import news from './schemas/news.js'
import author from './schemas/author.js'
import gallery from './schemas/gallery.js'
import seo from './schemas/seo.js'
import siteSettings from './schemas/siteSettings.js'
import aboutPage from './schemas/aboutPage.js'
import heroSlide from './schemas/heroSlide.js'
import headline from './schemas/headline.js'
import canadianCorner from './schemas/canadianCorner.js'

export default defineConfig({
  name: 'default',
  title: '90 Minutes or More',
  
  projectId: 'llmrml4v',
  dataset: 'production',

  plugins: [
    structureTool(),
  ],

  schema: {
    types: [hero, podcast, product, article, news, author, gallery, siteSettings, aboutPage, heroSlide, seo, headline, canadianCorner],
  },
})