// This function is the secure bridge between your website and Stripe.
// It uses your secret key safely stored on Netlify.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    // We only allow POST requests for security.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // The frontend sends a JSON object with the Price ID of the clicked product.
        // We parse that object here to get the specific priceId.
        const { priceId } = JSON.parse(event.body);

        // This checks if the frontend actually sent a priceId.
        if (!priceId) {
            throw new Error("Missing Price ID in the request from the website.");
        }
        
        // Netlify provides the live URL of your site in an environment variable.
        const siteUrl = process.env.URL || 'http://localhost:8888';

        // Here we create the dynamic Checkout Session using the Stripe API.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            
            // This is where the received priceId is used to add the correct item to the cart.
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            
            mode: 'payment',
            
            // These are the pages the user will be sent to after the transaction.
            success_url: `${siteUrl}/payment-success.html`,
            cancel_url: `${siteUrl}/payment-cancelled.html`,
        });

        // We send the session ID back to the website's script, which then redirects the user.
        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id }),
        };

    } catch (error) {
        // If anything goes wrong, we log the error and send a clear message back.
        console.error("Error creating Stripe session:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to create Stripe session: ${error.message}` }),
        };
    }
};