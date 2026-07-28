// schemas/coverage.js
export default {
  name: 'coverage',
  title: 'Official Coverage',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., "Canada vs Ireland" or "Interview with Coach"',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: Rule => Rule.required()
    },
    {
      name: 'type',
      title: 'Coverage Type',
      type: 'string',
      options: {
        list: [
          { title: '📸 Photography Gallery', value: 'photography' },
          { title: '🎬 Video / Interview', value: 'video' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'This will be the thumbnail on the coverage page',
      validation: Rule => Rule.required()
    },
    {
      name: 'matchDate',
      title: 'Date',
      type: 'date',
      validation: Rule => Rule.required()
    },
    {
      name: 'venue',
      title: 'Venue / Location',
      type: 'string',
      description: 'e.g., "Saputo Stadium" or "BMO Field"'
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      description: 'Brief description of the coverage (optional)'
    },
    // PHOTOGRAPHY SPECIFIC FIELDS
    {
      name: 'gallery',
      title: 'Photo Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { 
            hotspot: true,
            accept: 'image/*', 
            multiple: true  // <--- This enables multi-upload
          },
          fields: [
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ]
        }
      ],
      options: {
        layout: 'grid'
      },
      hidden: ({ document }) => document?.type !== 'photography',
      validation: Rule => Rule.custom((value, context) => {
        if (context.document?.type === 'photography' && (!value || value.length === 0)) {
          return 'Please add at least one photo to the gallery'
        }
        return true
      })
    },
    // VIDEO SPECIFIC FIELDS
    {
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      description: 'e.g., https://www.youtube.com/watch?v=...',
      hidden: ({ document }) => document?.type !== 'video',
      validation: Rule => Rule.custom((value, context) => {
        if (context.document?.type === 'video' && !value) {
          return 'Please enter a YouTube URL'
        }
        return true
      })
    },
    {
      name: 'youtubeThumbnail',
      title: 'Custom Thumbnail (Optional)',
      type: 'image',
      description: 'If left blank, YouTube thumbnail will be auto-fetched',
      hidden: ({ document }) => document?.type !== 'video',
      options: { hotspot: true }
    },
    {
      name: 'videoDuration',
      title: 'Video Duration (Optional)',
      type: 'string',
      description: 'e.g., "12:34"',
      hidden: ({ document }) => document?.type !== 'video'
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
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    },
    {
      title: 'Date (Newest First)',
      name: 'dateDesc',
      by: [{ field: 'matchDate', direction: 'desc' }]
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
      media: 'coverImage',
      date: 'matchDate'
    },
    prepare({ title, subtitle, media, date }) {
      const typeLabel = subtitle === 'photography' ? '📸 Photography' : '🎬 Video'
      return {
        title: title || 'Untitled',
        subtitle: `${typeLabel} · ${date || 'No date'}`,
        media
      }
    }
  }
}