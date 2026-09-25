/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: '#12312A',      // xanh mạch PCB đậm
        boardline: '#2F5D4E',  // đường mạch
        copper: '#C7784F',     // màu đồng hàn
        panel: '#F6F3EC',      // nền sáng, giấy kỹ thuật
        ink: '#1C1B18',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
