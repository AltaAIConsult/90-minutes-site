// main.js

import {createClient} from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'

// 1. CONFIGURE THE SANITY CLIENT (for Hero and Podcasts)
const client = createClient({
  projectId: 'llmrml4v', // Your Sanity project ID
  dataset: 'production',
  useCdn: true, // `false` if you want to ensure fresh data
  apiVersion: '2024-03-11', // use a UTC date in YYYY-MM-DD format
})

// Helper to get image URLs from Sanity
const builder = imageUrlBuilder(client)
function urlFor(source) {
  return builder.image(source)
}

// ==========================================================
// HERO SECTION LOGIC (from Sanity)
// ==========================================================
async function getHero() {
  const heroSection = document.getElementById('home');
  const heroData = await client.fetch('*[_type == "hero" && _id == "hero"][0]');

  if (!heroSection || !heroData) {
    console.log('Hero section not found or no data.')
    return;
  }

  // Clear existing background image/video if any
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
    heroSection.prepend(backgroundElement); // Add it as the first child
  }
}


// ==========================================================
// SHOP SECTION LOGIC (from Printful via Netlify Function)
// ==========================================================
async function getProducts() {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  try {
    // Call our own secure Netlify Function instead of Sanity
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
      
      // The `product.imageUrl` and other properties now come directly from our function's response
      card.innerHTML = `
        <div class="w-full h-64 bg-gray-100 flex items-center justify-center mb-4 relative overflow-hidden">
            <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition duration-500 hover:scale-105">
        </div>
        <h3 class="text-xl font-bold mb-2">${product.name}</h3>
        <p class="text-gray-600 text-lg font-semibold mb-4">$${parseFloat(product.price).toFixed(2)}</p>
        <button onclick="alert('Checkout integration for product ID ${product.id} pending!')" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Buy Now</button>
      `;

      productList.appendChild(card);
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    productList.innerHTML = '<p class="text-red-500">Error loading products. Please try again later.</p>';
  }
}


// ==========================================================
// PODCAST SECTION LOGIC (from Sanity)
// ==========================================================
async function getPodcasts() {
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
// RUN ALL FUNCTIONS WHEN THE PAGE LOADS
// ==========================================================
getHero();
getProducts();
getPodcasts();