# Vitality × FFXIII — Guia de Design (v1)

> Documento de referência para o Claude Code aplicar o redesign no código real (`vitality v2 260726/`).
> Protótipo visual de referência: `Vitality Redesign.dc.html` (5 telas: Login, Lobby, Mesa/Ficha, Árvore, Construtor).
> CSS pronto para uso: `lib/theme-ffx.css` (carregar **depois** de `lib/theme.css`).

---

## 0. Resumo em uma frase

Manter a identidade **"Mesa de Jogo" (tinta escura + latão)** e aplicar por cima a **gramática de interface do FFXIII**: menus verticais com barra de seleção luminosa e cursor em losango, painéis translúcidos com cantos chanfrados, profundidade cinematográfica no fundo, árvore de habilidades em nós cristalinos e microanimações de foco. Intensidade: **equilibrada**. Não copiamos nenhum elemento gráfico do jogo, só os princípios.

---

## 1. Princípios

| # | Princípio | Como se traduz no Vitality |
|---|-----------|---------------------------|
| 1 | **Navegação é uma coluna** | Abas horizontais (`.home-tabs`, `.seg`, `#tabs`) viram menu vertical à esquerda. O item ativo tem barra em degradê + borda esquerda de latão + cursor ◆ pulsando. |
| 2 | **Painéis flutuam, não são caixas** | Superfícies translúcidas (`backdrop-filter: blur`) com dois cantos cortados em 45° (sup. esq. e inf. dir.) e **marcas em L** de latão nos outros dois cantos. Sem `border-radius`. |
| 3 | **Profundidade cinematográfica** | Fundo com brilhos radiais quentes que derivam devagar, vinheta nas bordas, linhas horizontais bem sutis e anéis tracejados girando atrás dos elementos principais (login e árvore). |
| 4 | **Hierarquia por tipografia, não por caixas** | Títulos grandes em Fraunces **400** (fino), rótulos em JetBrains Mono MAIÚSCULO com tracking largo, divisores "RÓTULO ───────". |
| 5 | **Foco responde** | Todo item clicável desliza 4–6 px (menus e linhas) ou sobe 4 px (cards) com a curva expo-out. Os botões primários têm um brilho que passa em loop lento. |
| 6 | **Latão = foco e ação** | `--brass` só em: seleção ativa, CTA primário, cursor, marcas de canto e valores importantes (pontos). Todo o resto usa tinta/neutros. |
| 7 | **Árvore = constelação de cristais** | Nós com brilho da cor da via quando desbloqueados, anel pulsante quando disponíveis e apagados quando bloqueados. As linhas acendem quando as duas pontas estão desbloqueadas. |

---

## 2. Tokens

### 2.1 Cores (escuro — padrão)

Os tokens existentes do `theme.css` continuam valendo. Os tokens abaixo são **novos** ou **reajustados**:

```css
--app-bg:   #0c0906;                 /* levemente mais escuro que #0e0b08 → mais contraste com o vidro */
--panel:    rgba(26,21,16,.72);      /* vidro (antes era sólido #171310) */
--panel-2:  rgba(34,27,20,.78);      /* vidro elevado / hover */
--field:    rgba(40,32,23,.70);
--bone:     #f3ead9;
--sel-a:    rgba(201,164,92,.26);    /* início do degradê da barra de seleção */
--glow1:    rgba(201,164,92,.16);    /* brilho de fundo A (latão) */
--glow2:    rgba(143,123,101,.14);   /* brilho de fundo B (bronze) */
--edge:     #050302;                 /* vinheta */
--shadow:   0 24px 60px rgba(0,0,0,.5);
```

Mantidos: `--ink #ede4d3`, `--ink-dim #a89b85`, `--ink-faint #7a7061`, `--line rgba(233,221,201,.09)`, `--line2 rgba(233,221,201,.17)`, `--brass #c9a45c`, `--maq #e0bd7a`, `--escarlate #d1603f`, `--good #7fae5b`, `--on-primary #20170a`.

### 2.2 Cores (claro — `[data-theme="light"]`)

```css
--app-bg:#efe7d8; --panel:rgba(250,245,235,.78); --panel-2:rgba(246,239,226,.9);
--field:rgba(236,226,205,.8); --ink:#2a2118; --ink-dim:#6b5d4a; --ink-faint:#8a7c68;
--bone:#20180f; --line:rgba(42,33,24,.10); --line2:rgba(42,33,24,.18);
--brass:#9c6f22; --maq:#8a6423; --escarlate:#b3492f; --good:#4f7a34; --on-primary:#fff;
--sel-a:rgba(156,111,34,.18); --glow1:rgba(214,184,132,.45); --glow2:rgba(196,164,120,.30);
--edge:#e2d5bb; --shadow:0 20px 50px rgba(60,45,20,.14);
```

### 2.3 Cores das vias da árvore (mesma luminosidade e croma, só o matiz muda)

```css
--via-lamina: oklch(0.76 0.11 80);   /* latão */
--via-arcano: oklch(0.76 0.11 200);  /* cristal frio */
--via-vigor:  oklch(0.76 0.11 140);  /* verde vital */
```
Novas vias: use `oklch(0.76 0.11 <matiz>)`, escolhendo matizes a pelo menos 50° dos que já existem.

### 2.4 Cores de recurso (barras)

| Recurso | Cor base | Cor clara (fim do degradê) |
|---|---|---|
| Vida | `#d1603f` | `#f09a7e` |
| Mana | `#6f9fe0` | `#a9ccff` |
| Estamina | `#7fae5b` | `#b7dc93` |

Recursos personalizados: `a.color` como base, com a cor clara gerada por `color-mix(in oklch, var(--res-color), white 35%)`.

### 2.5 Raridade (sem mudanças de cor)
Comum `#b9c2c6` · Incomum `#8fe6a0` · Raro `#7ab8ff` · Épico `#c79cff` · Lendário `#e0bd7a` · Único `#d1603f`.
A moldura animada `.rar-frame` continua existindo. O que muda é o card de item, que passa a usar a "faixa superior de 2px" e o ícone em losango (ver §4.9).

### 2.6 Tipografia

| Papel | Fonte | Peso | Tamanho | Tracking | Caixa |
|---|---|---|---|---|---|
| Wordmark (login) | Fraunces | 400 | `clamp(52px, 8vw, 96px)` | .16em | MAIÚSC. |
| H1 de página | Fraunces | 400 | 36–40px | .01em | normal |
| Nome de personagem | Fraunces | 400 | 36px | 0 | normal |
| Título de painel / card | Fraunces | 400–500 | 18–22px | 0 | normal |
| Valor numérico grande (status, dado) | Fraunces | 400 | 34px (status) / 56px (dado) | 0 | — |
| Item de menu | Hanken Grotesk | 400 | 14.5–16px | .02em | normal |
| Texto corrido | Hanken Grotesk | 400 | 13–15px, lh 1.55–1.6 | 0 | normal |
| Eyebrow / rótulo de seção | JetBrains Mono | 400 | 10px | .30–.34em | MAIÚSC. |
| Rótulo de campo | JetBrains Mono | 400 | 10px | .18em | MAIÚSC. |
| Botão | JetBrains Mono | 700 | 11–12px | .14–.16em | MAIÚSC. |
| Meta/legenda | JetBrains Mono | 400 | 10–11px | .06em | — |

O link do Google Fonts precisa incluir **Fraunces 400**: `family=Fraunces:wght@400;500;600;700`.

### 2.7 Geometria

| Token | Valor | Uso |
|---|---|---|
| `--cut-xl` | 22px | Card de login, capa do personagem |
| `--cut-l` | 18px | Painéis de detalhe (árvore, editor) |
| `--cut-m` | 16px | Action cards, cards de sistema, painel de dados |
| `--cut-s` | 12–14px | Linhas de mesa, tiles de status, cards de item |
| `--cut-xs` | 9–12px | Botões |
| `--cut-xxs` | 6–7px | Avatares |

Polígono padrão do chanfro:
```css
clip-path: polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut));
```
**Regra:** `clip-path` corta `border` e `box-shadow` externos. Por isso a borda é sempre **`box-shadow: inset 0 0 0 1px var(--line2)`**. Sombra externa só funciona sem clip. Onde ela for necessária, use um wrapper ou aceite a ausência.

`border-radius` só é permitido em: pontos de status online (50%), nós circulares da árvore e anéis decorativos. **Todo o resto é reto ou chanfrado.**

### 2.8 Movimento

```css
--ease: cubic-bezier(0.16,1,0.3,1);   /* já existe */
```
| Animação | Duração | Onde |
|---|---|---|
| `vtPulse` (cursor ◆ opacidade 1→.45, escala 1→.7) | 1.6s loop | Cursor do menu ativo |
| `vtRing` (anel escala .8→1.9, opacidade .9→0) | 2.2s loop | Nó disponível da árvore |
| `vtDrift` (±4% translate) | 26s loop | Brilhos do fundo |
| `vtSpin` (rotação 360°) | 80–140s loop | Anéis tracejados (login/árvore) |
| `vtSweep` (brilho atravessando) | 3.8s loop | Botão primário |
| Hover de deslizar | .22s `--ease` | Menus: `translateX(5px)`, linhas: `translateX(6px)` |
| Hover de subir | .25s `--ease` | Cards: `translateY(-4px)` + sombra de latão |
| Barra de recurso (width) | .45s `--ease` | Dano/cura |

Tudo desliga com `prefers-reduced-motion: reduce` e com a preferência do usuário (sugestão: `localStorage.vt_motion = "0"` → `html[data-motion="off"]`).

---

## 3. Layout das telas

### 3.1 Estrutura de página (Lobby, Mesa, Sistema)

```
┌ topbar 58px (vidro, blur 14, linha inferior + traço de latão em 38% da largura) ─────┐
│ ◈ VITALITY │ Título da página / SUBTÍTULO MONO                     [A] Aventureiro   │
└───────────────────────────────────────────────────────────────────────────────────────┘
┌ menu vertical 210–220px (sticky top:86px) ┐ ┌ conteúdo flex:1 ┐ ┌ painel lateral 250–320px ┐
│ MENU (eyebrow)                            │ │ EYEBROW latão   │ │ (dados / detalhe /       │
│ ◆▌Mesas ▓▓▓▓▓░░░░              03         │ │ H1 Fraunces 400 │ │  editor) — sticky        │
│   Sistemas                     03         │ │ parágrafo       │ │                          │
│   Itens                        06         │ │ …               │ │                          │
└───────────────────────────────────────────┘ └─────────────────┘ └──────────────────────────┘
```
- Contêiner: `max-width` 1240 (lobby), 1360 (sistema), 1440 (mesa); `padding: 28–36px 24px 120px`; `display:flex; flex-wrap:wrap; gap:28–36px`.
- Colunas laterais com `flex: 0 0 <largura>` e conteúdo com `flex: 1 1 520px; min-width:0`. Em telas estreitas tudo empilha naturalmente, sem media query nova.

### 3.2 Login
Duas colunas com wrap: **herói** à esquerda (eyebrow "VTT · MESA VIRTUAL", wordmark gigante, linha de latão 72% em degradê, tagline 17px, anéis tracejados girando atrás) e **card** chanfrado de 420px à direita. As abas "Entrar/Criar conta" viram **menu vertical** de 2 itens no topo do card, sangrando até as bordas.

### 3.3 Lobby
Menu vertical com contadores à direita (mono, `--ink-faint`). **Mesas:** dois action cards chanfrados, divisor "MINHAS MESAS ───" e **lista** (não mais grid) de linhas chanfradas com losango à esquerda (preenchido = Mestre) e selo de papel à direita. **Sistemas:** grid `minmax(250px,1fr)`; o card em destaque tem contorno de latão permanente e selo "DESTAQUE". **Itens:** busca com borda só embaixo e grid `minmax(176px,1fr)`.

### 3.4 Mesa (Ficha)
Três colunas: **menu do personagem** (Ficha, Biografia, Inventário, Habilidades, Combate, Anotações, Árvores, Sistema) + bloco **GRUPO** (avatar chanfrado, nome, subtítulo e ponto online com brilho); **conteúdo**; **painel de rolagem** à direita (valor em Fraunces 56px, grade 3×2 de dados e log das 5 últimas). As abas horizontais `.mesa-toptabs` e os trilhos colapsáveis viram essas colunas fixas.

Ordem da Ficha: capa (190px, chanfro 22, retrato 92px chanfrado com brilho de latão, nome 36px, tags) → **RECURSOS** (painel com barras inclinadas) → **STATUS** (tiles) → barra de pontos → **COMBATE** (linhas nome/valor) → **PERÍCIAS** (chips retos).

### 3.5 Árvore
Palco 880×620 com três anéis concêntricos finos (r 110/190/270), mais dois anéis tracejados girando, a legenda das vias no canto superior esquerdo e o **painel de detalhe** à direita (barra de pontos + painel chanfrado com via/tipo, nome em Fraunces 28, descrição, tabela Custo/Modificador/Estado e botão de desbloquear).

### 3.6 Construtor de sistema
O menu vertical com as 13 seções substitui o `#tabs.home-tabs` de 2 linhas. No conteúdo: eyebrow "SISTEMA · NOME", H1 com a seção e uma **lista de linhas** (alça ⋮⋮, losango na cor do status, nome, fórmula em mono, selo do tipo). A linha selecionada recebe o degradê de seleção + borda esquerda de latão. **Painel editor fixo à direita** (em vez de abrir inline), com tipo em segmentado reto.

---

## 4. Componentes (especificação)

### 4.1 Menu vertical (`.ffx-menu`)
- Item: altura 40–44px, `padding: 0 14px 0 26px`, cor `--ink-dim`, 15px.
- Hover: `translateX(5px)`, cor `--bone`.
- **Ativo** (`.on`, `aria-selected="true"`):
  - `::before` (barra): `inset: 4px 0 4px 12px; background: linear-gradient(90deg, var(--sel-a), transparent 92%); border-left: 2px solid var(--brass)`.
  - `::after` (cursor): quadrado de 7px girado 45°, `left:4px`, fundo `--brass`, `box-shadow: 0 0 10px var(--brass)`, animação `vtPulse`.
  - Texto `--bone`.
- Eyebrow do grupo: mono 10px, `.34em`, `--ink-faint`, `padding-left:26px`.
- Contador opcional à direita: mono 11px `--ink-faint`.
- Acessibilidade: `role="tablist"` + `aria-orientation="vertical"`; setas ↑/↓ navegam, Enter/Espaço ativa.

### 4.2 Painel (`.ffx-panel`)
```
background: var(--panel); backdrop-filter: blur(12–14px);
box-shadow: inset 0 0 0 1px var(--line2) [, var(--shadow) só nos painéis principais];
clip-path: chanfro (--cut); padding: 20–24px (card) / 30–34px (login)
```
Variante `.ffx-corners`: marcas em L de 10–12px, 1px `--brass`, a 7–8px dos cantos **sup. dir.** (e opcionalmente **inf. esq.**). Use só em painéis de destaque (login, action "Criar mesa", painel de dados, detalhe da árvore, editor). **Nunca em cards de lista.**

### 4.3 Divisor de seção (`.ffx-label`)
`RÓTULO ─────────` em flex com `gap:14px`: mono 10px `.3em` `--ink-faint` + `div{flex:1;height:1px;background:var(--line)}`. Substitui `.section-title` e `.hud-sec-label`.

### 4.4 Campo (`.ffx-field`)
Sem borda completa: `background: var(--field); border:0; border-bottom:1px solid var(--line2); padding:11–12px 12–14px; border-radius:0`. No foco: `border-bottom-color: var(--brass); box-shadow: 0 8px 16px -12px var(--brass)`. O rótulo fica acima (mono 10px `.18em`, `gap:7px`).

### 4.5 Botões
- **Primário** (`.btn.go`): fundo `--brass`, texto `--on-primary`, mono 700 11–12px `.14–.16em`, chanfro 9–12px, altura 42–48px. Hover: `brightness(1.08)` + tracking `.22em`. Brilho `vtSweep` via `::after` (faixa de 30% com `rgba(255,255,255,.35)`).
- **Secundário** (`.btn`): transparente, `box-shadow: inset 0 0 0 1px var(--line2)`, texto `--ink-dim`. Hover: borda interna `--brass` e texto `--bone`.
- **Perigo** (`.btn.danger`): borda interna `rgba(209,96,63,.4)`, texto `--escarlate`. Hover: fundo `--escarlate` e texto branco.
- **Desabilitado**: fundo `--field`, texto `--ink-faint`, sem brilho.

### 4.6 Linha de lista (`.ffx-row`)
Chanfro 12px, `padding:16px 22px`, fundo `--panel`, borda interna `--line`. Hover: `translateX(6px)`, borda interna `--brass` + `inset 3px 0 0 var(--brass)`, fundo `--panel-2`. À esquerda, um losango de 10px (borda de latão, preenchido quando "é seu" ou ativo).

### 4.7 Barra de recurso (`.ffx-bar`)
Grid: `[rótulo 96px] [trilho 1fr] [valor 84px] [−][+]`.
- Trilho: 8px de altura, `background: var(--field)`, borda interna `--line` e **`transform: skewX(-24deg)`** (inclinação de HUD).
- Preenchimento: `linear-gradient(90deg, cor, corClara)` + `box-shadow: 0 0 12px cor` e transição de width .45s.
- Valor: Fraunces 20px `--bone` + `/ máx` 13px `--ink-faint`.
- Botões 30×30 retos: − em `--escarlate` e + em `--good` (a borda interna fica colorida no hover).

### 4.8 Tile de status (`.ffx-stat`)
Chanfro 12px, `padding:16px 16px 12px`. Nome mono 10px no topo, valor Fraunces 34px e botões −/+ retos de 24px, lado a lado, embaixo. Com ponto pendente, a borda interna fica `--brass` e aparece `+N` em mono de latão ao lado do valor.
Barra de pontos: `background: linear-gradient(90deg, var(--sel-a), transparent); border-left: 2px solid var(--brass)` com o valor em Fraunces 24px latão. O botão "Salvar status" só aparece quando há pontos pendentes.

### 4.9 Card de item
Chanfro 14px, borda interna `--line2` **+ `inset 0 2px 0 <cor da raridade>`** (faixa superior). Ícone de 62px girado 45° e escalado a .8 (losango), com borda interna na cor da raridade, fundo `radial-gradient(circle at 50% 70%, cor+33, transparent 70%)` e a inicial/imagem contra-girada. Abaixo: nome em Fraunces 15, "RARIDADE · CATEGORIA" em mono 9px na cor da raridade e descrição em 12px. Hover: sobe 4px com a faixa superior virando latão.

### 4.10 Chips / selos
Retos (sem raio), mono 9.5–10px `.12–.18em` MAIÚSC., `padding:4px 10px`. Os tipos:
- Nível ou Mestre: preenchido de latão.
- Classe: borda interna e texto na cor da classe.
- Neutro: borda interna `--line2`.
- Perícia: fundo `--field` com o valor em latão.

### 4.11 Topbar
58px, `--panel` + blur 14, `border-bottom:1px solid var(--line)` e **traço de latão** `position:absolute; bottom:-1px; left:0; width:38%; height:1px; background:linear-gradient(90deg,var(--brass),transparent)`. Conteúdo: marca ◈, divisor vertical de 22px, título Fraunces 15 + subtítulo mono 9px `.3em` e o usuário à direita com avatar chanfrado de 7px.

### 4.12 Fundo cinematográfico (`#fallback`)
Três camadas:
1. Brilhos radiais `--glow1` (28% 24%) e `--glow2` (76% 82%) numa caixa com `inset:-20%` e `vtDrift`.
2. Vinheta `radial-gradient(1600px 1100px at 50% 40%, transparent 40%, var(--edge))`.
3. Linhas horizontais a cada 96px com opacidade .35 e máscara vertical.

`#fallback.solid` também recebe as camadas (antes era chapado).

### 4.13 Árvore (canvas — `arvore.js`)
Regras para o renderizador 2D:
- **Desbloqueado:** preenchimento `radial-gradient` (branco 50% → cor da via), `shadowBlur 20–44` na cor da via e contorno de 1px na cor.
- **Disponível** (vizinho de um desbloqueado): preenchimento `--app-bg`, contorno de 1.5px na cor da via e **anel expandindo** (escala .8→1.9, alfa .9→0, 2.2s).
- **Bloqueado:** preenchimento `--field`, contorno `--line2`, sem brilho.
- **Selecionado:** losango externo de 1px `--bone` com tamanho+16px e o nó a 1.12×.
- **Aresta:** 2px, cor da via do destino + `shadowBlur 10` quando as duas pontas estão desbloqueadas; caso contrário `--line2`.
- **Tamanhos:** núcleo 40 (losango) · pequena 18 · média 22 · grande 32 (losango).
- **Rótulo:** mono 10px `.06em` abaixo do nó (`--bone` se selecionado, `--ink-dim` se desbloqueado, `--ink-faint` nos demais).
- **Fundo:** anéis concêntricos de 1px `--line` e dois anéis tracejados `--line2` girando (90s e 140s).
- O `radialGradient #orb-maq` ciano (`#7ee6dc`) foi substituído pela cor da via.

---

## 5. Mapeamento: classes atuais → novo padrão

| Atual (`theme.css` / HTML) | Novo | Mudança |
|---|---|---|
| `.home-tabs` (lobby, mesa gm-view, sistema `#tabs`) | `.ffx-menu` vertical | Mover para uma coluna `<aside>` à esquerda |
| `.seg` (Entrar/Criar, Loja/Favoritos/Criar) | `.ffx-menu` (2–4 itens) | No login, dentro do card. Nas subabas, sub-menu indentado abaixo do item pai |
| `.mesa-toptabs` + `.mesa-rail-left` | coluna `.ffx-menu` + bloco Grupo | Trilhos colapsáveis mantidos só no mobile |
| `.glass`, `.surface`, `.action-card`, `.card-tile` | `.ffx-panel` | Chanfro + inset + blur; tirar `border-radius` |
| `.list-row` | `.ffx-row` | Chanfro 12, deslizar no hover |
| `.section-title`, `.hud-sec-label` | `.ffx-label` | Linha que ocupa o resto da largura |
| `.fld input`, `.inline-form input`, `select.fld-input` | `.ffx-field` | Só borda inferior |
| `.btn.go` | + `::after` sweep, chanfro | Tracking cresce no hover |
| `.res-row` / `.res-track` / `.res-fill` | `.ffx-bar` | Trilho inclinado, degradê, glow |
| `.stat-tile` | `.ffx-stat` | Chanfro, valor Fraunces 34 |
| `.points-bar` | barra de seleção | Degradê + borda esquerda latão |
| `.char-tag`, `.badge`, `.role` | chips retos | Sem raio |
| `.poster-card` | card de item §4.9 | Faixa superior + ícone losango |
| `.topbar`, `.nav` | §4.11 | Traço de latão inferior |
| `.nav-user .chip .av` | avatar chanfrado 7px | — |

---

## 6. Regras de uso (faça / não faça)

**Faça**
- Use latão só para foco, seleção e ação primária.
- Chanfre painéis e botões. Deixe reto o que é pequeno (chips e botões −/+).
- Use `box-shadow inset` como borda em tudo que tem `clip-path`.
- Deixe os números importantes em Fraunces e os rótulos em mono maiúsculo.
- Mantenha o hover de deslizar/subir em **todo** elemento clicável.

**Não faça**
- Não use `border-radius` em painéis e botões (exceções em §2.7).
- Não use abas horizontais para navegação principal.
- Não use marcas de canto em listas/cards repetidos (só em painéis de destaque).
- Não use mais de uma cor de acento por tela além do latão (vias e raridades são dados, não acento).
- Não use emoji. Os ícones continuam sendo os SVGs de linha que já existem.
- Não use texto sobre vidro com contraste < 4.5:1 (no tema claro, `--ink-faint` só em legendas ≥ 10px).

---

## 7. Plano de migração sugerido (para o Claude Code)

1. **Tokens + fundo:** incluir `lib/theme-ffx.css` depois do `theme.css` em todas as páginas, atualizar o link do Fraunces (peso 400) e validar os dois temas.
2. **Pele dos componentes existentes:** o `theme-ffx.css` já reestiliza `.glass`, `.btn`, `.fld input`, `.list-row`, `.card-tile`, `.action-card`, `.section-title`, `.res-*`, `.stat-tile`, `.points-bar`, `.poster-card`, `.badge`, `.char-tag`, `.topbar` e `.nav`. Revisar tela por tela.
3. **Navegação vertical:** trocar `.home-tabs` / `.seg` pela estrutura `.ffx-layout > aside.ffx-menu + main`, na ordem: `app.html` → `sistema.html` → `mesa.html` → `login.html`. Manter `role/aria` e as mesmas funções `showSec()` / `openTab()`.
4. **Mesa:** coluna de dados fixa à direita (o `mountDice` passa a renderizar no `<aside>`).
5. **Árvore:** aplicar §4.13 no `arvore.js` (cores por via, estados, anel pulsante e arestas acesas).
6. **Movimento:** preferência `data-motion` + `prefers-reduced-motion`.
7. **QA:** larguras de 1440, 1024, 820 e 390; os dois temas; navegação por teclado no menu vertical.

---

## 8. Checklist de aceitação por tela
- [ ] Nenhum painel com `border-radius` > 0.
- [ ] Menu vertical com cursor ◆ pulsando no item ativo e setas ↑/↓ funcionando.
- [ ] Painéis principais com vidro + chanfro + marcas de canto.
- [ ] Rótulos de seção com linha que ocupa a largura.
- [ ] Hover de deslizar/subir em todos os clicáveis.
- [ ] Tema claro sem texto ilegível.
- [ ] `prefers-reduced-motion` desliga pulse, drift, spin, sweep e ring.
