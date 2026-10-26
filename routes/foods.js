import { Router } from 'express';
import { db } from '../lib/db.js';
import { CATEGORIES } from '../lib/foods-data.js';
import { HttpError, oneOf, reqId, reqNumber, reqString } from '../lib/util.js';

const router = Router();

router.get('/', (req, res) => {
  const foods = db
    .prepare(
      `SELECT id, name, category, kcal, protein, fat, carbs, fiber, portion_name, portion_grams, recommended,
              (user_id IS NOT NULL) AS custom
         FROM foods
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY name COLLATE NOCASE`
    )
    .all(req.user.id)
    .map((f) => ({ ...f, custom: !!f.custom, recommended: !!f.recommended }));
  res.json({ foods });
});

router.post('/', (req, res) => {
  const b = req.body || {};
  const name = reqString(b.name, 'Nama pangan', { max: 60 });
  const category = oneOf(b.category, CATEGORIES, 'Kategori');
  const nutr = {
    kcal: reqNumber(b.kcal, 'Energi', { min: 0, max: 900 }),
    protein: reqNumber(b.protein ?? 0, 'Protein', { min: 0, max: 100 }),
    fat: reqNumber(b.fat ?? 0, 'Lemak', { min: 0, max: 100 }),
    carbs: reqNumber(b.carbs ?? 0, 'Karbohidrat', { min: 0, max: 100 }),
    fiber: reqNumber(b.fiber ?? 0, 'Serat', { min: 0, max: 100 }),
  };
  if (nutr.protein + nutr.fat + nutr.carbs > 100 || nutr.fiber > 100) {
    throw new HttpError(400, 'Total protein, lemak, dan karbohidrat tidak boleh melebihi 100 g per 100 g');
  }
  const portionName = reqString(b.portion_name || 'porsi', 'Nama porsi', { max: 30 });
  const portionGrams = reqNumber(b.portion_grams ?? 100, 'Berat porsi', { min: 1, max: 1000 });

  const dup = db
    .prepare('SELECT 1 FROM foods WHERE (user_id IS NULL OR user_id = ?) AND lower(name) = lower(?)')
    .get(req.user.id, name);
  if (dup) throw new HttpError(409, 'Pangan dengan nama tersebut sudah ada');

  const info = db
    .prepare(
      `INSERT INTO foods (user_id, name, category, kcal, protein, fat, carbs, fiber, portion_name, portion_grams)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, name, category, nutr.kcal, nutr.protein, nutr.fat, nutr.carbs, nutr.fiber, portionName, portionGrams);
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ food: { ...food, custom: true, recommended: false } });
});

router.delete('/:id', (req, res) => {
  const id = reqId(req.params.id);
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(id);
  if (!food || (food.user_id !== null && food.user_id !== req.user.id)) throw new HttpError(404, 'Pangan tidak ditemukan');
  if (food.user_id === null) throw new HttpError(403, 'Pangan bawaan tidak dapat dihapus');
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM meal_plans WHERE food_id = ?').get(id);
  db.prepare('DELETE FROM foods WHERE id = ?').run(id);
  res.json({ ok: true, removedPlans: n });
});

export default router;
