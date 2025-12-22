/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './*.{ts,tsx}',
        './modules/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './context/**/*.{ts,tsx}',
        './utils/**/*.{ts,tsx}',
        './hooks/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                'primary-dark': '#2563eb',
                'background-light': '#f8fafc',
                'background-dark': '#0f172a',
                work: '#f59e0b',
                private: '#8b5cf6',
                any: '#6b7280',
            },
            fontFamily: {
                display: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.2s ease-out',
                'pop-in': 'popIn 0.15s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
};
