// netlify/functions/get-products.js
exports.handler = async function(event, context) {
  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  const baseUrl = 'https://api.printful.com/store/products';

  try {
    // First, get all products
    const listResponse = await fetch(baseUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error(`Printful API responded with status: ${listResponse.status}`, errorText);
      throw new Error(`Printful API responded with status: ${listResponse.status}`);
    }

    const listData = await listResponse.json();

    // Fetch full details for each product to access variants and retail_price
    const detailedProducts = await Promise.all(
      listData.result.map(async (p) => {
        const detailResponse = await fetch(`${baseUrl}/${p.id}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        const detailData = await detailResponse.json();
        const firstVariant = detailData.result.sync_variants?.[0] || null;

        return {
          id: p.id,
          variantId: firstVariant ? firstVariant.id : null,
          name: p.name,
          imageUrl: p.thumbnail_url,
          price: firstVariant ? parseFloat(firstVariant.retail_price) : 0.00
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(detailedProducts),
    };

  } catch (error) {
    console.error('Error in Printful function execution:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch products from Printful' }),
    };
  }
};
