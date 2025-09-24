// schemas/podcast.js

export default {
    name: 'podcast',
    type: 'document',
    title: 'Podcast Episode',
    fields: [
      {
        name: 'title',
        type: 'string',
        title: 'Episode Title',
      },
      {
        name: 'youtubeLink',
        type: 'url',
        title: 'YouTube Link',
      },
    ],
  }