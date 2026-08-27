/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 이제 Tailwind에서 bg-main, text-primary 같은 클래스를 사용할 수 있습니다!
        mainBg: 'var(--bg-main)',
        cardBg: 'var(--bg-card)',
        mainText: 'var(--text-main)',
        mutedText: 'var(--text-muted)',
        primary: 'var(--color-primary)',
        subcolor: 'var(--color-sub)',
      },
    },
  },
  plugins: [],
};
