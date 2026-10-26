import { Router } from 'express';
import { db } from '../lib/db.js';
import { enrichMember } from '../lib/akg.js';
import { dateRange, parseRange, todayLocal } from '../lib/util.js';

const router = Router();
const NUTRIENTS = ['kcal', 'protein', 'fat', 'carbs', 'fiber'];
const PLATE_GROUP = { pokok: 'pokok', lauk_hewani: 'lauk', lauk_nabati: 'lauk', sayur: 'sayur', buah: 'buah' };
const MAIN_MEALS = ['sarapan', 'siang', 'malam'];

const zero = () => Object.fromEntries(NUTRIENTS.map((k) => [k, 0]));
const round1 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10) / 10]));

/**
 * Laporan gizi: total asupan per anggota per hari (rencana & sudah dimakan),
 * dibandingkan dengan AKG, serta analisis kelengkapan "Isi Piringku" per waktu makan.
 */
router.get('/reports', (req, res) => {
  const { start, end } = parseRange(req.query, 31);
  const dates = dateRange(start, end);
  const ref = todayLocal() < end ? todayLocal() : end;

  const members = db.prepare('SELECT * FROM members WHERE user_id = ? ORDER BY id').all(req.user.id).map((m) => enrichMember(m, ref));
  const rows = db
    .prepare(
      `SELECT mp.member_id, mp.date, mp.meal_type, mp.grams, mp.status,
              f.category, f.kcal, f.protein, f.fat, f.carbs, f.fiber
         FROM meal_plans mp JOIN foods f ON f.id = mp.food_id
        WHERE mp.user_id = ? AND mp.date BETWEEN ? AND ?`
    )
    .all(req.user.id, start, end);

  const byMember = new Map(
    members.map((m) => [m.id, Object.fromEntries(dates.map((d) => [d, { planned: zero(), eaten: zero(), entries: 0 }]))])
  );
  const plate = Object.fromEntries(
    dates.map((d) => [d, Object.fromEntries(MAIN_MEALS.map((mt) => [mt, { pokok: false, lauk: false, sayur: false, buah: false, any: false }]))])
  );
  const categoryGrams = {};

  for (const r of rows) {
    const day = byMember.get(r.member_id)?.[r.date];
    if (!day) continue;
    const factor = r.grams / 100;
    day.entries++;
    for (const k of NUTRIENTS) {
      day.planned[k] += r[k] * factor;
      if (r.status === 'dimakan') day.eaten[k] += r[k] * factor;
    }
    categoryGrams[r.category] = (categoryGrams[r.category] || 0) + r.grams;
    const slot = plate[r.date]?.[r.meal_type];
    if (slot) {
      slot.any = true;
      const group = PLATE_GROUP[r.category];
      if (group) slot[group] = true;
    }
  }

  // Skor Isi Piringku = rata-rata kelengkapan 4 kelompok pangan pada waktu makan utama yang terisi.
  let slots = 0;
  let points = 0;
  let complete = 0;
  for (const d of dates) {
    for (const mt of MAIN_MEALS) {
      const s = plate[d][mt];
      if (!s.any) continue;
      const n = ['pokok', 'lauk', 'sayur', 'buah'].filter((g) => s[g]).length;
      slots++;
      points += n / 4;
      if (n === 4) complete++;
    }
  }

  const resultMembers = members.map((m) => {
    const daily = byMember.get(m.id);
    const plannedDays = dates.filter((d) => daily[d].entries > 0);
    const total = zero();
    const eatenTotal = zero();
    for (const d of dates) {
      for (const k of NUTRIENTS) {
        total[k] += daily[d].planned[k];
        eatenTotal[k] += daily[d].eaten[k];
      }
    }
    const div = plannedDays.length || 1;
    const average = Object.fromEntries(NUTRIENTS.map((k) => [k, total[k] / div]));
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      color: m.color,
      gender: m.gender,
      age: m.age,
      akg: m.akg,
      plannedDays: plannedDays.length,
      daily: Object.fromEntries(dates.map((d) => [d, { planned: round1(daily[d].planned), eaten: round1(daily[d].eaten), entries: daily[d].entries }])),
      total: round1(total),
      eatenTotal: round1(eatenTotal),
      average: round1(average),
    };
  });

  res.json({
    start,
    end,
    dates,
    members: resultMembers,
    plate: {
      days: plate,
      slots,
      complete,
      score: slots ? Math.round((points / slots) * 100) : 0,
    },
    categoryGrams,
    totals: {
      entries: rows.length,
      eaten: rows.filter((r) => r.status === 'dimakan').length,
    },
  });
});

/** Daftar belanja: agregasi kebutuhan pangan keluarga dalam rentang tanggal. */
router.get('/shopping', (req, res) => {
  const { start, end } = parseRange(req.query, 31);
  const items = db
    .prepare(
      `SELECT f.id, f.name, f.category, f.portion_name, f.portion_grams,
              SUM(mp.grams) AS total_grams, COUNT(*) AS servings,
              COUNT(DISTINCT mp.date) AS days
         FROM meal_plans mp JOIN foods f ON f.id = mp.food_id
        WHERE mp.user_id = ? AND mp.date BETWEEN ? AND ?
        GROUP BY f.id
        ORDER BY f.category, f.name COLLATE NOCASE`
    )
    .all(req.user.id, start, end);
  res.json({ start, end, items });
});

export default router;
