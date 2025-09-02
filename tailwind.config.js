/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'inter-regular': ['Inter_400Regular'],
        'inter-bold': ['Inter_700Bold'],
      },
      colors: {
        background: '#E4EDE3',
        foreground: '#004D61',
        tomato: '#FF5031',
        rojo: '#E60026',
        'kelly-green': '#38B000',
        silver: '#CBCBCB',
        'battleship-gray': '#8B8B8B',
        azure: '#DEE9EA',
        'persian-green': '#2A9D8F',
        'sandy-brown': '#F4A261',
        charcoal: '#264653',
        'burnt-sienna': '#E76F51',
      },
    },
    plugins: [],
  },
}
