# Vitality — auditoria v1.5 (pós "Latão calmo" + chanfro + grafite)

Versão `muloos/vitality@main` (0d0fac3). Revisão logada em janela de ~914×540, temas escuro e claro.
Referência visual com prints marcados: `Revisao v4.dc.html`.
Não revisado: Crystarium, celular, abas Combate/Anotações/Árvores da mesa, a maior parte do construtor e o modal de detalhe do item.

## Já está bom
- Grafite aplicado nos dois temas, sem nenhum hex marrom sobrando.
- Nenhuma fonte abaixo de 11px, e reduced-motion / data-motion respeitados.
- Login novo, construtor em 3 etapas com progresso, e estados vazios padronizados.
- Chanfro com diagonal visível em cards, campos e botões.

## P0 — quebra ou confunde

### P0-1 · Enquanto carrega, a tela fica vazia
**Tela:** Lobby · carregando

**Problema:** Durante 1–3s o lobby é só a topbar: o avatar aparece como "?" em latão e o nome como "…". Não há skeleton, e parece que a página quebrou. O mesmo vale para a mesa e o construtor.

**Correção:** Aplicar o skeleton do sistema (§2.5 Feedback): 5 linhas no formato real da lista, com o menu lateral já desenhado. O avatar usa --surface-3 sem letra até ter dados. O "?" nunca aparece como avatar.

### P0-2 · O cartão do topo do histórico continua cortado
**Tela:** Mesa · painel de rolagens

**Problema:** Em todas as abas da mesa, o primeiro cartão visível aparece cortado sob as abas Rolagens/Conversa ("(Força)" solto, sem nome nem total). Foi apontado na v1.4 e segue igual.

**Correção:** padding-top de 12px no histórico e scroll-snap por cartão. Ao abrir, rolar até o fim e alinhar pelo cartão inteiro, não pelo pixel.

```css
.dice-log{padding-top:12px;scroll-snap-type:y proximity;scroll-padding-top:12px}
.dice-log > *{scroll-snap-align:start}
```

### P0-3 · Um item ocupa a coluna inteira, e clicar não abre o detalhe
**Tela:** Mesa · Inventário · mochila

**Problema:** O único item da mochila vira um card de ~410×430px, porque a grade não tem largura de coluna. Clicar no card não abriu o modal de detalhe novo no meu teste. Os efeitos de raridade só aparecem na grade, e aqui a imagem é substituída pelo placeholder.

**Correção:** Grade com repeat(auto-fill,minmax(168px,1fr)) e card de no máximo 232px, o mesmo componente da loja. O card inteiro é o alvo do clique e abre openItemDetail(). O × de remover sai do card e vai para o rodapé do detalhe.

```css
.inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:16px}
.inv-grid > .item-glow{max-width:232px}
```

### P0-4 · O item equipado vaza da caixa, e os slots não dizem o que são
**Tela:** Mesa · Inventário · equipamento

**Problema:** "Zweihander" aparece numa caixa branca pequena, com o nome estourando a borda. Os 6 slots são quadrados vazios iguais, sem rótulo (cabeça, mãos…), sobre uma textura de grade, que era um dos efeitos a remover.

**Correção:** O slot ocupado mostra a imagem (contain) + a faixa de 2px da raridade + o nome com clamp de 2 linhas. O slot vazio mostra o rótulo mono 11 + a silhueta a 30%. O fundo passa a ser --surface-1 liso.

```css
.eq-board{background:var(--surface-1) !important;background-image:none !important}
.eq-slot:empty::after{content:attr(data-label);font:11px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--text-3)}
```

### P0-5 · O "?" cobre conteúdo em todas as telas
**Tela:** Botão de ajuda flutuante

**Problema:** Ele fica em cima do texto da segunda checkbox do construtor, do chanfro das linhas de sistemas e da borda dos estados vazios. É um botão de 40px sempre por cima da área de leitura.

**Correção:** Levar "Ajuda" para o menu do usuário (topbar) e remover o flutuante. Se precisar manter, reservar a área com padding-bottom de 88px no conteúdo principal.

```css
.help-fab{display:none}
/* ou */ .ffx-main,.sys-main{padding-bottom:88px}
```

### P0-6 · O erro de login apagou o e-mail digitado
**Tela:** Login · erro

**Problema:** Depois de "E-mail ou senha incorretos", os dois campos voltaram para o placeholder. Obs.: eu preenchi os campos por script, então confirme digitando à mão. Se acontecer também, o usuário precisa redigitar tudo a cada tentativa.

**Correção:** Em erro, manter o e-mail, limpar só a senha e colocar o foco nela. A borda vermelha fica só no campo relevante (ou em nenhum, com o aviso acima).

## P1 — consistência

### P1-1 · O aviso de erro tem só um canto cortado
**Tela:** Chanfro · aviso

**Problema:** O aviso em linha do login corta só o canto inferior direito, e o superior esquerdo fica reto. Quebra a regra "todos os elementos com fundo, os dois cantos".

**Correção:** Aplicar .cf.cf-m + .cf-frame ao .notice (mesmo padrão dos cards). Conferir também .toast e .ui-modal.

```css
.notice{--cut:var(--cut-m)} /* + classes .cf .cf-frame */
```

### P1-2 · Checkbox quadrado e grande
**Tela:** Chanfro · checkbox

**Problema:** As checkboxes do construtor têm ~26px, são quadradas e sem chanfro. Pelo documento, deveriam ter 18px com chanfro XS e o losango quando marcadas.

**Correção:** appearance:none, 18×18, .cf-xs, moldura --border-strong. Marcada: fundo do latão a 16% + losango de 8px.

```css
input[type=checkbox]{appearance:none;width:18px;height:18px;--cut:var(--cut-xs)}
```

### P1-3 · Botões e campos lado a lado com alturas diferentes
**Tela:** Alturas de controle

**Problema:** "+ Subclasse" tem 32px ao lado de um campo de 40px. O mesmo acontece em "+ Criar pacote" e "+ Criar item no sistema". Os tops e as bases não alinham, e os chanfros ficam em alturas diferentes.

**Correção:** Uma altura só por contexto: 40px no desktop e 44px no toque. A variante "sm" (32px) só em toolbar densa, nunca ao lado de um campo.

```css
.btn.sm{height:40px}
```

### P1-4 · Três botões primários na mesma tela
**Tela:** Hierarquia · primários

**Problema:** Em Classes, "Publicar", "+ Subclasse" e "+ Criar classe" são todos latão cheio. O olho não sabe qual é a ação principal, e "Publicar" (a mais importante) perde força.

**Correção:** Na página, só o "Publicar" fica primário. "+ Criar classe" vira secundário, e "+ Subclasse" vira terciário ("+ Adicionar subclasse", só texto).

### P1-5 · Dois losangos por item e barra de rolagem nativa
**Tela:** Construtor · menu

**Problema:** O item ativo tem ◆ à esquerda, e cada item tem outro ◆/◇ à direita (configurado ou não). No Geral ativo aparecem os dois. A barra de rolagem cinza do sistema fica visível ao lado.

**Correção:** Um marcador por função: o ativo mostra só o traço de 2px + a superfície, e o losango à direita indica o progresso. Barra de rolagem fina e invisível em repouso.

```css
.sys-menu button.on::before{display:none}
.sys-side{scrollbar-width:thin;scrollbar-color:transparent transparent}
.sys-side:hover{scrollbar-color:var(--border) transparent}
```

### P1-6 · Logo repetido e nenhum indicador de salvamento
**Tela:** Construtor · topbar

**Problema:** Voltar + logo + nome do sistema disputam a esquerda, e o logo não serve de navegação aqui. Não há "Salvando…/Salvo", então o usuário não sabe se as edições foram guardadas.

**Correção:** Tirar o logo nesta tela (fica voltar + título). Colocar o indicador de salvamento à esquerda do "Publicar", como no documento (§3.4).

### P1-7 · Vão sob o título e rótulos de checkbox gigantes
**Tela:** Construtor · Geral

**Problema:** Sobram ~60px entre o H1 e a primeira seção. As checkboxes têm a explicação inteira no rótulo ("Usar peso/capacidade de carga — desativado, itens não mostram peso…"), que estoura a linha e some sob o "?".

**Correção:** Gap de 24px entre o H1 e a seção. Rótulo curto ("Usar peso e carga") + ajuda de 13px --text-3 na linha de baixo.

```css
.check-row{display:grid;grid-template-columns:18px 1fr;gap:4px 12px}
.check-row small{grid-column:2;font-size:13px;color:var(--text-3)}
```

### P1-8 · Linha de classe sem ações e com rótulo solto
**Tela:** Construtor · Classes

**Problema:** "Guerreiro" tem um ícone ⋮⋮ e "CLASSE" em mono no meio-direito, sem editar/excluir visíveis. "CLASSE" repete o que o título da página já diz.

**Correção:** Tirar o rótulo "CLASSE". À direita, a meta "2 subclasses · +3 FOR" + chevron, e o clique abre o editor lateral (como em Status). As subclasses ficam penduradas numa linha guia.

### P1-9 · × de excluir no card e "NÃO" em caixa alta
**Tela:** Construtor · Itens

**Problema:** O × no canto do card é uma ação destrutiva a um clique de distância, no lugar onde o usuário clica para abrir. O texto grita "NÃO altera", e o botão primário pequeno fica solto entre o texto e a grade.

**Correção:** Excluir só no rodapé do detalhe, com confirmação. O texto vira "Editar aqui não altera o item original da sua biblioteca." "+ Criar item" passa a ser secundário, de 40px, no cabeçalho da seção.

### P1-10 · Tags ainda com cor crua e em 4 linhas de mono
**Tela:** Mesa · cabeçalho

**Problema:** Combatente, Atacante e África usam a borda vermelha e amarela saturada do sistema, e todas as tags estão em mono maiúsculo. Com 7 tags, o cabeçalho vira 4 linhas que competem com o nome.

**Correção:** Tags em Hanken 13, sem caixa alta, com fundo --surface-2 e a cor do sistema só como traço de 2px à esquerda (§2.1). Nível e idade saem das tags e vão para a linha de meta ("Nível 1 · 12 anos · Masculino").

```css
.char-tag{font:500 13px var(--font-sans);text-transform:none;letter-spacing:0;background:var(--surface-2);box-shadow:inset 2px 0 0 var(--tc,transparent)}
```

### P1-11 · Borda lateral colorida reta entrando no chanfro
**Tela:** Mesa · Habilidades

**Problema:** Os cards de habilidade têm uma faixa vertical branca (Núcleo) ou verde-água (Passiva) à esquerda. Ela encontra o corte diagonal e fica torta, e é o único componente com esse padrão.

**Correção:** Tirar a faixa. O tipo já aparece no selo à direita (◆ NÚCLEO / ◇ PASSIVA). Se precisar de cor, usar a faixa de 2px no topo, como nos itens.

```css
.skill-card{border-left:0 !important;box-shadow:none}
```

### P1-12 · Formulário com rótulos à esquerda e bônus numa caixa mono
**Tela:** Mesa · Biografia

**Problema:** Nome, Idade e Sexo usam rótulo à esquerda, contra o padrão "rótulo acima" usado em todo o resto. Os bônus da classe ficam numa caixa mono maiúscula de 2 linhas ("CARISMA +2 · CONSTITUIÇÃO +6…"), difícil de ler.

**Correção:** Rótulo acima em todos os campos, e Idade + Sexo lado a lado. Os bônus viram uma grade de selos "FOR +9" (mono 11) ou uma lista de 2 colunas "Força … +9".

### P1-13 · O selo "+2" encosta no rótulo
**Tela:** Mesa · Status

**Problema:** Em Carisma, o bônus "+2" fica colado ao "CARISMA", no canto superior direito. Em nomes longos (CONSTITUIÇÃO) ele cobriria o texto. Os cards também não indicam que dá para rolar.

**Correção:** O bônus vai para a linha do número ("4 +2", em --success 13px). No hover, borda latão + "Rolar 1d20+4" (§3.3).

### P1-14 · Ataque sem sinal, e perícias num estilo diferente
**Tela:** Mesa · Combate e Perícias

**Problema:** "Ataque (Força) 9" deveria ser "+9", porque é modificador e não total. As perícias estão em 1 coluna, com rótulo em 13px/600, enquanto o Combate usa 14px regular. Com todas em 0, nenhuma se destaca.

**Correção:** Modificadores sempre com sinal. Perícias em 2 colunas, com a mesma linha "Nome …… valor" do Combate. O 0 fica em --text-3 e os valores diferentes de 0 em --text/latão.

### P1-15 · Busca sozinha numa linha, e um vão grande
**Tela:** Lobby · Mesas

**Problema:** A busca tem ~240px numa linha própria, entre as abas e a lista, e sobram ~40px de vazio acima e abaixo dela. A lista começa na metade da tela.

**Correção:** Levar a busca para a linha das abas, alinhada à direita (§3.2), com 280px e 36px de altura.

### P1-16 · Meta quebra com "·" órfão, e as linhas variam de altura
**Tela:** Lobby · linhas de mesa

**Problema:** Quando o nome do sistema é longo, "· Código CF6D88" cai para a 2ª linha começando pelo separador. As linhas ficam com 72px ou 88px de altura.

**Correção:** Meta em uma linha com reticências. O código vai para o selo à direita (Mestre) ou sai. Altura fixa de 72px.

```css
.list-row .meta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
```

### P1-17 · Títulos desalinhados e descrição cortada no meio
**Tela:** Lobby · Loja de sistemas

**Problema:** O selo DESTAQUE empurra o título do 1º card 18px para baixo, e os dois títulos não alinham. A descrição para no meio da frase ("contra o Valor"), sem reticências. "por claude test" está em mono minúsculo.

**Correção:** Selo posicionado sobre a borda superior (absolute, top:-10px), fora do fluxo. line-clamp:3 com reticências. O autor em Hanken 13 --text-3.

```css
.card-tile .desc{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-tile .badge-destaque{position:absolute;top:-10px;left:16px}
```

### P1-18 · Linhas de sistema não parecem clicáveis
**Tela:** Lobby · Meus sistemas

**Problema:** Ao contrário das mesas, não têm avatar, chevron nem estado de hover visível. Parecem texto numa caixa.

**Correção:** O mesmo componente das mesas: avatar (monograma), nome, a meta "3 status · 1 classe", o selo "Publicado" e o chevron.

### P1-19 · Rótulo "MENU", dois indicadores de ativo e dica em mono
**Tela:** Lobby · menu lateral

**Problema:** "MENU" não informa nada. Em Sistemas > Loja, o pai tem fundo + ◆ e o sub-item tem um traço vertical: dois ativos. A dica "Dúvidas? Toque no ?" continua em mono e repete o botão.

**Correção:** Tirar "MENU" e a dica. O pai fica só em texto --text, e o ativo real (o sub-item) recebe a superfície + o traço.

## P2 — acabamento e código

### P2-1 · "Nível 1 ·" com separador órfão
**Tela:** Mesa · coluna esquerda

**Problema:** A meta do personagem quebra depois do "·".

**Correção:** Duas linhas explícitas (Classe / Nível) ou nowrap com reticências.

### P2-2 · Hífen no lugar do sinal de menos
**Tela:** Mesa · Recursos

**Problema:** Os botões mostram "-" (hífen), mais curto e fino que o "+" ao lado.

**Correção:** Usar "−" (U+2212) ou ícones de traço de 1.5px, e o mesmo em Status.

### P2-3 · O botão de recolher continua solto sobre a ficha
**Tela:** Mesa · entre colunas

**Problema:** Fica flutuando na borda do card do personagem.

**Correção:** Prender à borda esquerda do painel de rolagens (§P2-3 da v1.4).

### P2-4 · Cursor de volume redondo
**Tela:** Barra de música

**Problema:** É o único círculo da interface, fora o spinner.

**Correção:** Cursor em losango de 10px, igual ao do progresso.

```css
input[type=range]::-webkit-slider-thumb{border-radius:0;transform:rotate(45deg)}
```

### P2-5 · "VTT · MESA VIRTUAL" e saudação em caixa alta
**Tela:** Topbar e textos

**Problema:** A assinatura da topbar continua. "LOBBY · OLÁ, CLAUDE TEST" grita o nome do usuário em mono maiúsculo.

**Correção:** Tirar a assinatura. O eyebrow fica só "Lobby", e a saudação (se ficar) vai em Hanken 13 sem caixa alta.

### P2-6 · Duas camadas de estilo ainda brigando
**Tela:** Código

- **135**: !important somados (94 só no theme-ffx.css)
- **53**: clip-path fora do components.css (36 no theme-ffx)
- **47**: @keyframes, com dois sistemas de raridade em paralelo (pc-* e rar*)
- **3 · 8**: alert/confirm nativos · emoji no sistema.html

**Problema:** O theme-ffx.css ainda tem 1.014 linhas e chanfros próprios, e o components.css precisa de !important para vencer. As animações de raridade antigas (pc-*) continuam ao lado das novas (rarPulse, glowDouble…), e é daí que vêm as inconsistências de chanfro e de estado.

**Correção:** Mover o que resta do theme-ffx.css para components.css (ou para @layer legacy) e apagar o arquivo. Apagar as keyframes pc-*, vt*, ffx*. Trocar os 3 alert/confirm pelo diálogo e os 8 emoji por ícones.

---

## Prompt para o Claude Code
```
Leia docs/DESIGN-v2-LATAO-CALMO.md, docs/VITALITY-FORMA-COR-ITENS.md e docs/MELHORIAS-v1.5.md.
Execute a seção P0 (itens P0-1 a P0-6), um item por vez, e pare no fim para eu ver.
Os seletores do documento são sugestões: confira os nomes reais no HTML/JS antes de aplicar.
P0-6 (login apagando o e-mail): primeiro reproduza digitando à mão; se não acontecer, me avise e pule.
Teste nos temas escuro e claro, em 1440×900, 900×540 e 390×844.
No fim, liste cada item como "feito" ou "pendente + motivo" e informe a contagem de !important e de clip-path fora do components.css.
```
Depois, repita com P1 e, por último, com P2. O P2-6 (apagar o theme-ffx.css) deve ser um commit separado.
