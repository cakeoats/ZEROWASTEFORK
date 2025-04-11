const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    flowbite.content(),
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}"
  ],
  plugins: [
    require('flowbite/plugin'),
    // Tambahkan plugin lain jika diperlukan
  ],
  theme: {
    extend: {}, // Untuk kustomisasi tema
  }
}