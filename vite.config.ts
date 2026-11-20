import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project subpath: set BASE_PATH=/sinara/ in CI. Native builds use relative './'.
export default defineConfig(({ mode }) => {
  const base = mode === 'native' ? './' : process.env.BASE_PATH || './';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        disable: mode === 'native',
        includeAssets: ['favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'brand/*.png'],
        manifest: {
          name: 'سِينارة | فنّ السؤال',
          short_name: 'سِينارة',
          description: 'منصة عراقية لتعلّم مهارات التعامل مع الذكاء الاصطناعي',
          lang: 'ar-IQ',
          dir: 'rtl',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#faf9f5',
          theme_color: '#023c3c',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'catalog/manifest.json'],
          // Collection chunks load on demand; visited ones stay available offline. The full download uses its own cache.
          runtimeCaching: [{ urlPattern: /\/catalog\/c\d+\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'sinara-catalog-runtime', expiration: { maxEntries: 20 } } }],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true
        }
      })
    ],
    build: { target: 'es2020', chunkSizeWarningLimit: 900 }
  };
});
