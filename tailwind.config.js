/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          900: '#2D1B12', // Dark oak
          800: '#3E2723',
          700: '#5D4037', // Medium wood
          600: '#8D6E63',
          500: '#A1887F',
          400: '#BCAAA4',
          300: '#D7CCC8',
          200: '#EFEBE9',
          100: '#F5F5F5',
        },
        parchment: {
          900: '#D7C49E', // Aged paper
          800: '#E6D5B8',
          500: '#F5E6CA', // Light paper
          100: '#FFF8E1',
        },
        leather: {
          900: '#3E2723',
          700: '#5D4037',
          500: '#8D6E63', // Worn leather
          300: '#A1887F',
        },
        gold: {
          900: '#FF6F00',
          700: '#FF8F00',
          500: '#FFB300', // Coin gold
          300: '#FFCA28',
          100: '#FFECB3',
        },
        forest: {
          900: '#1b4d2e', // Warm deep green
          800: '#2e7d32',
          700: '#388e3c',
        },
        camp: {
          orange: '#e65100', // Deep burnt orange
          fire: '#ff5722',
        },
        night: {
           900: '#1a100c', // Very dark brown/black, warmer
           800: '#2c1e16',
        },
      },
      fontFamily: {
        sans: ['"Crimson Text"', 'serif'], // Default to serif for this vibe
        display: ['"Cinzel"', 'serif'],     // Headings
      },

      backgroundImage: {
        'wood-pattern': 'url("https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=2574&auto=format&fit=crop")',
        'leather-texture': 'url("https://www.transparenttextures.com/patterns/leather.png"), linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
        'paper-texture': 'url("https://www.transparenttextures.com/patterns/paper.png")',
      },
      boxShadow: {
        'vignette': 'inset 0 0 150px rgba(0,0,0,0.8)',
        'leather-stitch': 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5), 0 0 0 4px #3E2723, 0 0 0 6px #8D6E63',
        'cell-inset': 'inset 0 2px 4px rgba(0,0,0,0.3)',
      },
      letterSpacing: {
        'widest-xl': '0.3em',
      },
    },
  },
  plugins: [],
}
