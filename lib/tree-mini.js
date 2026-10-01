// Miniatura de uma árvore de habilidades num <canvas>: anéis finos em volta do Núcleo, conexões e
// esferas. Usada na aba Árvores da mesa, no sistema, em Criação → Árvores e no detalhe do sistema na
// loja. lit(n) diz quais esferas ficam acesas (cor da via); as apagadas ficam só no contorno.
// O brilho de fundo é do próprio canvas (.tree-mini, em components.css) e some antes das bordas.
// O desenho usa o tamanho real da caixa: se ela ainda está escondida (aba fechada) ou muda de tamanho
// (janela, grade), um ResizeObserver redesenha — sem isso o canvas era pintado num tamanho padrão e
// o navegador esticava a imagem, achatando a árvore.
const _data = new WeakMap();
const _ro = typeof ResizeObserver !== 'undefined'
  ? new ResizeObserver((entries) => entries.forEach((en) => { const d = _data.get(en.target); if (d) paint(en.target, d); }))
  : null;
export function drawTreeMini(cv, data = {}) {
  if (!cv) return;
  const fresh = !_data.has(cv);
  _data.set(cv, data);
  if (fresh && _ro) _ro.observe(cv);
  paint(cv, data);
}
function paint(cv, { nodes = [], edges = [], vias = [], lit = () => true } = {}) {
  const W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return; // escondida: o observer desenha quando ela aparecer
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (cv._w === W && cv._h === H && cv._d === nodes) return; // mesmo tamanho e mesmos dados: nada a refazer
  cv._w = W; cv._h = H; cv._d = nodes;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!nodes.length) return;
  const css = getComputedStyle(document.documentElement), tok = (k, f) => css.getPropertyValue(k).trim() || f;
  const lineC = tok('--line2', 'rgba(233,221,201,.17)'), fieldC = tok('--field', 'rgba(40,32,23,.7)'), brass = tok('--brass', '#c9a45c');
  const colorOf = (n) => n.color || (vias.find((v) => v.key === n.fac) || {}).color || brass;
  const core = nodes.find((n) => n.kind === 'core') || nodes[0];
  // escala pelo que a árvore ocupa de verdade em volta do Núcleo (largura e altura separadas), para
  // árvores em coluna também preencherem a caixa
  const dx = Math.max(1, ...nodes.map((n) => Math.abs(n.x - core.x))), dy = Math.max(1, ...nodes.map((n) => Math.abs(n.y - core.y)));
  const pad = Math.max(6, Math.min(W, H) * .08);
  const k = Math.min((W / 2 - pad) / dx, (H / 2 - pad) / dy);
  const cx = W / 2, cy = H / 2;
  const P = (n) => [cx + (n.x - core.x) * k, cy + (n.y - core.y) * k];
  const s = Math.max(.5, Math.min(1, H / 140)); // esferas menores em miniaturas pequenas
  const maxD = Math.max(1, ...nodes.map((n) => Math.hypot(n.x - core.x, n.y - core.y)));
  g.strokeStyle = lineC; g.lineWidth = 1;
  const ringR = Math.min(maxD * k, Math.min(W, H) / 2 - 2); // anéis sempre inteiros dentro da caixa
  [0.34, 0.67, 1].forEach((f) => { g.beginPath(); g.arc(cx, cy, ringR * f, 0, Math.PI * 2); g.stroke(); });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  edges.forEach((e) => {
    const A = byId.get(e.a), B = byId.get(e.b); if (!A || !B) return;
    const on = lit(A) && lit(B);
    g.strokeStyle = on ? colorOf(B) : lineC; g.globalAlpha = on ? .75 : 1; g.lineWidth = on ? 1.2 * s : 1;
    g.beginPath(); g.moveTo(...P(A)); g.lineTo(...P(B)); g.stroke(); g.globalAlpha = 1;
  });
  nodes.forEach((n) => {
    const [x, y] = P(n), r = (n.kind === 'core' ? 4.5 : 2.6) * s;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    if (lit(n)) { g.shadowColor = colorOf(n); g.shadowBlur = 8 * s; g.fillStyle = colorOf(n); g.fill(); g.shadowBlur = 0; }
    else { g.fillStyle = fieldC; g.fill(); g.strokeStyle = lineC; g.stroke(); }
  });
}
