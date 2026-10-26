// Angka Kecukupan Gizi (AKG) yang dianjurkan untuk masyarakat Indonesia
// Sumber: Peraturan Menteri Kesehatan RI No. 28 Tahun 2019.
import { ageAt, todayLocal } from './util.js';

const g = (max, label, kcal, protein, fat, carbs, fiber) => ({ max, label, kcal, protein, fat, carbs, fiber });

const CHILD = [
  g(0.5, '0–5 bulan', 550, 9, 31, 59, 0),
  g(1, '6–11 bulan', 800, 15, 35, 105, 11),
  g(4, '1–3 tahun', 1350, 20, 45, 215, 19),
  g(7, '4–6 tahun', 1400, 25, 50, 220, 20),
  g(10, '7–9 tahun', 1650, 40, 55, 250, 23),
];

const MALE = [
  g(13, 'Laki-laki 10–12 tahun', 2000, 50, 65, 300, 28),
  g(16, 'Laki-laki 13–15 tahun', 2400, 70, 80, 350, 34),
  g(19, 'Laki-laki 16–18 tahun', 2650, 75, 85, 400, 37),
  g(30, 'Laki-laki 19–29 tahun', 2650, 65, 75, 430, 37),
  g(50, 'Laki-laki 30–49 tahun', 2550, 65, 70, 415, 36),
  g(65, 'Laki-laki 50–64 tahun', 2150, 65, 60, 340, 30),
  g(80, 'Laki-laki 65–80 tahun', 1800, 64, 50, 275, 25),
  g(Infinity, 'Laki-laki 80+ tahun', 1600, 64, 45, 235, 22),
];

const FEMALE = [
  g(13, 'Perempuan 10–12 tahun', 1900, 55, 65, 280, 27),
  g(16, 'Perempuan 13–15 tahun', 2050, 65, 70, 300, 29),
  g(19, 'Perempuan 16–18 tahun', 2100, 65, 70, 300, 29),
  g(30, 'Perempuan 19–29 tahun', 2250, 60, 65, 360, 32),
  g(50, 'Perempuan 30–49 tahun', 2150, 60, 60, 340, 30),
  g(65, 'Perempuan 50–64 tahun', 1800, 60, 50, 280, 25),
  g(80, 'Perempuan 65–80 tahun', 1550, 58, 45, 230, 22),
  g(Infinity, 'Perempuan 80+ tahun', 1400, 58, 40, 200, 20),
];

/** Energi rujukan orang dewasa, dipakai untuk menskalakan porsi tiap anggota. */
export const REFERENCE_KCAL = 2150;

/**
 * Menghitung target gizi harian seorang anggota keluarga.
 * Jika anggota memiliki `target_kcal` khusus, seluruh zat gizi diskalakan secara proporsional.
 */
export function getAKG(member, refDate = todayLocal()) {
  const age = Math.max(0, ageAt(member.birth_date, refDate));
  const table = age < 10 ? CHILD : member.gender === 'L' ? MALE : FEMALE;
  const base = table.find((row) => age < row.max) || table[table.length - 1];
  const result = {
    label: base.label,
    kcal: base.kcal,
    protein: base.protein,
    fat: base.fat,
    carbs: base.carbs,
    fiber: base.fiber,
    custom: false,
  };
  if (member.target_kcal) {
    const k = member.target_kcal / base.kcal;
    Object.assign(result, {
      kcal: member.target_kcal,
      protein: Math.round(base.protein * k),
      fat: Math.round(base.fat * k),
      carbs: Math.round(base.carbs * k),
      fiber: Math.round(base.fiber * k),
      custom: true,
    });
  }
  return result;
}

/** Faktor porsi relatif terhadap orang dewasa rujukan (dibatasi 0,35–1,3). */
export function portionFactor(akg) {
  return Math.min(1.3, Math.max(0.35, akg.kcal / REFERENCE_KCAL));
}

/** Indeks Massa Tubuh untuk usia ≥ 18 tahun (klasifikasi Kemenkes RI). */
export function bmiInfo(member, refDate = todayLocal()) {
  const age = ageAt(member.birth_date, refDate);
  if (!member.weight || !member.height || age < 18) return null;
  const bmi = member.weight / (member.height / 100) ** 2;
  let category;
  if (bmi < 17) category = 'Sangat kurus';
  else if (bmi < 18.5) category = 'Kurus';
  else if (bmi <= 25) category = 'Normal';
  else if (bmi <= 27) category = 'Gemuk';
  else category = 'Obesitas';
  return { value: Math.round(bmi * 10) / 10, category };
}

/** Membentuk objek anggota lengkap (usia, AKG, IMT) untuk dikirim ke klien. */
export function enrichMember(m, refDate = todayLocal()) {
  return {
    ...m,
    age: Math.floor(ageAt(m.birth_date, refDate) * 10) / 10,
    akg: getAKG(m, refDate),
    bmi: bmiInfo(m, refDate),
  };
}
