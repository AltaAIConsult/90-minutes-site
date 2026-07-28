// schemas/teamMember.js
export default {
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'title',
      title: 'Job Title',
      type: 'string',
      description: 'e.g., "Editor in Chief", "Lead Writer"',
      validation: Rule => Rule.required()
    },
    {
      name: 'bio',
      title: 'Short Bio',
      type: 'text',
      rows: 2,
      description: 'A 1-line bio about the team member'
    },
    {
      name: 'photo',
      title: 'Profile Photo',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
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
      subtitle: 'title',
      media: 'photo'
    }
  }
}