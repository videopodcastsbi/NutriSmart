import { Router } from 'express';
import { db, transaction } from '../lib/db.js';
import { generateMenu } from '../lib/generator.js';
import {
  HttpError, addDays, bad, diffDays, oneOf, parseRange, reqDate, reqId, reqNumber,
} from '../lib/util.js';

const router = Router();
export const MEAL_TYPES = ['sarapan', 'siang', 'malam', 'camilan'];
const STATUSES = ['rencana', 'dimakan'];

function readIds(value) {
  if (!Array.isArray(value) || !value.length) throw bad('Pilih minimal satu data');
  if (value.length > 500) throw bad('Terlalu banyak data dalam satu permintaan');
  return [...new Set(value.map((v) => reqId(v)))];
}

const placeholders = (n) => Array(n).fill('?').join(',');

/** Daftar menu dalam rentang tanggal, lengkap dengan info pangan & anggota. */
router.get('/', (req, res) => {
  const { start, end } = parseRange(req.query);
  const plans = db
    .prepare(
      `SELECT mp.id, mp.date, mp.meal_type, mp.grams, mp.status, mp.member_id, mp.food_id,
              f.name AS food_name, f.category, f.kcal, f.protein, f.fat, f.carbs, f.fiber,
              f.portion_name, f.portion_grams,
              m.name AS member_name, m.color AS member_color
         FROM meal_plans mp
         JOIN foods f   ON f.id = mp.food_id
         JOIN members m ON m.id = mp.member_id
        WHERE mp.user_id = ? AND mp.date BETWEEN ? AND ?
        ORDER BY mp.date, mp.meal_type, f.category, f.name, m.id`
    )
    .all(req.user.id, start, end);
  res.json({ start, end, plans });
});

/** Menambahkan satu pangan untuk satu/lebih anggota keluarga sekaligus. */
router.post('/', (req, res) => {
  const b = req.body || {};
  const date = reqDate(b.date);
  const mealType = oneOf(b.meal_type, MEAL_TYPES, 'Waktu makan');
  const status = oneOf(b.status || 'rencana', STATUSES, 'Status');
  const foodId = reqId(b.food_id, 'Pangan');
  const food = db.prepare('SELECT id FROM foods WHERE id = ? AND (user_id IS NULL OR user_id = ?)').get(foodId, req.user.id);
  if (!food) throw new HttpError(404, 'Pangan tidak ditemukan');

  if (!Array.isArray(b.entries) || !b.entries.length) throw bad('Pilih minimal satu anggota keluarga');
  const entries = b.entries.map((e) => ({
    member_id: reqId(e?.member_id, 'Anggota'),
    grams: Math.round(reqNumber(e?.grams, 'Berat porsi', { min: 1, max: 3000 })),
  }));
  const ids = [...new Set(entries.map((e) => e.member_id))];
  const owned = db
    .prepare(`SELECT COUNT(*) AS n FROM members WHERE user_id = ? AND id IN (${placeholders(ids.length)})`)
    .get(req.user.id, ...ids).n;
  if (owned !== ids.length) throw bad('Anggota keluarga tidak valid');

  const insert = db.prepare(
    'INSERT INTO meal_plans (user_id, member_id, food_id, date, meal_type, grams, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const created = transaction(() =>
    entries.map((e) => Number(insert.run(req.user.id, e.member_id, foodId, date, mealType, e.grams, status).lastInsertRowid))
  );
  res.status(201).json({ created: created.length, ids: created });
});

router.patch('/:id', (req, res) => {
  const id = reqId(req.params.id);
  const row = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) throw new HttpError(404, 'Data menu tidak ditemukan');
  const grams = req.body?.grams !== undefined ? Math.round(reqNumber(req.body.grams, 'Berat porsi', { min: 1, max: 3000 })) : row.grams;
  const status = req.body?.status !== undefined ? oneOf(req.body.status, STATUSES, 'Status') : row.status;
  db.prepare('UPDATE meal_plans SET grams = ?, status = ? WHERE id = ?').run(grams, status, id);
  res.json({ ok: true, id, grams, status });
});

router.delete('/:id', (req, res) => {
  const id = reqId(req.params.id);
  const info = db.prepare('DELETE FROM meal_plans WHERE id = ? AND user_id = ?').run(id, req.user.id);
  if (!info.changes) throw new HttpError(404, 'Data menu tidak ditemukan');
  res.json({ ok: true });
});

/** Aksi massal: hapus atau ubah status beberapa entri sekaligus. */
router.post('/bulk', (req, res) => {
  const ids = readIds(req.body?.ids);
  const action = oneOf(req.body?.action, ['delete', 'status'], 'Aksi');
  let info;
  if (action === 'delete') {
    info = db.prepare(`DELETE FROM meal_plans WHERE user_id = ? AND id IN (${placeholders(ids.length)})`).run(req.user.id, ...ids);
  } else {
    const status = oneOf(req.body?.status, STATUSES, 'Status');
    info = db
      .prepare(`UPDATE meal_plans SET status = ? WHERE user_id = ? AND id IN (${placeholders(ids.length)})`)
      .run(status, req.user.id, ...ids);
  }
  res.json({ ok: true, affected: info.changes });
});

/** Generator Menu Seimbang (Isi Piringku). */
router.post('/generate', (req, res) => {
  const start = reqDate(req.body?.start, 'Tanggal awal');
  const days = reqNumber(req.body?.days ?? 1, 'Jumlah hari', { min: 1, max: 14 });
  const result = generateMenu(req.user.id, start, Math.round(days), { replace: !!req.body?.replace });
  res.status(201).json(result);
});

/** Menyalin menu dari satu rentang tanggal ke rentang lain (status direset menjadi "rencana"). */
router.post('/copy', (req, res) => {
  const from = reqDate(req.body?.from, 'Tanggal sumber');
  const to = reqDate(req.body?.to, 'Tanggal tujuan');
  const days = Math.round(reqNumber(req.body?.days ?? 1, 'Jumlah hari', { min: 1, max: 14 }));
  if (from === to) throw bad('Tanggal sumber dan tujuan tidak boleh sama');
  const shift = diffDays(from, to);
  if (Math.abs(shift) < days) throw bad('Rentang sumber dan tujuan tidak boleh bertumpuk');

  const fromEnd = addDays(from, days - 1);
  const toEnd = addDays(to, days - 1);
  const rows = db
    .prepare('SELECT member_id, food_id, date, meal_type, grams FROM meal_plans WHERE user_id = ? AND date BETWEEN ? AND ?')
    .all(req.user.id, from, fromEnd);
  if (!rows.length) throw bad('Tidak ada menu pada tanggal sumber untuk disalin');

  const insert = db.prepare(
    "INSERT INTO meal_plans (user_id, member_id, food_id, date, meal_type, grams, status) VALUES (?, ?, ?, ?, ?, ?, 'rencana')"
  );
  transaction(() => {
    if (req.body?.replace) {
      db.prepare('DELETE FROM meal_plans WHERE user_id = ? AND date BETWEEN ? AND ?').run(req.user.id, to, toEnd);
    }
    for (const r of rows) insert.run(req.user.id, r.member_id, r.food_id, addDays(r.date, shift), r.meal_type, r.grams);
  });
  res.status(201).json({ created: rows.length });
});

export default router;
