import aboutPage from './aboutPage'
import article from './article'
import author from './author'
import canadianCorner from './canadianCorner'
import coverage from './coverage' // <-- ADD THIS
import gallery from './gallery'
import headline from './headline'
import hero from './hero'
import heroSlide from './heroSlide'
import news from './news'
import podcast from './podcast'
import product from './product'
import seo from './seo'
import siteSettings from './siteSettings'

import { DistributeArticle } from './distributeArticle'

export const schemaTypes = [
  aboutPage,
  article,
  author,
  canadianCorner,
  coverage, // <-- ADD THIS
  gallery,
  headline,
  hero,
  heroSlide,
  news,
  podcast,
  product,
  seo,
  siteSettings
]

export const documentActions = (prev, { schemaType }) => {
  if (schemaType === 'news') {
    return [...prev, DistributeArticle]
  }
  return prev
}