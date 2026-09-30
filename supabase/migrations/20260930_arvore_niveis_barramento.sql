-- Árvores: nível por esfera, "uma escolha por nível" (trava por via) e barramento de linhas.
-- Rodar uma vez no editor SQL do Supabase (Project → SQL Editor → New query → colar → Run).
-- É seguro rodar de novo: tudo usa IF NOT EXISTS / OR REPLACE.

-- 1) nível da esfera (vazio = sem nível: livre, como antes)
alter table public.system_tree_nodes
  add column if not exists level integer check (level is null or (level between 1 and 99));

-- 2) opções da árvore
alter table public.system_skill_trees
  add column if not exists edge_style text not null default 'lines' check (edge_style in ('lines', 'bus')),
  add column if not exists bus_dir text not null default 'auto' check (bus_dir in ('auto', 'down', 'up', 'right', 'left')),
  add column if not exists require_char_level boolean not null default false;
-- a trava ("uma escolha por nível") é por via e mora no JSON de vias que já existe: { key, name, color, lock: true }

-- 3) validação no servidor — roda em TODA gravação de desbloqueio, inclusive a da função
--    unlock_tree_node que já existe (conectividade + custo continuam lá; isto só acrescenta regras)
create or replace function public.enforce_tree_level_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n record;
  t record;
  via_lock boolean := false;
  taken text;
  char_level integer;
begin
  select id, tree_id, fac, level, kind into n from system_tree_nodes where id = new.node_id;
  if n.id is null or n.level is null or n.kind = 'core' then
    return new;
  end if;
  select id, system_id, vias, require_char_level into t from system_skill_trees where id = n.tree_id;

  -- uma escolha por nível: a via tem "lock" e o jogador já tem outra esfera desta via neste nível
  select coalesce((v->>'lock')::boolean, false) into via_lock
    from jsonb_array_elements(coalesce(t.vias, '[]'::jsonb)) v
   where v->>'key' = n.fac
   limit 1;
  if coalesce(via_lock, false) then
    select o.name into taken
      from system_player_unlocks u
      join system_tree_nodes o on o.id = u.node_id
     where u.tree_id = n.tree_id and u.user_id = new.user_id
       and o.id <> n.id and o.fac is not distinct from n.fac and o.level = n.level
     limit 1;
    if taken is not null then
      raise exception 'Você já escolheu "%" neste nível desta via.', taken using errcode = 'P0001';
    end if;
  end if;

  -- nível do personagem (opcional por árvore): usa o maior nível entre os personagens do jogador
  -- em mesas deste sistema (o progresso da árvore é por jogador, não por personagem)
  if coalesce(t.require_char_level, false) then
    select max(c.level) into char_level
      from characters c
      join campaigns ca on ca.id = c.campaign_id
     where c.user_id = new.user_id and ca.system_id = t.system_id;
    if coalesce(char_level, 1) < n.level then
      raise exception 'Esta habilidade exige nível %. Seu personagem está no nível %.', n.level, coalesce(char_level, 1) using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_tree_level_rules on public.system_player_unlocks;
create trigger trg_enforce_tree_level_rules
  before insert on public.system_player_unlocks
  for each row execute function public.enforce_tree_level_rules();
