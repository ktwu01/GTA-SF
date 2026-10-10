import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: { host: '127.0.0.1', port: 4176, strictPort: true, open: false,
    fs: { deny: ['**/.env', '**/.env.*', '**/*.{crt,pem}', '**/.git/**', '**/local-only/**'] },
    watch: { ignored: ['**/public/city/**', '**/artifacts/**', '**/data/**', '**/output/**', '**/.venv/**'] },
  },
  publicDir: false,
  plugins: [{ name: 'historical-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url?.startsWith('/?')) {
          res.statusCode = 302;
          res.setHeader('Location', '/historical.html' + (req.url.slice(1) || ''));
          res.end();
          return;
        }
        next();
      });
      server.middlewares.use('/historical-sf', async (req, res, next) => {
        const { createReadStream, statSync } = await import('node:fs');
        const file = resolve('public/historical-sf', '.' + decodeURIComponent((req.url || '/').split('?')[0]));
        if (!file.startsWith(resolve('public/historical-sf') + '/')) return next();
        try {
          const stat = statSync(file);
          if (!stat.isFile()) return next();
          res.setHeader('Content-Type', file.endsWith('.jpg') ? 'image/jpeg' : file.endsWith('.png') ? 'image/png' : file.endsWith('.mp4') ? 'video/mp4' : file.endsWith('.mp3') ? 'audio/mpeg' : file.endsWith('.ttf') ? 'font/ttf' : file.endsWith('.txt') ? 'text/plain' : 'application/json');
          res.setHeader('Content-Length', stat.size);
          createReadStream(file).pipe(res);
        } catch { next(); }
      });
    },
    async closeBundle() {
      const { cp, copyFile } = await import('node:fs/promises');
      await cp('public/historical-sf', 'dist-historical/historical-sf', { recursive: true });
      await copyFile('dist-historical/historical.html', 'dist-historical/index.html');
    },
  }],
  build: { outDir: 'dist-historical', emptyOutDir: true,
    rollupOptions: { input: resolve('historical.html') }, chunkSizeWarningLimit: 1600 },
});
