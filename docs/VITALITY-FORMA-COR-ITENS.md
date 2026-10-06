# Vitality v2 — Forma, cor e itens (decisões finais)

> Este documento **substitui** o `docs/ITENS-FORMA-COR.md` e **altera** o `docs/DESIGN-v2-LATAO-CALMO.md` nos três pontos abaixo. No resto, o DESIGN-v2 continua valendo.
> Referência visual dos itens: `Vitality v2 - Itens, Forma e Cor.dc.html`, seção 3.

Decisões do dono do produto:
1. **Forma:** tudo chanfrado, com o mesmo padrão em todos os elementos.
2. **Cor:** grafite quente + latão.
3. **Itens:** exatamente como na referência visual.

---

## 1. Forma: tudo chanfrado, sem exceção

### 1.1 Regra
Todo elemento com fundo ou borda tem os cantos **superior esquerdo e inferior direito** cortados a 45°. Nenhum elemento é arredondado e nenhum fica reto ao lado de um chanfrado.

| Tamanho | `--cut` | Onde |
|---|---|---|
| XS | 4px | checkbox, selo/badge, chip de perícia, contador de não lidas, amostra de cor |
| S | 6px | botão (todas as variantes), campo, select, textarea, botão de ícone, avatar ≤ 44px, item do menu ativo, segmentado, toast |
| M | 12px | card, linha de lista, painel, aviso em linha, skeleton, estado vazio, cartão do histórico, célula de status, retrato ≥ 96px |
| L | 18px | modal, folha inferior (só o canto superior esquerdo), painel lateral de edição |

- **Exceções** (sem fundo próprio, então sem chanfro): texto, links, botão terciário, abas sublinhadas, divisórias, barras de progresso (trilho de 2–8px) e o spinner (círculo).
- **Regra de aninhamento:** um filho nunca tem `--cut` maior que o do pai. Numa caixa M, os botões e campos dentro dela são S.
- O losango ◆ continua sendo o marcador (menu ativo, listas, estados).

### 1.2 O problema que precisa ser resolvido
`clip-path` corta três coisas que precisamos:
- a **borda** (some na diagonal);
- o **anel de foco** (`outline` é cortado);
- o **brilho externo** (`box-shadow` é cortado). Foi isso que apagou as animações de raridade.

A solução é padronizada, e **todo componente usa a mesma**: moldura + preenchimento para a borda, e `filter: drop-shadow` num elemento pai sem corte para o brilho e o foco.

### 1.3 Implementação (lib/tokens.css + lib/components.css)

```css
:root{
  --cut-xs:4px; --cut-s:6px; --cut-m:12px; --cut-l:18px;
  --bw:1px;                                   /* espessura da borda */
}

/* forma base — qualquer elemento chanfrado */
.cf{
  --cut:var(--cut-s);
  clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut));
  border:0 !important; border-radius:0 !important;
}
.cf-xs{--cut:var(--cut-xs)} .cf-s{--cut:var(--cut-s)} .cf-m{--cut:var(--cut-m)} .cf-l{--cut:var(--cut-l)}

/* BORDA: moldura (fundo = cor da borda) + preenchimento interno.
   O corte interno é menor para a diagonal ter a mesma espessura dos lados:
   cut_interno = cut − 0.586 × espessura                                         */
.cf-frame{
  background:var(--frame, var(--border));
  padding:var(--bw);
}
.cf-frame > .cf-fill{
  --cut:calc(var(--cut-parent) - var(--bw) * .586);
  background:var(--fill, var(--surface-1));
  height:100%;
}
/* quando não der para aninhar (ex.: <input>, <button>), usar a borda em gradiente,
   que acompanha a diagonal porque é pintada DENTRO do polígono:                  */
.cf-line{
  background:
    linear-gradient(var(--fill,var(--surface-2)),var(--fill,var(--surface-2))) padding-box,
    var(--frame,var(--border-strong)) border-box;
  border:var(--bw) solid transparent !important;
}
/* ↑ para a diagonal aparecer, somar a linha diagonal com ::before (ver 1.4) */

/* FOCO e BRILHO: sempre no pai sem corte, com drop-shadow (segue o formato cortado) */
.cf-wrap{display:inline-flex;filter:var(--cf-shadow,none);transition:filter var(--t-fast) var(--ease)}
.cf-wrap:has(:focus-visible){--cf-shadow:drop-shadow(0 0 0 var(--primary)) drop-shadow(0 0 1.5px var(--primary)) drop-shadow(0 0 1.5px var(--primary))}
```

### 1.4 Borda diagonal para elementos que não aceitam filhos
Em `<input>`, `<select>`, `<textarea>` e `<button>` sem wrapper, use o **wrapper de campo** (`<span class="cf-wrap cf-frame cf-s">` em volta do input). É o padrão recomendado.

Se não der para usar o wrapper, desenhe as duas diagonais num pseudo-elemento:
```css
.cf-diag{position:relative}
.cf-diag::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:
    linear-gradient(135deg,transparent calc(var(--cut)*.7071 - .75px),var(--frame) 0 calc(var(--cut)*.7071 + .25px),transparent 0) top left/calc(var(--cut)*2) calc(var(--cut)*2) no-repeat,
    linear-gradient(135deg,transparent calc(100% - var(--cut)*.7071 - .25px),var(--frame) 0 calc(100% - var(--cut)*.7071 + .75px),transparent 0) bottom right/calc(var(--cut)*2) calc(var(--cut)*2) no-repeat;
}
```

### 1.5 Estados com chanfro
| Estado | Como fazer |
|---|---|
| Hover (secundário, card, linha) | `--frame: var(--primary)` e `--fill: var(--surface-2)` |
| Ativo | `--fill: var(--surface-3)`, e `scale(.98)` no botão |
| Foco | o `drop-shadow` de 2px latão no `.cf-wrap` (1.3). **Nunca `outline`**, porque é cortado |
| Erro | `--frame: var(--danger)` |
| Desabilitado | `--frame: var(--surface-3)`, `--fill: var(--surface-1)`, texto `--text-disabled` |
| Selecionado (menu, segmentado, amostra) | `--frame: var(--primary)` + ◆ quando houver espaço |

### 1.6 O que muda nas telas
- **Menu vertical:** o item ativo fica chanfrado S com `--fill: var(--surface-2)` e traço de 2px à esquerda (que passa a ser um `span` interno, porque o `box-shadow inset` continua funcionando dentro do corte).
- **Topbar:** sem chanfro, porque ocupa a largura toda. Linha inferior de 1px `--border`.
- **Modal / folha:** chanfro L. A linha de latão de 2px no topo é pintada como `--frame: linear-gradient(to bottom, var(--primary) 0 2px, var(--border) 2px)`.
- **Segmentado:** cada opção chanfrada XS dentro de uma moldura S.
- **Checkbox:** chanfro XS, e o marcado com o losango de 8px.
- **Toggle:** trilho e botão chanfrados XS.
- Apagar todo `border-radius` restante (129 no `theme.css`) e todos os `.ffx-corners`.

### 1.7 Desempenho
- `clip-path` é barato. O que custa é `filter: drop-shadow`: use-o **só** no foco (um elemento por vez) e nos brilhos de raridade Raro ou acima.
- Se a mochila tiver mais de 40 itens Raro+, pause os brilhos fora da tela com `IntersectionObserver` (`animation-play-state: paused`).

---

## 2. Cor: grafite quente + latão

Trocar **só os valores** em `lib/tokens.css`. Os nomes continuam iguais, e os aliases antigos (`--brass`, `--bone`, `--ink-*`, `--line*`, `--panel*`) continuam apontando para eles.

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0f1012` | `#f4f4f2` | fundo da página |
| `--surface-1` | `#17191c` | `#ffffff` | cards, linhas, painéis |
| `--surface-2` | `#1f2226` | `#ebebe8` | campos, hover, modal |
| `--surface-3` | `#292d32` | `#e0e0dc` | ativo, avatar, trilho |
| `--border` | `#33373d` | `#d5d5d0` | bordas de superfície |
| `--border-strong` | `#6b7079` | `#85857e` | bordas de controle (≥ 3:1) |
| `--text` | `#ecebe8` | `#1b1c1e` | texto principal |
| `--text-2` | `#b3b1ab` | `#4d4f53` | texto secundário |
| `--text-3` | `#8d8b85` | `#676a6f` | metadados (≥ 4.5:1) |
| `--text-disabled` | `#5f6368` | `#a3a5a8` | desabilitado |
| `--primary` | `#c9a45c` | `#85611f` | latão: a única cor de ação |
| `--primary-hover` | `#d8b56e` | `#6f5019` | |
| `--on-primary` | `#1a1208` | `#fffaf0` | texto sobre o latão |
| `--secondary` | `#8fb0cc` | `#3d6687` | informação neutra (Psique, ajuda) |
| `--success` | `#7ed69a` | `#2e7747` | |
| `--warning` | `#e3ad48` | `#8d5c00` | |
| `--danger` | `#ff7a6b` | `#b13d25` | |

Sombra flutuante: `0 16px 40px rgba(0,0,0,.5)` no escuro e `0 16px 40px rgba(20,22,26,.16)` no claro. Com chanfro, aplicar como `filter: drop-shadow(0 16px 24px rgba(0,0,0,.45))` no wrapper.

As cores de recurso da ficha continuam: Vida `#d2705a`, Psique `#8fb0cc`, Mental `#b39ad6`.

Depois de trocar, confira: texto ≥ 4.5:1 e borda de controle ≥ 3:1, nos dois temas.

---

## 3. Itens (exatamente como na referência)

### 3.1 Cores de raridade
```css
:root{
  --rar-comum:#b9c2c6; --rar-incomum:#7ed69a; --rar-raro:#6aaeff;
  --rar-epico:#b98cff; --rar-lendario:#f2b544; --rar-unico:#ff5a67;
}
```

### 3.2 Card de item: estrutura com chanfro
```
.item-glow   (SEM clip-path — recebe o brilho animado via filter: drop-shadow)
 └ .item-card.cf.cf-m   (moldura: padding 1–2px; background = cor/gradiente da raridade; overflow:hidden)
     ├ .item-aura   (só Único: conic-gradient girando, atrás do conteúdo)
     └ .item-inner.cf   (--cut: 12px − 0.586×espessura; --surface-1)
         ├ .item-stage (aspect-ratio:1; halo radial da raridade; overflow:hidden)
         │   ├ img (position:absolute; inset:0; object-fit:cover) + vinheta (::after) escurecendo as bordas até --surface-1
         │   ├ .sweep · .twinkle ×3 (conforme o nível)
         │   └ selo da raridade (.cf-xs, mono 11, fundo rgba escuro, canto superior esquerdo)
         └ .item-info (border-top:2px da cor; nome em Fraunces 18 com clamp de 2 linhas; meta de 13px em 1 linha)
```

| Raridade | Moldura (`.item-card`) | Brilho (`.item-glow`) | Extras |
|---|---|---|---|
| Comum | 1px `--border` | — | — |
| Incomum | 1px da cor a 28% | — | halo estático |
| Raro | 1px da cor a 60% | `glowPulse` 3.6s | — |
| Épico | 1px da cor a 70% | `glowDouble` 3.2s (roxo + magenta) | varredura a cada 6s |
| Lendário | 2px, degradê dourado em `borderFlow` 3s | `glowDouble` 3s (ouro + laranja) | varredura 4s + 3 cintilações + flutuação de 4px |
| Único | 2px + aura cônica girando (`spinC` 4s) | `glowDouble` 2.6s (vermelho) | varredura 5s + cintilações + flutuação |

As animações de brilho usam **`filter`** (não `box-shadow`), porque o card é chanfrado:
```css
@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 6px var(--g1))}50%{filter:drop-shadow(0 0 14px var(--g1))}}
@keyframes glowDouble{0%,100%{filter:drop-shadow(0 0 8px var(--g1)) drop-shadow(0 0 18px var(--g2))}50%{filter:drop-shadow(0 0 14px var(--g1)) drop-shadow(0 0 30px var(--g2))}}
@keyframes borderFlow{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes sweep{0%{transform:translateX(-160%) skewX(-18deg)}30%,100%{transform:translateX(260%) skewX(-18deg)}}
@keyframes spinC{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.3) rotate(45deg)}50%{opacity:1;transform:scale(1) rotate(45deg)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
```
- `--g1` é a cor da raridade a 50–60%. `--g2` é o segundo tom: magenta `rgba(214,60,220,.3)` no Épico, laranja `rgba(255,140,40,.35)` no Lendário e vermelho `rgba(230,0,40,.35)` no Único.
- Lendário: `background: linear-gradient(90deg, var(--rc), #fff3c4, var(--rc), #b8741a, var(--rc)); background-size: 200% 100%`.
- A aura do Único é um `span` de 200%×200% centralizado, com `conic-gradient(from 0deg, transparent 0 60%, var(--rc) 75%, #fff 80%, var(--rc) 85%, transparent 100%)`.
- A varredura é uma faixa de 40% com `linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)`.
- Hover: `translateY(-4px)` no `.item-glow`.
- **Movimento:** com `prefers-reduced-motion` ou `html[data-motion="off"]`, todos os efeitos em loop ficam desligados. Sobram a moldura, o halo e um brilho estático no Raro ou acima.
- **Onde aparece:** loja, favoritos, biblioteca, mochila e visão do Mestre. É o mesmo componente em todo lugar. Reaproveite a lógica de `data-rarity` que já existe (`.rarity-fx`, `.rar-frame`).
- Esta é a **única exceção** à regra "nenhuma animação em loop". A raridade é conteúdo de jogo.

### 3.3 Detalhe do item (modal): substitui `.item-detail`
**Desktop:** modal com chanfro L, de 920×560 (máximo de 90vw × 85vh). Moldura com a linha de 2px na cor da raridade no topo (`--frame: linear-gradient(to bottom, var(--rc) 0 2px, var(--border) 2px)`). O wrapper tem `drop-shadow` flutuante + um brilho suave na cor da raridade.

Duas colunas:
- **Esquerda (420px):** palco com halo radial da raridade. A imagem preenche o palco (`inset: 0`, `object-fit: cover`) com uma vinheta que escurece as bordas até `--surface-1` (mais forte embaixo, sob o rodapé). No rodapé do palco: "◆ RARIDADE" à esquerda e o tipo à direita.
- **Direita:**
  1. **Cabeçalho fixo:** nome em Fraunces 30 com `text-wrap: pretty`, a origem em 13px e o botão × de 40px (chanfro S).
  2. **Grade 2×2 de atributos:** células com borda, rótulo mono 11 e valor em Fraunces 20 que **quebra linha** (sem nowrap/ellipsis). Exemplos: Dano/Tipo/Slot/Qtd. para armas e Cura/Uso/Peso/Qtd. para consumíveis.
  3. **Corpo rolável:** a descrição em Hanken 15/1.65, com `max-width: 60ch`. Os "Efeitos" em lista: ◆ na cor da raridade + valor em `--success` + texto ("+2 Força").
  4. **Rodapé fixo:** "Excluir" (terciário de perigo) à esquerda, e à direita o secundário (Equipar/Desequipar) + o primário **contextual** (Rolar dano para arma equipada, Usar para consumível, Ativar para item com carga). Os botões têm chanfro S.

**Celular:** folha inferior que ocupa a tela menos 64px, com chanfro L só no canto superior esquerdo e puxador.
- Palco de 240px com contain e × de 44px.
- "◆ RARIDADE · tipo", o nome em Fraunces 26 e os atributos em 2×2.
- A descrição com clamp de 4 linhas + "Ler tudo".
- No rodapé, 2 botões de 48px.

**Sem descrição:** esconder o bloco. **Sem imagem:** o palco mostra o losango da raridade (48px, contorno) centralizado.

---

## 4. Prompt para o Claude Code

```
Leia docs/VITALITY-FORMA-COR-ITENS.md. Ele substitui o ITENS-FORMA-COR.md e altera o DESIGN-v2-LATAO-CALMO.md.
Faça nesta ordem, um commit por etapa, e pare após cada uma para eu ver:

1) Forma (§1): crie as utilidades .cf/.cf-xs/.cf-s/.cf-m/.cf-l, .cf-frame/.cf-fill e .cf-wrap em lib/components.css. Aplique a tabela da §1.1 a TODOS os componentes, sem sobrar nenhum elemento com fundo e canto reto ou arredondado. Troque todo outline de foco pelo drop-shadow da §1.3. Apague os border-radius restantes e os .ffx-corners.
   Ao terminar, me liste qualquer componente em que a borda diagonal não apareceu.

2) Cor (§2): troque só os VALORES dos tokens em lib/tokens.css. Confira o contraste nos dois temas.

3) Card de item (§3.1–3.2): reconstrua com .item-glow (sem clip) > .item-card (chanfrado) e as animações por filter. Aplique em loja, favoritos, biblioteca, mochila e visão do Mestre. Respeite data-motion="off" e prefers-reduced-motion.

4) Detalhe do item (§3.3): reescreva as duas funções que montam .item-detail (app.html e mesa.html) com o layout novo, a imagem em object-fit:contain, os atributos em 2×2 que quebram linha e a ação primária contextual. Faça a folha inferior no celular.

Teste: temas escuro e claro; 1440×900, 900×540 e 390×844; navegação por teclado (o foco precisa aparecer em todo controle chanfrado); imagens em pé, deitadas, PNG transparente e sem imagem; descrição de 800 caracteres.
```
