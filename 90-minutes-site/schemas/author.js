// schemas/author.js
export default {
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'}
    },
    {
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true}
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          {title: 'Founder', value: 'founder'},
          {title: 'Writer', value: 'writer'},
          {title: 'Contributor', value: 'contributor'}
        ]
      }
    }
  ]
}