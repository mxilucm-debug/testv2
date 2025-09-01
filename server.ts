// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
// For debugging on Windows, explicitly bind to loopback
const hostname = '127.0.0.1';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
  console.log('Starting custom server, pid=', process.pid);
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Debug: log incoming root and socket requests only
      if (req.url === '/' || req.url?.startsWith('/api/socketio')) {
        console.log('Incoming request:', req.method, req.url);
      }

      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

  // Start the server bound to explicit loopback for debugging
  console.log(`Attempting to bind to ${hostname}:${currentPort}`);
  server.listen(currentPort, hostname, () => {
      const address = server.address();
      let host: string = 'localhost';
      let port: number = currentPort;
      try {
        if (address && typeof address === 'object') {
          host = address.address === '::' || address.address === '0.0.0.0' ? 'localhost' : address.address;
          port = address.port ?? currentPort;
        }
      } catch (e) {
        // ignore and use defaults
      }

      console.log(`> Ready on http://${host}:${port}`);
      console.log(`> Socket.IO server running at ws://${host}:${port}/api/socketio`);
    });

    server.on('listening', () => {
      console.log('Server event: listening, pid=', process.pid);
    });

    server.on('error', (err) => {
      console.error('HTTP server error:', err);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
