module.exports = {
  content: ['./src/**/*.{html,js,svelte}'],
  theme: {
    extend: {
      colors: {
        black: '#212121',
        green: '#6aaa64',
        'dark-green': '#538d4e',
        gray: '#86888a',
        'dark-gray': '#3a3a3c',
        yellow: '#c9b458',
        'dark-yellow': '#b59f3b'
      },
      keyframes: {
        shake: {
          '20%': { transform: 'translateX(-5%)' },
          '40%': { transform: 'translateX(5%)' },
          '60%': { transform: 'translateX(-10%)' },
          '80%': { transform: 'translateX(10%)' },
          '90%': { transform: 'translateX(-5%)' },
          '100%': { transform: 'translateX(0)' }
        },
        jump: {
          '20%': { transform: 'translateY(-50%)' },
          '40%': { transform: 'translateY(5%)' },
          '60%': { transform: 'translateY(-25%)' },
          '80%': { transform: 'translateY(2.5%)' },
          '90%': { transform: 'translateY(-5%)' },
          '100%': { transform: 'translateY(0)' }
        }
      },
      animation: {
        shake: 'shake 400ms ease-in-out',
        jump: 'jump 400ms ease-in-out'
      }
    }
  },
  plugins: []
};
