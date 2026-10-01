-- Árvores: barramento editável pelo Mestre (pontos e dobras de cada barra) e agrupamento por nível.
-- Rodar uma vez no editor SQL do Supabase (Project → SQL Editor → New query → colar → Run).
-- É seguro rodar de novo.
--
-- bus_config guarda:
--   group: 'level' (a barra junta todas as esferas do nível, de qualquer via) | 'via' (uma barra por via)
--   paths: { "<via ou *>|<nível>": [[x, y], ...] } — pontos da barra desenhada à mão; sem entrada = automático
alter table public.system_skill_trees
  add column if not exists bus_config jsonb not null default '{}'::jsonb;
