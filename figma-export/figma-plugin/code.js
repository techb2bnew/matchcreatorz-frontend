// MatchCreatorz Figma Plugin — 3 pages (Free plan compatible)

const SERVER  = 'http://localhost:8787';
const FRAME_W = 1440;
const FRAME_H = 900;
const COL_GAP = 100;
const ROW_GAP = 140;
const COLS    = 3;

// ── Page 1: Auth + Admin ──────────────────────────────────────────
const AUTH_ADMIN = [
  { id: 'auth-login',           name: 'Login',           section: 'Auth'  },
  { id: 'auth-signup',          name: 'Sign Up',          section: 'Auth'  },
  { id: 'auth-forgot',          name: 'Forgot Password',  section: 'Auth'  },
  { id: 'auth-otp',             name: 'Verify OTP',       section: 'Auth'  },
  { id: 'admin-dashboard',      name: 'Dashboard',        section: 'Admin' },
  { id: 'admin-sellers',        name: 'Sellers',          section: 'Admin' },
  { id: 'admin-buyers',         name: 'Buyers',           section: 'Admin' },
  { id: 'admin-services',       name: 'Services',         section: 'Admin' },
  { id: 'admin-bookings',       name: 'Bookings',         section: 'Admin' },
  { id: 'admin-categories',     name: 'Categories',       section: 'Admin' },
  { id: 'admin-reviews',        name: 'Reviews',          section: 'Admin' },
  { id: 'admin-wallet',         name: 'Wallet',           section: 'Admin' },
  { id: 'admin-banners',        name: 'Banners',          section: 'Admin' },
  { id: 'admin-notifications',  name: 'Notifications',    section: 'Admin' },
  { id: 'admin-support',        name: 'Support Chat',     section: 'Admin' },
  { id: 'admin-settings',       name: 'Settings',         section: 'Admin' },
  { id: 'admin-profile',        name: 'Profile',          section: 'Admin' },
];

// ── Page 2: Seller + Buyer ────────────────────────────────────────
const SELLER_BUYER = [
  { id: 'seller-dashboard',     name: 'Dashboard',        section: 'Seller' },
  { id: 'seller-jobs',          name: 'Jobs',             section: 'Seller' },
  { id: 'seller-bookings',      name: 'Bookings',         section: 'Seller' },
  { id: 'seller-services',      name: 'Services',         section: 'Seller' },
  { id: 'seller-bids',          name: 'Bids',             section: 'Seller' },
  { id: 'seller-offers',        name: 'Offers',           section: 'Seller' },
  { id: 'seller-chat',          name: 'Chat',             section: 'Seller' },
  { id: 'seller-wallet',        name: 'Wallet',           section: 'Seller' },
  { id: 'seller-connects',      name: 'Connects',         section: 'Seller' },
  { id: 'seller-notifications', name: 'Notifications',    section: 'Seller' },
  { id: 'seller-settings',      name: 'Settings',         section: 'Seller' },
  { id: 'seller-account',       name: 'Account',          section: 'Seller' },
  { id: 'buyer-home',           name: 'Home',             section: 'Buyer'  },
  { id: 'buyer-search',         name: 'Search',           section: 'Buyer'  },
  { id: 'buyer-jobs',           name: 'Jobs',             section: 'Buyer'  },
  { id: 'buyer-bookings',       name: 'Bookings',         section: 'Buyer'  },
  { id: 'buyer-offers',         name: 'Offers',           section: 'Buyer'  },
  { id: 'buyer-favourites',     name: 'Favourites',       section: 'Buyer'  },
  { id: 'buyer-chat',           name: 'Chat',             section: 'Buyer'  },
  { id: 'buyer-wallet',         name: 'Wallet',           section: 'Buyer'  },
  { id: 'buyer-notifications',  name: 'Notifications',    section: 'Buyer'  },
  { id: 'buyer-settings',       name: 'Settings',         section: 'Buyer'  },
  { id: 'buyer-account',        name: 'Account',          section: 'Buyer'  },
];

// ── Color tokens ──────────────────────────────────────────────────
const COLOR_TOKENS = [
  { name: 'Primary',        hex: '#e84545', r: 0.910, g: 0.271, b: 0.271 },
  { name: 'Page BG',        hex: '#efefef', r: 0.937, g: 0.937, b: 0.937 },
  { name: 'Border',         hex: '#e8e8e8', r: 0.910, g: 0.910, b: 0.910 },
  { name: 'White',          hex: '#ffffff', r: 1.000, g: 1.000, b: 1.000 },
  { name: 'Text Dark',      hex: '#1a1a1a', r: 0.102, g: 0.102, b: 0.102 },
  { name: 'Text Gray',      hex: '#6b7280', r: 0.420, g: 0.447, b: 0.502 },
  { name: 'Text Light',     hex: '#9ca3af', r: 0.612, g: 0.639, b: 0.686 },
  { name: 'Success',        hex: '#22c55e', r: 0.133, g: 0.773, b: 0.369 },
  { name: 'Warning',        hex: '#f59e0b', r: 0.961, g: 0.620, b: 0.043 },
  { name: 'Danger',         hex: '#ef4444', r: 0.937, g: 0.267, b: 0.267 },
];

// ── Helpers ───────────────────────────────────────────────────────
async function fetchImage(id) {
  const res = await fetch(SERVER + '/' + id + '.png');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return new Uint8Array(await res.arrayBuffer());
}

async function txt(parent, chars, size, bold, color, x, y) {
  const t = figma.createText();
  t.fontName  = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.characters = chars;
  t.fontSize   = size;
  t.fills      = [{ type: 'SOLID', color }];
  t.x = x; t.y = y;
  parent.appendChild(t);
}

// ── Draw screens on a page ────────────────────────────────────────
async function drawScreens(figmaPage, items) {
  const RED  = { r: 0.910, g: 0.271, b: 0.271 };
  const DARK = { r: 0.102, g: 0.102, b: 0.102 };
  const GRAY = { r: 0.500, g: 0.500, b: 0.500 };
  const BG   = { r: 0.937, g: 0.937, b: 0.937 };

  // Group by section for section labels
  let lastSection = null;
  let sectionOffsetY = 0;
  let rowInSection = 0;
  let globalIndex = 0;

  // Simple grid layout — all items in a continuous grid
  for (let i = 0; i < items.length; i++) {
    const p   = items[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const fx  = col * (FRAME_W + COL_GAP);
    const fy  = row * (FRAME_H + ROW_GAP);

    // Section divider label
    if (p.section !== lastSection) {
      lastSection = p.section;
      await txt(figmaPage, '── ' + p.section + ' ──', 22, true, RED, fx, fy - 60);
    }

    // Frame
    const frame = figma.createFrame();
    frame.name         = p.section + ' / ' + p.name;
    frame.resize(FRAME_W, FRAME_H);
    frame.x            = fx;
    frame.y            = fy;
    frame.fills        = [{ type: 'SOLID', color: BG }];
    frame.cornerRadius = 12;
    frame.clipsContent = true;
    figmaPage.appendChild(frame);

    // Screenshot
    try {
      const bytes   = await fetchImage(p.id);
      const imgHash = figma.createImage(bytes).hash;
      frame.fills   = [{ type: 'IMAGE', imageHash: imgHash, scaleMode: 'FILL' }];
    } catch {
      await txt(frame, p.section + ' · ' + p.name, 24, true, GRAY, 60, FRAME_H / 2 - 16);
    }

    // Label below
    await txt(figmaPage, p.name,    16, true,  DARK, fx, fy + FRAME_H + 14);
    await txt(figmaPage, p.section, 12, false, GRAY, fx, fy + FRAME_H + 36);
  }
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const RED  = { r: 0.910, g: 0.271, b: 0.271 };
  const DARK = { r: 0.102, g: 0.102, b: 0.102 };
  const GRAY = { r: 0.500, g: 0.500, b: 0.500 };

  // ── Page 1: Auth + Admin ────────────────────────────────────────
  const page1 = figma.currentPage;
  page1.name  = 'Auth + Admin';
  await txt(page1, 'Auth + Admin Screens', 48, true, RED, 0, -120);
  await txt(page1, AUTH_ADMIN.length + ' screens', 20, false, GRAY, 0, -62);
  await drawScreens(page1, AUTH_ADMIN);

  // ── Page 2: Seller + Buyer ──────────────────────────────────────
  const page2 = figma.createPage();
  page2.name  = 'Seller + Buyer';
  figma.currentPage = page2;
  await txt(page2, 'Seller + Buyer Screens', 48, true, RED, 0, -120);
  await txt(page2, SELLER_BUYER.length + ' screens', 20, false, GRAY, 0, -62);
  await drawScreens(page2, SELLER_BUYER);

  // ── Page 3: Design Tokens ───────────────────────────────────────
  const page3 = figma.createPage();
  page3.name  = '🎨 Design Tokens';
  figma.currentPage = page3;

  await txt(page3, 'MatchCreatorz', 64, true,  RED,  0, 0);
  await txt(page3, 'Design Tokens', 32, false, DARK, 0, 80);

  // Color swatches
  await txt(page3, 'Colors', 28, true, DARK, 0, 160);
  const SW = 170, SH = 100, SG = 20;
  for (let i = 0; i < COLOR_TOKENS.length; i++) {
    const c  = COLOR_TOKENS[i];
    const cx = (i % 5) * (SW + SG);
    const cy = 210 + Math.floor(i / 5) * (SH + 56);
    const r  = figma.createRectangle();
    r.resize(SW, SH);
    r.x = cx; r.y = cy;
    r.fills        = [{ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }];
    r.cornerRadius = 12;
    r.strokes      = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    r.strokeWeight = 1;
    page3.appendChild(r);
    await txt(page3, c.name, 12, true,  DARK, cx, cy + SH + 8);
    await txt(page3, c.hex,  11, false, GRAY, cx, cy + SH + 24);
  }

  // Typography
  const tyY = 560;
  await txt(page3, 'Typography — Inter', 28, true, DARK, 0, tyY);
  const typo = [
    { l: 'Heading 1 — Bold 36px',   s: 36, b: true  },
    { l: 'Heading 2 — Bold 28px',   s: 28, b: true  },
    { l: 'Heading 3 — Bold 20px',   s: 20, b: true  },
    { l: 'Body — Regular 16px',     s: 16, b: false },
    { l: 'Label — Regular 13px',    s: 13, b: false },
    { l: 'Caption — Regular 11px',  s: 11, b: false },
  ];
  let tyOffset = tyY + 56;
  for (const t of typo) {
    await txt(page3, t.l, t.s, t.b, DARK, 0, tyOffset);
    tyOffset += t.s + 24;
  }

  figma.notify('✅ Done! 40 screens imported across 3 pages.', { timeout: 4000 });
  figma.closePlugin();
})();
