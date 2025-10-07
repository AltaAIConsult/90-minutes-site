// netlify/functions/get-products.js
// Version 2: Final Price Fix

exports.handler = async function(event, context) {
  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  const apiUrl = 'https://api.printful.com/store/products';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Printful API responded with status: ${response.status}`, errorText);
      throw new Error(`Printful API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    const products = data.result.map(product => {
        // Find the first variant to get its ID and retail price
        const firstVariant = product.variants.length > 0 ? product.variants[0] : null;
        
        return {
            id: product.id,
            variantId: firstVariant ? firstVariant.id : null, // This is crucial for creating the final Printful order
            name: product.name,
            imageUrl: product.thumbnail_url,
            // THIS IS THE FINAL FIX: Use parseFloat on the retail_price field
            price: firstVariant ? parseFloat(firstVariant.retail_price) : 0.00 
        };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(products),
    };

  } catch (error) {
    console.error('Error in Printful function execution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch products from Printful' }),
    };
  }
};