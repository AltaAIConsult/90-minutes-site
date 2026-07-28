// schemas/index.js
import aboutPage from './aboutPage'
import article from './article'
import author from './author'
import canadianCorner from './canadianCorner'
import coverage from './coverage'
import distributeArticle from './distributeArticle'
import gallery from './gallery'
import headline from './headline'
import hero from './hero'
import heroSlide from './heroSlide'
import index from './index'
import news from './news'
import podcast from './podcast'
import product from './product'

// NEW SCHEMAS FOR ABOUT PAGE
import teamMember from './teamMember'
import contributor from './contributor'

export const schemaTypes = [
    aboutPage,
    article,
    author,
    canadianCorner,
    coverage,
    distributeArticle,
    gallery,
    headline,
    hero,
    heroSlide,
    index,
    news,
    podcast,
    product,
    
    // NEW SCHEMAS ADDED TO THE ARRAY
    teamMember,
    contributor,
]

// If you have documentActions exported, keep them here as they were:
export const documentActions = []