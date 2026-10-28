-- Scores were replaced wholesale, so two quick clicks racing a background refresh could lose one
-- (seen in testing: A=4 vanished, B and C kept). Merge per ability instead: saving B never touches A.
create or replace function public.employer_update(p_code text, p_key uuid, p_id uuid,
  p_scores jsonb default null, p_follow_up text default null, p_decision text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from invites where code = p_code and employer_key = p_key) then
    raise exception 'not allowed';
  end if;
  if p_scores is not null and (jsonb_typeof(p_scores) <> 'object' or exists (
       select 1 from jsonb_each(p_scores) e
       where e.key not in ('A', 'B', 'C') or jsonb_typeof(e.value) <> 'number' or (e.value)::int not between 1 and 4)) then
    raise exception 'scores must be A/B/C with values 1-4';
  end if;
  update submissions set
    scores    = case when p_scores is null then scores else scores || p_scores end,
    follow_up = coalesce(p_follow_up, follow_up),
    decision  = coalesce(p_decision, decision)
  where id = p_id and invite_code = p_code;
end $$;
