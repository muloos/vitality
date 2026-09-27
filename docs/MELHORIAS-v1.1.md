# Vitality — revisão pós-redesign FFXIII (v1 → v1.1)

Análise do `muloos/vitality@main` (commit dcb4cab) com `lib/theme-ffx.css?v=5` aplicado.
A base ficou muito bem feita: tokens, menu vertical, ficha, construtor e login seguem o guia, e os casos difíceis foram tratados com cuidado (vidro aninhado, `--rc` do card de item, selo "Destaque", tema claro das cores de sistema).
Abaixo estão só os pontos que ainda separam o resultado de um acabamento impecável, em ordem de prioridade.

---

## P0-A — encontrados navegando logado (janela ~914px)

Estes vieram do site rodando de verdade, não só do código. Resolva **antes** de todo o resto.

1. **Mesa entre 821 e ~1200px quebra.** As 3 colunas fixas (250 + conteúdo + 300) deixam a ficha com ~360px. O cabeçalho do personagem desmonta: cada tag vira uma coluna de 1 palavra por linha ("CENTRO, / OS / REINOS / DA…") e o botão "Editar biografia" fica por cima das tags.
   → Entre 821 e 1199px, o painel de rolagem vira gaveta recolhível (o `.dice-collapsed` que já existe) com um botão de latão na lateral. Na capa: `.char-tags{flex-wrap:wrap}` e `.char-tag{white-space:nowrap}`, e o botão "Editar biografia" vai para o canto superior direito da capa, não embaixo.
2. **Botões flutuantes (tema ☼ e ajuda ?) em cima do menu vertical.** No construtor, o ☼ cobre o item "Árvores". No lobby, fica colado no menu. Eles também são redondos, fora do padrão.
   → Juntar os dois num grupo só, no canto inferior **direito**, em chanfro de 10px, e dar `padding-bottom:72px` ao `.ffx-side`. Na mesa eles já não aparecem, então mantenha assim.
3. **Barra de música (`#yt-bar`) cobre o fim dos trilhos da mesa.** O bloco "Grupo" e o fim do log de rolagens ficam atrás dela.
   → Adicionar `padding-bottom: var(--yt-bar-h, 52px)` em `.mesa-rail-left`, `.mesa-main` e `.dice-panel` quando a barra estiver visível.
4. **Botão "Entrar" (Entrar em mesa) cortado na borda direita.** O `.inline-form` estoura o card, e o chanfro (`clip-path`) corta o botão.
   → `.action-card .inline-form{flex-wrap:wrap}` e `.inline-form input{min-width:0}`.
5. **O H1 do lobby é sempre "Bem-vindo, …"**, até em Sistemas e Itens. Só o eyebrow muda.
   → Deixar "Bem-vindo, Nome" só em Mesas. Em Sistemas, o H1 vira "Sistemas" e, em Itens, "Itens", com a saudação indo para o eyebrow.
6. **Vão grande (~80px) entre a introdução e o conteúdo** em Sistemas e Itens. Em Mesas o espaço é normal. Provavelmente é a margem do `#msg`, que continua lá mesmo vazio, somada ao `.section-title`.
   → `#msg:not(.show){display:none}` e rever o `margin-top` do `.section-title` dentro de `.ffx-main` (o gap do flex já espaça).
7. **A busca de itens tem só ~200px, com o filtro empurrado para a direita.**
   → `.toolbar .search-field{flex:1}`.
8. **Textos longos em mono MAIÚSCULO.** Os rótulos de checkbox do construtor ("PUBLICAR NA LOJA — OUTROS USUÁRIOS…") e os parágrafos dos action cards estão em mono 10–11px e ficam difíceis de ler.
   → Mono maiúsculo só em rótulos curtos (até ~4 palavras). `.check-row span` e `.action-card p` voltam para Hanken 13px, em caixa normal.
9. **Cards de mesa com nomes longos** ("CDP AuditFix Campaign 1785852264838") quebram em 3 linhas em Fraunces com peso alto.
   → `.card-tile h3{font-weight:400;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`. O guia pede a lista de mesas em **linhas** (§3.3), não em grade de 2 colunas. Vale migrar.
10. **Cantos chanfrados sem linha na diagonal.** A borda `inset` some no corte, e o canto parece "mordido" (fica bem visível nos cards de mesa e no card em Destaque).
    → Desenhar a diagonal com um pseudo-elemento: `::before` em um quadrado de `var(--cut)` no canto, com `background:linear-gradient(135deg,transparent calc(50% - .5px),var(--line2) 50%,transparent calc(50% + .5px))`. Faça o mesmo no canto inferior direito.
11. **Barras de rolagem padrão do sistema** (cinza e grossas) nos trilhos da mesa. É o item 15 abaixo, mas na mesa ele se destaca: suba para P0.
12. **Avatares e slots ainda arredondados:** o `.mesa-av` dos cards de mesa (radius 13), o avatar da mesa na topbar, os slots de equipamento e o badge numerado circular do onboarding do construtor.
13. **Topbar do construtor sem avatar:** o usuário aparece só como texto, diferente das outras telas. Use o mesmo `.nav-user` com o avatar chanfrado.

## P0 — defeitos visíveis

### 1. Moldura de raridade redonda envolvendo um card chanfrado
`.rar-frame` (theme.css:451) continua com `border-radius:15px`, e o `.poster-card` dentro dele agora é chanfrado. Nos dois cantos cortados aparece um triângulo do degradê animado da raridade, e os outros dois cantos ficam arredondados. É o defeito mais visível da loja de itens.
**Correção:** chanfrar a moldura com o mesmo polígono (`--cut` do card + a espessura da borda) e trocar o `box-shadow` do brilho (que o clip-path cortaria) por `filter: drop-shadow(...)` num wrapper sem clip:
```css
.rar-frame{border-radius:0;--cut:15px;clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut))}
.rar-frame > .poster-card{--cut:calc(15px - 1.5px)}
/* glow: mover os keyframes pc-*-glow/aura para filter:drop-shadow num .rar-glow pai (sem clip) */
```

### 2. Componentes que ficaram de fora do redesign (ainda arredondados e no estilo antigo)
São a primeira coisa que denuncia "metade migrado":
| Componente | Onde aparece | O que fazer |
|---|---|---|
| `.ui-modal .box` (radius 18) e `.guide`, `.gtips` | todos os modais (confirmar, perfil, config, ajuda) | chanfro 18 + `.ffx-corners` + cabeçalho com `.ffx-label` |
| `.color-pop`, `.func-pop`, `.dmg-pop`, `.cp-sv` | seletor de cor, funções, popover de dano | chanfro 12, reto por dentro |
| `.empty`, `.empty-cta` (radius 14/16) | estados vazios em todas as telas | tracejado reto + losango ◇ de latão no lugar do ícone circular |
| `.onboard`, `.ostep` | onboarding do lobby | painel chanfrado + passos como `.ffx-row` numerados |
| `.picker-card` | escolha de classe/raça | chanfro 14 + `inset 0 2px 0 var(--pc)` (mesma faixa do card de item) |
| `.code-chip` | código de convite | reto, código em Fraunces 20 tracking .3em |
| `.msg` (radius 10) | toasts | reto + `border-left:2px` na cor (erro/ok) |
| `.formula-row`, `.points-card`, `.hud-cell` | ficha / guia rápido | `.ffx-row` |
| `.char-card`, `.char-portrait` fora da capa, `.mesa-av`, `.img-thumb`, `.gal-thumb` | visão do Mestre, galeria, cards de mesa | chanfro 7–14 |
| `.eq-board`, `.eq-slot` | tela de equipamento | slots em losango ou chanfrados; tabuleiro sem raio |
| `.nav-user .chip`, `.mesa-menu .chip` (radius 10) | topbar | reto, hover com `--sel-a` |
| `.dice-fab`, `.yt-unlock-fab` (999px) | celular | chanfro 10 |
| `#yt-panel` (card, lista, seções, inputs) | player de música | chanfro nos cards e campos só com borda inferior |
| `.pw-toggle` (8px), `.inv-dropzone` (12px), `.item-detail .idet-img` | login, mochila, detalhe do item | reto |
| folhas de baixo no celular (`border-radius:18px 18px 0 0`, theme.css:1854) | painéis no mobile | reto com traço de latão no topo |

**Dica para o Claude Code:** buscar `border-radius:` no theme.css e zerar em lote no theme-ffx.css tudo o que não seja exceção do guia (§2.7).

### 3. O botão "overlay" sobre a capa perdeu o fundo
`.btn` no theme-ffx ganhou `background:transparent`, e isso inclui o `.btn.overlay` ("Trocar capa", "Editar capa", "Editar biografia") sobre a foto. Sobre imagem clara o texto fica ilegível.
```css
.btn.overlay{background:rgba(12,9,6,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#f3ead9}
```

---

## P1 — qualidade e consistência

### 4. Contraste do texto "faint" abaixo de 4.5:1
- Escuro: `--ink-faint #7a7061` sobre `#0c0906` ≈ **3.9:1**. É usado em rótulos mono de 10px, o pior caso.
- Claro: `#8a7c68` sobre `#efe7d8` ≈ **3.3:1**.

```css
:root{--ink-faint:#8c8170}                       /* ≈ 4.8:1 */
:root[data-theme="light"]{--ink-faint:#74675a}   /* ≈ 4.7:1 */
```

### 5. Blur demais = rolagem pesada
`backdrop-filter:blur(12px)` está em **todo** `.card-tile`, `.action-card`, `.glass` e `.surface`. Em grades com 30+ itens (loja) e na mesa (com o iframe da árvore), isso derruba o FPS, principalmente no Safari e em notebooks.
**Regra:** blur só em superfícies únicas e grandes (topbar, painel de dados, painéis de detalhe/editor, modais). Cards repetidos usam `--panel-2` opaco-ish sem blur:
```css
.card-tile,.poster-card,.list-row,.stat-tile{-webkit-backdrop-filter:none !important;backdrop-filter:none !important;background:var(--panel-2) !important}
```

### 6. Brilho do botão primário em todos os `.btn.go` ao mesmo tempo
Numa tela com vários primários (formulários, construtor), todos piscam juntos, e o efeito perde valor e cansa.
**Regra:** brilho automático só no CTA principal da tela (`.btn.go.cta`). Nos outros, o brilho passa uma vez no `:hover`.
```css
.btn.go::after{animation:none;transform:translateX(-120%)}
.btn.go:hover::after,.btn.go.cta::after{animation:vtSweep 3.8s ease-in-out infinite}
```

### 7. Estados de foco e pressão incompletos
- `:focus-visible` só existe no `.ffx-menu`. Faltam `.list-row`, `.card-tile`, `.poster-card`, `.stat-tile` botões, `.dice-quick`, `.res-btn`. Use o mesmo padrão: `outline:1px solid var(--brass); outline-offset:-1px` + a barra de seleção.
- `:active` (`scale(.97)`) sumiu em `.btn` e `.list-row`. Recolocar para dar a resposta tátil.

### 8. Cache-busting
`theme.css?v=48` não subiu mesmo com as mudanças de convivência. Quem já tinha a v48 no cache vê o CSS antigo misturado com o novo. Suba para `v=49` em todas as páginas junto com `theme-ffx.css`.

### 9. Excesso de `!important`
São cerca de 60 `!important` no theme-ffx. Funciona, mas cada ajuste futuro vira uma guerra de especificidade. Para a v2: mover as regras do theme-ffx para dentro de `@layer ffx` e o theme.css para `@layer base`. A camada posterior vence sem `!important`.

---

## P2 — polimento que eleva para "impecável"

10. **Transição entre telas/abas.** Hoje a troca de aba é instantânea. Faça um fade + deslize de 8px no `#content` (180ms, `--ease`) ao trocar de aba. Na FFXIII, a sensação de fluidez vem disso.
11. **Números que contam.** Quando Vida/Mana mudam, anime o valor (contador de 300ms) e deixe um "rastro" fantasma de 40% de opacidade na barra, que alcança o valor novo depois de 400ms. É o feedback clássico de dano em HUD de RPG.
12. **Resultado do dado.** O valor em Fraunces 56px entra com escala 1.15→1 + brilho de latão. Críticos (máximo do dado) ganham cor `--maq` e anel `vtRing`.
13. **Skeletons.** Substitua os "Carregando…" em `.empty` por linhas chanfradas com o brilho `vtSweep` passando, no mesmo formato do conteúdo final.
14. **Cursor ◆ entre itens.** Ao mudar de item, o cursor desliza verticalmente até o novo item (um único elemento absoluto no `.ffx-menu`, com `transform:translateY` animado) em vez de sumir e reaparecer.
15. **Scrollbar.** Fina (6px), trilho transparente e polegar `--line2` → `--brass` no hover (`scrollbar-color` + `::-webkit-scrollbar`).
16. **Seleção de texto.** `::selection{background:var(--sel-a);color:var(--bone)}`.
17. **Favicon e título.** O favicon ainda é o antigo. Use um losango ◈ de latão sobre `#0c0906`.
18. **Partículas do login** (`particles.js`): alinhe a cor ao latão/`--glow1`, reduza a densidade pela metade e desligue quando `data-motion="off"`.
19. **Árvore:** confira no navegador se o anel `vtRing` dos nós disponíveis respeita `data-motion="off"`. Ele roda no canvas, então o CSS não desliga: o `arvore.js` precisa ler `document.documentElement.dataset.motion`.

---

## Prompt para o Claude Code

```
Leia CLAUDE.md, docs/DESIGN-FFXIII.md e docs/MELHORIAS-v1.1.md.
Execute primeiro a seção P0-A (itens 1 a 13), testando a mesa em 900px e 1100px de largura. Depois execute a seção P0 (itens 1, 2 e 3), um componente por vez, só no lib/theme-ffx.css (sem mudar JS nem HTML, a não ser que seja inevitável — nesse caso me avise antes).
Ao final, liste cada componente da tabela do item 2 com "feito" ou "pendente + motivo".
Depois suba theme.css e theme-ffx.css para a próxima versão (?v=) em todas as páginas.
```
Depois disso, mande o mesmo prompt trocando "P0" por "P1" e, por fim, "P2".
