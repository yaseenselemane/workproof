-- 90-day check-in: after hiring, the employer records how it went, so the test can be judged
-- against real outcomes. Closes the loop: a receipt is no longer the end of the record.
alter table public.submissions add column checkin jsonb check (
  checkin is null or (checkin->>'outcome' in ('strong', 'expected', 'struggling') and octet_length(checkin::text) < 2000)
);

drop function public.employer_update(text, uuid, uuid, jsonb, text, text);
create function public.employer_update(p_code text, p_key uuid, p_id uuid,
  p_scores jsonb default null, p_follow_up text default null, p_decision text default null, p_checkin jsonb default null)
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
    decision  = coalesce(p_decision, decision),
    checkin   = coalesce(p_checkin, checkin)
  where id = p_id and invite_code = p_code;
end $$;

-- Recreated so its row type picks up the new column.
create or replace function public.employer_list(p_code text, p_key uuid)
returns setof public.submissions language sql stable security definer set search_path = public as $$
  select s.* from submissions s
  join invites i on i.code = s.invite_code
  where i.code = p_code and i.employer_key = p_key
  order by s.submitted_at
$$;

revoke execute on function public.employer_update(text, uuid, uuid, jsonb, text, text, jsonb) from public;
grant execute on function public.employer_update(text, uuid, uuid, jsonb, text, text, jsonb) to anon, authenticated;
