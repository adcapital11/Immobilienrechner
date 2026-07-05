const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Proper MIME-Types for PWA, SVG and assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Routing for SPA
  let filePath = req.url === '/' || req.url === '' ? 'index.html' : req.url.substring(1);
  
  // Remove URL query parameters or hashes
  filePath = filePath.split('?')[0].split('#')[0];
  const absolutePath = path.resolve(__dirname, filePath);

  // Security check: Prevent directory traversal
  if (!absolutePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  fs.readFile(absolutePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('File Not Found');
      } else {
        res.statusCode = 500;
        res.end('Internal Server Error: ' + err.code);
      }
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Prevent service worker from being cached
    if (filePath === 'sw.js') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
