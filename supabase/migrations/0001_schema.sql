-- WorkProof schema. Both tables are closed to clients: RLS on, no policies, no grants.
-- Every read and write goes through the security-definer functions below, which check
-- the invite code (candidates) or the per-invite employer key (employer).

create table public.invites (
  code         text primary key check (code ~ '^WP-[A-Z0-9]{4}$'),
  kit          jsonb not null check (octet_length(kit::text) < 20000),
  employer_key uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now()
);

create table public.submissions (
  id           uuid primary key default gen_random_uuid(),
  invite_code  text not null references public.invites(code) on delete cascade,
  candidate_no int not null check (candidate_no between 1 and 99),
  name         text not null check (char_length(name) between 1 and 120),
  answers      jsonb not null check (octet_length(answers::text) < 8000),
  minutes      int not null check (minutes between 0 and 600),
  submitted_at timestamptz not null default now(),
  scores       jsonb not null default '{}'::jsonb,
  follow_up    text not null default '' check (char_length(follow_up) <= 2000),
  decision     text check (decision in ('interview', 'hold', 'decline')),
  sample       boolean not null default false
);
create index submissions_invite_code_idx on public.submissions (invite_code);

alter table public.invites enable row level security;
alter table public.submissions enable row level security;
revoke all on public.invites, public.submissions from anon, authenticated;

-- Employer creates a link; gets back the key that unlocks answers. Seeds are demo rows, tagged sample.
create function public.create_invite(p_code text, p_kit jsonb, p_seeds jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare k uuid;
begin
  if jsonb_typeof(p_seeds) <> 'array' or jsonb_array_length(p_seeds) > 5 then
    raise exception 'seeds must be an array of at most 5';
  end if;
  insert into invites (code, kit) values (p_code, p_kit) returning employer_key into k;
  insert into submissions (invite_code, candidate_no, name, answers, minutes, submitted_at, sample)
  select p_code, (s->>'candidateNo')::int, s->>'name', s->'answers', (s->>'minutes')::int,
         to_timestamp((s->>'submittedAt')::double precision / 1000), true
  from jsonb_array_elements(p_seeds) s;
  return k;
end $$;

-- Candidate: read the test, see which numbers are taken (no names), submit once.
create function public.get_kit(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select kit from invites where code = p_code
$$;

create function public.taken_numbers(p_code text)
returns int[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(candidate_no), '{}') from submissions where invite_code = p_code
$$;

create function public.submit_answers(p_code text, p_candidate_no int, p_name text, p_answers jsonb, p_minutes int)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not exists (select 1 from invites where code = p_code) then raise exception 'unknown link'; end if;
  insert into submissions (invite_code, candidate_no, name, answers, minutes)
  values (p_code, p_candidate_no, trim(p_name), p_answers, p_minutes)
  returning id into new_id;
  return new_id;
end $$;

-- Employer only, with the key: list answers (names included; the app hides them until all are scored)
create function public.employer_list(p_code text, p_key uuid)
returns setof public.submissions language sql stable security definer set search_path = public as $$
  select s.* from submissions s
  join invites i on i.code = s.invite_code
  where i.code = p_code and i.employer_key = p_key
  order by s.submitted_at
$$;

-- ...and record scores, the live-question answer, and the decision. Nulls leave a field unchanged.
create function public.employer_update(p_code text, p_key uuid, p_id uuid,
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
    scores    = coalesce(p_scores, scores),
    follow_up = coalesce(p_follow_up, follow_up),
    decision  = coalesce(p_decision, decision)
  where id = p_id and invite_code = p_code;
end $$;

revoke execute on all functions in schema public from public;
grant execute on function public.create_invite(text, jsonb, jsonb),
                          public.get_kit(text),
                          public.taken_numbers(text),
                          public.submit_answers(text, int, text, jsonb, int),
                          public.employer_list(text, uuid),
                          public.employer_update(text, uuid, uuid, jsonb, text, text)
  to anon, authenticated;
