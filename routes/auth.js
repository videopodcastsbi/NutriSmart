import { Router } from 'express';
import { db } from '../lib/db.js';
import { createSession, destroySession, requireAuth } from '../lib/auth.js';
import { DEMO_EMAIL, ensureDemoAccount } from '../lib/seed.js';
import { HttpError, hashPassword, optString, reqString, verifyPassword } from '../lib/util.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readEmail(value) {
  const email = reqString(value, 'Email', { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Format email tidak valid');
  return email;
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, family_name: u.family_name, is_demo: u.email === DEMO_EMAIL });

router.post('/register', (req, res) => {
  const name = reqString(req.body?.name, 'Nama', { min: 2, max: 60 });
  const email = readEmail(req.body?.email);
  const password = reqString(req.body?.password, 'Kata sandi', { min: 6, max: 100 });
  const familyName = optString(req.body?.family_name, 'Nama keluarga', { max: 60 }) || `Keluarga ${name.split(' ')[0]}`;

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new HttpError(409, 'Email sudah terdaftar, silakan masuk');
  }
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, family_name) VALUES (?, ?, ?, ?)')
    .run(name, email, hashPassword(password), familyName);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  createSession(res, user.id);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const email = readEmail(req.body?.email);
  const password = reqString(req.body?.password, 'Kata sandi', { max: 100 });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(401, 'Email atau kata sandi salah');
  }
  createSession(res, user.id);
  res.json({ user: publicUser(user) });
});

router.post('/demo', (req, res) => {
  const id = ensureDemoAccount();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  createSession(res, user.id);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/me', requireAuth, (req, res) => {
  const name = reqString(req.body?.name, 'Nama', { min: 2, max: 60 });
  const familyName = reqString(req.body?.family_name, 'Nama keluarga', { max: 60 });
  db.prepare('UPDATE users SET name = ?, family_name = ? WHERE id = ?').run(name, familyName, req.user.id);
  res.json({ user: publicUser({ ...req.user, name, family_name: familyName }) });
});

export default router;
