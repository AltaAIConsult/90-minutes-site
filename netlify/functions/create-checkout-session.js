// netlify/functions/handle-successful-payment.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
// This 'btoa' function is needed for the Node.js environment
const btoa = (str) => Buffer.from(str).toString('base64');

exports.handler = async ({ body, headers }) => {
  try {
    // 1. VERIFY THE EVENT CAME FROM STRIPE
    const stripeSignature = headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // We will add this secret in Netlify
    
    const event = stripe.webhooks.constructEvent(body, stripeSignature, endpointSecret);

    // 2. HANDLE ONLY THE 'checkout.session.completed' EVENT
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Get the line items (products purchased) from the session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      
      // 3. FORMAT THE ORDER FOR PRINTFUL
      const recipient = {
        name: session.shipping_details.name,
        address1: session.shipping_details.address.line1,
        address2: session.shipping_details.address.line2 || '',
        city: session.shipping_details.address.city,
        state_code: session.shipping_details.address.state,
        country_code: session.shipping_details.address.country,
        zip: session.shipping_details.address.postal_code,
        email: session.customer_details.email,
      };

      // We'll need a way to map Stripe line item names back to Printful variant IDs.
      // THIS IS A SIMPLIFIED EXAMPLE. We will need to enhance this.
      const items = lineItems.data.map(item => ({
        // We need a robust way to get the correct variant_id from the product name.
        // For now, this is a placeholder.
        variant_id: 1, // <<< We need to replace this with the real ID from Printful
        quantity: item.quantity,
      }));

      const printfulOrderPayload = {
        recipient,
        items,
      };

      // 4. SUBMIT THE ORDER TO PRINTFUL
      const printfulResponse = await fetch('https://api.printful.com/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printfulOrderPayload)
      });

      if (!printfulResponse.ok) {
        const errorText = await printfulResponse.text();
        console.error('Printful order submission failed:', errorText);
        throw new Error('Failed to submit order to Printful.');
      }
      
      const printfulOrderResult = await printfulResponse.json();
      console.log('Successfully submitted order to Printful:', printfulOrderResult);
    }

    // 5. RESPOND TO STRIPE TO ACKNOWLEDGE RECEIPT
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (err) {
    console.log(`Stripe webhook failed with ${err}`);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};