-- Árvores: "uma escolha por nível" passa a valer dentro de cada ramo do Núcleo.
-- Um ramo é o que continua ligado entre si quando se tira o Núcleo (ex.: a coluna Defensor e a coluna
-- Atacante, que só se encontram no Núcleo). Escolher no nível 2 de um ramo não trava o nível 2 do outro.
-- Rodar uma vez no editor SQL do Supabase (Project → SQL Editor → New query → colar → Run).
-- É seguro rodar de novo: só substitui a função do gatilho criado em 20260930_arvore_niveis_barramento.sql.
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

  -- uma escolha por nível: a via tem "lock" e o jogador já tem outra esfera desta via, neste nível,
  -- no mesmo ramo (as esferas alcançáveis a partir desta sem passar pelo Núcleo)
  select coalesce((v->>'lock')::boolean, false) into via_lock
    from jsonb_array_elements(coalesce(t.vias, '[]'::jsonb)) v
   where v->>'key' = n.fac
   limit 1;
  if coalesce(via_lock, false) then
    with recursive ramo(id) as (
      select n.id
      union
      select case when e.a = r.id then e.b else e.a end
        from ramo r
        join system_tree_edges e on e.tree_id = n.tree_id and (e.a = r.id or e.b = r.id)
        join system_tree_nodes x on x.id = case when e.a = r.id then e.b else e.a end
       where x.kind is distinct from 'core'
    )
    select o.name into taken
      from system_player_unlocks u
      join system_tree_nodes o on o.id = u.node_id
     where u.tree_id = n.tree_id and u.user_id = new.user_id
       and o.id <> n.id and o.fac is not distinct from n.fac and o.level = n.level
       and o.id in (select id from ramo)
     limit 1;
    if taken is not null then
      raise exception 'Você já escolheu "%" neste nível deste ramo.', taken using errcode = 'P0001';
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
