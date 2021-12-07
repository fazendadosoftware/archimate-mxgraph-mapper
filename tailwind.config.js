module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      scale: {
        '-1': '-1'
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ['even']
    },
  },
  plugins: [],
}
