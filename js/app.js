/* Rekap: aplikasi catatan keuangan pribadi.
   Data: localStorage key "rekap.v1". Offline, tanpa dependency. */
'use strict';

// ===== Konstanta =====
const STORAGE_KEY = 'rekap.v1';
const OUT_CATS = ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'];
const IN_CATS = ['Pekerjaan', 'Sampingan', 'Penjualan', 'Investasi', 'Lainnya'];
const CAT_INPUT_SELECTORS = {
  Makan: '#b-cat-makan',
  Transport: '#b-cat-transport',
  Belanja: '#b-cat-belanja',
  Tagihan: '#b-cat-tagihan',
  Kesehatan: '#b-cat-kesehatan',
  Hiburan: '#b-cat-hiburan',
  Lainnya: '#b-cat-lainnya'
};
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAY_ABBR = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const VIEW_NAMES = ['dasbor', 'transaksi', 'anggaran'];

// ===== Util =====
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 't-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

function fmtRupiah(n) { return 'Rp ' + Math.abs(Math.round(n)).toLocaleString('id-ID'); }
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dayLabel(ds) {
  const p = ds.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  return DAY_ABBR[d.getDay()] + ', ' + p[2] + ' ' + MONTH_ABBR[p[1] - 1] + ' ' + p[0];
}
function monthKeyOf(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }
function monthNameLabel(mk) {
  const p = mk.split('-');
  return MONTH_NAMES[Number(p[1]) - 1] + ' ' + p[0];
}

// Angka: boleh diketik 50000, 50.000, atau 50 000. Hasil harus integer > 0.
function toDigits(raw) {
  const d = String(raw).replace(/[^\d]/g, '');
  if (!d) return NaN;
  const n = Number(d);
  return Number.isFinite(n) ? n : NaN;
}
function parseAmount(raw) {
  const n = toDigits(raw);
  return n > 0 && n <= 1e12 ? n : NaN;
}
function parseBudgetValue(raw) {
  const t = String(raw).trim();
  if (t === '') return null;
  const n = toDigits(t);
  return n > 0 && n <= 1e12 ? n : NaN;
}

// ===== Penyimpanan =====
let storageAvailable = true;
try {
  const probe = '__rekap_probe__';
  localStorage.setItem(probe, '1');
  localStorage.removeItem(probe);
} catch (e) {
  storageAvailable = false;
}

let db = { txns: [], budgets: { total: null, categories: {} } };
let corrupted = false;

function normalizeTxn(t) {
  if (!t || typeof t !== 'object') return null;
  const type = t.type === 'in' ? 'in' : (t.type === 'out' ? 'out' : null);
  if (!type) return null;
  const amount = Number(t.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const date = String(t.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    id: String(t.id || uid()),
    type: type,
    category: String(t.category || 'Lainnya'),
    desc: String(t.desc || ''),
    amount: Math.round(amount),
    date: date
  };
}

function normalizeBudgets(b) {
  if (!b || typeof b !== 'object') return { total: null, categories: {} };
  const cats = {};
  if (b.categories && typeof b.categories === 'object') {
    for (const k of Object.keys(b.categories)) {
      const v = Number(b.categories[k]);
      if (Number.isFinite(v) && v > 0) cats[k] = v;
    }
  }
  const total = Number(b.total);
  return { total: Number.isFinite(total) && total > 0 ? total : null, categories: cats };
}

function loadDB() {
  if (!storageAvailable) return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object' || !Array.isArray(d.txns)) {
      throw new Error('bentuk data tidak dikenali');
    }
    db.txns = d.txns.map(normalizeTxn).filter(Boolean);
    db.budgets = normalizeBudgets(d.budgets);
    corrupted = false;
  } catch (e) {
    corrupted = true;
  }
}

function persist() {
  if (!storageAvailable || corrupted) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    storageAvailable = false;
    showBanner();
  }
}

function resetAll() {
  db = { txns: [], budgets: { total: null, categories: {} } };
  corrupted = false;
  if (storageAvailable) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* abaikan */ }
  }
}

function showBanner() {
  const banner = $('#banner-storage');
  if (corrupted) {
    banner.hidden = false;
    banner.setAttribute('role', 'alert');
    banner.innerHTML =
      '<span>Data lokal tidak bisa dibaca karena formatnya rusak. Kamu bisa menghapus semua data dan memulai dari awal.</span>' +
      '<button type="button" class="btn" id="banner-reset">Mulai dari awal</button>';
    $('#banner-reset').addEventListener('click', () => {
      resetAll();
      showBanner();
      renderAll();
      showToast('Data dihapus. Mulai dari awal.');
    });
  } else if (!storageAvailable) {
    banner.hidden = false;
    banner.setAttribute('role', 'alert');
    banner.innerHTML = '<span>Penyimpanan browser tidak tersedia. Data tidak akan bertahan setelah halaman ditutup.</span>';
  } else {
    banner.hidden = true;
    banner.removeAttribute('role');
    banner.innerHTML = '';
  }
}

// ===== State tampilan =====
const nowD = new Date();
const viewed = { y: nowD.getFullYear(), m: nowD.getMonth() };
const filters = { month: todayISO().slice(0, 7), type: 'all', cat: 'all' };
let firstRoute = true;

function txnsInMonth(y, m) {
  const k = monthKeyOf(y, m);
  return db.txns.filter((t) => t.date.startsWith(k));
}
function sumByType(list, type) {
  let s = 0;
  for (const t of list) if (t.type === type) s += t.amount;
  return s;
}
function emptyBlock(title, sub) {
  return '<div class="empty"><p class="empty-title">' + title + '</p><p class="empty-sub">' + sub + '</p></div>';
}

// ===== Dasbor =====
function txnRowHtml(t) {
  const isOut = t.type === 'out';
  return '<div class="txn-row">' +
    '<span class="chip">' + escapeHtml(t.category) + '</span>' +
    '<span class="txn-info"><span class="txn-desc">' + escapeHtml(t.desc || 'Tanpa keterangan') + '</span>' +
    '<span class="txn-meta">' + (isOut ? 'Pengeluaran' : 'Pemasukan') + '</span></span>' +
    '<span class="txn-amt num ' + (isOut ? 'neg' : 'pos') + '">' + (isOut ? '−' : '+') + fmtRupiah(t.amount) + '</span>' +
    '<button type="button" class="btn ghost small" data-action="delete-txn" data-id="' + t.id + '">Hapus</button>' +
  '</div>';
}

function renderDasbor() {
  const mName = MONTH_NAMES[viewed.m];
  $('#month-label').textContent = mName + ' ' + viewed.y;

  const allIn = sumByType(db.txns, 'in');
  const allOut = sumByType(db.txns, 'out');
  const bal = allIn - allOut;
  const balEl = $('#dash-balance');
  balEl.textContent = (bal < 0 ? '−' : '') + fmtRupiah(bal);
  balEl.classList.toggle('neg', bal < 0);
  balEl.classList.toggle('pos', bal > 0);
  $('#dash-balance-sub').textContent = db.txns.length
    ? db.txns.length + ' transaksi tercatat sejak awal.'
    : 'Belum ada transaksi tercatat.';

  const mTxns = txnsInMonth(viewed.y, viewed.m);
  const mIn = sumByType(mTxns, 'in');
  const mOut = sumByType(mTxns, 'out');
  const totalBud = db.budgets.total;
  const sisa = totalBud === null ? null : totalBud - mOut;
  $('#dash-stats').innerHTML =
    '<div class="stat"><div class="stat-label">Masuk ' + mName + '</div>' +
    '<div class="stat-val num pos">' + fmtRupiah(mIn) + '</div></div>' +
    '<div class="stat"><div class="stat-label">Keluar ' + mName + '</div>' +
    '<div class="stat-val num neg">' + fmtRupiah(mOut) + '</div></div>' +
    '<div class="stat"><div class="stat-label">Sisa anggaran</div>' +
    (sisa === null
      ? '<div class="stat-val" style="color:var(--muted)">Belum diatur</div>'
      : '<div class="stat-val num ' + (sisa < 0 ? 'neg' : 'pos') + '">' + (sisa < 0 ? '−' : '') + fmtRupiah(sisa) + '</div>') +
    '</div>';

  // Bar top 5 kategori pengeluaran bulan terpilih
  const byCat = {};
  for (const t of mTxns) if (t.type === 'out') byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catsEl = $('#dash-cats');
  if (!top.length) {
    catsEl.innerHTML = emptyBlock('Belum ada pengeluaran di ' + mName + '.', 'Catat pengeluaran lewat menu Transaksi.');
  } else {
    const max = top[0][1];
    catsEl.innerHTML = top.map((pair) =>
      '<div class="cat-row">' +
      '<span class="cat-label">' + escapeHtml(pair[0]) + '</span>' +
      '<span class="bar-track"><span class="bar-fill" style="width:' + Math.round(pair[1] / max * 100) + '%"></span></span>' +
      '<span class="cat-amt num">' + fmtRupiah(pair[1]) + '</span>' +
      '</div>'
    ).join('');
  }

  // 5 transaksi terakhir (seluruh data)
  const recentEl = $('#dash-recent');
  if (!db.txns.length) {
    recentEl.innerHTML = emptyBlock('Belum ada transaksi.', 'Mulai catat lewat menu Transaksi.');
  } else {
    const idx = new Map(db.txns.map((t, i) => [t.id, i]));
    const sorted = db.txns
      .slice()
      .sort((a, b) => (a.date === b.date ? idx.get(b.id) - idx.get(a.id) : (a.date < b.date ? 1 : -1)));
    recentEl.innerHTML =
      sorted.slice(0, 5).map(txnRowHtml).join('') +
      '<div class="link-more-wrap"><a class="link-more" href="#transaksi">Lihat semua</a></div>';
  }
}

// ===== Transaksi =====
function buildFilterOptions() {
  const ms = $('#f-month');
  const cur = todayISO().slice(0, 7);
  const set = new Set(db.txns.map((t) => t.date.slice(0, 7)));
  set.add(cur);
  const months = Array.from(set).sort().reverse();
  const had = ms.value;
  ms.innerHTML = months.map((mk) => '<option value="' + mk + '">' + monthNameLabel(mk) + '</option>').join('');
  if (had && months.includes(had)) {
    ms.value = had;
  } else {
    ms.value = db.txns.some((t) => t.date.startsWith(cur)) ? cur : months[0];
  }
  filters.month = ms.value;
  buildCatOptions();
}

function buildCatOptions() {
  const sel = $('#f-cat');
  const had = sel.value;
  let opts = '<option value="all">Semua</option>';
  const group = (label, cats) => {
    opts += '<optgroup label="' + label + '">' +
      cats.map((c) => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('') +
      '</optgroup>';
  };
  if (filters.type === 'out') group('Pengeluaran', OUT_CATS);
  else if (filters.type === 'in') group('Pemasukan', IN_CATS);
  else { group('Pengeluaran', OUT_CATS); group('Pemasukan', IN_CATS); }
  sel.innerHTML = opts;
  if (had !== 'all' && Array.from(sel.options).some((o) => o.value === had)) {
    sel.value = had;
  } else {
    sel.value = 'all';
  }
  filters.cat = sel.value;
}

function renderTxnList() {
  const listEl = $('#txn-list');
  const filtered = db.txns.filter((t) =>
    t.date.startsWith(filters.month) &&
    (filters.type === 'all' || t.type === filters.type) &&
    (filters.cat === 'all' || t.category === filters.cat));
  $('#txn-count').textContent = filtered.length + ' transaksi';

  if (!db.txns.length) {
    listEl.innerHTML = emptyBlock('Belum ada transaksi.', 'Catat transaksi pertamamu lewat form di atas.');
    return;
  }
  if (!filtered.length) {
    listEl.innerHTML = emptyBlock('Tidak ada transaksi yang cocok.', 'Ubah filter bulan, jenis, atau kategori.');
    return;
  }

  const idx = new Map(db.txns.map((t, i) => [t.id, i]));
  const groups = new Map();
  for (const t of filtered) {
    if (!groups.has(t.date)) groups.set(t.date, []);
    groups.get(t.date).push(t);
  }
  const dates = Array.from(groups.keys()).sort().reverse();
  listEl.innerHTML = dates.map((ds) => {
    const rows = groups.get(ds).sort((a, b) => idx.get(b.id) - idx.get(a.id));
    const net = rows.reduce((s, t) => s + (t.type === 'in' ? t.amount : -t.amount), 0);
    const netLabel = net === 0 ? 'Rp 0' : (net > 0 ? '+' : '−') + fmtRupiah(net);
    return '<div class="day">' +
      '<div class="day-head"><span class="day-date">' + dayLabel(ds) + '</span>' +
      '<span class="day-net num ' + (net > 0 ? 'pos' : net < 0 ? 'neg' : '') + '">' + netLabel + '</span></div>' +
      rows.map(txnRowHtml).join('') +
      '</div>';
  }).join('');
}

function addTxn(type, category, desc, amount, date) {
  db.txns.push({ id: uid(), type: type, category: category, desc: desc, amount: Math.round(amount), date: date });
  persist();
  renderAll();
}

function deleteTxn(id) {
  db.txns = db.txns.filter((t) => t.id !== id);
  persist();
  renderAll();
}

function exportCSV() {
  if (!db.txns.length) {
    showToast('Belum ada transaksi untuk diunduh.');
    return;
  }
  const rows = [['jenis', 'kategori', 'deskripsi', 'jumlah', 'tanggal']];
  for (const t of db.txns) rows.push([t.type, t.category, t.desc || 'Tanpa keterangan', String(t.amount), t.date]);
  const field = (s) => {
    s = String(s);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = rows.map((r) => r.map(field).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rekap-transaksi.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Unduhan dimulai: rekap-transaksi.csv');
}

// ===== Anggaran =====
function renderBudgetForm() {
  const b = db.budgets;
  $('#b-total').value = b.total !== null ? String(b.total) : '';
  for (const [name, sel] of Object.entries(CAT_INPUT_SELECTORS)) {
    $(sel).value = b.categories[name] !== undefined ? String(b.categories[name]) : '';
  }
}

function budRow(label, pct, over, note) {
  return '<div class="bud-row">' +
    '<span class="bud-label">' + escapeHtml(label) + '</span>' +
    '<span class="bar-track"><span class="bar-fill' + (over ? ' over' : '') + '" style="width:' + pct + '%"></span></span>' +
    '<span class="bud-note num' + (over ? ' over-text' : '') + '">' + note + '</span>' +
    '</div>';
}

function renderBudgetStatus() {
  const el = $('#budget-status');
  const b = db.budgets;
  const hasAny = b.total !== null || Object.keys(b.categories).length > 0;
  if (!hasAny) {
    el.innerHTML = emptyBlock('Anggaran belum diatur.', 'Isi form di atas lalu tekan Simpan anggaran.');
    return;
  }
  const d = new Date();
  const curTxns = txnsInMonth(d.getFullYear(), d.getMonth());
  const spent = sumByType(curTxns, 'out');
  const spentByCat = {};
  for (const t of curTxns) if (t.type === 'out') spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount;

  let rows = '<div class="bud-summary">Pengeluaran bulan ini <span class="num">' + fmtRupiah(spent) + '</span></div>';
  if (b.total !== null) {
    const diff = b.total - spent;
    const over = diff < 0;
    rows += budRow('Total', Math.min(100, Math.round(spent / b.total * 100)), over,
      over ? 'Lewat ' + fmtRupiah(-diff) : 'Sisa ' + fmtRupiah(diff));
  }
  for (const [name, limit] of Object.entries(b.categories)) {
    const s = spentByCat[name] || 0;
    const diff = limit - s;
    const over = diff < 0;
    rows += budRow(name, Math.min(100, Math.round(s / limit * 100)), over,
      over ? 'Lewat ' + fmtRupiah(-diff) : 'Sisa ' + fmtRupiah(diff));
  }
  el.innerHTML = rows;
}

function saveBudgets() {
  const totalF = $('#b-total');
  let firstBad = null;
  [totalF].concat(Object.values(CAT_INPUT_SELECTORS).map((s) => $(s)))
    .forEach((f) => f.classList.remove('invalid'));

  const cats = {};
  for (const [name, sel] of Object.entries(CAT_INPUT_SELECTORS)) {
    const f = $(sel);
    const v = parseBudgetValue(f.value);
    if (Number.isNaN(v)) {
      f.classList.add('invalid');
      if (!firstBad) firstBad = f;
    } else if (v !== null) {
      cats[name] = v;
    }
  }
  const totalV = parseBudgetValue(totalF.value);
  if (Number.isNaN(totalV)) {
    totalF.classList.add('invalid');
    if (!firstBad) firstBad = totalF;
  }
  if (firstBad) {
    firstBad.focus();
    showToast('Angka anggaran tidak valid. Gunakan angka rupiah bulat, contoh: 5000000.');
    return;
  }
  db.budgets = { total: totalV, categories: cats };
  persist();
  renderBudgetStatus();
  renderDasbor();
  showToast('Anggaran disimpan.');
}

// ===== Modal hapus =====
let modalOpen = false;
let lastFocused = null;
let modalKeyHandler = null;

function openDeleteModal(id, trigger) {
  const t = db.txns.find((x) => x.id === id);
  if (!t || modalOpen) return;
  lastFocused = trigger;
  const root = $('#modal-root');
  root.hidden = false;
  root.innerHTML =
    '<div class="modal-backdrop">' +
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
    '<h2 id="modal-title">Hapus transaksi ini?</h2>' +
    '<p>' + escapeHtml(t.desc || 'Tanpa keterangan') + ' ' + (t.type === 'out' ? '−' : '+') + fmtRupiah(t.amount) + ' ' + dayLabel(t.date) + '</p>' +
    '<div class="modal-actions">' +
    '<button type="button" class="btn ghost" id="modal-cancel">Batal</button>' +
    '<button type="button" class="btn" id="modal-confirm">Hapus</button>' +
    '</div></div></div>';

  const cancel = $('#modal-cancel', root);
  const confirm = $('#modal-confirm', root);
  const backdrop = $('.modal-backdrop', root);

  cancel.addEventListener('click', closeDeleteModal);
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) closeDeleteModal();
  });
  confirm.addEventListener('click', () => {
    deleteTxn(id);
    closeDeleteModal();
    showToast('Transaksi dihapus.');
  });

  modalKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeDeleteModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = $$('#modal-root button');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener('keydown', modalKeyHandler);
  modalOpen = true;
  confirm.focus();
}

function closeDeleteModal() {
  if (!modalOpen) return;
  modalOpen = false;
  document.removeEventListener('keydown', modalKeyHandler);
  const root = $('#modal-root');
  root.hidden = true;
  root.innerHTML = '';
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  else {
    const h1 = $('#t-transaksi');
    if (h1) h1.focus();
  }
  lastFocused = null;
}

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3000);
}

// ===== Routing =====
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const v = VIEW_NAMES.includes(h) ? h : 'dasbor';
  for (const name of VIEW_NAMES) {
    $('#view-' + name).hidden = name !== v;
  }
  $$('.nav a').forEach((a) => a.removeAttribute('aria-current'));
  const active = $('.nav a[href="#' + v + '"]');
  if (active) active.setAttribute('aria-current', 'page');
  if (firstRoute) {
    firstRoute = false;
  } else {
    const h1 = $('#t-' + v);
    if (h1) h1.focus();
  }
}

// ===== Form transaksi =====
function syncRadioPills() {
  $$('.radio-pill').forEach((p) => {
    p.classList.toggle('is-checked', p.querySelector('input').checked);
  });
}

function buildTypeCatOptions(type) {
  const sel = $('#t-cat');
  const cats = type === 'in' ? IN_CATS : OUT_CATS;
  sel.innerHTML = cats.map((c) => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('');
}

function submitTxnForm() {
  const errEl = $('#form-error');
  errEl.hidden = true;
  const type = $('input[name="txn-type"]:checked').value;
  const cat = $('#t-cat').value;
  const desc = $('#f-desc').value.trim();
  const amountF = $('#f-amount');
  const dateF = $('#f-date');
  const amount = parseAmount(amountF.value);

  amountF.classList.remove('invalid');
  dateF.classList.remove('invalid');
  let firstBad = null;
  if (!Number.isFinite(amount)) firstBad = amountF;
  else if (!dateF.value) firstBad = dateF;

  if (firstBad) {
    errEl.textContent = !Number.isFinite(amount)
      ? 'Jumlah tidak valid. Masukkan angka rupiah bulat, contoh: 50000.'
      : 'Pilih tanggal transaksi.';
    errEl.hidden = false;
    firstBad.classList.add('invalid');
    firstBad.focus();
    return;
  }
  addTxn(type, cat, desc, amount, dateF.value);
  amountF.value = '';
  $('#f-desc').value = '';
  showToast('Transaksi dicatat.');
}

// ===== Render semua =====
function renderAll() {
  renderDasbor();
  buildFilterOptions();
  renderTxnList();
  renderBudgetForm();
  renderBudgetStatus();
}

// ===== Inisialisasi =====
function init() {
  loadDB();
  showBanner();

  $('#f-date').value = todayISO();
  buildTypeCatOptions('out');
  syncRadioPills();

  // Radio jenis: kategori ikut jenis
  $$('input[name="txn-type"]').forEach((r) => {
    r.addEventListener('change', () => {
      const type = $('input[name="txn-type"]:checked').value;
      buildTypeCatOptions(type);
      syncRadioPills();
    });
  });

  // Form transaksi
  $('#txn-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submitTxnForm();
  });
  ['input', 'change'].forEach((ev) => {
    $('#f-amount').addEventListener(ev, () => $('#f-amount').classList.remove('invalid'));
  });
  $('#f-date').addEventListener('input', () => $('#f-date').classList.remove('invalid'));

  // Filter
  $('#f-month').addEventListener('change', (e) => {
    filters.month = e.target.value;
    renderTxnList();
  });
  $('#f-type').addEventListener('change', (e) => {
    filters.type = e.target.value;
    buildCatOptions();
    renderTxnList();
  });
  $('#f-cat').addEventListener('change', (e) => {
    filters.cat = e.target.value;
    renderTxnList();
  });

  // Form anggaran
  $('#budget-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveBudgets();
  });
  for (const sel of Object.values(CAT_INPUT_SELECTORS)) {
    $(sel).addEventListener('input', () => $(sel).classList.remove('invalid'));
  }
  $('#b-total').addEventListener('input', () => $('#b-total').classList.remove('invalid'));

  // Aksi tombol (delegasi data-action)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'month-prev') {
      viewed.m -= 1;
      if (viewed.m < 0) { viewed.m = 11; viewed.y -= 1; }
      renderDasbor();
    } else if (action === 'month-next') {
      viewed.m += 1;
      if (viewed.m > 11) { viewed.m = 0; viewed.y += 1; }
      renderDasbor();
    } else if (action === 'export') {
      exportCSV();
    } else if (action === 'delete-txn') {
      openDeleteModal(btn.dataset.id, btn);
    }
  });

  // Routing hash
  window.addEventListener('hashchange', route);
  if (!location.hash) history.replaceState(null, '', '#dasbor');
  route();

  renderAll();
}

init();
