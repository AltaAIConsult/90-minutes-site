// schemas/hero.js

export default {
    name: 'hero',
    type: 'document',
    title: 'Hero Section',
    fields: [
      {
        name: 'backgroundType',
        title: 'Background Type',
        type: 'string',
        options: {
          list: [
            {title: 'Image', value: 'image'},
            {title: 'Video', value: 'video'},
          ],
          layout: 'radio', // Makes it a radio button choice
        },
        initialValue: 'image', // Default to image
      },
      {
        name: 'backgroundImage',
        title: 'Background Image',
        type: 'image',
        hidden: ({parent}) => parent?.backgroundType !== 'image', // Only show if 'Image' is selected
      },
      {
        name: 'backgroundVideo',
        title: 'Background Video',
        type: 'file', // Use 'file' for video uploads
        hidden: ({parent}) => parent?.backgroundType !== 'video', // Only show if 'Video' is selected
      },
    ],
  }