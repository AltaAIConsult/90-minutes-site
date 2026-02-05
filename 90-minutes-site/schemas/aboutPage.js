export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'mainHeading',
      title: 'Main Heading',
      type: 'string',
      initialValue: '90 Minutes or More is not just a community, we are a culture.'
    },
    {
      name: 'heroImages',
      title: 'Hero Images',
      type: 'array',
      of: [
        {
          type: 'image',
          fields: [
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ]
        }
      ],
      validation: Rule => Rule.max(2)
    },
    {
      name: 'contentBlocks',
      title: 'Content Paragraphs',
      type: 'array',
      of: [{type: 'block'}]
    },
    {
      name: 'stats',
      title: 'Statistics',
      type: 'object',
      fields: [
        {name: 'followers', title: 'Social Followers', type: 'string', initialValue: '50K+'},
        {name: 'partners', title: 'Brand Partners', type: 'string', initialValue: '100+'},
        {name: 'episodes', title: 'Podcast Episodes', type: 'string', initialValue: '45'},
        {name: 'worldCup', title: 'World Cup Year', type: 'string', initialValue: '2026'}
      ]
    },
    {
      name: 'teamMembers',
      title: 'Team Members',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Name',
              type: 'string'
            },
            {
              name: 'role',
              title: 'Role',
              type: 'string'
            },
            {
              name: 'bio',
              title: 'Short Bio',
              type: 'text',
              rows: 2
            },
            {
              name: 'photo',
              title: 'Photo',
              type: 'image',
              options: {
                hotspot: true
              }
            },
            {
              name: 'order',
              title: 'Display Order',
              type: 'number',
              initialValue: 0
            }
          ]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'mainHeading'
    }
  }
}