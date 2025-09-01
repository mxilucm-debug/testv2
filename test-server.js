const http = require('http');
const port = 3000;
const host = '127.0.0.1';

const server = http.createServer((req, res) => {
  console.log('test-server incoming', req.method, req.url);
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok');
});

server.listen(port, host, () => {
  console.log(`test-server listening on http://${host}:${port} pid=${process.pid}`);
});

server.on('error', (e) => console.error('test-server error', e));
