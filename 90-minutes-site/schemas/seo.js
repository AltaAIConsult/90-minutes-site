// schemas/seo.js - Reusable SEO fields
export default {
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'SEO Title',
      type: 'string',
      description: 'Appears in browser tab and Google search (50-60 chars optimal)',
      validation: Rule => Rule.max(60).warning('Longer titles may be truncated in search results')
    },
    {
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Appears in Google search results (150-160 chars optimal)',
      validation: Rule => Rule.max(160).warning('Longer descriptions may be truncated')
    },
    {
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      description: '1200x630px recommended for Facebook/Twitter sharing',
      options: {
        hotspot: true
      }
    }
  ]
}