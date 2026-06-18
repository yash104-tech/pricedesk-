const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

function startServer(serverPort) {
  const server = http.createServer((req, res) => {
    // Strip query strings or hashes
    const cleanUrl = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          // If file not found, serve index.html for SPA router fallback
          fs.readFile(path.join(__dirname, 'index.html'), (err, indexContent) => {
            if (err) {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end('<h1>File Not Found</h1>', 'utf-8');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}\n`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${serverPort} is in use, trying ${serverPort + 1}...`);
      startServer(serverPort + 1);
    } else {
      console.error(e);
    }
  });

  server.listen(serverPort, () => {
    console.log('==========================================================');
    console.log(`PriceDesk Offline Prototype Server is Running!`);
    console.log(`Address: http://localhost:${serverPort}/`);
    console.log(`Close this window to stop the server.`);
    console.log('==========================================================');
    
    // Auto open browser
    const url = `http://localhost:${serverPort}/`;
    const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${start} ${url}`);
  });
}

startServer(port);
