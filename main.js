// ==========================================================
// SANITY CONFIG
// ==========================================================
const SANITY_PROJECT_ID = 'llmrml4v';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = 'v2024-03-11';

function getSanityUrl(query) {
    const encodedQuery = encodeURIComponent(query);
    return `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodedQuery}`;
}

// ==========================================================
// HERO SLIDES FROM SANITY - NEWS FIRST
// ==========================================================
let slideIndex = 1;
let slideInterval;

async function loadHeroSlides() {
    try {
        let slides = [];
        
        const newsQuery = `*[_type == "news" && distribution.heroSlider == true] | order(distribution.heroSliderPosition asc, publishedAt desc) [0...5] {
            title,
            "subtitle": excerpt,
            "imageUrl": mainImage.asset->url,
            category,
            "slug": slug.current,
            distribution
        }`;
        
        const newsResponse = await fetch(getSanityUrl(newsQuery));
        const newsData = await newsResponse.json();
        
        if (newsData.result && newsData.result.length > 0) {
            slides = newsData.result.map(article => ({
                title: article.title,
                subtitle: article.subtitle || '',
                imageUrl: article.imageUrl,
                tag: article.distribution?.heroSliderTag || article.category || 'Featured',
                buttonText: 'Read More',
                link: `/news/article.html?slug=${article.slug}`
            }));
            console.log('Using news articles as hero slides:', slides.length);
        }
        
        if (!slides || slides.length === 0) {
            const heroQuery = `*[_type == "heroSlide" && active == true] | order(order asc) {
                title,
                subtitle,
                "imageUrl": backgroundImage.asset->url,
                tag,
                buttonText,
                link
            }`;
            
            const heroResponse = await fetch(getSanityUrl(heroQuery));
            const heroData = await heroResponse.json();
            slides = heroData.result || [];
            console.log('Hero slides from manual creation:', slides.length);
        }
        
        if (!slides || slides.length === 0) {
            console.log('No hero slides available');
            const heroSection = document.getElementById('hero-section');
            if (heroSection) {
                heroSection.innerHTML = '<div class="h-[70vh] bg-gray-900 flex items-center justify-center text-white">No slides available</div>';
            }
            return;
        }
        
        let slidesHTML = slides.map((slide, i) => {
            let imgHtml = '';
            let bgClass = 'bg-gradient-to-b from-black/60 to-black/40';
            
            if (slide.imageUrl) {
                imgHtml = `<img src="${slide.imageUrl}" alt="${slide.title}" class="w-full h-full object-cover object-top opacity-60" onerror="this.style.display='none'; this.parentElement.classList.add('bg-gradient-to-b', 'from-black/60', 'to-black/40')">`;
                bgClass = '';
            }
            
            return `
            <div class="hero-slide ${i === 0 ? 'active' : ''} relative h-[70vh] bg-gray-900 ${bgClass}">
                ${imgHtml}
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="container mx-auto px-6 text-center text-white relative z-10">
                        <span class="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide mb-4 inline-block">${slide.tag || 'Update'}</span>
                        <h1 class="font-anton text-5xl md:text-7xl font-black uppercase mb-4 leading-tight">${slide.title}</h1>
                        <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8">${slide.subtitle}</p>
                        <a href="${slide.link || '#'}" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-md transition duration-300 inline-block">${slide.buttonText || 'Read More'}</a>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        slidesHTML += `
            <button onclick="changeSlide(-1)" class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition z-10">
                <i class="fas fa-chevron-left text-2xl"></i>
            </button>
            <button onclick="changeSlide(1)" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition z-10">
                <i class="fas fa-chevron-right text-2xl"></i>
            </button>
            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                ${slides.map((_, i) => `<span class="dot w-3 h-3 bg-white rounded-full cursor-pointer ${i === 0 ? 'opacity-100' : 'opacity-50'}" onclick="currentSlide(${i + 1})"></span>`).join('')}
            </div>
        `;
        
        const heroSection = document.getElementById('hero-section');
        if (heroSection) {
            heroSection.innerHTML = slidesHTML;
            console.log('✓ Hero slides rendered:', slides.length);
            slideIndex = 1;
            showSlides(1);
        }
        
    } catch (err) {
        console.error('✗ Hero slides error:', err);
    }
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("hero-slide");
    let dots = document.getElementsByClassName("dot");
    
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    
    for (i = 0; i < slides.length; i++) {
        slides[i].classList.remove('active');
        slides[i].style.display = "none";
    }
    
    for (i = 0; i < dots.length; i++) {
        dots[i].classList.remove("opacity-100");
        dots[i].classList.add("opacity-50");
    }
    
    if (slides.length > 0) {
        slides[slideIndex - 1].style.display = "block";
        setTimeout(() => {
            slides[slideIndex - 1].classList.add('active');
        }, 10);
    }
    
    if (dots.length > 0) {
        dots[slideIndex - 1].classList.remove("opacity-50");
        dots[slideIndex - 1].classList.add("opacity-100");
    }
}

function changeSlide(n) {
    clearInterval(slideInterval);
    showSlides(slideIndex += n);
    startSlideTimer();
}

function currentSlide(n) {
    clearInterval(slideInterval);
    showSlides(slideIndex = n);
    startSlideTimer();
}

function startSlideTimer() {
    slideInterval = setInterval(() => {
        slideIndex++;
        showSlides(slideIndex);
    }, 8000);
}

window.changeSlide = changeSlide;
window.currentSlide = currentSlide;

// ==========================================================
// HEADLINES - NEWS FIRST
// ==========================================================
async function loadHeadlines() {
    const headlinesRow = document.getElementById('headlines-row');
    if (!headlinesRow) return;
    
    try {
        let headlines = [];
        
        const newsQuery = `*[_type == "news" && distribution.quickHeadlines == true] | order(distribution.quickHeadlinesPosition asc, publishedAt desc) [0...6] {
            title,
            "imageUrl": mainImage.asset->url,
            "slug": slug.current,
            publishedAt,
            category
        }`;
        
        const newsResponse = await fetch(getSanityUrl(newsQuery));
        const newsData = await newsResponse.json();
        
        if (newsData.result && newsData.result.length > 0) {
            headlines = newsData.result.map(article => ({
                title: article.title,
                imageUrl: article.imageUrl,
                link: `/news/article.html?slug=${article.slug}`,
                publishedAt: article.publishedAt,
                category: article.category
            }));
            console.log('Using news articles as headlines:', headlines.length);
        }
        
        if (!headlines || headlines.length === 0) {
            const headlineQuery = `*[_type == "headline"] | order(order asc, publishedAt desc) [0...6] {
                title,
                "imageUrl": mainImage.asset->url,
                link,
                publishedAt,
                category
            }`;
            
            const headlineResponse = await fetch(getSanityUrl(headlineQuery));
            const headlineData = await headlineResponse.json();
            headlines = headlineData.result || [];
            console.log('Quick Headlines from manual creation:', headlines.length);
        }
        
        if (!headlines || headlines.length === 0) {
            const fallbackQuery = `*[_type == "news"] | order(publishedAt desc) [0...6] {
                title,
                "imageUrl": mainImage.asset->url,
                "slug": slug.current,
                publishedAt,
                category
            }`;
            
            const fallbackResponse = await fetch(getSanityUrl(fallbackQuery));
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.result && fallbackData.result.length > 0) {
                headlines = fallbackData.result.map(n => ({
                    ...n,
                    link: `/news/article.html?slug=${n.slug}`
                }));
                console.log('Using latest news as headlines:', headlines.length);
            }
        }
        
        if (!headlines || headlines.length === 0) {
            renderFallbackHeadlines(headlinesRow);
            return;
        }
        
        headlinesRow.innerHTML = headlines.map(h => {
            const timeAgo = getTimeAgo(h.publishedAt);
            const categoryLabel = h.category ? h.category.toUpperCase() : 'NEWS';
            const link = h.link || `/news/article.html?slug=${h.slug}`;
            
            return `
            <a href="${link}" class="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                <div class="h-32 bg-gray-200 overflow-hidden relative">
                    ${h.imageUrl ? 
                        `<img src="${h.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${h.title}">` :
                        `<div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500">
                            <i class="fas fa-newspaper text-3xl"></i>
                        </div>`
                    }
                    <span class="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">${categoryLabel}</span>
                </div>
                <div class="p-3">
                    <h3 class="font-bold text-sm line-clamp-2 group-hover:text-red-600 transition">${h.title}</h3>
                    <span class="text-xs text-gray-500 mt-1 block">${timeAgo}</span>
                </div>
            </a>
            `;
        }).join('');
        
        console.log('✓ Quick Headlines rendered:', headlines.length);
        
    } catch (err) {
        console.error('✗ Headlines error:', err);
        renderFallbackHeadlines(headlinesRow);
    }
}

function renderFallbackHeadlines(container) {
    const headlines = [
        { title: "Premier League Transfer Window: All the Major Moves", time: "2 hours ago", image: null },
        { title: "Champions League Draw: Tough Group for Canadian Sides", time: "4 hours ago", image: null },
        { title: "MLS Playoffs: Toronto FC's Road to the Final", time: "6 hours ago", image: null },
        { title: "Women's World Cup 2027: Expansion Plans Revealed", time: "8 hours ago", image: null },
        { title: "Canadian Premier League: New Stadium Announcement", time: "10 hours ago", image: null },
        { title: "Euro 2024: Underdog Stories and Dark Horses", time: "12 hours ago", image: null }
    ];
    
    container.innerHTML = headlines.map(h => `
        <a href="#" class="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
            <div class="h-32 bg-gray-200 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500">
                    <i class="fas fa-newspaper text-2xl"></i>
                </div>
            </div>
            <div class="p-3">
                <h3 class="font-bold text-sm line-clamp-2 group-hover:text-red-600 transition">${h.title}</h3>
                <span class="text-xs text-gray-500 mt-1 block">${h.time}</span>
            </div>
        </a>
    `).join('');
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}

// ==========================================================
// CANADIAN CORNER - COMPLETELY REWRITTEN
// ==========================================================
async function loadCanadianCorner() {
    try {
        console.log('🟢 Loading Canadian Corner...');
        
        // Get featured article (position "featured")
        const featuredQuery = `*[_type == "news" && distribution.canadianCorner == true && distribution.canadianCornerPosition == "featured"] | order(publishedAt desc) [0] {
            title,
            "imageUrl": mainImage.asset->url,
            excerpt,
            "slug": slug.current
        }`;
        
        // Get sidebar articles (positions sidebar-1, sidebar-2, sidebar-3)
        const sidebarQuery = `*[_type == "news" && distribution.canadianCorner == true && distribution.canadianCornerPosition != "featured"] | order(distribution.canadianCornerPosition asc, publishedAt desc) [0...3] {
            title,
            "slug": slug.current,
            publishedAt,
            excerpt
        }`;
        
        const [featuredResponse, sidebarResponse] = await Promise.all([
            fetch(getSanityUrl(featuredQuery)),
            fetch(getSanityUrl(sidebarQuery))
        ]);
        
        const featuredData = await featuredResponse.json();
        const sidebarData = await sidebarResponse.json();
        
        const featuredArticle = featuredData.result?.[0];
        const sidebarArticles = sidebarData.result || [];
        
        console.log('Featured article found:', featuredArticle ? featuredArticle.title : 'None');
        console.log('Sidebar articles found:', sidebarArticles.length);
        
        // If we have data from Sanity, update the page
        if (featuredArticle || sidebarArticles.length > 0) {
            updateCanadianCornerOnPage(featuredArticle, sidebarArticles);
        } else {
            console.log('No Canadian Corner articles found in Sanity, keeping placeholder');
        }
        
    } catch (err) {
        console.error('✗ Canadian Corner error:', err);
    }
}

function updateCanadianCornerOnPage(featuredArticle, sidebarArticles) {
    // Find the Canadian Corner section by looking for the h2 that contains "Canadian Corner"
    const sections = document.querySelectorAll('section');
    let canadianCornerSection = null;
    
    for (const section of sections) {
        const h2 = section.querySelector('h2');
        if (h2 && h2.innerText.includes('Canadian')) {
            canadianCornerSection = section;
            break;
        }
    }
    
    if (!canadianCornerSection) {
        console.log('Could not find Canadian Corner section on page');
        return;
    }
    
    // Find the grid inside this section
    const grid = canadianCornerSection.querySelector('.grid');
    if (!grid) {
        console.log('Could not find grid inside Canadian Corner section');
        return;
    }
    
    // Find the canadian-corner div (the featured article container)
    let cornerDiv = grid.querySelector('.canadian-corner');
    if (!cornerDiv) {
        console.log('Could not find .canadian-corner div');
        return;
    }
    
    // Find the sidebar container (div with class "space-y-4")
    let sidebarContainer = grid.querySelector('.space-y-4');
    if (!sidebarContainer) {
        console.log('Could not find sidebar container (.space-y-4)');
        return;
    }
    
    // Update featured article if it exists
    if (featuredArticle) {
        const featuredInnerDiv = cornerDiv.querySelector('.flex.flex-col.md\\:flex-row');
        if (featuredInnerDiv) {
            featuredInnerDiv.innerHTML = `
                <div class="md:w-1/2">
                    <div class="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                        ${featuredArticle.imageUrl ? 
                            `<img src="${featuredArticle.imageUrl}" class="w-full h-full object-cover" alt="${featuredArticle.title}">` :
                            `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">No Image</div>`
                        }
                    </div>
                </div>
                <div class="md:w-1/2 flex flex-col justify-center">
                    <span class="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase w-fit mb-3">Canadian Corner</span>
                    <h3 class="text-2xl font-bold mb-3 hover:text-red-600 cursor-pointer">${featuredArticle.title}</h3>
                    <p class="text-gray-700 mb-4">${featuredArticle.excerpt || ''}</p>
                    <a href="/news/article.html?slug=${featuredArticle.slug}" class="text-red-600 font-semibold hover:underline">Read Full Story →</a>
                </div>
            `;
            console.log('✅ Updated featured article:', featuredArticle.title);
        }
    }
    
    // Update sidebar if we have articles
    if (sidebarArticles && sidebarArticles.length > 0) {
        sidebarContainer.innerHTML = sidebarArticles.map(article => `
            <a href="/news/article.html?slug=${article.slug}" class="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition border-l-4 border-red-600">
                <h4 class="font-bold mb-2 hover:text-red-600">${article.title}</h4>
                <p class="text-gray-600 text-sm mb-2 line-clamp-2">${article.excerpt || ''}</p>
                <span class="text-xs text-gray-500">${getTimeAgo(article.publishedAt) || 'Recently'}</span>
            </a>
        `).join('');
        console.log('✅ Updated sidebar with', sidebarArticles.length, 'articles');
    }
}

// ==========================================================
// PRODUCTS FROM NETLIFY FUNCTION
// ==========================================================
async function getProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    try {
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
        const products = await response.json();

        if (products.length === 0) {
            list.innerHTML = '<p class="text-center col-span-4">No products found.</p>';
            return;
        }
        
        list.innerHTML = '';
        
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 shadow-lg rounded-lg border border-gray-200 flex flex-col';
            
            const sizeOptions = product.variants.map(variant => 
                `<option value="${variant.id}">${variant.size}</option>`
            ).join('');

            const initialPrice = product.price;

            card.innerHTML = `
                <div class="w-full h-64 bg-gray-100 flex items-center justify-center mb-4 relative overflow-hidden">
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover">
                </div>
                <h3 class="text-xl font-bold mb-2">${product.name}</h3>
                <div class="flex justify-between items-center mb-4">
                    <p id="price-display-${product.id}" class="text-gray-600 text-lg font-semibold">$${parseFloat(initialPrice).toFixed(2)}</p>
                    <select id="size-selector-${product.id}" class="border border-gray-300 rounded-md p-1 text-sm">
                        ${sizeOptions}
                    </select>
                </div>
                <div class="mt-auto">
                    <button class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Add to Cart</button>
                </div>
            `;

            const sizeSelector = card.querySelector(`#size-selector-${product.id}`);
            const priceDisplay = card.querySelector(`#price-display-${product.id}`);
            
            sizeSelector.addEventListener('change', () => {
                const selectedVariant = product.variants.find(v => v.id == sizeSelector.value);
                if (selectedVariant) {
                    priceDisplay.textContent = `$${parseFloat(selectedVariant.price).toFixed(2)}`;
                }
            });
            
            const addToCartButton = card.querySelector('button');
            addToCartButton.addEventListener('click', () => {
                const selectedVariantId = parseInt(sizeSelector.value);
                const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
                
                if (selectedVariant) {
                    addToCart(product.id, selectedVariant.id, product.name + ` - ${selectedVariant.size}`, selectedVariant.price, product.imageUrl);
                }
            });
            
            list.appendChild(card);
        });
    } catch (error) {
        console.error('Error in getProducts:', error); 
        list.innerHTML = '<p class="text-center col-span-4 text-gray-500">Products available on live site only.</p>';
    }
}

// ==========================================================
// PODCASTS FROM SANITY
// ==========================================================
async function loadPodcasts() {
    const list = document.getElementById('podcast-list');
    if (!list) return;
    
    try {
        const query = `*[_type == "podcast"] | order(_createdAt desc) {
            title,
            youtubeLink
        }`;
        
        const response = await fetch(getSanityUrl(query));
        const data = await response.json();
        const podcasts = data.result;
        
        console.log('Podcasts loaded:', podcasts);
        
        if (!podcasts || podcasts.length === 0) {
            list.innerHTML = '<p class="text-gray-400 text-center col-span-3">No episodes yet. Add some in Sanity!</p>';
            return;
        }
        
        list.innerHTML = podcasts.map(p => {
            let embed = p.youtubeLink || '';
            if (embed.includes('watch?v=')) {
                embed = embed.replace('watch?v=', 'embed/').split('&')[0];
            } else if (embed.includes('youtu.be/')) {
                const id = embed.split('youtu.be/')[1];
                embed = `https://www.youtube.com/embed/${id}`;
            }
            
            return `
                <div class="bg-gray-900 rounded-lg overflow-hidden">
                    <div class="h-48 bg-gray-800">
                        <iframe src="${embed}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div class="p-6">
                        <h3 class="font-bold text-xl mb-2">${p.title || 'Untitled Episode'}</h3>
                        <a href="${p.youtubeLink}" target="_blank" class="text-red-500 hover:text-red-400 text-sm">Watch on YouTube →</a>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✓ Podcasts rendered:', podcasts.length);
        
    } catch (err) {
        console.error('✗ Podcasts error:', err);
        list.innerHTML = '<p class="text-red-500 text-center col-span-3">Error loading podcasts</p>';
    }
}

// ==========================================================
// NEWS PAGE LOGIC (with pagination)
// ==========================================================
async function loadNewsPage() {
    const featuredContainer = document.getElementById('featured-news');
    const gridContainer = document.getElementById('news-grid');
    if (!featuredContainer || !gridContainer) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    const category = urlParams.get('category') || 'all';
    const perPage = 20;
    const start = (page - 1) * perPage;
    
    try {
        let categoryFilter = category !== 'all' ? `&& category == "${category}"` : '';
        const query = `*[_type == "news" ${categoryFilter}] | order(publishedAt desc) [${start}...${start + perPage}] {
            title,
            "slug": slug.current,
            "imageUrl": mainImage.asset->url,
            excerpt,
            category,
            publishedAt,
            "author": author->name
        }`;
        
        const countQuery = `count(*[_type == "news" ${categoryFilter}])`;
        
        const [articlesResponse, countResponse] = await Promise.all([
            fetch(getSanityUrl(query)),
            fetch(getSanityUrl(countQuery))
        ]);
        
        const articles = (await articlesResponse.json()).result;
        const totalCount = (await countResponse.json()).result;
        
        if (!articles || articles.length === 0) {
            gridContainer.innerHTML = '<p class="col-span-3 text-center text-gray-500">No articles found.</p>';
            return;
        }
        
        const featured = articles[0];
        featuredContainer.innerHTML = `
            <div class="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-lg">
                <div class="md:w-1/2 h-64 md:h-auto">
                    ${featured.imageUrl ? 
                        `<img src="${featured.imageUrl}" class="w-full h-full object-cover" alt="">` :
                        `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">No Image</div>`
                    }
                </div>
                <div class="md:w-1/2 p-8 flex flex-col justify-center">
                    <span class="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase w-fit mb-3">${featured.category || 'News'}</span>
                    <h2 class="text-3xl font-bold mb-4 hover:text-red-600 cursor-pointer">${featured.title}</h2>
                    <p class="text-gray-600 mb-4">${featured.excerpt || ''}</p>
                    <div class="flex items-center text-sm text-gray-500 mb-4">
                        <span>${featured.author || 'Staff'}</span>
                        <span class="mx-2">•</span>
                        <span>${getTimeAgo(featured.publishedAt)}</span>
                    </div>
                    <a href="article.html?slug=${featured.slug}" class="text-red-600 font-semibold hover:underline">Read Full Story →</a>
                </div>
            </div>
        `;
        
        const gridArticles = articles.slice(1);
        gridContainer.innerHTML = gridArticles.map(article => `
            <a href="article.html?slug=${article.slug}" class="article-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300 block">
                <div class="h-48 bg-gray-200 overflow-hidden">
                    ${article.imageUrl ? 
                        `<img src="${article.imageUrl}" class="w-full h-full object-cover hover:scale-105 transition duration-300" alt="">` :
                        `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500"><i class="fas fa-newspaper text-3xl"></i></div>`
                    }
                </div>
                <div class="p-6">
                    <span class="text-red-600 text-xs font-bold uppercase">${article.category || 'News'}</span>
                    <h3 class="font-bold text-lg mt-2 mb-2 hover:text-red-600 transition">${article.title}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2 mb-4">${article.excerpt || ''}</p>
                    <div class="flex items-center text-xs text-gray-500">
                        <span>${getTimeAgo(article.publishedAt)}</span>
                    </div>
                </div>
            </a>
        `).join('');
        
        renderPagination(page, totalCount, perPage, category);
        setupNewsFilters(category);
        
    } catch (err) {
        console.error('✗ News page error:', err);
        gridContainer.innerHTML = '<p class="col-span-3 text-center text-red-500">Error loading news.</p>';
    }
}

function renderPagination(currentPage, totalCount, perPage, currentCategory) {
    const totalPages = Math.ceil(totalCount / perPage);
    const container = document.getElementById('load-more')?.parentElement;
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="flex justify-center space-x-2 mt-8">';
    
    if (currentPage > 1) {
        html += `<a href="?page=${currentPage - 1}${currentCategory !== 'all' ? '&category=' + currentCategory : ''}" class="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100">← Prev</a>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span class="px-4 py-2 bg-red-600 text-white rounded-md">${i}</span>`;
        } else {
            html += `<a href="?page=${i}${currentCategory !== 'all' ? '&category=' + currentCategory : ''}" class="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100">${i}</a>`;
        }
    }
    
    if (currentPage < totalPages) {
        html += `<a href="?page=${currentPage + 1}${currentCategory !== 'all' ? '&category=' + currentCategory : ''}" class="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100">Next →</a>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function setupNewsFilters(currentCategory) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            window.location.href = `?category=${category}&page=1`;
        });
        
        if (btn.dataset.category === currentCategory) {
            btn.classList.add('bg-red-600', 'text-white');
            btn.classList.remove('bg-white', 'text-gray-700');
        }
    });
}

// ==========================================================
// ARTICLE PAGE LOGIC
// ==========================================================
async function loadArticlePage() {
    const container = document.getElementById('article-content');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        container.innerHTML = '<p class="text-center text-red-500">Article not found.</p>';
        return;
    }
    
    try {
        const query = `*[_type == "news" && slug.current == "${slug}"][0] {
            title,
            "imageUrl": mainImage.asset->url,
            content,
            category,
            publishedAt,
            "author": author->name,
            "authorImage": author->image.asset->url,
            tags
        }`;
        
        const response = await fetch(getSanityUrl(query));
        const article = (await response.json()).result;
        
        if (!article) {
            container.innerHTML = '<p class="text-center text-red-500">Article not found.</p>';
            return;
        }
        
        document.title = `${article.title} | 90 Minutes or More`;
        
        container.innerHTML = `
            <article class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
                ${article.imageUrl ? 
                    `<div class="h-64 md:h-96 w-full">
                        <img src="${article.imageUrl}" class="w-full h-full object-cover" alt="">
                    </div>` : ''
                }
                <div class="p-8 md:p-12">
                    <div class="flex items-center space-x-4 mb-6">
                        <span class="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase">${article.category || 'News'}</span>
                        <span class="text-gray-500">${getTimeAgo(article.publishedAt)}</span>
                    </div>
                    
                    <h1 class="font-anton text-4xl md:text-5xl uppercase mb-6">${article.title}</h1>
                    
                    <div class="flex items-center mb-8 pb-8 border-b border-gray-200">
                        ${article.authorImage ? 
                            `<img src="${article.authorImage}" class="w-12 h-12 rounded-full mr-4 object-cover" alt="">` :
                            `<div class="w-12 h-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center"><i class="fas fa-user text-gray-500"></i></div>`
                        }
                        <div>
                            <p class="font-bold">${article.author || 'Staff Writer'}</p>
                            <p class="text-sm text-gray-500">${new Date(article.publishedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div class="prose prose-lg max-w-none">
                        ${article.content ? renderPortableText(article.content) : '<p>No content available.</p>'}
                    </div>
                    
                    ${article.tags ? `
                    <div class="mt-8 pt-8 border-t border-gray-200">
                        <p class="text-sm text-gray-600 mb-2">Tags:</p>
                        <div class="flex flex-wrap gap-2">
                            ${article.tags.map(tag => `<span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">#${tag}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </article>
        `;
        
    } catch (err) {
        console.error('✗ Article page error:', err);
        container.innerHTML = '<p class="text-center text-red-500">Error loading article.</p>';
    }
}

function renderPortableText(blocks) {
    if (!blocks) return '';
    
    return blocks.map(block => {
        if (block._type === 'block') {
            const text = block.children?.map(child => child.text).join('') || '';
            if (block.style === 'h2') return `<h2 class="text-2xl font-bold mt-8 mb-4">${text}</h2>`;
            if (block.style === 'h3') return `<h3 class="text-xl font-bold mt-6 mb-3">${text}</h3>`;
            return `<p class="mb-4 leading-relaxed">${text}</p>`;
        }
        if (block._type === 'image') {
            return `<img src="${block.asset?.url || ''}" class="w-full rounded-lg my-6" alt="">`;
        }
        return '';
    }).join('');
}

// ==========================================================
// PODCAST PAGE LOGIC
// ==========================================================
async function loadPodcastPage() {
    const latestContainer = document.getElementById('latest-podcast');
    const allContainer = document.getElementById('all-podcasts');
    if (!latestContainer || !allContainer) return;
    
    try {
        const query = `*[_type == "podcast"] | order(_createdAt desc) {
            title,
            youtubeLink,
            description,
            publishedAt
        }`;
        
        const response = await fetch(getSanityUrl(query));
        const podcasts = (await response.json()).result;
        
        if (!podcasts || podcasts.length === 0) {
            latestContainer.innerHTML = '<p class="p-8 text-center text-gray-400">No episodes yet.</p>';
            allContainer.innerHTML = '';
            return;
        }
        
        const latest = podcasts[0];
        let embedUrl = latest.youtubeLink || '';
        if (embedUrl.includes('watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/').split('&')[0];
        } else if (embedUrl.includes('youtu.be/')) {
            const id = embedUrl.split('youtu.be/')[1];
            embedUrl = `https://www.youtube.com/embed/${id}`;
        }
        
        latestContainer.innerHTML = `
            <div class="flex flex-col lg:flex-row">
                <div class="lg:w-2/3 h-64 lg:h-96 bg-black">
                    <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="lg:w-1/3 p-8 flex flex-col justify-center bg-gray-800">
                    <span class="text-red-500 font-bold mb-2">LATEST EPISODE</span>
                    <h2 class="text-2xl font-bold mb-4">${latest.title}</h2>
                    <p class="text-gray-400 mb-6">${latest.description || ''}</p>
                    <a href="${latest.youtubeLink}" target="_blank" class="text-red-500 hover:text-red-400 font-semibold">Watch on YouTube →</a>
                </div>
            </div>
        `;
        
        const rest = podcasts.slice(1);
        allContainer.innerHTML = rest.map(p => {
            let embed = p.youtubeLink || '';
            if (embed.includes('watch?v=')) {
                embed = embed.replace('watch?v=', 'embed/').split('&')[0];
            } else if (embed.includes('youtu.be/')) {
                const id = embed.split('youtu.be/')[1];
                embed = `https://www.youtube.com/embed/${id}`;
            }
            
            return `
            <div class="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                <div class="h-48 bg-black">
                    <iframe src="${embed}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="p-6">
                    <h3 class="font-bold text-xl mb-2">${p.title}</h3>
                    <p class="text-gray-400 text-sm mb-4 line-clamp-2">${p.description || ''}</p>
                    <a href="${p.youtubeLink}" target="_blank" class="text-red-500 hover:text-red-400 text-sm font-semibold">Watch on YouTube →</a>
                </div>
            </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('✗ Podcast page error:', err);
    }
}

// ==========================================================
// CART FUNCTIONALITY
// ==========================================================
let cart = [];

function addToCart(productId, variantId, productName, productPrice, productImageUrl) {
    const existing = cart.find(item => item.variantId === variantId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ 
            id: productId, 
            variantId, 
            name: productName, 
            price: parseFloat(productPrice), 
            imageUrl: productImageUrl, 
            quantity: 1 
        });
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.classList.toggle('hidden', totalItems === 0);
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="flex justify-between items-center py-2 border-b">
                <div class="flex items-center">
                    <img src="${item.imageUrl}" class="w-16 h-16 object-cover mr-4 rounded">
                    <div>
                        <p class="font-semibold text-sm">${item.name}</p>
                        <p class="text-xs text-gray-600">${item.quantity} x $${item.price.toFixed(2)}</p>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.variantId})" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
            </div>
        `).join('');
    }
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (cartTotal) cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
}

function removeFromCart(variantId) {
    cart = cart.filter(item => item.variantId !== variantId);
    updateCartDisplay();
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.toggle('translate-x-full');
}

async function handleCheckout() {
    const btn = document.getElementById('sidebar-checkout-button');
    if (!btn || cart.length === 0) return;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    
    try {
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ cart }),
        });
        
        if (!response.ok) throw new Error('Checkout failed');
        
        const session = await response.json();
        window.location.href = session.url;
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Could not initiate checkout. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Proceed to Checkout';
    }
}

window.addToCart = addToCart;
window.handleCheckout = handleCheckout;
window.toggleCart = toggleCart;
window.removeFromCart = removeFromCart;

// ==========================================================
// MOBILE MENU
// ==========================================================
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
        btn.addEventListener('click', () => menu.classList.toggle('hidden'));
    }
}

// ==========================================================
// INITIALIZE BASED ON PAGE
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing...');
    initMobileMenu();
    
    const path = window.location.pathname;
    
    if (path.includes('/news/article.html')) {
        loadArticlePage();
    } else if (path.includes('/news/')) {
        loadNewsPage();
    } else if (path.includes('/podcast/')) {
        loadPodcastPage();
    } else {
        // Homepage
        loadHeroSlides();
        loadHeadlines();
        loadCanadianCorner();
        loadPodcasts();
        getProducts();
        startSlideTimer();
    }
});