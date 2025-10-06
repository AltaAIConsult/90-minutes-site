// main.js - FINAL FINAL VERSION
import {createClient} from 'https://esm.sh/@sanity/client'
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url'
const client = createClient({projectId: 'llmrml4v', dataset: 'production', useCdn: true, apiVersion: '2024-03-11'})
const builder = imageUrlBuilder(client)
function urlFor(source) { return builder.image(source) }
let cart = [];
function addToCart(productId, variantId, productName, productPrice, productImageUrl) {
  const existingProduct = cart.find(item => item.variantId === variantId);
  if (existingProduct) { existingProduct.quantity += 1; } 
  else { cart.push({ id: productId, variantId, name: productName, price: productPrice, imageUrl: productImageUrl, quantity: 1 }); }
  updateCartDisplay();
}
function updateCartDisplay() {
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  if (!cartItems || !cartTotal) return;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) { cartCount.textContent = totalItems; cartCount.classList.toggle('hidden', totalItems === 0); }
  cartItems.innerHTML = '';
  if (cart.length === 0) { cartItems.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>'; } 
  else {
    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'flex justify-between items-center py-2 border-b';
      itemEl.innerHTML = `
        <div class="flex items-center"><img src="${item.imageUrl}" alt="${item.name}" class="w-16 h-16 object-cover mr-4 rounded"><div><p class="font-semibold text-sm">${item.name}</p><p class="text-xs text-gray-600">${item.quantity} x $${parseFloat(item.price).toFixed(2)}</p></div></div>
        <button onclick="removeFromCart(${item.variantId})" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>`;
      cartItems.appendChild(itemEl);
    });
  }
  const totalPrice = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
}
function removeFromCart(variantId) { cart = cart.filter(item => item.variantId !== variantId); updateCartDisplay(); }
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('translate-x-full'); }
async function handleCheckout() {
    const btn = document.getElementById('sidebar-checkout-button');
    if (!btn || cart.length === 0) return;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    try {
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ cart }),
        });
        if (!response.ok) { const errorInfo = await response.json(); throw new Error(errorInfo.error || 'Failed to create checkout session'); }
        const session = await response.json();
        window.location.href = session.url;
    } catch (error) {
        console.error('Checkout error:', error); alert(`Could not initiate checkout. Please try again. Error: ${error.message}`);
        btn.disabled = false; btn.textContent = 'Proceed to Checkout';
    }
}
window.addToCart = addToCart; window.handleCheckout = handleCheckout; window.toggleCart = toggleCart; window.removeFromCart = removeFromCart;
async function getHero() {
  const heroSection = document.getElementById('home');
  const heroData = await client.fetch('*[_type == "hero" && _id == "hero"][0]');
  if (!heroSection || !heroData) return;
  const existingBg = heroSection.querySelector('#hero-background');
  if (existingBg) existingBg.remove();
  let backgroundElement;
  if (heroData.backgroundType === 'video' && heroData.backgroundVideo?.asset?._ref) {
    const videoAsset = await client.getDocument(heroData.backgroundVideo.asset._ref);
    if(videoAsset.url) {
      backgroundElement = document.createElement('video');
      backgroundElement.src = videoAsset.url;
      backgroundElement.className = 'absolute inset-0 w-full h-full object-cover z-0';
      backgroundElement.autoplay = true; backgroundElement.loop = true; backgroundElement.muted = true; backgroundElement.playsInline = true;
    }
  } else if (heroData.backgroundType === 'image' && heroData.backgroundImage) {
    backgroundElement = document.createElement('div');
    const imageUrl = urlFor(heroData.backgroundImage).width(1920).quality(80).url();
    backgroundElement.style.backgroundImage = `url(${imageUrl})`;
    backgroundElement.className = 'absolute inset-0 bg-cover bg-center z-0';
  }
  if (backgroundElement) { backgroundElement.id = 'hero-background'; heroSection.prepend(backgroundElement); }
}
async function getProducts() {
  const productList = document.getElementById('product-list');
  if (!productList) return;
  try {
    const response = await fetch('/.netlify/functions/get-products');
    if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
    const products = await response.json();
    if (products.length === 0) { productList.innerHTML = '<p>No products found at this time.</p>'; return; }
    productList.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'bg-white p-6 shadow-lg rounded-lg border border-gray-200 transition duration-300 hover:shadow-xl';
      card.innerHTML = `
        <div class="w-full h-64 bg-gray-100 flex items-center justify-center mb-4 relative overflow-hidden"><img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover transition duration-500 hover:scale-105"></div>
        <h3 class="text-xl font-bold mb-2">${product.name}</h3>
        <p class="text-gray-600 text-lg font-semibold mb-4">$${parseFloat(product.price).toFixed(2)}</p>
        <button onclick="addToCart('${product.id}', ${product.variantId}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl}')" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Add to Cart</button>`;
      productList.appendChild(card);
    });
  } catch (error) {
    console.error('Error in getProducts:', error); productList.innerHTML = '<p class="text-red-500">Error loading products. Please try again later.</p>';
  }
}
async function getPodcasts() {
  const podcastList = document.getElementById('podcast-list');
  const podcasts = await client.fetch('*[_type == "podcast"]');
  if (!podcastList || podcasts.length === 0) return;
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
    textContainer.innerHTML = `<h3 class="text-xl font-bold mb-2">${podcast.title}</h3><a href="${podcast.youtubeLink}" target="_blank" rel="noopener noreferrer" class="text-red-600 hover:text-red-700 font-medium text-sm block mt-2">Watch on YouTube</a>`;
    card.appendChild(iframeContainer);
    card.appendChild(textContainer);
    podcastList.appendChild(card);
  });
}
getHero();
getProducts();
getPodcasts();