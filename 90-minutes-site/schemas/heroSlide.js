export default {
  name: 'heroSlide',
  title: 'Hero Slides',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Slide Headline',
      type: 'string',
      description: 'Big text on the slide (e.g., "Messi Scores Hat-Trick")'
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
      description: 'Smaller text under the headline'
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: '1920x1080px recommended'
    },
    {
      name: 'tag',
      title: 'Tag (Breaking/Featured/etc)',
      type: 'string',
      options: {
        list: [
          {title: 'Breaking', value: 'Breaking'},
          {title: 'Featured', value: 'Featured'},
          {title: 'New Episode', value: 'New Episode'},
          {title: 'Canadian Corner', value: 'Canadian Corner'},
          {title: 'New Drop', value: 'New Drop'}
        ]
      }
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
      initialValue: 'Read Full Story'
    },
    {
      name: 'link',
      title: 'Link URL',
      type: 'string',
      description: 'Where the button goes (e.g., /article/messi-hat-trick.html)'
    },
    {
      name: 'order',
      title: 'Slide Order',
      type: 'number',
      description: '1 = first slide, 2 = second, etc.'
    },
    {
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Show this slide?',
      initialValue: true
    }
  ],
  preview: {
    select: {
      title: 'title',
      tag: 'tag'
    },
    prepare({title, tag}) {
      return {
        title: title || 'Untitled Slide',
        subtitle: tag
      }
    }
  }
}