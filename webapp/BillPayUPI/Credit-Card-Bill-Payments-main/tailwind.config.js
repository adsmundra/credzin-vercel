/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
       colors: {
         // You can add custom colors here if needed
         // Example:
         // 'brand-purple': '#6d28d9',
       },
       fontFamily: {
         // Add custom fonts if you have them configured
         // sans: ['Inter', 'sans-serif'], 
       },
    },
  },
  plugins: [],
};
