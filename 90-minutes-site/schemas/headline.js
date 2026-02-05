export default {
  name: 'headline',
  title: 'Quick Headlines',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Headline Title',
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
      title: 'Headline Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Breaking', value: 'breaking'},
          {title: 'Premier League', value: 'premier-league'},
          {title: 'Champions League', value: 'champions-league'},
          {title: 'MLS', value: 'mls'},
          {title: 'Canadian Soccer', value: 'canadian-soccer'},
          {title: 'World Cup', value: 'world-cup'}
        ]
      }
    },
    {
      name: 'link',
      title: 'Link URL',
      type: 'string',
      description: 'URL to full article (e.g., /news/article-slug.html or external https://...)'
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      description: 'Show in the 6-headline row?',
      initialValue: true
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers show first'
    }
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      category: 'category'
    },
    prepare({title, media, category}) {
      return {
        title: title || 'Untitled Headline',
        subtitle: category ? category.toUpperCase() : 'No category',
        media
      }
    }
  }
}