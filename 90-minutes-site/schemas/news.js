export default {
  name: 'news',
  title: 'News Articles',
  type: 'document',
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
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}]
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'excerpt',
      title: 'Short Excerpt/Summary',
      type: 'text',
      rows: 3
    },
    {
      name: 'content',
      title: 'Article Content',
      type: 'array',
      of: [
        {type: 'block'},
        {type: 'image'}
      ]
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Serie A', value: 'serie-a'},
          {title: 'EPL', value: 'epl'},
          {title: 'La Liga', value: 'la-liga'},
          {title: 'UCL', value: 'ucl'},
          {title: 'World Cup', value: 'world-cup'},
          {title: 'Concacaf/MLS', value: 'concacaf-mls'},
          {title: 'South America', value: 'south-america'},
          {title: 'World Football', value: 'world-football'},
          {title: 'Transfers', value: 'transfers'},
          {title: 'Canadian Corner', value: 'canadian-corner'},
          {title: 'Breaking', value: 'breaking'}
        ]
      }
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'featured',
      title: 'Featured Article',
      type: 'boolean',
      description: 'Show in featured sections?',
      initialValue: false
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      category: 'category'
    },
    prepare({title, author, media, category}) {
      return {
        title: title || 'Untitled Article',
        subtitle: `By ${author || 'Unknown'} • ${category || 'No category'}`,
        media
      }
    }
  }
}