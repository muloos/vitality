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
      ${o.extra ? `<div class="item-extra">${o.extra}</div>` : ''}
    </div>
  </div>
</div>`;
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
