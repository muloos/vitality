// Card de item — docs/VITALITY-FORMA-COR-ITENS.md §3.2. O MESMO componente na loja, favoritos,
// biblioteca, mochila e visão do Mestre; cada tela só passa o que muda (ação do canto, selo de
// estado, meta, controles extras).
//
//   .item-glow            sem clip-path: recebe o brilho animado (filter: drop-shadow) e o hover
//    └ .item-card         chanfrado M; o fundo É a moldura (cor/degradê da raridade), padding = espessura
//        ├ .item-aura     só Único: cone girando atrás do conteúdo, aparece na moldura
//        └ .item-inner    chanfro interno = 12px − 0,586 × espessura; --surface-1
//            ├ .item-stage  quadrado com halo; a imagem usa object-fit:contain (nunca é cortada)
//            └ .item-info   borda superior de 2px na cor; nome (2 linhas) + meta (1 linha)
//
// O visual (tamanhos, animações por raridade, movimento reduzido) mora em lib/components.css.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const RARITIES = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Único'];
// posições fixas das cintilações (%, dentro do palco): Lendário e Único usam as três
const TWINKLES = [[20, 22], [78, 30], [30, 76]];

/**
 * @param {object} o
 * @param {object} o.item      { name, rarity, image_url }
 * @param {string} [o.attrs]   atributos extras do .item-card (onclick, tabindex, role, aria-label, draggable, data-id…)
 * @param {string} [o.wrapAttrs] atributos extras do .item-glow (ex.: data-id para reordenar)
 * @param {string} [o.action]  HTML do botão do canto superior direito do palco
 * @param {string} [o.status]  HTML do selo de estado (Publicado, Equipado…) no canto inferior esquerdo do palco
 * @param {string} [o.handle]  HTML da alça de arrastar (canto inferior direito do palco)
 * @param {string} [o.meta]    HTML da linha de meta (já escapado por quem chama)
 * @param {string} [o.extra]   HTML de controles abaixo do nome (mochila, visão do Mestre)
 */
export function itemCard(o) {
  const it = o.item || {};
  const rarity = RARITIES.includes(it.rarity) ? it.rarity : 'Comum';
  const lvl = RARITIES.indexOf(rarity);
  const name = esc(it.name || 'Sem nome');
  const initial = esc((it.name || '?').trim().charAt(0).toUpperCase() || '?');
  const art = it.image_url
    ? `<img src="${esc(it.image_url)}" alt="" loading="lazy" decoding="async">`
    : `<span class="item-ph" aria-hidden="true"><b>${initial}</b></span>`;
  const sweep = lvl >= 3 ? '<span class="sweep" aria-hidden="true"></span>' : '';
  const twinkles = lvl >= 4 ? TWINKLES.map(([x, y], i) => `<i class="twinkle" aria-hidden="true" style="left:${x}%;top:${y}%;animation-delay:${(i * 0.7).toFixed(1)}s"></i>`).join('') : '';
  return `<div class="item-glow" data-rarity="${esc(rarity)}" ${o.wrapAttrs || ''}>
  <div class="item-card" ${o.attrs || ''}>
    ${rarity === 'Único' ? '<span class="item-aura" aria-hidden="true"></span>' : ''}
    <div class="item-inner">
      <div class="item-stage">
        ${art}${sweep}${twinkles}
        <span class="item-rar">${esc(rarity)}</span>
        ${o.action || ''}${o.status || ''}${o.handle || ''}
      </div>
      <div class="item-info">
        <h4 class="item-name" title="${name}">${name}</h4>
        ${o.meta ? `<div class="item-meta">${o.meta}</div>` : ''}
      </div>
      ${o.extra ? `<div class="item-extra" onclick="if(event.target.closest('input,button,select,textarea,a'))event.stopPropagation()">${o.extra}</div>` : ''}
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------------------------
// Detalhe do item (§3.3) — o mesmo modal para a loja, a mochila e a visão do Mestre.
// Computador: modal L de 920×560, palco à esquerda (imagem em contain) e, à direita, cabeçalho
// fixo, atributos 2×2, corpo rolável e rodapé fixo com a ação contextual.
// Celular (≤760px): folha inferior com puxador, palco de 240px e descrição com "Ler tudo".

const has = (v) => v != null && String(v).trim() !== '';

/** Até 4 atributos, na ordem de relevância para o tipo de item (arma, armadura, consumível…). */
export function detailAttrs(it, { qty = null, price = '' } = {}) {
  const out = [];
  if (has(it.weapon_damage)) out.push(['Dano', esc(it.weapon_damage) + (has(it.damage_scale) ? ' + ' + esc(it.damage_scale) : '')]);
  if (has(it.protection)) out.push(['Proteção', esc(String(it.protection)) + (has(it.protection_scale) ? ' + ' + esc(it.protection_scale) : '')]);
  if (has(it.category)) out.push(['Tipo', esc(it.category)]);
  if (has(it.equipment_type)) out.push(['Slot', esc(it.equipment_type)]);
  if (qty != null) out.push(['Qtd.', esc(String(qty))]);
  if (has(it.weight)) out.push(['Peso', esc(String(it.weight))]);
  if (price) out.push(['Preço', price]);
  return out.slice(0, 4);
}

/**
 * @param {object} o
 * @param {object} o.item              { name, rarity, image_url, description, category, equipment_type }
 * @param {string} [o.origin]          linha abaixo do nome (HTML já escapado): "Criado por…", "Na sua mochila"…
 * @param {Array}  [o.attrs]           [[rótulo, valorHTML], …] — use detailAttrs()
 * @param {Array}  [o.effects]         [{ value, text }] — "+2" em verde + "Força"
 * @param {object} [o.actions]         { danger, secondary, primary, extra } — HTML dos botões; ids para ligar depois
 * @param {Function} [o.trapFocus]     trapFocus de lib/ui.js
 * @returns {{ el: HTMLElement, close: Function }}
 */
export function openItemDetail(o) {
  const it = o.item || {};
  const rarity = RARITIES.includes(it.rarity) ? it.rarity : 'Comum';
  const type = esc(it.category || it.equipment_type || '');
  const name = esc(it.name || 'Sem nome');
  const trigger = document.activeElement;
  const art = it.image_url
    ? `<img src="${esc(it.image_url)}" alt="">`
    : `<span class="idet-ph" aria-hidden="true"></span>`;
  const attrs = (o.attrs || []).map(([k, v]) => `<div class="idet-cell cf-m"><span class="idet-k">${esc(k)}</span><span class="idet-v">${v}</span></div>`).join('');
  const effects = (o.effects || []).map((e) => `<li><i aria-hidden="true"></i><b>${esc(e.value)}</b> ${esc(e.text)}</li>`).join('');
  const a = o.actions || {};
  const foot = (a.danger || a.secondary || a.primary || a.extra)
    ? `<div class="idet-foot">${a.danger ? `<div class="idet-foot-l">${a.danger}</div>` : ''}<div class="idet-foot-r">${a.extra || ''}${a.secondary || ''}${a.primary || ''}</div></div>` : '';
  const w = document.createElement('div');
  w.className = 'ui-modal idet-modal';
  w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'idet-title');
  w.innerHTML = `<div class="idet-wrap" data-rarity="${esc(rarity)}">
  <div class="box idet">
    <span class="idet-grip" aria-hidden="true"></span>
    <div class="idet-stage">
      ${art}
      <div class="idet-stage-foot"><span class="idet-rar">◆ ${esc(rarity)}</span>${type ? `<span class="idet-type">${type}</span>` : ''}</div>
    </div>
    <div class="idet-main">
      <div class="idet-head">
        <div class="idet-titles">
          <span class="idet-eyebrow">◆ ${esc(rarity)}${type ? ' · ' + type : ''}</span>
          <h3 id="idet-title">${name}</h3>
          ${o.origin ? `<div class="idet-origin">${o.origin}</div>` : ''}
        </div>
        <button type="button" class="btn icon idet-x" aria-label="Fechar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="idet-body">
        ${attrs ? `<div class="idet-attrs">${attrs}</div>` : ''}
        ${has(it.description) ? `<div class="idet-desc"><p>${esc(it.description)}</p><button type="button" class="btn tertiary idet-more" hidden>Ler tudo</button></div>` : ''}
        ${effects ? `<div class="idet-fx"><span class="idet-k">Efeitos</span><ul>${effects}</ul></div>` : ''}
      </div>
      ${foot}
    </div>
  </div>
</div>`;
  const untrap = o.trapFocus ? o.trapFocus(w) : () => {};
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    untrap(); w.remove(); document.removeEventListener('keydown', onEsc);
    if (trigger && trigger.focus) trigger.focus();
  };
  const onEsc = (e) => { if (e.key === 'Escape') close(); };
  w.addEventListener('click', (e) => { if (e.target === w) close(); });
  w.querySelector('.idet-x').onclick = close;
  document.addEventListener('keydown', onEsc);
  document.body.appendChild(w);
  // "Ler tudo" só aparece quando o clamp de 4 linhas (celular) realmente corta o texto
  const desc = w.querySelector('.idet-desc');
  if (desc) {
    const p = desc.querySelector('p'), more = desc.querySelector('.idet-more');
    requestAnimationFrame(() => { if (p.scrollHeight > p.clientHeight + 2) more.hidden = false; });
    more.onclick = () => { desc.classList.add('open'); more.hidden = true; };
  }
  w.querySelector('.idet-x').focus();
  return { el: w, close };
}

// Desempenho (§1.7): os brilhos Raro+ são filter:drop-shadow animado. Fora da tela eles pausam,
// o que importa numa mochila grande. Um observador só, para a página toda.
let io = null;
function watch(el) {
  if (!io) {
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('paused', !e.isIntersecting);
    }, { rootMargin: '120px' });
  }
  io.observe(el);
}
function scan(root) {
  if (root.nodeType !== 1) return;
  if (root.matches?.('.item-glow')) watch(root);
  root.querySelectorAll?.('.item-glow').forEach(watch);
}
if (typeof window !== 'undefined' && !window.__itemGlowWatch) {
  window.__itemGlowWatch = true;
  const start = () => {
    scan(document.body);
    new MutationObserver((muts) => { for (const m of muts) m.addedNodes.forEach(scan); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}
