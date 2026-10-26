// Pengisian data awal: daftar pangan bawaan + akun demo untuk juri/penguji.
import { db, transaction } from './db.js';
import { FOODS } from './foods-data.js';
import { generateMenu } from './generator.js';
import { hashPassword, mondayOf, todayLocal } from './util.js';

export const DEMO_EMAIL = 'demo@nutrismart.id';
export const DEMO_PASSWORD = 'demo1234';

export function seedFoods() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM foods WHERE user_id IS NULL').get();
  if (n > 0) return 0;
  const stmt = db.prepare(
    `INSERT INTO foods (user_id, name, category, kcal, protein, fat, carbs, fiber, portion_name, portion_grams, recommended)
     VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  transaction(() => FOODS.forEach((f) => stmt.run(...f)));
  return FOODS.length;
}

const DEMO_MEMBERS = [
  ['Budi', 'Ayah', 'L', '1988-04-12', 70, 170, '#0f9d63'],
  ['Sari', 'Ibu', 'P', '1990-08-03', 58, 158, '#e14d6b'],
  ['Raka', 'Anak', 'L', '2015-02-20', 32, 138, '#3b82f6'],
  ['Nadia', 'Anak', 'P', '2021-11-05', 15, 100, '#f0a500'],
];

/** Memastikan akun demo ada dan memiliki menu untuk minggu berjalan. */
export function ensureDemoAccount() {
  let user = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  if (!user) {
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, family_name) VALUES (?, ?, ?, ?)')
      .run('Sari Pratama', DEMO_EMAIL, hashPassword(DEMO_PASSWORD), 'Keluarga Pratama');
    user = { id: Number(info.lastInsertRowid) };
    const stmt = db.prepare(
      'INSERT INTO members (user_id, name, role, gender, birth_date, weight, height, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    transaction(() => DEMO_MEMBERS.forEach((m) => stmt.run(user.id, ...m)));
  }

  const today = todayLocal();
  const monday = mondayOf(today);
  const { n } = db
    .prepare('SELECT COUNT(*) AS n FROM meal_plans WHERE user_id = ? AND date BETWEEN ? AND date(?, \'+6 day\')')
    .get(user.id, monday, monday);
  if (n === 0 && db.prepare('SELECT COUNT(*) AS n FROM members WHERE user_id = ?').get(user.id).n > 0) {
    generateMenu(user.id, monday, 7, { markEatenBefore: today });
    db.prepare("UPDATE meal_plans SET status = 'dimakan' WHERE user_id = ? AND date = ? AND meal_type = 'sarapan'").run(user.id, today);
  }
  return user.id;
}
