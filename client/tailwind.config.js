/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        origami: {
          paper: '#FEFEFE',
          cream: '#FFF8F0',
          peach: '#FFE5D9',
          coral: '#FFB4A2',
          sage: '#C8D5B9',
          mint: '#B8E0D2',
          lavender: '#D6E2E9',
          sky: '#B8D4E3',
          rose: '#F4C2C2',
          sand: '#F5E6D3',
          ocean: '#A8D4E2',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        display: ['Heebo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'origami': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.02)',
        'origami-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)',
        'origami-fold': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'origami': '12px',
        'origami-lg': '16px',
      },
      spacing: {
        // גדלים אחידים לכפתורים וכרטיסים
        'button-sm': '0.375rem 0.75rem',   // px-3 py-1.5
        'button-md': '1rem 1.5rem',        // px-4 py-2
        'button-lg': '1.5rem 2rem',        // px-6 py-3
        'card': '1.5rem',                  // p-6
        'section': '1.5rem',                // gap-6
      },
      backgroundImage: {
        'origami-gradient': 'linear-gradient(135deg, #FFF8F0 0%, #FEFEFE 100%)',
        'origami-gradient-soft': 'linear-gradient(135deg, #FFE5D9 0%, #FFF8F0 50%, #B8E0D2 100%)',
      },
      // Mobile-specific utilities
      touchAction: {
        'manipulation': 'manipulation',
      },
      // Safe area insets for mobile devices
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Touch-friendly sizes
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
  // RTL Support
  corePlugins: {
    preflight: true,
  },
}
