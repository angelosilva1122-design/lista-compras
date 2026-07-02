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
    showQty: true,
    superSearch: false
  },
  theme: 'auto'
};

let state = loadState();
let superMode = false;

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
    let catItems = state.items.filter(i => {
      if (i.cat !== cat) return false;
      if (superMode && !i.checked) return false;
      if (query) return i.name.toLowerCase().includes(query);
      return true;
    });

    if ((query || superMode) && catItems.length === 0) return;
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
        const lockedClass = superMode ? 'locked' : '';
        const tickClass = item.bought ? 'bought' : '';

        html += `<div class="product-row ${boughtClass}" data-id="${item.id}" role="listitem">
          <button class="left-check ${checkClass} ${lockedClass}" data-check="${item.id}" aria-label="Planeado: ${esc(item.name)}" aria-pressed="${item.checked}" ${superMode ? 'tabindex="-1"' : ''}>
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
  } else if (superMode && totalVisible === 0) {
    html = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
      <h3>Nenhum produto planeado</h3>
      <p>Sai do modo supermercado e marca os produtos que precisas</p>
    </div>`;
  } else if (query && totalVisible === 0) {
    html = `<div class="no-results">Nenhum resultado para "<strong>${esc(query)}</strong>"</div>`;
  }

  container.innerHTML = html;
  updateProgress();
  updateAddProductButton();
  updateExpandAllButton();
}

function updateAddProductButton() {
  const btn = document.getElementById('btn-add-product');
  if (!btn) return;
  btn.classList.toggle('disabled', state.categories.length === 0);
}

function updateProgress() {
  if (!superMode) return;
  const planned = state.items.filter(i => i.checked);
  const bought = planned.filter(i => i.bought);
  const total = planned.length;
  const done = bought.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('progress-text').textContent = `${done} de ${total} apanhado${total !== 1 ? 's' : ''}`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = pct + '%';

  const isComplete = total > 0 && done === total;
  document.getElementById('success-text').classList.toggle('hidden', !isComplete);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== SUPERMARKET MODE =====
function toggleSuperMode() {
  superMode = !superMode;
  const topbar = document.getElementById('topbar');
  const bottombar = document.querySelector('.bottombar');
  const progressWrap = document.getElementById('progress-wrap');
  const btn = document.getElementById('btn-supermarket');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  // Always clear search when entering supermarket mode
  if (superMode) {
    searchInput.value = '';
    searchClear.classList.remove('visible');
  }

  topbar.classList.toggle('super-mode', superMode);
  btn.classList.toggle('super-active', superMode);
  btn.setAttribute('aria-pressed', superMode);
  progressWrap.classList.toggle('hidden', !superMode);
  bottombar.style.display = superMode ? 'none' : 'flex';

  // Show/hide search based on pref when in supermarket mode
  // The CSS hides it by default (.topbar.super-mode .search-wrap { display: none })
  // If superSearch pref is enabled, override that
  const searchWrap = document.querySelector('.search-wrap');
  if (superMode && state.prefs.superSearch) {
    searchWrap.style.display = 'flex';
  } else if (!superMode) {
    searchWrap.style.display = '';
  }

  // Update status bar color on iOS
  const meta = document.getElementById('theme-color-meta');
  if (superMode) {
    meta.setAttribute('content', '#1a8a45');
  } else {
    applyTheme(state.theme);
  }

  render();
  if (superMode) showToast('Modo supermercado ativado');
}

// ===== EXPAND/COLLAPSE ALL =====
function toggleExpandAll() {
  const anyExpanded = state.categories.some(c => state.collapsed[c] !== true);
  if (anyExpanded) {
    // Collapse all
    state.categories.forEach(c => { state.collapsed[c] = true; });
  } else {
    // Expand all
    state.categories.forEach(c => { delete state.collapsed[c]; });
  }
  saveState();
  render();
}

function updateExpandAllButton() {
  const btn = document.getElementById('btn-expand-all');
  const text = document.getElementById('expand-all-text');
  if (!btn) return;
  const anyExpanded = state.categories.some(c => state.collapsed[c] !== true);
  btn.classList.toggle('all-collapsed', !anyExpanded);
  text.textContent = anyExpanded ? 'Recolher tudo' : 'Expandir tudo';
  btn.classList.toggle('hidden', state.categories.length === 0);
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

function openQuickAdd() {
  if (state.categories.length === 0) {
    showToast('Cria uma categoria primeiro');
    return;
  }
  qaCatSelected = null;
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
  if (!name) { document.getElementById('qa-input').focus(); return; }
  if (!qaCatSelected) { showToast('Seleciona uma categoria'); return; }
  const qty = document.getElementById('qa-qty-input').value.trim();
  state.items.push({
    id: Date.now(),
    name,
    qty,
    cat: qaCatSelected,
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

// ===== REORDER PRODUCT =====
function moveProduct(id, direction) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  // Only reorder within same category
  const catItems = state.items.filter(i => i.cat === item.cat);
  const catIdx = catItems.findIndex(i => i.id === id);

  if (direction === 'up' && catIdx === 0) return;
  if (direction === 'down' && catIdx === catItems.length - 1) return;

  const swapItem = direction === 'up' ? catItems[catIdx - 1] : catItems[catIdx + 1];

  // Swap positions in the main array
  const idxA = state.items.indexOf(item);
  const idxB = state.items.indexOf(swapItem);
  [state.items[idxA], state.items[idxB]] = [state.items[idxB], state.items[idxA]];

  saveState();
  hideContextMenu();
  render();
}
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

// ===== VERSION CHECK =====
const CURRENT_VERSION = '1.3.6';

async function checkVersion() {
  try {
    const resp = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const data = await resp.json();
    if (data.version && data.version !== CURRENT_VERSION) {
      document.getElementById('s-new-version').textContent = 'v' + data.version;
      document.getElementById('update-available').classList.remove('hidden');
    }
  } catch (e) {}
}

// ===== EXPORT =====
function exportList() {
  const backup = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    categories: state.categories,
    items: state.items,
    prefs: state.prefs
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compras-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Lista exportada');
}

// ===== IMPORT =====
const MAX_IMPORT_SIZE = 512 * 1024; // 512KB máximo
const MAX_CATEGORIES = 100;
const MAX_ITEMS = 1000;
const MAX_STRING_LENGTH = 200;

function validateImportData(data) {
  // Must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Ficheiro inválido';

  // Must have categories array
  if (!Array.isArray(data.categories)) return 'Ficheiro inválido: categorias em falta';
  if (data.categories.length > MAX_CATEGORIES) return `Demasiadas categorias (máximo ${MAX_CATEGORIES})`;
  for (const cat of data.categories) {
    if (typeof cat !== 'string') return 'Ficheiro inválido: categoria inválida';
    if (cat.length === 0 || cat.length > MAX_STRING_LENGTH) return 'Ficheiro inválido: nome de categoria inválido';
  }

  // Must have items array
  if (!Array.isArray(data.items)) return 'Ficheiro inválido: produtos em falta';
  if (data.items.length > MAX_ITEMS) return `Demasiados produtos (máximo ${MAX_ITEMS})`;
  for (const item of data.items) {
    if (!item || typeof item !== 'object') return 'Ficheiro inválido: produto inválido';
    if (typeof item.name !== 'string' || item.name.length === 0 || item.name.length > MAX_STRING_LENGTH) return 'Ficheiro inválido: nome de produto inválido';
    if (item.qty !== undefined && (typeof item.qty !== 'string' || item.qty.length > MAX_STRING_LENGTH)) return 'Ficheiro inválido: quantidade inválida';
    if (typeof item.cat !== 'string') return 'Ficheiro inválido: categoria do produto inválida';
    if (typeof item.checked !== 'boolean') return 'Ficheiro inválido: estado inválido';
    if (typeof item.bought !== 'boolean') return 'Ficheiro inválido: estado inválido';
    if (!data.categories.includes(item.cat)) return `Ficheiro inválido: produto "${item.name}" tem categoria desconhecida`;
  }

  // Validate prefs if present
  if (data.prefs !== undefined) {
    if (typeof data.prefs !== 'object' || Array.isArray(data.prefs)) return 'Ficheiro inválido: preferências inválidas';
    if (data.prefs.expandByDefault !== undefined && typeof data.prefs.expandByDefault !== 'boolean') return 'Ficheiro inválido: preferências inválidas';
    if (data.prefs.showQty !== undefined && typeof data.prefs.showQty !== 'boolean') return 'Ficheiro inválido: preferências inválidas';
  }

  return null; // válido
}

function importList(file) {
  if (!file) return;

  // Check file size
  if (file.size > MAX_IMPORT_SIZE) {
    showToast('Ficheiro demasiado grande (máx. 512KB)');
    return;
  }

  // Check file type
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    showToast('Formato inválido — usa um ficheiro .json');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const error = validateImportData(data);
      if (error) {
        showToast(error);
        return;
      }
      if (!confirm(`Importar lista com ${data.items.length} produto(s) e ${data.categories.length} categoria(s)? Os dados atuais serão substituídos.`)) return;
      state.categories = data.categories;
      state.items = data.items.map(item => ({
        id: typeof item.id === 'number' ? item.id : Date.now() + Math.random(),
        name: item.name,
        qty: item.qty || '',
        cat: item.cat,
        checked: item.checked,
        bought: item.bought
      }));
      if (data.prefs) {
        if (typeof data.prefs.expandByDefault === 'boolean') state.prefs.expandByDefault = data.prefs.expandByDefault;
        if (typeof data.prefs.showQty === 'boolean') state.prefs.showQty = data.prefs.showQty;
      }
      state.collapsed = {};
      saveState();
      render();
      showToast('Lista importada com sucesso');
    } catch (err) {
      showToast('Erro ao ler ficheiro — verifica se é um backup válido');
    }
  };
  reader.onerror = () => showToast('Erro ao ler ficheiro');
  reader.readAsText(file);
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

// "Concluir compras" no modo supermercado — limpa ticks e checkbox dos produtos
// comprados, mantém marcados (checkbox) os que ainda não foram comprados
function clearListAfterShopping() {
  if (!confirm('Concluir compras e sair do modo supermercado?')) return;
  state.items.forEach(i => {
    if (i.bought) {
      i.bought = false;
      i.checked = false;
    }
    // produtos só com checkbox (planeados, não comprados) mantêm-se inalterados
  });
  saveState();
  toggleSuperMode();
}

// ===== CONTEXT MENU (PRODUCTS) =====
let ctxTargetId = null;
let pressTimer = null;

function showContextMenu(id, x, y) {
  ctxTargetId = id;
  const menu = document.getElementById('ctx-menu');
  const backdrop = document.getElementById('ctx-backdrop');

  // Show/hide move buttons based on position within category
  const item = state.items.find(i => i.id === id);
  if (item) {
    const catItems = state.items.filter(i => i.cat === item.cat);
    const catIdx = catItems.findIndex(i => i.id === id);
    document.getElementById('ctx-prod-up').style.display = catIdx > 0 ? 'flex' : 'none';
    document.getElementById('ctx-prod-down').style.display = catIdx < catItems.length - 1 ? 'flex' : 'none';
    document.getElementById('ctx-prod-up-sep').style.display = catIdx > 0 ? 'block' : 'none';
    document.getElementById('ctx-prod-down-sep').style.display = catIdx < catItems.length - 1 ? 'block' : 'none';
  }

  const menuWidth = 200;
  const menuHeight = 180;
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

  const togId = key === 'expandByDefault' ? 'expand' : key === 'showQty' ? 'qty' : 'super-search';
  const tog = document.getElementById('tog-' + togId);
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
    if (addCat) { openQuickAdd(); return; }
  });

  // Long press on product rows
  document.getElementById('list-container').addEventListener('pointerdown', e => {
    // Category long press (disabled in supermarket mode)
    const catHeader = e.target.closest('.cat-header');
    if (catHeader && !e.target.closest('button')) {
      if (superMode) return;
      const cat = catHeader.dataset.cat;
      pressTimer = setTimeout(() => {
        pressTimer = null;
        const rect = catHeader.getBoundingClientRect();
        showCatContextMenu(cat, rect.left + 16, rect.top + rect.height);
      }, 550);
      return;
    }

    // Product long press (edit/delete/move disabled in supermarket mode)
    const row = e.target.closest('.product-row');
    if (!row || e.target.closest('button')) return;
    if (superMode) return;
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
  document.getElementById('ctx-prod-up').addEventListener('click', () => moveProduct(ctxTargetId, 'up'));
  document.getElementById('ctx-prod-down').addEventListener('click', () => moveProduct(ctxTargetId, 'down'));

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

  // ---- Bottom bar & navigation ----
  document.getElementById('btn-supermarket').addEventListener('click', toggleSuperMode);
  document.getElementById('btn-clear-list').addEventListener('click', clearListAfterShopping);
  document.getElementById('btn-expand-all').addEventListener('click', toggleExpandAll);
  document.getElementById('btn-add-product').addEventListener('click', () => openQuickAdd());
  document.getElementById('btn-add-cat').addEventListener('click', openAddCat);
  document.getElementById('btn-settings').addEventListener('click', () => showScreen('screen-settings'));
  document.getElementById('btn-back-settings').addEventListener('click', () => showScreen('screen-main'));

  // ---- Quick add cancel ----
  document.getElementById('qa-cancel').addEventListener('click', () => closeOverlay('overlay-add'));

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
  document.getElementById('tog-super-search').addEventListener('click', () => togglePref('superSearch'));
  document.getElementById('btn-clear-bought').addEventListener('click', clearBought);
  document.getElementById('btn-clear-all').addEventListener('click', clearAll);

  // Export / Import
  document.getElementById('btn-export').addEventListener('click', exportList);
  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', e => {
    importList(e.target.files[0]);
    e.target.value = '';
  });

  // Update instructions
  document.getElementById('btn-update').addEventListener('click', () => openOverlay('overlay-update'));
  document.getElementById('update-close').addEventListener('click', () => closeOverlay('overlay-update'));
  document.getElementById('update-open-safari').addEventListener('click', () => {
    closeOverlay('overlay-update');
    window.open('https://gleeful-gingersnap-3632fb.netlify.app', '_blank');
  });
  document.getElementById('overlay-update').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay-update')) closeOverlay('overlay-update');
  });

  document.getElementById('tog-expand').setAttribute('aria-checked', state.prefs.expandByDefault);
  document.getElementById('tog-qty').setAttribute('aria-checked', state.prefs.showQty);
  document.getElementById('tog-super-search').setAttribute('aria-checked', state.prefs.superSearch || false);

  if (!state.prefs.expandByDefault) {
    state.categories.forEach(c => {
      if (state.collapsed[c] === undefined) state.collapsed[c] = true;
    });
  }
  render();

  // Check for updates silently
  checkVersion();
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('Nova versão disponível — fecha e abre a app');
          }
        });
      });
    }).catch(() => {});
  });
}
