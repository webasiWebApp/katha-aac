// WEB PREVIEW ONLY. Serves the Expo web dev server (port 8081) on port 8082 with the
// cross-origin isolation headers that expo-sqlite's synchronous web API needs
// (SharedArrayBuffer). Expo's dev server adds them to bundles but not to the HTML page.
// Run: npm run web:preview  then open http://localhost:8082
const http = require('http');

const TARGET_PORT = Number(process.env.EXPO_PORT ?? 8081);
const PORT = Number(process.env.PREVIEW_PORT ?? 8082);

http
  .createServer((req, res) => {
    const upstream = http.request(
      { host: 'localhost', port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers },
      (up) => {
        const headers = { ...up.headers };
        headers['cross-origin-embedder-policy'] = 'credentialless';
        headers['cross-origin-opener-policy'] = 'same-origin';
        res.writeHead(up.statusCode ?? 502, headers);
        up.pipe(res);
      },
    );
    upstream.on('error', (e) => {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end(`Expo web server not reachable on port ${TARGET_PORT}: ${e.message}`);
    });
    req.pipe(upstream);
  })
  .listen(PORT, () => console.log(`Web preview on http://localhost:${PORT} (proxying ${TARGET_PORT})`));
