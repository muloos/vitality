# Vitality v2 — revisão visual (v1.3)

Revisão da pasta `vitality v2 260726`, feita logado numa janela de ~914×540 px.
Não testado: login, editor da árvore, celular.
A versão visual (screenshots com marcações) está em `Revisao v2.dc.html`.


## P0 — quebrado

### P0-1 · O selo Mestre/Jogador parece texto selecionado
**Tela:** Lobby · Mesas

**Problema:** Quando a lista de mesas trocou de card para linha, o estilo do .role ficou preso em ".card-tile .role". Na linha, o selo perdeu padding, fonte mono e caixa alta, e sobrou só o fundo de latão colado ao texto, que parece uma seleção do navegador.

**Proposta:** Tirar o escopo do seletor (.role global) e aplicar o selo mono chanfrado. Jogador fica com contorno e Mestre com preenchimento.

```css
.role{font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  padding:5px 10px;line-height:1;border:0;border-radius:0}
.role.gm{background:var(--brass);color:var(--on-primary);
  clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}
.role.player{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--maq) 45%,transparent)}
```

### P0-2 · Os últimos itens do menu do construtor ficam fora da tela
**Tela:** Construtor · menu

**Problema:** São 13 itens num menu fixo (sticky), sem rolagem própria. Em telas de até ~720px de altura, "Árvores" e "Itens" ficam cortados e não dá para alcançá-los sem rolar a página inteira até o fim.

**Proposta:** Limitar a altura do menu à janela, com rolagem própria, e agrupar os 13 itens em 3 blocos com eyebrow (Regras · Personagem · Conteúdo). Os grupos também ajudam quem não conhece o construtor.

```css
.ffx-layout > .ffx-side{max-height:calc(100vh - 100px);overflow:auto;overscroll-behavior:contain}
.ffx-menu .ffx-menu-group{font-family:var(--mono);font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--ink-faint);padding:18px 0 6px 26px}
```

### P0-3 · O histórico de rolagens some em telas baixas
**Tela:** Mesa · painel de rolagem

**Problema:** Resultado, grade de dados, quantidade, modificadores e botão Rolar empilhados ocupam ~380px fixos. Com a barra de música, sobram ~20px para o histórico e a conversa, que são justamente a parte social da mesa.

**Proposta:** Deixar o histórico com altura mínima de 180px e comprimir o topo: o resultado cai para 40px, a grade de dados vira uma linha de 6 e os selects saem para uma linha "avançado" recolhível. Abaixo de 760px de altura, o topo recolhe sozinho para só o último resultado + Rolar.

```css
.dice-panel{display:flex;flex-direction:column}
.dice-log{flex:1 1 180px;min-height:180px}
.dice-quick{grid-template-columns:repeat(6,1fr)}
@media (max-height:760px){.dice-result .big{font-size:40px}.dice-adv{display:none}}
```

### P0-4 · O logo aparece como um retângulo de latão
**Tela:** Topbar · todas

**Problema:** A marca usa mask:url(logo.png). Aqui a máscara não carregou e sobrou só o bloco de cor. Máscaras de imagem exigem mesma origem/CORS e falham em algumas hospedagens e em cache antigo. Confira no site publicado. Se o bloco aparecer lá também, é o mesmo problema.

**Proposta:** Trocar por um <img src="lib/logo.png"> (ou um SVG inline) com a cor aplicada por filtro, com uma variante para o tema claro. Assim a marca nunca fica em branco.

```css
<img class="mark logo" src="lib/logo.png" alt="">
.mark.logo{width:42px;height:21px;-webkit-mask:none;mask:none;background:none;
  filter:invert(72%) sepia(35%) saturate(520%) hue-rotate(2deg) brightness(92%)}
```

## P1 — consistência

### P1-1 · Select, checkbox, range e seletor de cor ainda são do navegador
**Tela:** Controles nativos

**Problema:** As setas dos selects, as checkboxes cinza do construtor, a bolinha azul do progresso da música e o campo "Cor na ficha" (um bloco ciano de 220px) são os únicos elementos que não falam a língua FFXIII. São eles que denunciam o "tema por cima".

**Proposta:** Seta do select em chevron de latão (SVG no background), checkbox quadrada com losango preenchido, range com trilho de 2px em degradê e cursor em losango, e amostra de cor 28×28 chanfrada ao lado do código hex.

```css
select{appearance:none;background-image:url("data:image/svg+xml,...chevron...");
  background-repeat:no-repeat;background-position:right 12px center;padding-right:34px}
input[type=checkbox]{appearance:none;width:16px;height:16px;box-shadow:inset 0 0 0 1px var(--line2);
  display:grid;place-items:center}
input[type=checkbox]:checked{box-shadow:inset 0 0 0 1px var(--brass);background:var(--sel-a)}
input[type=checkbox]:checked::after{content:"";width:7px;height:7px;background:var(--maq);transform:rotate(45deg)}
input[type=range]{accent-color:var(--brass)} /* mínimo; ideal: ::-webkit-slider-thumb em losango */
```

### P1-2 · Parágrafos de ajuda ainda em mono
**Tela:** Construtor · Status / Cálculos / Árvores

**Problema:** Os textos explicativos no topo de Status, Cálculos e Árvores, os estados vazios, as descrições dos cards de sistema e as dicas da mochila continuam em JetBrains Mono de 12px. São 3 a 5 linhas corridas, cansativas de ler e sem hierarquia contra os rótulos mono.

**Proposta:** Regra única: mono só em rótulos de até ~4 palavras, códigos e números. Todo parágrafo usa Hanken 14px, com line-height 1.6 e --ink-dim. Os termos em negrito viram --bone sem negrito.

```css
.tab-intro,.help-text,.hint,.empty p,.empty-cta p,.card-tile .desc,.sys-desc,.inv-hint{
  font-family:var(--serif) !important;font-size:14px;letter-spacing:0;line-height:1.6;
  text-transform:none;color:var(--ink-dim);max-width:68ch}
.tab-intro b,.help-text b{font-weight:500;color:var(--bone)}
```

### P1-3 · Cada selo de habilidade tem um estilo
**Tela:** Mesa · Habilidades

**Problema:** NÚCLEO tem contorno branco em negrito e PASSIVA, contorno ciano. Nenhum dos dois segue a paleta nem o selo da ficha. O nome e o selo também ficam colados, sem respiro.

**Proposta:** Selo tipográfico: losango de 6px + rótulo mono, sem caixa. Núcleo = latão preenchido, Passiva = contorno --ink-dim, Ativa = --carne. O selo vai para a direita da linha, alinhado ao topo.

```css
.skill-type{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px;
  letter-spacing:.14em;text-transform:uppercase;box-shadow:none;padding:0;margin-left:auto}
.skill-type::before{content:"";width:6px;height:6px;transform:rotate(45deg);background:currentColor}
.skill-type.passiva{color:var(--ink-dim)} .skill-type.passiva::before{background:none;box-shadow:inset 0 0 0 1px currentColor}
```

### P1-4 · As tags usam a cor crua do sistema
**Tela:** Mesa · capa do personagem

**Problema:** Classe, raça e região herdam a cor definida pelo Mestre: vermelho e amarelo saturados, 100% de opacidade na borda e no texto. Ficam brilhando mais que o nome do personagem e brigam entre si.

**Proposta:** Usar a cor do sistema só como acento: fundo em 12%, borda em 40%, traço de 2px à esquerda com a cor cheia e texto misturado com --bone. A hierarquia volta para o nome, e a cor continua identificável.

```css
.char-tag[style*="--tc"]{background:color-mix(in srgb,var(--tc) 12%,transparent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tc) 40%,transparent),inset 2px 0 0 var(--tc);
  color:color-mix(in srgb,var(--tc) 35%,var(--bone))}
/* no JS: trocar style="color:X;border-color:X" por style="--tc:X" */
```

### P1-5 · As barras de Vida/Psique são curtas demais
**Tela:** Mesa · Recursos

**Problema:** O trilho tem ~80px fixos, e sobra espaço vazio entre o rótulo e o valor. É o elemento mais importante da ficha e o menos legível: 1 ponto de dano quase não move a barra.

**Proposta:** Trilho com flex:1 (mínimo 120px), 6px de altura, marcações a cada 25% e o rastro fantasma de dano. O valor fica à direita, com largura fixa para não pular.

```css
.res-row{grid-template-columns:auto minmax(120px,1fr) 88px auto auto}
.res-track{height:6px;background:
  repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),var(--line2) 0 25%),var(--field)}
```

### P1-6 · Os slots de equipamento não dizem o que são
**Tela:** Mesa · Inventário

**Problema:** O tabuleiro mostra quadrados vazios idênticos, sem rótulo (cabeça, mão, tronco…), e ainda tem rolagem horizontal a 914px. O item equipado aparece só como texto branco, sem imagem nem raridade.

**Proposta:** Rótulo mono dentro de cada slot vazio, com ícone de silhueta a 30%. O tabuleiro escala para a largura (aspect-ratio + slots em %), e o slot ocupado ganha a faixa de raridade no topo.

```css
.eq-board{width:100%;max-width:560px;aspect-ratio:4/5;overflow:visible}
.eq-slot:empty::after{content:attr(data-label);font-family:var(--mono);font-size:9px;
  letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint)}
.eq-slot.filled{box-shadow:inset 0 2px 0 var(--rc,var(--brass)),inset 0 0 0 1px var(--line2)}
```

### P1-7 · As ações da linha têm o mesmo peso
**Tela:** Construtor · Classes

**Problema:** "CLASSE" (um tipo) parece botão igual a "EDITAR", e o X vermelho com contorno grita mais que o nome. A subclasse fica num campo recuado, solto e sem ligação visual com a classe mãe.

**Proposta:** O tipo vira selo tipográfico (sem caixa). Editar e excluir viram ícones de 32px que aparecem no hover/foco, e excluir só fica vermelho no hover. As subclasses ficam penduradas por uma linha guia vertical de latão.

```css
.cls-row .cls-actions{opacity:0;transition:opacity .2s}
.cls-row:hover .cls-actions,.cls-row:focus-within .cls-actions{opacity:1}
.btn.icon.danger{box-shadow:inset 0 0 0 1px var(--line2);color:var(--ink-dim)}
.btn.icon.danger:hover{color:var(--carne);box-shadow:inset 0 0 0 1px var(--carne)}
.sub-list{margin-left:22px;border-left:1px solid color-mix(in srgb,var(--brass) 40%,transparent);padding-left:16px}
```

### P1-8 · Criar mesa e Entrar em mesa não estão alinhados
**Tela:** Lobby · ações

**Problema:** Só o primeiro card tem os cantos .ffx-corners. O botão Entrar fica abaixo do campo, enquanto Criar fica ao lado, e o card da direita termina com ~130px de vazio. Parecem dois componentes diferentes.

**Proposta:** Mesmo esqueleto nos dois cards: título, texto e campo + botão na mesma linha, ancorados embaixo (margin-top:auto). Os cantos ficam no card primário, que é o Criar, e o Entrar fica sem cantos, de propósito.

```css
.action-card{display:flex;flex-direction:column}
.action-card .inline-form{margin-top:auto;flex-wrap:nowrap}
.action-card .inline-form input{flex:1 1 auto}
```

### P1-9 · A aba Árvores da ficha está vazia de informação
**Tela:** Mesa · Árvores

**Problema:** Um card com o nome da árvore e um botão "Ver árvore". Não mostra progresso, pontos disponíveis nem o que já foi liberado, e o texto ainda avisa que a funcionalidade é "de uma próxima fase".

**Proposta:** Card com uma miniatura do Crystarium (os anéis com os nós liberados acesos), a linha "7 de 32 nós · 3 pontos livres" em Fraunces e o CTA primário "Abrir Crystarium". Tire o aviso de "próxima fase" da interface.

## P2 — polimento

### P2-1 · Tema e ajuda ainda cobrem o canto dos cards
**Tela:** Botões flutuantes

**Problema:** Os botões fixos ficam sobre o canto do card Entrar e sobre a borda do estado vazio de Itens.

**Proposta:** Reservar a faixa: padding-bottom de 88px no .ffx-main. Ou, melhor, levar o tema para o menu do usuário (ele já está lá) e deixar só o "?" flutuante.

```css
.ffx-main{padding-bottom:88px}
.theme-fab{display:none} /* já existe em Menu do usuário → Tema */
```

### P2-2 · Contador "00" e dica redundante
**Tela:** Lobby · menu lateral

**Problema:** "00" em Itens lê como erro. A dica "Dúvidas? Toque no ? no canto da tela" repete o próprio botão e ocupa o espaço mais nobre do menu.

**Proposta:** Esconder o contador quando for zero (ou mostrar "—"). No lugar da dica, um bloco de atalho útil: "Última mesa: teste teste →".

```css
.ffx-menu .count[data-n="0"]{visibility:hidden}
```

### P2-3 · O botão de recolher invade a ficha
**Tela:** Mesa · entre colunas

**Problema:** O › fica flutuando sobre a borda direita da ficha, não do painel. Parece um elemento solto e cobre o fim das barras quando a ficha é estreita.

**Proposta:** Prender o botão à borda esquerda do painel de rolagem, como uma aba chanfrada (18×56) com o losango, que acompanha o painel ao recolher.

```css
.rail-toggle.right{right:calc(var(--dice-w) - 1px);width:18px;height:56px;
  background:var(--panel-solid);box-shadow:inset 0 0 0 1px var(--line2)}
```

### P2-4 · Os nomes de teste poluem todas as telas
**Tela:** Dados da conta

**Problema:** "CDP AuditFix Campaign 1785852264838" aparece em 8 mesas e em vários sistemas. Isso atrapalha avaliar o layout real, e seria o primeiro contato de qualquer pessoa que você chamar para testar.

**Proposta:** Apagar os registros de teste, ou criar uma conta de demonstração com 3 mesas e 2 sistemas com nomes e capas reais, para revisar e fazer screenshots.

---

## Prompt para o Claude Code

```
Leia CLAUDE.md, docs/DESIGN-FFXIII.md e docs/MELHORIAS-v1.3.md.
Execute só a seção P0, um item por vez. As mudanças vão numa nova seção "v1.3" no final de lib/theme-ffx.css.
Se um item exigir HTML/JS (ex.: P0-2 com os grupos do menu, P0-4 com o <img> do logo), faça a menor mudança possível e me diga o que mudou.
Os seletores do documento são sugestões: confira os nomes reais no HTML antes de aplicar.
Teste nos temas escuro e claro, com a janela em 900×540 e em 1440×900.
No final, liste cada item como "feito" ou "pendente + motivo" e suba o ?v= do theme-ffx.css em todas as páginas.
```
Depois, repita trocando "P0" por "P1" e, por último, por "P2".
