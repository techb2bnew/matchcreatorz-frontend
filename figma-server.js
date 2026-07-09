// MatchCreatorz — Figma Screenshot Server
// Run: node figma-server.js
// Keep this running while Figma plugin imports screens

const http = require('http');
const fs   = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'figma-export', 'screenshots');
const PORT = 8787;

const server = http.createServer((req, res) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }

  // Only serve .png files
  const filename = decodeURIComponent(req.url.slice(1));
  if (!filename.endsWith('.png')) {
    res.writeHead(400, headers);
    return res.end('Only PNG files allowed');
  }

  const filepath = path.join(SCREENSHOTS_DIR, filename);

  fs.stat(filepath, (err, stat) => {
    if (err || !stat || stat.isDirectory()) {
      res.writeHead(404, headers);
      return res.end('Not found: ' + filename);
    }
    res.writeHead(200, { ...headers, 'Content-Type': 'image/png' });
    fs.createReadStream(filepath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('\n✅  Screenshot server running!\n');
  console.log(`   http://localhost:${PORT}\n`);
  console.log('─'.repeat(45));
  console.log('📋  Ab Figma me:\n');
  console.log('  1. New design file kholo');
  console.log('  2. Main menu (☰) → Plugins → Development');
  console.log('     → Import plugin from manifest...');
  console.log('  3. Select: figma-export/figma-plugin/manifest.json');
  console.log('  4. Plugins → Development');
  console.log('     → MatchCreatorz Figma Import  (Run)');
  console.log('  5. Wait ~2 min for all screens\n');
  console.log('⚠️  Ye terminal band mat karna!');
  console.log('─'.repeat(45));
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} already in use.`);
    console.error('Run:  npx kill-port 8787  then try again.\n');
  } else {
    console.error('Server error:', e.message);
  }
  process.exit(1);
});
