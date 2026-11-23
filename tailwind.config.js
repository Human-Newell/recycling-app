/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				// SF Pro on Apple devices; Inter is the self-hosted stand-in elsewhere.
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'SF Pro Text',
					'Inter',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'sans-serif',
				],
				rounded: [
					'ui-rounded',
					'-apple-system',
					'BlinkMacSystemFont',
					'SF Pro Rounded',
					'Inter',
					'sans-serif',
				],
			},
			colors: {
				border: 'rgb(var(--border) / <alpha-value>)',
				input: 'rgb(var(--input) / <alpha-value>)',
				ring: 'rgb(var(--ring) / <alpha-value>)',
				background: 'rgb(var(--background) / <alpha-value>)',
				foreground: 'rgb(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
					foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
					foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
					foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
				},
				destructive: {
					DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
					foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
				},
				muted: {
					DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
					foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
				},
				popover: {
					DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
					foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
				},
				card: {
					DEFAULT: 'rgb(var(--card) / <alpha-value>)',
					foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
				},
				// Brand system — the single iOS tint, themed light/dark via tokens.
				brand: {
					DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
					foreground: 'rgb(var(--brand-foreground) / <alpha-value>)',
					strong: 'rgb(var(--brand-strong) / <alpha-value>)',
					soft: 'var(--brand-soft)',
					tint: 'var(--brand-tint)',
				},
				'hero-muted': 'var(--hero-muted)',
				streak: 'rgb(var(--streak) / <alpha-value>)',
				info: {
					DEFAULT: 'rgb(var(--info) / <alpha-value>)',
					soft: 'var(--info-soft)',
				},
				'card-edge': 'var(--card-edge)',
			},
			boxShadow: {
				card: 'var(--shadow-card)',
				float: 'var(--shadow-float)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 4px)',
				sm: 'calc(var(--radius) - 8px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
