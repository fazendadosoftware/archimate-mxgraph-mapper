module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      scale: {
        '-1': '-1'
      },
      colors: {
        blue: {
          json: '#3883fa'
        }
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
