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
      description: 'e.g., "Official Photographer"',
      validation: Rule => Rule.required()
    },
    {
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
      description: 'Full URL (https://...) OR just the handle (@felipe)'
    },
    {
      name: 'twitter',
      title: 'Twitter/X',
      type: 'string',
      description: 'Full URL OR just the handle'
    },
    {
      name: 'portfolioLink',
      title: 'Portfolio Website',
      type: 'url',
      description: 'Full URL for their website (e.g., https://felipe.com)'
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers (1, 2, 3) appear first',
      initialValue: 0
    }
  ]
}