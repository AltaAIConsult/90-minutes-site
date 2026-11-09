/** @type {import('tailwindcss').Config} */
module.exports = {
  // Every file that contains Tailwind class names, including HTML strings built in JS.
  content: [
    './*.html',
    './{about,article,contact,news,official-coverage,podcast,privacy,services,shop,stadium-zone,stats,terms,world-cup-predictor}/**/*.html',
    './main.js',
    './netlify/functions/**/*.{js,mjs}',
  ],
  theme: { extend: {} },
  plugins: [],
};
