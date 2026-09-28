# Vitality — instruções para o Claude Code

## Design: quais documentos valem
Leia antes de mexer em qualquer UI, nesta ordem de precedência:
1. `docs/VITALITY-FORMA-COR-ITENS.md` — forma (tudo chanfrado), paleta grafite + latão, card e detalhe de item.
2. `docs/DESIGN-v2-LATAO-CALMO.md` — o sistema "Latão calmo" (tipografia, espaço, componentes, telas). Vale em tudo que o item 1 não altera.
3. `docs/DESIGN-FFXIII.md` — histórico. Só consulte para entender código antigo; as regras dele foram substituídas.

## CSS: camadas e arquivos
- `lib/tokens.css` — única fonte de cor, tipo, espaço, corte (`--cut-xs/s/m/l`), movimento e raridade (`--rar-*`). Cores novas só entram aqui.
- `lib/theme.css` e `lib/theme-ffx.css` — legado, dentro de `@layer legacy`: perdem para tudo que está fora de camada. Não acrescente regras novas neles.
- `lib/components.css` — a camada final de componentes, fora de camada. O `<style>` de cada página vem depois dele.
- **Sem `!important`** em `components.css` e no CSS das páginas. Se o legado atrapalhar, remova ou suavize a regra do legado.
- Ao mudar um CSS ou JS compartilhado, suba o `?v=` dele em todas as páginas que o carregam.

## Forma: tudo chanfrado
- Todo elemento com fundo ou borda tem os cantos superior esquerdo e inferior direito cortados a 45°. Tamanhos: XS 4 (selo, checkbox, amostra), S 6 (botão, campo, avatar ≤ 44px), M 12 (card, linha, painel, aviso), L 18 (modal, folha, painel lateral). Um filho nunca tem corte maior que o do pai.
- Exceções (sem chanfro): texto, links, botão terciário, abas sublinhadas, divisórias, trilhos de progresso, topbar e barras de largura total, spinner.
- **Mecanismo único** (em `components.css`): o componente entra nas listas de tamanho e na lista da forma, e só define `--fill` (fundo) e `--frame` (borda). A borda dos lados é um anel inset e as diagonais são camadas de fundo, então funcionam até em `<input>`/`<select>`. Para marcação nova, use as utilidades `.cf-xs/.cf-s/.cf-m/.cf-l`.
- Em componente chanfrado, **não use `background:` nem `box-shadow:` direto** (nem inline): isso apaga a moldura. Use `--fill`, `--frame`, `--bw` e, para traços internos, `--cf-accent`.
- Nunca use `clip-path: var(--algo)` com o polígono dentro de uma variável do `:root`: ele resolve no `:root` e vira `none`. Escreva o polígono na regra, com `var(--cut)`.
- Proibido `border-radius` (só o spinner é redondo). Marcadores de estado são o losango ◆.

## Estados
- Hover de controles, cards e linhas: `--frame: var(--primary)` e `--fill: var(--surface-2)`. Nada desliza. O único que sobe é o card de item (`translateY(-4px)`).
- Foco: moldura de latão com 2px dentro do corte (`--frame: var(--primary); --bw: 2px`). Nunca `outline` em elemento chanfrado, porque ele é cortado. Quando o brilho ou o foco precisam sair do formato, use um pai sem corte com `filter: drop-shadow` (`.cf-wrap`).
- Uma ação primária (latão) por região; rótulos de botão com verbo.

## Itens
- Card e detalhe de item vêm só de `lib/item-card.js` (`itemCard`, `openItemDetail`, `detailAttrs`). Não monte card ou modal de item à mão nas páginas.
- A raridade é a única exceção à regra "nenhuma animação em loop".

## Movimento
Toda animação respeita `prefers-reduced-motion` e `html[data-motion="off"]`: nada em loop, e estados estáticos no lugar.

## Ao terminar uma tela
Conferir nos temas claro e escuro, em 1440, 1024, 820 e 390px:
- contraste (texto ≥ 4,5:1, borda de controle ≥ 3:1);
- nenhum elemento com fundo ou borda sem chanfro;
- foco visível em todo controle, navegando só com o teclado;
- sem rolagem horizontal.
