// schemas/product.js

export default {
    name: 'product',
    type: 'document',
    title: 'Shop Product',
    fields: [
      {
        name: 'name',
        type: 'string',
        title: 'Product Name',
      },
      {
        name: 'price',
        type: 'number',
        title: 'Price',
      },
      {
        name: 'image',
        type: 'image',
        title: 'Product Image',
      },
      // We'll add this field now to prepare for the Printful integration later
      {
        name: 'printfulId',
        type: 'string',
        title: 'Printful Product ID',
        description: 'Optional: The ID from Printful for this specific product variant.',
      },
    ],
  }