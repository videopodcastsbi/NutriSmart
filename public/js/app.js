// =========================================================================
// NutriSmart — Core Application Frontend (Single Page App)
// =========================================================================

const STATE = {
  user: null,
  members: [],
  foods: [],
  activeTab: 'plans',
  currentDate: getTodayString(),
  weekStart: getMonday(getTodayString()),
  memberFilter: 'all',
  plans: [],
  reports: null,
  shopping: null,
  foodCategoryFilter: 'all',
  foodSearchQuery: '',
};

const CATEGORY_NAMES = {
  pokok: 'Makanan Pokok',
  lauk_hewani: 'Lauk Hewani',
  lauk_nabati: 'Lauk Nabati',
  sayur: 'Sayuran',
  buah: 'Buah-buahan',
  susu: 'Susu & Olahan',
};

const CATEGORY_EMOJIS = {
  pokok: '🍚',
  lauk_hewani: '🍗',
  lauk_nabati: '🧈',
  sayur: '🥦',
  buah: '🍌',
  susu: '🥛',
};

const MEAL_INFO = {
  sarapan: { title: 'Sarapan', icon: '☀️', time: '06:00 – 08:30' },
  siang: { title: 'Makan Siang', icon: '🍲', time: '12:00 – 13:30' },
  malam: { title: 'Makan Malam', icon: '🌙', time: '18:30 – 20:00' },
  camilan: { title: 'Camilan Sehat', icon: '🍎', time: 'Selingan' },
};

// ----------------------------- Date Helpers ------------------------------

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysStr(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getMonday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function formatIndoDate(dateStr, includeDay = true) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dayName = days[d.getUTCDay()];
  const dateNum = d.getUTCDate();
  const monthName = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return includeDay ? `${dayName}, ${dateNum} ${monthName} ${year}` : `${dateNum} ${monthName} ${year}`;
}

// ----------------------------- Notification / Toast ----------------------

function showToast(message, type = 'success') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`;
  t.innerHTML = `${icon}<span>${message}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 250);
  }, 3500);
}

// ----------------------------- API Client --------------------------------

async function api(path, options = {}) {
  options.headers = options.headers || {};
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(path, options);
  if (res.status === 401) {
    window.location.href = '/auth.html';
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada permintaan');
  }
  return data;
}

// ----------------------------- App Initialization -----------------------

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupNav();
  setupUserMenu();

  try {
    const userRes = await api('/api/auth/me');
    if (!userRes || !userRes.user) {
      window.location.href = '/auth.html';
      return;
    }
    STATE.user = userRes.user;
    updateUserUI();

    await Promise.all([loadMembers(), loadFoods()]);

    // Handle hash route or default tab
    const hash = window.location.hash.replace('#', '');
    if (['plans', 'members', 'reports', 'shopping', 'foods'].includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('plans');
    }
  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
  }
});

function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('ns_theme', next);
    });
  }
}

function setupNav() {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

function setupUserMenu() {
  const btn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-dropdown');
  if (btn && dropdown) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api('/api/auth/logout', { method: 'POST' });
        window.location.href = '/auth.html';
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const editProfileBtn = document.getElementById('btn-edit-profile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => openEditProfileModal());
  }
}

function updateUserUI() {
  const famEl = document.getElementById('top-fam-name');
  const userEl = document.getElementById('top-user-name');
  const avatarEl = document.getElementById('top-user-avatar');
  if (famEl) famEl.textContent = STATE.user.family_name || 'Keluarga';
  if (userEl) userEl.textContent = STATE.user.name;
  if (avatarEl) avatarEl.textContent = (STATE.user.name || 'U').charAt(0).toUpperCase();
}

window.switchTab = function(tabName) {
  STATE.activeTab = tabName;
  window.location.hash = tabName;

  document.querySelectorAll('.nav-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-view').forEach(v => {
    v.classList.toggle('hidden', v.id !== `view-${tabName}`);
  });

  if (tabName === 'plans') loadPlans();
  else if (tabName === 'members') renderMembersView();
  else if (tabName === 'reports') loadReports();
  else if (tabName === 'shopping') loadShopping();
  else if (tabName === 'foods') renderFoodsView();
}

// ----------------------------- DATA LOADERS ------------------------------

async function loadMembers() {
  const data = await api('/api/members');
  if (data && data.members) {
    STATE.members = data.members;
  }
}

async function loadFoods() {
  const data = await api('/api/foods');
  if (data && data.foods) {
    STATE.foods = data.foods;
  }
}

// ----------------------------- TAB 1: MEAL PLANNER -----------------------

async function loadPlans() {
  renderWeekStrip();
  renderMemberFilters();

  const start = STATE.weekStart;
  const end = addDaysStr(start, 6);

  try {
    const data = await api(`/api/plans?start=${start}&end=${end}`);
    if (data && data.plans) {
      STATE.plans = data.plans;
      renderMealsForCurrentDate();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderWeekStrip() {
  const strip = document.getElementById('week-strip');
  const label = document.getElementById('date-range-label');
  if (!strip) return;

  const start = STATE.weekStart;
  const end = addDaysStr(start, 6);
  if (label) {
    label.textContent = `${formatIndoDate(start, false)} – ${formatIndoDate(end, false)}`;
  }

  const daysShort = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  strip.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const dStr = addDaysStr(start, i);
    const dObj = new Date(`${dStr}T00:00:00Z`);
    const isCur = dStr === STATE.currentDate;
    const isToday = dStr === getTodayString();

    const chip = document.createElement('div');
    chip.className = `day-chip ${isCur ? 'active' : ''}`;
    chip.innerHTML = `
      <div class="d-name">${daysShort[i]}${isToday ? ' (Hari ini)' : ''}</div>
      <div class="d-date">${dObj.getUTCDate()}</div>
      <div class="d-plate" id="day-dots-${dStr}">
        <span title="Kelengkapan">🍽️</span>
      </div>
    `;
    chip.addEventListener('click', () => {
      STATE.currentDate = dStr;
      renderWeekStrip();
      renderMealsForCurrentDate();
    });
    strip.appendChild(chip);
  }
}

function renderMemberFilters() {
  const wrap = document.getElementById('member-filters');
  if (!wrap) return;

  wrap.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `filter-pill ${STATE.memberFilter === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `<span>Semua Anggota (${STATE.members.length})</span>`;
  allBtn.addEventListener('click', () => {
    STATE.memberFilter = 'all';
    renderMemberFilters();
    renderMealsForCurrentDate();
  });
  wrap.appendChild(allBtn);

  STATE.members.forEach(m => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-pill ${STATE.memberFilter === String(m.id) ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="dot" style="background:${m.color}"></span>
      <span>${m.name}</span>
    `;
    btn.addEventListener('click', () => {
      STATE.memberFilter = String(m.id);
      renderMemberFilters();
      renderMealsForCurrentDate();
    });
    wrap.appendChild(btn);
  });
}

function renderMealsForCurrentDate() {
  const container = document.getElementById('meals-container');
  const emptyPrompt = document.getElementById('meals-empty');
  if (!container) return;

  // Filter plans for this day and selected member
  let dayPlans = STATE.plans.filter(p => p.date === STATE.currentDate);
  if (STATE.memberFilter !== 'all') {
    dayPlans = dayPlans.filter(p => String(p.member_id) === STATE.memberFilter);
  }

  container.innerHTML = '';

  const mealTypes = ['sarapan', 'siang', 'malam', 'camilan'];
  let totalEntriesCount = 0;

  mealTypes.forEach(mt => {
    const items = dayPlans.filter(p => p.meal_type === mt);
    totalEntriesCount += items.length;

    // Determine Isi Piringku 4-pillar presence for this meal
    const hasPokok = items.some(i => i.category === 'pokok');
    const hasLauk = items.some(i => i.category === 'lauk_hewani' || i.category === 'lauk_nabati');
    const hasSayur = items.some(i => i.category === 'sayur');
    const hasBuah = items.some(i => i.category === 'buah');

    const card = document.createElement('div');
    card.className = 'meal-slot-card fade-up';

    let itemsHtml = '';
    if (items.length === 0) {
      itemsHtml = `
        <div style="text-align: center; padding: 18px 10px; color: var(--text-3); font-size: 13.5px;">
          Belum ada menu direncanakan untuk ${MEAL_INFO[mt].title.toLowerCase()}.
        </div>
      `;
    } else {
      itemsHtml = `
        <div class="meal-items-list">
          ${items.map(item => renderFoodEntryRow(item)).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="meal-header">
        <div class="meal-title-wrap">
          <div class="meal-icon">${MEAL_INFO[mt].icon}</div>
          <div>
            <div class="meal-title">${MEAL_INFO[mt].title}</div>
            <div class="text-xs muted">${MEAL_INFO[mt].time} · ${items.length} sajian</div>
          </div>
        </div>

        <div class="flex items-center gap-3 wrap">
          ${mt !== 'camilan' ? `
            <div class="plate-status-badges" title="Pedoman Isi Piringku Kemenkes">
              <span class="plate-badge p-pokok ${hasPokok ? 'present' : ''}">🍚 Pokok</span>
              <span class="plate-badge p-lauk ${hasLauk ? 'present' : ''}">🍗 Lauk</span>
              <span class="plate-badge p-sayur ${hasSayur ? 'present' : ''}">🥦 Sayur</span>
              <span class="plate-badge p-buah ${hasBuah ? 'present' : ''}">🍌 Buah</span>
            </div>
          ` : ''}
          <button class="btn btn-outline btn-sm" onclick="openAddMenuModal('${mt}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>Tambah</span>
          </button>
        </div>
      </div>
      ${itemsHtml}
    `;

    container.appendChild(card);
  });

  renderDailySummary(dayPlans);
}

function renderFoodEntryRow(item) {
  const isEaten = item.status === 'dimakan';
  const cals = Math.round(item.kcal * (item.grams / 100));
  const protein = Math.round((item.protein * (item.grams / 100)) * 10) / 10;

  return `
    <div class="food-entry-row" id="plan-row-${item.id}">
      <div class="food-entry-left">
        <button class="status-toggle-btn ${isEaten ? 'dimakan' : ''}" 
                onclick="togglePlanStatus(${item.id}, '${isEaten ? 'rencana' : 'dimakan'}')"
                title="${isEaten ? 'Sudah disantap (klik untuk batalkan)' : 'Tandai sudah disantap'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </button>
        <div class="food-info">
          <div class="food-info-top">
            <span class="badge ${getCategoryBadgeClass(item.category)}">${CATEGORY_NAMES[item.category] || item.category}</span>
            <span class="food-title">${item.food_name}</span>
          </div>
          <div class="food-nutri-badges">
            <span>🔥 <b>${cals}</b> kkal</span>
            <span>🥩 <b>${protein}g</b> protein</span>
            <span>⚖️ <b>${item.grams}g</b> (${item.portion_name})</span>
          </div>
        </div>
      </div>

      <div class="food-entry-right">
        <div class="member-portion-tag">
          <span class="m-dot" style="background:${item.member_color}"></span>
          <span>${item.member_name}</span>
        </div>
        <div class="food-actions">
          <button class="food-action-btn del" onclick="deletePlanEntry(${item.id})" title="Hapus menu ini">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function getCategoryBadgeClass(category) {
  switch (category) {
    case 'pokok': return 'badge-sun';
    case 'lauk_hewani': return 'badge-rose';
    case 'lauk_nabati': return 'badge-violet';
    case 'sayur': return 'badge-green';
    case 'buah': return 'badge-orange';
    case 'susu': return 'badge-sky';
    default: return 'badge-green';
  }
}

window.togglePlanStatus = async function(planId, nextStatus) {
  try {
    await api(`/api/plans/${planId}`, {
      method: 'PATCH',
      body: { status: nextStatus },
    });
    const p = STATE.plans.find(x => x.id === planId);
    if (p) p.status = nextStatus;
    renderMealsForCurrentDate();
    showToast(nextStatus === 'dimakan' ? 'Menu ditandai sudah disantap!' : 'Menu dikembalikan ke rencana');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deletePlanEntry = async function(planId) {
  if (!confirm('Hapus menu makanan ini dari rencana?')) return;
  try {
    await api(`/api/plans/${planId}`, { method: 'DELETE' });
    STATE.plans = STATE.plans.filter(p => p.id !== planId);
    renderMealsForCurrentDate();
    showToast('Menu berhasil dihapus');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

function renderDailySummary(dayPlans) {
  const sumEl = document.getElementById('daily-nutri-summary');
  if (!sumEl) return;

  let totalKcal = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  dayPlans.forEach(p => {
    const f = p.grams / 100;
    totalKcal += p.kcal * f;
    totalProtein += p.protein * f;
    totalFat += p.fat * f;
    totalCarbs += p.carbs * f;
    totalFiber += p.fiber * f;
  });

  // Calculate dynamic targets from AKG based on current member filter
  let targetFamilyKcal = 0;
  let targetFamilyProtein = 0;
  let targetFamilyFat = 0;
  let targetFamilyCarbs = 0;
  let targetFamilyFiber = 0;

  if (STATE.memberFilter === 'all') {
    targetFamilyKcal = STATE.members.reduce((acc, m) => acc + (m.akg?.kcal || 2150), 0) || 2150;
    targetFamilyProtein = STATE.members.reduce((acc, m) => acc + (m.akg?.protein || 65), 0) || 65;
    targetFamilyFat = STATE.members.reduce((acc, m) => acc + (m.akg?.fat || 65), 0) || 65;
    targetFamilyCarbs = STATE.members.reduce((acc, m) => acc + (m.akg?.carbs || 350), 0) || 350;
    targetFamilyFiber = STATE.members.reduce((acc, m) => acc + (m.akg?.fiber || 30), 0) || 30;
  } else {
    const mem = STATE.members.find(m => String(m.id) === STATE.memberFilter);
    targetFamilyKcal = mem?.akg?.kcal || 2150;
    targetFamilyProtein = mem?.akg?.protein || 65;
    targetFamilyFat = mem?.akg?.fat || 65;
    targetFamilyCarbs = mem?.akg?.carbs || 350;
    targetFamilyFiber = mem?.akg?.fiber || 30;
  }

  const kcalPercent = targetFamilyKcal > 0 ? Math.min(100, Math.round((totalKcal / targetFamilyKcal) * 100)) : 0;
  const protPercent = targetFamilyProtein > 0 ? Math.min(100, Math.round((totalProtein / targetFamilyProtein) * 100)) : 0;
  const fatPercent = targetFamilyFat > 0 ? Math.min(100, Math.round((totalFat / targetFamilyFat) * 100)) : 0;
  const carbsPercent = targetFamilyCarbs > 0 ? Math.min(100, Math.round((totalCarbs / targetFamilyCarbs) * 100)) : 0;
  const fiberPercent = targetFamilyFiber > 0 ? Math.min(100, Math.round((totalFiber / targetFamilyFiber) * 100)) : 0;

  sumEl.innerHTML = `
    <div class="card-header" style="margin-bottom: 12px;">
      <div class="card-title">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
        <span>Ringkasan Asupan Gizi Hari Ini (${formatIndoDate(STATE.currentDate)})</span>
      </div>
      <span class="badge ${kcalPercent >= 85 ? 'badge-green' : 'badge-orange'}">${kcalPercent}% Target Terpenuhi</span>
    </div>

    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-item-header">
          <span>Energi Total</span>
          <span><b>${Math.round(totalKcal)}</b> / ${targetFamilyKcal} kkal</span>
        </div>
        <div class="progress" style="--c: var(--c-kcal);"><span style="width:${kcalPercent}%"></span></div>
      </div>

      <div class="summary-item">
        <div class="summary-item-header">
          <span>Protein</span>
          <span><b>${Math.round(totalProtein)}</b> / ${targetFamilyProtein} g</span>
        </div>
        <div class="progress" style="--c: var(--c-protein);"><span style="width: ${protPercent}%"></span></div>
      </div>

      <div class="summary-item">
        <div class="summary-item-header">
          <span>Lemak</span>
          <span><b>${Math.round(totalFat)}</b> / ${targetFamilyFat} g</span>
        </div>
        <div class="progress" style="--c: var(--c-fat);"><span style="width: ${fatPercent}%"></span></div>
      </div>

      <div class="summary-item">
        <div class="summary-item-header">
          <span>Karbohidrat</span>
          <span><b>${Math.round(totalCarbs)}</b> / ${targetFamilyCarbs} g</span>
        </div>
        <div class="progress" style="--c: var(--c-carbs);"><span style="width: ${carbsPercent}%"></span></div>
      </div>

      <div class="summary-item">
        <div class="summary-item-header">
          <span>Serat</span>
          <span><b>${Math.round(totalFiber)}</b> / ${targetFamilyFiber} g</span>
        </div>
        <div class="progress" style="--c: var(--c-fiber);"><span style="width: ${fiberPercent}%"></span></div>
      </div>
    </div>
  `;
}

// ----------------------------- MEAL PLANNER MODALS -----------------------

window.openAddMenuModal = function(mealType = 'sarapan') {
  const modal = document.getElementById('modal-add-menu');
  if (!modal) return;

  const dateInput = document.getElementById('add-menu-date');
  const mealSelect = document.getElementById('add-menu-meal');
  const foodSelect = document.getElementById('add-menu-food');
  const memberCheckboxes = document.getElementById('add-menu-members');

  if (dateInput) dateInput.value = STATE.currentDate;
  if (mealSelect) mealSelect.value = mealType;

  // Populate food select
  if (foodSelect) {
    foodSelect.innerHTML = `<option value="">-- Pilih Pangan (${STATE.foods.length} pilihan) --</option>`;
    const categories = ['pokok', 'lauk_hewani', 'lauk_nabati', 'sayur', 'buah', 'susu'];
    categories.forEach(cat => {
      const group = document.createElement('optgroup');
      group.label = `${CATEGORY_EMOJIS[cat] || ''} ${CATEGORY_NAMES[cat] || cat}`;
      const catFoods = STATE.foods.filter(f => f.category === cat);
      catFoods.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.name} (1 ${f.portion_name} = ${f.portion_grams}g · ${f.kcal} kkal)`;
        group.appendChild(opt);
      });
      foodSelect.appendChild(group);
    });

    foodSelect.onchange = () => updateAddMenuPortions();
  }

  // Populate member portion inputs
  if (memberCheckboxes) {
    memberCheckboxes.innerHTML = STATE.members.map(m => {
      const factor = Math.min(1.3, Math.max(0.35, (m.akg?.kcal || 2150) / 2150));
      return `
        <div class="flex items-center justify-between gap-3 p-2 border rounded" style="background:var(--surface-2); border-color:var(--border); border-radius:var(--radius-sm); margin-bottom:8px;">
          <label class="check" style="font-weight:600;">
            <input type="checkbox" class="add-m-check" data-id="${m.id}" data-factor="${factor}" checked />
            <span class="avatar avatar-sm" style="--c:${m.color}">${m.name.charAt(0)}</span>
            <span>${m.name} <small class="muted">(${m.role})</small></span>
          </label>
          <div class="flex items-center gap-1">
            <input type="number" class="input add-m-grams" data-id="${m.id}" style="width:90px; height:34px; text-align:right;" value="100" min="5" max="2000" />
            <span class="text-xs muted">gram</span>
          </div>
        </div>
      `;
    }).join('');
  }

  updateAddMenuPortions();
  openModal('modal-add-menu');
};

function updateAddMenuPortions() {
  const foodSelect = document.getElementById('add-menu-food');
  const foodId = Number(foodSelect?.value);
  const food = STATE.foods.find(f => f.id === foodId);
  const baseGrams = food ? food.portion_grams : 100;

  document.querySelectorAll('.add-m-grams').forEach(inp => {
    const memId = inp.dataset.id;
    const chk = document.querySelector(`.add-m-check[data-id="${memId}"]`);
    const factor = Number(chk?.dataset.factor || 1);
    inp.value = Math.max(5, Math.round((baseGrams * factor) / 5) * 5);
  });
}

window.submitAddMenu = async function(e) {
  if (e) e.preventDefault();
  const date = document.getElementById('add-menu-date')?.value;
  const mealType = document.getElementById('add-menu-meal')?.value;
  const foodId = Number(document.getElementById('add-menu-food')?.value);

  if (!foodId) {
    showToast('Silakan pilih bahan pangan terlebih dahulu', 'error');
    return;
  }

  const entries = [];
  document.querySelectorAll('.add-m-check:checked').forEach(chk => {
    const memberId = Number(chk.dataset.id);
    const gramsInp = document.querySelector(`.add-m-grams[data-id="${memberId}"]`);
    const grams = Number(gramsInp?.value || 100);
    entries.push({ member_id: memberId, grams });
  });

  if (entries.length === 0) {
    showToast('Pilih minimal satu anggota keluarga', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-add-menu');
  if (btn) btn.disabled = true;

  try {
    await api('/api/plans', {
      method: 'POST',
      body: { date, meal_type: mealType, food_id: foodId, entries, status: 'rencana' }
    });
    showToast('Menu makanan berhasil ditambahkan!');
    closeModal('modal-add-menu');
    await loadPlans();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.openGeneratorModal = function() {
  const startInput = document.getElementById('gen-start-date');
  if (startInput) startInput.value = STATE.weekStart;
  openModal('modal-generate');
};

window.submitGenerate = async function(e) {
  if (e) e.preventDefault();
  const start = document.getElementById('gen-start-date')?.value;
  const days = Number(document.getElementById('gen-days')?.value || 7);
  const replace = document.getElementById('gen-replace')?.checked || false;

  const btn = document.getElementById('btn-submit-gen');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Menyusun Menu...`;
  }

  try {
    const res = await api('/api/plans/generate', {
      method: 'POST',
      body: { start, days, replace }
    });
    showToast(`Berhasil menyusun ${res.created} sajian makanan seimbang untuk ${days} hari!`, 'success');
    closeModal('modal-generate');
    await loadPlans();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Jalankan Generator</span>`;
    }
  }
};

window.openCopyModal = function() {
  const fromInput = document.getElementById('copy-from-date');
  const toInput = document.getElementById('copy-to-date');
  if (fromInput) fromInput.value = STATE.weekStart;
  if (toInput) toInput.value = addDaysStr(STATE.weekStart, 7);
  openModal('modal-copy');
};

window.submitCopy = async function(e) {
  if (e) e.preventDefault();
  const from = document.getElementById('copy-from-date')?.value;
  const to = document.getElementById('copy-to-date')?.value;
  const days = Number(document.getElementById('copy-days')?.value || 7);
  const replace = document.getElementById('copy-replace')?.checked || false;

  const btn = document.getElementById('btn-submit-copy');
  if (btn) btn.disabled = true;

  try {
    const res = await api('/api/plans/copy', {
      method: 'POST',
      body: { from, to, days, replace }
    });
    showToast(`Berhasil menyalin ${res.created} menu ke pekan tujuan!`);
    closeModal('modal-copy');
    STATE.weekStart = to;
    STATE.currentDate = to;
    await loadPlans();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.prevWeek = function() {
  STATE.weekStart = addDaysStr(STATE.weekStart, -7);
  STATE.currentDate = STATE.weekStart;
  loadPlans();
};

window.nextWeek = function() {
  STATE.weekStart = addDaysStr(STATE.weekStart, 7);
  STATE.currentDate = STATE.weekStart;
  loadPlans();
};

window.thisWeek = function() {
  STATE.weekStart = getMonday(getTodayString());
  STATE.currentDate = getTodayString();
  loadPlans();
};

// ----------------------------- TAB 2: ANGGOTA KELUARGA -------------------

function renderMembersView() {
  const grid = document.getElementById('members-grid');
  const countEl = document.getElementById('members-count-badge');
  const famTitle = document.getElementById('fam-title-members');

  if (countEl) countEl.textContent = `${STATE.members.length} Anggota`;
  if (famTitle) famTitle.textContent = STATE.user.family_name || 'Keluarga Anda';
  if (!grid) return;

  grid.innerHTML = STATE.members.map(m => {
    const akg = m.akg || {};
    const bmi = m.bmi;
    let bmiBadge = '';
    if (bmi) {
      const cls = bmi.category === 'Normal' ? 'badge-green' : bmi.category === 'Gemuk' ? 'badge-orange' : 'badge-sun';
      bmiBadge = `<span class="badge ${cls}">IMT ${bmi.value} (${bmi.category})</span>`;
    }

    const ageStr = m.age < 1 ? `${Math.max(1, Math.round(m.age * 12))} bulan` : `${Math.floor(m.age)} tahun`;
    return `
      <div class="member-card fade-up">
        <div class="member-card-top">
          <div class="avatar avatar-lg" style="--c:${m.color}">${m.name.charAt(0)}</div>
          <div class="member-header-info">
            <div class="member-name">${m.name}</div>
            <div class="member-meta-line">${m.role} · ${m.gender === 'L' ? 'Laki-laki' : 'Perempuan'} · ${ageStr}</div>
            <div class="mt-1">${bmiBadge}</div>
          </div>
        </div>

        <div class="member-stats-row">
          <div class="stat-cell">
            <div class="label">Berat</div>
            <div class="val">${m.weight ? `${m.weight} kg` : '-'}</div>
          </div>
          <div class="stat-cell">
            <div class="label">Tinggi</div>
            <div class="val">${m.height ? `${m.height} cm` : '-'}</div>
          </div>
          <div class="stat-cell">
            <div class="label">Target Kalori</div>
            <div class="val">${akg.kcal || '-'} kkal</div>
          </div>
        </div>

        <div>
          <div class="text-xs fw-700 muted" style="margin-bottom:6px; text-transform:uppercase; letter-spacing:0.04em;">
            Kebutuhan AKG Harian (${akg.label || 'Kemenkes 2019'})
          </div>
          <div class="akg-table-wrap">
            <div class="akg-row"><span class="k">🔥 Energi</span><span class="v">${akg.kcal} kkal</span></div>
            <div class="akg-row"><span class="k">🥩 Protein</span><span class="v">${akg.protein} g</span></div>
            <div class="akg-row"><span class="k">🥑 Lemak</span><span class="v">${akg.fat} g</span></div>
            <div class="akg-row"><span class="k">🍚 Karbohidrat</span><span class="v">${akg.carbs} g</span></div>
            <div class="akg-row"><span class="k">🥬 Serat</span><span class="v">${akg.fiber} g</span></div>
          </div>
        </div>

        <div class="flex justify-between items-center mt-2" style="border-top:1px solid var(--border); padding-top:14px;">
          <button class="btn btn-ghost btn-sm" onclick="openEditMemberModal(${m.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Edit</span>
          </button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteMember(${m.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            <span>Hapus</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.openAddMemberModal = function() {
  document.getElementById('form-member').reset();
  document.getElementById('member-id').value = '';
  document.getElementById('modal-member-title').textContent = 'Tambah Anggota Keluarga';
  document.getElementById('member-color').value = '#0f9d63';
  openModal('modal-member');
};

window.openEditMemberModal = function(id) {
  const m = STATE.members.find(x => x.id === id);
  if (!m) return;
  document.getElementById('modal-member-title').textContent = 'Edit Anggota Keluarga';
  document.getElementById('member-id').value = m.id;
  document.getElementById('member-name').value = m.name;
  document.getElementById('member-role').value = m.role;
  document.getElementById('member-gender').value = m.gender;
  document.getElementById('member-birth').value = m.birth_date;
  document.getElementById('member-weight').value = m.weight || '';
  document.getElementById('member-height').value = m.height || '';
  document.getElementById('member-color').value = m.color || '#0f9d63';
  document.getElementById('member-target-kcal').value = m.target_kcal || '';
  openModal('modal-member');
};

window.submitMemberForm = async function(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('member-id').value;
  const payload = {
    name: document.getElementById('member-name').value.trim(),
    role: document.getElementById('member-role').value,
    gender: document.getElementById('member-gender').value,
    birth_date: document.getElementById('member-birth').value,
    weight: document.getElementById('member-weight').value ? Number(document.getElementById('member-weight').value) : null,
    height: document.getElementById('member-height').value ? Number(document.getElementById('member-height').value) : null,
    color: document.getElementById('member-color').value,
    target_kcal: document.getElementById('member-target-kcal').value ? Number(document.getElementById('member-target-kcal').value) : null,
  };

  const btn = document.getElementById('btn-submit-member');
  if (btn) btn.disabled = true;

  try {
    if (id) {
      await api(`/api/members/${id}`, { method: 'PUT', body: payload });
      showToast('Data anggota keluarga berhasil diperbarui!');
    } else {
      await api('/api/members', { method: 'POST', body: payload });
      showToast('Anggota keluarga baru berhasil ditambahkan!');
    }
    closeModal('modal-member');
    await loadMembers();
    renderMembersView();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.deleteMember = async function(id) {
  const m = STATE.members.find(x => x.id === id);
  if (!confirm(`Hapus anggota "${m?.name}" beserta seluruh data riwayat menunya?`)) return;
  try {
    await api(`/api/members/${id}`, { method: 'DELETE' });
    showToast('Anggota keluarga berhasil dihapus');
    await loadMembers();
    renderMembersView();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ----------------------------- TAB 3: LAPORAN GIZI -----------------------

window.loadReports = async function(days = 7) {
  const start = STATE.weekStart;
  const end = addDaysStr(start, days - 1);
  const wrap = document.getElementById('report-content');
  if (!wrap) return;

  wrap.innerHTML = `<div class="skeleton" style="height:320px; border-radius:var(--radius-xl);"></div>`;

  try {
    const data = await api(`/api/reports?start=${start}&end=${end}`);
    STATE.reports = data;
    renderReportsView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderReportsView() {
  const data = STATE.reports;
  const wrap = document.getElementById('report-content');
  if (!data || !wrap) return;

  const score = data.plate?.score || 0;
  const completeSlots = data.plate?.complete || 0;
  const totalSlots = data.plate?.slots || 0;

  wrap.innerHTML = `
    <!-- Score Hero -->
    <div class="report-score-hero fade-up">
      <div class="gauge-box">
        <div class="score-num">${score}%</div>
        <div class="badge ${score >= 75 ? 'badge-green' : 'badge-orange'}">
          ${score >= 80 ? '🌟 Sangat Baik' : score >= 60 ? '👍 Cukup Seimbang' : '⚠️ Perlu Ditingkatkan'}
        </div>
        <p class="text-xs muted mt-2">Skor Kelengkapan Piring Sehat</p>
      </div>

      <div class="flex col justify-center">
        <h2 style="font-size:20px; font-weight:800; margin-bottom:6px;">Evaluasi Pedoman "Isi Piringku"</h2>
        <p class="muted text-sm" style="margin-bottom:16px;">
          Dari <b>${totalSlots}</b> waktu makan utama keluarga dalam rentang ini, <b>${completeSlots}</b> piring berhasil memenuhi 
          keempat pilar gizi seimbang (Makanan Pokok + Lauk Pauk + Sayuran + Buah-buahan).
        </p>
        <div class="flex gap-4 wrap">
          <div class="card card-pad" style="flex:1; min-width:140px; padding:12px 16px;">
            <div class="text-xs muted">Sajian Direncanakan</div>
            <div style="font-size:18px; font-weight:800;">${data.totals?.entries || 0} porsi</div>
          </div>
          <div class="card card-pad" style="flex:1; min-width:140px; padding:12px 16px;">
            <div class="text-xs muted">Sudah Disantap</div>
            <div style="font-size:18px; font-weight:800; color:var(--brand-700);">${data.totals?.eaten || 0} porsi</div>
          </div>
          <div class="card card-pad" style="flex:1; min-width:140px; padding:12px 16px;">
            <div class="text-xs muted">Piring Sempurna</div>
            <div style="font-size:18px; font-weight:800; color:var(--sun);">${completeSlots} piring</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Per Member AKG Fulfillment -->
    <div class="card card-pad mt-5 fade-up">
      <div class="card-header">
        <div class="card-title">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></span>
          <span>Rata-Rata Capaian Gizi Harian vs AKG per Anggota</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:20px;">
        ${data.members.map(m => {
          const kcalP = m.akg.kcal ? Math.min(130, Math.round((m.average.kcal / m.akg.kcal) * 100)) : 0;
          const protP = m.akg.protein ? Math.min(130, Math.round((m.average.protein / m.akg.protein) * 100)) : 0;
          const fiberP = m.akg.fiber ? Math.min(130, Math.round((m.average.fiber / m.akg.fiber) * 100)) : 0;

          return `
            <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:16px;">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="avatar avatar-sm" style="--c:${m.color}">${m.name.charAt(0)}</span>
                  <b>${m.name}</b> <span class="muted text-xs">(${m.role})</span>
                </div>
                <span class="badge ${kcalP >= 85 && kcalP <= 115 ? 'badge-green' : 'badge-orange'}">${kcalP}% Kebutuhan Energi</span>
              </div>

              <div class="summary-grid mt-3">
                <div>
                  <div class="flex justify-between text-xs muted mb-1">
                    <span>Energi</span>
                    <span><b>${Math.round(m.average.kcal)}</b> / ${m.akg.kcal} kkal</span>
                  </div>
                  <div class="progress" style="--c:var(--c-kcal);"><span style="width:${Math.min(100, kcalP)}%"></span></div>
                </div>

                <div>
                  <div class="flex justify-between text-xs muted mb-1">
                    <span>Protein</span>
                    <span><b>${Math.round(m.average.protein)}g</b> / ${m.akg.protein}g</span>
                  </div>
                  <div class="progress" style="--c:var(--c-protein);"><span style="width:${Math.min(100, protP)}%"></span></div>
                </div>

                <div>
                  <div class="flex justify-between text-xs muted mb-1">
                    <span>Serat</span>
                    <span><b>${Math.round(m.average.fiber)}g</b> / ${m.akg.fiber}g</span>
                  </div>
                  <div class="progress" style="--c:var(--c-fiber);"><span style="width:${Math.min(100, fiberP)}%"></span></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ----------------------------- TAB 4: DAFTAR BELANJA ---------------------

async function loadShopping() {
  const start = STATE.weekStart;
  const end = addDaysStr(start, 6);
  const wrap = document.getElementById('shopping-grid');
  const label = document.getElementById('shop-range-label');
  if (label) label.textContent = `${formatIndoDate(start, false)} – ${formatIndoDate(end, false)}`;
  if (!wrap) return;

  wrap.innerHTML = `<div class="skeleton" style="height:260px; border-radius:var(--radius-xl);"></div>`;

  try {
    const data = await api(`/api/shopping?start=${start}&end=${end}`);
    STATE.shopping = data;
    renderShoppingView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderShoppingView() {
  const data = STATE.shopping;
  const grid = document.getElementById('shopping-grid');
  if (!data || !grid) return;

  const items = data.items || [];
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty span-2" style="grid-column: 1 / -1;">
        <div class="empty-emoji">🛒</div>
        <h3>Belum Ada Menu Direncanakan</h3>
        <p>Tambahkan menu makanan pada kalender perencana untuk menghasilkan daftar belanja otomatis keluarga.</p>
        <button class="btn btn-primary" onclick="switchTab('plans')">Rencanakan Menu</button>
      </div>
    `;
    return;
  }

  // Group by category
  const grouped = {};
  items.forEach(it => {
    grouped[it.category] = grouped[it.category] || [];
    grouped[it.category].push(it);
  });

  const checkedKey = `ns_shop_${data.start}_${data.end}`;
  const checkedItems = JSON.parse(localStorage.getItem(checkedKey) || '{}');

  grid.innerHTML = Object.entries(grouped).map(([cat, list]) => {
    return `
      <div class="shop-cat-card fade-up">
        <div class="shop-cat-header">
          <div class="flex items-center gap-2">
            <span style="font-size:20px;">${CATEGORY_EMOJIS[cat] || '📦'}</span>
            <b style="font-size:15px;">${CATEGORY_NAMES[cat] || cat}</b>
          </div>
          <span class="badge">${list.length} item</span>
        </div>

        <div>
          ${list.map(it => {
            const isChecked = !!checkedItems[it.id];
            const weightStr = it.total_grams >= 1000 
              ? `${(it.total_grams / 1000).toFixed(1)} kg` 
              : `${Math.round(it.total_grams)} gram`;

            return `
              <div class="shop-item-row ${isChecked ? 'checked' : ''}" id="shop-row-${it.id}">
                <input type="checkbox" class="shop-check" ${isChecked ? 'checked' : ''} 
                       onchange="toggleShopItem('${checkedKey}', ${it.id})" />
                <span class="shop-item-name">${it.name}</span>
                <span class="shop-item-qty">${weightStr}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

window.toggleShopItem = function(key, itemId) {
  const checked = JSON.parse(localStorage.getItem(key) || '{}');
  checked[itemId] = !checked[itemId];
  localStorage.setItem(key, JSON.stringify(checked));
  const row = document.getElementById(`shop-row-${itemId}`);
  if (row) row.classList.toggle('checked', !!checked[itemId]);
};

window.copyShoppingList = function() {
  const data = STATE.shopping;
  if (!data || !data.items || !data.items.length) {
    showToast('Tidak ada daftar belanja untuk disalin', 'error');
    return;
  }

  let text = `🛒 DAFTAR BELANJA KELUARGA — NutriSmart\nPeriode: ${formatIndoDate(data.start, false)} - ${formatIndoDate(data.end, false)}\n\n`;

  const grouped = {};
  data.items.forEach(it => {
    grouped[it.category] = grouped[it.category] || [];
    grouped[it.category].push(it);
  });

  for (const [cat, list] of Object.entries(grouped)) {
    text += `[${CATEGORY_NAMES[cat] || cat}]\n`;
    list.forEach(it => {
      const weightStr = it.total_grams >= 1000 ? `${(it.total_grams / 1000).toFixed(1)} kg` : `${Math.round(it.total_grams)} g`;
      text += `• ${it.name} : ${weightStr} (${it.servings} porsi)\n`;
    });
    text += '\n';
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('Daftar belanja berhasil disalin ke clipboard! Siap dikirim ke WhatsApp/Catatan.');
  }).catch(() => {
    showToast('Gagal menyalin ke clipboard', 'error');
  });
};

// ----------------------------- TAB 5: BANK PANGAN ------------------------

function renderFoodsView() {
  const tbody = document.getElementById('food-table-body');
  const countEl = document.getElementById('food-count-badge');
  if (!tbody) return;

  let filtered = STATE.foods;
  if (STATE.foodCategoryFilter !== 'all') {
    filtered = filtered.filter(f => f.category === STATE.foodCategoryFilter);
  }
  if (STATE.foodSearchQuery) {
    const q = STATE.foodSearchQuery.toLowerCase();
    filtered = filtered.filter(f => f.name.toLowerCase().includes(q));
  }

  if (countEl) countEl.textContent = `${filtered.length} Bahan Pangan`;

  tbody.innerHTML = filtered.map(f => {
    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <b>${f.name}</b>
            ${f.recommended ? '<span class="badge badge-green" title="Rekomendasi Isi Piringku">Pilihan Sehat</span>' : ''}
            ${f.custom ? '<span class="badge badge-sun">Kustom</span>' : ''}
          </div>
          <div class="text-xs muted mt-1">1 ${f.portion_name} = ${f.portion_grams} gram</div>
        </td>
        <td>
          <span class="badge ${getCategoryBadgeClass(f.category)}">${CATEGORY_NAMES[f.category] || f.category}</span>
        </td>
        <td><b>${f.kcal}</b> kkal</td>
        <td>${f.protein} g</td>
        <td>${f.fat} g</td>
        <td>${f.carbs} g</td>
        <td>${f.fiber} g</td>
        <td style="text-align:right;">
          ${f.custom ? `
            <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteCustomFood(${f.id})" title="Hapus pangan kustom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          ` : '<span class="text-xs muted">Bawaan</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

window.filterFoodCategory = function(cat) {
  STATE.foodCategoryFilter = cat;
  document.querySelectorAll('.food-cat-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === cat);
  });
  renderFoodsView();
};

window.onFoodSearchInput = function(val) {
  STATE.foodSearchQuery = val.trim();
  renderFoodsView();
};

window.openAddFoodModal = function() {
  document.getElementById('form-food').reset();
  openModal('modal-food');
};

window.submitFoodForm = async function(e) {
  if (e) e.preventDefault();
  const payload = {
    name: document.getElementById('food-name').value.trim(),
    category: document.getElementById('food-category').value,
    kcal: Number(document.getElementById('food-kcal').value),
    protein: Number(document.getElementById('food-protein').value || 0),
    fat: Number(document.getElementById('food-fat').value || 0),
    carbs: Number(document.getElementById('food-carbs').value || 0),
    fiber: Number(document.getElementById('food-fiber').value || 0),
    portion_name: document.getElementById('food-portion-name').value.trim() || 'porsi',
    portion_grams: Number(document.getElementById('food-portion-grams').value || 100),
  };

  const btn = document.getElementById('btn-submit-food');
  if (btn) btn.disabled = true;

  try {
    await api('/api/foods', { method: 'POST', body: payload });
    showToast('Bahan pangan baru berhasil ditambahkan!');
    closeModal('modal-food');
    await loadFoods();
    renderFoodsView();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.deleteCustomFood = async function(id) {
  const f = STATE.foods.find(x => x.id === id);
  if (!confirm(`Hapus pangan "${f?.name}" dari bank data?`)) return;
  try {
    await api(`/api/foods/${id}`, { method: 'DELETE' });
    showToast('Bahan pangan berhasil dihapus');
    await loadFoods();
    renderFoodsView();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ----------------------------- USER PROFILE MODAL ------------------------

window.openEditProfileModal = function() {
  if (!STATE.user) return;
  document.getElementById('prof-name').value = STATE.user.name;
  document.getElementById('prof-family').value = STATE.user.family_name || '';
  openModal('modal-profile');
};

window.submitProfileForm = async function(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('prof-name').value.trim();
  const family_name = document.getElementById('prof-family').value.trim();

  try {
    const data = await api('/api/auth/me', {
      method: 'PUT',
      body: { name, family_name }
    });
    STATE.user = data.user;
    updateUserUI();
    showToast('Profil keluarga berhasil diperbarui!');
    closeModal('modal-profile');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ----------------------------- MODAL CONTROLLERS -------------------------

window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('hidden');
    m.classList.remove('closing');
  }
};

window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('closing');
    setTimeout(() => {
      m.classList.add('hidden');
      m.classList.remove('closing');
    }, 180);
  }
};
