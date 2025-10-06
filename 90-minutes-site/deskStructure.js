// deskStructure.js

export const myStructure = (S) =>
  S.list()
    .title('Content Management')
    .items([
      S.listItem()
        .title('Hero Section')
        .id('hero-section')
        .child(
          S.document()
            .schemaType('hero')
            .documentId('hero')
        ),
      
      S.divider(),
        
      S.listItem()
        .title('Podcast Episodes')
        .child(S.documentTypeList('podcast').title('Podcast Episodes')),
    ])