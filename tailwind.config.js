/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0A0A0A',
                offwhite: '#F0EDE8',
                accent: '#E8A87C'
            },
            fontFamily: {
                heading: ['"Clash Display"', 'sans-serif'],
                drama: ['"Cormorant Garamond"', 'serif'],
                mono: ['"IBM Plex Mono"', 'monospace'],
                body: ['Satoshi', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
