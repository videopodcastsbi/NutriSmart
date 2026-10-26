// NutriSmart — server utama (Express + SQLite bawaan Node.js)
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DB_FILE } from './lib/db.js';
import { requireAuth, purgeExpiredSessions } from './lib/auth.js';
import { seedFoods, ensureDemoAccount, DEMO_EMAIL, DEMO_PASSWORD } from './lib/seed.js';
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import foodRoutes from './routes/foods.js';
import planRoutes from './routes/plans.js';
import reportRoutes from './routes/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

// ---- Inisialisasi data ----
const seeded = seedFoods();
ensureDemoAccount();
purgeExpiredSessions();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ---- API ----
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/members', requireAuth, memberRoutes);
app.use('/api/foods', requireAuth, foodRoutes);
app.use('/api/plans', requireAuth, planRoutes);
app.use('/api', requireAuth, reportRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

// ---- Frontend statis ----
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

// ---- Penanganan error terpusat ----
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Format data tidak valid' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Data terlalu besar' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Terjadi kesalahan pada server' : err.message });
});

app.listen(PORT, () => {
  console.log(`\n  🥗 NutriSmart berjalan di http://localhost:${PORT}`);
  console.log(`  📦 Database : ${DB_FILE}${seeded ? ` (${seeded} pangan ditambahkan)` : ''}`);
  console.log(`  👤 Akun demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
});
