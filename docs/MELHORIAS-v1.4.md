# Vitality — auditoria completa de UI/UX (v1.4)

Versão `vitality v2 260726` com os patches v1.1 a v1.3. Revisão feita logada, em janela de ~914×540, nos temas escuro e claro.
Telas revisadas: Lobby (Mesas/Sistemas/Itens), Mesa (8 abas + painel de rolagem), Construtor (13 abas), Crystarium, além de uma varredura no código.
Não revisado: login, celular e nós da árvore (WebGL).
Versão visual com prints marcados: `Revisao v3.dc.html`.

## P0 — quebra ou confunde

### P0-1 · O menu some ao rolar, e o fundo termina numa linha reta
**Tela:** Lobby · Sistemas/Itens

**Problema:** No lobby, o menu lateral não é fixo (sticky): ao rolar a lista de sistemas, a coluna da esquerda fica vazia. A camada de textura/degradê do fundo tem altura fixa, então aparece um corte horizontal quando a página passa da primeira dobra. No construtor e na mesa o menu é fixo, e no lobby não.

**Proposta:** Deixar o .ffx-side fixo (sticky) com top igual à altura da topbar, como no construtor. O fundo passa para uma camada fixa (position:fixed; inset:0), sem depender da altura do conteúdo.

```css
body.home-page .ffx-layout > .ffx-side{position:sticky;top:calc(var(--nav-h,58px) + 24px);align-self:start;
  max-height:calc(100vh - var(--nav-h,58px) - 48px);overflow:auto}
body::before{position:fixed !important;inset:0 !important;height:auto !important}
```

### P0-2 · O primeiro cartão do histórico aparece cortado
**Tela:** Mesa · painel de rolagem

**Problema:** O histórico abre rolado para o fim, mas o topo do cartão mais antigo fica sob as abas: aparece "…SILVA" e o horário encavalado. O nome longo do personagem também quebra em duas linhas e colide com a coluna "1d20+FOR · 00:37".

**Proposta:** Adicionar padding-top ao histórico e scroll-snap por cartão, para nunca mostrar meio cartão. No cabeçalho do cartão, o nome vai numa linha própria com reticências, e o tipo + horário numa segunda linha menor.

```css
.dice-log{padding-top:10px;scroll-snap-type:y proximity}
.dice-log > *{scroll-snap-align:start}
.log-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px}
.log-head .who{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
```

### P0-3 · No tema claro, a árvore vira um cinza chapado
**Tela:** Crystarium · tema claro

**Problema:** O fundo do canvas usa um escurecimento semitransparente sobre o fundo creme, e o resultado é #777 sem profundidade. Os anéis brancos perdem contraste, e a tela parece travada ou desabilitada.

**Proposta:** A árvore é uma "sala escura": manter o canvas sempre no tema escuro, mesmo com o tema claro ativo, e só a topbar e os controles seguem o tema. É o mesmo que um jogo faz com o mapa. Se preferir um Crystarium claro, crie uma paleta própria: fundo #efe7d8, anéis --line2 e nós em oklch com L 55%.

```css
html[data-theme="light"] .tree-stage,html[data-theme="light"] #canvas-wrap{
  --app-bg:#0c0906;background:#0c0906;color-scheme:dark}
/* arvore.js: ler cores do canvas de um objeto DARK fixo, não de getComputedStyle */
```

### P0-4 · Os controles − / + do status quase não aparecem
**Tela:** Mesa · Status

**Problema:** Os botões de distribuir pontos têm texto --ink-faint sobre fundo quase igual (≈1.6:1). Com 0 pontos eles continuam na tela, parecendo desabilitados sem explicação, e fazem cada cartão ficar 40% mais alto.

**Proposta:** Com 0 pontos para distribuir, esconder os controles e deixar o cartão mais baixo (rótulo + número). Com pontos, mostrar só o "+" em latão, com o contador "3 pontos" acima da grade. O "−" só aparece nos pontos gastos nesta sessão.

```css
.stat-tile .stat-ctl{display:none}
.has-points .stat-tile .stat-ctl{display:flex}
.stat-ctl .plus{color:var(--maq);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brass) 50%,transparent)}
```

### P0-5 · O ícone × no título "Combate" parece um botão de fechar
**Tela:** Mesa · Combate

**Problema:** O ícone de espadas cruzadas, nesse tamanho, vira um "×" — o sinal universal de fechar/remover. Logo abaixo, os subtítulos Defesas (azul), Ataques (rosa) e Testes (verde) usam cores fora da paleta, cada um com um ícone de lista.

**Proposta:** Tirar o ícone do eyebrow. Nenhum outro título de seção da ficha tem ícone, então esse fica igual aos outros. Os subtítulos usam --ink-faint mono com um losango ◇ e voltam para a mesma cor. Se a cor tiver função, vira um traço de 2px na lateral de cada grupo, e não o texto.

```css
.combat-cat{color:var(--ink-faint) !important;display:flex;align-items:center;gap:8px}
.combat-cat::before{content:"";width:5px;height:5px;box-shadow:inset 0 0 0 1px currentColor;transform:rotate(45deg)}
.combat-cat svg,.section-title.combat svg{display:none}
```

### P0-6 · O item selecionado fica escondido no fim do menu
**Tela:** Construtor · menu

**Problema:** Ao abrir Nível (ou Itens), o item ativo fica cortado na borda de baixo do menu, que agora rola sozinho. O usuário não vê onde está.

**Proposta:** Ao trocar de aba, rolar o menu até o item ativo (menu.scrollTop, sem scrollIntoView) e colocar uma máscara de degradê de 24px no topo e embaixo, indicando que há mais itens.

```css
.ffx-side{mask-image:linear-gradient(transparent,#000 24px,#000 calc(100% - 24px),transparent)}
/* JS: const b=menu.querySelector(".on"); menu.scrollTop=b.offsetTop-menu.clientHeight/2 */
```

## P1 — consistência

### P1-1 · Três barras de rolagem visíveis ao mesmo tempo
**Tela:** Mesa · 3 colunas

**Problema:** Menu, ficha e histórico mostram a barra de rolagem o tempo todo, cada uma com o trilho e as setinhas do sistema. São três linhas verticais extras que competem com as divisórias das colunas.

**Proposta:** Barras de 4px, invisíveis em repouso, aparecendo em latão no hover/foco da coluna. O menu da esquerda cabe na altura na maioria das telas, então use overflow só quando for necessário.

```css
.mesa-rail-left,.mesa-main,.dice-log{scrollbar-width:thin;scrollbar-color:transparent transparent}
.mesa-rail-left:hover,.mesa-main:hover,.dice-log:hover{scrollbar-color:var(--line2) transparent}
::-webkit-scrollbar-button{display:none}
```

### P1-2 · "= 16" e um cartão órfão na grade de combate
**Tela:** Mesa · Combate

**Problema:** O sinal "=" antes de cada valor não informa nada e empurra o número. Resistência Social fica sozinha numa linha inteira, quebrando o ritmo da grade 2×2.

**Proposta:** Tirar o "=". O número vai em Fraunces à direita, e quem tem fórmula mostra a fórmula no tooltip (title). Na grade, auto-fill com minmax(180px,1fr), e o cartão que sobrar fica na largura de uma coluna.

```css
.combat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.combat-val .eq{display:none}
```

### P1-3 · As perícias viram uma nuvem de chips difícil de ler
**Tela:** Mesa · Perícias

**Problema:** Os 13 chips de larguras diferentes quebram em linhas irregulares, e os valores ficam em posições diferentes em cada linha. Para achar "Percepção" é preciso ler tudo.

**Proposta:** Lista de 2 colunas em ordem alfabética: nome à esquerda, valor mono alinhado à direita, linha pontilhada entre os dois (como índice de livro). O valor 0 fica em --ink-faint e os outros em latão, para destacar as perícias treinadas.

```css
.skills{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0 24px}
.skill-chip{display:flex;gap:8px;background:none;padding:7px 0;border-bottom:1px dotted var(--line)}
.skill-chip .v{margin-left:auto;font-family:var(--mono)}
.skill-chip .v[data-v="0"]{color:var(--ink-faint)}
```

### P1-4 · Um destaque grande para dizer "0"
**Tela:** Mesa · Pontos de status

**Problema:** O bloco "Pontos de status 0" tem fundo de latão e borda lateral, e aparece mesmo sem nada para distribuir. É o elemento mais chamativo do meio da ficha e não tem ação. A borda lateral colorida também é um tique visual que o guia evita.

**Proposta:** Com 0 pontos, esconder o bloco. Com pontos, levá-lo para o topo da grade de Status como uma linha de ação: "◆ 3 pontos para distribuir", com o + ativado nos cartões e brilho de latão (vtPulse) uma vez.

```css
.points-card[data-n="0"]{display:none}
.points-card{border-left:0 !important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--brass) 40%,transparent)}
```

### P1-5 · Meus sistemas em cards enormes, e as mesas em linhas
**Tela:** Lobby · Meus sistemas

**Problema:** Cada sistema ocupa um card de 175px com só o título e "Abrir construtor →", e ~60% do card fica vazio. As mesas já viraram linhas. Os dois são "minhas coisas" e deviam ter o mesmo padrão.

**Proposta:** Usar .list-row também para Meus sistemas: nome, a meta "3 status · 1 classe · 0 árvores" e o selo "Publicado" quando estiver na loja. Deixar cards só para a Loja, onde a capa e a descrição importam.

### P1-6 · Descrição cortada no meio e "outros criadores" que é você
**Tela:** Lobby · Loja de sistemas

**Problema:** As descrições são cortadas por altura fixa e param no meio da frase ("contra o Valor"), sem reticências. O título diz "Publicados por outros criadores", mas os dois cards são "por claude test".

**Proposta:** Usar line-clamp:3 com reticências. O título vira "Sistemas publicados". Nos seus sistemas, trocar "por claude test" pelo selo "Seu" e esconder o coração de favoritar, porque não faz sentido favoritar o próprio sistema.

```css
.card-tile .desc{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;height:auto}
```

### P1-7 · O eyebrow repete o título, e o menu tem dois eyebrows
**Tela:** Construtor · todas as abas

**Problema:** Embaixo do H1 "Cálculos" vem a seção "CÁLCULOS". O mesmo acontece em Combate, Classes e Nível. No menu, "CONSTRUTOR" e "REGRAS" ficam empilhados.

**Proposta:** Quando só existe um bloco, tirar o eyebrow da seção e deixar o texto de ajuda logo abaixo do H1. No menu, tirar "CONSTRUTOR", porque a topbar já diz "Construtor de sistema".

```css
.tab-pane > .section-title:first-child:only-of-type{display:none}
.ffx-side > .ffx-label:first-child{display:none}
```

### P1-8 · O texto dos estados vazios ainda está em mono
**Tela:** Estados vazios

**Problema:** A regra "mono só em rótulos curtos" do v1.3 pegou os parágrafos de ajuda, mas não o .empty p. São 3 linhas centralizadas em JetBrains 11px, e o mesmo em "Nenhum combate em andamento" e "Nenhuma fórmula ainda".

**Proposta:** .empty p em Hanken 14px com --ink-dim e largura máxima de 46ch. Sempre que houver uma ação óbvia, o estado vazio ganha um botão ghost ("Ir para Status →").

```css
.empty p,.empty-cta p,.empty > div:not(.ec-icon){font-family:var(--serif) !important;font-size:14px !important;
  letter-spacing:0 !important;text-transform:none !important;line-height:1.6;max-width:46ch;margin-inline:auto}
```

### P1-9 · As sub-abas de Itens usam outro componente
**Tela:** Construtor · Itens

**Problema:** Itens / Moedas / Tipos de dano / Biblioteca / Importar pacote viraram um seletor horizontal com a aba ativa preenchida em latão. É pesado, "Importar pacote" quebra em 2 linhas e não segue o padrão de sub-itens do menu vertical usado no lobby. O card do item mostra o código "#40F049", que é informação de desenvolvedor.

**Proposta:** Levar essas 5 opções para o menu lateral como sub-itens (.sub) de "Itens", igual Loja/Favoritos/Criar no lobby. Se preferir manter no conteúdo, use abas sublinhadas (como Rolagens/Conversa). Esconder o hex no card.

```css
.item-subtabs .seg button.on{background:none;color:var(--bone);box-shadow:inset 0 -2px 0 var(--brass)}
.poster-card .hex,.idet-hex{display:none}
```

### P1-10 · A linha de condição mistura 5 tipos de controle
**Tela:** Construtor · Condições

**Problema:** Na mesma linha estão o ícone, um botão "•" sem significado, o nome, uma amostra de cor de 36px, "Modificadores ▾" e um × vermelho sempre visível. A cor rosa chapada é o elemento mais forte da tela.

**Proposta:** A ordem vira: arrastar · ícone numa amostra de 32px chanfrada (a cor da condição é o fundo do ícone, em 25%) · nome · descrição embaixo. As ações (Modificadores, excluir) ficam à direita e aparecem no hover. Tirar o "•" ou dar a ele um rótulo claro.

```css
.cond-row .cond-color{width:28px;height:28px;clip-path:polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)}
.cond-row .actions{opacity:0}.cond-row:hover .actions,.cond-row:focus-within .actions{opacity:1}
```

### P1-11 · Plural errado, placeholder cortado e card vazio
**Tela:** Lobby · Criar / Entrar

**Problema:** A meta mostra "1 classes · 1 itens" e quebra em 2 linhas. O placeholder "CÓDIGO (EX.: A1B2C3" está em mono maiúsculo e cortado, enquanto "Nome da mesa", ao lado, está em sans. O card Entrar tem ~40% de altura vazia.

**Proposta:** Pluralizar em JS (1 classe / 2 classes). Placeholder "A1B2C3", com o rótulo "Código de convite" acima (igual ao "Sistema da campanha" do outro card). Isso também preenche o vazio e alinha os dois campos na mesma altura.

```css
/* JS */ const pl=(n,s,p)=>n+" "+(n===1?s:p);
/* pl(1,"classe","classes") · pl(0,"árvore","árvores") */
```

### P1-12 · Símbolos sem legenda e linhas com informação diferente
**Tela:** Lobby · Minhas mesas

**Problema:** O losango vazado (Jogador) e o cheio (Mestre) repetem o que o selo à direita já diz. Em uma linha o subtítulo é "Entrar na mesa →", nas outras é "Código: 886D24". A miniatura com fundo branco quebra a unidade visual da lista.

**Proposta:** Tirar o losango, porque o selo já basta. O subtítulo segue sempre o mesmo formato: "Sistema · N jogadores · última sessão há 2 dias", com o código só no Mestre. Miniaturas com mix-blend ou uma moldura escura de 1px.

```css
.list-row .row-diamond{display:none}
.list-row .mesa-av img{background:var(--panel-solid)}
```

### P1-13 · "NOVO SLOT", item em caixa branca e rolagem lateral
**Tela:** Mesa · Inventário

**Problema:** Os slots mostram "NOVO SLOT", o nome padrão que o Mestre não trocou, visível para o jogador. A Zweihander aparece num quadrado branco, destoando de tudo. O tabuleiro continua com rolagem horizontal a 914px.

**Proposta:** Um slot sem nome não mostra rótulo nenhum, só a silhueta. O item equipado usa a imagem sobre --panel-solid com a faixa de raridade. O tabuleiro escala para a largura (width:100%; aspect-ratio).

```css
.eq-slot[data-label="Novo slot"]::after{content:""}
.eq-slot .eq-slot-item{background:var(--panel-solid);box-shadow:inset 0 2px 0 var(--rc,var(--brass))}
.eq-board{width:100%;height:auto;aspect-ratio:4/5;overflow:hidden}
```

### P1-14 · Legenda neon, cantos arredondados e nome em caixa alta
**Tela:** Crystarium · interface

**Problema:** A legenda usa bolinhas saturadas (rosa, verde e ciano puros) que não são as cores oklch do guia, e fica numa caixa arredondada. Os grupos de controle também são arredondados. Nesta página, o nome do usuário aparece em "CLAUDE TEST", diferente das outras. A poeira de partículas passa por cima da legenda.

**Proposta:** Legenda com losangos nas cores oklch da via, painel chanfrado e recolhível ("Legenda ▾"). Controles no mesmo painel chanfrado da topbar. Usar o .nav-user padrão. Canvas de partículas com z-index abaixo da UI.

```css
.tree-legend,.tree-ctrls,.tree-ctrls > *{border-radius:0 !important;clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}
.tree-legend i{border-radius:0;transform:rotate(45deg) scale(.8)}
.nav-user .name{text-transform:none;letter-spacing:0}
```

### P1-15 · O player ainda parece outro app
**Tela:** Barra de música

**Problema:** O título aparece em sans negrito, o trilho de progresso some no tema escuro (só aparece no claro) e o volume usa a bolinha nativa. A barra fica colada nas colunas, sem linha divisória.

**Proposta:** Título em Fraunces 14px, artista em mono --ink-faint. Trilho de 2px sempre visível (--line2) com o degradê de latão e cursor em losango, igual ao volume. Linha de latão de 1px no topo da barra.

```css
#yt-bar{border-top:1px solid color-mix(in srgb,var(--brass) 35%,transparent)}
#yt-bar .title{font-family:var(--disp);font-weight:400}
#yt-bar .track{background:var(--line2) !important;height:2px}
```

### P1-16 · O botão de tema aparece em uma página e em outra não
**Tela:** Botões flutuantes

**Problema:** No construtor aparecem ☼ e ?. No lobby, só ?. Na mesa, nenhum. O usuário não sabe onde trocar o tema.

**Proposta:** Um lugar só: Menu do usuário → Tema (já existe). Tirar o ☼ de todas as páginas. O ? continua flutuando em todas, menos na mesa, onde a ajuda vai para o menu Sistema.

```css
.theme-fab{display:none !important}
```

### P1-17 · O card de classe é um bloco vermelho
**Tela:** Mesa · Biografia

**Problema:** A cor da classe pinta a borda de cima, o fundo e a faixa dos bônus em vermelho. Os bônus ficam em mono sobre fundo vermelho escuro (contraste ≈3.8:1). Num sistema com classe amarela ou verde, a biografia muda de cara.

**Proposta:** Mesmo tratamento das tags (v1.3): a cor só como acento (faixa de 2px no topo + nome da classe). Fundo --panel-2, e os bônus como selos mono com contorno.

```css
.class-block{background:var(--panel-2) !important;box-shadow:inset 0 2px 0 var(--cc),inset 0 0 0 1px var(--line2)}
.class-block .bonus{background:none;color:var(--ink-dim)}
```

## P2 — sistema e acabamento

### P2-1 · Texto pequeno demais em muitos lugares
**Tela:** Tipografia · código

- **74**: declarações entre 9 e 10px
- **7px**: menor tamanho encontrado
- **11px**: piso recomendado para mono maiúsculo

**Problema:** Mono maiúsculo com espaçamento largo precisa de mais tamanho para ser legível, não menos. Em 9–10px, "VTT · MESA VIRTUAL", os rótulos de campo e os metadados do histórico ficam no limite da leitura, principalmente em telas de baixa densidade.

**Proposta:** Uma escala fechada com 5 passos: 11 (rótulo mono), 13 (meta), 14.5 (corpo), 18 (subtítulo), 26/40/56 (display). Substituir tudo abaixo de 11px por 11px. Os rótulos longos passam a ter espaçamento de .18em em vez de .3em.

```css
:root{--fs-label:11px;--fs-meta:13px;--fs-body:14.5px;--fs-sub:18px}
/* buscar font-size:(7|8|9|9.5|10|10.5)px e trocar por var(--fs-label) */
```

### P2-2 · Pequenas variações somam ruído
**Tela:** Tokens · código

- **77**: cores hex diferentes nos dois CSS
- **11**: durações de transição diferentes (.1s a .45s)
- **17**: valores de z-index diferentes

**Problema:** Muitas cores quase iguais, 11 velocidades de animação e 17 camadas de z-index. Cada ajuste novo inventa um valor, e é isso que faz a interface parecer "quase" consistente.

**Proposta:** Três durações (--t-fast 120ms, --t 200ms, --t-slow 360ms) com um easing. Uma escala de z (base 1, sticky 10, drawer 40, overlay 80, modal 100, toast 120). Reduzir para ~24 cores nomeadas e trocar os hex soltos pelos tokens.

```css
:root{--t-fast:120ms;--t:200ms;--t-slow:360ms;--ease:cubic-bezier(.2,.7,.2,1);
  --z-sticky:10;--z-drawer:40;--z-overlay:80;--z-modal:100;--z-toast:120}
```

### P2-3 · Campos sem rótulo e diálogos nativos
**Tela:** Acessibilidade · código

- **91**: campos só com placeholder, sem rótulo acessível
- **5**: botões só com ícone sem nome (Crystarium)
- **3**: alert()/confirm() nativos do navegador
- **15**: emoji em mesa e construtor

**Problema:** O leitor de tela anuncia só "campo de texto" nos campos com placeholder, e o placeholder some ao digitar. Os diálogos alert/confirm quebram a imersão, com uma caixa cinza do sistema no meio da mesa. Emoji destoam dos ícones de traço.

**Proposta:** aria-label em todo campo sem <label>. Trocar alert/confirm pelo .ui-modal que já existe (lib/ui.js tem ui.confirm?). Trocar os emoji por ícones do mesmo conjunto de traço. Nos 5 botões + / − / ⊙ / Anéis / Poeira, colocar aria-label e title.

```css
<!-- exemplo -->
<input placeholder="Nome da mesa" aria-label="Nome da mesa">
<button class="z-in" aria-label="Aproximar" title="Aproximar">+</button>
```

### P2-4 · A capa sem retrato é só um "A"
**Tela:** Mesa · capa

**Problema:** Sem imagem, a capa mostra um "A" grande num campo listrado. A tag de região aparece cortada ("Centro, os reinos da floresta e…") e não tem tooltip.

**Proposta:** Retrato vazio vira um CTA: silhueta + "Adicionar retrato" (para o dono), ou o monograma em Fraunces com a cor da classe a 20%. Tags cortadas ganham title com o texto inteiro.

```css
<span class="char-tag" title="Centro, os Reinos da Floresta e do Rio">…</span>
```

### P2-5 · Assinatura ilegível e zeros à esquerda
**Tela:** Topbar e contadores

**Problema:** "VTT · MESA VIRTUAL" em 9px com espaçamento .3em é praticamente decorativo. Os contadores "09" e "11" com zero à esquerda parecem códigos, não quantidades.

**Proposta:** Tirar a assinatura da topbar ou subir para 11px --ink-dim. Contadores sem zero à esquerda (9, 11), em mono --ink-faint e só no hover/ativo, como nos menus da FFXIII.

```css
.brand small{font-size:11px;letter-spacing:.18em;color:var(--ink-dim)}
```

---

## Prompt para o Claude Code

```
Leia CLAUDE.md, docs/DESIGN-FFXIII.md e docs/MELHORIAS-v1.4.md.
Execute só a seção P0 (itens P0-1 a P0-6), um item por vez. O CSS vai numa nova seção "v1.4" no final de lib/theme-ffx.css.
Os seletores do documento são sugestões: antes de aplicar, confira os nomes reais no HTML/JS.
Para mudanças de JS (P0-2 histórico, P0-4 pontos, P0-6 rolar menu), faça a menor alteração possível e não use scrollIntoView.
Teste nos temas escuro e claro, com a janela em 900×540 e em 1440×900.
No final, liste cada item como "feito" ou "pendente + motivo" e suba o ?v= do theme-ffx.css em todas as páginas.
```
Depois, repita com P1 e, por último, com P2. P2-1 (tipografia) e P2-2 (tokens) mexem no projeto inteiro: faça num commit separado.
