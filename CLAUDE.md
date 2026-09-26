# Vitality — instruções para o Claude Code

## Design
- A linguagem visual oficial está em `docs/DESIGN-FFXIII.md`. **Leia antes de mexer em qualquer UI.**
- O CSS base é `lib/theme.css` (tokens). A camada de redesign fica em `lib/theme-ffx.css`, carregada logo depois em todas as páginas.
- Novos componentes usam as classes `ffx-*` (`ffx-panel`, `ffx-menu`, `ffx-label`, `ffx-row`, `ffx-field`, `ffx-layout`).
- Proibido: `border-radius` em painéis/botões, abas horizontais para navegação principal, emoji, cores de acento novas fora dos tokens.
- Toda superfície com `clip-path` usa `box-shadow: inset 0 0 0 1px ...` como borda.
- Todo elemento clicável tem hover de deslizar (`translateX(5–6px)`) ou subir (`translateY(-4px)`) com `var(--ease)`.
- Toda animação respeita `prefers-reduced-motion` e `html[data-motion="off"]`.

## Ao terminar uma tela
Rodar o checklist da §8 de `docs/DESIGN-FFXIII.md` nos temas claro e escuro, em 1440, 1024, 820 e 390px.
