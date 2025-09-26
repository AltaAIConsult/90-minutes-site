// netlify/functions/get-products.js

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

    const products = data.result.map(product => ({
      id: product.id,
      name: product.name,
      imageUrl: product.thumbnail_url,
      // CORRECTED LINE: Uses 'retail_price' to get the price you set.
      price: product.variants.length > 0 ? product.variants[0].retail_price : '0.00'
    }));

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