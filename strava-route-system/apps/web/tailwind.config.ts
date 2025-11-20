import type { Config } from 'tailwindcss'

const config = {
    content: [
        './pages/**/*.{js,ts,tsx}',
        './components/**/*.{js,ts,tsx}',
        './app/**/*.{js,ts,tsx}',
        './src/**/*.{js,ts,tsx}'
    ],
    theme: {
        padding: {},
        margin: {},
        width: {},
        height: {},
        colors: {
            black: 'rgba(0,0,0, <alpha-value>)',
            white: 'white',
            primary: 'rgba(var(--tw-primary) , <alpha-value>)',
            secondary: 'rgba(var(--tw-secondary) , <alpha-value>)',
            info: 'rgba(var(--tw-info) , <alpha-value>)'
        },
        boxShadow: {},
        blur: {},
        filter: {},
        'backdrop-filter': {},
        textAlign: {},
        flexShrink: {},
        flex: {},
        flexDirection: {},
        flexWrap: {},
        borderRadius: {},

        extend: {
            screens: {
                lg: '992px',
                xl: '1200px',
                '2xl': '1600px'
            }
        }
    },
    plugins: []
} satisfies Config

export default config
