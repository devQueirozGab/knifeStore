module.exports = {
  content: ['./public/**/*.{html,js}'],
  theme: { extend: { fontFamily: { display: ['Bebas Neue', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'] } } },
  plugins: [require('daisyui')],
  daisyui: { themes: [{ tactical: { primary: '#f5f5f5', secondary: '#555b5d', accent: '#b6babb', neutral: '#101212', 'base-100': '#080909', info: '#b6babb' } }], darkTheme: 'tactical' }
};
