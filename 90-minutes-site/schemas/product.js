// schemas/product.js
export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Product Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      }
    },
    {
      name: 'printfulId',
      title: 'Printful Product ID',
      type: 'string',
      readOnly: true
    },
    {
      name: 'mainImage',
      title: 'Main Product Image',
      type: 'image'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    },
    {
      name: 'price',
      title: 'Price (CAD)',
      type: 'number'
    },
    {
      name: 'variants',
      title: 'Size Variants',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'size', title: 'Size', type: 'string'},
            {name: 'printfulVariantId', title: 'Printful Variant ID', type: 'string'},
            {name: 'price', title: 'Price', type: 'number'}
          ]
        }
      ]
    },
    {
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo'
    }
  ]
}