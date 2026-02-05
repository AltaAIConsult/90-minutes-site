export default {
  name: 'canadianCorner',
  title: 'Canadian Corner',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Canadian Corner'
    },
    {
      name: 'featuredArticle',
      title: 'Featured Main Article',
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
          options: { hotspot: true },
          validation: Rule => Rule.required()
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
          initialValue: 'Featured'
        }
      ]
    },
    {
      name: 'sidebarArticles',
      title: 'Sidebar Articles (3 items)',
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
              title: 'Time Ago',
              type: 'string',
              description: 'e.g., "1 hour ago", "3 hours ago"',
              initialValue: 'Just now'
            }
          ],
          preview: {
            select: { title: 'title' }
          }
        }
      ],
      validation: Rule => Rule.max(3).warning('Maximum 3 sidebar articles recommended')
    }
  ],
  preview: {
    select: {
      title: 'title'
    }
  }
}