// netlify/functions/handle-successful-payment.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

exports.handler = async ({ body, headers }) => {
  try {
    const stripeSignature = headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    const event = stripe.webhooks.constructEvent(body, stripeSignature, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      
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

      // Retrieve the variantId from the metadata we passed to Stripe
      const items = lineItems.data.map(item => ({
        variant_id: parseInt(item.price.product.metadata.printfulVariantId, 10),
        quantity: item.quantity,
      }));

      const printfulOrderPayload = {
        recipient,
        items,
        external_id: session.id, // Use the Stripe session ID as an external reference
      };

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
      console.log('Successfully submitted order to Printful:', printfulOrderResult.id);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (err) {
    console.log(`Stripe webhook failed with ${err.message}`);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};