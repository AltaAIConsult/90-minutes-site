// schemas/contributor.js
export default {
  name: 'contributor',
  title: 'Contributor',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'role',
      title: 'Role / Position',
      type: 'string',
      description: 'e.g., "Official Photographer", "Digital Media Manager"',
      validation: Rule => Rule.required()
    },
    {
      name: 'instagram',
      title: 'Instagram Handle (Optional)',
      type: 'url',
      description: 'e.g., https://www.instagram.com/username/'
    },
    {
      name: 'twitter',
      title: 'Twitter/X Handle (Optional)',
      type: 'url'
    },
    {
      name: 'portfolioLink',
      title: 'Portfolio Website (Optional)',
      type: 'url'
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0
    }
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role'
    }
  }
}