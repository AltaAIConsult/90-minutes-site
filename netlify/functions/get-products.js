// netlify/functions/get-products.js

exports.handler = async function(event, context) {
    // Your secret Printful API key will be stored in an environment variable on Netlify.
    // We access it here using process.env.VARIABLE_NAME
    const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  
    // The URL to Printful's API endpoint for getting your store's products.
    const apiUrl = 'https://api.printful.com/store/products';
  
    try {
      // We use the `fetch` API to make a request to Printful.
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          // We include the API key in the 'Authorization' header, as required by Printful.
          // The 'btoa' function encodes the key in Base64 format.
          'Authorization': `Basic ${btoa(PRINTFUL_API_KEY)}`,
          'Content-Type': 'application/json'
        }
      });
  
      // If the request to Printful was not successful, throw an error.
      if (!response.ok) {
        throw new Error(`Printful API responded with status: ${response.status}`);
      }
  
      // Parse the JSON data from Printful's response.
      const data = await response.json();
  
      // The product data is inside a 'result' array in the response.
      // We map over it to create a cleaner, simpler object for our website to use.
      const products = data.result.map(product => ({
        id: product.id,
        name: product.name,
        imageUrl: product.thumbnail_url,
        // We need to find the price from the 'variants' array.
        // We'll take the price of the first variant as the main price.
        price: product.variants.length > 0 ? product.variants[0].price : '0.00'
      }));
  
      // If everything is successful, return a 200 OK status and the cleaned-up product data.
      return {
        statusCode: 200,
        body: JSON.stringify(products),
      };
  
    } catch (error) {
      // If anything goes wrong, log the error and return a 500 Internal Server Error status.
      console.error('Error fetching from Printful:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch products from Printful' }),
      };
    }
  };