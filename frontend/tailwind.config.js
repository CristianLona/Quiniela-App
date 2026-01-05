/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'pool-dark': '#0f172a',
                'pool-darker': '#020617',
                'pool-green': '#22c55e',
                'pool-green-dark': '#15803d',
                'pool-accent': '#fbbf24', // Amber-400
                'pool-light': '#f8fafc',
                'pool-gray': '#334155',
            }
        },
    },
    plugins: [],
}
