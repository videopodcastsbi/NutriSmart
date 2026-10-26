// Data pangan bawaan NutriSmart.
// Nilai gizi per 100 gram bagian dapat dimakan (siap santap), dibulatkan dan mengacu pada
// Tabel Komposisi Pangan Indonesia (TKPI, Kemenkes RI) serta USDA FoodData Central.
// Format: [nama, kategori, kkal, protein, lemak, karbohidrat, serat, nama_porsi, gram_porsi, rekomendasi_generator]

export const FOODS = [
  // ---------- Makanan pokok ----------
  ['Nasi putih', 'pokok', 180, 3.0, 0.3, 39.8, 0.2, 'centong', 100, 1],
  ['Nasi merah', 'pokok', 149, 2.8, 0.4, 32.5, 0.3, 'centong', 100, 1],
  ['Bubur nasi', 'pokok', 72, 1.2, 0.2, 15.8, 0.1, 'mangkuk', 250, 0],
  ['Lontong', 'pokok', 144, 1.9, 0.2, 31.7, 0.2, 'potong', 100, 0],
  ['Kentang rebus', 'pokok', 87, 1.9, 0.1, 20.1, 1.8, 'buah sedang', 150, 1],
  ['Ubi jalar rebus', 'pokok', 86, 1.6, 0.1, 20.1, 3.0, 'buah sedang', 135, 1],
  ['Singkong rebus', 'pokok', 154, 1.0, 0.3, 36.8, 0.9, 'potong', 120, 0],
  ['Jagung rebus', 'pokok', 96, 3.4, 1.5, 21.0, 2.4, 'tongkol', 125, 1],
  ['Roti tawar', 'pokok', 248, 8.0, 1.2, 50.0, 2.4, 'lembar', 25, 0],
  ['Roti gandum', 'pokok', 247, 13.0, 3.4, 41.0, 7.0, 'lembar', 30, 1],
  ['Oatmeal', 'pokok', 389, 16.9, 6.9, 66.3, 10.6, 'sajian (3 sdm)', 30, 1],
  ['Mi telur rebus', 'pokok', 138, 4.5, 2.1, 25.0, 1.2, 'piring', 150, 0],
  ['Bihun rebus', 'pokok', 109, 0.9, 0.2, 25.0, 1.0, 'piring', 150, 0],
  ['Nasi goreng', 'pokok', 170, 5.0, 6.5, 23.0, 1.0, 'piring', 250, 0],
  ['Mi goreng', 'pokok', 186, 4.5, 8.0, 24.0, 1.3, 'piring', 200, 0],

  // ---------- Lauk hewani ----------
  ['Telur ayam rebus', 'lauk_hewani', 155, 12.6, 10.6, 1.1, 0, 'butir', 55, 1],
  ['Telur dadar', 'lauk_hewani', 196, 11.0, 15.5, 1.4, 0, 'butir', 60, 1],
  ['Dada ayam rebus', 'lauk_hewani', 165, 31.0, 3.6, 0, 0, 'potong sedang', 75, 1],
  ['Ayam goreng', 'lauk_hewani', 260, 25.0, 16.0, 4.0, 0, 'potong', 80, 0],
  ['Ayam bakar', 'lauk_hewani', 190, 27.0, 8.0, 2.0, 0, 'potong', 80, 1],
  ['Ikan nila bakar', 'lauk_hewani', 128, 26.0, 2.7, 0, 0, 'ekor', 100, 1],
  ['Ikan kembung goreng', 'lauk_hewani', 210, 21.0, 13.0, 1.0, 0, 'ekor', 80, 1],
  ['Ikan lele goreng', 'lauk_hewani', 240, 18.6, 16.8, 3.6, 0, 'ekor', 100, 0],
  ['Ikan bandeng presto', 'lauk_hewani', 220, 20.0, 15.0, 0, 0, 'potong', 80, 1],
  ['Pepes ikan mas', 'lauk_hewani', 150, 18.0, 7.5, 2.5, 0.5, 'bungkus', 100, 1],
  ['Ikan teri goreng', 'lauk_hewani', 330, 40.0, 17.0, 3.0, 0, 'sendok makan', 15, 0],
  ['Daging sapi rendang', 'lauk_hewani', 193, 22.6, 7.9, 7.8, 0.5, 'potong', 50, 0],
  ['Semur daging sapi', 'lauk_hewani', 180, 18.0, 9.0, 6.0, 0.3, 'potong', 60, 1],
  ['Udang rebus', 'lauk_hewani', 99, 24.0, 0.3, 0.2, 0, 'sajian (5 ekor)', 50, 1],
  ['Hati ayam', 'lauk_hewani', 167, 24.5, 6.5, 0.9, 0, 'buah', 30, 0],
  ['Bakso sapi', 'lauk_hewani', 190, 10.4, 12.6, 8.0, 0.3, 'sajian (5 butir)', 75, 0],
  ['Soto ayam', 'lauk_hewani', 55, 4.5, 3.0, 3.0, 0.4, 'mangkuk', 300, 0],

  // ---------- Lauk nabati ----------
  ['Tempe goreng', 'lauk_nabati', 335, 20.0, 26.0, 8.0, 1.4, 'potong', 50, 1],
  ['Tempe bacem', 'lauk_nabati', 230, 17.0, 10.0, 18.0, 1.4, 'potong', 50, 1],
  ['Tempe kukus', 'lauk_nabati', 201, 20.8, 8.8, 13.5, 1.4, 'potong', 50, 1],
  ['Tahu goreng', 'lauk_nabati', 115, 9.7, 8.5, 2.5, 0.1, 'potong', 50, 1],
  ['Tahu kukus', 'lauk_nabati', 80, 10.9, 4.7, 0.8, 0.1, 'potong', 50, 1],
  ['Pepes tahu', 'lauk_nabati', 95, 9.0, 5.5, 2.5, 0.5, 'bungkus', 80, 1],
  ['Kacang hijau rebus', 'lauk_nabati', 105, 7.0, 0.4, 19.0, 7.6, 'mangkuk kecil', 100, 0],
  ['Kacang merah rebus', 'lauk_nabati', 127, 8.7, 0.5, 22.8, 6.4, 'mangkuk kecil', 100, 0],
  ['Oncom goreng', 'lauk_nabati', 187, 13.0, 6.0, 22.6, 4.0, 'potong', 50, 0],
  ['Perkedel kentang', 'lauk_nabati', 180, 4.0, 9.0, 21.0, 1.5, 'buah', 50, 0],

  // ---------- Sayuran ----------
  ['Sayur bayam bening', 'sayur', 23, 3.0, 0.3, 3.8, 2.4, 'mangkuk', 150, 1],
  ['Tumis kangkung', 'sayur', 60, 3.0, 4.0, 4.0, 2.5, 'piring kecil', 100, 1],
  ['Sayur asem', 'sayur', 29, 0.7, 0.6, 5.0, 2.5, 'mangkuk', 200, 1],
  ['Sayur sop', 'sayur', 35, 1.5, 1.3, 4.5, 1.6, 'mangkuk', 200, 1],
  ['Sayur lodeh', 'sayur', 70, 2.0, 5.0, 5.0, 2.0, 'mangkuk', 150, 1],
  ['Capcay', 'sayur', 70, 3.0, 4.0, 6.0, 2.0, 'piring kecil', 150, 1],
  ['Tumis buncis wortel', 'sayur', 60, 2.0, 3.5, 6.0, 3.0, 'piring kecil', 100, 1],
  ['Brokoli rebus', 'sayur', 35, 2.4, 0.4, 7.2, 3.3, 'mangkuk kecil', 100, 1],
  ['Wortel rebus', 'sayur', 35, 0.8, 0.2, 8.2, 3.0, 'mangkuk kecil', 100, 0],
  ['Sawi hijau rebus', 'sayur', 20, 2.0, 0.3, 3.0, 2.0, 'mangkuk kecil', 100, 1],
  ['Urap sayur', 'sayur', 110, 4.0, 7.0, 9.0, 4.0, 'piring kecil', 100, 1],
  ['Gado-gado', 'sayur', 137, 6.0, 9.0, 9.0, 3.0, 'piring', 200, 0],
  ['Lalapan (timun, kemangi, kol)', 'sayur', 18, 0.9, 0.2, 3.6, 1.2, 'piring kecil', 75, 0],
  ['Tomat segar', 'sayur', 18, 0.9, 0.2, 3.9, 1.2, 'buah', 100, 0],

  // ---------- Buah ----------
  ['Pisang ambon', 'buah', 89, 1.1, 0.3, 22.8, 2.6, 'buah', 100, 1],
  ['Pepaya', 'buah', 43, 0.5, 0.3, 10.8, 1.7, 'potong', 150, 1],
  ['Jeruk manis', 'buah', 47, 0.9, 0.1, 11.8, 2.4, 'buah', 110, 1],
  ['Apel', 'buah', 52, 0.3, 0.2, 13.8, 2.4, 'buah', 150, 1],
  ['Semangka', 'buah', 30, 0.6, 0.2, 7.6, 0.4, 'potong', 180, 1],
  ['Mangga harum manis', 'buah', 60, 0.8, 0.4, 15.0, 1.6, 'setengah buah', 125, 1],
  ['Alpukat', 'buah', 160, 2.0, 14.7, 8.5, 6.7, 'setengah buah', 100, 0],
  ['Jambu biji', 'buah', 68, 2.6, 1.0, 14.3, 5.4, 'buah', 100, 1],
  ['Melon', 'buah', 34, 0.8, 0.2, 8.2, 0.9, 'potong', 150, 1],
  ['Salak', 'buah', 82, 0.4, 0.4, 20.9, 4.2, 'sajian (2 buah)', 65, 0],
  ['Nanas', 'buah', 50, 0.5, 0.1, 13.0, 1.4, 'potong', 100, 0],
  ['Buah naga merah', 'buah', 60, 1.2, 0.1, 13.0, 3.0, 'potong', 125, 1],

  // ---------- Susu & olahan ----------
  ['Susu sapi full cream', 'susu', 61, 3.2, 3.3, 4.8, 0, 'gelas', 200, 1],
  ['Susu rendah lemak', 'susu', 42, 3.4, 1.0, 5.0, 0, 'gelas', 200, 0],
  ['Yoghurt plain', 'susu', 61, 3.5, 3.3, 4.7, 0, 'cup', 100, 1],
  ['Keju cheddar', 'susu', 403, 25.0, 33.0, 1.3, 0, 'lembar', 20, 0],
  ['Susu kedelai', 'susu', 54, 3.3, 1.8, 6.0, 0.6, 'gelas', 200, 0],

  // ---------- Minuman ----------
  ['Air putih', 'minuman', 0, 0, 0, 0, 0, 'gelas', 250, 0],
  ['Teh manis', 'minuman', 32, 0, 0, 8.0, 0, 'gelas', 250, 0],
  ['Teh tawar', 'minuman', 1, 0, 0, 0.3, 0, 'gelas', 250, 0],
  ['Kopi susu', 'minuman', 70, 1.5, 2.5, 10.5, 0, 'gelas', 200, 0],
  ['Jus jeruk tanpa gula', 'minuman', 45, 0.7, 0.2, 10.4, 0.2, 'gelas', 200, 0],

  // ---------- Camilan ----------
  ['Pisang goreng', 'camilan', 220, 2.0, 9.0, 35.0, 2.0, 'buah', 60, 0],
  ['Bakwan sayur', 'camilan', 280, 6.0, 16.0, 28.0, 2.0, 'buah', 40, 0],
  ['Kerupuk', 'camilan', 500, 2.0, 25.0, 65.0, 0, 'buah', 10, 0],
  ['Biskuit', 'camilan', 458, 7.0, 18.0, 68.0, 2.0, 'sajian (3 keping)', 25, 0],
  ['Kacang tanah sangrai', 'camilan', 585, 24.0, 50.0, 21.0, 8.0, 'genggam', 15, 0],
  ['Kue lapis', 'camilan', 230, 1.5, 6.0, 43.0, 0.5, 'potong', 50, 0],
  ['Ubi goreng', 'camilan', 190, 1.5, 8.0, 29.0, 3.0, 'potong', 60, 0],
];

export const CATEGORIES = ['pokok', 'lauk_hewani', 'lauk_nabati', 'sayur', 'buah', 'susu', 'minuman', 'camilan'];
