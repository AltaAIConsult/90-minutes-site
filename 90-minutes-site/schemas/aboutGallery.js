// schemas/aboutGallery.js
export default {
  name: 'aboutGallery',
  title: 'About Page Images',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Section Title (Internal Use Only)',
      type: 'string',
      description: 'Just a label so you know what this is (e.g., "About Us Photos")',
      initialValue: 'About Us Photos'
    },
    {
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { 
            hotspot: true,
            accept: 'image/*'
          },
        }
      ],
      options: {
        layout: 'grid',
        multiple: true // <--- THIS IS THE FIX
      },
      validation: Rule => Rule.required().min(1).max(8)
    }
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0'
    }
  }
}