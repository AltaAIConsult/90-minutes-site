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
    },
    // ONE-PUBLISH WORKFLOW FIELDS
    {
      name: 'distribution',
      title: 'Distribute To',
      type: 'object',
      description: 'Select where to feature this article',
      fields: [
        {
          name: 'heroSlider',
          title: 'Feature on Hero Slider',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'heroSliderPosition',
          title: 'Hero Slide Position',
          type: 'number',
          description: '1 = first slide, 2 = second, etc.',
          hidden: ({parent}) => !parent?.heroSlider,
          validation: Rule => Rule.min(1).max(10)
        },
        {
          name: 'heroSliderTag',
          title: 'Hero Slide Tag',
          type: 'string',
          description: 'e.g., Breaking, Featured, New Episode',
          hidden: ({parent}) => !parent?.heroSlider,
          initialValue: 'Featured'
        },
        {
          name: 'quickHeadlines',
          title: 'Show in Quick Headlines',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'quickHeadlinesPosition',
          title: 'Headline Position',
          type: 'number',
          description: '1-6 (lower = shows first)',
          hidden: ({parent}) => !parent?.quickHeadlines,
          validation: Rule => Rule.min(1).max(6)
        },
        {
          name: 'canadianCorner',
          title: 'Show in Canadian Corner',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'canadianCornerPosition',
          title: 'Canadian Corner Position',
          type: 'string',
          description: 'Where to show in Canadian Corner',
          hidden: ({parent}) => !parent?.canadianCorner,
          options: {
            list: [
              {title: 'Featured Main Article', value: 'featured'},
              {title: 'Sidebar 1', value: 'sidebar-1'},
              {title: 'Sidebar 2', value: 'sidebar-2'},
              {title: 'Sidebar 3', value: 'sidebar-3'}
            ]
          }
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      category: 'category',
      distribution: 'distribution'
    },
    prepare({title, author, media, category, distribution}) {
      const locations = [];
      if (distribution?.heroSlider) locations.push('Hero');
      if (distribution?.quickHeadlines) locations.push('Headlines');
      if (distribution?.canadianCorner) locations.push('Canadian');
      
      return {
        title: title || 'Untitled Article',
        subtitle: `${author || 'No author'} • ${category || 'No category'}${locations.length ? ' • ' + locations.join(', ') : ''}`,
        media
      }
    }
  }
}