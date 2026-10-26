// Menghapus file database agar data awal dibuat ulang saat server dijalankan kembali.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
for (const f of ['nutrismart.db', 'nutrismart.db-wal', 'nutrismart.db-shm']) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    fs.rmSync(p);
    console.log('Dihapus:', p);
  }
}
console.log('Database direset. Jalankan "npm start" untuk membuat data awal kembali.');
