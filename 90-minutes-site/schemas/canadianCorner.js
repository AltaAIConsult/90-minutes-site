export default {
  name: 'canadianCorner',
  title: 'Canadian Corner',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Canadian Corner',
      readOnly: true
    },
    {
      name: 'featuredArticle',
      title: '⭐ Featured Main Article',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Article Title',
          type: 'string',
          validation: Rule => Rule.required()
        },
        {
          name: 'slug',
          title: 'URL Slug',
          type: 'slug',
          options: {
            source: 'title',
            maxLength: 96
          }
        },
        {
          name: 'mainImage',
          title: 'Main Image',
          type: 'image',
          options: { hotspot: true }
        },
        {
          name: 'excerpt',
          title: 'Short Excerpt',
          type: 'text',
          rows: 2
        },
        {
          name: 'link',
          title: 'Link URL',
          type: 'string'
        },
        {
          name: 'tag',
          title: 'Tag',
          type: 'string',
          initialValue: 'Canadian Corner'
        }
      ]
    },
    {
      name: 'sidebarArticles',
      title: '📋 Sidebar Articles (Max 3)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Article Title',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'link',
              title: 'Link URL',
              type: 'string'
            },
            {
              name: 'publishedAt',
              title: 'Time',
              type: 'string',
              description: 'e.g., "2 hours ago", "Yesterday"',
              initialValue: 'Just now'
            },
            {
              name: 'excerpt',
              title: 'Short Excerpt',
              type: 'text',
              rows: 2
            }
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'publishedAt'
            }
          }
        }
      ],
      validation: Rule => Rule.max(3).warning('Maximum 3 sidebar articles')
    }
  ],
  preview: {
    select: {
      title: 'title',
      featured: 'featuredArticle.title'
    },
    prepare({title, featured}) {
      return {
        title: title || 'Canadian Corner',
        subtitle: featured ? `Featured: ${featured}` : 'No featured article'
      }
    }
  }
}