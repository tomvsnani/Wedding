import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { stringify } from 'csv-stringify/sync';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// --- Database ---
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'wedding.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id TEXT PRIMARY KEY,
    invite_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    num_guests INTEGER DEFAULT 1,
    attending INTEGER DEFAULT 1,
    message TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Add updated_at column if missing (migration for existing DBs)
try { db.exec(`ALTER TABLE rsvps ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`); } catch {}

// Ensure email uniqueness index exists
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email)`); } catch {}

const defaults = {
  rsvp_deadline: process.env.RSVP_DEADLINE || '2026-05-06T23:59:59',
  groom_name: 'Ramu Pinninti',
  bride_name: 'Sahasra(Sruthi) Mattapelly',
  wedding_date: '2026-05-09',
  wedding_time: '10:35 AM',
  venue_name: 'Lotus Banquets',
  venue_address: '25691 Smotherman Rd Suite #240, Frisco, TX 75034',
  venue_lat: '33.1373',
  venue_lng: '-96.8240',
  invitation_message: 'With the blessings of Lord Ganesha and our beloved families, we joyfully invite you to celebrate the union of our hearts.',
  admin_password: process.env.ADMIN_PASSWORD || 'admin123',
};

const getSetting = (key) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : defaults[key];
};
const setSetting = (key, value) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
};

for (const [k, v] of Object.entries(defaults)) {
  if (!db.prepare('SELECT 1 FROM settings WHERE key = ?').get(k)) {
    setSetting(k, v);
  }
}

// --- Email ---
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendConfirmationEmail(rsvp, isUpdate = false) {
  if (!transporter) return;
  const weddingDate = getSetting('wedding_date');
  const venueName = getSetting('venue_name');
  const groomName = getSetting('groom_name');
  const brideName = getSetting('bride_name');

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;border:2px solid #b8860b;padding:30px;background:#fffdf5;">
      <h2 style="color:#8b0000;text-align:center;">🙏 ${isUpdate ? 'RSVP Updated' : 'Thank You for Your RSVP'}</h2>
      <p>Dear <strong>${rsvp.full_name}</strong>,</p>
      <p>We are delighted that you${rsvp.attending ? ' will be joining us' : ' took the time to respond'}!</p>
      ${rsvp.attending ? `<p><strong>Guests:</strong> ${rsvp.num_guests}</p>` : ''}
      <hr style="border-color:#b8860b;"/>
      <p><strong>Wedding:</strong> ${groomName} & ${brideName}</p>
      <p><strong>Date:</strong> ${weddingDate} at ${getSetting('wedding_time')}</p>
      <p><strong>Venue:</strong> ${venueName}</p>
      <p style="text-align:center;color:#8b0000;margin-top:20px;">With love and blessings ❤️</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Wedding Invitation" <${process.env.EMAIL_USER}>`,
      to: rsvp.email,
      subject: `${isUpdate ? 'Updated: ' : ''}RSVP Confirmation - ${groomName} & ${brideName}'s Wedding`,
      html,
    });
    if (process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: `"Wedding RSVP" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `${isUpdate ? 'Updated ' : 'New '}RSVP: ${rsvp.full_name} - ${rsvp.attending ? 'Attending' : 'Not Attending'}`,
        html: `<p>${rsvp.full_name} (${rsvp.email}) - ${rsvp.num_guests} guests - ${rsvp.attending ? 'Attending' : 'Declined'}</p><p>Message: ${rsvp.message || 'None'}</p>`,
      });
    }
  } catch (e) {
    console.error('Email error:', e.message);
  }
}

function requireAdmin(req, res, next) {
  const pw = req.headers['x-admin-password'];
  if (pw !== getSetting('admin_password')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// --- Public API ---

app.get('/api/event', (req, res) => {
  const keys = ['groom_name','bride_name','wedding_date','wedding_time','venue_name','venue_address','venue_lat','venue_lng','invitation_message','rsvp_deadline'];
  const event = {};
  for (const k of keys) event[k] = getSetting(k);
  res.json(event);
});

// List photos from a folder inside photos/
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);

// Check both server/public and client/public for photos (dev vs prod)
const getPhotosDir = (folder) => {
  const serverDir = path.join(__dirname, 'public', 'photos', folder);
  const clientDir = path.join(__dirname, '..', 'client', 'public', 'photos', folder);
  if (fs.existsSync(serverDir) && fs.readdirSync(serverDir).length > 0) return serverDir;
  if (fs.existsSync(clientDir)) return clientDir;
  return serverDir;
};

app.get('/api/photos/:folder', (req, res) => {
  const folder = req.params.folder;
  // Prevent path traversal
  if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
    return res.status(400).json({ error: 'Invalid folder' });
  }
  const dir = getPhotosDir(folder);
  try {
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir)
      .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    res.json(files.map(f => `/photos/${folder}/${f}`));
  } catch {
    res.json([]);
  }
});

app.get('/api/invite/:id', (req, res) => {
  const invite = db.prepare('SELECT * FROM invites WHERE id = ?').get(req.params.id);
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  res.json(invite);
});

// Lookup existing RSVP by email
app.get('/api/rsvp/lookup', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const rsvp = db.prepare('SELECT * FROM rsvps WHERE email = ? COLLATE NOCASE').get(email);
  if (!rsvp) return res.json({ found: false });
  res.json({ found: true, rsvp });
});

// Create new RSVP
app.post('/api/rsvp', (req, res) => {
  const deadline = new Date(getSetting('rsvp_deadline'));
  if (new Date() > deadline) {
    return res.status(400).json({ error: 'RSVP deadline has passed' });
  }

  const { full_name, email, phone, num_guests, attending, message, invite_id } = req.body;
  if (!full_name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const existing = db.prepare('SELECT id FROM rsvps WHERE email = ? COLLATE NOCASE').get(email);
  if (existing) {
    return res.status(409).json({ error: 'You have already RSVPed. You can update your response instead.', existingId: existing.id });
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO rsvps (id, invite_id, full_name, email, phone, num_guests, attending, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, invite_id || null, full_name, email, phone || null, num_guests || 1, attending ? 1 : 0, message || null);

  const rsvp = { id, full_name, email, phone, num_guests: num_guests || 1, attending, message };
  sendConfirmationEmail(rsvp);

  res.json({ success: true, id });
});

// Update existing RSVP
app.put('/api/rsvp/:id', (req, res) => {
  const deadline = new Date(getSetting('rsvp_deadline'));
  if (new Date() > deadline) {
    return res.status(400).json({ error: 'RSVP deadline has passed' });
  }

  const existing = db.prepare('SELECT * FROM rsvps WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'RSVP not found' });

  const { num_guests, attending, message, phone } = req.body;

  db.prepare(
    `UPDATE rsvps SET num_guests = ?, attending = ?, message = ?, phone = COALESCE(?, phone), updated_at = datetime('now') WHERE id = ?`
  ).run(num_guests || existing.num_guests, attending !== undefined ? (attending ? 1 : 0) : existing.attending, message !== undefined ? message : existing.message, phone || null, req.params.id);

  const updated = db.prepare('SELECT * FROM rsvps WHERE id = ?').get(req.params.id);
  sendConfirmationEmail({ ...updated, attending: !!updated.attending }, true);

  res.json({ success: true, rsvp: updated });
});

// --- Admin API ---

app.get('/api/admin/rsvps', requireAdmin, (req, res) => {
  const rsvps = db.prepare('SELECT * FROM rsvps ORDER BY created_at DESC').all();
  res.json(rsvps);
});

app.get('/api/admin/rsvps/csv', requireAdmin, (req, res) => {
  const rsvps = db.prepare('SELECT full_name, email, phone, num_guests, attending, message, created_at, updated_at FROM rsvps ORDER BY created_at DESC').all();
  const csv = stringify(rsvps, { header: true, columns: ['full_name','email','phone','num_guests','attending','message','created_at','updated_at'] });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=rsvps.csv');
  res.send(csv);
});

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const allKeys = Object.keys(defaults);
  const settings = {};
  for (const k of allKeys) settings[k] = getSetting(k);
  res.json(settings);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    if (k in defaults) setSetting(k, v);
  }
  res.json({ success: true });
});

app.post('/api/admin/invites', requireAdmin, (req, res) => {
  const { name, email } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO invites (id, name, email) VALUES (?, ?, ?)').run(id, name || null, email || null);
  res.json({ id, name, email });
});

app.get('/api/admin/invites', requireAdmin, (req, res) => {
  const invites = db.prepare('SELECT * FROM invites ORDER BY created_at DESC').all();
  res.json(invites);
});

app.delete('/api/admin/rsvps/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM rsvps WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
