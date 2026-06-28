'use strict';

// ===== STATE =====
const DEFAULT_STATE = {
  categories: ['Geral'],
  items: [
    { id: 1, name: 'Produto de exemplo', qty: '', cat: 'Geral', checked: false, bought: false }
  ],
  collapsed: {},
  prefs: {
    expandByDefault: true,
    showQty: true
  },
  theme: 'auto'
};

let state = loadState();

// ===== STORAGE =====
function loadState() {
  try {
    const saved = localStorage.getItem('compras-v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try {
    localStorage.setItem('compras-v1', JSON.stringify(state));
  } catch (e) {
    showToast('Erro ao guardar dados');
  }
}

// ===== THEME =====
function applyTheme(theme) {
  state.theme = theme;
  const root = document.documentElement;
  const meta = document.getElementById('theme-color-meta');

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    meta.setAttribute('content', prefersDark ? '#1c1c1e' : '#ffffff');
  } else {
    root.setAttribute('data-theme', theme);
    meta.setAttribute('content', theme === 'dark' ? '#1c1c1e' : '#ffffff');
  }

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  saveState();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'auto') applyTheme('auto');
});

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== RENDER =====
function render() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const container = document.getElementById('list-container');

  document.getElementById('search-clear').classList.toggle('visible', query.length > 0);

  let html = '';
  let totalVisible = 0;

  state.categories.forEach(cat => {
    const catItems = state.items.filter(i => {
      if (i.cat !== cat) return false;
      if (query) return i.name.toLowerCase().includes(query);
      return true;
    });

    if (query && catItems.length === 0) return;
    totalVisible += catItems.length;

    const isCollapsed = state.collapsed[cat] === true;
    const chevronClass = isCollapsed ? 'collapsed' : '';

    html += `<div class="cat-section">
      <div class="cat-header" data-cat="${esc(cat)}" role="button" aria-expanded="${!isCollapsed}">
        <div class="cat-chevron ${chevronClass}" aria-hidden="true">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 1 6 7 11 1"/>
          </svg>
        </div>
        <span class="cat-name">${esc(cat)}</span>
      </div>`;

    if (!isCollapsed) {
      html += `<div class="product-list" role="list">`;

      catItems.forEach(item => {
        const boughtClass = item.bought ? 'bought' : '';
        const checkClass = item.checked ? 'checked' : '';
        const tickClass = item.bought ? 'bought' : '';

        html += `<div class="product-row ${boughtClass}" data-id="${item.id}" role="listitem">
          <button class="left-check ${checkClass}" data-check="${item.id}" aria-label="Planeado: ${esc(item.name)}" aria-pressed="${item.checked}">
            <svg class="check-mark" width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="1 5 4.5 8.5 11 1"/>
            </svg>
          </button>
          <div class="prod-info">
            <div class="prod-name">${esc(item.name)}</div>
            ${state.prefs.showQty && item.qty ? `<div class="prod-qty">${esc(item.qty)}</div>` : ''}
          </div>
          <button class="right-tick ${tickClass}" data-tick="${item.id}" aria-label="Comprado: ${esc(item.name)}" aria-pressed="${item.bought}">
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="1 5.5 5 9.5 13 1"/>
            </svg>
          </button>
        </div>`;
      });

      if (!query) {
        html += `<button class="add-in-cat" data-addcat="${esc(cat)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar em ${esc(cat)}
        </button>`;
      }

      html += `</div>`;
    }

    html += `</div>`;
  });

  if (state.categories.length === 0) {
    html = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <h3>Lista vazia</h3>
      <p>Cria uma categoria e começa a adicionar produtos</p>
    </div>`;
  } else if (query && totalVisible === 0) {
    html = `<div class="no-results">Nenhum resultado para "<strong>${esc(query)}</strong>"</div>`;
  }

  container.innerHTML = html;
  renderSettingsCategories();
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== RENDER SETTINGS CATS =====
function renderSettingsCategories() {
  const el = document.getElementById('s-cats-list');
  if (!el) return;

  let html = state.categories.map(cat => `
    <div class="s-cat-row">
      <span class="s-cat-name">${esc(cat)}</span>
      <button class="s-cat-del" data-delcat="${esc(cat)}" aria-label="Apagar categoria ${esc(cat)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  html += `<button class="s-add-cat-row" id="s-btn-add-cat">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    Nova categoria
  </button>`;

  el.innerHTML = html;
}

// ===== TOGGLE CATEGORY =====
function toggleCategory(cat) {
  if (state.collapsed[cat] === true) {
    delete state.collapsed[cat];
  } else {
    state.collapsed[cat] = true;
  }
  saveState();
  render();
}

// ===== TOGGLE CHECK (left) =====
function toggleCheck(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  item.checked = !item.checked;
  if (!item.checked && item.bought) {
    item.bought = false;
  }
  saveState();
  render();
}

// ===== TOGGLE BOUGHT (right tick) =====
function toggleBought(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  item.bought = !item.bought;
  if (item.bought && !item.checked) {
    item.checked = true;
  }
  saveState();
  render();
}

// ===== QUICK ADD =====
let qaCatSelected = null;

function openQuickAdd(presetCat) {
  qaCatSelected = presetCat || state.categories[0] || null;
  buildQACats('qa-cats');
  document.getElementById('qa-input').value = '';
  document.getElementById('qa-qty-input').value = '';
  openOverlay('overlay-add');
  setTimeout(() => document.getElementById('qa-input').focus(), 320);
}

function buildQACats(containerId) {
  const el = document.getElementById(containerId);
  el.innerHTML = state.categories.map(cat =>
    `<button class="cat-chip ${cat === qaCatSelected ? 'selected' : ''}" data-qacat="${esc(cat)}">${esc(cat)}</button>`
  ).join('');
}

function confirmQuickAdd() {
  const name = document.getElementById('qa-input').value.trim();
  if (!name) {
    document.getElementById('qa-input').focus();
    return;
  }
  const qty = document.getElementById('qa-qty-input').value.trim();
  const cat = qaCatSelected || state.categories[0] || 'Geral';
  state.items.push({
    id: Date.now(),
    name,
    qty,
    cat,
    checked: false,
    bought: false
  });
  saveState();
  closeOverlay('overlay-add');
  render();
  showToast(`"${name}" adicionado`);
}

// ===== EDIT PRODUCT =====
let editTargetId = null;
let editCatSelected = null;

function openEdit(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  editTargetId = id;
  editCatSelected = item.cat;

  document.getElementById('edit-name').value = item.name;
  document.getElementById('edit-qty').value = item.qty || '';
  buildEditCats();
  openOverlay('overlay-edit');
  setTimeout(() => document.getElementById('edit-name').focus(), 320);
}

function buildEditCats() {
  const el = document.getElementById('edit-cats');
  el.innerHTML = state.categories.map(cat =>
    `<button class="cat-chip ${cat === editCatSelected ? 'selected' : ''}" data-editcat="${esc(cat)}">${esc(cat)}</button>`
  ).join('');
}

function confirmEdit() {
  const item = state.items.find(i => i.id === editTargetId);
  if (!item) return;
  const name = document.getElementById('edit-name').value.trim();
  if (!name) return;
  item.name = name;
  item.qty = document.getElementById('edit-qty').value.trim();
  item.cat = editCatSelected || item.cat;
  saveState();
  closeOverlay('overlay-edit');
  render();
  showToast('Produto atualizado');
}

// ===== DELETE PRODUCT =====
function deleteProduct(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  const name = item.name;
  state.items = state.items.filter(i => i.id !== id);
  saveState();
  render();
  showToast(`"${name}" apagado`);
}

// ===== CATEGORY MANAGEMENT =====
function openAddCat() {
  document.getElementById('cat-input').value = '';
  openOverlay('overlay-cat');
  setTimeout(() => document.getElementById('cat-input').focus(), 320);
}

function confirmAddCat() {
  const name = document.getElementById('cat-input').value.trim();
  if (!name) return;
  if (state.categories.includes(name)) {
    showToast('Categoria já existe');
    return;
  }
  state.categories.push(name);
  saveState();
  closeOverlay('overlay-cat');
  render();
  showToast(`Categoria "${name}" criada`);
}

function deleteCategory(cat) {
  const count = state.items.filter(i => i.cat === cat).length;
  if (count > 0) {
    if (!confirm(`Apagar "${cat}" e os seus ${count} produto(s)?`)) return;
  }
  state.categories = state.categories.filter(c => c !== cat);
  state.items = state.items.filter(i => i.cat !== cat);
  delete state.collapsed[cat];
  saveState();
  render();
  showToast(`"${cat}" apagada`);
}

// ===== RENAME CATEGORY =====
let renameCatTarget = null;

function openRenamecat(cat) {
  renameCatTarget = cat;
  document.getElementById('rename-cat-input').value = cat;
  openOverlay('overlay-rename-cat');
  setTimeout(() => document.getElementById('rename-cat-input').focus(), 320);
}

function confirmRenameCat() {
  const newName = document.getElementById('rename-cat-input').value.trim();
  if (!newName) return;
  if (newName === renameCatTarget) { closeOverlay('overlay-rename-cat'); return; }
  if (state.categories.includes(newName)) {
    showToast('Categoria já existe');
    return;
  }
  // Update category name and all items referencing it
  const idx = state.categories.indexOf(renameCatTarget);
  if (idx !== -1) state.categories[idx] = newName;
  state.items.forEach(i => { if (i.cat === renameCatTarget) i.cat = newName; });
  if (state.collapsed[renameCatTarget] !== undefined) {
    state.collapsed[newName] = state.collapsed[renameCatTarget];
    delete state.collapsed[renameCatTarget];
  }
  saveState();
  closeOverlay('overlay-rename-cat');
  render();
  showToast(`Categoria renomeada`);
}

// ===== REORDER CATEGORY =====
function moveCat(cat, direction) {
  const idx = state.categories.indexOf(cat);
  if (direction === 'up' && idx > 0) {
    [state.categories[idx - 1], state.categories[idx]] = [state.categories[idx], state.categories[idx - 1]];
  } else if (direction === 'down' && idx < state.categories.length - 1) {
    [state.categories[idx], state.categories[idx + 1]] = [state.categories[idx + 1], state.categories[idx]];
  }
  saveState();
  hideCatContextMenu();
  render();
}

// ===== CLEAR DATA =====
// "Limpar comprados" — remove tick direito E checkbox dos produtos comprados
function clearBought() {
  const count = state.items.filter(i => i.bought).length;
  if (count === 0) { showToast('Sem produtos comprados'); return; }
  if (!confirm(`Remover ticks de ${count} produto(s) comprado(s)?`)) return;
  state.items.forEach(i => {
    if (i.bought) {
      i.bought = false;
      i.checked = false;
    }
  });
  saveState();
  render();
  showToast(`${count} produto(s) desmarcado(s)`);
}

// "Limpar toda a lista" — remove todos os ticks de todos os produtos
function clearAll() {
  const hasAny = state.items.some(i => i.bought || i.checked);
  if (!hasAny) { showToast('Não há ticks para limpar'); return; }
  if (!confirm('Remover todos os ticks da lista?')) return;
  state.items.forEach(i => { i.bought = false; i.checked = false; });
  saveState();
  render();
  showToast('Todos os ticks removidos');
}

// ===== CONTEXT MENU (PRODUCTS) =====
let ctxTargetId = null;
let pressTimer = null;

function showContextMenu(id, x, y) {
  ctxTargetId = id;
  const menu = document.getElementById('ctx-menu');
  const backdrop = document.getElementById('ctx-backdrop');

  const menuWidth = 190;
  const menuHeight = 110;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = Math.min(x, vw - menuWidth - 8);
  let top = Math.min(y, vh - menuHeight - 8);
  top = Math.max(top, 8);

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.classList.add('open');
  backdrop.classList.add('open');
}

function hideContextMenu() {
  document.getElementById('ctx-menu').classList.remove('open');
  document.getElementById('ctx-backdrop').classList.remove('open');
  ctxTargetId = null;
}

// ===== CONTEXT MENU (CATEGORIES) =====
let ctxCatTarget = null;

function showCatContextMenu(cat, x, y) {
  ctxCatTarget = cat;
  const menu = document.getElementById('ctx-cat-menu');
  const backdrop = document.getElementById('ctx-backdrop');

  const idx = state.categories.indexOf(cat);
  // Show/hide reorder buttons
  document.getElementById('ctx-cat-up').style.display = idx > 0 ? 'flex' : 'none';
  document.getElementById('ctx-cat-down').style.display = idx < state.categories.length - 1 ? 'flex' : 'none';

  const menuWidth = 200;
  const menuHeight = 160;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = Math.min(x, vw - menuWidth - 8);
  let top = Math.min(y, vh - menuHeight - 8);
  top = Math.max(top, 8);

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.classList.add('open');
  backdrop.classList.add('open');
}

function hideCatContextMenu() {
  document.getElementById('ctx-cat-menu').classList.remove('open');
  document.getElementById('ctx-backdrop').classList.remove('open');
  ctxCatTarget = null;
}

// ===== OVERLAYS =====
function openOverlay(id) {
  document.getElementById(id).classList.add('open');
}

function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
}

// ===== TOAST =====
let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ===== PREFS =====
function togglePref(key) {
  state.prefs[key] = !state.prefs[key];
  const tog = document.getElementById('tog-' + (key === 'expandByDefault' ? 'expand' : 'qty'));
  if (tog) tog.setAttribute('aria-checked', state.prefs[key]);

  if (key === 'expandByDefault') {
    if (state.prefs.expandByDefault) {
      state.collapsed = {};
    } else {
      state.categories.forEach(c => { state.collapsed[c] = true; });
    }
  }

  saveState();
  render();
}

// ===== EVENT DELEGATION =====
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  render();

  // ---- Main list interactions ----
  document.getElementById('list-container').addEventListener('click', e => {
    const checkBtn = e.target.closest('[data-check]');
    if (checkBtn) { toggleCheck(parseInt(checkBtn.dataset.check)); return; }

    const tickBtn = e.target.closest('[data-tick]');
    if (tickBtn) { toggleBought(parseInt(tickBtn.dataset.tick)); return; }

    const catHeader = e.target.closest('.cat-header');
    if (catHeader && !e.target.closest('button')) { toggleCategory(catHeader.dataset.cat); return; }

    const addCat = e.target.closest('[data-addcat]');
    if (addCat) { openQuickAdd(addCat.dataset.addcat); return; }
  });

  // Long press on product rows
  document.getElementById('list-container').addEventListener('pointerdown', e => {
    // Category long press
    const catHeader = e.target.closest('.cat-header');
    if (catHeader && !e.target.closest('button')) {
      const cat = catHeader.dataset.cat;
      pressTimer = setTimeout(() => {
        pressTimer = null;
        const rect = catHeader.getBoundingClientRect();
        showCatContextMenu(cat, rect.left + 16, rect.top + rect.height);
      }, 550);
      return;
    }

    // Product long press
    const row = e.target.closest('.product-row');
    if (!row || e.target.closest('button')) return;
    row.classList.add('pressing');
    const id = parseInt(row.dataset.id);
    pressTimer = setTimeout(() => {
      pressTimer = null;
      row.classList.remove('pressing');
      const rect = row.getBoundingClientRect();
      showContextMenu(id, rect.left + 16, rect.top + rect.height / 2);
    }, 550);
  });

  document.getElementById('list-container').addEventListener('pointerup', e => {
    const row = e.target.closest('.product-row');
    if (row) row.classList.remove('pressing');
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  });

  document.getElementById('list-container').addEventListener('pointercancel', e => {
    const row = e.target.closest('.product-row');
    if (row) row.classList.remove('pressing');
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  });

  // Settings cats
  document.getElementById('s-cats-list').addEventListener('click', e => {
    const delBtn = e.target.closest('[data-delcat]');
    if (delBtn) { deleteCategory(delBtn.dataset.delcat); return; }
    if (e.target.closest('#s-btn-add-cat')) { openAddCat(); }
  });

  // ---- Product context menu ----
  document.getElementById('ctx-backdrop').addEventListener('click', () => {
    hideContextMenu();
    hideCatContextMenu();
  });
  document.getElementById('ctx-edit').addEventListener('click', () => {
    const id = ctxTargetId;
    hideContextMenu();
    openEdit(id);
  });
  document.getElementById('ctx-delete').addEventListener('click', () => {
    const id = ctxTargetId;
    hideContextMenu();
    deleteProduct(id);
  });

  // ---- Category context menu ----
  document.getElementById('ctx-cat-rename').addEventListener('click', () => {
    const cat = ctxCatTarget;
    hideCatContextMenu();
    openRenamecat(cat);
  });
  document.getElementById('ctx-cat-delete').addEventListener('click', () => {
    const cat = ctxCatTarget;
    hideCatContextMenu();
    deleteCategory(cat);
  });
  document.getElementById('ctx-cat-up').addEventListener('click', () => {
    moveCat(ctxCatTarget, 'up');
  });
  document.getElementById('ctx-cat-down').addEventListener('click', () => {
    moveCat(ctxCatTarget, 'down');
  });

  // ---- FAB & buttons ----
  document.getElementById('fab').addEventListener('click', () => openQuickAdd());
  document.getElementById('btn-add-cat').addEventListener('click', openAddCat);
  document.getElementById('btn-settings').addEventListener('click', () => showScreen('screen-settings'));
  document.getElementById('btn-back-settings').addEventListener('click', () => showScreen('screen-main'));

  // Search
  document.getElementById('search-input').addEventListener('input', render);
  document.getElementById('search-clear').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    render();
    document.getElementById('search-input').focus();
  });

  // ---- Quick add sheet ----
  document.getElementById('overlay-add').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay-add')) closeOverlay('overlay-add');
  });
  document.getElementById('qa-confirm').addEventListener('click', confirmQuickAdd);
  document.getElementById('qa-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { document.getElementById('qa-qty-input').focus(); }
    if (e.key === 'Escape') closeOverlay('overlay-add');
  });
  document.getElementById('qa-qty-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmQuickAdd();
    if (e.key === 'Escape') closeOverlay('overlay-add');
  });
  document.getElementById('qa-cats').addEventListener('click', e => {
    const chip = e.target.closest('[data-qacat]');
    if (chip) { qaCatSelected = chip.dataset.qacat; buildQACats('qa-cats'); }
  });

  // ---- Edit sheet ----
  document.getElementById('overlay-edit').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay-edit')) closeOverlay('overlay-edit');
  });
  document.getElementById('edit-confirm').addEventListener('click', confirmEdit);
  document.getElementById('edit-cancel').addEventListener('click', () => closeOverlay('overlay-edit'));
  document.getElementById('edit-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmEdit();
    if (e.key === 'Escape') closeOverlay('overlay-edit');
  });
  document.getElementById('edit-cats').addEventListener('click', e => {
    const chip = e.target.closest('[data-editcat]');
    if (chip) { editCatSelected = chip.dataset.editcat; buildEditCats(); }
  });

  // ---- Add category sheet ----
  document.getElementById('overlay-cat').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay-cat')) closeOverlay('overlay-cat');
  });
  document.getElementById('cat-confirm').addEventListener('click', confirmAddCat);
  document.getElementById('cat-cancel').addEventListener('click', () => closeOverlay('overlay-cat'));
  document.getElementById('cat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmAddCat();
    if (e.key === 'Escape') closeOverlay('overlay-cat');
  });

  // ---- Rename category sheet ----
  document.getElementById('overlay-rename-cat').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay-rename-cat')) closeOverlay('overlay-rename-cat');
  });
  document.getElementById('rename-cat-confirm').addEventListener('click', confirmRenameCat);
  document.getElementById('rename-cat-cancel').addEventListener('click', () => closeOverlay('overlay-rename-cat'));
  document.getElementById('rename-cat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmRenameCat();
    if (e.key === 'Escape') closeOverlay('overlay-rename-cat');
  });

  // ---- Settings ----
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  document.getElementById('tog-expand').addEventListener('click', () => togglePref('expandByDefault'));
  document.getElementById('tog-qty').addEventListener('click', () => togglePref('showQty'));
  document.getElementById('btn-clear-bought').addEventListener('click', clearBought);
  document.getElementById('btn-clear-all').addEventListener('click', clearAll);

  document.getElementById('tog-expand').setAttribute('aria-checked', state.prefs.expandByDefault);
  document.getElementById('tog-qty').setAttribute('aria-checked', state.prefs.showQty);

  if (!state.prefs.expandByDefault) {
    state.categories.forEach(c => {
      if (state.collapsed[c] === undefined) state.collapsed[c] = true;
    });
  }
  render();
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
