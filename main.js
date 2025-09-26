// main.js

import {createClient} from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

// --- SANITY CLIENT CONFIG ---
const client = createClient({
  projectId: 'llmrml4v',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-03-11',
})

const builder = imageUrlBuilder(client)
function urlFor(source) {
  return builder.image(source)
}

// ==========================================================
// SHOPPING CART LOGIC
// ==========================================================
let cart = [];

function addToCart(productId, productName, productPrice, productImageUrl) {
  // Check if product is already in the cart
  const existingProductIndex = cart.findIndex(item => item.id === productId);

  if (existingProductIndex > -1) {
    // If it exists, just increase the quantity
    cart[existingProductIndex].quantity += 1;
  } else {
    // If it doesn't exist, add it to the cart
    cart.push({
      id: productId,
      name: productName,
      price: productPrice,
      imageUrl: productImageUrl,
      quantity: 1,
    });
  }

  console.log('Cart updated:', cart);
  updateCartDisplay(); // A function to update a visual cart count
}

function updateCartDisplay() {
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = totalItems;
    cartCountElement.classList.toggle('hidden', totalItems === 0);
  }
}

async function handleCheckout() {
  const checkoutButton = document.getElementById('checkout-button');
  if (!checkoutButton || cart.length === 0) return;

  checkoutButton.disabled = true;
  checkoutButton.textContent = 'Processing...';

  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart: cart }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    // Redirect to Stripe's checkout page
    window.location.href = session.url;

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Could not initiate checkout. Please try again.');
    checkoutButton.disabled = false;
    checkoutButton.textContent = 'Checkout';
  }
}

// Expose addToCart and handleCheckout to the global scope so inline onclicks can find them
window.addToCart = addToCart;
window.handleCheckout = handleCheckout;


// ==========================================================
// HERO SECTION LOGIC
// ==========================================================
async function getHero() {
  // ... (Your existing getHero function code remains here, unchanged)
  const heroSection = document.getElementById('home');
  const heroData = await client.fetch('*[_type == "hero" && _id == "hero"][0]');

  if (!heroSection || !heroData) {
    console.log('Hero section not found or no data.')
    return;
  }
  const existingBg = heroSection.querySelector('#hero-background');
  if (existingBg) {
    existingBg.remove();
  }
  let backgroundElement;
  if (heroData.backgroundType === 'video' && heroData.backgroundVideo?.asset?._ref) {
    const videoAsset = await client.getDocument(heroData.backgroundVideo.asset._ref);
    if(videoAsset.url) {
      backgroundElement = document.createElement('video');
      backgroundElement.src = videoAsset.url;
      backgroundElement.className = 'absolute inset-0 w-full h-full object-cover z-0';
      backgroundElement.autoplay = true;
      backgroundElement.loop = true;
      backgroundElement.muted = true;
      backgroundElement.playsInline = true;
    }
  } else if (heroData.backgroundType === 'image' && heroData.backgroundImage) {
    backgroundElement = document.createElement('div');
    const imageUrl = urlFor(heroData.backgroundImage).width(1920).quality(80).url();
    backgroundElement.style.backgroundImage = `url(${imageUrl})`;
    backgroundElement.className = 'absolute inset-0 bg-cover bg-center z-0';
  }
  if (backgroundElement) {
    backgroundElement.id = 'hero-background';
    heroSection.prepend(backgroundElement);
  }
}

// ==========================================================
// SHOP SECTION LOGIC
// ==========================================================
async function getProducts() {
  // ... (Your existing getProducts function code is updated below)
  const productList = document.getElementById('product-list');
  if (!productList) return;

  try {
    const response = await fetch('/.netlify/functions/get-products');
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    const products = await response.json();

    if (products.length === 0) {
      productList.innerHTML = '<p>No products found at this time.</p>';
      return;
    }

    productList.innerHTML = '';

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'bg-white p-6 shadow-lg rounded-lg border border-gray-200 transition duration-300 hover:shadow-xl';
      
      // We pass all product details to the addToCart function
      card.innerHTML = `
        <div class="w-full h-64 bg-gray-100 flex items-center justify-center mb-4 relative overflow-hidden">
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition duration-500 hover:scale-105">
        </div>
        <h3 class="text-xl font-bold mb-2">${product.name}</h3>
        <p class="text-gray-600 text-lg font-semibold mb-4">$${parseFloat(product.price).toFixed(2)}</p>
        <button onclick="addToCart('${product.id}', '${product.name}', ${product.price}, '${product.imageUrl}')" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Add to Cart</button>
      `;

      productList.appendChild(card);
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    productList.innerHTML = '<p class="text-red-500">Error loading products. Please try again later.</p>';
  }
}

// ==========================================================
// PODCAST SECTION LOGIC
// ==========================================================
async function getPodcasts() {
  // ... (Your existing getPodcasts function code remains here, unchanged)
  const podcastList = document.getElementById('podcast-list');
  const podcasts = await client.fetch('*[_type == "podcast"]');
  
  if (!podcastList || podcasts.length === 0) {
    return;
  }
  podcastList.innerHTML = '';
  podcasts.forEach(podcast => {
    const card = document.createElement('div');
    card.className = 'podcast-card bg-white shadow-lg overflow-hidden transition duration-300 hover:shadow-xl';

    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'podcast-iframe-container';
    
    const embedUrl = podcast.youtubeLink.replace('watch?v=', 'embed/');
    iframeContainer.innerHTML = `<iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

    const textContainer = document.createElement('div');
    textContainer.className = 'p-6 text-center';
    textContainer.innerHTML = `
      <h3 class="text-xl font-bold mb-2">${podcast.title}</h3>
      <a href="${podcast.youtubeLink}" target="_blank" rel="noopener noreferrer" class="text-red-600 hover:text-red-700 font-medium text-sm block mt-2">Watch on YouTube</a>
    `;

    card.appendChild(iframeContainer);
    card.appendChild(textContainer);
    podcastList.appendChild(card);
  });
}


// ==========================================================
// RUN ALL FUNCTIONS
// ==========================================================
getHero();
getProducts();
getPodcasts();