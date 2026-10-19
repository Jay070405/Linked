import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// /product/* and /for/* are served by product.html, a second entry without the 3D homepage.
// vercel.json rewrites them in production; this does the same for `vite` and `vite preview`.
const productPaths = /^\/(product|for)(\/[^.]*)?$/;
function productEntry() {
  const rewrite = (req, _res, next) => {
    const [pathname, query] = req.url.split('?');
    if (productPaths.test(pathname)) req.url = '/product.html' + (query ? '?' + query : '');
    // embedded prototypes in public/proto/*: a folder URL serves its index.html, as static hosts (Vercel) do
    else if (/^\/proto\/.+\/$/.test(pathname)) req.url = pathname + 'index.html' + (query ? '?' + query : '');
    next();
  };
  return {name: 'product-entry', configureServer(server) { server.middlewares.use(rewrite); }, configurePreviewServer(server) { server.middlewares.use(rewrite); }};
}

export default defineConfig({plugins:[react(),productEntry()],resolve:{alias:{'@':path.resolve('src')}},server:{host:'127.0.0.1',port:4316,strictPort:true},build:{rollupOptions:{input:{main:path.resolve('index.html'),product:path.resolve('product.html')}}}});
