// deskStructure.js

export const myStructure = (S) =>
    S.list()
      .title('Content Management')
      .items([
        // This is the "singleton" document type for the Hero section
        S.listItem()
          .title('Hero Section')
          .id('hero-section') // Add a unique ID
          .child(
            S.document()
              .schemaType('hero')
              .documentId('hero')
          ),
        
        // This adds a visual divider
        S.divider(),
  
        // These are the regular document lists, now correctly wrapped in list items
        S.listItem()
          .title('Shop Products')
          .child(S.documentTypeList('product').title('Shop Products')),
          
        S.listItem()
          .title('Podcast Episodes')
          .child(S.documentTypeList('podcast').title('Podcast Episodes')),
      ])