-- Modelos de árvore: árvores salvas na conta, sem sistema (Criação → Criar → Árvores).
-- O Mestre desenha o modelo uma vez e importa cópias dele nos sistemas que quiser; cada cópia é
-- independente (mexer no sistema não muda o modelo, e vice-versa).
-- Rodar uma vez no editor SQL do Supabase (Project → SQL Editor → New query → colar → Run).
-- É seguro rodar de novo.
--
-- data guarda o desenho inteiro:
--   { tree:  { grid_shape, bg_color, ring_color, ring_opacity, edge_color, vias, edge_style, bus_dir,
--              require_char_level, bus_config },
--     nodes: [{ id, name, kind, fac, size, shape, color, cost, descr, x, y, level, enabled }],
--     edges: [{ id, a, b }] }
-- Os ids dentro de data são só do modelo; ao importar, viram esferas e conexões novas do sistema.
create table if not exists public.tree_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tree_templates_owner_idx on public.tree_templates (owner_id, updated_at desc);

alter table public.tree_templates enable row level security;

-- cada um só vê e mexe nos próprios modelos
drop policy if exists tree_templates_select on public.tree_templates;
create policy tree_templates_select on public.tree_templates
  for select using (owner_id = auth.uid());
drop policy if exists tree_templates_insert on public.tree_templates;
create policy tree_templates_insert on public.tree_templates
  for insert with check (owner_id = auth.uid());
drop policy if exists tree_templates_update on public.tree_templates;
create policy tree_templates_update on public.tree_templates
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists tree_templates_delete on public.tree_templates;
create policy tree_templates_delete on public.tree_templates
  for delete using (owner_id = auth.uid());
