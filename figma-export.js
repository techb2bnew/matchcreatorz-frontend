/**
 * MatchCreatorz — Figma Export Tool
 * Run: node figma-export.js
 * Requires: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const http      = require('http');

const BASE_URL        = 'http://localhost:3000';
const OUTPUT_DIR      = path.join(__dirname, 'figma-export');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const PLUGIN_DIR      = path.join(OUTPUT_DIR, 'figma-plugin');
const SERVER_PORT     = 8787;

// ── All pages to screenshot ────────────────────────────────────────────────
const PAGES = [
  // Auth
  { id: 'auth-login',           name: 'Login',           url: '/login',                 section: 'Auth'   },
  { id: 'auth-signup',          name: 'Sign Up',          url: '/signup',                section: 'Auth'   },
  { id: 'auth-forgot',          name: 'Forgot Password',  url: '/forgot-password',       section: 'Auth'   },
  { id: 'auth-otp',             name: 'Verify OTP',       url: '/verify-otp',            section: 'Auth'   },

  // Admin
  { id: 'admin-dashboard',      name: 'Dashboard',        url: '/admin/dashboard',       section: 'Admin'  },
  { id: 'admin-sellers',        name: 'Sellers',          url: '/admin/sellers',         section: 'Admin'  },
  { id: 'admin-buyers',         name: 'Buyers',           url: '/admin/buyers',          section: 'Admin'  },
  { id: 'admin-services',       name: 'Services',         url: '/admin/services',        section: 'Admin'  },
  { id: 'admin-bookings',       name: 'Bookings',         url: '/admin/bookings',        section: 'Admin'  },
  { id: 'admin-categories',     name: 'Categories',       url: '/admin/categories',      section: 'Admin'  },
  { id: 'admin-reviews',        name: 'Reviews',          url: '/admin/reviews',         section: 'Admin'  },
  { id: 'admin-wallet',         name: 'Wallet',           url: '/admin/wallet',          section: 'Admin'  },
  { id: 'admin-banners',        name: 'Banners',          url: '/admin/banners',         section: 'Admin'  },
  { id: 'admin-notifications',  name: 'Notifications',    url: '/admin/notifications',   section: 'Admin'  },
  { id: 'admin-support',        name: 'Support Chat',     url: '/admin/support',         section: 'Admin'  },
  { id: 'admin-settings',       name: 'Settings',         url: '/admin/settings',        section: 'Admin'  },
  { id: 'admin-profile',        name: 'Profile',          url: '/admin/profile',         section: 'Admin'  },

  // Seller
  { id: 'seller-dashboard',     name: 'Dashboard',        url: '/seller/dashboard',      section: 'Seller' },
  { id: 'seller-jobs',          name: 'Jobs',             url: '/seller/jobs',           section: 'Seller' },
  { id: 'seller-bookings',      name: 'Bookings',         url: '/seller/bookings',       section: 'Seller' },
  { id: 'seller-services',      name: 'Services',         url: '/seller/services',       section: 'Seller' },
  { id: 'seller-bids',          name: 'Bids',             url: '/seller/bids',           section: 'Seller' },
  { id: 'seller-offers',        name: 'Offers',           url: '/seller/offers',         section: 'Seller' },
  { id: 'seller-chat',          name: 'Chat',             url: '/seller/chat',           section: 'Seller' },
  { id: 'seller-wallet',        name: 'Wallet',           url: '/seller/wallet',         section: 'Seller' },
  { id: 'seller-connects',      name: 'Connects',         url: '/seller/connects',       section: 'Seller' },
  { id: 'seller-notifications', name: 'Notifications',    url: '/seller/notifications',  section: 'Seller' },
  { id: 'seller-settings',      name: 'Settings',         url: '/seller/settings',       section: 'Seller' },
  { id: 'seller-account',       name: 'Account',          url: '/seller/account',        section: 'Seller' },

  // Buyer
  { id: 'buyer-home',           name: 'Home',             url: '/buyer/home',            section: 'Buyer'  },
  { id: 'buyer-search',         name: 'Search',           url: '/buyer/search',          section: 'Buyer'  },
  { id: 'buyer-jobs',           name: 'Jobs',             url: '/buyer/jobs',            section: 'Buyer'  },
  { id: 'buyer-bookings',       name: 'Bookings',         url: '/buyer/bookings',        section: 'Buyer'  },
  { id: 'buyer-offers',         name: 'Offers',           url: '/buyer/offers',          section: 'Buyer'  },
  { id: 'buyer-favourites',     name: 'Favourites',       url: '/buyer/favourites',      section: 'Buyer'  },
  { id: 'buyer-chat',           name: 'Chat',             url: '/buyer/chat',            section: 'Buyer'  },
  { id: 'buyer-wallet',         name: 'Wallet',           url: '/buyer/wallet',          section: 'Buyer'  },
  { id: 'buyer-notifications',  name: 'Notifications',    url: '/buyer/notifications',   section: 'Buyer'  },
  { id: 'buyer-settings',       name: 'Settings',         url: '/buyer/settings',        section: 'Buyer'  },
  { id: 'buyer-account',        name: 'Account',          url: '/buyer/account',         section: 'Buyer'  },
];

// ── Step 1: Take screenshots ───────────────────────────────────────────────
async function takeScreenshots() {
  console.log('📸  Taking screenshots...\n');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page    = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let ok = 0, fail = 0;
  for (const p of PAGES) {
    try {
      await page.goto(BASE_URL + p.url, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 500)); // wait for animations
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${p.id}.png`) });
      console.log(`  ✓  [${p.section.padEnd(6)}] ${p.name}`);
      ok++;
    } catch (e) {
      console.log(`  ✗  [${p.section.padEnd(6)}] ${p.name}  (${e.message.split('\n')[0]})`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\n  Done — ${ok} ok, ${fail} failed\n`);
}

// ── Step 2: Generate Figma plugin ─────────────────────────────────────────
function generatePlugin() {
  const manifest = {
    name:        'MatchCreatorz Figma Import',
    id:          'matchcreatorz-figma-import-2024',
    api:         '1.0.0',
    main:        'code.js',
    editorType:  ['figma'],
    networkAccess: {
      allowedDomains: [`http://localhost:${SERVER_PORT}`],
      reasoning:      'Fetches local screenshots from the export server',
    },
  };

  const pluginCode = `
// MatchCreatorz Figma Plugin — auto-generated by figma-export.js
// Do NOT edit manually.

const SERVER   = 'http://localhost:${SERVER_PORT}';
const FRAME_W  = 1440;
const FRAME_H  = 900;
const COL_GAP  = 100;
const ROW_GAP  = 140;
const COLS     = 3;

const PAGES = ${JSON.stringify(PAGES, null, 2)};

const COLOR_TOKENS = [
  { name: 'Primary',         hex: '#e84545', r: 0.910, g: 0.271, b: 0.271 },
  { name: 'Page BG',         hex: '#efefef', r: 0.937, g: 0.937, b: 0.937 },
  { name: 'Border',          hex: '#e8e8e8', r: 0.910, g: 0.910, b: 0.910 },
  { name: 'White',           hex: '#ffffff', r: 1.000, g: 1.000, b: 1.000 },
  { name: 'Text Dark',       hex: '#1a1a1a', r: 0.102, g: 0.102, b: 0.102 },
  { name: 'Text Gray',       hex: '#6b7280', r: 0.420, g: 0.447, b: 0.502 },
  { name: 'Text Light',      hex: '#9ca3af', r: 0.612, g: 0.639, b: 0.686 },
  { name: 'Success Green',   hex: '#22c55e', r: 0.133, g: 0.773, b: 0.369 },
  { name: 'Warning Yellow',  hex: '#f59e0b', r: 0.961, g: 0.620, b: 0.043 },
  { name: 'Danger Red',      hex: '#ef4444', r: 0.937, g: 0.267, b: 0.267 },
  { name: 'Info Blue',       hex: '#3b82f6', r: 0.231, g: 0.510, b: 0.965 },
  { name: 'Sidebar Dark',    hex: '#1a1a2e', r: 0.102, g: 0.102, b: 0.180 },
];

async function fetchImage(filename) {
  const res = await fetch(SERVER + '/' + filename);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function makeText(parent, txt, size, bold, color, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.characters = txt;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }];
  t.x = x; t.y = y;
  parent.appendChild(t);
  return t;
}

(async () => {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const RED  = { r: 0.910, g: 0.271, b: 0.271 };
  const DARK = { r: 0.102, g: 0.102, b: 0.102 };
  const GRAY = { r: 0.500, g: 0.500, b: 0.500 };
  const BG   = { r: 0.937, g: 0.937, b: 0.937 };

  // ── Group by section ────────────────────────────────────────────────────
  const sections = {};
  for (const p of PAGES) {
    if (!sections[p.section]) sections[p.section] = [];
    sections[p.section].push(p);
  }

  const sectionOrder = ['Auth', 'Admin', 'Seller', 'Buyer'];

  for (let si = 0; si < sectionOrder.length; si++) {
    const sName  = sectionOrder[si];
    const sPages = sections[sName] || [];
    if (!sPages.length) continue;

    // Create / rename Figma page
    let figmaPage;
    if (si === 0) {
      figmaPage = figma.currentPage;
      figmaPage.name = sName + ' — MatchCreatorz';
    } else {
      figmaPage = figma.createPage();
      figmaPage.name = sName + ' — MatchCreatorz';
    }
    figma.currentPage = figmaPage;

    // Section heading
    await makeText(figmaPage, sName + '  Screens', 48, true, RED, 0, -100);
    await makeText(figmaPage, sPages.length + ' screens', 20, false, GRAY, 0, -44);

    // Frames
    for (let i = 0; i < sPages.length; i++) {
      const p   = sPages[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const fx  = col * (FRAME_W + COL_GAP);
      const fy  = row * (FRAME_H + ROW_GAP);

      // Outer frame
      const frame = figma.createFrame();
      frame.name   = p.name;
      frame.resize(FRAME_W, FRAME_H);
      frame.x      = fx;
      frame.y      = fy;
      frame.fills  = [{ type: 'SOLID', color: BG }];
      frame.cornerRadius = 12;
      frame.clipsContent = true;
      figmaPage.appendChild(frame);

      // Try to load screenshot
      try {
        const bytes   = await fetchImage(p.id + '.png');
        const imgHash = figma.createImage(bytes).hash;
        frame.fills   = [{ type: 'IMAGE', imageHash: imgHash, scaleMode: 'FILL' }];
      } catch (err) {
        // Fallback placeholder
        const ph = figma.createRectangle();
        ph.resize(FRAME_W, FRAME_H);
        ph.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
        frame.appendChild(ph);
        await makeText(frame, sName + ' / ' + p.name, 28, true, GRAY, 60, FRAME_H / 2 - 20);
      }

      // Label below frame
      await makeText(figmaPage, p.name, 18, true, DARK, fx, fy + FRAME_H + 16);
      await makeText(figmaPage, sName, 13, false, GRAY, fx, fy + FRAME_H + 42);
    }
  }

  // ── Design Tokens Page ─────────────────────────────────────────────────
  const tokensPage = figma.createPage();
  tokensPage.name  = '🎨 Design Tokens';
  figma.currentPage = tokensPage;

  await makeText(tokensPage, 'MatchCreatorz Design Tokens', 56, true, RED, 0, 0);
  await makeText(tokensPage, 'Colors, Typography & Spacing', 22, false, GRAY, 0, 72);

  // Color swatches
  await makeText(tokensPage, 'Color Palette', 30, true, DARK, 0, 140);

  const SWATCH_W = 180, SWATCH_H = 110, SWATCH_GAP = 24;
  for (let i = 0; i < COLOR_TOKENS.length; i++) {
    const c  = COLOR_TOKENS[i];
    const cx = (i % 5) * (SWATCH_W + SWATCH_GAP);
    const cy = 190 + Math.floor(i / 5) * (SWATCH_H + 64);

    const rect = figma.createRectangle();
    rect.resize(SWATCH_W, SWATCH_H);
    rect.x = cx; rect.y = cy;
    rect.fills   = [{ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }];
    rect.cornerRadius = 14;
    rect.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    rect.strokeWeight = 1;
    tokensPage.appendChild(rect);

    await makeText(tokensPage, c.name, 13, true, DARK, cx, cy + SWATCH_H + 10);
    await makeText(tokensPage, c.hex,  12, false, GRAY, cx, cy + SWATCH_H + 28);
  }

  // Typography section
  const typoY = 620;
  await makeText(tokensPage, 'Typography', 30, true, DARK, 0, typoY);

  const typoSamples = [
    { label: 'H1 — Page Title',    size: 36, bold: true  },
    { label: 'H2 — Section Title', size: 28, bold: true  },
    { label: 'H3 — Card Title',    size: 20, bold: true  },
    { label: 'Body — Regular',     size: 16, bold: false },
    { label: 'Small — Label',      size: 13, bold: false },
    { label: 'XS — Caption',       size: 11, bold: false },
  ];

  for (let i = 0; i < typoSamples.length; i++) {
    const t = typoSamples[i];
    await makeText(tokensPage, t.label, t.size, t.bold, DARK, 0, typoY + 60 + i * (t.size + 28));
    await makeText(tokensPage, 'Inter ' + (t.bold ? 'Bold' : 'Regular') + ' · ' + t.size + 'px', 12, false, GRAY, 500, typoY + 66 + i * (t.size + 28));
  }

  figma.notify('✅ MatchCreatorz imported! ' + PAGES.length + ' screens created.', { timeout: 4000 });
  figma.closePlugin();
})();
`;

  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
  fs.writeFileSync(path.join(PLUGIN_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(PLUGIN_DIR, 'code.js'), pluginCode.trim());
  console.log('🔌  Figma plugin generated → figma-export/figma-plugin/\n');
}

// ── Step 3: Serve screenshots ──────────────────────────────────────────────
function startServer() {
  const server = http.createServer((req, res) => {
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      return res.end();
    }
    const file = path.join(SCREENSHOTS_DIR, decodeURIComponent(req.url.slice(1)));
    try {
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        res.writeHead(403, headers);
        return res.end('Directory listing not allowed');
      }
      res.writeHead(200, { ...headers, 'Content-Type': 'image/png' });
      fs.createReadStream(file).pipe(res);
    } catch (e) {
      res.writeHead(404, headers);
      res.end('Not found: ' + req.url);
    }
  });
  server.listen(SERVER_PORT, () => {
    console.log(`📡  Screenshot server → http://localhost:${SERVER_PORT}\n`);
  });
  return server;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  MatchCreatorz — Figma Export\n' + '─'.repeat(50) + '\n');

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  await takeScreenshots();
  generatePlugin();
  startServer();

  console.log('─'.repeat(50));
  console.log('📋  NEXT STEPS IN FIGMA:\n');
  console.log('  1.  Open Figma (web or desktop)');
  console.log('  2.  Create a NEW empty Figma file');
  console.log('  3.  Menu → Plugins → Development');
  console.log('       → "Import plugin from manifest..."');
  console.log('  4.  Select:  figma-export/figma-plugin/manifest.json');
  console.log('  5.  Run it:  Plugins → Development');
  console.log('       → "MatchCreatorz Figma Import"');
  console.log('  6.  Wait ~1–2 min for all screens to load');
  console.log('  7.  Press Ctrl+C here when done\n');
  console.log('⚠️   Keep this terminal OPEN while plugin runs!');
  console.log('─'.repeat(50) + '\n');
}

main().catch(err => {
  console.error('\n❌  Error:', err.message);
  console.error('\nMake sure puppeteer is installed:');
  console.error('  npm install puppeteer\n');
  process.exit(1);
});
