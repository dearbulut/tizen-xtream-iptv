const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 54937;
const HOST = '0.0.0.0';

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    
    // Parse URL to get the file path
    let filePath = req.url;
    
    // Default to index.html if root path
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Get the full path to the file
    const fullPath = path.join(__dirname, filePath);
    
    // Get file extension
    const extname = path.extname(fullPath).toLowerCase();
    
    // Get content type based on file extension
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read the file
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                console.error(`File not found: ${fullPath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested resource was not found on this server.</p>');
            } else {
                // Server error
                console.error(`Server error: ${err.code}`);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p>');
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
    console.log(`Open http://localhost:${PORT}/ in your browser to view the application`);
});