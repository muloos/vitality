// Ícones de condição (MELHORIAS-v1.5 P2-6: sem emoji). Traço de 1.6px em 24×24, na cor do texto.
// O valor gravado em condition.icon é a chave ("fogo", "veneno"…). Emoji gravados antes continuam
// funcionando: são convertidos para a chave equivalente na hora de desenhar.

const P = (d) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const CONDITION_ICONS = {
  sangue: { label: 'Sangramento', svg: P('<path d="M12 3c3 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6.5 6-11z"/>') },
  caveira: { label: 'Caveira', svg: P('<path d="M5 11a7 7 0 1 1 14 0v3l-2 1v3H7v-3l-2-1z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="11" r="1.4"/><path d="M10 18v2M14 18v2"/>') },
  fogo: { label: 'Queimando', svg: P('<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>') },
  gelo: { label: 'Congelado', svg: P('<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>') },
  tonto: { label: 'Tonto', svg: P('<circle cx="12" cy="12" r="8"/><path d="M8 10l2 2m0-2-2 2M14 10l2 2m0-2-2 2M9 16h6"/>') },
  morte: { label: 'Morte', svg: P('<path d="M12 3v18M7 8h10"/><path d="M8 21h8"/>') },
  brilho: { label: 'Abençoado', svg: P('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18 16l.7 1.8L20.5 18.5l-1.8.7L18 21l-.7-1.8-1.8-.7 1.8-.7z"/>') },
  veneno: { label: 'Envenenado', svg: P('<path d="M9 3h6M10 3v5l-4.5 8A3 3 0 0 0 8 21h8a3 3 0 0 0 2.5-5L14 8V3"/><path d="M7.5 15h9"/>') },
  corrente: { label: 'Preso', svg: P('<rect x="3" y="9" width="9" height="6" rx="0"/><rect x="12" y="9" width="9" height="6" rx="0"/>') },
  atordoado: { label: 'Atordoado', svg: P('<path d="M12 4l1.2 3.3L16.5 8l-3.3 1.2L12 12.5l-1.2-3.3L7.5 8l3.3-.7z"/><path d="M4 17c2.5-2 5-2 8 0s5.5 2 8 0"/>') },
  espiral: { label: 'Confuso', svg: P('<path d="M12 12a1.5 1.5 0 1 1 1.5 1.5A3 3 0 1 1 16.5 10.5 4.5 4.5 0 1 1 12 6a6 6 0 1 1-6 6"/>') },
  escudo: { label: 'Protegido', svg: P('<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/>') },
};

// emoji e apelidos antigos → chave
const ALIASES = {
  '🩸': 'sangue', '☠️': 'caveira', '☠': 'caveira', '🔥': 'fogo', '❄️': 'gelo', '❄': 'gelo', '😵': 'tonto', '💀': 'morte',
  '✨': 'brilho', '🐍': 'veneno', '⛓️': 'corrente', '⛓': 'corrente', '💫': 'atordoado', '🌀': 'espiral', '🛡️': 'escudo', '🛡': 'escudo',
  skull: 'caveira', fire: 'fogo', ice: 'gelo', poison: 'veneno', shield: 'escudo', blood: 'sangue',
};

export function condIconKey(v) {
  const k = String(v ?? '').trim();
  if (!k) return '';
  if (CONDITION_ICONS[k]) return k;
  return ALIASES[k] || ALIASES[k.toLowerCase()] || '';
}

/** HTML do ícone (SVG) — ou o texto livre escapado, se não for um ícone conhecido. */
export function condIconHtml(v) {
  const k = condIconKey(v);
  if (k) return `<span class="cond-ic" title="${CONDITION_ICONS[k].label}">${CONDITION_ICONS[k].svg}</span>`;
  const t = String(v ?? '').trim();
  return t ? `<span class="cond-ic">${t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))}</span>` : '';
}
