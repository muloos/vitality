# Vitality v2 — Refinamento de design ("Latão calmo")

> Documento de implementação para o Claude Code. Referência visual: `Vitality v2 - Analise e Sistema.dc.html`, `Vitality v2 - Telas Login e Lobby.dc.html`, `Vitality v2 - Telas Mesa e Construtor.dc.html`.
> Substitui a abordagem de "camada por cima" (theme-ffx.css + 124 `!important`) por **um sistema de tokens único**.

## Princípios

1. **Bonito porque é organizado.** Sem brilho contínuo, varredura, textura listrada, partículas ou `.ffx-corners` decorativos.
2. **A profundidade vem da superfície**, não da sombra. Sombra só em flutuantes (modal, popover, toast, folha inferior).
3. **Uma cor de ação: latão.** Aço (secundária) só para informação neutra. Sucesso, alerta e erro só para estado.
4. **O chanfro tem significado:** 6px em controle primário e selo; 12px em superfície (card, painel, modal). O resto tem raio 0.
5. **Mono só em rótulos de até ~4 palavras, códigos e fórmulas.** Nunca em parágrafo e nunca abaixo de 11px.
6. **A tarefa mais frequente fica a zero cliques extras:** voltar à mesa e rolar um status.

---

## 1. Análise — problemas e correções

### 1.1 Clareza e fluxo
_Fica óbvio o que fazer? A tarefa principal é fácil de concluir?_

**[P0] Criar e entrar em mesa disputam o topo com cards grandes** — Lobby
- **O que acontece:** Dois cards de ~300px de altura, com formulários completos, ficam acima da lista de mesas. Quem já tem mesa precisa rolar para chegar nela.
- **Por que atrapalha:** A tarefa mais frequente é voltar a uma mesa existente. Criar uma mesa acontece uma vez por campanha, e entrar por código uma vez por jogador.
- **Correção:** A lista de mesas vira o conteúdo principal. "Nova mesa" (primário) e "Entrar com código" (secundário) passam a ser botões no cabeçalho, e cada um abre um diálogo curto.

**[P0] Rolar dados exige 4 decisões antes do clique** — Mesa
- **O que acontece:** Quantidade, dado, "Avançado" e Rolar ficam empilhados no painel, e o histórico espreme para ~20px em telas baixas.
- **Por que atrapalha:** Em jogo, 90% das rolagens são 1d20 + atributo. O fluxo atual trata toda rolagem como personalizada.
- **Correção:** Rolagem por contexto: clicar em um Status, Perícia ou Ataque rola direto com o modificador. O painel fica com os dados rápidos (d4 a d20) + histórico, e a fórmula livre vai para um campo único ("2d6+3").

**[P1] 13 abas sem ordem de trabalho** — Construtor
- **O que acontece:** Geral, Status, Combate, Perícias… aparecem como uma lista plana. Várias abas dependem de outras (Combate depende de Status), mas nada indica isso.
- **Por que atrapalha:** Quem cria o primeiro sistema não sabe por onde começar e cai em estados vazios que mandam para outra aba.
- **Correção:** Agrupar em 3 blocos numerados (1 Regras · 2 Personagem · 3 Conteúdo), com indicador de progresso por aba (◇ vazio, ◆ configurado).

**[P1] Controles de pontos aparecem sem pontos** — Ficha
- **O que acontece:** Os botões −/+ ficam em todos os status mesmo com 0 pontos para distribuir.
- **Por que atrapalha:** Parecem clicáveis e não fazem nada, e o jogador conclui que está quebrado.
- **Correção:** Os controles só aparecem quando há pontos, com um aviso único no topo da grade: "3 pontos para distribuir".

### 1.2 Hierarquia visual
_O olho vai primeiro ao que mais importa?_

**[P0] Tags coloridas brilham mais que o nome e a Vida** — Ficha
- **O que acontece:** As cores das classes e raças do sistema (vermelho, amarelo) aparecem saturadas em borda e texto, além de um card de classe todo vermelho na biografia.
- **Por que atrapalha:** Vida e recursos são o que o jogador consulta a cada turno, e hoje disputam atenção com metadados.
- **Correção:** A cor do sistema vira só um acento de 2px. A hierarquia da capa fica: nome (Fraunces 32) → Vida/recursos → tags neutras.

**[P1] Efeitos competem entre si** — Geral
- **O que acontece:** Brilho no botão primário, textura listrada na capa, partículas, cantos decorativos (.ffx-corners) e barras luminosas aparecem ao mesmo tempo.
- **Por que atrapalha:** Quando tudo pisca, nada é destaque. O efeito cansa em sessões de 3 a 4 horas.
- **Correção:** Tirar os efeitos contínuos. O destaque passa a vir só da cor de ação (latão) e do degrau de superfície. Movimento só como resposta a ação (entrada de resultado, troca de aba).

**[P1] Títulos repetidos** — Construtor
- **O que acontece:** O H1 "Cálculos" vem seguido do eyebrow "CÁLCULOS", e o menu tem "CONSTRUTOR" sobre "REGRAS".
- **Por que atrapalha:** Um rótulo duplicado ocupa espaço nobre e não informa nada.
- **Correção:** Um título por tela. O eyebrow mostra só o caminho ("Sistema · Epifania").

### 1.3 Consistência
_Espaços, cores, tipos e componentes seguem padrão?_

**[P1] 77 cores, 11 durações, 17 z-index** — Código
- **O que acontece:** Valores soltos acumulados em theme.css e theme-ffx.css, com 124 !important.
- **Por que atrapalha:** Cada ajuste inventa um valor novo, e a interface fica "quase" igual em todo lugar.
- **Correção:** Tokens fechados (ao lado): 14 cores por tema, 3 durações, 6 camadas de z e escala de espaço base 4.

**[P1] Mesmo tipo de conteúdo, componentes diferentes** — Listas
- **O que acontece:** Mesas aparecem em linhas, Meus sistemas em cards de 175px, sub-abas de Itens num seletor segmentado, e Rolagens/Conversa com abas sublinhadas.
- **Por que atrapalha:** O usuário reaprende o padrão a cada tela.
- **Correção:** "Minhas coisas" sempre em linha de lista, a loja em card, navegação secundária sempre em sub-item do menu ou em aba sublinhada.

**[P1] Mono usado como texto corrido** — Tipografia
- **O que acontece:** Estados vazios, metadados e placeholders em JetBrains Mono de 9 a 11px, às vezes em caixa alta.
- **Por que atrapalha:** Mono em caixa alta tem leitura ~20% mais lenta. Em 9px fica abaixo do legível.
- **Correção:** Mono só em rótulos curtos e códigos, nunca abaixo de 11px. Todo o resto em Hanken.

### 1.4 Acessibilidade
_Contraste AA, áreas de toque, legibilidade e foco._

**[P0] Controles abaixo de 3:1** — Ficha / Construtor
- **O que acontece:** −/+ do status (~1.6:1), placeholder em --ink-faint sobre campo escuro (~3.2:1) e borda dos campos (~1.5:1).
- **Por que atrapalha:** Quem tem baixa visão, ou joga numa TV/projetor, não enxerga os controles.
- **Correção:** Borda de campo em "borda forte" (≥3:1 em todas as superfícies), placeholder em texto terciário (4.8:1) e ícones de controle sempre em texto secundário ou mais claro.

**[P0] 91 campos só com placeholder** — Formulários
- **O que acontece:** Os campos não têm <label> nem aria-label, e o placeholder faz o papel de rótulo.
- **Por que atrapalha:** O leitor de tela anuncia só "campo de texto", e o rótulo some ao digitar.
- **Correção:** Rótulo visível acima de todo campo (padrão novo) e aria-label onde o design pedir campo compacto.

**[P1] Áreas de toque de 26 a 32px** — Mesa / Árvore
- **O que acontece:** Os botões −/+ de Vida, os ícones de ação das linhas e os controles do Crystarium ficam abaixo de 44px.
- **Por que atrapalha:** No celular, e durante o jogo com pressa, os erros de toque viram dano aplicado errado.
- **Correção:** Mínimo de 40px no desktop e 44px no toque. Ícones pequenos ganham área invisível de toque.

**[P1] Foco inconsistente e alert() nativo** — Geral
- **O que acontece:** O contorno de foco existe só no menu, e há 3 alert/confirm nativos do navegador.
- **Por que atrapalha:** Quem navega pelo teclado se perde, e a caixa do sistema quebra a imersão.
- **Correção:** Foco de 2px latão em todo interativo e .ui-modal no lugar do alert/confirm.

### 1.5 Estados e casos-limite
_Vazio, carregando, erro e excesso de conteúdo._

**[P0] Não existe estado de carregamento nem de erro** — Todas
- **O que acontece:** As listas aparecem vazias até o Supabase responder, e uma falha de rede mostra "A loja ainda está vazia".
- **Por que atrapalha:** O usuário acha que perdeu as mesas, ou que o conteúdo não existe.
- **Correção:** Skeleton no formato real da linha e aviso de erro com "Tentar de novo". O estado vazio só aparece após uma resposta de sucesso.

**[P1] Nomes longos quebram o layout** — Listas
- **O que acontece:** Nomes de mesa e sistema quebram em 3 linhas, as tags ficam cortadas sem tooltip, e o nome do personagem no histórico encavala com a hora.
- **Por que atrapalha:** Com conteúdo real (campanhas com nomes longos) a tela desmonta.
- **Correção:** Uma linha com reticências + title nas listas, até 2 linhas nos cards, e o cabeçalho do histórico em grid com o nome em linha própria.

**[P2] Vazio sem próxima ação** — Estados vazios
- **O que acontece:** "Nenhum combate em andamento" e "Nenhuma fórmula ainda" param no texto.
- **Por que atrapalha:** O estado vazio é o melhor momento para ensinar, e hoje é um beco sem saída.
- **Correção:** Todo vazio responde "o que é isto" + "como começar" + um botão.

### 1.6 Polimento
_Alinhamento, ritmo, ícones e microdetalhes._

**[P2] Três barras de rolagem e um botão de recolher solto** — Mesa
- **O que acontece:** Menu, ficha e histórico mostram a barra de rolagem do sistema, e o › de recolher flutua sobre a ficha.
- **Por que atrapalha:** Ruído visual permanente na tela mais usada.
- **Correção:** Barras finas que aparecem no hover, e o recolher preso ao painel.

**[P2] Plural e zeros à esquerda** — Textos
- **O que acontece:** "1 classes · 1 itens" e contadores "09".
- **Por que atrapalha:** Pequenos erros de texto reduzem a confiança no produto.
- **Correção:** Função de plural e números sem zero à esquerda.

**[P2] Emoji e ícones de famílias diferentes** — Ícones
- **O que acontece:** 15 emoji no construtor e na mesa, ícone de espadas que parece ×, e bolinhas neon na legenda da árvore.
- **Por que atrapalha:** Quebra a unidade de traço e confunde o significado.
- **Correção:** Um conjunto de ícones de traço de 1.5px, com o losango como marcador em todo lugar.

---

## 2. Sistema de design

### 2.1 Cores

Contraste medido contra `--bg` de cada tema. Texto ≥ 4.5:1; bordas de controle e ícones ≥ 3:1.

| Token | Função | Escuro | Contraste | Claro | Contraste |
|---|---|---|---|---|---|
| `--bg` | Superfícies e bordas · Fundo | `#0d0a07` | 1.0:1 | `#f5f0e7` | 1.0:1 |
| `--surface-1` | Superfícies e bordas · Superfície 1 | `#16120e` | 1.1:1 | `#fcf9f3` | 1.1:1 |
| `--surface-2` | Superfícies e bordas · Superfície 2 | `#1f1a14` | 1.1:1 | `#efe8dc` | 1.1:1 |
| `--surface-3` | Superfícies e bordas · Superfície 3 | `#2a231b` | 1.3:1 | `#e5dccd` | 1.2:1 |
| `--border` | Superfícies e bordas · Borda | `#3a3026` | 1.5:1 | `#d6cbb9` | 1.4:1 |
| `--border-strong` | Superfícies e bordas · Borda forte | `#76654f` | 3.5:1 | `#8a7c66` | 3.6:1 |
| `--text` | Texto · Primário | `#eee5d4` | 15.8:1 | `#1f1a13` | 15.2:1 |
| `--text-2` | Texto · Secundário | `#b5a891` | 8.4:1 | `#54493b` | 7.7:1 |
| `--text-3` | Texto · Terciário | `#8f8472` | 5.4:1 | `#6f6352` | 5.2:1 |
| `--text-disabled` | Texto · Desabilitado | `#6f6456` | 3.4:1 | `#a3988a` | 2.5:1 |
| `--primary` | Ação · Primária · latão | `#c9a45c` | 8.4:1 | `#85611f` | 5.0:1 |
| `--primary-hover` | Ação · Hover | `#d8b56e` | 10.1:1 | `#6f5019` | 6.5:1 |
| `--on-primary` | Ação · Texto sobre primária | `#1a1208` | 1.1:1 | `#fffaf0` | 1.1:1 |
| `--secondary` | Ação · Secundária · aço | `#8fb0cc` | 8.7:1 | `#3d6687` | 5.4:1 |
| `--success` | Estados · Sucesso | `#74c08e` | 9.1:1 | `#2e7747` | 4.8:1 |
| `--warning` | Estados · Alerta | `#e3ad48` | 9.7:1 | `#8d5c00` | 5.1:1 |
| `--danger` | Estados · Erro | `#e2735a` | 6.4:1 | `#b13d25` | 5.2:1 |

- Cores do sistema criadas pelo Mestre (classes, condições, status) **nunca** pintam fundo ou texto inteiro. Entram só como acento de 2px (`box-shadow: inset 2px 0 0 var(--accent)`) ou como fundo a 12%.
- Cores de recurso na ficha: Vida `#d2705a`, Psique `#8fb0cc`, Mental `#b39ad6`.

```css
:root, [data-theme="dark"]{
  --bg:#0d0a07;
  --surface-1:#16120e;
  --surface-2:#1f1a14;
  --surface-3:#2a231b;
  --border:#3a3026;
  --border-strong:#76654f;
  --text:#eee5d4;
  --text-2:#b5a891;
  --text-3:#8f8472;
  --text-disabled:#6f6456;
  --primary:#c9a45c;
  --primary-hover:#d8b56e;
  --on-primary:#1a1208;
  --secondary:#8fb0cc;
  --success:#74c08e;
  --warning:#e3ad48;
  --danger:#e2735a;
  --shadow-float:0 16px 40px rgba(0,0,0,.5);
  color-scheme:dark;
}
[data-theme="light"]{
  --bg:#f5f0e7;
  --surface-1:#fcf9f3;
  --surface-2:#efe8dc;
  --surface-3:#e5dccd;
  --border:#d6cbb9;
  --border-strong:#8a7c66;
  --text:#1f1a13;
  --text-2:#54493b;
  --text-3:#6f6352;
  --text-disabled:#a3988a;
  --primary:#85611f;
  --primary-hover:#6f5019;
  --on-primary:#fffaf0;
  --secondary:#3d6687;
  --success:#2e7747;
  --warning:#8d5c00;
  --danger:#b13d25;
  --shadow-float:0 16px 40px rgba(60,40,10,.18);
  color-scheme:light;
}
```

### 2.2 Tipografia

Famílias: **Fraunces** (display e números de jogo), **Hanken Grotesk** (texto e UI), **JetBrains Mono** (rótulos curtos e códigos).

| Token | Uso | Família | Tamanho/altura | Peso | Obs. |
|---|---|---|---|---|---|
| `--fs-display` | Herói (login) | Fraunces | 40/48 (56/60 no desktop) | 400 | — |
| `--fs-h1` | Título de tela | Fraunces | 32/40 | 400 | — |
| `--fs-h2` | Nome do personagem, título de modal | Fraunces | 24/32 | 400 | — |
| `--fs-h3` | Título de seção (Recursos, Status) | Hanken | 18/28 | 600 | — |
| `--fs-body` | Corpo, campos, itens de menu | Hanken | 15/24 | 400–500 | 16px no celular (evita zoom no iOS) |
| `--fs-btn` | Botões | Hanken | 14/20 | 600 | sem caixa alta |
| `--fs-small` | Metadados, ajuda de campo | Hanken | 13/20 | 400 | — |
| `--fs-label` | Rótulo, eyebrow, selo | Mono | 11/16 | 400–500 | caixa alta, letter-spacing .14em |
| `--fs-num` | Valor de status/recurso | Fraunces | 28–32/1 | 400 | `tabular-nums` |

- Piso absoluto: **11px**. Substituir todos os 7–10.5px atuais.
- `text-wrap: pretty` em títulos e parágrafos; parágrafos com `max-width: 68ch`.
- Negrito no corpo = `font-weight:600` + `--text`. Não trocar a cor.

### 2.3 Espaçamento (base 4)

| Token | px | Uso |
|---|---|---|
| `--space-1` | 4 | Ícone ↔ texto, selo interno |
| `--space-2` | 8 | Entre itens de lista, gap de botões |
| `--space-3` | 12 | Padding de campo, gap rótulo ↔ campo |
| `--space-4` | 16 | Padding de linha, gap de grade |
| `--space-5` | 24 | Padding de card, entre grupos |
| `--space-6` | 32 | Entre seções |
| `--space-7` | 48 | Margem de página (desktop) |
| `--space-8` | 64 | Topo de tela, respiro de herói |

Usar sempre `gap` em flex/grid. Nada de margem solta entre irmãos.

### 2.4 Forma, borda, sombra, movimento

```css
:root{
  --cut-sm:6px; --cut-md:12px;
  --chamfer:polygon(var(--c) 0,100% 0,100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%,0 var(--c));
  --t-fast:120ms; --t:200ms; --t-slow:360ms; --ease:cubic-bezier(.2,.7,.2,1);
  --z-sticky:10; --z-drawer:40; --z-overlay:80; --z-modal:100; --z-toast:120;
}
.chamfer-sm{--c:var(--cut-sm);clip-path:var(--chamfer)}
.chamfer-md{--c:var(--cut-md);clip-path:var(--chamfer)}
:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation-duration:0s!important;transition-duration:0s!important}}
html[data-motion="off"] *{animation:none!important;transition:none!important}
```

- **Raio:** sempre 0. A única exceção é o spinner.
- **Borda:** 1px `--border` em superfícies; 1px `--border-strong` em campos e botões secundários. Com `clip-path`, desenhe a borda como `box-shadow: inset 0 0 0 1px …`.
- **Sombra:** só `--shadow-float`, em modal, popover, toast e folha inferior.
- **Movimento:** só em resposta a ação. Troca de aba: fade + deslocamento de 8px. Resultado de dado: escala 1.08 → 1. Modal: abertura. Nenhum loop.

### 2.5 Componentes

**Botões:** altura 40px (44 no toque), padding 0 16px, gap 8px, Hanken 14/600.

| Variante | Padrão | Hover | Ativo | Foco | Desabilitado | Carregando |
|---|---|---|---|---|---|---|
| Primário | fundo `--primary`, texto `--on-primary`, chanfro 6 | `--primary-hover` | escurece + `scale(.98)` | anel | fundo `--surface-3`, texto `--text-disabled` | spinner 14px + "Criando…", `aria-busy` |
| Secundário | transparente, borda `--border-strong` | borda `--primary` + `--surface-2` | `--surface-3` | anel | borda `--surface-3`, texto desabilitado | spinner + `--text-2` |
| Terciário | texto `--primary` | `--primary-hover` + sublinhado (offset 4px) | escurece | anel | desabilitado | — |
| Perigo | secundário com texto `--danger` | fundo `--danger` | — | anel | como secundário | — |
| Ícone | 40×40 (44 toque), borda `--border-strong` | como secundário | — | anel | — | — |

Um primário por região. Rótulo sempre com verbo ("Criar mesa", nunca "OK"). Nunca em caixa alta.

**Campos**
- Rótulo sempre visível acima (mono 11, `--text-2`), com gap de 6px. Ajuda ou erro abaixo, em 13px.
- Campo com 40px (48 no celular), padding 0 12px, fundo `--surface-2` e borda `--border-strong`.
- Foco: borda `--primary` + halo `0 0 0 3px` do latão a 25%.
- Erro: borda `--danger` + mensagem que diz como corrigir ("O código tem 6 caracteres.").
- Desabilitado: fundo `--surface-1` e texto desabilitado, com o motivo embaixo.
- Select com `appearance:none` e chevron em `--primary`.
- Checkbox 18×18. Marcado: fundo do latão a 16% + losango de 8px.
- Toggle 36×20, reto.
- O placeholder é um exemplo ("Ex.: Crônicas do Rio Partido"), nunca o rótulo.

**Navegação**
- **Menu vertical:** item de 40px, sub-item de 36px com recuo de 16px.
  - Ativo: `--surface-2` + `inset 2px 0 0 var(--primary)` + losango de 6px.
  - Repouso: `--text-2`.
  - Contador em mono 11, `--text-3`, sem zero à esquerda.
- **Construtor:** grupos "1 · Regras / 2 · Personagem / 3 · Conteúdo", barra "9 de 12" e ◆ (configurado) / ◇ (pendente) em cada item.
- **Abas sublinhadas:** para navegação dentro do conteúdo. A ativa usa `--text` 600 + `inset 0 -2px 0 var(--primary)`.
- **Celular:** barra inferior de 72px com 4 destinos e rótulo visível.
- **Topbar:** 56px, com voltar + título (Fraunces 18) + subtítulo de 12px, e o contexto e as ações à direita.

**Cards e linhas**
- **Linha** ("minhas coisas"):
  - 64–72px, `--surface-1`, borda `--border`, avatar de 44 com chanfro 6.
  - Nome em uma linha com reticências + `title`.
  - Meta de 13px num formato fixo ("Sistema · N jogadores · Mestre: X").
  - Hover: `--surface-2` + `--border-strong`.
- **Card** (loja): chanfro 12, padding 20–24, título em Fraunces 20, descrição com `line-clamp:3` e meta "por X · N status · N classes".
- **Selo:** mono 11, padding 3px 8px. Três tipos: preenchido (Destaque), contorno (Mestre/Jogador) ou estado com fundo a 12%.

**Feedback**
- **Aviso em linha:** fundo da cor de estado a 8% e borda a 35%, com losango de 8px + título em 600 + explicação + ação à direita.
- **Toast:** `--surface-2` + sombra, no canto inferior, 5s, com ação.
- **Skeleton:** o mesmo formato do conteúdo final, com shimmer de 1.4s (desligado com reduced-motion).
- **Vazio:** losango de 22–28px + título em Fraunces + uma frase de "o que é / como começar" + 1 ou 2 botões.
- **Diálogo:** `--surface-2`, chanfro 12, sombra, título em Fraunces 24, ações à direita. Substitui **todo** `alert()`/`confirm()`.

---

## 3. Telas

### 3.1 Login (`login.html`)
- **Desktop:** duas colunas. O herói (`--surface-1`, marca, "Sua campanha, com as suas regras." em Fraunces 56) e o formulário com largura máxima de 400px.
- **Entrar / Criar conta:** abas sublinhadas.
- **Entrar:** e-mail, senha ("Mostrar" dentro do campo, "Esqueci a senha" na linha do rótulo) e o primário em largura total.
- **Criar conta:** nome de exibição, e-mail, senha com indicador de força.
- **Erro:** aviso em linha acima dos campos + borda de erro. Nunca apague o e-mail digitado.
- **Carregando:** spinner + "Entrando…" / "Criando conta…", com os campos desabilitados.
- **Celular:** uma coluna, com o primário no rodapé. Sem partículas.

### 3.2 Lobby (`app.html`)
- **Topbar:** marca à esquerda; avatar + nome à direita, com um menu que inclui Tema. O ☼ flutuante sai.
- **Lateral fixa (sticky):** menu + o bloco "Próxima sessão" com "Abrir mesa →".
- **Mesas:**
  - O H1 "Minhas mesas" + o secundário "Entrar com código" + o primário "+ Nova mesa".
  - As abas Todas / Como Mestre / Como Jogador, com contagem e busca à direita.
  - Linhas com avatar · nome · meta · quando (a próxima sessão em latão) · selo · chevron.
- **Os formulários de criar e entrar viram diálogos.**
- **Nova mesa:** campo Sistema (select + meta "12 status · 4 classes…") e campo Nome.
  - Erro no campo.
  - Sucesso: "Mesa criada", código em mono de 22px, "Copiar", "Depois" e "Abrir mesa".
- **Entrar com código:** campo mono de 6 caracteres, com auto-maiúscula. Erro: "Código não encontrado. Confira com o Mestre."
- **Estados:**
  - Carregando: 5 linhas skeleton.
  - Vazio: "Nenhuma mesa ainda" + os dois botões + um link para a loja.
  - Erro: "Não foi possível carregar as mesas. Suas mesas não foram perdidas." + "Tentar de novo".
- **Sistemas / Itens:** "Meus" em linhas e a Loja em cards.
- **Celular:** o H1, os botões lado a lado (44px), as abas, as linhas compactas e a barra inferior.

### 3.3 Mesa (`mesa.html`)
- **Topbar:** voltar · mesa + "Sessão 14 · Sistema" · avatares do grupo (traço verde = online) + "3 online".
- **Esquerda (220px):** mini-cabeçalho do personagem + o menu (Ficha, Inventário, Habilidades, Árvores, Anotações, Biografia).
- **Ficha, nesta ordem:**
  1. **Cabeçalho:** retrato de 96px com chanfro 12 (monograma quando não há imagem), nome em Fraunces 32, tags neutras (classe só com acento de 2px) e "Editar".
  2. **Recursos:** rótulo · barra de 8px com largura flexível · "38 / 56" em Fraunces 22 tabular · −/+ de 40px.
  3. **Status:** grade de 6. **Clicar rola 1d20 + valor.** O hover mostra a borda `--primary` + "Rolar 1d20+9". Sem −/+ quando não há pontos.
  4. **Combate:** lista de 3 colunas "Nome …… valor", sem "=" e sem ícones coloridos. Os ataques são clicáveis.
  5. **Perícias:** 2 colunas em ordem alfabética, com o 0 em `--text-3`. Clicáveis.
- **Pontos para distribuir:**
  - Aviso no topo de Status: "2 pontos para distribuir." + "Concluir".
  - Os −/+ aparecem só nesse estado: o + em latão, e o − só nos pontos gastos agora.
  - O ganho aparece como "+1" em `--success`.
- **Direita (320px):**
  - Abas Rolagens / Conversa, com as não lidas.
  - Histórico alinhado embaixo: quem · hora, total em Fraunces, o que foi rolado e o detalhe mono ("1d20 [15] + FOR 9").
    - A rolagem do próprio jogador fica maior e em latão.
    - A falha crítica fica em `--danger` e o crítico em `--warning` ("◆ Crítico · 20 natural").
  - Rodapé: d4 a d20 (40px) + o campo de fórmula ("2d6+3") + "Rolar". **O seletor de quantidade, o de dado e a opção "Avançado" saem.**
- **Sem conexão:** "2 rolagens na fila, enviadas ao reconectar." (*função nova, a confirmar*)
- **Vazios:** "Mochila vazia" + "Ver itens do sistema"; "Nenhum combate em andamento" + (Mestre) "Iniciar combate".
- **Celular:** topbar com ⋯, abas sublinhadas com rolagem, −/+ de 44px e Status em 3 colunas. **Rodapé fixo:** última rolagem + "Histórico" (folha) + o primário "Dados" (folha).

### 3.4 Construtor (`sistema.html`)
- **Topbar:**
  - Voltar + o nome do sistema + "Construtor de sistema".
  - O salvamento automático: "Salvando…", "Salvo há 5s" ou erro.
  - As ações "Testar numa ficha" (*nova, a confirmar*) e o primário "Publicar".
- **Lateral (240px):** "Configurado 9 de 12" + os 3 grupos numerados com ◆/◇.
- **Centro:**
  - Eyebrow "1 · Regras", o H1 e "+ Novo status".
  - Um parágrafo de ajuda.
  - Grupos (Recursos, Atributos) com linhas de 48px: ⋮⋮ · losango da cor · nome · sigla mono · resumo.
- **Editor à direita (380px):**
  - Nome.
  - Nome na fórmula, com um exemplo de uso.
  - Tipo, num seletor segmentado (Recurso / Atributo / Combate / Oculto), com explicação por tipo.
  - Cor, com 8 amostras curadas.
  - Valor inicial.
  - No rodapé, "Excluir status" (abre diálogo) + "Alterações salvas automaticamente".
- **Cálculos vira o tipo "Oculto"** dentro de Status.
- **Validação:** "FRE já é usado por Frequência. Escolha outro."
- **Estados:**
  - Vazio: "Nenhum status ainda" + "Status em branco" + o primário "Usar modelo d20 · 6 atributos" (*novo, a confirmar*).
  - Erro ao salvar: mantém a alteração + "Tentar de novo".
  - Publicado: toast com "Ver na loja".
- **Celular:** a lista em largura total. O editor abre em folha inferior (puxador, "Pronto"), e o tipo vira uma grade 2×2 com botões de 44px.

### 3.5 Crystarium (`arvore.html`)
- O canvas fica **sempre escuro**, também no tema claro. Só a UI ao redor segue o tema.
- Legenda com losangos nas cores oklch da via, num painel com chanfro 12, recolhível.
- Controles como botões de ícone de 40px com `aria-label`.
- O nome do usuário usa o `.nav-user` padrão, sem caixa alta.

---

## 4. Resumo das mudanças

| Mudança | Justificativa |
|---|---|
| Lista de mesas como conteúdo principal do lobby | A tarefa mais frequente (voltar à campanha) fica a zero rolagens. Criar e entrar viram diálogos curtos. |
| Rolagem por contexto na ficha | Clicar em Força, Percepção ou Ataque rola direto. Tira 3 decisões da ação mais repetida do jogo. |
| Efeitos contínuos removidos | Brilhos, varreduras, textura e partículas saem. O destaque vem da cor de ação e do degrau de superfície, e cansa menos em sessões longas. |
| Tokens fechados: 14 cores, 8 espaços, 2 chanfros, 3 durações | Acaba com as variações sem motivo e com os 124 !important. Qualquer tela nova já nasce consistente. |
| Rótulo visível em todo campo + foco de 2px | Resolve os 91 campos sem rótulo e a navegação por teclado. Beneficia todos, não só quem usa leitor de tela. |
| Estados de carregamento, erro e vazio com próxima ação | O usuário nunca confunde "carregando" com "não existe", e todo beco sem saída ganha um botão. |
| Construtor agrupado em 3 etapas com progresso | Mostra a ordem natural de montar um sistema e o que ainda falta. |
| Celular com barra inferior e ficha em abas | Os 4 destinos principais ao alcance do polegar, e o botão Rolar fixo na ficha. |

## 5. O que testar com usuários reais

1. **Tarefa cronometrada.** "Volte para a sua campanha e role Percepção." Medir: Tempo até o resultado e número de cliques. Meta: menos de 10s e 2 cliques. Compare com a versão atual.
2. **Primeiro uso.** "Crie um sistema com 3 status e uma classe." Medir: Se a pessoa segue a ordem 1 → 2 → 3 sem ajuda, onde hesita e se os indicadores ◇/◆ são entendidos.
3. **Jogador convidado.** "Você recebeu o código K7Q2MX. Entre na mesa." Medir: Se o botão "Entrar com código" é encontrado sem instrução. Meta: 100% em até 15s.
4. **Sessão real.** Observar uma sessão de 2h com 4 jogadores, em notebook e celular. Medir: Onde olham durante o turno, se o histórico é lido, erros de toque em −/+ de Vida e cansaço visual relatado no fim.
5. **Acessibilidade.** Rodar a ficha e o lobby só com teclado e com leitor de tela (NVDA/VoiceOver). Medir: Todo controle alcançável, foco sempre visível e rótulos anunciados corretamente.
6. **Preferência A/B.** Mostrar a ficha com e sem os efeitos antigos. Medir: Se a versão calma ainda é percebida como "FFXIII" e premium. Se não for, recolocar um único efeito de assinatura (o cursor ◆ animado).

---

## 6. Plano de implementação

Faça cada etapa num commit.

1. **Tokens:** crie `lib/tokens.css` com a seção 2 e carregue antes do `theme.css` em todas as páginas. Crie aliases dos tokens antigos (`--brass` → `--primary` etc.).
2. **Componentes:** crie `lib/components.css` com a seção 2.5, usando só tokens.
3. **Limpeza:** troque os hex soltos do `theme.css` por tokens e remova do `theme-ffx.css` o que os componentes cobrem. A meta é zero `!important`.
4. **Remover efeitos:** `vtSweep`, `vtPulse` em loop, `vtDrift`, as texturas listradas, `particles.js` e `.ffx-corners`.
5. **Telas, uma por vez:** login → lobby → mesa → construtor → árvore (seção 3).
6. **Acessibilidade:** rótulo ou `aria-label` em todo campo, `:focus-visible` global, `alert`/`confirm` substituídos por diálogo, emoji substituídos por ícones de traço e áreas de toque de 44px.
7. **Checklist por tela:**
   - Temas escuro e claro.
   - Janelas de 1440×900, 900×540 e 390×844.
   - Navegação só por teclado.
   - Estados de carregando, vazio, erro e sucesso.
   - Conteúdo longo (nomes de 60 caracteres, 30 mesas).

### Prompt para o Claude Code

```
Leia CLAUDE.md e docs/DESIGN-v2-LATAO-CALMO.md.
Execute só a etapa 1 da seção 6 (tokens): crie lib/tokens.css com os valores exatos da seção 2 e carregue-o em todas as páginas antes do theme.css.
Crie aliases dos tokens antigos (--brass, --bone, --ink-dim, --ink-faint, --line, --line2, --panel, --panel-2, --maq etc.) apontando para os novos, para nada quebrar.
Não mude layout nem JS. Teste os dois temas e me liste as cores antigas que não tiveram equivalente.
```
Repita com a etapa 2, 3 etc. Nas etapas 5 e 6, faça uma tela por vez e mostre o resultado antes da próxima.

### Decisões pendentes
- Funções novas propostas: **"Testar numa ficha"**, **"Usar modelo d20"** e a **fila de rolagens offline**.
- **Cálculos → tipo "Oculto" em Status:** isso muda o modelo de dados?
- **Rolagem por contexto:** o sistema pode definir outra fórmula por status (ex.: 2d6)? Se puder, a dica de hover precisa ler essa fórmula.
