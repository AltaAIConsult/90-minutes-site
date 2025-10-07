// netlify/functions/create-checkout-session.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const { cart } = JSON.parse(event.body);
  const YOUR_DOMAIN = process.env.URL;

  const lineItems = cart.map(item => ({
    price_data: {
      currency: 'cad',
      product_data: {
        name: item.name,
        images: [item.imageUrl],
        // THIS METADATA IS CRUCIAL
        metadata: {
            printfulVariantId: item.variantId 
        }
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/payment-success.html`,
      cancel_url: `${YOUR_DOMAIN}/payment-cancelled.html`,
      // IMPORTANT: This tells Stripe to include product metadata when we retrieve it later
      expand: ['line_items.data.price.product'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};