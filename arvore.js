(async () => {
"use strict";
const $ = (i) => document.getElementById(i);
const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
// nota histórica: "a árvore não carrega" (tela em branco, sem erro nenhum) era um comentário HTML
// em arvore.html fechado com "*/" (sintaxe de JS) em vez de "-->", que nunca fechava e engolia
// como texto TODO o resto do arquivo — inclusive a tag <script> inteira, que por isso nunca virava
// um elemento de verdade. Já corrigido; o script virou arquivo externo (arvore.js) durante essa
// investigação e não há motivo pra voltar a ser inline.
// erro de carregamento da árvore (ex.: RLS negou acesso, árvore/sistema não existe mais, módulo não
// carregou, rede caiu no meio do boot) — escrever só em #tree-name (dentro do .topbar padrão) fazia
// esse erro ficar INVISÍVEL no modo embutido, já que esse topbar some de propósito dentro da mesa
// (quem tem o dela por fora é a própria mesa). Sem aviso nenhum, a árvore só "não carregava", sem
// pista de por quê — por isso este banner central, que aparece em cima de tudo nos dois modos.
// Definida como "function" (não const) de propósito: fica disponível por hoisting mesmo sendo
// chamada mais acima no arquivo, dentro do catch dos imports logo abaixo.
function showBootError(msg) {
  const tn = $('tree-name'); if (tn) tn.innerHTML = `Erro: ${esc(msg)} <button type="button" class="btn sm auto" style="margin-left:8px" onclick="location.reload()">Tentar de novo</button>`;
  let banner = $('boot-error-banner');
  if (!banner) { banner = document.createElement('div'); banner.id = 'boot-error-banner'; banner.className = 'boot-error-banner'; document.body.appendChild(banner); }
  banner.innerHTML = `<span>Não deu pra carregar a árvore: ${esc(msg)}</span><button type="button" class="btn sm auto" onclick="location.reload()">Tentar de novo</button>`;
}
// import ESTÁTICO (`import x from 'y'`) não dá pra envolver em try/catch — se falhar (rede caiu,
// CDN do Supabase bloqueado por extensão, MIME errado do servidor, erro de sintaxe em db.js/ui.js),
// o módulo INTEIRO trava silenciosamente, sem lançar nada visível no console e sem rodar nem uma
// linha do resto do script (nem o catch do boot lá embaixo, que também é código deste mesmo módulo).
// Foi exatamente isso que aconteceu depois da correção grande: a árvore ficava com a tela em branco
// (ou, no modo embutido, com a barra da mesa E a barra da árvore empilhadas, já que a classe que
// esconde a segunda nunca era aplicada) sem NENHUM sinal de erro em lugar nenhum. Import DINÂMICO
// (`await import(...)`) dá pra envolver em try/catch de verdade — qualquer falha aqui agora aparece
// no banner central acima, com a mensagem exata, em vez de travar tudo em silêncio.
let db, mountHelp, mountThemeToggle, openHelpGuide, openProfileModal, openSettingsModal, toggleTheme, getTheme, trapFocus;
try {
  db = await import('./lib/db.js?v=45');
  ({ mountHelp, mountThemeToggle, openHelpGuide, openProfileModal, openSettingsModal, toggleTheme, getTheme, trapFocus } = await import('./lib/ui.js?v=7'));
} catch (e) {
  showBootError(`Não deu pra carregar os módulos da página (db.js/ui.js): ${e && e.message ? e.message : e}`);
  throw e;
}
// modo embutido: mesa.html mostra a árvore direto dentro da aba "Árvores" (dentro de um iframe),
// em vez de navegar pra esta página separada — isso é o que mantém a música tocando (o documento
// da mesa nunca descarrega) e o topbar/abas da mesa visíveis. Aberta assim, esta página não precisa
// da própria navegação (marca/voltar/menu de conta) nem dos próprios FABs de ajuda/tema — a mesa já
// tem os dela cobrindo a página inteira; um segundo botão flutuante dentro da caixa do iframe só
// ficaria redundante. Aberta direto (sem "embed=1" na URL), continua 100% igual a antes.
// A classe .embedded já foi aplicada bem mais cedo por um <script> síncrono logo no início do
// <body> (não depende de nada carregar) — aqui só cobre o caso não-embutido (FABs próprios).
const embedded = new URLSearchParams(location.search).get('embed') === '1';
if (!embedded) mountThemeToggle();
window.goBackEmbedded = async () => {
  if (hasUnsavedChanges()) {
    const ok = await confirmModal({ title: 'Sair sem salvar?', desc: 'Você tem edições não salvas nesta árvore — elas serão perdidas.', confirmLabel: 'Sair sem salvar' });
    if (!ok) return;
  }
  try { window.parent.backToArvoreList(); } catch (_) {}
};
// link "Voltar" do topbar padrão (modo não-embutido) — mesma checagem de edição pendente.
$('back')?.addEventListener('click', async (ev) => {
  if (!hasUnsavedChanges()) return;
  ev.preventDefault();
  const ok = await confirmModal({ title: 'Sair sem salvar?', desc: 'Você tem edições não salvas nesta árvore — elas serão perdidas.', confirmLabel: 'Sair sem salvar' });
  if (ok) location.href = $('back').href;
});
// ícones de linha (svgrepo-style, 24x24, stroke) — sem emoji em nenhuma opção de UI. O "✦" do
// selo de custo desenhado NA esfera do canvas fica de fora de propósito: é conteúdo visual do
// jogo (tema da árvore), não um ícone de interface.
const ic = (paths, attrs = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${paths}</svg>`;
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>';
// menu de conta no topo — mesmo padrão de mesa.html (perfil/configurações/ajuda/tema/sair)
let myName = null, myEmail = null;
function paintThemeMenuItem() {
  const icon = $('theme-menu-icon'), label = $('theme-menu-label'); if (!icon || !label) return;
  const light = getTheme() === 'light';
  icon.innerHTML = light ? ICON_SUN : ICON_MOON;
  label.textContent = light ? 'Tema: claro' : 'Tema: escuro';
}
paintThemeMenuItem();
function closeUserMenu() { $('nav-user')?.classList.remove('open'); $('nav-user-btn')?.setAttribute('aria-expanded', 'false'); }
window.toggleUserMenu = () => {
  const el = $('nav-user'); if (!el) return;
  const open = el.classList.toggle('open');
  $('nav-user-btn')?.setAttribute('aria-expanded', String(open));
  if (open) el.querySelector('.drop [role="menuitem"]')?.focus();
};
document.addEventListener('click', (e) => { if (!e.target.closest('#nav-user')) closeUserMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeUserMenu(); });
window.openProfile = () => {
  closeUserMenu();
  openProfileModal({
    email: myEmail, displayName: myName,
    onSave: async (name) => {
      await db.updateDisplayName(name);
      myName = name;
      $('who').textContent = myName;
      $('nav-av').textContent = myName.trim().charAt(0).toUpperCase() || '?';
    },
  });
};
window.openSettings = () => {
  closeUserMenu();
  openSettingsModal({ onChangePassword: async (pw) => { await db.updatePassword(pw); } });
};
window.openHelp = () => { closeUserMenu(); openHelpGuide('arvore'); };
window.doToggleTheme = () => { toggleTheme(); paintThemeMenuItem(); cssVarCache.clear(); }; // cores resolvidas do canvas (--ink/--brass/--maq/--mono) mudam de valor com o tema
window.logout = () => { db.signOut().then(() => { location.href = 'login.html'; }); };
// modal de confirmação estilizado (mesmo padrão visual do guia) — substitui confirm() nativo
function confirmModal({ title, desc, confirmLabel = 'Confirmar', danger = true } = {}) {
  return new Promise((resolve) => {
    const trigger = document.activeElement;
    const w = document.createElement('div');
    w.className = 'ui-modal';
    w.setAttribute('role', 'alertdialog');
    w.setAttribute('aria-modal', 'true');
    w.setAttribute('aria-labelledby', 'confirm-title');
    w.innerHTML = `<div class="box guide">
      <div class="ghead"><h3 id="confirm-title">${esc(title)}</h3><button class="x" aria-label="Fechar">×</button></div>
      <p class="gintro">${esc(desc)}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">
        <button class="btn auto" id="cm-cancel">Cancelar</button>
        <button class="btn auto ${danger ? 'danger' : 'go'}" id="cm-ok">${esc(confirmLabel)}</button>
      </div>
    </div>`;
    const untrap = trapFocus(w);
    const finish = (result) => { untrap(); w.remove(); document.removeEventListener('keydown', onEsc); if (trigger && trigger.focus) trigger.focus(); resolve(result); };
    const onEsc = (e) => { if (e.key === 'Escape') finish(false); };
    w.addEventListener('click', (e) => { if (e.target === w) finish(false); });
    w.querySelector('.x').onclick = () => finish(false);
    w.querySelector('#cm-cancel').onclick = () => finish(false);
    w.querySelector('#cm-ok').onclick = () => finish(true);
    document.addEventListener('keydown', onEsc);
    document.body.appendChild(w);
    w.querySelector('#cm-ok').focus();
  });
}
// seletor de cor próprio — um color picker de verdade (quadrado de saturação/brilho + barra de
// matiz arrastáveis + hex + atalhos de paleta), substitui <input type="color"> nativo do navegador.
// openColorPicker(botãoGatilho, corAtual, (novaCor)=>...) — chama onPick a cada mudança (igual o
// oninput do color picker nativo), pro chamador poder ter preview ao vivo se quiser.
const COLOR_PRESETS = ['#f2585e','#fb923c','#f5b93d','#eab308','#84cc16','#22c55e','#3ecf7e','#10b981',
  '#14b8a6','#35c6d4','#18b5c6','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7',
  '#d946ef','#ec4899','#e9edf1','#93a0ab','#5c6771','#7ee6dc'];
function hexToHsv(hex) {
  hex = (hex || '#7ee6dc').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255 || 0, g = parseInt(hex.slice(2, 4), 16) / 255 || 0, b = parseInt(hex.slice(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
function hsvToHex(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
let _colorPop = null;
function closeColorPicker() {
  if (!_colorPop) return;
  _colorPop.remove(); _colorPop = null;
  document.removeEventListener('mousedown', _cpOutside, true);
  document.removeEventListener('keydown', _cpEsc);
}
function _cpOutside(e) { if (_colorPop && !_colorPop.contains(e.target)) closeColorPicker(); }
function _cpEsc(e) { if (e.key === 'Escape') closeColorPicker(); }
window.openColorPicker = (trigger, current, onPick) => {
  closeColorPicker();
  const state = hexToHsv(current);
  const pop = document.createElement('div');
  pop.className = 'color-pop';
  pop.innerHTML = `
    <div class="cp-sv" id="cp-sv"><div class="cp-sv-cursor" id="cp-sv-cursor"></div></div>
    <div class="cp-hue" id="cp-hue"><div class="cp-hue-cursor" id="cp-hue-cursor"></div></div>
    <div class="cp-bottom">
      <span class="cp-preview" id="cp-preview"></span>
      <input type="text" class="cp-hex" id="cp-hex" maxlength="7">
    </div>
    <div class="cp-grid">${COLOR_PRESETS.map((c) => `<button type="button" class="cp-swatch" style="--sw:${c}" data-c="${c}" title="${c}"></button>`).join('')}</div>`;
  document.body.appendChild(pop);

  const svEl = pop.querySelector('#cp-sv'), svCur = pop.querySelector('#cp-sv-cursor');
  const hueEl = pop.querySelector('#cp-hue'), hueCur = pop.querySelector('#cp-hue-cursor');
  const preview = pop.querySelector('#cp-preview'), hexInput = pop.querySelector('#cp-hex');

  function render() {
    svEl.style.setProperty('--h', state.h);
    svCur.style.left = (state.s * svEl.clientWidth) + 'px';
    svCur.style.top = ((1 - state.v) * svEl.clientHeight) + 'px';
    hueCur.style.left = (state.h / 360 * hueEl.clientWidth) + 'px';
    const hex = hsvToHex(state.h, state.s, state.v);
    preview.style.setProperty('--sw', hex);
    hexInput.value = hex;
    trigger.style.setProperty('--sw', hex);
    onPick(hex);
  }
  function dragSV(e) {
    const r = svEl.getBoundingClientRect();
    state.s = Math.min(Math.max(0, e.clientX - r.left), r.width) / r.width;
    state.v = 1 - Math.min(Math.max(0, e.clientY - r.top), r.height) / r.height;
    render();
  }
  function dragHue(e) {
    const r = hueEl.getBoundingClientRect();
    state.h = Math.min(Math.max(0, e.clientX - r.left), r.width) / r.width * 360;
    render();
  }
  svEl.addEventListener('pointerdown', (e) => {
    svEl.setPointerCapture(e.pointerId); dragSV(e);
    const mv = (ev) => dragSV(ev), up = () => { svEl.removeEventListener('pointermove', mv); svEl.removeEventListener('pointerup', up); };
    svEl.addEventListener('pointermove', mv); svEl.addEventListener('pointerup', up);
  });
  hueEl.addEventListener('pointerdown', (e) => {
    hueEl.setPointerCapture(e.pointerId); dragHue(e);
    const mv = (ev) => dragHue(ev), up = () => { hueEl.removeEventListener('pointermove', mv); hueEl.removeEventListener('pointerup', up); };
    hueEl.addEventListener('pointermove', mv); hueEl.addEventListener('pointerup', up);
  });
  pop.querySelectorAll('.cp-swatch').forEach((b) => {
    b.onclick = () => { const hsv = hexToHsv(b.dataset.c); state.h = hsv.h; state.s = hsv.s; state.v = hsv.v; render(); };
  });
  hexInput.addEventListener('change', () => {
    const v = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) { const hsv = hexToHsv(v); state.h = hsv.h; state.s = hsv.s; state.v = hsv.v; render(); }
  });

  const r = trigger.getBoundingClientRect();
  let left = r.left, top = r.bottom + 6;
  if (left + pop.offsetWidth > window.innerWidth - 8) left = window.innerWidth - pop.offsetWidth - 8;
  if (top + pop.offsetHeight > window.innerHeight - 8) top = r.top - pop.offsetHeight - 6;
  pop.style.left = Math.max(8, left) + 'px';
  pop.style.top = Math.max(8, top) + 'px';
  _colorPop = pop;
  render();
  setTimeout(() => {
    document.addEventListener('mousedown', _cpOutside, true);
    document.addEventListener('keydown', _cpEsc);
  }, 0);
};
const ICONS = {
  check: ic('<path d="M5 12.5l4.5 4.5L19 7"/>', 'stroke-width="1.8"'),
  x: ic('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="1.8"'),
  flipV: ic('<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>'),
  flipH: ic('<path d="M3 12h18M7 8 3 12l4 4M17 8l4 4-4 4"/>'),
  rotateCw: ic('<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>'),
  rotateCcw: ic('<path d="M4 12a8 8 0 1 1 2.3 5.6"/><path d="M4 4v5h5"/>'),
  sparkle: ic('<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/><circle cx="12" cy="12" r="2.4"/>'),
};
const params = new URLSearchParams(location.search);
// ?template=<id>: modelo de árvore da conta (Criação → Criar → Árvores), sem sistema — o editor é o
// mesmo, mas trabalha numa cópia na memória e só grava na conta com "Salvar modelo" (ver setupTemplateMode)
const templateParam = params.get('template'), isTemplate = !!templateParam;
const treeId = params.get('tree') || (isTemplate ? 'modelo' : null), systemId = params.get('system');
// kind ('ok'/undefined=erro) só estiliza a cor — várias chamadas já passavam isso mas era
// ignorado, então sucesso e erro apareciam idênticos
const showMsg = (t, kind) => { const el = $('count'); el.textContent = t; el.className = 'count' + (kind === 'ok' ? ' ok' : ' err'); setTimeout(() => refreshCount(), 2500); };

const SVGNS = "http://www.w3.org/2000/svg";
// SVG puro (decoração): #rings/#gridPolar/#snapMark. As esferas/conexões (antes um <g id="world">
// cheio de <g>/<line> de SVG) viraram um <canvas> — ver o comentário grande perto de drawWorld()
// mais abaixo pra entender por quê. "stage" é o elemento que recebe todo clique/arrasto agora
// (pan/zoom/pinça/arrastar esfera/colocar/ligar/área) — antes isso morava no <svg id="grid"> inteiro.
const stage = $('worldCanvas'), sctx = stage.getContext('2d');
const ringsEl = $('rings'), ringsInner = $('ringsInner');
const gridPolarEl = $('gridPolar'), gridPolarInner = $('gridPolarInner'), snapMarkEl = $('snapMark');
const marqueeEl = $('marquee'), batchPanelEl = $('batchpanel');
const focusProxy = $('tree-focus-proxy'), liveRegion = $('tree-live'); // acessibilidade por teclado — ver seção "teclado (canvas)"
let focusedNodeId = null; // id (não índice) — ver seção "teclado (canvas)" mais abaixo pro motivo
let W = innerWidth, H = innerHeight;
let DPR = Math.min(devicePixelRatio || 1, 2); // usado pelo #fx (partículas) e pelo #worldCanvas
let isGM = false; // só vira true depois do boot confirmar que o usuário é dono do sistema
let nodeById = new Map(); // reconstruído em rebuildIndexes() — usado no lugar de nodes.find()
// nada no editor de esfera grava sozinho mais — os campos só mudam o rascunho local (`selected`)
// e mostram o botão Salvar; editorSnapshot guarda como a esfera estava ao abrir, pra dar pra
// descartar (trocar de esfera ou fechar o painel com edição pendente pede confirmação).
let editorDirty = false, editorSnapshot = null;
// prévias de cor de fundo/linhas/anéis nunca tiveram estado de "sujo" — dava pra mexer no seletor,
// nunca clicar em Aplicar, e sair (Voltar/fechar aba) sem nenhum aviso de que a prévia se perderia
let colorPreviewDirty = false;
function hasUnsavedChanges() {
  if (editorDirty || colorPreviewDirty) return true;
  // linha de Via com o próprio botão "Salvar" visível = edição pendente também
  return [...document.querySelectorAll('[id^="via-save-"]')].some((b) => b.style.display !== 'none');
}
addEventListener('beforeunload', (e) => { if (hasUnsavedChanges()) { e.preventDefault(); e.returnValue = ''; } });
let tool = 'select', selected = null, linkSrc = null, view = { x: W/2, y: H/2, s: 1 }, coreNode = null;
let selectedEdge = null; // conexão clicada (só GM) — Delete apaga; antes não existia jeito nenhum
                          // de remover UMA ligação sem apagar uma das duas esferas inteiras
let nodes = [], edges = [];
let areaSelection = new Set();
const byId = (i) => nodeById.get(i); // Map.get é O(1) — nodes.find() era O(n), rodava por quadro dentro do desenho das conexões
const MINZOOM = 0.35;

/* ---------- grade de encaixe — formato escolhido por árvore ----------
   octógono/hexágono: polar centrada no Núcleo, anéis concêntricos divididos em ângulos
   iguais (múltiplos de 8 ou 6), pra que caminhos que saem do centro sempre formem
   polígonos regulares, nunca a distância desigual entre vizinhos de uma grade quadrada.
   linear: grade quadrada simples (linhas/colunas), independente do Núcleo. */
const RING_STEP = 48, RING_MAX = 25, LINEAR_STEP = 60;
const SHAPE_SEGMENTS = { octagon: 8, hexagon: 6 };
let gridShape = 'octagon';
let ringColor = '#c6d2ff';
let ringOpacity = 1;
let edgeColor = '#d6f0ff';

function polarSnap(x, y) {
  const core = coreNode || nodes.find((n) => n.kind === 'core');
  if (!core) return { x: Math.round(x), y: Math.round(y) };
  const segs0 = SHAPE_SEGMENTS[gridShape] || 8;
  const dx = x - core.x, dy = y - core.y;
  const dist = Math.hypot(dx, dy);
  const ringIndex = Math.max(1, Math.min(RING_MAX, Math.round(dist / RING_STEP)));
  const r = ringIndex * RING_STEP, segs = segs0 * ringIndex, step = (Math.PI * 2) / segs;
  const angle = dist < 1e-6 ? 0 : Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / step) * step;
  return { x: Math.round(core.x + r * Math.cos(snappedAngle)), y: Math.round(core.y + r * Math.sin(snappedAngle)) };
}
function linearSnap(x, y) { return { x: Math.round(x / LINEAR_STEP) * LINEAR_STEP, y: Math.round(y / LINEAR_STEP) * LINEAR_STEP }; }
// grade quadrada simples, no mesmo passo dos anéis (RING_STEP) — usada só pelo Núcleo em formato
// octógono/hexágono, onde polarSnap não pode ser aplicado nele (a grade polar É centrada nele;
// "encaixar" o próprio centro na grade que nasce dele seria autorreferente, sempre voltaria pra
// uma distância mínima de 1 anel de si mesmo, nunca ficando de fato onde foi arrastado). Sem isso
// o Núcleo era o único ponto da árvore que se movia livre, pixel a pixel, enquanto tudo ao redor
// dele encaixava direitinho.
function coreSnap(x, y) { return { x: Math.round(x / RING_STEP) * RING_STEP, y: Math.round(y / RING_STEP) * RING_STEP }; }
function gridSnap(x, y, isCore) {
  // Em formato linear, a grade é uma malha fixa independente do Núcleo — ele deve encaixar nela
  // igual qualquer outra esfera, senão fica "solto" enquanto tudo ao redor está alinhado.
  if (isCore) return gridShape === 'linear' ? linearSnap(x, y) : coreSnap(x, y);
  return gridShape === 'linear' ? linearSnap(x, y) : polarSnap(x, y);
}
function buildGridVisual() {
  if (gridShape === 'linear') {
    const R = 1200; let s = '';
    for (let x = -R; x <= R; x += LINEAR_STEP) for (let y = -R; y <= R; y += LINEAR_STEP)
      s += `<circle class="gpdot" cx="${x}" cy="${y}" r="1.6"></circle>`;
    gridPolarInner.innerHTML = s;
    return;
  }
  const segs0 = SHAPE_SEGMENTS[gridShape] || 8; let s = '';
  for (let i = 1; i <= RING_MAX; i++) {
    const r = i * RING_STEP, segs = segs0 * i;
    s += `<circle class="gpring" r="${r}"></circle>`;
    for (let k = 0; k < segs; k++) { const a = (Math.PI * 2 * k) / segs;
      s += `<circle class="gpdot" cx="${(r * Math.cos(a)).toFixed(2)}" cy="${(r * Math.sin(a)).toFixed(2)}" r="1.6"></circle>`; }
  }
  gridPolarInner.innerHTML = s;
}
window.changeGridShape = (v) => {
  if (!isGM) return;
  gridShape = v; buildGridVisual(); buildRings(); renderDupOptions(); busDirty = true; syncLevelUi();
  db.updateSystemTree(treeId, { grid_shape: v }).catch((e) => showMsg(e.message));
};
let snapMarkPos = null;
function updateSnapMarkTransform() { if (snapMarkPos) snapMarkEl.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.s}) translate(${snapMarkPos.x} ${snapMarkPos.y})`); }
function showSnapMark(x, y) { snapMarkPos = { x, y }; snapMarkEl.classList.add('show'); updateSnapMarkTransform(); }
function hideSnapMark() { snapMarkPos = null; snapMarkEl.classList.remove('show'); }

/* ---------- Vias (afinidades) — lista livre por árvore, nasce só com "Núcleo" ----------
   o Mestre adiciona outras manualmente (nome + cor livre), do mesmo jeito que escolhe a cor de fundo. */
const DEFAULT_VIAS = [{ key: 'neutral', name: 'Núcleo', color: '#e3c071' }];
let vias = DEFAULT_VIAS.map((v) => ({ ...v }));
/* ---------- atributos do sistema (pra ligar modificador de esfera a um status real) e
   progresso do jogador (esferas desbloqueadas + pontos disponíveis) ---------- */
let stats = [];
let unlockedIds = new Set();
let myPoints = 0;
// níveis e barramento (supabase/migrations/20260930_arvore_niveis_barramento.sql). hasLevelCol/hasTreeOpts
// dizem se a migração já rodou — sem ela os controles novos ficam escondidos e nada do resto muda.
let hasLevelCol = false, hasTreeOpts = false;
let edgeStyle = 'lines', busDir = 'auto', requireCharLevel = false;
// barramento editável (supabase/migrations/20261001_arvore_barramento_editavel.sql): group + paths
let hasBusConfig = false, busConfig = { group: 'level', paths: {}, stubs: {}, buses: null };
// nível do personagem: a mesa passa &lvl= ao embutir a árvore (o servidor confere de novo ao desbloquear)
const charLevel = params.get('lvl') ? Math.max(1, parseInt(params.get('lvl'), 10) || 1) : null;
const statById = (id) => stats.find((s) => s.id === id);
const viaByKey = (key) => vias.find((v) => v.key === key) || vias[0] || DEFAULT_VIAS[0];
const genViaKey = () => 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function saveVias() { return db.updateSystemTree(treeId, { vias }); }
function renderViaChips() {
  $('e-fac').innerHTML = vias.map((v) =>
    `<div class="chip" data-f="${v.key}" style="--vc:${v.color}" onclick="patch('fac','${v.key}')">${esc(v.name)}</div>`).join('');
  if (selected) $('e-fac').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.f === selected.fac));
  // mesmos chips, no painel de edição em lote — aplica a via pra toda a seleção de área de uma vez
  $('batch-fac').innerHTML = vias.map((v) =>
    `<div class="chip" data-f="${v.key}" style="--vc:${v.color}" onclick="batchSet('fac','${v.key}')">${esc(v.name)}</div>`).join('');
  renderViaLegend();
}
// legenda fixa "nome da via — cor" num canto do canvas — antes só dava pra saber a via de uma
// esfera clicando nela uma a uma; com 1 via só (a "Núcleo" padrão) não há distinção nenhuma pra
// mostrar, então a legenda fica escondida
function renderViaLegend() {
  const el = $('via-legend'); if (!el) return;
  if (vias.length <= 1) { el.style.display = 'none'; return; }
  // recolhível (MELHORIAS-v1.4 P1-14): o cabeçalho "Legenda" abre/fecha; a escolha fica lembrada
  let closed = false; try { closed = localStorage.getItem('vt_legend') === '0'; } catch (_) {}
  el.classList.toggle('closed', closed);
  el.innerHTML = `<button type="button" class="via-legend-head" aria-expanded="${!closed}" onclick="toggleViaLegend()">Legenda</button>` +
    `<div class="via-legend-rows">` + vias.map((v) =>
    `<div class="via-legend-row"><span class="via-legend-dot" style="background:${esc(v.color)}"></span><span class="via-legend-name">${esc(v.name)}</span></div>`).join('') + `</div>`;
  el.style.display = '';
}
window.toggleViaLegend = () => {
  const el = $('via-legend'); if (!el) return;
  const closed = el.classList.toggle('closed');
  el.querySelector('.via-legend-head')?.setAttribute('aria-expanded', String(!closed));
  try { localStorage.setItem('vt_legend', closed ? '0' : '1'); } catch (_) {}
};
function renderViaManager() {
  $('via-edit').innerHTML = vias.map((v) => `
    <div class="via-row">
      <button type="button" class="color-swatch sm" title="Cor da via" style="--sw:${v.color}" onclick="openColorPicker(this, '${v.color}', (c)=>onViaFieldChange('${v.key}','color',c))"></button>
      <input type="text" value="${esc(v.name)}" maxlength="24" oninput="onViaFieldChange('${v.key}','name',this.value)">
      <button type="button" class="btn sm go" id="via-save-${v.key}" style="display:none" onclick="saveViaRow('${v.key}')" title="Salvar"><span class="ic">${ICONS.check}</span></button>
      <button type="button" class="via-del" onclick="deleteVia('${v.key}')" title="Excluir via" aria-label="Excluir via"><span class="ic">${ICONS.x}</span></button>
    </div>
    <div class="via-row via-lvl lvl-only">
      <label class="via-lock"><input type="checkbox" ${v.lock ? 'checked' : ''} onchange="toggleViaLock('${v.key}', this.checked)"><span>Uma escolha por nível</span></label>
      <button type="button" class="tool" onclick="linkViaLevels('${v.key}')" title="Liga cada habilidade desta via a todas do nível seguinte">Ligar nível a nível</button>
    </div>`).join('') + `
    <div class="via-row">
      <button type="button" class="color-swatch sm" title="Cor da nova via" style="--sw:#7ee6dc" onclick="openColorPicker(this, document.getElementById('via-new-color').value, (v)=>{ document.getElementById('via-new-color').value = v; })"></button>
      <input type="hidden" id="via-new-color" value="#7ee6dc">
      <input type="text" id="via-new-name" placeholder="Nova via (ex.: Sangue)" maxlength="24">
      <button type="button" class="via-add-btn" onclick="addVia()" title="Adicionar via" aria-label="Adicionar via">+</button>
    </div>`;
}
window.toggleViaEdit = () => { if (!isGM) return; const el = $('via-edit'); el.style.display = el.style.display === 'none' ? '' : 'none'; };
// edita localmente (com pré-visualização imediata na árvore) — só grava no banco quando a linha
// da via é salva explicitamente, igual ao resto do editor agora.
window.onViaFieldChange = (key, field, value) => {
  if (!isGM) return; const v = viaByKey(key); if (!v) return;
  v[field] = field === 'name' ? value : value; // nome só normaliza (trim) ao salvar, não durante a digitação
  renderViaChips(); if (field === 'color') render();
  const b = $('via-save-' + key); if (b) b.style.display = '';
};
window.saveViaRow = (key) => {
  if (!isGM) return; const v = viaByKey(key); if (!v) return;
  v.name = (v.name || '').trim() || v.name;
  const btn = $('via-save-' + key); if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  saveVias().then(() => { renderViaChips(); if (btn) btn.style.display = 'none'; showMsg('Via salva.', 'ok'); })
    .catch((e) => showMsg(e.message))
    .finally(() => { if (btn) { btn.classList.remove('loading'); btn.disabled = false; } });
};
window.addVia = () => {
  if (!isGM) return;
  const name = ($('via-new-name').value || '').trim() || 'Nova via';
  const color = $('via-new-color').value || '#7ee6dc';
  vias.push({ key: genViaKey(), name, color });
  renderViaChips(); renderViaManager(); saveVias().catch((e) => showMsg(e.message));
};
window.deleteVia = async (key) => {
  if (!isGM) return;
  if (vias.length <= 1) { showMsg('Precisa sobrar pelo menos uma Via.'); return; }
  if (nodes.some((n) => n.fac === key)) { showMsg('Essa via está em uso — troque a via das habilidades antes de excluir.'); return; }
  const via = vias.find((v) => v.key === key);
  const ok = await confirmModal({ title: 'Excluir via', desc: `Remove "${via?.name || 'esta via'}" das opções de afinidade. Não dá pra desfazer.`, confirmLabel: 'Excluir' });
  if (!ok) return;
  vias = vias.filter((v) => v.key !== key);
  renderViaChips(); renderViaManager(); saveVias().catch((e) => showMsg(e.message));
};


/* ============================================================
   Níveis e barramento (opções da árvore)
   ============================================================ */
function syncLevelUi() {
  document.body.classList.toggle('no-levels', !hasLevelCol);
  document.body.classList.toggle('no-tree-opts', !hasTreeOpts);
  const es = $('edge-style'); if (es) es.value = edgeStyle;
  const bd = $('bus-dir'); if (bd) { bd.value = busDir; bd.hidden = !(edgeStyle === 'bus' && gridShape === 'linear'); }
  const rc = $('req-char-level'); if (rc) rc.checked = requireCharLevel;
  const al = $('auto-levels-btn'); if (al) al.textContent = gridShape === 'linear' ? 'Nível pela fileira' : 'Nível pelo anel';
}
function saveTreeOpt(patchObj, okMsg) {
  if (!isGM || !hasTreeOpts) return;
  db.updateSystemTree(treeId, patchObj).then(() => showMsg(okMsg, 'ok')).catch((e) => showMsg(e.message));
}
window.setEdgeStyle = (v) => {
  edgeStyle = v === 'lines' ? 'lines' : 'bus';
  busDirty = true; deselectBus(); syncLevelUi();
  saveTreeOpt({ edge_style: edgeStyle }, edgeStyle === 'lines' ? 'Todas as linhas.' : 'Barramentos ligados. Crie um novo selecionando habilidades com a Área.');
};
window.setBusDir = (v) => { busDir = v; syncLevelUi(); saveTreeOpt({ bus_dir: v }, 'Direção salva.'); };
window.setRequireCharLevel = (on) => { requireCharLevel = !!on; saveTreeOpt({ require_char_level: requireCharLevel }, on ? 'A árvore agora exige o nível do personagem.' : 'Nível do personagem não é mais exigido.'); };
window.toggleViaLock = (key, on) => {
  if (!isGM) return; const v = viaByKey(key); if (!v) return;
  v.lock = !!on;
  saveVias().then(() => showMsg(on ? `"${v.name}": uma escolha por nível.` : `"${v.name}": sem trava por nível.`, 'ok')).catch((e) => showMsg(e.message));
};

// direção de crescimento no formato linear: automática (de onde está o nível de cima para o de baixo) ou fixa
function linearDir(P, C) {
  if (busDir && busDir !== 'auto') return busDir;
  const mean = (arr, k) => arr.reduce((s, n) => s + n[k], 0) / arr.length;
  const dx = mean(C, 'x') - mean(P, 'x'), dy = mean(C, 'y') - mean(P, 'y');
  return Math.abs(dy) >= Math.abs(dx) ? (dy >= 0 ? 'down' : 'up') : (dx >= 0 ? 'right' : 'left');
}
const TO_LOCAL = { down: (p) => ({ l: p.x, d: p.y }), up: (p) => ({ l: p.x, d: -p.y }), right: (p) => ({ l: p.y, d: p.x }), left: (p) => ({ l: p.y, d: -p.x }) };
const TO_WORLD = { down: (l, d) => ({ x: l, y: d }), up: (l, d) => ({ x: l, y: -d }), right: (l, d) => ({ x: d, y: l }), left: (l, d) => ({ x: -d, y: l }) };

// "Nível pelo anel" / "pela fileira": numera as camadas de cada via, em cada ramo do Núcleo, a partir
// dele (1, 2, 3…), sem buracos — anéis ou fileiras vazias não viram níveis
window.autoLevels = async () => {
  if (!isGM || !hasLevelCol) return;
  const core = coreNode || nodes.find((n) => n.kind === 'core');
  const pool = (areaSelection.size ? nodes.filter((n) => areaSelection.has(n.id)) : nodes).filter((n) => n.kind !== 'core');
  if (!pool.length) { showMsg('Nenhuma habilidade para numerar.'); return; }
  const linear = gridShape === 'linear';
  const dir = busDir && busDir !== 'auto' ? busDir : 'down';
  const layer = (n) => {
    if (!linear && core) return Math.max(1, Math.round(Math.hypot(n.x - core.x, n.y - core.y) / RING_STEP));
    const base = core ? TO_LOCAL[dir](core).d : Math.min(...pool.map((x) => TO_LOCAL[dir](x).d)) - LINEAR_STEP;
    return Math.round((TO_LOCAL[dir](n).d - base) / LINEAR_STEP);
  };
  const byVia = new Map();
  pool.forEach((n) => { const k = branchOf.get(n.id) + '|' + (n.fac || ''); (byVia.get(k) || byVia.set(k, []).get(k)).push(n); });
  const next = new Map();
  byVia.forEach((list) => {
    const layers = [...new Set(list.map(layer))].sort((a, b) => a - b);
    list.forEach((n) => next.set(n.id, layers.indexOf(layer(n)) + 1));
  });
  const changed = pool.filter((n) => (n.level ?? null) !== next.get(n.id));
  if (!changed.length) { showMsg('Os níveis já estão numerados assim.', 'ok'); return; }
  const ok = await confirmModal({ title: linear ? 'Nível pela fileira' : 'Nível pelo anel', danger: false, confirmLabel: 'Numerar',
    desc: `Define o nível de ${changed.length} habilidade(s) ${areaSelection.size ? 'selecionada(s)' : 'da árvore'} pela ${linear ? 'fileira' : 'distância do Núcleo'}, contando 1, 2, 3… em cada via${branchCount > 1 ? ' e em cada ramo do Núcleo' : ''}. Os níveis que você já tinha colocado nelas serão trocados.` });
  if (!ok) return;
  changed.forEach((n) => { n.level = next.get(n.id); });
  busDirty = true;
  Promise.all(changed.map((n) => db.updateTreeNode(n.id, { level: n.level })))
    .then(() => showMsg(`${changed.length} habilidade(s) numerada(s).`, 'ok')).catch((e) => showMsg(e.message));
};

// "Ligar nível a nível": cada esfera de nível N da via se liga a todas as de nível N+1 (o que já estiver
// ligado fica como está); nível 1 sem nenhuma conexão se liga ao Núcleo. Nunca liga um ramo do Núcleo a
// outro (isso juntaria os dois): com seleção de área, só liga dentro dela; sem seleção, só dentro de
// cada ramo. Uma coluna nova, ainda solta, se liga selecionando ela com a Área.
window.linkViaLevels = async (key) => {
  if (!isGM || !hasLevelCol) return;
  const via = viaByKey(key);
  const list = nodes.filter((n) => n.fac === key && n.kind !== 'core' && n.level != null && (!areaSelection.size || areaSelection.has(n.id)));
  if (!list.length) { showMsg(`Defina o nível das habilidades de "${via?.name || 'desta via'}" primeiro.`); return; }
  const has = (a, b) => edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  const pairs = [];
  const ok2 = (p, c) => areaSelection.size || sameBranch(p, c);
  let skipped = 0;
  list.forEach((p) => list.forEach((c) => { if (c.level === p.level + 1 && !has(p.id, c.id)) { if (ok2(p, c)) pairs.push([p.id, c.id]); else skipped++; } }));
  const core = coreNode || nodes.find((n) => n.kind === 'core');
  if (core) list.filter((n) => n.level === 1 && !edges.some((e) => e.a === n.id || e.b === n.id)).forEach((n) => pairs.push([core.id, n.id]));
  if (!pairs.length) {
    showMsg(skipped ? 'Nada a ligar dentro dos ramos. Para ligar uma coluna ainda solta, selecione ela com a ferramenta Área e use "Ligar nível a nível" de novo.'
      : 'Os níveis desta via já estão todos ligados.', skipped ? undefined : 'ok');
    return;
  }
  const ok = await confirmModal({ title: 'Ligar nível a nível', danger: false, confirmLabel: 'Ligar',
    desc: `Cria ${pairs.length} conexão(ões) em "${via?.name || 'esta via'}"${areaSelection.size ? ', só entre as habilidades selecionadas' : ''}: cada habilidade passa a levar a todas as do nível seguinte${!areaSelection.size && branchCount > 1 ? ' do mesmo ramo' : ''}.` });
  if (!ok) return;
  try {
    const made = await Promise.all(pairs.map(([a, b]) => db.insertTreeEdge(treeId, a, b)));
    made.forEach((e) => { if (e) edges.push({ id: e.id, a: e.a, b: e.b }); });
    render();
    showMsg(`${made.filter(Boolean).length} conexão(ões) criada(s).`, 'ok');
  } catch (e) { showMsg(e.message); }
};

// ---------- ramos do Núcleo ----------
// Um ramo é o que continua ligado entre si quando se tira o Núcleo: cada coluna/galho que sai dele
// (Defensor de um lado, Atacante do outro). Níveis, barramento e "uma escolha por nível" valem dentro
// do ramo — o nível 2 de um ramo não tem nada a ver com o nível 2 de outro. Sem marcação nenhuma:
// basta as colunas só se encontrarem no Núcleo. A etiqueta do ramo é o menor id dele; o número
// ("Ramo 1, 2…") segue a volta em torno do Núcleo, começando em cima e indo no sentido do relógio.
let branchOf = new Map(), branchNo = new Map(), branchCount = 0;
function computeBranches() {
  const parent = new Map();
  const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  for (const n of nodes) if (n.kind !== 'core') parent.set(n.id, n.id);
  for (const e of edges) if (parent.has(e.a) && parent.has(e.b)) { const ra = find(e.a), rb = find(e.b); if (ra !== rb) parent.set(ra, rb); }
  const tag = new Map(), members = new Map();
  for (const id of parent.keys()) {
    const r = find(id), s = String(id);
    if (!tag.has(r) || s < tag.get(r)) tag.set(r, s);
    (members.get(r) || members.set(r, []).get(r)).push(id);
  }
  branchOf = new Map([...parent.keys()].map((id) => [id, tag.get(find(id))]));
  const cx = coreNode ? coreNode.x : 0, cy = coreNode ? coreNode.y : 0;
  const order = [...members.entries()].map(([r, ids]) => {
    const ns = ids.map(byId).filter(Boolean);
    const mx = ns.reduce((s, n) => s + n.x, 0) / ns.length - cx, my = ns.reduce((s, n) => s + n.y, 0) / ns.length - cy;
    return { t: tag.get(r), a: Math.atan2(mx, -my) };
  }).sort((p, q) => p.a - q.a);
  branchNo = new Map(order.map((b, i) => [b.t, i + 1]));
  branchCount = order.length;
}
const sameBranch = (a, b) => branchOf.get(a.id) === branchOf.get(b.id);
// esferas do mesmo ramo (o Núcleo não pertence a nenhum)
const branchMembers = (tag) => nodes.filter((n) => n.kind !== 'core' && branchOf.get(n.id) === tag);

// ---------- barramentos ----------
// Cada barramento é criado pelo Mestre (Área → selecionar → "Criar barramento") e guarda quem fica em
// cima (nível N; o Núcleo conta como nível 0) e quem fica embaixo (nível N+1). O barramento É a
// ligação: toda esfera de cima leva a toda de baixo, e só essas ligações viram barra — qualquer outra
// continua sendo linha comum. Dois barramentos nunca se juntam sozinhos, mesmo no mesmo nível.
// Guardado em bus_config.buses = [{ id, top: [ids], bottom: [ids] }]; o desenho de cada um fica em
// bus_config.paths / bus_config.stubs com a chave "b:<id>".
let busGroups = [], busEdges = new Set(), busDirty = true;
const nodeLevel = (n) => (!n ? null : n.kind === 'core' ? 0 : n.level ?? null);
const levelName = (lv) => (lv === 0 ? 'Núcleo' : `Nível ${lv}`);
const genBusId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function computeBusGroups() {
  busGroups = []; busEdges = new Set();
  if (edgeStyle !== 'bus') return;
  if (!Array.isArray(busConfig.buses)) seedBusesFromLevels();
  for (const b of busConfig.buses) {
    const parents = b.top.filter((id) => nodeById.has(id)), children = b.bottom.filter((id) => nodeById.has(id));
    if (!parents.length || !children.length) continue;
    busGroups.push({ key: 'b:' + b.id, bus: b, level: nodeLevel(byId(parents[0])), parents, children, pset: new Set(parents), cset: new Set(children) });
  }
  for (const e of edges) for (const g of busGroups) {
    if ((g.pset.has(e.a) && g.cset.has(e.b)) || (g.pset.has(e.b) && g.cset.has(e.a))) { busEdges.add(e); break; }
  }
}
const busLinks = (g) => edges.filter((e) => (g.pset.has(e.a) && g.cset.has(e.b)) || (g.pset.has(e.b) && g.cset.has(e.a)));
// árvores que usavam o barramento automático (uma barra por nível e ramo): na primeira vez, cada barra
// que aparecia vira um barramento próprio, levando junto o desenho que o Mestre já tinha feito nela
function seedBusesFromLevels() {
  const byKey = new Map();
  for (const e of edges) {
    const A = nodeById.get(e.a), B = nodeById.get(e.b);
    if (!A || !B || A.kind === 'core' || B.kind === 'core' || A.level == null || B.level == null) continue;
    if (Math.abs(A.level - B.level) !== 1) continue;
    if (busConfig.group === 'via' && A.fac !== B.fac) continue;
    const [p, c] = A.level < B.level ? [A, B] : [B, A];
    const branch = branchOf.get(p.id);
    const sub = (busConfig.group === 'via' ? (p.fac || '') : '*') + '|' + p.level;
    const k = branch + '\n' + sub;
    let g = byKey.get(k);
    if (!g) { g = { sub, branch, parents: new Set(), children: new Set() }; byKey.set(k, g); }
    g.parents.add(p.id); g.children.add(c.id);
  }
  const multi = new Set([...byKey.values()].map((g) => g.branch)).size > 1;
  const groups = [...byKey.values()].map((g) => ({ ...g, key: multi ? `r${g.branch}/${g.sub}` : g.sub, parents: [...g.parents], children: [...g.children] }));
  adoptOrphanBusKeys(groups);
  busConfig.buses = [];
  const paths = {}, stubs = {};
  for (const g of groups) {
    const id = genBusId() + busConfig.buses.length;
    busConfig.buses.push({ id, top: g.parents, bottom: g.children });
    if (busConfig.paths[g.key]) paths['b:' + id] = busConfig.paths[g.key];
    if (busConfig.stubs[g.key]) stubs['b:' + id] = busConfig.stubs[g.key];
  }
  busConfig.paths = paths; busConfig.stubs = stubs;
  if (isGM && hasBusConfig && busConfig.buses.length) saveBusConfig();
}
// desenho guardado com uma chave antiga que não bate com nenhuma barra: vai para a barra do mesmo nível
// mais perto dela que ainda não tem desenho; o ajuste de cada ligação vai para a barra daquela esfera
function adoptOrphanBusKeys(groups) {
  const live = new Map(groups.map((g) => [g.key, g]));
  const subOf = (key) => key.slice(key.indexOf('/') + 1);
  for (const key of Object.keys(busConfig.paths)) {
    if (live.has(key)) continue;
    const path = busConfig.paths[key];
    if (!Array.isArray(path) || !path.length) continue;
    const px = path.reduce((s, p) => s + p[0], 0) / path.length, py = path.reduce((s, p) => s + p[1], 0) / path.length;
    let best = null, bestD = Infinity;
    for (const g of groups) {
      if (g.sub !== subOf(key) || busConfig.paths[g.key]) continue;
      const ns = [...g.parents, ...g.children].map(byId).filter(Boolean); if (!ns.length) continue;
      const d = Math.hypot(ns.reduce((s, n) => s + n.x, 0) / ns.length - px, ns.reduce((s, n) => s + n.y, 0) / ns.length - py);
      if (d < bestD) { bestD = d; best = g; }
    }
    if (best) { busConfig.paths[best.key] = path; delete busConfig.paths[key]; }
  }
  for (const key of Object.keys(busConfig.stubs)) {
    if (live.has(key)) continue;
    const moved = busConfig.stubs[key];
    for (const id of Object.keys(moved)) {
      const g = groups.find((x) => x.parents.some((p) => String(p) === id) || x.children.some((c) => String(c) === id));
      if (!g) continue;
      const dest = busConfig.stubs[g.key] || (busConfig.stubs[g.key] = {});
      if (!dest[id]) dest[id] = moved[id];
      delete moved[id];
    }
    if (!Object.keys(moved).length) delete busConfig.stubs[key];
  }
}
// "Criar barramento" (painel da seleção): a seleção precisa ter dois níveis seguidos; só nível 1 liga
// ao Núcleo. Cria as ligações que faltam entre cima e embaixo.
window.createBusFromSelection = async () => {
  if (!isGM) return;
  if (!hasBusConfig) { showMsg('Para criar barramentos, aplique a migração 20261001 no Supabase.'); return; }
  const sel = nodes.filter((n) => areaSelection.has(n.id) && n.kind !== 'core');
  if (!sel.length) return;
  const semNivel = sel.filter((n) => n.level == null);
  if (semNivel.length) { showMsg(`${semNivel.length === 1 ? '1 habilidade selecionada está' : `${semNivel.length} habilidades selecionadas estão`} sem nível. Defina o nível (campo Nível) e tente de novo.`); return; }
  const levels = [...new Set(sel.map((n) => n.level))].sort((a, b) => a - b);
  let top, bottom;
  if (levels.length === 1 && levels[0] === 1 && coreNode) { top = [coreNode]; bottom = sel; }
  else if (levels.length === 2 && levels[1] === levels[0] + 1) { top = sel.filter((n) => n.level === levels[0]); bottom = sel.filter((n) => n.level === levels[1]); }
  else {
    showMsg(`Selecione habilidades de dois níveis seguidos (ex.: 2 e 3), ou só de nível 1 para ligar ao Núcleo. A seleção tem ${levels.length === 1 ? 'o nível' : 'os níveis'} ${levels.join(', ')}.`);
    return;
  }
  const has = (a, b) => edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  const pairs = [];
  top.forEach((p) => bottom.forEach((c) => { if (!has(p.id, c.id)) pairs.push([p.id, c.id]); }));
  const lv = nodeLevel(top[0]);
  // as selecionadas que já estão em outro barramento destes níveis saem de lá, e as ligações delas com
  // quem ficou lá são cortadas — é assim que uma coluna se separa da outra
  const topIds = new Set(top.map((n) => n.id)), botIds = new Set(bottom.map((n) => n.id));
  const moving = new Set(sel.map((n) => n.id));
  const inNew = (a, b) => (topIds.has(a) && botIds.has(b)) || (topIds.has(b) && botIds.has(a));
  const touched = busGroups.filter((g) => g.level === lv && [...g.parents, ...g.children].some((id) => moving.has(id)));
  const cut = new Set();
  for (const g of touched) {
    for (const e of busLinks(g)) {
      const am = moving.has(e.a), bm = moving.has(e.b);
      if (am !== bm && !inNew(e.a, e.b)) cut.add(e);
    }
  }
  const ok = await confirmModal({ title: 'Criar barramento', danger: false, confirmLabel: 'Criar',
    desc: `Liga ${lv === 0 ? 'o Núcleo' : `${top.length === 1 ? '1 habilidade' : `${top.length} habilidades`} do nível ${lv}`} a ${bottom.length === 1 ? '1 habilidade' : `${bottom.length} habilidades`} do nível ${lv + 1} por uma barra própria${pairs.length ? ` (${pairs.length === 1 ? '1 ligação nova' : `${pairs.length} ligações novas`})` : ''}. Ela não se junta com nenhum outro barramento.` +
      (touched.length ? ` As selecionadas saem ${touched.length === 1 ? 'do barramento em que estavam' : `dos ${touched.length} barramentos em que estavam`}${cut.size ? `, e ${cut.size === 1 ? 'a ligação delas' : `as ${cut.size} ligações delas`} com as habilidades que ficaram lá ${cut.size === 1 ? 'é apagada' : 'são apagadas'}` : ''}.` : '') });
  if (!ok) return;
  try {
    if (cut.size) {
      await Promise.all([...cut].map((e) => db.deleteTreeEdge(e.id)));
      edges = edges.filter((e) => !cut.has(e));
    }
    for (const g of touched) {
      g.bus.top = g.bus.top.filter((id) => !moving.has(id));
      g.bus.bottom = g.bus.bottom.filter((id) => !moving.has(id));
      if (!g.bus.top.some((id) => nodeById.has(id)) || !g.bus.bottom.some((id) => nodeById.has(id))) removeBus(g.key);
      else if (busConfig.stubs[g.key]) moving.forEach((id) => dropStubOverride(g.key, id));
    }
    const made = await Promise.all(pairs.map(([a, b]) => db.insertTreeEdge(treeId, a, b)));
    made.forEach((e) => { if (e) edges.push({ id: e.id, a: e.a, b: e.b }); });
    if (!Array.isArray(busConfig.buses)) busConfig.buses = [];
    const id = genBusId();
    busConfig.buses.push({ id, top: top.map((n) => n.id), bottom: bottom.map((n) => n.id) });
    if (edgeStyle !== 'bus') { edgeStyle = 'bus'; syncLevelUi(); saveTreeOpt({ edge_style: 'bus' }, 'Barramentos ligados.'); }
    saveBusConfig('Barramento criado.');
    clearAreaSelection(); render();
    computeBusGroups(); busDirty = false;
    selectBus('b:' + id);
  } catch (e) { showMsg(e.message); }
};
// Shift + clique numa esfera com um barramento selecionado: põe ou tira ela dele (cria ou apaga as
// ligações dela com o outro lado do barramento)
async function toggleBusMember(g, n) {
  const b = g.bus, nm = n.kind === 'core' ? 'Núcleo' : `"${n.name || 'sem nome'}"`;
  const topLv = nodeLevel(byId(g.parents[0])), botLv = nodeLevel(byId(g.children[0]));
  const inTop = g.pset.has(n.id), inBot = g.cset.has(n.id);
  try {
    if (inTop || inBot) {
      if ((inTop ? g.parents : g.children).length <= 1) { showMsg('O barramento precisa de pelo menos uma habilidade em cima e uma embaixo. Para desfazer ele, use os botões do painel.'); return; }
      const other = inTop ? g.cset : g.pset;
      const gone = edges.filter((e) => (e.a === n.id && other.has(e.b)) || (e.b === n.id && other.has(e.a)));
      await Promise.all(gone.map((e) => db.deleteTreeEdge(e.id)));
      const goneSet = new Set(gone); edges = edges.filter((e) => !goneSet.has(e));
      const side = inTop ? b.top : b.bottom; side.splice(side.findIndex((id) => id === n.id), 1);
      dropStubOverride(g.key, n.id);
      showMsg(`${nm} saiu do barramento.`, 'ok');
    } else {
      const lv = nodeLevel(n);
      if (lv == null) { showMsg(`${nm} ainda não tem nível. Defina o nível dela primeiro.`); return; }
      const toTop = lv === topLv, toBot = lv === botLv;
      if (!toTop && !toBot) { showMsg(`Este barramento liga ${levelName(topLv).toLowerCase()} ao nível ${botLv}. ${nm} é ${levelName(lv).toLowerCase()}.`); return; }
      const other = toTop ? g.children : g.parents;
      const has = (a, c) => edges.some((e) => (e.a === a && e.b === c) || (e.a === c && e.b === a));
      const made = await Promise.all(other.filter((id) => !has(n.id, id)).map((id) => db.insertTreeEdge(treeId, toTop ? n.id : id, toTop ? id : n.id)));
      made.forEach((e) => { if (e) edges.push({ id: e.id, a: e.a, b: e.b }); });
      (toTop ? b.top : b.bottom).push(n.id);
      showMsg(`${nm} entrou no barramento.`, 'ok');
    }
    render(); computeBusGroups(); busDirty = false;
    saveBusConfig(); selectBus(g.key);
  } catch (e) { showMsg(e.message); }
}
function removeBus(key) {
  busConfig.buses = (busConfig.buses || []).filter((b) => 'b:' + b.id !== key);
  delete busConfig.paths[key]; delete busConfig.stubs[key];
}
// desfaz o barramento: as ligações ficam, só voltam a ser linhas comuns
window.unbundleBus = () => {
  if (!isGM || !selectedBusKey) return;
  removeBus(selectedBusKey); deselectBus(); busDirty = true;
  saveBusConfig('Barramento desfeito. As ligações continuam, agora como linhas.');
};
// exclui o barramento e as ligações dele
window.deleteBusWithLinks = async () => {
  if (!isGM || !selectedBusKey) return;
  const g = busGroupByKey(selectedBusKey); if (!g) return;
  const links = busLinks(g);
  const ok = await confirmModal({ title: 'Excluir barramento', confirmLabel: 'Excluir',
    desc: `Apaga o barramento e ${links.length === 1 ? 'a ligação dele' : `as ${links.length} ligações dele`}. As habilidades ficam. Não dá pra desfazer.` });
  if (!ok) return;
  try {
    await Promise.all(links.map((e) => db.deleteTreeEdge(e.id)));
    const gone = new Set(links); edges = edges.filter((e) => !gone.has(e));
    removeBus(g.key); deselectBus(); render();
    saveBusConfig('Barramento excluído.');
  } catch (e) { showMsg(e.message); }
};
// ponto mais próximo de (px,py) num traçado (lista de pontos) — devolve o ponto, o trecho e a distância
function nearestOnPath(pts, px, py) {
  let best = { x: pts[0].x, y: pts[0].y, seg: 0, d: Infinity };
  for (let i = 1; i < pts.length; i++) {
    const A = pts[i - 1], B = pts[i], dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, ((px - A.x) * dx + (py - A.y) * dy) / L2)) : 0;
    const x = A.x + t * dx, y = A.y + t * dy, d = Math.hypot(px - x, py - y);
    if (d < best.d) best = { x, y, seg: i - 1, d };
  }
  if (pts.length === 1) best.d = Math.hypot(px - pts[0].x, py - pts[0].y);
  return best;
}
// geometria AUTOMÁTICA: a barra fica no meio do caminho entre os dois níveis e vai de ponta a ponta
// das esferas de baixo e das de cima que estão na fileira/anel mais perto; quem está nessa faixa desce
// reto, quem está fora (ou desalinhado para o lado) chega em diagonal até a ponta mais próxima.
// Devolve também "handles": os pontos que viram editáveis se o Mestre mexer nesta barra.
function busAutoGeometry(g) {
  const P = g.parents.map(byId).filter(Boolean), C = g.children.map(byId).filter(Boolean);
  if (!P.length || !C.length) return null;
  const core = coreNode;
  const stubs = [];
  if (gridShape !== 'linear' && core) {
    const ang = (n) => Math.atan2(n.y - core.y, n.x - core.x), rad = (n) => Math.hypot(n.x - core.x, n.y - core.y);
    const ref = Math.atan2(C.reduce((s, n) => s + Math.sin(ang(n)), 0), C.reduce((s, n) => s + Math.cos(ang(n)), 0));
    const rel = (a) => { let d = a - ref; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI; return d; };
    const rp = P.map(rad), rc = C.map(rad);
    const outward = rc.reduce((s, v) => s + v, 0) / rc.length >= rp.reduce((s, v) => s + v, 0) / rp.length;
    const pEdge = outward ? Math.max(...rp) : Math.min(...rp), cEdge = outward ? Math.min(...rc) : Math.max(...rc);
    const rb = (pEdge + cEdge) / 2;
    const near = P.filter((n) => n.kind !== 'core' && Math.abs(rad(n) - pEdge) <= RING_STEP * .5);
    const spanA = [...C, ...near].map((n) => rel(ang(n)));
    const a0 = Math.min(...spanA), a1 = Math.max(...spanA);
    const at = (a) => ({ x: core.x + rb * Math.cos(ref + a), y: core.y + rb * Math.sin(ref + a) });
    const steps = Math.max(1, Math.ceil(((a1 - a0) * rb) / 10));
    const bar = []; for (let i = 0; i <= steps; i++) bar.push(at(a0 + (a1 - a0) * i / steps));
    const eps = 1e-3;
    P.forEach((n) => { const a = n.kind === 'core' ? (a0 + a1) / 2 : rel(ang(n)); stubs.push({ pts: [n, at(a >= a0 - eps && a <= a1 + eps ? a : (a < a0 ? a0 : a1))], id: n.id }); });
    C.forEach((n) => stubs.push({ pts: [n, at(rel(ang(n)))], id: n.id }));
    // pontos editáveis: as pontas e onde cada esfera toca o arco — vira um polígono que acompanha o anel
    const hs = [...new Set([a0, a1, ...spanA].map((a) => +a.toFixed(4)))].sort((x, y) => x - y);
    return { bar, stubs, handles: hs.map(at) };
  }
  const dir = linearDir(P, C), L = TO_LOCAL[dir], Wd = TO_WORLD[dir];
  const lp = P.map((n) => ({ n, ...L(n) })), lc = C.map((n) => ({ n, ...L(n) }));
  const pEdge = Math.max(...lp.map((p) => p.d)), cEdge = Math.min(...lc.map((c) => c.d));
  const db = (pEdge + cEdge) / 2;
  const span = [...lc, ...lp.filter((p) => Math.abs(p.d - pEdge) <= LINEAR_STEP * .5)].map((q) => q.l);
  const l0 = Math.min(...span), l1 = Math.max(...span);
  const bar = [Wd(l0, db), Wd(l1, db)];
  lp.forEach((p) => stubs.push({ pts: [p.n, Wd(p.l >= l0 - .5 && p.l <= l1 + .5 ? p.l : (p.l < l0 ? l0 : l1), db)], id: p.n.id }));
  lc.forEach((c) => stubs.push({ pts: [c.n, Wd(c.l, db)], id: c.n.id }));
  return { bar, stubs, handles: bar.map((p) => ({ ...p })) };
}
// onde um traço que sai de p encontra a barra: prefere cair reto (vertical, horizontal ou, na árvore
// em anel, na direção do Núcleo) quando isso não fica muito mais longo que o caminho mais curto —
// o ponto mais próximo puro deixa a ligação torta sempre que o trecho da barra é inclinado
function straightAttach(bar, p) {
  const q = nearestOnPath(bar, p.x, p.y);
  const dirs = [[0, 1], [1, 0]];
  if (gridShape !== 'linear' && coreNode) {
    const dx = p.x - coreNode.x, dy = p.y - coreNode.y, L = Math.hypot(dx, dy);
    if (L > 1) dirs.push([dx / L, dy / L]);
  }
  let best = null;
  for (const [ux, uy] of dirs) for (let i = 1; i < bar.length; i++) {
    const A = bar[i - 1], B = bar[i], ex = B.x - A.x, ey = B.y - A.y, den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const wx = A.x - p.x, wy = A.y - p.y;
    const s = (wx * ey - wy * ex) / den, t = (wx * uy - wy * ux) / den;
    if (t < -1e-6 || t > 1 + 1e-6) continue;
    if (!best || Math.abs(s) < best.d) best = { x: p.x + s * ux, y: p.y + s * uy, d: Math.abs(s) };
  }
  return best && best.d <= q.d * 1.6 + 4 ? { x: best.x, y: best.y } : { x: q.x, y: q.y };
}
// geometria final: se o Mestre desenhou a barra (bus_config.paths), ela manda e cada esfera desce
// reta até ela; por cima disso entram os ajustes de cada ligação (bus_config.stubs): o ponto onde
// ela toca a barra ("at", sempre reprojetado na barra para continuar grudado nela) e as dobras ("via").
// Todo traço vai da esfera para a barra: pts = [esfera, ...dobras, ponto na barra].
function busGeometry(g) {
  const manual = busConfig.paths[g.key];
  let geo;
  if (!manual || manual.length < 2) geo = busAutoGeometry(g);
  else {
    const bar = manual.map(([x, y]) => ({ x, y }));
    const stubs = [...g.parents, ...g.children].map(byId).filter(Boolean)
      .map((n) => ({ pts: [n, straightAttach(bar, n)], id: n.id }));
    geo = { bar, stubs, handles: bar, manual: true };
  }
  const ov = geo && busConfig.stubs[g.key];
  if (ov) geo.stubs = geo.stubs.map((st) => {
    const o = ov[st.id]; if (!o) return st;
    const via = (o.via || []).map(([x, y]) => ({ x, y }));
    let end = st.pts[st.pts.length - 1], glued = null;
    if (o.at && o.at.v != null && geo.manual && geo.bar[o.at.v]) { glued = o.at.v; end = { x: geo.bar[glued].x, y: geo.bar[glued].y }; }
    else if (Array.isArray(o.at)) { const q = nearestOnPath(geo.bar, o.at[0], o.at[1]); end = { x: q.x, y: q.y }; }
    else if (via.length) end = straightAttach(geo.bar, via[via.length - 1]);
    return { pts: [st.pts[0], ...via, end], id: st.id, custom: true, glued };
  });
  return geo;
}
// alças da barra selecionada: pontos da barra, a ponta de cada ligação (onde ela toca a barra —
// arrastar gruda num ponto da barra ou na posição reta) e as dobras de cada ligação
function busHandles(geo) {
  const hs = geo.handles.map((h, i) => ({ t: 'bar', i, x: h.x, y: h.y }));
  for (const st of geo.stubs) {
    const n = st.pts.length, B = st.pts[n - 1];
    hs.push({ t: 'at', id: st.id, x: B.x, y: B.y, glued: st.glued != null });
    for (let j = 1; j < n - 1; j++) hs.push({ t: 'via', id: st.id, j: j - 1, x: st.pts[j].x, y: st.pts[j].y });
  }
  return hs;
}
const sameBusHandle = (a, b) => !!a && !!b && a.t === b.t && a.i === b.i && a.id === b.id && a.j === b.j;
function strokeGlowPath(ctx, pts, color, off) {
  const [er, eg, eb] = hexToRgb(color);
  if (!off) {
    for (let i = 1; i < pts.length; i++) {
      const A = pts[i - 1], B = pts[i], dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
      if (len < .5) continue;
      ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(Math.atan2(dy, dx)); ctx.globalAlpha = EDGE_GLOW_ALPHA;
      ctx.drawImage(edgeGlowStripFor(color), 0, -EDGE_GLOW_THICKNESS / 2, len, EDGE_GLOW_THICKNESS);
      ctx.restore();
    }
  }
  ctx.strokeStyle = `rgba(${er},${eg},${eb},${off ? .3 : .85})`; ctx.lineWidth = off ? 1.4 : 1.8;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}
function drawBus(ctx, g, visible) {
  if (!g.parents.some((id) => visible.has(id)) && !g.children.some((id) => visible.has(id))) return;
  const geo = busGeometry(g); if (!geo) return;
  const color = edgeColor; // mesma "Cor das linhas" da árvore que as conexões normais usam
  const allOff = [...g.parents, ...g.children].every((id) => byId(id)?.enabled === false);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const st of geo.stubs) strokeGlowPath(ctx, st.pts, color, byId(st.id)?.enabled === false);
  if (geo.bar.length > 1) strokeGlowPath(ctx, geo.bar, color, allOff);
  if (waveFront != null && !allOff) drawBusWave(ctx, geo, color);
  ctx.restore();
}
// medidas do desenho de um barramento: comprimento acumulado da barra e, para cada ligação, onde ela
// toca a barra (x, ao longo da barra), o comprimento dela (L) e o acumulado ponto a ponto (cs)
function busMetrics(geo) {
  const bar = geo.bar, cum = [0];
  for (let i = 1; i < bar.length; i++) cum.push(cum[i - 1] + Math.hypot(bar[i].x - bar[i - 1].x, bar[i].y - bar[i - 1].y));
  const stubs = geo.stubs.map((st) => {
    const end = st.pts[st.pts.length - 1], q = nearestOnPath(bar, end.x, end.y);
    const x = bar.length > 1 ? cum[q.seg] + Math.hypot(q.x - bar[q.seg].x, q.y - bar[q.seg].y) : 0;
    const cs = [0];
    for (let k = 1; k < st.pts.length; k++) cs.push(cs[k - 1] + Math.hypot(st.pts[k].x - st.pts[k - 1].x, st.pts[k].y - st.pts[k - 1].y));
    return { st, x, L: cs[cs.length - 1], cs };
  });
  return { cum, stubs };
}
// onda de luz no barramento, na mesma frente das conexões comuns: chega em cada esfera na hora da
// distância dela (nodeDist), desce pela ligação até a barra, se espalha pela barra para os dois lados e
// sobe/desce pelas outras ligações. Cada trecho reto recebe a onda das duas pontas (ver waveSeg).
function drawBusWave(ctx, geo, color) {
  const m = busMetrics(geo), bar = geo.bar;
  const src = [];
  for (const si of m.stubs) {
    const n = byId(si.st.id), d = nodeDist.get(si.st.id);
    if (n && n.enabled !== false && d != null) src.push({ x: si.x, t: d + si.L });
  }
  if (!src.length) return;
  const barT = (x) => { let t = Infinity; for (const q of src) t = Math.min(t, q.t + Math.abs(x - q.x)); return t; };
  const at = (x) => {
    let i = 1; while (i < m.cum.length - 1 && m.cum[i] < x) i++;
    const A = bar[i - 1], B = bar[i], seg = m.cum[i] - m.cum[i - 1], t = seg > 0 ? (x - m.cum[i - 1]) / seg : 0;
    return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t };
  };
  if (bar.length > 1) {
    // quebra a barra onde as ligações chegam: assim cada pedaço só recebe onda pelas duas pontas
    const cuts = [...new Set([...m.cum, ...src.map((q) => q.x)])].sort((a, b) => a - b);
    for (let i = 1; i < cuts.length; i++) {
      if (cuts[i] - cuts[i - 1] < .5) continue;
      waveSeg(ctx, at(cuts[i - 1]), at(cuts[i]), barT(cuts[i - 1]), barT(cuts[i]), color);
    }
  }
  for (const si of m.stubs) {
    const n = byId(si.st.id); if (!n || n.enabled === false) continue;
    const tn = nodeDist.get(si.st.id) ?? Infinity, te = barT(si.x);
    const T = (k) => Math.min(tn + si.cs[k], te + (si.L - si.cs[k]));
    for (let k = 1; k < si.st.pts.length; k++) waveSeg(ctx, si.st.pts[k - 1], si.st.pts[k], T(k - 1), T(k), color);
  }
}
// trecho reto que a onda alcança no tempo tA pela ponta A e tB pela ponta B: cada ponta alimenta a
// sua metade até onde as duas frentes se encontram
function waveSeg(ctx, A, B, tA, tB, color) {
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
  if (len < .5 || (!isFinite(tA) && !isFinite(tB))) return;
  const ang = Math.atan2(dy, dx);
  const meet = !isFinite(tB) ? len : !isFinite(tA) ? 0 : Math.max(0, Math.min(len, (tB + len - tA) / 2));
  if (meet > 0) waveRun(ctx, A, ang, tA, meet, color);
  if (meet < len) waveRun(ctx, B, ang + Math.PI, tB, len - meet, color);
}
function waveRun(ctx, O, ang, t0, run, color) {
  const p = waveFront - t0;
  if (p + WAVE_HEAD <= 0 || p - WAVE_TAIL >= run) return;
  ctx.save();
  ctx.translate(O.x, O.y); ctx.rotate(ang);
  ctx.beginPath(); ctx.rect(0, -WAVE_STRIP_THICKNESS, run, WAVE_STRIP_THICKNESS * 2); ctx.clip();
  ctx.drawImage(waveStripFor(color), p - WAVE_TAIL, -WAVE_STRIP_THICKNESS / 2, WAVE_TAIL + WAVE_HEAD, WAVE_STRIP_THICKNESS);
  ctx.restore();
}

// barra selecionada pelo Mestre: realce em latão + alças — desenhado DEPOIS das esferas, para a alça
// nunca sumir embaixo de uma esfera quando o ponto cai em cima dela
function drawBusSelection(ctx) {
  if (!isGM || !selectedBusKey) return;
  const g = busGroupByKey(selectedBusKey); if (!g) return;
  const geo = busGeometry(g); if (!geo) return;
  ctx.save();
  {
    const brass = cssVar('--brass', '#c9a45c'), lw = 1 / Math.max(view.s, .4);
    const line = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); };
    ctx.strokeStyle = brass; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // ligações: traço fino; a da alça selecionada fica tão forte quanto a barra
    for (const st of geo.stubs) {
      const on = selectedBusHandle && selectedBusHandle.t !== 'bar' && selectedBusHandle.id === st.id;
      ctx.globalAlpha = on ? .9 : .45; ctx.lineWidth = (on ? 3 : 1.6) * lw; line(st.pts);
    }
    ctx.globalAlpha = .9; ctx.lineWidth = 3 * lw; line(geo.bar); ctx.globalAlpha = 1;
    // quem faz parte deste barramento ganha um anel tracejado (Shift + clique põe ou tira)
    ctx.setLineDash([4 * lw, 3 * lw]); ctx.lineWidth = 1.6 * lw;
    for (const id of [...g.parents, ...g.children]) {
      const n = byId(id); if (!n) continue;
      ctx.beginPath(); ctx.arc(n.x, n.y, nodeRadius(n) + 6 * lw, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]);
    // alças: losango cheio = ponto da barra; losango menor = ligação (meio do trecho final) e dobras
    for (const h of busHandles(geo)) {
      const hsz = (h.t === 'bar' ? 6 : 5) / view.s;
      const on = sameBusHandle(h, selectedBusHandle) && (h.t !== 'bar' || geo.manual);
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = on || (h.t === 'at' && h.glued) ? brass : 'rgba(15,16,18,.9)';
      ctx.strokeStyle = brass; ctx.lineWidth = (h.t === 'bar' ? 1.6 : 1.2) / view.s;
      ctx.fillRect(-hsz / 2, -hsz / 2, hsz, hsz); ctx.strokeRect(-hsz / 2, -hsz / 2, hsz, hsz);
      ctx.restore();
    }
  }
  ctx.restore();
}
/* ---------- edição do barramento pelo Mestre ----------
   Clicar numa barra ou numa ligação (ferramenta Selecionar) seleciona; arrastar uma alça da barra move
   o ponto (encaixa numa grade mais fina que a das esferas; Alt solta livre); arrastar a alça de uma
   ligação desliza o ponto onde ela toca a barra (gruda na posição reta); duplo clique na barra ou numa
   ligação cria um ponto de dobra; Delete apaga o ponto selecionado (numa ligação, volta ela ao reto);
   "Endireitar ligações" desfaz os ajustes das ligações; "Restaurar automático" volta tudo ao calculado. */
let selectedBusKey = null, selectedBusHandle = null, _busSaveT = null;
const busGroupByKey = (key) => busGroups.find((g) => g.key === key) || null;
function fineSnap(x, y) {
  if (gridShape === 'linear' || !coreNode) { const st = LINEAR_STEP / 2; return { x: Math.round(x / st) * st, y: Math.round(y / st) * st }; }
  const core = coreNode, dx = x - core.x, dy = y - core.y, half = RING_STEP / 2;
  const r = Math.max(half, Math.round(Math.hypot(dx, dy) / half) * half);
  const segs = (SHAPE_SEGMENTS[gridShape] || 8) * Math.max(1, Math.round(r / RING_STEP)) * 2;
  const step = (Math.PI * 2) / segs, a = Math.round(Math.atan2(dy, dx) / step) * step;
  return { x: Math.round(core.x + r * Math.cos(a)), y: Math.round(core.y + r * Math.sin(a)) };
}
// acerta a barra ou uma ligação de qualquer barramento; a ponta da ligação colada na esfera fica de
// fora (ali o clique é da esfera)
function hitTestBusAt(wx, wy) {
  if (edgeStyle !== 'bus') return null;
  const tol = (EDGE_HIT_TOLERANCE + 3) / Math.max(view.s, .4);
  let best = null, bestD = tol;
  for (const g of busGroups) {
    const geo = busGeometry(g); if (!geo || geo.bar.length < 2) continue;
    const q = nearestOnPath(geo.bar, wx, wy);
    if (q.d <= bestD) { bestD = q.d; best = { g, geo, q, stub: null }; }
    for (const st of geo.stubs) {
      const s = nearestOnPath(st.pts, wx, wy);
      if (s.d < bestD) { bestD = s.d; best = { g, geo, q: s, stub: st }; }
    }
  }
  return best;
}
function busHandleAt(wx, wy) {
  const g = selectedBusKey && busGroupByKey(selectedBusKey); if (!g) return null;
  const geo = busGeometry(g); if (!geo) return null;
  // ponta e ponto da barra costumam ficar um em cima do outro (é assim que a ponta gruda): o ponto da
  // barra ganha — arrastar ele leva junto as pontas grudadas. Para soltar uma ponta, clique antes na
  // ligação (ela fica selecionada e a ponta dela passa na frente).
  const tol = 9 / view.s, sel = selectedBusHandle && selectedBusHandle.t !== 'bar' ? selectedBusHandle.id : undefined;
  const rank = (h) => (sel !== undefined && h.t !== 'bar' && h.id === sel ? 0 : h.t === 'via' ? 1 : h.t === 'bar' ? 2 : 3);
  let best = null;
  for (const h of busHandles(geo)) {
    const d = Math.hypot(h.x - wx, h.y - wy); if (d > tol) continue;
    const r = rank(h);
    if (!best || r < best.r || (r === best.r && d < best.d)) best = { g, geo, h, r, d };
  }
  return best;
}
// converte a barra automática em pontos editáveis na primeira mexida
function ensureManualPath(g, geo) {
  if (!busConfig.paths[g.key]) busConfig.paths[g.key] = geo.handles.map((h) => [Math.round(h.x), Math.round(h.y)]);
  return busConfig.paths[g.key];
}
// ajuste de uma ligação (cria vazio na primeira mexida)
function stubOverride(key, id) {
  const all = busConfig.stubs[key] || (busConfig.stubs[key] = {});
  return all[id] || (all[id] = {});
}
function dropStubOverride(key, id) {
  const all = busConfig.stubs[key]; if (!all) return;
  delete all[id]; if (!Object.keys(all).length) delete busConfig.stubs[key];
}
function saveBusConfig(msg) {
  computeNodeDists();
  if (!hasBusConfig) { showMsg('Para guardar o desenho da barra, aplique a migração 20261001 no Supabase.'); return; }
  clearTimeout(_busSaveT);
  _busSaveT = setTimeout(() => db.updateSystemTree(treeId, { bus_config: busConfig }).then(() => { if (msg) showMsg(msg, 'ok'); }).catch((e) => showMsg(e.message)), 350);
}
function refreshBusPanel() {
  const key = selectedBusKey; if (!key) return;
  const nStubs = Object.keys(busConfig.stubs[key] || {}).length;
  $('bus-mode').textContent = (busConfig.paths[key] ? 'Traçado desenhado à mão' : 'Traçado automático')
    + (nStubs ? ` · ${nStubs} ${nStubs > 1 ? 'ligações ajustadas' : 'ligação ajustada'}` : '');
  $('bus-reset').disabled = !busConfig.paths[key] && !nStubs;
  $('bus-straighten').disabled = !nStubs;
}
function selectBus(key, handle = null) {
  selectedBusKey = key; selectedBusHandle = handle;
  deselectEdge();
  if (selected) { $('editor').classList.remove('open'); selected = null; }
  closeOtherPanels('buspanel');
  const g = busGroupByKey(key);
  $('bus-title').textContent = g ? `${levelName(g.level)} → nível ${g.level + 1} · ${g.parents.length} em cima, ${g.children.length} embaixo` : 'Barramento';
  refreshBusPanel();
  $('bus-nomig').hidden = hasBusConfig;
  $('buspanel').classList.add('open');
}
function deselectBus() {
  selectedBusKey = null; selectedBusHandle = null;
  $('buspanel')?.classList.remove('open');
}
window.closeBusPanel = () => deselectBus();
window.resetBusPath = () => {
  if (!isGM || !selectedBusKey) return;
  delete busConfig.paths[selectedBusKey]; delete busConfig.stubs[selectedBusKey];
  saveBusConfig('Traçado de volta ao automático.'); selectBus(selectedBusKey);
};
window.straightenBusStubs = () => {
  if (!isGM || !selectedBusKey) return;
  delete busConfig.stubs[selectedBusKey];
  saveBusConfig('Ligações endireitadas.'); selectBus(selectedBusKey);
};
function startBusVertexDrag(hit, ev) {
  const { g, geo, h } = hit;
  let moved = false; const sx = ev.clientX, sy = ev.clientY;
  let apply;
  if (h.t === 'bar') {
    const path = ensureManualPath(g, geo), [ox, oy] = path[h.i];
    apply = (e) => {
      const x = ox + (e.clientX - sx) / view.s, y = oy + (e.clientY - sy) / view.s;
      const p = e.altKey ? { x: Math.round(x), y: Math.round(y) } : fineSnap(x, y);
      path[h.i] = [p.x, p.y];
    };
  } else if (h.t === 'via') {
    const o = stubOverride(g.key, h.id), [ox, oy] = o.via[h.j];
    apply = (e) => {
      const x = ox + (e.clientX - sx) / view.s, y = oy + (e.clientY - sy) / view.s;
      const p = e.altKey ? { x: Math.round(x), y: Math.round(y) } : fineSnap(x, y);
      o.via[h.j] = [p.x, p.y];
    };
  } else {
    // ponta da ligação: gruda no ponto da barra mais perto do cursor ou na posição reta (sem ajuste);
    // para grudar num lugar novo, crie antes um ponto na barra (duplo clique). Alt solta pela barra.
    const st = geo.stubs.find((s) => s.id === h.id), from = st.pts[st.pts.length - 2];
    const end0 = st.pts[st.pts.length - 1], ox = end0.x, oy = end0.y;
    const o = stubOverride(g.key, h.id);
    apply = (e) => {
      const x = ox + (e.clientX - sx) / view.s, y = oy + (e.clientY - sy) / view.s;
      const cur = busGeometry(g), bar = cur.bar;
      if (e.altKey) { const q = nearestOnPath(bar, x, y); o.at = [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10]; return; }
      const reto = straightAttach(bar, from);
      let best = { d: Math.hypot(reto.x - x, reto.y - y), v: null };
      cur.handles.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < best.d) best = { d, v: i }; });
      if (best.v == null) { delete o.at; return; }
      if (!cur.manual) ensureManualPath(g, cur); // grudar num ponto pede pontos fixos: a barra vira desenhada
      o.at = { v: best.v };
    };
  }
  selectedBusHandle = h;
  try { stage.setPointerCapture(ev.pointerId); } catch (_) {}
  const mv = (e) => {
    if (!moved && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 3) moved = true;
    if (moved) apply(e);
  };
  const up = () => {
    try { stage.releasePointerCapture(ev.pointerId); } catch (_) {}
    stage.removeEventListener('pointermove', mv); stage.removeEventListener('pointerup', up);
    // ligação sem ajuste nenhum (clicada sem arrastar, ou devolvida à posição reta) não deixa resto
    if (h.t === 'at' && !Object.keys(stubOverride(g.key, h.id)).length) dropStubOverride(g.key, h.id);
    if (moved) saveBusConfig();
    selectBus(g.key, h);
  };
  stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up);
}
function addBusVertexAt(wx, wy) {
  const hit = hitTestBusAt(wx, wy); if (!hit) return false;
  if (hit.stub) {
    // dobra numa ligação: entra entre os pontos do trecho clicado; o ponto na barra fica onde estava
    const st = hit.stub, o = stubOverride(hit.g.key, st.id);
    const end = st.pts[st.pts.length - 1];
    if (!o.at) o.at = st.glued != null ? { v: st.glued } : [Math.round(end.x * 10) / 10, Math.round(end.y * 10) / 10];
    const p = fineSnap(hit.q.x, hit.q.y);
    o.via = o.via || [];
    const j = Math.min(hit.q.seg, o.via.length);
    o.via.splice(j, 0, [p.x, p.y]);
    saveBusConfig('Dobra criada na ligação. Arraste para moldar.');
    selectBus(hit.g.key, { t: 'via', id: st.id, j });
    return true;
  }
  const path = ensureManualPath(hit.g, hit.geo);
  const bar = path.map(([x, y]) => ({ x, y }));
  const q = nearestOnPath(bar, wx, wy), p = fineSnap(q.x, q.y), idx = q.seg + 1;
  path.splice(idx, 0, [p.x, p.y]);
  const all = busConfig.stubs[hit.g.key] || {};
  Object.values(all).forEach((o) => { if (o.at && o.at.v != null && o.at.v >= idx) o.at.v++; });
  // ponta de ligação que estava bem ali gruda no ponto novo
  for (const st of hit.geo.stubs) {
    const end = st.pts[st.pts.length - 1];
    if (Math.hypot(end.x - p.x, end.y - p.y) <= 12 / view.s) stubOverride(hit.g.key, st.id).at = { v: idx };
  }
  saveBusConfig('Ponto criado na barra. As pontas das ligações grudam nele.');
  selectBus(hit.g.key, { t: 'bar', i: idx });
  return true;
}
function deleteSelectedBusVertex() {
  const key = selectedBusKey, h = selectedBusHandle;
  if (!key || !h) return false;
  if (h.t === 'via') {
    const o = busConfig.stubs[key]?.[h.id]; if (!o?.via) return false;
    o.via.splice(h.j, 1); if (!o.via.length) delete o.via;
    if (!o.via && !o.at) dropStubOverride(key, h.id);
    saveBusConfig('Dobra removida.'); selectBus(key);
    return true;
  }
  if (h.t === 'at') {
    if (!busConfig.stubs[key]?.[h.id]) return false;
    dropStubOverride(key, h.id);
    saveBusConfig('Ligação de volta ao reto.'); selectBus(key);
    return true;
  }
  const path = busConfig.paths[key];
  if (!path) return false;
  if (path.length <= 2) { showMsg('A barra precisa de pelo menos dois pontos. Use "Restaurar automático" para recomeçar.'); return true; }
  path.splice(h.i, 1);
  const all = busConfig.stubs[key] || {};
  for (const [id, o] of Object.entries(all)) {
    if (!o.at || o.at.v == null) continue;
    if (o.at.v === h.i) { delete o.at; if (!o.via) dropStubOverride(key, id); }
    else if (o.at.v > h.i) o.at.v--;
  }
  saveBusConfig('Ponto removido.'); selectBus(key);
  return true;
}

/* ---------- tamanho da esfera ---------- */
const SIZE_SCALE = { small: 1, medium: 1.4, large: 1.8 };

/* ---------- forma da esfera ----------
   Ângulos (graus, convenção canvas: x pra direita, y pra baixo) dos vértices de cada polígono,
   medidos a partir do centro. 'circle' fica de fora do mapa de propósito — é o caso especial
   tratado à parte (ctx.arc) em vez de um polígono de N lados. */
const SHAPE_ANGLES = {
  diamond: [0, 90, 180, 270],
  square: [45, 135, 225, 315],
  triangle: [-90, 30, 150],
  hexagon: [-90, -30, 30, 90, 150, 210],
};
function shapeVertices(shape, r) {
  return (SHAPE_ANGLES[shape] || []).map((deg) => { const a = deg * Math.PI / 180; return { x: Math.cos(a) * r, y: Math.sin(a) * r }; });
}
// traça o contorno da forma no ctx já transladado pro centro do nó (ou pro centro do sprite
// offscreen, ver bodySpriteFor) — círculo continua sendo ctx.arc, as demais formas viram um
// polígono fechado com os vértices de SHAPE_ANGLES.
function traceShapePath(ctx, shape, r) {
  const angles = SHAPE_ANGLES[shape];
  ctx.beginPath();
  if (!angles) { ctx.arc(0, 0, r, 0, Math.PI * 2); return; }
  angles.forEach((deg, i) => {
    const a = deg * Math.PI / 180, x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
}
// teste ponto-dentro-de-polígono-convexo (mesmo lado em relação a todas as arestas) — só roda por
// clique (hitTestNodeAt), nunca por quadro, então não precisa de sprite/cache como o desenho.
function pointInShape(shape, dx, dy, r) {
  const pts = shapeVertices(shape, r);
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const cross = (b.x - a.x) * (dy - a.y) - (b.y - a.y) * (dx - a.x);
    if (cross !== 0) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s; else if (sign !== s) return false;
    }
  }
  return true;
}

/* ---------- boot ---------- */
// diagnóstico: cada etapa do boot é logada com um prefixo fixo, pra dar pra ver exatamente onde
// ele parou (F12 → Console) se algo travar sem lançar erro nenhum (ex.: uma promessa que nunca
// resolve nem rejeita). Também alimenta um timeout de segurança logo abaixo.
const BOOT_LOG = '[árvore boot]';
let _bootStep = 'iniciando';
function bootStep(label) { _bootStep = label; console.log(BOOT_LOG, label); }
// se depois de 10s o boot ainda não terminou (nem sucesso nem erro caído no catch), mostra um
// aviso com a última etapa conhecida — evita a tela ficar em branco pra sempre, sem pista nenhuma,
// no caso (raro) de uma chamada ao Supabase nunca resolver
let _bootDone = false;
setTimeout(() => {
  if (_bootDone) return;
  showBootError(`Travou na etapa "${_bootStep}" por mais de 10s (sem erro nenhum lançado — provavelmente uma chamada de rede que não voltou).`);
}, 10000);
/* ---------- modelo de árvore (Criação → Criar → Árvores) ----------
   O editor continua chamando db.insertTreeNode/updateTreeNode/... como sempre; aqui essas funções
   trocam o banco por uma cópia do modelo na memória (tplStore). "Salvar modelo" grava a cópia inteira
   na conta (tree_templates.data). Sair com alterações não salvas pede confirmação. */
let tplId = null, tplDirty = false, tplStore = null, tplReal = null;
async function setupTemplateMode() {
  tplReal = db;
  const row = await db.getTreeTemplate(templateParam);
  if (!row) throw new Error('Modelo de árvore não encontrado. Ele pode ter sido excluído.');
  tplId = row.id;
  const d = row.data || {};
  const base = { grid_shape: 'octagon', edge_style: 'lines', bus_dir: 'auto', require_char_level: false, bus_config: {} };
  const nodeDefaults = { size: 'small', shape: 'circle', color: null, cost: 1, descr: '', level: null, enabled: true };
  tplStore = {
    tree: { ...base, ...(d.tree || {}), id: treeId, name: row.name },
    nodes: (d.nodes || []).map((n) => ({ ...nodeDefaults, ...n })),
    edges: (d.edges || []).map((e) => ({ ...e })),
  };
  const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const touch = () => { tplDirty = true; paintTemplateBar(); };
  const copy = (o) => JSON.parse(JSON.stringify(o));
  db = {
    ...tplReal,
    getSystemTree: async () => copy(tplStore.tree),
    loadSystemTree: async () => ({ nodes: copy(tplStore.nodes), edges: copy(tplStore.edges) }),
    listStats: async () => [],
    insertTreeNode: async (_t, node) => { const n = { ...nodeDefaults, ...copy(node), id: uid() }; tplStore.nodes.push(n); touch(); return { ...n }; },
    updateTreeNode: async (id, patch) => { const n = tplStore.nodes.find((x) => x.id === id); if (n) Object.assign(n, copy(patch)); touch(); return n ? { ...n } : null; },
    deleteTreeNode: async (id) => { tplStore.nodes = tplStore.nodes.filter((x) => x.id !== id); tplStore.edges = tplStore.edges.filter((e) => e.a !== id && e.b !== id); touch(); },
    insertTreeEdge: async (_t, a, b) => {
      if (tplStore.edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return null;
      const e = { id: uid(), a, b }; tplStore.edges.push(e); touch(); return { ...e };
    },
    deleteTreeEdge: async (id) => { tplStore.edges = tplStore.edges.filter((e) => e.id !== id); touch(); },
    updateSystemTree: async (_id, patch) => { Object.assign(tplStore.tree, copy(patch)); touch(); return copy(tplStore.tree); },
  };
  $('tpl-bar').hidden = false;
  $('tpl-name').value = row.name;
  addEventListener('beforeunload', (ev) => { if (tplDirty) { ev.preventDefault(); ev.returnValue = ''; } });
}
function paintTemplateBar() {
  const st = $('tpl-state'); if (!st) return;
  st.textContent = tplDirty ? 'Alterações não salvas' : 'Salvo na sua conta';
  st.classList.toggle('dirty', tplDirty);
}
window.markTemplateDirty = () => { tplDirty = true; paintTemplateBar(); };
const missingTemplatesTable = (e) => /tree_templates/.test(e?.message || '') || e?.code === '42P01' || e?.code === 'PGRST205';
window.saveTemplate = async () => {
  if (!isTemplate || !tplStore) return;
  const name = ($('tpl-name').value || '').trim();
  if (!name) { showMsg('Dê um nome ao modelo antes de salvar.'); $('tpl-name').focus(); return; }
  // o desenho do barramento grava com atraso (saveBusConfig); aqui pega sempre o que está na tela
  if (hasBusConfig) tplStore.tree.bus_config = JSON.parse(JSON.stringify(busConfig));
  const btn = $('tpl-save'); btn.classList.add('loading'); btn.disabled = true;
  try {
    await tplReal.updateTreeTemplate(tplId, { name, data: tplReal.treeTemplateData(tplStore.tree, tplStore.nodes, tplStore.edges) });
    tplStore.tree.name = name;
    $('tree-name').innerHTML = esc(name) + '<small>MODELO DE ÁRVORE</small>';
    tplDirty = false; paintTemplateBar();
    showMsg('Modelo salvo na sua conta.', 'ok');
  } catch (e) {
    showMsg(missingTemplatesTable(e) ? 'Para salvar modelos, aplique a migração 20261003_modelos_de_arvore.sql no Supabase.' : 'Não deu pra salvar: ' + e.message);
  } finally { btn.classList.remove('loading'); btn.disabled = false; }
};
// árvore de um sistema → modelo novo na conta, com o desenho atual (o original não muda)
window.saveAsTemplate = async () => {
  if (!isGM || isTemplate) return;
  const btn = $('as-template'); if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  try {
    const tree = await db.getSystemTree(treeId);
    const data = db.treeTemplateData({ ...tree, vias, bus_config: hasBusConfig ? busConfig : tree.bus_config }, nodes, edges);
    const row = await db.createTreeTemplate(tree.name || 'Árvore', data);
    showMsg(`Modelo "${row.name}" salvo. Ele fica em Criação → Criar → Árvores.`, 'ok');
  } catch (e) {
    showMsg(missingTemplatesTable(e) ? 'Para salvar modelos, aplique a migração 20261003_modelos_de_arvore.sql no Supabase.' : 'Não deu pra salvar o modelo: ' + e.message);
  } finally { if (btn) { btn.classList.remove('loading'); btn.disabled = false; } }
};

(async () => {
  bootStep('checando parâmetros da URL');
  if (!treeId) { location.href = 'app.html'; return; }
  // sempre volta pra tela inicial do app — o link antigo mandava pra dentro do sistema do Mestre
  // mesmo quando quem clicou era um jogador (mesa.html sempre manda "system=" no link,
  // GM ou não), o que abria a tela de edição do sistema pra gente sem permissão nenhuma
  $('back').href = isTemplate ? 'app.html?criar=arvores' : 'app.html';
  bootStep('confirmando sessão');
  const session = await db.requireSession();
  if (!session) return;
  bootStep('carregando perfil');
  const [profile, user] = await Promise.all([db.getMyProfile(), db.getUser()]);
  myEmail = user?.email || null;
  myName = profile?.display_name || user?.email?.split('@')[0] || '—';
  $('who').textContent = myName;
  $('nav-av').textContent = myName.trim().charAt(0).toUpperCase() || '?';
  try {
    if (isTemplate) { bootStep('carregando o modelo de árvore'); await setupTemplateMode(); }
    bootStep('buscando a árvore (getSystemTree)');
    const tree = await db.getSystemTree(treeId);
    if (isTemplate) isGM = true; // modelo é sempre da própria conta (a RLS só devolve os seus)
    else {
      bootStep('confirmando posse do sistema (getSystem)');
      try {
        const sys = await db.getSystem(tree.system_id);
        isGM = !!(sys && sys.owner_id === session.user.id);
      } catch (_) { isGM = false; } // falhou em confirmar posse — trata como jogador (falha segura)
    }
    document.body.classList.toggle('is-gm', isGM);
    document.body.classList.toggle('is-template', isTemplate);
    updateEpanelOffset();
    $('tree-name').innerHTML = esc(tree?.name || 'Árvore') + '<small>' + (isTemplate ? 'MODELO DE ÁRVORE' : isGM ? 'EDITOR DA ÁRVORE DE ESFERAS' : 'ÁRVORE DE ESFERAS') + '</small>';
    const asTpl = $('as-template'); if (asTpl) asTpl.hidden = !isGM || isTemplate || embedded;
    applyBg(tree?.bg_color || '#1b1536');
    $('bg-color').value = tree?.bg_color || '#1b1536';
    gridShape = tree?.grid_shape || 'octagon'; $('shape-select').value = gridShape;
    ringColor = tree?.ring_color || '#c6d2ff'; $('ring-color').value = ringColor;
    ringOpacity = tree?.ring_opacity ?? 1; $('ring-opacity').value = ringOpacity;
    edgeColor = tree?.edge_color || '#d6f0ff'; $('edge-color').value = edgeColor;
    vias = (tree?.vias && tree.vias.length) ? tree.vias.map((v) => ({ ...v })) : DEFAULT_VIAS.map((v) => ({ ...v }));
    hasTreeOpts = !!tree && 'edge_style' in tree;
    edgeStyle = tree?.edge_style === 'bus' ? 'bus' : 'lines';
    busDir = tree?.bus_dir || 'auto';
    requireCharLevel = !!tree?.require_char_level;
    hasBusConfig = !!tree && 'bus_config' in tree;
    busConfig = { group: tree?.bus_config?.group === 'via' ? 'via' : 'level', paths: { ...(tree?.bus_config?.paths || {}) },
      stubs: JSON.parse(JSON.stringify(tree?.bus_config?.stubs || {})),
      buses: Array.isArray(tree?.bus_config?.buses) ? JSON.parse(JSON.stringify(tree.bus_config.buses)) : null };
    renderViaChips(); renderViaManager();
    bootStep('carregando status do sistema (listStats)');
    try { stats = isTemplate ? [] : await db.listStats(tree.system_id); } catch (_) { stats = []; } // sem atributos cadastrados ainda — ok
    bootStep('carregando esferas e conexões (loadSystemTree)');
    const data = await db.loadSystemTree(treeId);
    nodes = data.nodes.map((n) => ({ ...n }));
    edges = data.edges.map((e) => ({ id: e.id, a: e.a, b: e.b }));
    console.log(BOOT_LOG, 'dados recebidos:', nodes.length, 'esferas,', edges.length, 'conexões, isGM =', isGM);
    if (!nodes.length && isGM) { // jogador nunca cria dados — só o dono pode inicializar a árvore
      const core = await db.insertTreeNode(treeId, { name: 'Núcleo', kind: 'core', fac: 'neutral', cost: 0, descr: 'A origem da árvore.', x: 0, y: 0 });
      nodes.push({ ...core });
    }
    hasLevelCol = nodes.length ? 'level' in nodes[0] : false;
    syncLevelUi();
    if (!isGM) { // progresso de desbloqueio só existe pro jogador
      try { unlockedIds = await db.getMyUnlocks(treeId); myPoints = await db.getMyProgress(treeId); }
      catch (_) { unlockedIds = new Set(); myPoints = 0; }
    }
  } catch (e) {
    _bootDone = true;
    console.error(BOOT_LOG, 'falhou na etapa "' + _bootStep + '":', e);
    showBootError(`(${_bootStep}) ${e.message}`);
    return;
  }
  bootStep('desenhando o canvas');
  // recalcula W/H aqui (não só no <script> carregar) e recentraliza a câmera — dentro de um
  // iframe embutido, innerWidth/innerHeight lidos lá em cima podiam não refletir ainda o tamanho
  // final do iframe (que só se estabiliza depois do layout da página-mãe rodar), deixando a árvore
  // centralizada num ponto errado e, na prática, fora da área visível.
  W = innerWidth; H = innerHeight; view = { x: W/2, y: H/2, s: 1 };
  fxResize(); resizeStage(); buildDotSphere(); buildRings(); applyRingColor(ringColor); applyRingOpacity(ringOpacity); applyEdgeColor(edgeColor); buildGridVisual(); renderDupOptions(); applyRingsToggle(); applyParticlesToggle();
  // applyView() TEM que rodar antes de render() agora: render() faz culling de viewport
  // (computeVisibleIds), que lê a posição da câmera via getBoundingClientRect() do <svg> — se a
  // câmera ainda não tiver sido posicionada, o cálculo do que está "visível" sairia errado logo
  // no primeiro carregamento (culling tudo, ou a área errada).
  applyView(); render(); updateCoreAnchor(); requestAnimationFrame(tick);
  if (isTemplate) { tplDirty = false; paintTemplateBar(); } // o Núcleo criado sozinho num modelo vazio não conta como alteração
  _bootDone = true;
  console.log(BOOT_LOG, 'concluído — W/H =', W, H, '· view =', view);
})();

/* ---------- cor de fundo (roda de cores) ---------- */
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [27, 21, 54];
}
function applyBg(color) {
  const [r, g, b] = hexToRgb(color);
  // a cor escolhida vira o fundo INTEIRO da árvore (glow + base sólida + vinheta) — mora só aqui,
  // no #fallback, independente dos anéis (que podem estar ligados ou desligados).
  // usa rgba() (não hex+alfa) de propósito — mais robusto entre navegadores.
  $('fallback').style.background =
    `radial-gradient(900px 680px at 50% 40%, rgba(${r},${g},${b},.4), transparent 62%),` +
    `radial-gradient(1500px 1100px at 50% 34%, rgba(255,255,255,.12), transparent 55%),` +
    `radial-gradient(1700px 1400px at 50% 125%, rgba(0,0,0,.6), transparent 72%),` +
    `${color}`;
  // a poeira cósmica usa mistura aditiva ("lighter"), que some em fundos claros — adapta a cor/mistura
  // das partículas pra sempre contrastar com o fundo escolhido, escuro ou claro.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum > 0.6) { partRGB = '40,32,58'; partBlend = 'multiply'; }
  else { partRGB = '206,196,255'; partBlend = 'lighter'; }
}
window.previewBg = (c) => { if (isGM) { applyBg(c); colorPreviewDirty = true; } };   // pré-visualiza ao mexer no seletor
window.saveBg = () => { if (!isGM) return; const c = $('bg-color').value; applyBg(c);
  db.updateSystemTree(treeId, { bg_color: c }).then(() => { colorPreviewDirty = false; showMsg('Cor de fundo salva.', 'ok'); }).catch((e) => showMsg(e.message)); };

/* ---------- partículas flutuantes (tela fixa, independente do pan/zoom da árvore) ----------
   ficam em coordenadas de TELA (sx,sy), não de mundo — são atmosfera decorativa, não fazem
   parte do mapa de esferas. Guardar em world-space e reprojetar por view.s (jeito antigo) fazia
   as partículas "recém-nascidas" herdarem um raio de mundo cada vez menor conforme o zoom
   aumentava (a fórmula de respawn dividia por view.s), então elas acabavam se acumulando todas
   perto de um único ponto do mundo assim que o zoom mudava de novo. */
const REDUCED_MQ = matchMedia('(prefers-reduced-motion:reduce)');
// movimento reduzido = preferência do sistema OU "Animações" desligada nas Configurações do site
// (html[data-motion="off"], ver lib/ui.js) — observado ao vivo, sem precisar recarregar a árvore
let REDUCED = REDUCED_MQ.matches || document.documentElement.dataset.motion === 'off';
function syncReducedMotion() { REDUCED = REDUCED_MQ.matches || document.documentElement.dataset.motion === 'off'; }
REDUCED_MQ.addEventListener?.('change', syncReducedMotion);
new MutationObserver(syncReducedMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
const fx = $('fx'), fctx = fx.getContext('2d');
let parts = [], partRGB = '206,196,255', partBlend = 'lighter', psprite = {};
function spr(rgb) {
  if (psprite[rgb]) return psprite[rgb];
  const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.4, `rgba(${rgb},.3)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, s, s); return psprite[rgb] = cv;
}
function seedParts() {
  const n = REDUCED ? 24 : Math.min(120, Math.round(W * H / 13000)); parts = [];
  for (let i = 0; i < n; i++) parts.push({ sx:Math.random()*W, sy:Math.random()*H, r:.9+Math.random()*2.4, a:.3+Math.random()*.5, tw:.4+Math.random()*1.4, ph:Math.random()*7, vx:(Math.random()-.5)*.06, vy:(Math.random()-.5)*.06 });
}
function fxResize() { fx.width = W*DPR; fx.height = H*DPR; fx.style.width = W+'px'; fx.style.height = H+'px'; fctx.setTransform(DPR,0,0,DPR,0,0); seedParts(); }
function resizeStage() { stage.width = W*DPR; stage.height = H*DPR; stage.style.width = W+'px'; stage.style.height = H+'px'; }

/* ---------- sólido 3D de pontos (gira) — textura dentro de cada esfera ----------
   Cada forma tem seu próprio modelo de pontos 3D estático — esfera, cubo, octaedro, tetraedro ou
   prisma hexagonal (ver DOT_MODEL_BUILDERS) — pra que a textura giratória combine com a silhueta
   escolhida em vez de sempre parecer uma esfera cortada nos cantos. Antes era um <g id="dotSphere">
   de SVG compartilhado via <use> por TODAS as esferas (repintar a fonte forçava recálculo em cada
   referência). Agora é um sprite de canvas pré-desenhado, cacheado POR FORMA+COR DE VIA (poucas
   combinações distintas por árvore) — desenhar é só um drawImage barato, e o sprite só é regerado
   quando o ângulo avança (mesmo throttle de antes: 1 em 6 quadros, parado durante interação/modo
   leve). */
let dotModels = {}, dotAngle = 0;
const TILT = 18 * Math.PI / 180, cT = Math.cos(TILT), sT = Math.sin(TILT);
const DOT_SPRITE_SIZE = 200; // px — mapeia o modelo de raio ~100 (unidades do modelo 3D) pro sprite
let dotSpriteCache = new Map(); // "forma|cor" -> canvas

// amostra pontos numa grade baricêntrica do triângulo A-B-C, evitando cantos/bordas exatos (que
// duplicariam entre faces vizinhas de um sólido) — usado pelas faces planas de cada poliedro.
function trianglePoints(A, B, C, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) for (let j = 0; j <= steps - i; j++) {
    const k = steps - i - j, u = i / steps, v = j / steps, w = k / steps;
    if (u < 0.12 || v < 0.12 || w < 0.12) continue;
    pts.push({ x: A.x*u + B.x*v + C.x*w, y: A.y*u + B.y*v + C.y*w, z: A.z*u + B.z*v + C.z*w });
  }
  return pts;
}
function spherePoints() {
  const pts = [];
  for (let lat = -80; lat <= 80; lat += 13) { const rad = lat * Math.PI/180, cl = Math.cos(rad); const n = Math.max(6, Math.round(17*cl));
    for (let i = 0; i < n; i++) { const lon = (i/n)*Math.PI*2; pts.push({ x: 100*cl*Math.sin(lon), y: -100*Math.sin(rad), z: 100*cl*Math.cos(lon) }); } }
  return pts;
}
function cubePoints() { // quadrado — cubo girando, pontos numa grade em cada uma das 6 faces
  const half = 75, n = 4, coords = []; for (let i = 0; i < n; i++) coords.push(-half + (i + .5) * (2*half/n));
  const faces = [
    (a, b) => ({ x: half, y: a, z: b }), (a, b) => ({ x: -half, y: a, z: b }),
    (a, b) => ({ x: a, y: half, z: b }), (a, b) => ({ x: a, y: -half, z: b }),
    (a, b) => ({ x: a, y: b, z: half }), (a, b) => ({ x: a, y: b, z: -half }),
  ];
  const pts = [];
  for (const f of faces) for (const a of coords) for (const b of coords) pts.push(f(a, b));
  return pts;
}
function octahedronPoints() { // losango — octaedro girando (parece uma gema facetada)
  const r = 100;
  const V = { px:{x:r,y:0,z:0}, nx:{x:-r,y:0,z:0}, py:{x:0,y:r,z:0}, ny:{x:0,y:-r,z:0}, pz:{x:0,y:0,z:r}, nz:{x:0,y:0,z:-r} };
  const faces = [
    [V.px,V.py,V.pz], [V.px,V.py,V.nz], [V.px,V.ny,V.pz], [V.px,V.ny,V.nz],
    [V.nx,V.py,V.pz], [V.nx,V.py,V.nz], [V.nx,V.ny,V.pz], [V.nx,V.ny,V.nz],
  ];
  let pts = []; for (const f of faces) pts = pts.concat(trianglePoints(f[0], f[1], f[2], 5));
  return pts;
}
function tetrahedronPoints() { // triângulo — tetraedro girando
  const s = 100 / Math.sqrt(3);
  const V = [{x:s,y:s,z:s}, {x:s,y:-s,z:-s}, {x:-s,y:s,z:-s}, {x:-s,y:-s,z:s}];
  const faces = [[V[0],V[1],V[2]], [V[0],V[1],V[3]], [V[0],V[2],V[3]], [V[1],V[2],V[3]]];
  let pts = []; for (const f of faces) pts = pts.concat(trianglePoints(f[0], f[1], f[2], 7));
  return pts;
}
function hexPrismPoints() { // hexágono — prisma hexagonal girando (topo/base + laterais)
  const r = 90, halfH = 55, pts = [];
  for (const y of [halfH, -halfH]) for (const ring of [0.4, 0.75, 1]) {
    const rot = ring < 1 ? Math.PI / 6 : 0;
    for (let i = 0; i < 6; i++) { const a = (i/6)*Math.PI*2 + rot; pts.push({ x: r*ring*Math.cos(a), y, z: r*ring*Math.sin(a) }); }
  }
  for (let side = 0; side < 6; side++) {
    const a0 = side * (Math.PI/3), a1 = a0 + Math.PI/3;
    const x0 = r*Math.cos(a0), z0 = r*Math.sin(a0), x1 = r*Math.cos(a1), z1 = r*Math.sin(a1);
    for (let i = 1; i < 3; i++) { const t = i/3, x = x0+(x1-x0)*t, z = z0+(z1-z0)*t;
      for (let j = 1; j < 3; j++) pts.push({ x, y: -halfH + (j/3)*2*halfH, z });
    }
  }
  return pts;
}
const DOT_MODEL_BUILDERS = { circle: spherePoints, square: cubePoints, diamond: octahedronPoints, triangle: tetrahedronPoints, hexagon: hexPrismPoints };
function buildDotSphere() {
  dotModels = {};
  for (const shape in DOT_MODEL_BUILDERS) dotModels[shape] = DOT_MODEL_BUILDERS[shape]();
  invalidateDotSprites();
}
function invalidateDotSprites() { dotSpriteCache = new Map(); }
function dotSpriteFor(shape, color) {
  const key = shape + '|' + color;
  let cv = dotSpriteCache.get(key);
  if (cv) return cv;
  const size = DOT_SPRITE_SIZE, c = size / 2, scale = c / 100;
  cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d'); g.fillStyle = color;
  const model = dotModels[shape] || dotModels.circle;
  // gira ao redor do eixo vertical (Y) — mesma rotação de sempre (era lon0+dotAngle numa
  // parametrização lat/lon só válida pra esfera), agora expressa como uma rotação 2D de (x,z) que
  // funciona pra qualquer modelo de pontos estático.
  const cosA = Math.cos(dotAngle), sinA = Math.sin(dotAngle);
  const projected = model.map((p) => {
    const x = p.x*cosA + p.z*sinA, z = -p.x*sinA + p.z*cosA;
    return { x, y2: p.y*cT - z*sT, z2: p.y*sT + z*cT };
  });
  // profundidade normalizada pelo alcance real de z do modelo (cada sólido tem uma extensão
  // diferente da esfera) — esconde a metade de trás do sólido e faz a frente brilhar mais/maior,
  // exatamente a mesma regra que já valia só pra esfera, generalizada pra qualquer forma convexa.
  const zs = projected.map((p) => p.z2), zMax = Math.max(...zs), zMin = Math.min(...zs), zRange = Math.max(1, zMax - zMin);
  for (const p of projected) {
    const depth = (p.z2 - zMin) / zRange;
    if (depth < 0.5) continue;
    const front = (depth - 0.5) * 2;
    g.globalAlpha = 0.16 + 0.84*front;
    g.beginPath(); g.arc(c + p.x*scale, c + p.y2*scale, Math.max(1.2, 1.7 + 1.2*front) * scale, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  dotSpriteCache.set(key, cv);
  return cv;
}
let last = performance.now();
function tick(now) {
  // try/catch pra um erro pontual (ex.: numa cor mal formada) nunca travar a animação pro resto da sessão —
  // o requestAnimationFrame fica DE FORA do catch, sempre reagenda o próximo quadro.
  try {
    const dt = Math.min(40, now - last); last = now;
    // a esfera de pontos e a poeira cósmica não pausam mais durante pan/zoom/arrasto (correção da
    // época do SVG, onde repintar essas animações competia de verdade com o tempo de quadro do
    // gesto) — em canvas nenhuma das duas custa o suficiente pra isso importar: invalidateDotSprites
    // só limpa o cache de sprite (poucas cores distintas por árvore, não uma por esfera).
    if (!REDUCED && (tick.fc = (tick.fc || 0) + 1) % 6 === 0) { dotAngle += 0.027; invalidateDotSprites(); }
    fctx.clearRect(0, 0, W, H);
    if (particlesOn) {
      fctx.globalCompositeOperation = partBlend;
      const t = now * .001, sp = spr(partRGB), m = 160;
      for (const p of parts) {
        if (!REDUCED) p.sx += p.vx * dt, p.sy += p.vy * dt;
        if (p.sx < -m || p.sx > W + m || p.sy < -m || p.sy > H + m) { p.sx = Math.random()*W; p.sy = Math.random()*H; continue; }
        fctx.globalAlpha = Math.max(0, p.a * (REDUCED ? .75 : .5 + .5 * Math.sin(t * p.tw + p.ph)));
        fctx.drawImage(sp, p.sx - p.r*3, p.sy - p.r*3, p.r*6, p.r*6);
      }
      fctx.globalAlpha = 1;
    }
    // o mundo (esferas/conexões) redesenha TODO quadro, sem exceção — diferente da poeira/textura
    // decorativas acima, isso é o conteúdo em si, precisa continuar atualizado durante pan/arrasto
    // pra mostrar o movimento. Canvas aguenta redesenhar tudo 60x/s tranquilo (é exatamente esse o
    // ponto de ter trocado de SVG pra canvas) — nada de dirty-flag, sempre desenha.
    drawWorld(now);
  } catch (err) { console.error('[tick]', err); }
  requestAnimationFrame(tick);
}

/* ---------- anéis arcanos da árvore (giram e seguem o Núcleo) ----------
   os raios são proporcionais ao alcance de verdade da árvore (distância da esfera mais afastada
   até o Núcleo, em unidades de RING_STEP) — raios fixos (indo até 24 aneis = 1152 unidades)
   ficavam enormes e desproporcionais numa árvore pequena, com só 2-3 aneis de esferas de verdade
   perdidos no meio de um cenário gigante. As FRAÇÕES abaixo são as mesmas proporções de antes
   (quando o maior anel fixo era 24), só que agora escalam com `ringExtent()` em vez de um número
   fixo. Recalculado em render() (após criar/excluir/duplicar esfera) e ao soltar um arrasto que
   mude a posição de alguma esfera — não a cada quadro, já que isso significa reconstruir um bloco
   de innerHTML de SVG. */
const RING_TICK_SEGMENTS = { octagon: 8, hexagon: 6, linear: 8 };
function ringExtent() {
  const core = coreNode || nodes.find((n) => n.kind === 'core');
  let maxRing = 4; // piso — uma árvore só com o Núcleo (ou bem pequena) ainda mostra aneis razoáveis
  if (core) for (const n of nodes) { if (n === core) continue; maxRing = Math.max(maxRing, Math.hypot(n.x - core.x, n.y - core.y) / RING_STEP); }
  return maxRing;
}
function buildRings() {
  const C = (r, cls, extra) => `<circle class="${cls}" cx="0" cy="0" r="${r}" fill="none" ${extra || ''}></circle>`;
  const segs = RING_TICK_SEGMENTS[gridShape] || 8;
  const ext = ringExtent();
  let s = '';
  // raio contínuo (NÃO arredondado pra múltiplo inteiro de RING_STEP) — arredondar fazia frações
  // diferentes caírem no mesmo raio inteiro em árvores pequenas (ext baixo), sobrepondo uma linha
  // estática e um anel giratório tracejado exatamente um em cima do outro (o "os dois no mesmo"
  // reportado). As duas listas de fração abaixo nunca têm valores iguais entre si, então raio
  // contínuo garante raios sempre distintos, não importa o tamanho da árvore.
  [0.125, 0.25, 0.375, 0.542, 0.708, 0.833, 1].forEach((f) => { s += C((f * ext * RING_STEP).toFixed(2), 'ring'); });
  const spins = [
    { f: 0.167, mult: 9,  width: 6,  speed: 110, rev: false },
    { f: 0.333, mult: 13, width: 10, speed: 150, rev: false },
    { f: 0.5,   mult: 10, width: 4,  speed: 95,  rev: true },
    { f: 0.667, mult: 16, width: 8,  speed: 170, rev: false },
    { f: 0.875, mult: 12, width: 5,  speed: 130, rev: true },
  ];
  spins.forEach(({ f, mult, width, speed, rev }) => {
    const r = f * ext * RING_STEP, n = segs * mult, seg = (2 * Math.PI * r) / n, dash = seg * .15, gap = seg - dash;
    s += `<g class="ringspin${rev ? ' rev' : ''}" style="animation-duration:${speed}s">` +
      C(r.toFixed(2), 'ringTick', `stroke-width="${width}" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"`) + '</g>';
  });
  ringsInner.innerHTML = s;
}
function applyRingColor(hex) {
  ringColor = hex;
  ringsEl.style.setProperty('--ringc', hexToRgb(hex).join(','));
}
window.previewRingColor = (c) => { if (isGM) { applyRingColor(c); colorPreviewDirty = true; } };
function applyRingOpacity(v) {
  ringOpacity = +v;
  ringsEl.style.opacity = ringOpacity;
}
window.previewRingOpacity = (v) => { if (isGM) { applyRingOpacity(v); colorPreviewDirty = true; } };
window.saveRingSettings = () => {
  if (!isGM) return;
  const c = $('ring-color').value, o = +$('ring-opacity').value;
  applyRingColor(c); applyRingOpacity(o);
  db.updateSystemTree(treeId, { ring_color: c, ring_opacity: o })
    .then(() => { colorPreviewDirty = false; showMsg('Anéis salvos.', 'ok'); }).catch((e) => showMsg(e.message));
};
function applyEdgeColor(hex) { edgeColor = hex; } // lido direto por drawEdge() via hexToRgb() — não existe mais custom property de CSS pra isso
window.previewEdgeColor = (c) => { if (isGM) { applyEdgeColor(c); colorPreviewDirty = true; } };
window.saveEdgeColor = () => { if (!isGM) return; const c = $('edge-color').value; applyEdgeColor(c);
  db.updateSystemTree(treeId, { edge_color: c }).then(() => { colorPreviewDirty = false; showMsg('Cor das linhas salva.', 'ok'); }).catch((e) => showMsg(e.message)); };

/* ---------- liga/desliga os anéis (a animação pode atrapalhar durante a edição) ---------- */
let ringsOn = true;
try { ringsOn = localStorage.getItem('vt_rings') !== '0'; } catch (_) {}
function applyRingsToggle() {
  ringsEl.style.display = ringsOn ? '' : 'none';
  const btn = $('rings-toggle');
  btn.classList.toggle('on', ringsOn);
  btn.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/></svg></span>Anéis';
  btn.setAttribute('aria-pressed', String(ringsOn));
}
window.toggleRings = () => {
  ringsOn = !ringsOn;
  try { localStorage.setItem('vt_rings', ringsOn ? '1' : '0'); } catch (_) {}
  applyRingsToggle();
};

/* ---------- liga/desliga a poeira cósmica (partículas) ---------- */
let particlesOn = true;
try { particlesOn = localStorage.getItem('vt_particles') !== '0'; } catch (_) {}
function applyParticlesToggle() {
  const btn = $('particles-toggle');
  btn.classList.toggle('on', particlesOn);
  btn.innerHTML = `<span class="ic">${ICONS.sparkle}</span>Poeira`;
  btn.setAttribute('aria-pressed', String(particlesOn));
}
window.toggleParticles = () => {
  particlesOn = !particlesOn;
  try { localStorage.setItem('vt_particles', particlesOn ? '1' : '0'); } catch (_) {}
  applyParticlesToggle();
};

/* ---------- render (canvas) ----------
   Reescrito nesta sessão: esferas/conexões eram um <g id="world"> de SVG (~8 filhos de DOM por
   esfera). SVG tem um teto real de desempenho — o navegador recalcula estilo/layout/pintura pra
   CADA elemento a cada mudança, custo que cresce com o número de esferas não importa quanta
   otimização se aplique por cima (já tentamos: cortar filter:drop-shadow, evitar reconstruir tudo
   a cada edição, culling de viewport, indexar conexões por esfera, "modo leve"). Canvas desenha
   PIXELS, não elementos — o custo por quadro passa a depender só do que é desenhado (barato, e
   cacheável via sprite pré-renderizado), não de quantos elementos de DOM existem. */
// null de propósito (não 0/0): a primeira chamada é o boot posicionando a câmera pela primeira
// vez, não um "movimento" de verdade — sem essa guarda, esse primeiro ajuste depositaria as
// partículas recém-semeadas todas deslocadas pro canto errado antes mesmo da árvore aparecer.
let lastViewX = null, lastViewY = null;
function applyView() {
  // a poeira cósmica vive em coordenadas de TELA (não de mundo, ver seedParts) — sem isso ela
  // ficava parada no lugar enquanto a câmera (pan/zoom/pinça) se movia por baixo dela. Desloca
  // todas as partículas pelo mesmo delta que a câmera moveu — é só uma translação (nunca reescala
  // pelo zoom), então não reintroduz o bug antigo de partículas se acumulando num ponto só quando
  // o zoom mudava (aquele vinha de REPROJETAR posição por view.s, não de uma soma simples).
  if (lastViewX !== null) {
    const dx = view.x - lastViewX, dy = view.y - lastViewY;
    if (dx || dy) for (const p of parts) { p.sx += dx; p.sy += dy; }
  }
  lastViewX = view.x; lastViewY = view.y;
  const tr = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
  ringsEl.style.transform = tr; gridPolarEl.style.transform = tr;
  updateSnapMarkTransform();
}
// separado de applyView(): o Núcleo só muda de posição quando ele é arrastado, não a cada
// pan/zoom — recalcular isso em todo pointermove do pan era escrita de DOM desperdiçada
function updateCoreAnchor() {
  const c = coreNode || nodes.find((n) => n.kind === 'core');
  if (c) { ringsInner.setAttribute('transform', `translate(${c.x} ${c.y})`); gridPolarInner.setAttribute('transform', `translate(${c.x} ${c.y})`); }
}
function toWorld(cx, cy) { const r = stage.getBoundingClientRect(); return { x: (cx-r.left-view.x)/view.s, y: (cy-r.top-view.y)/view.s }; }
function refreshCount() { const el = $('count'); el.className = 'count'; el.textContent = nodes.length + ' habilidades · ' + edges.length + ' conexões'; }
function nodeRadius(n) { const base = n.kind === 'core' ? 22 : (n.kind === 'active' ? 16 : 13); return Math.round(base * (SIZE_SCALE[n.size] || 1)); }
// culling de viewport: mesmo sem custo de DOM, ainda tem custo real desenhar cada esfera (sprite +
// alguns traços). Só considerar o que está dentro da tela (mais uma margem folgada, pra não
// "piscar" nada com panorâmicas pequenas) mantém esse custo dependendo de quantas esferas CABEM na
// tela, não de quantas a árvore tem no total. Roda TODO quadro agora (dentro de drawWorld) — é só
// um teste de retângulo, barato o bastante pra não precisar mais esperar o gesto terminar (isso só
// era necessário quando "recalcular o que é visível" também significava recriar DOM).
const CULL_MARGIN_PX = 500;
function computeVisibleIds() {
  const pad = CULL_MARGIN_PX / view.s;
  const tl = toWorld(0, 0), br = toWorld(W, H);
  const x1 = tl.x - pad, y1 = tl.y - pad, x2 = br.x + pad, y2 = br.y + pad;
  const ids = new Set();
  for (const n of nodes) {
    const r = nodeRadius(n);
    if (n.x + r >= x1 && n.x - r <= x2 && n.y + r >= y1 && n.y - r <= y2) ids.add(n.id);
  }
  return ids;
}
// índice por id — usado no desenho das conexões (achar as duas pontas) e no hit-test, que rodam
// por quadro/por clique; nodes.find() linear seria O(n) nesses pontos quentes. (Não existe mais um
// índice de conexão-por-esfera separado: esse só fazia sentido pra atualizar cirurgicamente o DOM
// de UMA esfera arrastada, sem precisar varrer todas as conexões — em canvas, drawWorld() já varre
// "edges" inteiro todo quadro de qualquer jeito, então o índice seria trabalho refeito à toa.)
function rebuildIndexes() { nodeById = new Map(nodes.map((n) => [n.id, n])); }
// distância de cada habilidade até o Núcleo em unidades de MUNDO, seguindo as conexões (Dijkstra
// sobre o comprimento real de cada uma) — base da onda de luz das conexões: ela sai do Núcleo e
// avança pela árvore inteira na mesma velocidade, chegando em cada habilidade na hora certa pra
// seguir pelas conexões seguintes. Nada a ver com desbloqueio/pontos, mas segue estritamente a
// topologia ATIVADA (n.enabled, mesmo critério do "on" em drawEdge): uma conexão desativada não
// entra no grafo de busca, mesmo sendo geometricamente mais curta. Sem essa exclusão, um atalho
// desativado (ex.: um "loop" entre duas trilhas) virava sempre o caminho mais rápido pro Dijkstra,
// e a onda cortava caminho por ele em vez de seguir a única trilha de fato ativada até o fim —
// terminava "chegando antes" nas esferas do topo por uma via que sequer estava ligada de verdade.
// Recalculada quando a topologia muda (render()) e ao soltar uma habilidade arrastada (posição
// muda os comprimentos) — nunca por quadro.
let nodeDist = new Map(), maxNodeDist = 0;
function computeNodeDists() {
  nodeDist = new Map(); maxNodeDist = 0;
  if (!coreNode) return;
  const adj = new Map();
  const link = (from, to, w) => { if (!adj.has(from)) adj.set(from, []); adj.get(from).push([to, w]); };
  // ligação desenhada por barramento: a onda percorre o desenho (desce pela ligação, anda pela barra,
  // desce pela outra ligação), então a distância é o comprimento desse caminho e não a reta entre as
  // esferas — é isso que faz a onda sair do barramento no instante certo e seguir para o nível seguinte
  const busW = new Map();
  for (const g of busGroups) {
    const geo = busGeometry(g); if (!geo) continue;
    const info = new Map(busMetrics(geo).stubs.map((si) => [si.st.id, si]));
    for (const e of busLinks(g)) { const a = info.get(e.a), b = info.get(e.b); if (a && b) busW.set(e, a.L + Math.abs(a.x - b.x) + b.L); }
  }
  for (const e of edges) {
    const A = nodeById.get(e.a), B = nodeById.get(e.b); if (!A || !B) continue;
    if (A.enabled === false || B.enabled === false) continue; // desativada: fora do caminho da onda
    const w = busW.get(e) ?? Math.hypot(A.x - B.x, A.y - B.y);
    link(A.id, B.id, w); link(B.id, A.id, w);
  }
  nodeDist.set(coreNode.id, 0);
  const done = new Set();
  for (;;) { // O(V²) simples — roda só em mudança de topologia/posição, nunca por quadro
    let cur = null, best = Infinity;
    for (const [id, d] of nodeDist) if (!done.has(id) && d < best) { best = d; cur = id; }
    if (cur == null) break;
    done.add(cur);
    for (const [nb, w] of adj.get(cur) || []) if (!nodeDist.has(nb) || best + w < nodeDist.get(nb)) nodeDist.set(nb, best + w);
  }
  for (const d of nodeDist.values()) if (d > maxNodeDist) maxNodeDist = d;
}
// chamado sempre que nodes/edges são substituídos ou ganham/perdem itens (criar/excluir/duplicar
// esfera ou conexão, carregar a árvore) — recalcula os índices e o Núcleo. NÃO desenha nada: o
// desenho em si roda todo quadro dentro de tick()/drawWorld(), então qualquer mudança de dados
// (posição, cor, nome, seleção...) aparece sozinha no próximo quadro sem precisar chamar nada aqui.
function render() {
  busDirty = true;
  coreNode = nodes.find((n) => n.kind === 'core') || null;
  rebuildIndexes();
  computeBranches();
  computeBusGroups(); busDirty = false; // antes das distâncias: a onda mede o caminho pelos barramentos
  computeNodeDists();
  refreshCount();
  buildRings(); // o alcance dos anéis decorativos depende de onde as esferas estão — ver ringExtent()
}

/* ---------- sprites (cache por cor/raio) ----------
   Recalcular um gradiente radial por esfera a CADA QUADRO reintroduziria custo por esfera — o
   oposto do motivo de ter trocado pra canvas. Em vez disso, cada combinação (cor, raio) do halo e
   cada raio do corpo são desenhados UMA vez num canvas fora de tela, cacheados, e reaproveitados
   via drawImage (barato) por todas as esferas que compartilham a combinação — normalmente só um
   punhado de combinações distintas numa árvore inteira. */
let spriteCache = new Map();
function glowSpriteFor(colorHex, r) {
  const key = 'glow|' + colorHex + '|' + r;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  const d = Math.max(2, Math.ceil(r * 2 * DPR));
  cv = document.createElement('canvas'); cv.width = cv.height = d;
  const g = cv.getContext('2d'), [cr, cgg, cb] = hexToRgb(colorHex);
  const grad = g.createRadialGradient(d/2, d/2, 0, d/2, d/2, d/2);
  grad.addColorStop(0, `rgba(${cr},${cgg},${cb},1)`);
  grad.addColorStop(.55, `rgba(${cr},${cgg},${cb},.45)`);
  grad.addColorStop(1, `rgba(${cr},${cgg},${cb},0)`);
  g.fillStyle = grad; g.fillRect(0, 0, d, d);
  spriteCache.set(key, cv);
  return cv;
}
function bodySpriteFor(shape, r) {
  const key = 'body|' + shape + '|' + r;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  const d = Math.max(2, Math.ceil(r * 2 * DPR));
  cv = document.createElement('canvas'); cv.width = cv.height = d;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(d*.42, d*.36, 0, d*.5, d*.5, d*.64);
  grad.addColorStop(0, '#15131f'); grad.addColorStop(.55, '#0b0914'); grad.addColorStop(1, '#050308');
  g.fillStyle = grad;
  g.save(); g.translate(d/2, d/2); traceShapePath(g, shape, d/2); g.fill(); g.restore();
  spriteCache.set(key, cv);
  return cv;
}
// sprite de texto do selo de custo — pré-desenhado numa resolução acima do normal (cobre o zoom
// máximo de 2.6x do próprio editor, ver zoomAt) pra não ficar borrado quando o jogador dá zoom in;
// zoomado pra fora (o caso que ficava lento) ele só encolhe, sem nunca precisar redesenhar o texto.
const COST_SPRITE_OVERSAMPLE = 2.6;
let costSpriteCache = new Map();
function costBadgeSpriteFor(text, color) {
  const key = text + '|' + color;
  let cv = costSpriteCache.get(key);
  if (cv) return cv;
  const scale = DPR * COST_SPRITE_OVERSAMPLE, fontPx = 11 * scale, pad = 4 * scale;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `700 ${fontPx}px ${cssVar('--mono', 'monospace')}`;
  const w = Math.ceil(probe.measureText(text).width) + pad * 2, h = Math.ceil(fontPx * 1.7);
  cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.font = `700 ${fontPx}px ${cssVar('--mono', 'monospace')}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 3 * scale; g.strokeStyle = '#080615'; g.globalAlpha = .95;
  g.strokeText(text, w / 2, h / 2);
  g.fillStyle = color; g.globalAlpha = 1;
  g.fillText(text, w / 2, h / 2);
  costSpriteCache.set(key, cv);
  return cv;
}
// variáveis CSS (cor do tema) resolvidas de verdade — canvas não entende var(--x), precisa do
// valor final. Cacheado e invalidado só quando o tema muda (ver doToggleTheme).
let cssVarCache = new Map();
// o palco da árvore é sempre escuro (docs/MELHORIAS-v1.4.md P0-3), então as CORES desenhadas no canvas
// vêm sempre do tema escuro — no tema claro o --ink virava marrom-escuro e os rótulos sumiam no fundo.
// Fontes e o resto continuam lidos do CSS; no tema escuro isso dá exatamente os mesmos valores de antes.
const CANVAS_DARK = { '--ink': '#ede4d3', '--brass': '#c9a45c', '--maq': '#e0bd7a' };
function cssVar(name, fallback) {
  if (cssVarCache.has(name)) return cssVarCache.get(name);
  const v = (document.documentElement.dataset.theme === 'light' && CANVAS_DARK[name]) ||
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  cssVarCache.set(name, v);
  return v;
}

/* ---------- desenho ---------- */
let hoveredNode = null; // esfera sob o cursor (mostra nome + custo, com fade — ver LABEL_FADE_MS)
const LABEL_FADE_MS = 160; // duração do cross-fade do nome/custo ao entrar/sair do hover
// onda de luz: UMA frente pra árvore inteira (em unidades de mundo a partir do Núcleo), então
// todas as conexões ficam sincronizadas — sai do Núcleo, percorre cada camada, e só depois que a
// cauda passa da habilidade mais distante espera um instante e recomeça do Núcleo. Velocidade
// mínima fixa (calma); em árvore muito grande acelera só o suficiente pro ciclo não passar de
// WAVE_MAX_CYCLE_S. null = sem onda (movimento reduzido no sistema, ou árvore sem Núcleo).
const WAVE_SPEED = 45, WAVE_MAX_CYCLE_S = 18, WAVE_PAUSE_S = 1.4, WAVE_TAIL = 110, WAVE_HEAD = 22;
let waveFront = null;
function updateWaveFront(now) {
  if (REDUCED || !coreNode || maxNodeDist <= 0) { waveFront = null; return; }
  const travel = maxNodeDist + WAVE_TAIL;
  const speed = Math.max(WAVE_SPEED, travel / WAVE_MAX_CYCLE_S);
  waveFront = ((now / 1000) % (travel / speed + WAVE_PAUSE_S)) * speed; // na pausa passa de travel: nada acende
}
function drawWorld(now) {
  updateWaveFront(now);
  const ctx = sctx;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.s, view.s);
  const visible = computeVisibleIds();
  if (busDirty) { computeBusGroups(); busDirty = false; computeNodeDists(); }
  for (const e of edges) {
    if (busEdges.has(e)) continue; // desenhada pelo barramento, logo abaixo
    const A = nodeById.get(e.a), B = nodeById.get(e.b);
    if (!A || !B) continue;
    // corta a conexão se NENHUMA das duas pontas está visível — mesma lógica de antes, só que
    // recalculada todo quadro em vez de só no fim do gesto (agora é barato o bastante pra isso)
    if (!visible.has(e.a) && !visible.has(e.b)) continue;
    drawEdge(ctx, A, B, e, now);
  }
  for (const g of busGroups) drawBus(ctx, g, visible);
  for (const n of nodes) {
    if (!visible.has(n.id)) continue;
    drawNode(ctx, n, now);
  }
  drawBusSelection(ctx);
  ctx.restore();
}
// brilho das conexões: sprite com gradiente CONTÍNUO (mesma ideia do halo das esferas, ver
// glowSpriteFor) esticado ao longo da linha via drawImage. Antes eram traços sólidos empilhados
// (largo+fraco → fino+forte, evitando shadowBlur — ver histórico abaixo) e cada um tinha borda
// dura; sobrepostos, isso lia como "degraus" de brilho crescendo em vez de uma dissipação suave
// como a das esferas. Um gradiente pré-desenhado (sem bordas nenhuma, só interpolação) elimina os
// degraus de vez, e ainda sai mais barato: 1 drawImage por conexão em vez de 4 strokes.
// (shadowBlur continua fora de cogitação: nasce da cobertura do traço — numa linha fina o borrão
// espalha essa pouca cobertura por dezenas de pixels e quase não aparece — além de ignorar
// zoom/DPR e ser a operação mais cara por chamada.)
const EDGE_GLOW_THICKNESS = 24; // grossura do brilho base, em unidades de mundo
const EDGE_GLOW_ALPHA = .55;
const EDGE_STRIP_OVERSAMPLE = 2; // nitidez no zoom máximo do editor (~2.6x, ver zoomAt)
// perfil transversal suave (uma "tent" arredondada) compartilhado pelo brilho base e pela onda —
// mesmos cortes de alpha do halo radial das esferas, só que num gradiente linear (grossura da
// linha) em vez de radial (raio da esfera)
function paintCrossProfile(g, w, h, r, gg, b) {
  const grad = g.createLinearGradient(0, 0, 0, h);
  const stop = (t, a) => grad.addColorStop(t, `rgba(${r},${gg},${b},${a})`);
  stop(0, 0); stop(.15, .05); stop(.35, .5); stop(.5, 1); stop(.65, .5); stop(.85, .05); stop(1, 0);
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
}
function edgeGlowStripFor(colorHex) {
  const key = 'estrip|' + colorHex;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  const [cr, cg, cb] = hexToRgb(colorHex);
  const h = Math.max(2, Math.ceil(EDGE_GLOW_THICKNESS * DPR * EDGE_STRIP_OVERSAMPLE));
  cv = document.createElement('canvas'); cv.width = 2; cv.height = h;
  paintCrossProfile(cv.getContext('2d'), 2, h, cr, cg, cb);
  spriteCache.set(key, cv);
  return cv;
}
// faixa de luz da onda: sprite 2D em vez de um gradiente por quadro (createLinearGradient custava
// uma alocação por conexão por frame). O perfil transversal acima é multiplicado
// (globalCompositeOperation destination-in) pelo perfil longitudinal — cauda comprida some pra
// trás, cabeça suave na frente — então o resultado já sai pronto e cacheado; desenhar por quadro
// vira só um drawImage esticado na posição certa.
const WAVE_STRIP_THICKNESS = 30;
function waveStripFor(colorHex) {
  const key = 'wstrip|' + colorHex;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  const [cr, cg, cb] = hexToRgb(colorHex);
  const hr = Math.round(cr + (255 - cr) * .55), hg = Math.round(cg + (255 - cg) * .55), hb = Math.round(cb + (255 - cb) * .55);
  const totalLen = WAVE_TAIL + WAVE_HEAD;
  const w = Math.max(2, Math.ceil(totalLen * EDGE_STRIP_OVERSAMPLE)), h = Math.max(2, Math.ceil(WAVE_STRIP_THICKNESS * EDGE_STRIP_OVERSAMPLE));
  cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  paintCrossProfile(g, w, h, hr, hg, hb);
  g.globalCompositeOperation = 'destination-in'; // multiplica o alpha já pintado pelo perfil ao longo da linha, sem mexer na cor
  const along = g.createLinearGradient(0, 0, w, 0);
  along.addColorStop(0, 'rgba(0,0,0,0)');
  along.addColorStop(.5, 'rgba(0,0,0,.3)');
  along.addColorStop(WAVE_TAIL / totalLen, 'rgba(0,0,0,1)');
  along.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = along; g.fillRect(0, 0, w, h);
  spriteCache.set(key, cv);
  return cv;
}
function drawEdge(ctx, A, B, e) {
  const on = A.enabled !== false && B.enabled !== false;
  const [er, eg, eb] = hexToRgb(edgeColor);
  ctx.save();
  ctx.lineCap = 'round';
  const line = (w, style) => { ctx.strokeStyle = style; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); };
  if (e === selectedEdge) {
    // só uma conexão selecionada por vez, então o shadowBlur aqui não pesa (em px de tela: × DPR)
    ctx.shadowColor = cssVar('--brass', '#18b5c6'); ctx.shadowBlur = 12 * DPR;
    line(3, cssVar('--brass', '#18b5c6'));
    ctx.restore(); return;
  }
  if (!on) { line(1.4, `rgba(${er},${eg},${eb},.3)`); ctx.restore(); return; }
  // brilho base suave — sprite esticado ao longo da linha (ver comentário acima); movimento fica só
  // por conta da onda, pra não competir com ela
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(A.x, A.y); ctx.rotate(angle);
  ctx.globalAlpha = EDGE_GLOW_ALPHA;
  ctx.drawImage(edgeGlowStripFor(edgeColor), 0, -EDGE_GLOW_THICKNESS / 2, len, EDGE_GLOW_THICKNESS);
  ctx.globalAlpha = 1;
  ctx.restore();
  line(1.8, `rgba(${er},${eg},${eb},.8)`); // núcleo sólido nítido da linha
  drawWaveOnEdge(ctx, A, B, len, angle);
  ctx.restore();
}
// trecho da onda de luz que está passando por esta conexão agora (se estiver): recorte do sprite
// pré-computado acima (ver waveStripFor) na posição certa ao longo da linha, sempre do lado mais
// perto do Núcleo pro mais longe. O trecho vai de centro a centro — dentro das esferas fica
// escondido pelo corpo delas, o que lê como a luz "entrando" na habilidade e saindo pela conexão
// seguinte no instante certo (a distância de cada uma já inclui esse trecho).
function drawWaveOnEdge(ctx, A, B, len, angle) {
  if (waveFront == null) return;
  const dA = nodeDist.get(A.id), dB = nodeDist.get(B.id);
  if (dA == null || dB == null) return;
  const flip = dA > dB; // true: B é o lado mais perto do Núcleo, a onda anda de B pra A
  const p = waveFront - (flip ? dB : dA); // posição da frente da onda ao longo desta conexão
  if (p + WAVE_HEAD <= 0 || p - WAVE_TAIL >= len) return;
  ctx.save();
  ctx.translate(flip ? B.x : A.x, flip ? B.y : A.y);
  ctx.rotate(flip ? angle + Math.PI : angle);
  // recorta pro trecho real da conexão — a faixa nasce/morre nas pontas, não vaza pra fora dela
  ctx.beginPath(); ctx.rect(0, -WAVE_STRIP_THICKNESS, len, WAVE_STRIP_THICKNESS * 2); ctx.clip();
  ctx.drawImage(waveStripFor(edgeColor), p - WAVE_TAIL, -WAVE_STRIP_THICKNESS / 2, WAVE_TAIL + WAVE_HEAD, WAVE_STRIP_THICKNESS);
  ctx.restore();
}
function drawNode(ctx, n, now) {
  const r = nodeRadius(n);
  const color = n.color || viaByKey(n.fac).color;
  const disabled = n.enabled === false;
  const acquired = !isGM && isNodeUnlocked(n);
  const isSelected = n === selected;
  const isMultisel = areaSelection.has(n.id);
  ctx.save();
  ctx.translate(n.x, n.y);
  // desativada NÃO apaga a cor — só apaga bem forte. Antes o halo/textura/aro coloridos eram
  // pulados de propósito quando desativada, e sobrava só o corpo escuro + um fio quase invisível
  // (.25 de alpha) — na prática lia como "preto sem efeito nenhum". fadeMul multiplica em cima do
  // alpha normal de cada elemento colorido, deixando tudo bem apagado (quase cinza) mas ainda dá
  // pra reconhecer a cor original de cada via/habilidade.
  const lockedSib = lockedBy(n), lvlBlocked = levelBlocked(n);
  const fadeMul = disabled ? 0.2 : lockedSib ? 0.3 : lvlBlocked ? 0.45 : 1;
  // halo — ver comentário nos sprites; substitui filter:drop-shadow (caro por elemento em SVG)
  const glowR = r * 2.4, sprite = glowSpriteFor(color, glowR);
  ctx.globalAlpha = (acquired ? .9 : .6) * fadeMul;
  ctx.drawImage(sprite, -glowR, -glowR, glowR * 2, glowR * 2);
  ctx.globalAlpha = 1;
  // corpo (gradiente escuro, sprite cacheado por forma+raio) + aro finíssimo translúcido na cor da via
  const shape = n.shape || 'circle';
  ctx.drawImage(bodySpriteFor(shape, r), -r, -r, r * 2, r * 2);
  const [cr, cg, cb] = hexToRgb(color);
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},.25)`; ctx.lineWidth = .6;
  traceShapePath(ctx, shape, r); ctx.stroke();
  // textura de pontos giratória (sólido 3D cacheado por forma+cor, ver dotSpriteFor) — recortada
  // na forma da esfera por segurança (o modelo 3D de cada forma já projeta dentro da silhueta na
  // maioria dos ângulos, mas o recorte evita qualquer vazamento nos cantos em rotações extremas)
  ctx.save();
  traceShapePath(ctx, shape, r); ctx.clip();
  ctx.globalAlpha = fadeMul;
  ctx.drawImage(dotSpriteFor(shape, color), -r, -r, r * 2, r * 2);
  ctx.globalAlpha = 1;
  ctx.restore();
  // aro de destaque (rim) — dourado grosso se o JOGADOR já desbloqueou de verdade, senão a cor da via
  ctx.strokeStyle = acquired ? cssVar('--brass', '#18b5c6') : color;
  ctx.lineWidth = acquired ? 3 : 1.8;
  ctx.globalAlpha = .9 * fadeMul;
  if (n === linkSrc) ctx.setLineDash([2, 4]);
  traceShapePath(ctx, shape, r); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  // travada (outra esfera deste nível já foi escolhida nesta via): risco diagonal por cima
  if (lockedSib) {
    ctx.strokeStyle = cssVar('--ink-faint', '#8d8b85'); ctx.lineWidth = 1.6; ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.moveTo(-r * .8, r * .8); ctx.lineTo(r * .8, -r * .8); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // flash de desbloqueio — anel branco que expande e some (disparado em doUnlock)
  if (n._flashStart != null) {
    const p = (now - n._flashStart) / 700;
    if (p >= 1) n._flashStart = null;
    else {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.globalAlpha = .95 * (1 - p);
      ctx.beginPath(); ctx.arc(0, 0, (r + 7) * (1 + p * 1.6), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // anel de seleção (pulsa) / multi-seleção (área) / foco de teclado
  if (isSelected) {
    let mulO = .7, mulR = 1;
    if (!REDUCED) {
      const phase = ((now / 1000) % 1.8) / 1.8 * Math.PI * 2;
      mulO = 0.2 + 0.5 * (0.5 + 0.5 * Math.cos(phase));
      mulR = 1 + 0.15 * (0.5 - 0.5 * Math.cos(phase));
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3; ctx.globalAlpha = .9 * mulO;
    ctx.beginPath(); ctx.arc(0, 0, (r + 9) * mulR, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (isMultisel) {
    ctx.strokeStyle = cssVar('--brass', '#18b5c6'); ctx.fillStyle = 'rgba(227,192,113,.1)';
    ctx.lineWidth = 1.6; ctx.globalAlpha = .95;
    ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (n === focusedNode() && document.activeElement === $('tree-focus-proxy')) {
    // anel de foco por teclado — só quando o proxy de acessibilidade tem o foco de verdade
    // (clique de mouse nunca foca o proxy, então isso nunca "pisca" por engano num clique)
    ctx.strokeStyle = cssVar('--maq', '#35c6d4'); ctx.lineWidth = 2.4; ctx.globalAlpha = .95;
    ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // nome + custo — só aparecem em hover/selecionado, com fade suave: sem isso os dois trocavam de
  // visível pra invisível "secos", no exato quadro em que o mouse entra/sai da esfera. Guarda o
  // instante da última mudança de estado por esfera (mesmo padrão do flash de desbloqueio acima) e
  // anima um cross-fade a partir dali — funciona igual entrando ou saindo do hover.
  const showLabel = isSelected || n === hoveredNode;
  if (n._labelOn == null) { n._labelOn = showLabel; n._labelSince = -1e9; }
  else if (n._labelOn !== showLabel) { n._labelOn = showLabel; n._labelSince = now; }
  const labelT = Math.min(1, (now - n._labelSince) / LABEL_FADE_MS);
  const labelAlpha = n._labelOn ? labelT : 1 - labelT;
  if (labelAlpha > .003) {
    // selo de custo — sprite cacheado (por texto+cor, igual glow/corpo/pontos: texto é caro de
    // rasterizar em canvas a cada quadro, muito mais que um drawImage) e, abaixo de um tamanho de
    // tela onde o texto seria ilegível de qualquer jeito, nem desenha (sprite ou não).
    if (!disabled && r * view.s > 5) {
      const label = lvlBlocked ? 'Nv ' + n.level : (n.cost || 0) + ' ✦';
      const sp = costBadgeSpriteFor(label, color);
      // o sprite é desenhado numa resolução MAIOR que o tamanho final (ver COST_SPRITE_OVERSAMPLE) só
      // pra ficar nítido no zoom — dividir por DPR sozinho esquecia de desfazer esse fator extra, e o
      // selo saía ~2.6x maior do que deveria (o bug do "número gigante" em cima da esfera).
      const w = sp.width / (DPR * COST_SPRITE_OVERSAMPLE), h = sp.height / (DPR * COST_SPRITE_OVERSAMPLE);
      ctx.globalAlpha = labelAlpha;
      ctx.drawImage(sp, -w / 2, -(r + 9) - h / 2, w, h);
      ctx.globalAlpha = 1;
    }
    // rótulo do nome
    ctx.font = `11px ${cssVar('--mono', 'monospace')}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = n.name || '(sem nome)';
    ctx.lineWidth = 4; ctx.strokeStyle = '#080615'; ctx.globalAlpha = .97 * labelAlpha;
    ctx.strokeText(label, 0, r + 16);
    ctx.fillStyle = cssVar('--ink', '#e9edf1'); ctx.globalAlpha = labelAlpha;
    ctx.fillText(label, 0, r + 16);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ---------- hit-test (clique) ----------
   Varredura linear — um clique é um evento só, até em milhares de esferas isso é sub-milissegundo;
   não compensa a complexidade de um índice espacial que precisaria ficar sincronizado a cada
   arrasto/criação/exclusão de esfera. */
function hitTestNodeAt(wx, wy) {
  for (let i = nodes.length - 1; i >= 0; i--) { // de trás pra frente: a última desenhada vence, igual antes
    const n = nodes[i], r = nodeRadius(n), dx = wx - n.x, dy = wy - n.y;
    if (dx * dx + dy * dy > r * r) continue; // fora do círculo delimitador — nenhuma forma passa daqui
    if (SHAPE_ANGLES[n.shape] && !pointInShape(n.shape, dx, dy, r)) continue; // dentro do círculo, mas fora do polígono (canto)
    return n;
  }
  return null;
}
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
// tolerância em unidades de MUNDO (não pixels de tela), pra continuar escalando com o zoom igual
// antes. Alargada de propósito em relação à linha fina de antes (só a linha nítida, 1.4 de
// espessura, recebia clique) — um alvo bem fino e fácil de errar; agora perto da largura do brilho.
const EDGE_HIT_TOLERANCE = 5;
function hitTestEdgeAt(wx, wy) {
  let best = null, bestD = EDGE_HIT_TOLERANCE;
  for (const e of edges) {
    if (busEdges.has(e)) continue;
    const A = nodeById.get(e.a), B = nodeById.get(e.b); if (!A || !B) continue;
    const d = distToSegment(wx, wy, A.x, A.y, B.x, B.y);
    if (d <= bestD) { bestD = d; best = e; }
  }
  return best;
}

// arrastar esfera (Mestre) — chamado pelo pointerdown de "stage" quando o hit-test acha uma esfera.
// Sem setAttribute/updateEdges nenhum: só muda n.x/n.y, o próximo quadro de drawWorld() já desenha
// a posição atual. Mantém o caso especial do Núcleo (a âncora dos anéis/grade decorativos).
// arrastar uma esfera que faz parte da seleção de área leva a seleção inteira junto (a esfera pega
// encaixa na grade e as outras andam o mesmo tanto); as barras do barramento desenhadas à mão cujas
// esferas estão todas na seleção vão junto também
function startNodeDrag(n, ev, onClick) {
  let moved = false; const sx = ev.clientX, sy = ev.clientY, ox = n.x, oy = n.y;
  const group = areaSelection.size > 1 && areaSelection.has(n.id) ? nodes.filter((x) => x !== n && x.kind !== 'core' && areaSelection.has(x.id)) : [];
  const orig = new Map(group.map((x) => [x, { x: x.x, y: x.y }]));
  const busKeys = group.length ? busGroups.filter((g) => [...g.parents, ...g.children].every((id) => areaSelection.has(id))).map((g) => g.key) : [];
  const busOrig = JSON.parse(JSON.stringify({ paths: Object.fromEntries(busKeys.filter((k) => busConfig.paths[k]).map((k) => [k, busConfig.paths[k]])),
    stubs: Object.fromEntries(busKeys.filter((k) => busConfig.stubs[k]).map((k) => [k, busConfig.stubs[k]])) }));
  const shift = ([x, y], dx, dy) => [x + dx, y + dy];
  try { stage.setPointerCapture(ev.pointerId); } catch (_) {}
  const mv = (e) => { const dx = (e.clientX-sx)/view.s, dy = (e.clientY-sy)/view.s;
    if (!moved && Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy) > 4) { moved = true; if (n.kind !== 'core') gridPolarEl.classList.add('show'); }
    if (!moved) return;
    const snapped = gridSnap(ox+dx, oy+dy, n.kind === 'core');
    n.x = snapped.x; n.y = snapped.y; if (n.kind === 'core') updateCoreAnchor();
    if (!group.length) return;
    const gx = n.x - ox, gy = n.y - oy;
    group.forEach((x) => { const o = orig.get(x); x.x = o.x + gx; x.y = o.y + gy; });
    for (const [k, path] of Object.entries(busOrig.paths)) busConfig.paths[k] = path.map((pt) => shift(pt, gx, gy));
    for (const [k, all] of Object.entries(busOrig.stubs)) {
      busConfig.stubs[k] = Object.fromEntries(Object.entries(all).map(([id, o]) => [id, {
        ...(o.at ? { at: Array.isArray(o.at) ? shift(o.at, gx, gy) : o.at } : {}), ...(o.via ? { via: o.via.map((pt) => shift(pt, gx, gy)) } : {}) }]));
    }
  };
  const up = () => { try { stage.releasePointerCapture(ev.pointerId); } catch(_){}
    stage.removeEventListener('pointermove', mv); stage.removeEventListener('pointerup', up);
    // só esconde a grade se a ferramenta "esfera" não estiver mais ativa — ela já é quem decide se
    // a grade fica visível (ver setTool). Escondendo sempre aqui, incondicionalmente, a grade sumia
    // depois de soltar uma esfera arrastada mesmo com a ferramenta "esfera" ainda ligada.
    if (tool !== 'add') gridPolarEl.classList.remove('show');
    if (moved) {
      Promise.all([n, ...group].map((x) => db.updateTreeNode(x.id, { x: x.x, y: x.y })))
        .then(() => { if (group.length) showMsg(`${group.length + 1} habilidades movidas.`, 'ok'); }).catch((e) => showMsg(e.message));
      if (Object.keys(busOrig.paths).length || Object.keys(busOrig.stubs).length) saveBusConfig();
      buildRings(); computeNodeDists();
    }
    else (onClick || selectNode)(n); };
  stage.addEventListener('pointermove', mv); stage.addEventListener('pointerup', up);
}
async function selectNode(n) {
  if (isGM && editorDirty && selected && selected.id !== n.id) {
    const ok = await confirmModal({ title: 'Descartar alterações', desc: `Você tem alterações não salvas em "${selected.name || 'esta habilidade'}". Trocar de habilidade mesmo assim?`, confirmLabel: 'Descartar' });
    if (!ok) return;
    discardEditorDraft();
  }
  deselectEdge();
  // uma seleção só por vez: clicar numa esfera troca a seleção de área por ela
  if (isGM && areaSelection.size) { areaSelection = new Set(); updateBatchPanel(); }
  if (selectedBusKey) deselectBus();
  selected = n;
  focusedNodeId = n.id; // clique de mouse também move o "foco lógico" de teclado (sem roubar o foco visual à toa)
  if (isGM) openEditor(n); else openViewer(n);
}
function snapshotNode(n) {
  return { name: n.name, kind: n.kind, size: n.size, shape: n.shape, color: n.color, enabled: n.enabled, fac: n.fac, cost: n.cost, descr: n.descr, level: n.level ?? null,
    modifiers: (n.modifiers || []).map((m) => ({ ...m })) };
}
function discardEditorDraft() {
  if (selected && editorSnapshot) { Object.assign(selected, editorSnapshot); render(); applyView(); }
  editorDirty = false;
}
function markEditorDirty() { editorDirty = true; const b = $('node-save-btn'); if (b) b.style.display = ''; }
function refreshEditorFields(n) {
  $('e-name').value = n.name || ''; $('e-desc').value = n.descr || '';
  // o Núcleo É a esfera inicial (só pode haver um por árvore, e ele já nasce automaticamente
  // desbloqueado — ver isNodeUnlocked) — sempre grátis, então trava o campo em 0 em vez de deixar
  // salvar um custo>0 que nunca seria realmente cobrado
  $('e-cost').value = n.kind === 'core' ? 0 : (n.cost || 0);
  $('e-cost').disabled = n.kind === 'core';
  $('e-cost').title = n.kind === 'core' ? 'O Núcleo é a habilidade inicial — sempre grátis' : '';
  $('e-level').value = n.kind === 'core' ? '' : (n.level ?? '');
  $('e-level').disabled = n.kind === 'core';
  document.querySelectorAll('#e-type .chip').forEach((c) => c.classList.toggle('on', c.dataset.v === n.kind));
  document.querySelectorAll('#e-size .chip').forEach((c) => c.classList.toggle('on', c.dataset.s === (n.size || 'small')));
  document.querySelectorAll('#e-shape .chip').forEach((c) => c.classList.toggle('on', c.dataset.sh === (n.shape || 'circle')));
  document.querySelectorAll('#e-enabled .chip').forEach((c) => c.classList.toggle('on', c.dataset.e === (n.enabled === false ? '0' : '1')));
  document.querySelectorAll('#e-fac .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === n.fac));
  // cor própria é opcional — o swatch sempre mostra a cor EFETIVA (própria ou herdada da via), mas
  // o botão de reset só aparece quando há uma cor própria de verdade pra "esquecer"
  $('e-color-swatch').style.setProperty('--sw', n.color || viaByKey(n.fac).color);
  $('e-color-reset').style.display = n.color ? '' : 'none';
  renderModRows(n);
}
// os 3 painéis laterais (#editor, #viewer, #batchpanel) ficam todos na mesma posição fixa — sem
// fechar os outros ao abrir um, dois (ou os três) apareciam empilhados por cima um do outro, e só
// dava pra ver o de baixo fechando o de cima manualmente. Cada função que abre um painel chama isso
// primeiro, garantindo que só um fica visível de cada vez.
function closeOtherPanels(keepId) {
  ['editor', 'viewer', 'batchpanel', 'buspanel'].forEach((id) => { if (id !== keepId) $(id)?.classList.remove('open'); });
}
function openEditor(n) {
  closeOtherPanels('editor');
  editorSnapshot = snapshotNode(n); editorDirty = false;
  const saveBtn = $('node-save-btn'); if (saveBtn) saveBtn.style.display = 'none';
  refreshEditorFields(n);
  $('editor').classList.add('open');
}
window.saveNodeEditor = () => {
  if (!isGM || !selected) return;
  const btn = $('node-save-btn'); if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  const patch = { name: selected.name, kind: selected.kind, size: selected.size, shape: selected.shape, color: selected.color, enabled: selected.enabled,
    fac: selected.fac, cost: selected.cost, descr: selected.descr, modifiers: selected.modifiers };
  if (hasLevelCol) patch.level = selected.kind === 'core' ? null : (selected.level ?? null);
  db.updateTreeNode(selected.id, patch).then(() => {
    editorSnapshot = snapshotNode(selected); editorDirty = false;
    if (btn) btn.style.display = 'none';
    showMsg('Habilidade salva.', 'ok');
  }).catch((e) => showMsg(e.message))
    .finally(() => { if (btn) { btn.classList.remove('loading'); btn.disabled = false; } });
};
/* ---------- modificadores de status da esfera (mira um atributo real do sistema) ---------- */
function renderModRows(n) {
  if (!stats.length) {
    $('e-mods').innerHTML = `<p style="font-family:var(--mono);font-size:10px;color:var(--ink-faint);line-height:1.6;margin:0">Este sistema ainda não tem atributos cadastrados (aba Geral do sistema) — cadastre um pra poder linkar um modificador aqui.</p>`;
    return;
  }
  const mods = n.modifiers || [];
  const rowStyle = 'flex:1;color:var(--ink);font-family:var(--mono);font-size:12px;padding:7px 9px';
  let html = mods.map((m, i) => `
    <div class="via-row">
      <select onchange="setNodeModStat(${i},this.value)" style="${rowStyle}">
        ${stats.map((s) => `<option value="${s.id}" ${s.id === m.stat_id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select>
      <input type="number" step="1" value="${m.amount ?? 0}" oninput="setNodeModAmount(${i},this.value)" style="width:64px;${rowStyle}flex:0 0 auto">
      <button type="button" class="via-del" onclick="removeNodeMod(${i})" title="Remover"><span class="ic">${ICONS.x}</span></button>
    </div>`).join('');
  html += `<button type="button" class="via-add-btn" style="width:100%;height:32px;" onclick="addNodeMod()">+ Adicionar modificador</button>`;
  $('e-mods').innerHTML = html;
}
window.addNodeMod = () => { if (!isGM || !selected || !stats.length) return;
  selected.modifiers = [...(selected.modifiers || []), { stat_id: stats[0].id, amount: 1 }];
  renderModRows(selected); markEditorDirty(); };
window.removeNodeMod = (i) => { if (!isGM || !selected) return;
  selected.modifiers = (selected.modifiers || []).filter((_, idx) => idx !== i);
  renderModRows(selected); markEditorDirty(); };
window.setNodeModStat = (i, statId) => { if (!isGM || !selected || !selected.modifiers[i]) return;
  selected.modifiers[i].stat_id = statId; markEditorDirty(); };
window.setNodeModAmount = (i, amount) => { if (!isGM || !selected || !selected.modifiers[i]) return;
  selected.modifiers[i].amount = Number(amount) || 0; markEditorDirty(); };
window.closePanel = async () => {
  if (editorDirty) {
    const ok = await confirmModal({ title: 'Descartar alterações', desc: 'As alterações não salvas nesta habilidade serão perdidas.', confirmLabel: 'Descartar' });
    if (!ok) return;
    discardEditorDraft();
  }
  $('editor').classList.remove('open'); selected = null;
};
// nome/custo/descrição vêm de oninput (dispara a cada tecla, não só ao concluir) — só nome e
// custo aparecem desenhados na esfera (rótulo/selo), e descrição não aparece na esfera nenhuma;
// então em vez de chamar render() (que apaga e recria TODAS as esferas/conexões do zero, incluindo
// os listeners de cada uma) a cada caractere digitado, atualiza só o texto no lugar. Com poucas
// esferas isso não se notava, mas o custo do render() cresce com o número de esferas — daí a
// digitação ficar visivelmente mais lenta quanto mais esferas a árvore tem. Só troca de "kind"/
// "size"/"enabled"/"via" (cliques em chip, não oninput) ainda passam por render() completo, já que
// mudam o visual da esfera inteira (cor/raio/classe) e só acontecem uma vez por clique, não a cada tecla.
window.patch = async (k, v) => {
  if (!isGM || !selected) return;
  busDirty = true;
  // só um Núcleo por árvore — os anéis/âncora da grade (polarSnap, updateCoreAnchor, buildRings)
  // sempre pegam o PRIMEIRO nó com kind:'core' que encontram; um segundo Núcleo simplesmente
  // ficava inerte, sem nenhum aviso de que aquele clique não fazia o que parecia fazer
  if (k === 'kind' && v === 'core') {
    const other = nodes.find((x) => x !== selected && x.kind === 'core');
    if (other) {
      const ok = await confirmModal({ title: 'Já existe um Núcleo', desc: `"${other.name || 'outra habilidade'}" já é o Núcleo desta árvore — só uma pode ser. Trocar o Núcleo pra esta habilidade?`, confirmLabel: 'Trocar', danger: false });
      if (!ok) { refreshEditorFields(selected); return; }
      other.kind = 'active';
      db.updateTreeNode(other.id, { kind: 'active' }).catch((e) => showMsg(e.message));
    }
    selected.kind = v;
    // troca de Núcleo grava na hora, ao contrário dos outros campos (que só viram rascunho até
    // clicar "Salvar"): a outra esfera já foi rebaixada de verdade no banco acima — se essa
    // promoção ficasse pendente e o Mestre saísse sem salvar, a árvore ficaria sem NENHUM Núcleo
    // até alguém notar e corrigir na mão.
    db.updateTreeNode(selected.id, { kind: 'core' }).catch((e) => showMsg(e.message));
    render(); applyView();
    refreshEditorFields(selected);
    return;
  }
  // deixando de ser Núcleo (sem virar outra coisa "core" no processo) — a âncora dos anéis/grade
  // precisa migrar pro que sobrar; esse caminho já não tem o risco de "ficar sem Núcleo nenhum"
  // acima (a árvore simplesmente perde a âncora até alguém marcar outra esfera como Núcleo), então
  // continua no fluxo normal de rascunho+Salvar como qualquer outro campo.
  const coreChanged = k === 'kind' && selected.kind === 'core' && v !== 'core';
  selected[k] = v;
  // canvas lê nome/custo/tamanho/estado/via/tipo direto de "selected" em todo quadro — nenhum campo
  // precisa de atualização manual aqui além dos dois casos especiais abaixo. Núcleo mexe com a
  // âncora dos anéis/grade pra TODA a árvore; "enabled" precisa recalcular o caminho da onda de luz
  // (computeNodeDists ignora conexões desativadas — ver comentário lá), já que esse cálculo é
  // cacheado e não roda todo quadro como o resto do desenho.
  if (coreChanged) { render(); applyView(); }
  else if (k === 'enabled') computeNodeDists();
  refreshEditorFields(selected); markEditorDirty();
};
// cor própria da habilidade, independente da via — ver drawNode (color = n.color || via.color)
window.openNodeColorPicker = (btn) => {
  if (!isGM || !selected) return;
  const current = selected.color || viaByKey(selected.fac).color;
  openColorPicker(btn, current, (hex) => patch('color', hex));
};
window.resetNodeColor = () => patch('color', null);
/* ---------- visão somente-leitura pro jogador — mesmos dados, sem nenhum campo editável ---------- */
// o Núcleo É a esfera inicial — só pode haver um por árvore (ver patch()) e ele nasce
// automaticamente desbloqueado, sem precisar de nenhuma marcação separada.
function isNodeUnlocked(n) { return n.kind === 'core' || unlockedIds.has(n.id); }
// "uma escolha por nível": a via tem trava e o jogador já tem outra esfera desta via neste nível
function lockedBy(n) {
  if (isGM || n.level == null || n.kind === 'core' || isNodeUnlocked(n)) return null;
  if (!viaByKey(n.fac)?.lock) return null;
  return nodes.find((x) => x !== n && x.kind !== 'core' && x.fac === n.fac && x.level === n.level && sameBranch(x, n) && unlockedIds.has(x.id)) || null;
}
// "exigir nível do personagem": a esfera de nível N só abre com o personagem no nível N
function levelBlocked(n) {
  return !isGM && requireCharLevel && n.level != null && charLevel != null && !isNodeUnlocked(n) && charLevel < n.level;
}
// usado no aria-label do proxy de foco de teclado (ver seção "teclado (canvas)") — inclui tipo e
// (pro jogador) custo/estado de desbloqueio, não só o nome: quem navega só por teclado não tem
// como "ver" a cor do aro ou o selo de custo desenhado na esfera, então precisa ouvir essa
// informação de algum jeito
function nodeAriaLabel(n) {
  const kindLabel = n.kind === 'core' ? 'Núcleo' : n.kind === 'active' ? 'habilidade ativa' : 'habilidade passiva';
  let label = (n.name || 'Habilidade sem nome') + ', ' + kindLabel;
  if (n.enabled === false) label += ', desativada';
  if (n.level != null) label += ', nível ' + n.level;
  if (!isGM) label += isNodeUnlocked(n) ? ', desbloqueada'
    : lockedBy(n) ? ', travada: outra habilidade deste nível já foi escolhida'
    : levelBlocked(n) ? `, exige o nível ${n.level} do personagem`
    : `, bloqueada, custa ${n.cost || 0} ponto${n.cost === 1 ? '' : 's'}`;
  return label;
}
function canUnlock(n) {
  if (isNodeUnlocked(n)) return { ok: false, reason: 'already' };
  const by = lockedBy(n); if (by) return { ok: false, reason: 'locked', by };
  if (levelBlocked(n)) return { ok: false, reason: 'level' };
  const connected = edges.some((e) => (e.a === n.id || e.b === n.id) && isNodeUnlocked(byId(e.a === n.id ? e.b : e.a) || {}));
  if (!connected) return { ok: false, reason: 'connectivity' };
  // o Núcleo é sempre grátis — não entra na conta de pontos gastos, mesmo que tenha um custo>0
  // salvo de antes da trava do campo (árvores mais antigas)
  const spent = nodes.filter((x) => isNodeUnlocked(x) && x.kind !== 'core').reduce((s, x) => s + (x.cost || 0), 0);
  const remaining = myPoints - spent;
  if (remaining < (n.cost || 0)) return { ok: false, reason: 'points', remaining };
  return { ok: true };
}
function openViewer(n) {
  closeOtherPanels('viewer');
  $('v-name').textContent = n.name || '(sem nome)';
  $('v-type').textContent = (n.kind === 'core' ? 'Núcleo' : n.kind === 'active' ? 'Ativa' : 'Passiva') + (n.level != null ? ' · Nível ' + n.level : '');
  const via = viaByKey(n.fac);
  $('v-via').innerHTML = `<div class="chip on" data-f="${esc(via.key)}" style="--vc:${via.color};flex:0 0 auto;cursor:default">${esc(via.name)}</div>`;
  $('v-cost').innerHTML = `<span class="ic">${ICONS.sparkle}</span>${n.cost || 0}`;
  $('v-desc').textContent = n.descr || 'Sem descrição.';
  const mods = n.modifiers || [];
  if (mods.length) {
    $('v-mods-fld').style.display = '';
    $('v-mods').innerHTML = mods.map((m) => { const s = statById(m.stat_id);
      return `<div style="font-family:var(--mono);font-size:12px;color:var(--brass)">${s ? esc(s.name) : '(atributo removido)'}: ${m.amount >= 0 ? '+' : ''}${m.amount}</div>`; }).join('');
  } else { $('v-mods-fld').style.display = 'none'; }
  if (isGM) { $('v-unlock-fld').style.display = 'none'; }
  else {
    $('v-unlock-fld').style.display = '';
    const btn = $('v-unlock-btn'), msg = $('v-unlock-msg');
    if (isNodeUnlocked(n)) {
      btn.style.display = 'none';
      msg.innerHTML = `<span class="ic">${ICONS.check}</span>Já desbloqueada.`;
    } else {
      btn.style.display = '';
      const check = canUnlock(n);
      btn.disabled = !check.ok;
      btn.textContent = `Desbloquear (custo: ${n.cost || 0} ponto${n.cost === 1 ? '' : 's'})`;
      msg.textContent = check.ok ? ''
        : check.reason === 'locked' ? `Você já escolheu "${check.by.name || 'outra habilidade'}" neste nível. Só dá para escolher uma por nível ${branchCount > 1 ? 'neste ramo' : 'nesta via'}.`
        : check.reason === 'level' ? `Exige o nível ${n.level}. Seu personagem está no nível ${charLevel}.`
        : check.reason === 'connectivity' ? 'Conecte a uma habilidade já desbloqueada primeiro.'
        : `Pontos insuficientes (você tem ${Math.max(0, check.remaining)} disponível).`;
    }
  }
  $('viewer').classList.add('open');
}
window.closeViewer = () => { $('viewer').classList.remove('open'); selected = null; };
window.doUnlock = async () => {
  if (isGM || !selected) return;
  const n = selected, btn = $('v-unlock-btn');
  btn.disabled = true;
  try {
    await db.unlockNode(n.id);
    unlockedIds.add(n.id);
    try { myPoints = await db.getMyProgress(treeId); } catch (_) {}
    render(); openViewer(n);
    // flash de desbloqueio: um anel branco que expande e some (ver o bloco "_flashStart" em
    // drawNode) — dá o "momento de recompensa" ao desbloquear
    n._flashStart = performance.now();
    showMsg('Habilidade desbloqueada!');
  } catch (e) { showMsg(e.message); btn.disabled = false; }
};
window.deleteSelected = async () => {
  if (!isGM || !selected) return;
  const n = selected;
  // apagar em lote (deleteAreaSelection) já pede confirmação — apagar uma esfera avulsa não pedia,
  // então quem aprendeu "excluir em lote confirma" era pego de surpresa nessa aqui
  const desc = n.kind === 'core'
    ? 'Esta é o Núcleo da árvore — apagar remove o encaixe de grade e a âncora dos anéis até outra habilidade virar Núcleo. Não dá pra desfazer.'
    : 'Não dá pra desfazer.';
  const ok = await confirmModal({ title: 'Excluir habilidade', desc, confirmLabel: 'Excluir' });
  if (!ok) return;
  db.deleteTreeNode(n.id).then(() => { edges = edges.filter((x) => x.a !== n.id && x.b !== n.id); nodes = nodes.filter((x) => x !== n);
    selected = null; editorDirty = false; closePanel(); render(); applyView(); }).catch((e) => showMsg(e.message)); };

// esfera de origem da ligação: o anel tracejado dela é desenhado direto em drawNode (checa
// `n === linkSrc`) — não precisa de classe de DOM nenhuma pra "marcar" visualmente
function handleLink(n) {
  if (!linkSrc) { linkSrc = n; return; }
  if (linkSrc !== n) {
    const ex = edges.some((x) => (x.a === linkSrc.id && x.b === n.id) || (x.a === n.id && x.b === linkSrc.id));
    // antes, clicar num par já ligado não fazia NADA visível — dava pra achar que o clique
    // simplesmente não funcionou, em vez de saber que a conexão já existia
    if (ex) showMsg('Essas habilidades já estão conectadas.');
    else db.insertTreeEdge(treeId, linkSrc.id, n.id).then((e) => { if (e) { edges.push({ id: e.id, a: e.a, b: e.b }); render(); } }).catch((er) => showMsg(er.message));
  }
  linkSrc = null;
}
// selecionar uma conexão (só o Mestre, ferramenta Selecionar) — Delete apaga só ela, sem precisar
// excluir uma das duas esferas inteiras (o único jeito que existia antes)
function selectEdge(e) {
  if (!isGM || tool !== 'select') return;
  if (selected) { selected = null; closePanel(); }
  selectedEdge = e;
}
function deselectEdge() { selectedEdge = null; }
function deleteSelectedEdge() {
  const e = selectedEdge; if (!isGM || !e) return;
  db.deleteTreeEdge(e.id).then(() => { edges = edges.filter((x) => x !== e); selectedEdge = null; render(); }).catch((er) => showMsg(er.message));
}

/* ---------- pan / zoom / add / seleção por área ---------- */
// Não existe mais um "modo interagindo" que pausa animação durante pan/zoom/arrasto — isso era uma
// correção da época do SVG (repintar anéis/pulso competia de verdade com o tempo de quadro do
// gesto). Em canvas, culling roda todo quadro de qualquer jeito (ver computeVisibleIds em
// drawWorld) e girar a textura/pulsar uma conexão custa quase nada — deixar tudo sempre ligado,
// inclusive durante o gesto, não compete com mais nada.
let panning = false, pStart, vStart;
let areaDragging = false, areaScreenStart = null, areaMode = 'set';
// pinch-to-zoom: nenhum gesto de toque tinha suporte antes (só wheel do mouse e os botões +/− do
// HUD) — num tablet/celular, dar zoom exigia cutucar um botão pequeno repetidas vezes. Rastreado
// por pointerId (não só "o último pointermove") porque sem isso um segundo dedo tocando a tela
// durante um pan em andamento sobrescrevia pStart/vStart com as coordenadas do dedo novo, causando
// um salto visual perceptível na câmera.
let activePointers = new Map(); // pointerId -> {x,y}
let pinchLastDist = null;
function pointerDist() { const pts = [...activePointers.values()]; return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); }
function pointerMid() { const pts = [...activePointers.values()]; return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }; }
// hit-test de esfera/conexão primeiro (prioridade de pintura: esfera por cima, depois conexão),
// senão cai pra pan/marquee/colocar — mesma ordem de prioridade de quando cada esfera tinha seu
// próprio elemento de SVG com stopPropagation() (ver a nota histórica em startNodeDrag)
stage.addEventListener('pointerdown', async (ev) => {
  activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  // botão do meio (scroll) sempre move a câmera, não importa a ferramenta ativa — sem isso, navegar
  // enquanto a ferramenta "Habilidade"/"Área"/"Conectar" está ativa exigia trocar pra "Selecionar"
  // primeiro. preventDefault evita o autoscroll nativo do navegador (aquele ícone de "bolinha" que
  // aparece ao clicar o meio do mouse em várias páginas).
  if (ev.button === 1) {
    ev.preventDefault();
    panning = true; stage.classList.add('panning'); pStart = { x: ev.clientX, y: ev.clientY }; vStart = { x: view.x, y: view.y };
    return;
  }
  if (activePointers.size === 2 && tool === 'select') {
    panning = false; areaDragging = false; stage.classList.remove('panning');
    pinchLastDist = pointerDist();
    return;
  }
  if (activePointers.size > 1) return; // dedo extra durante outro gesto — ignora

  const p = toWorld(ev.clientX, ev.clientY);
  // barramento selecionado + Shift/Ctrl + clique numa habilidade: põe ou tira ela do barramento
  if (isGM && tool === 'select' && selectedBusKey && (ev.shiftKey || ev.ctrlKey || ev.metaKey)) {
    const hit = hitTestNodeAt(p.x, p.y), g = busGroupByKey(selectedBusKey);
    if (hit && g) { toggleBusMember(g, hit); return; }
  }
  // seleção múltipla: Shift ou Ctrl/Cmd + clique numa habilidade soma ou tira ela da seleção, com
  // Selecionar ou Área (a esfera que estava aberta sozinha entra junto na seleção)
  const multiKey = ev.shiftKey || ev.ctrlKey || ev.metaKey;
  if (isGM && multiKey && (tool === 'select' || tool === 'area')) {
    const hit = hitTestNodeAt(p.x, p.y);
    if (hit && hit.kind !== 'core') {
      const next = new Set(areaSelection);
      if (selected && selected.kind !== 'core') next.add(selected.id);
      if (areaSelection.has(hit.id)) next.delete(hit.id); else next.add(hit.id);
      setAreaSelection(next);
      return;
    }
  }
  // Área: apertar numa habilidade já selecionada arrasta a seleção toda; um clique sem arrastar
  // deixa só ela selecionada
  if (tool === 'area' && isGM && !multiKey) {
    const hit = hitTestNodeAt(p.x, p.y);
    if (hit && hit.kind !== 'core' && areaSelection.has(hit.id)) { startNodeDrag(hit, ev, (x) => setAreaSelection([x.id])); return; }
  }
  // barra do barramento selecionada: as alças têm prioridade sobre tudo (são pequenas e ficam por cima)
  if (tool === 'select' && isGM && selectedBusKey) {
    const h = busHandleAt(p.x, p.y);
    if (h) { startBusVertexDrag(h, ev); return; }
  }
  const hitNode = tool !== 'area' ? hitTestNodeAt(p.x, p.y) : null;
  if (hitNode && selectedBusKey) deselectBus();
  if (hitNode) {
    if (!isGM) { selectNode(hitNode); return; }
    if (tool === 'link') { handleLink(hitNode); return; }
    startNodeDrag(hitNode, ev);
    return;
  }
  if (tool === 'select' && isGM) {
    const hitBus = hitTestBusAt(p.x, p.y);
    if (hitBus) { selectBus(hitBus.g.key, hitBus.stub ? { t: 'at', id: hitBus.stub.id } : null); return; }
    const hitEdge = hitTestEdgeAt(p.x, p.y);
    if (hitEdge) { deselectBus(); selectEdge(hitEdge); return; }
    if (selectedBusKey) deselectBus();
  }
  if (tool === 'add' && isGM) {
    const snapped = gridSnap(p.x, p.y);
    const node = { name: '', kind: 'active', fac: vias[0].key, size: 'small', shape: 'circle', cost: 1, descr: '', x: snapped.x, y: snapped.y };
    try { const saved = await db.insertTreeNode(treeId, node); node.id = saved.id; nodes.push(node); render(); selectNode(node); } catch (e) { showMsg(e.message); }
    return; }
  if (tool === 'area') {
    // Shift/Ctrl soma a área à seleção, Alt tira; sem tecla, a área vira a seleção
    areaMode = ev.altKey ? 'sub' : multiKey ? 'add' : 'set';
    areaDragging = true; areaScreenStart = { x: ev.clientX, y: ev.clientY };
    Object.assign(marqueeEl.style, { left: ev.clientX + 'px', top: ev.clientY + 'px', width: '0px', height: '0px', display: 'block' });
    return; }
  panning = true; stage.classList.add('panning'); pStart = { x: ev.clientX, y: ev.clientY }; vStart = { x: view.x, y: view.y }; });
stage.addEventListener('pointermove', (ev) => {
  if (activePointers.has(ev.pointerId)) activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (activePointers.size === 2 && pinchLastDist != null) {
    const dist = pointerDist(), mid = pointerMid();
    if (dist > 0 && pinchLastDist > 0) { zoomAt(mid.x, mid.y, dist / pinchLastDist); }
    pinchLastDist = dist;
    return;
  }
  if (areaDragging) {
    const x1 = Math.min(areaScreenStart.x, ev.clientX), y1 = Math.min(areaScreenStart.y, ev.clientY);
    Object.assign(marqueeEl.style, { left: x1 + 'px', top: y1 + 'px',
      width: Math.abs(ev.clientX - areaScreenStart.x) + 'px', height: Math.abs(ev.clientY - areaScreenStart.y) + 'px' });
    return; }
  if (panning) { view.x = vStart.x+(ev.clientX-pStart.x); view.y = vStart.y+(ev.clientY-pStart.y); applyView(); return; }
  if (tool === 'add') { const p = toWorld(ev.clientX, ev.clientY); const s = gridSnap(p.x, p.y); showSnapMark(s.x, s.y); }
  // hover: mostra o rótulo do nome (drawNode) e o cursor de "pode clicar" — antes vinha de graça
  // via :hover do CSS, agora precisa ser calculado à mão (só custa algo por movimento real do
  // ponteiro, não por quadro)
  if (activePointers.size < 2) {
    const wp = toWorld(ev.clientX, ev.clientY);
    hoveredNode = hitTestNodeAt(wp.x, wp.y);
    stage.style.cursor = (tool === 'select' && isGM && selectedBusKey && !hoveredNode && busHandleAt(wp.x, wp.y)) ? 'move'
      : hoveredNode || (tool === 'select' && isGM && (hitTestBusAt(wp.x, wp.y) || hitTestEdgeAt(wp.x, wp.y))) ? 'pointer' : '';
  }
});
stage.addEventListener('pointerleave', () => { hoveredNode = null; stage.style.cursor = ''; });
function endPointer(ev) {
  activePointers.delete(ev.pointerId);
  if (activePointers.size < 2) pinchLastDist = null;
  // sobrou 1 dedo depois de um pinch — retoma o pan a partir da posição atual dele, sem salto
  if (activePointers.size === 1 && tool === 'select' && !panning) {
    const [[, p]] = activePointers;
    panning = true; stage.classList.add('panning');
    pStart = { x: p.x, y: p.y }; vStart = { x: view.x, y: view.y };
    return;
  }
  if (activePointers.size === 0) {
    panning = false; stage.classList.remove('panning');
    if (areaDragging) { areaDragging = false; marqueeEl.style.display = 'none';
      finalizeAreaSelection(toWorld(areaScreenStart.x, areaScreenStart.y), toWorld(ev.clientX, ev.clientY)); }
  }
}
addEventListener('pointerup', endPointer);
addEventListener('pointercancel', endPointer);
function finalizeAreaSelection(p1, p2) {
  const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x), y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
  // arrasto quase nulo = clique: numa habilidade, seleciona só ela; no vazio, limpa a seleção
  if (x2 - x1 < 4 / view.s && y2 - y1 < 4 / view.s) {
    if (areaMode !== 'set') return;
    const hit = hitTestNodeAt(p2.x, p2.y);
    setAreaSelection(hit && hit.kind !== 'core' ? [hit.id] : []);
    return;
  }
  const inside = nodes.filter((n) => n.kind !== 'core' && n.x >= x1 && n.x <= x2 && n.y >= y1 && n.y <= y2).map((n) => n.id);
  const next = areaMode === 'set' ? new Set(inside) : new Set(areaSelection);
  if (areaMode === 'add') inside.forEach((id) => next.add(id));
  if (areaMode === 'sub') inside.forEach((id) => next.delete(id));
  setAreaSelection(next);
}
// troca a seleção de área e fecha o que estiver selecionado sozinho (esfera, conexão, barra), para o
// painel e o desenho mostrarem sempre a mesma coisa: o que está selecionado agora
async function setAreaSelection(ids) {
  if (isGM && selected) {
    if (editorDirty) {
      const ok = await confirmModal({ title: 'Descartar alterações', desc: `Você tem alterações não salvas em "${selected.name || 'esta habilidade'}". Trocar a seleção mesmo assim?`, confirmLabel: 'Descartar' });
      if (!ok) return false;
      discardEditorDraft();
    }
    $('editor').classList.remove('open'); selected = null;
  }
  deselectEdge(); if (selectedBusKey) deselectBus();
  areaSelection = new Set(ids);
  updateBatchPanel();
  return true;
}
// o painel da seleção reflete a seleção atual: quantas, de que ramo e nível, e os valores que todas
// têm em comum (chip aceso só quando todas têm o mesmo valor; misturado = nenhum aceso)
function updateBatchPanel() {
  const sel = nodes.filter((x) => areaSelection.has(x.id));
  const n = sel.length;
  $('batch-count').textContent = n + (n === 1 ? ' habilidade selecionada' : ' habilidades selecionadas');
  const parts = [];
  if (branchCount > 1) {
    const rs = [...new Set(sel.map((x) => branchNo.get(branchOf.get(x.id))).filter(Boolean))].sort((a, b) => a - b);
    if (rs.length) parts.push(rs.length === 1 ? `Ramo ${rs[0]}` : `Ramos ${rs.join(', ')}`);
  }
  const lv = sel.map((x) => x.level).filter((v) => v != null);
  if (hasLevelCol && n) parts.push(!lv.length ? 'sem nível' : Math.min(...lv) === Math.max(...lv) ? `nível ${lv[0]}` : `níveis ${Math.min(...lv)} a ${Math.max(...lv)}`);
  $('batch-summary').textContent = parts.join(' · ');
  $('batch-summary').hidden = !parts.length;
  const common = (f) => { const vs = new Set(sel.map(f)); return vs.size === 1 ? [...vs][0] : undefined; };
  const mark = (q, attr, v) => document.querySelectorAll(q).forEach((c) => { const on = v !== undefined && c.dataset[attr] === String(v); c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  mark('#batch-fac .chip', 'f', common((x) => x.fac));
  mark('#batch-size .chip', 's', common((x) => x.size || 'small'));
  mark('#batch-shape .chip', 'sh', common((x) => x.shape || 'circle'));
  mark('#batch-enabled .chip', 'e', common((x) => (x.enabled === false ? '0' : '1')));
  const li = $('batch-level');
  if (li && document.activeElement !== li) { const cl = common((x) => x.level ?? null); li.value = cl ?? ''; li.placeholder = cl === undefined ? 'vários' : '—'; }
  if (n > 0) closeOtherPanels('batchpanel');
  batchPanelEl.classList.toggle('open', n > 0);
}
window.clearAreaSelection = () => { areaSelection = new Set(); batchPanelEl.classList.remove('open'); };
// amplia a seleção: o ramo inteiro de cada habilidade selecionada / o mesmo nível dentro desses ramos
window.selectWholeBranch = () => {
  const tags = new Set([...areaSelection].map((id) => branchOf.get(id)));
  setAreaSelection(nodes.filter((x) => x.kind !== 'core' && tags.has(branchOf.get(x.id))).map((x) => x.id));
};
window.selectSameLevel = () => {
  const sel = nodes.filter((x) => areaSelection.has(x.id));
  const keys = new Set(sel.filter((x) => x.level != null).map((x) => branchOf.get(x.id) + '|' + x.level));
  if (!keys.size) { showMsg('As habilidades selecionadas ainda não têm nível.'); return; }
  setAreaSelection(nodes.filter((x) => x.kind !== 'core' && (areaSelection.has(x.id) || keys.has(branchOf.get(x.id) + '|' + x.level))).map((x) => x.id));
};
/* edição em lote — aplica um campo (via/tamanho/estado) a todas as esferas da seleção de área de uma vez */
window.batchSet = (key, value) => {
  if (!isGM) return;
  const ids = [...areaSelection];
  if (!ids.length) return;
  // canvas lê o campo direto da esfera em todo quadro — não precisa de nenhuma atualização visual manual aqui
  ids.forEach((id) => { const n = byId(id); if (n) n[key] = value; });
  busDirty = true;
  if (key === 'enabled') computeNodeDists(); // a onda de luz é cacheada e ignora conexões desativadas — ver computeNodeDists
  updateBatchPanel();
  Promise.all(ids.map((id) => db.updateTreeNode(id, { [key]: value })))
    .then(() => showMsg(`${ids.length} habilidade(s) atualizada(s).`))
    .catch((e) => showMsg(e.message));
};

/* opções de duplicação — dependem do formato da grade, geradas dinamicamente */
function renderDupOptions() {
  const box = $('rotgrid');
  if (gridShape === 'linear') {
    $('dup-title').textContent = 'Espelhar cópia pelo Núcleo';
    $('dup-hint').textContent = 'A cópia espelha pelo Núcleo e reconecta onde a seleção original se conectava — sempre encaixada na grade quadrada.';
    box.innerHTML = `
      <button class="tool" onclick="duplicateSelection('flipV')"><span class="ic">${ICONS.flipV}</span>Cima/baixo</button>
      <button class="tool" onclick="duplicateSelection('flipH')"><span class="ic">${ICONS.flipH}</span>Esquerda/direita</button>
      <button class="tool" onclick="duplicateSelection('flip180')"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 20 4"/><path d="M9 4H4v5"/><path d="M15 20h5v-5"/></svg></span>Diagonal</button>`;
    return;
  }
  $('dup-title').textContent = 'Girar cópia ao redor do Núcleo';
  $('dup-hint').textContent = 'A cópia gira ao redor do Núcleo e reconecta onde a seleção original se conectava — sempre encaixada na grade.';
  const unit = 360 / (SHAPE_SEGMENTS[gridShape] || 8);
  let html = '';
  for (let k = 1; k * unit < 180; k++) html += `<button class="tool" onclick="duplicateSelection(${k * unit})"><span class="ic">${ICONS.rotateCw}</span>${k * unit}°</button>`;
  html += `<button class="tool" onclick="duplicateSelection(180)"><span class="ic">${ICONS.rotateCw}</span>180°</button>`;
  for (let k = 1; k * unit < 180; k++) html += `<button class="tool" onclick="duplicateSelection(${-k * unit})"><span class="ic">${ICONS.rotateCcw}</span>${k * unit}°</button>`;
  box.innerHTML = html;
}
function transformPoint(x, y, cx, cy, op) {
  if (typeof op === 'number') {
    const a = op * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a), dx = x - cx, dy = y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }
  const dx = x - cx, dy = y - cy;
  if (op === 'flipV') return { x: cx + dx, y: cy - dy };
  if (op === 'flipH') return { x: cx - dx, y: cy + dy };
  if (op === 'flip180') return { x: cx - dx, y: cy - dy };
  return { x, y };
}
// "Manter cor" (padrão) preserva a cor de cada habilidade original na cópia; "Trocar cor" aplica a
// cor escolhida no swatch #dup-color-swatch em TODAS as cópias, não importa a cor de cada original.
let dupColorMode = 'same';
window.setDupColorMode = (mode) => {
  dupColorMode = mode;
  document.querySelectorAll('#dup-color-mode .chip').forEach((c) => c.classList.toggle('on', c.dataset.dcm === mode));
  $('dup-color-row').style.display = mode === 'custom' ? 'flex' : 'none';
};
window.duplicateSelection = async (op) => {
  if (!isGM) return;
  const core = coreNode || nodes.find((n) => n.kind === 'core');
  const ids = [...areaSelection];
  if (!core || !ids.length) { showMsg('Nada pra duplicar.'); return; }
  const customColor = dupColorMode === 'custom' ? ($('dup-color-swatch').style.getPropertyValue('--sw').trim() || null) : null;
  const idSet = new Set(ids);
  const internalEdges = edges.filter((e) => idSet.has(e.a) && idSet.has(e.b));
  // da fronteira só copia a ligação com o Núcleo: copiar as outras prendia a cópia nas esferas
  // originais (espelhar uma coluna fazia a coluna nova nascer ligada à antiga)
  const boundaryEdges = edges.filter((e) => idSet.has(e.a) !== idSet.has(e.b) && byId(idSet.has(e.a) ? e.b : e.a)?.kind === 'core');
  const inSel = (id) => idSet.has(id) || id === core.id;
  const dupBuses = (busConfig.buses || []).filter((b) => [...b.top, ...b.bottom].every(inSel) && [...b.top, ...b.bottom].some((id) => idSet.has(id)));
  showMsg('Duplicando…');
  try {
    // esferas primeiro, em paralelo (cada uma é independente das outras) — antes era um await por
    // esfera, um round-trip de cada vez, proporcionalmente mais lento quanto maior a seleção
    const created = await Promise.all(ids.map(async (id) => {
      const n = byId(id); if (!n) return null;
      const t = transformPoint(n.x, n.y, core.x, core.y, op);
      const snapped = gridSnap(t.x, t.y);
      const saved = await db.insertTreeNode(treeId, { name: n.name, kind: n.kind, fac: n.fac, size: n.size, shape: n.shape, color: customColor ?? n.color, cost: n.cost, descr: n.descr, x: snapped.x, y: snapped.y, ...(hasLevelCol ? { level: n.level ?? null } : {}) });
      return { oldId: id, saved };
    }));
    const idMap = new Map();
    created.forEach((c) => { if (c && c.saved) { nodes.push({ ...c.saved }); idMap.set(c.oldId, c.saved.id); } });
    // as conexões só podem ser criadas depois que TODAS as esferas novas existirem (precisam do
    // idMap completo), mas internas e de fronteira entre si também são independentes
    const [internalSaved, boundarySaved] = await Promise.all([
      Promise.all(internalEdges.map((e) => {
        const a = idMap.get(e.a), b = idMap.get(e.b); if (!a || !b) return null;
        return db.insertTreeEdge(treeId, a, b);
      })),
      Promise.all(boundaryEdges.map((e) => {
        const insideOld = idSet.has(e.a) ? e.a : e.b, outside = idSet.has(e.a) ? e.b : e.a;
        const insideNew = idMap.get(insideOld); if (!insideNew) return null;
        return db.insertTreeEdge(treeId, insideNew, outside);
      })),
    ]);
    [...internalSaved, ...boundarySaved].forEach((saved) => { if (saved) edges.push({ id: saved.id, a: saved.a, b: saved.b }); });
    if (dupBuses.length) {
      const mapId = (id) => (id === core.id ? id : idMap.get(id));
      const tp = ([x, y]) => { const t = transformPoint(x, y, core.x, core.y, op); return [Math.round(t.x), Math.round(t.y)]; };
      for (const b of dupBuses) {
        const nb = { id: genBusId() + busConfig.buses.length, top: b.top.map(mapId).filter(Boolean), bottom: b.bottom.map(mapId).filter(Boolean) };
        busConfig.buses.push(nb);
        const k = 'b:' + b.id, nk = 'b:' + nb.id;
        if (busConfig.paths[k]) busConfig.paths[nk] = busConfig.paths[k].map(tp);
        if (busConfig.stubs[k]) busConfig.stubs[nk] = Object.fromEntries(Object.entries(busConfig.stubs[k]).map(([id, o]) => {
          const nid = idMap.get(id) || idMap.get(isNaN(id) ? id : Number(id)) || id;
          return [nid, { ...(o.at ? { at: Array.isArray(o.at) ? tp(o.at) : { ...o.at } } : {}), ...(o.via ? { via: o.via.map(tp) } : {}) }];
        }));
      }
      saveBusConfig();
    }
    render(); applyView(); clearAreaSelection();
    showMsg(`${ids.length} habilidade(s) duplicada(s).`);
  } catch (e) { showMsg('Erro ao duplicar: ' + e.message); }
};
window.deleteAreaSelection = async () => {
  if (!isGM) return;
  const ids = [...areaSelection];
  if (!ids.length) return;
  const ok = await confirmModal({ title: 'Excluir habilidades', desc: `Excluir ${ids.length} habilidade(s) selecionada(s)? As conexões delas também somem. Não dá pra desfazer.`, confirmLabel: 'Excluir' });
  if (!ok) return;
  showMsg('Excluindo…');
  Promise.all(ids.map((id) => db.deleteTreeNode(id))).then(() => {
    const idSet = new Set(ids);
    edges = edges.filter((e) => !idSet.has(e.a) && !idSet.has(e.b));
    nodes = nodes.filter((n) => !idSet.has(n.id));
    if (selected && idSet.has(selected.id)) { selected = null; closePanel(); }
    clearAreaSelection(); render(); applyView();
    showMsg(`${ids.length} habilidade(s) excluída(s).`);
  }).catch((e) => showMsg('Erro ao excluir: ' + e.message));
};
// duplo clique numa barra do barramento (Mestre, Selecionar): cria um ponto de dobra ali
stage.addEventListener('dblclick', (ev) => {
  if (!isGM || tool !== 'select' || edgeStyle !== 'bus') return;
  const p = toWorld(ev.clientX, ev.clientY);
  if (hitTestNodeAt(p.x, p.y)) return;
  addBusVertexAt(p.x, p.y);
});
stage.addEventListener('wheel', (ev) => { ev.preventDefault(); zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.12 : .89); }, { passive: false });
function zoomAt(cx, cy, f) { const r = stage.getBoundingClientRect(); const wx = (cx-r.left-view.x)/view.s, wy = (cy-r.top-view.y)/view.s;
  view.s = Math.max(MINZOOM, Math.min(2.6, view.s*f)); view.x = cx-r.left-wx*view.s; view.y = cy-r.top-wy*view.s; applyView(); }
window.zoom = (f) => { zoomAt(W/2, H/2, f); render(); };
window.resetView = () => { view = { x: W/2, y: H/2, s: 1 }; applyView(); render(); };
window.setTool = (t) => { if (!isGM) return; tool = t; linkSrc = null;
  document.querySelectorAll('.tool[data-tool]').forEach((b) => { const on = b.dataset.tool === t; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
  stage.classList.toggle('adding', t === 'add');
  stage.classList.toggle('areaing', t === 'area'); gridPolarEl.classList.toggle('show', t === 'add'); if (t !== 'add') hideSnapMark(); };
addEventListener('keydown', (ev) => {
  if (ev.key === 'Delete' && isGM) { if (selectedBusKey) deleteSelectedBusVertex(); else if (selected) deleteSelected(); else if (selectedEdge) deleteSelectedEdge(); }
  if (ev.key === 'Escape') { linkSrc = null; if (areaSelection.size) clearAreaSelection(); deselectEdge(); deselectBus(); closePanel(); closeViewer(); }
});
addEventListener('resize', () => { W = innerWidth; H = innerHeight; fxResize(); resizeStage(); render(); });

/* ---------- teclado (canvas) ----------
   Cada esfera tinha sua própria parada real de Tab (um <g tabindex="0">) — não dá pra ter um
   elemento de DOM focável por esfera sem reintroduzir o custo de DOM que o canvas existe pra
   eliminar. Trocado (confirmado com o usuário) por um proxy único: Tab alcança a árvore UMA vez,
   as setas navegam entre esferas, Enter/Espaço ativa a esfera focada — mesma ação de um clique.
   O foco é rastreado pelo ID da esfera (não pelo índice no array): um índice guardado ficava
   apontando pra outra esfera, silenciosamente, sempre que alguma esfera ANTES dela no array era
   excluída (o array inteiro desliza, o índice não sabe disso) — quem estava navegando por teclado
   podia ativar a esfera errada sem perceber. ID é estável mesmo com o array mudando de tamanho. */
function focusedNode() { return focusedNodeId != null ? nodeById.get(focusedNodeId) || null : null; }
// índice ATUAL da esfera focada dentro de "nodes" — recalculado on-demand (nunca guardado), pra
// nunca dessincronizar do array de verdade. Se a esfera focada foi excluída, cai pra -1 e a
// próxima seta simplesmente foca a primeira/última esfera, em vez de mirar em outra por engano.
function focusedNodeArrayIndex() { return focusedNodeId != null ? nodes.findIndex((n) => n.id === focusedNodeId) : -1; }
function updateFocusProxyLabel() {
  const n = focusedNode();
  focusProxy.setAttribute('aria-label', n ? nodeAriaLabel(n) : 'Árvore de habilidades — use as setas do teclado para navegar entre as habilidades');
}
// se a navegação por seta levar o foco pra fora da área visível, ajusta a câmera o suficiente pra
// trazer a esfera de volta pra dentro da tela — senão navegar por seta numa árvore grande seria "às cegas"
function ensureNodeVisible(n) {
  const pad = 80, sx = n.x * view.s + view.x, sy = n.y * view.s + view.y;
  let dx = 0, dy = 0;
  if (sx < pad) dx = pad - sx; else if (sx > W - pad) dx = (W - pad) - sx;
  if (sy < pad) dy = pad - sy; else if (sy > H - pad) dy = (H - pad) - sy;
  if (dx || dy) { view.x += dx; view.y += dy; applyView(); }
}
function focusNodeByIndex(i) {
  if (!nodes.length) return;
  const idx = ((i % nodes.length) + nodes.length) % nodes.length;
  const n = nodes[idx];
  focusedNodeId = n.id;
  updateFocusProxyLabel();
  ensureNodeVisible(n);
  if (liveRegion) liveRegion.textContent = nodeAriaLabel(n);
}
focusProxy?.addEventListener('focus', () => {
  if (focusedNodeId == null && nodes.length) { const idx = nodes.findIndex((n) => n.kind === 'core'); focusNodeByIndex(idx >= 0 ? idx : 0); }
  else updateFocusProxyLabel();
});
focusProxy?.addEventListener('keydown', (ev) => {
  if (!nodes.length) return;
  const cur = focusedNodeArrayIndex();
  if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); focusNodeByIndex(cur + 1); }
  else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); focusNodeByIndex(cur - 1); }
  else if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    const n = focusedNode(); if (!n) return;
    if (tool === 'link' && isGM) handleLink(n); else selectNode(n);
  }
});

// mede a altura real da .arvore-toolbar (pode quebrar em 2-3 linhas dependendo da largura) e
// publica como custom property pro .epanel (editor/viewer/lote) nunca ficar embaixo dela
function updateEpanelOffset() {
  const toolsEl = $('tools');
  if (!isGM || !toolsEl || getComputedStyle(toolsEl).display === 'none') {
    document.documentElement.style.setProperty('--toolbar-bottom', '64px');
    return;
  }
  const bottom = toolsEl.getBoundingClientRect().bottom;
  document.documentElement.style.setProperty('--toolbar-bottom', Math.round(bottom + 8) + 'px');
}
new ResizeObserver(updateEpanelOffset).observe($('tools'));
addEventListener('resize', updateEpanelOffset);
})();
