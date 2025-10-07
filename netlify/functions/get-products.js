// netlify/functions/get-products.js
exports.handler = async function(event, context) {
  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  const baseUrl = 'https://api.printful.com/store/products';

  try {
    // Fetch product list
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

    // Fetch full details for each product to access variants, price, and sizes
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

        // Grab all variants (sizes)
        const variants = (detailData.result.sync_variants || []).map(v => ({
          id: v.id,
          size: v.size || v.name?.match(/Size:\s*(\w+)/)?.[1] || 'One Size',
          price: parseFloat(v.retail_price) || 0.00
        }));

        const firstVariant = variants[0] || null;

        return {
          id: p.id,
          name: p.name,
          imageUrl: p.thumbnail_url,
          price: firstVariant ? firstVariant.price : 0.00,
          variants
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
