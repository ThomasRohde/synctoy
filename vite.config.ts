/// <reference types="vite/client" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Use '/synctoy/' for GitHub Pages, '/' for local development
const base = process.env.GITHUB_ACTIONS ? '/synctoy/' : '/';

export default defineConfig({
    base,
    server: {
        port: 5000,
        host: '0.0.0.0',
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
            devOptions: {
                enabled: false,
            },
            injectRegister: 'auto',
            workbox: {
                skipWaiting: true,
                clientsClaim: true,
                cleanupOutdatedCaches: true,
                navigateFallback: null,
            manifest: {
                name: 'Handoff Lite',
                short_name: 'Handoff',
                description: 'A minimal, cross-device inbox for URLs and text with cloud sync, device targeting, and optional end-to-end encryption.',
                theme_color: '#3b82f6',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'any',
                start_url: './',
                scope: './',
                icons: [
                    {
                        src: 'icon-192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: 'icon-192.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: 'icon-192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'maskable',
                    },
                    {
                        src: 'icon-192.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'maskable',
                    },
                ],
            },
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        // App shell - NetworkFirst for fresh content
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages-cache',
                            networkTimeoutSeconds: 3,
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24, // 1 day
                            },
                        },
                    },
                    {
                        // Static assets - NetworkFirst with longer fallback
                        urlPattern: /\.(?:js|css|woff2|svg)$/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'static-resources',
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                        },
                    },
                    {
                        // Google Fonts - CacheFirst (rarely changes)
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
