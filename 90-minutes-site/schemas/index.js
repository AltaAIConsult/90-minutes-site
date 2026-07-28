// 90-minutes-site/schemas/index.js
import aboutPage from './aboutPage'
import article from './article'
import author from './author'
import canadianCorner from './canadianCorner'
import coverage from './coverage'
import gallery from './gallery'
import headline from './headline'
import hero from './hero'
import heroSlide from './heroSlide'
import news from './news'
import podcast from './podcast'
import product from './product'
import seo from './seo'
import siteSettings from './siteSettings'

// NEW SCHEMAS
import teamMember from './teamMember'
import contributor from './contributor'
import aboutGallery from './aboutGallery' // <--- ADDED THIS IMPORT

// Import the custom action
import {DistributeArticle} from './distributeArticle'

export const schemaTypes = [
  aboutPage,
  article,
  author,
  canadianCorner,
  coverage,
  gallery,
  headline,
  hero,
  heroSlide,
  news,
  podcast,
  product,
  seo,
  siteSettings,
  // ADD THE NEW SCHEMAS TO THE ARRAY
  teamMember,
  contributor,
  aboutGallery // <--- ADDED THIS TO THE LIST
]

// Export the custom action so it can be used in the studio
export const documentActions = (prev, {schemaType}) => {
  // Add the DistributeArticle action to news articles
  if (schemaType === 'news') {
    return [...prev, DistributeArticle]
  }
  return prev
}