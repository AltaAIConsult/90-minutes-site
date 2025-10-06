// netlify/functions/get-products.js

exports.handler = async function(event, context) {
  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  const apiUrl = 'https://api.printful.com/store/products';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${PRINTFUL_API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`Printful API Error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.result || data.result.length === 0) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    const products = data.result.map(product => {
        // Find the first variant to get its ID and retail price
        const firstVariant = product.variants.length > 0 ? product.variants[0] : null;
        return {
            id: product.id,
            variantId: firstVariant ? firstVariant.id : null, // Crucial for creating Printful order
            name: product.name,
            imageUrl: product.thumbnail_url,
            price: firstVariant ? firstVariant.retail_price : '0.00' // Use retail_price
        };
    });

    return { statusCode: 200, body: JSON.stringify(products) };
  } catch (error) {
    console.error('Error fetching from Printful:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch products' }) };
  }
};