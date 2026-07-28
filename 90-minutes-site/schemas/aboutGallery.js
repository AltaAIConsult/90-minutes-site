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
            accept: 'image/*', 
            multiple: true // Keeps your multi-upload capability!
          },
        }
      ],
      options: {
        layout: 'grid'
      },
      validation: Rule => Rule.required().min(1).max(8) // Allows up to 8 images
    }
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0' // Shows the first image as a preview in Sanity
    }
  }
}