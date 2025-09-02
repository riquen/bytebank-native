/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "inter-regular": ['Inter_400Regular'],
        "inter-bold": ['Inter_700Bold'],
      }
    },
  },
  plugins: [],
}