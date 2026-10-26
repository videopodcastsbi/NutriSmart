import { Router } from 'express';
import { db } from '../lib/db.js';
import { enrichMember } from '../lib/akg.js';
import { HttpError, ageAt, bad, oneOf, optNumber, reqDate, reqId, reqString, todayLocal } from '../lib/util.js';

const router = Router();
const ROLES = ['Ayah', 'Ibu', 'Anak', 'Kakek', 'Nenek', 'Lainnya'];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function readMember(body = {}) {
  const today = todayLocal();
  const birth = reqDate(body.birth_date, 'Tanggal lahir');
  if (birth > today) throw bad('Tanggal lahir tidak boleh di masa depan');
  if (ageAt(birth, today) > 110) throw bad('Tanggal lahir tidak valid');
  const color = typeof body.color === 'string' && COLOR_RE.test(body.color) ? body.color : '#0f9d63';
  const target = optNumber(body.target_kcal, 'Target energi', { min: 500, max: 5000 });
  return {
    name: reqString(body.name, 'Nama', { max: 40 }),
    role: oneOf(body.role || 'Lainnya', ROLES, 'Peran'),
    gender: oneOf(body.gender, ['L', 'P'], 'Jenis kelamin'),
    birth_date: birth,
    weight: optNumber(body.weight, 'Berat badan', { min: 1, max: 300 }),
    height: optNumber(body.height, 'Tinggi badan', { min: 30, max: 250 }),
    color,
    target_kcal: target === null ? null : Math.round(target),
  };
}

function findOwned(userId, id) {
  const m = db.prepare('SELECT * FROM members WHERE id = ? AND user_id = ?').get(id, userId);
  if (!m) throw new HttpError(404, 'Anggota keluarga tidak ditemukan');
  return m;
}

router.get('/', (req, res) => {
  const today = todayLocal();
  const rows = db.prepare('SELECT * FROM members WHERE user_id = ? ORDER BY id').all(req.user.id);
  res.json({ members: rows.map((m) => enrichMember(m, today)) });
});

router.post('/', (req, res) => {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM members WHERE user_id = ?').get(req.user.id);
  if (n >= 15) throw bad('Maksimal 15 anggota keluarga');
  const m = readMember(req.body);
  const info = db
    .prepare(
      `INSERT INTO members (user_id, name, role, gender, birth_date, weight, height, color, target_kcal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, m.name, m.role, m.gender, m.birth_date, m.weight, m.height, m.color, m.target_kcal);
  const row = findOwned(req.user.id, Number(info.lastInsertRowid));
  res.status(201).json({ member: enrichMember(row, todayLocal()) });
});

router.put('/:id', (req, res) => {
  const id = reqId(req.params.id);
  findOwned(req.user.id, id);
  const m = readMember(req.body);
  db.prepare(
    `UPDATE members SET name = ?, role = ?, gender = ?, birth_date = ?, weight = ?, height = ?, color = ?, target_kcal = ?
      WHERE id = ? AND user_id = ?`
  ).run(m.name, m.role, m.gender, m.birth_date, m.weight, m.height, m.color, m.target_kcal, id, req.user.id);
  res.json({ member: enrichMember(findOwned(req.user.id, id), todayLocal()) });
});

router.delete('/:id', (req, res) => {
  const id = reqId(req.params.id);
  findOwned(req.user.id, id);
  db.prepare('DELETE FROM members WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ ok: true });
});

export default router;
