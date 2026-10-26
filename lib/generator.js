// Generator Menu Seimbang: menyusun menu harian keluarga mengikuti pedoman "Isi Piringku"
// (makanan pokok + lauk pauk + sayur + buah) dengan porsi yang disesuaikan AKG tiap anggota.
import { db, transaction } from './db.js';
import { enrichMember, portionFactor } from './akg.js';
import { addDays, bad, dateRange } from './util.js';

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function picker(list) {
  let bag = [];
  return (exclude = new Set()) => {
    if (!list.length) return null;
    if (!bag.length) bag = shuffle(list);
    const idx = bag.findIndex((f) => !exclude.has(f.id));
    const [food] = bag.splice(idx >= 0 ? idx : 0, 1);
    return food;
  };
}

/**
 * @param {number} userId
 * @param {string} start  tanggal awal (YYYY-MM-DD)
 * @param {number} days   jumlah hari (1–14)
 * @param {{replace?: boolean, markEatenBefore?: string|null}} opts
 * @returns {{created: number, filledSlots: number}}
 */
export function generateMenu(userId, start, days, { replace = false, markEatenBefore = null } = {}) {
  const end = addDays(start, days - 1);
  const members = db
    .prepare('SELECT * FROM members WHERE user_id = ? ORDER BY id')
    .all(userId)
    .map((m) => enrichMember(m, start))
    .filter((m) => m.age >= 0.5); // bayi < 6 bulan: ASI eksklusif
  if (!members.length) throw bad('Tambahkan minimal satu anggota keluarga (usia ≥ 6 bulan) terlebih dahulu');

  const foods = db
    .prepare('SELECT * FROM foods WHERE recommended = 1 AND (user_id IS NULL OR user_id = ?)')
    .all(userId);
  const by = (cat) => foods.filter((f) => f.category === cat);

  const rice = by('pokok').filter((f) => f.name.toLowerCase().startsWith('nasi'));
  const altStaples = by('pokok').filter((f) => !f.name.toLowerCase().startsWith('nasi'));
  const pick = {
    breakfastStaple: picker(by('pokok')),
    rice: picker(rice),
    alt: picker(altStaples),
    animal: picker(by('lauk_hewani')),
    plant: picker(by('lauk_nabati')),
    veg: picker(by('sayur')),
    fruit: picker(by('buah')),
    dairy: picker(by('susu')),
  };

  const insert = db.prepare(
    `INSERT INTO meal_plans (user_id, member_id, food_id, date, meal_type, grams, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const existingSlots = db.prepare('SELECT DISTINCT meal_type FROM meal_plans WHERE user_id = ? AND date = ?');

  let created = 0;
  let filledSlots = 0;

  transaction(() => {
    if (replace) {
      db.prepare('DELETE FROM meal_plans WHERE user_id = ? AND date BETWEEN ? AND ?').run(userId, start, end);
    }

    for (const date of dateRange(start, end)) {
      const taken = new Set(existingSlots.all(userId, date).map((r) => r.meal_type));
      const usedToday = new Set();
      const take = (fn) => {
        const f = fn(usedToday);
        if (f) usedToday.add(f.id);
        return f;
      };
      const mainStaple = () => {
        const preferred = Math.random() < 0.8 || !altStaples.length ? take(pick.rice) : take(pick.alt);
        return preferred || take(pick.rice) || take(pick.alt) || take(pick.breakfastStaple);
      };

      // [makanan, pengali porsi, hanya-anak?]
      const menu = {
        sarapan: [[take(pick.breakfastStaple), 1.25], [take(pick.animal), 1], [take(pick.veg), 0.75], [take(pick.fruit), 1], [take(pick.dairy), 1, true]],
        siang: [[mainStaple(), 1.75], [take(pick.animal), 1], [take(pick.plant), 1], [take(pick.veg), 1], [take(pick.fruit), 1]],
        malam: [[mainStaple(), 1.75], [take(pick.animal), 1], [take(pick.plant), 1], [take(pick.veg), 1], [take(pick.fruit), 1]],
        camilan: [[take(pick.fruit), 1]],
      };

      for (const [mealType, items] of Object.entries(menu)) {
        if (taken.has(mealType)) continue;
        filledSlots++;
        const status = markEatenBefore && date < markEatenBefore ? 'dimakan' : 'rencana';
        for (const [food, multiplier, kidsOnly] of items) {
          if (!food) continue;
          // Pokok dengan porsi kecil (roti/oatmeal) diberikan 2 sajian.
          const base = food.portion_grams * multiplier * (food.category === 'pokok' && food.portion_grams < 50 ? 2 : 1);
          for (const m of members) {
            if (kidsOnly && m.age >= 13) continue;
            insert.run(userId, m.id, food.id, date, mealType, round5(base * portionFactor(m.akg)), status);
            created++;
          }
        }
      }
    }
  });

  return { created, filledSlots };
}
