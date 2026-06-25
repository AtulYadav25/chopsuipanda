/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#49a5fa',
        'custom-light-blue': '#5dacf5',
        'custom-hover-blue': '#3c90e8',
        'main-color': '#1c51e6',
      },
      fontFamily: {
        kungfu: ['kungfu', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        kungfu3D: ['kungfu3D', 'sans-serif'],
        Game: ['Game', 'cursive'],
      },
    },
  },
  plugins: [],
};