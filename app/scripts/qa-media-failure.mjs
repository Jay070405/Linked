// Local QA only: same application, with failed video responses on port 4317.
// Run from the V16 directory; Ctrl+C ends the disposable server.
import { createServer } from 'vite';
const server = await createServer({
  server: { host: '127.0.0.1', port: 4317, strictPort: true },
  plugins: [{ name: 'qa-video-failure', configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (/\.mp4(?:\?|$)/.test(request.url || '')) {
        response.writeHead(503, { 'Content-Type': 'text/plain' });
        response.end('Intentional video failure for local QA.');
      } else next();
    });
  } }],
});
await server.listen();
console.log('Media failure QA: http://127.0.0.1:4317/');
