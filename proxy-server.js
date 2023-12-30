// proxy-server.js
const express = require('express');
const httpProxy = require('http-proxy');
const cors = require('cors');

const app = express();
const apiProxy = httpProxy.createProxyServer();

// Enable CORS for all routes
app.use(cors());

// Proxy route for Swiggy API
app.get('/swiggy-api/*', (req, res) => {
  apiProxy.web(req, res, { target: 'https://www.swiggy.com' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
