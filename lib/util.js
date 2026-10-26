// Utilitas bersama: error HTTP, validasi input, dan operasi tanggal (format YYYY-MM-DD).
import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const bad = (msg) => new HttpError(400, msg);

/* ------------------------------ Validasi ------------------------------ */

export function reqString(value, label, { min = 1, max = 120 } = {}) {
  if (typeof value !== 'string') throw bad(`${label} wajib diisi`);
  const v = value.trim();
  if (v.length < min) throw bad(min <= 1 ? `${label} wajib diisi` : `${label} minimal ${min} karakter`);
  if (v.length > max) throw bad(`${label} maksimal ${max} karakter`);
  return v;
}

export function optString(value, label, opts) {
  if (value === undefined || value === null || value === '') return null;
  return reqString(value, label, opts);
}

export function reqNumber(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw bad(`${label} harus berupa angka`);
  if (n < min || n > max) throw bad(`${label} harus di antara ${min} dan ${max}`);
  return n;
}

export function optNumber(value, label, opts) {
  if (value === undefined || value === null || value === '') return null;
  return reqNumber(value, label, opts);
}

export function reqId(value, label = 'ID') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw bad(`${label} tidak valid`);
  return n;
}

export function oneOf(value, list, label) {
  if (!list.includes(value)) throw bad(`${label} tidak valid`);
  return value;
}

/* ------------------------------ Tanggal ------------------------------ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function reqDate(value, label = 'Tanggal') {
  if (!isValidDate(value)) throw bad(`${label} tidak valid (format YYYY-MM-DD)`);
  return value;
}

export function addDays(s, n) {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function mondayOf(s) {
  const dow = (new Date(`${s}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(s, -dow);
}

export function dateRange(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Usia dalam tahun (desimal) pada tanggal referensi. */
export function ageAt(birthDate, refDate) {
  const b = new Date(`${birthDate}T00:00:00Z`);
  const r = new Date(`${refDate}T00:00:00Z`);
  let years = r.getUTCFullYear() - b.getUTCFullYear();
  const mDiff = r.getUTCMonth() - b.getUTCMonth();
  const dDiff = r.getUTCDate() - b.getUTCDate();
  if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) years--;
  const lastBday = new Date(Date.UTC(b.getUTCFullYear() + years, b.getUTCMonth(), b.getUTCDate()));
  const nextBday = new Date(Date.UTC(b.getUTCFullYear() + years + 1, b.getUTCMonth(), b.getUTCDate()));
  const frac = (r - lastBday) / (nextBday - lastBday);
  return Math.max(0, years + (Number.isFinite(frac) ? frac : 0));
}

/** Memvalidasi rentang tanggal dari query (?start=&end=), maksimal `maxDays` hari. */
export function parseRange(query = {}, maxDays = 62) {
  const start = reqDate(query.start, 'Tanggal awal');
  const end = reqDate(query.end ?? query.start, 'Tanggal akhir');
  if (end < start) throw bad('Tanggal akhir harus setelah tanggal awal');
  if (diffDays(start, end) + 1 > maxDays) throw bad(`Rentang maksimal ${maxDays} hari`);
  return { start, end };
}

/* ------------------------------ Keamanan ------------------------------ */

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export const newToken = () => crypto.randomBytes(32).toString('hex');
