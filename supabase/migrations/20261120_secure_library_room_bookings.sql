-- Goff-Nelson Memorial Library: private-by-default booking schema.
-- Do not apply to the unrelated Classic Meez Supabase project.
-- Intended for a dedicated Goff-Nelson project. All requests require server verification.
-- PostgreSQL 17+; Supabase. Reviewed against official Postgres ranges and Supabase RLS docs.
create extension if not exists btree_gist with schema extensions;

create table if not exists public.library_rooms (
  slug text primary key,
  display_name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint room_slug_valid check (slug ~ '^[a-z0-9-]{2,50}$')
);
insert into public.library_rooms(slug,display_name) values ('simmons','Simmons Room')
on conflict (slug) do nothing;

create table if not exists public.library_room_requests (
  id uuid primary key default gen_random_uuid(),
  room_slug text not null references public.library_rooms(slug) on delete restrict,
  local_date date not null,
  local_start time without time zone not null,
  local_end time without time zone not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text not null default '',
  event_purpose text not null,
  collects_money boolean not null default false,
  status text not null default 'pending',
  request_fingerprint text not null,
  staff_notes text not null default '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_room_request_status check (status in ('pending','approved','rejected','cancelled')),
  constraint library_room_request_times check (local_end > local_start),
  constraint library_room_request_duration check ((local_end - local_start) between interval '30 minutes' and interval '12 hours'),
  constraint library_room_request_name_check check (char_length(trim(requester_name)) between 2 and 100),
  constraint library_room_request_email_check check (char_length(requester_email) between 5 and 200 and position('@' in requester_email) > 1),
  constraint library_room_request_phone_check check (char_length(requester_phone) <= 40),
  constraint library_room_request_purpose_check check (char_length(trim(event_purpose)) between 5 and 600),
  constraint library_room_request_fingerprint_check check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint library_room_request_staff_note_check check (char_length(staff_notes) <= 3000),
  constraint library_room_requests_nonoverlap exclude using gist (
    room_slug with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending','approved'))
);
create index if not exists library_room_requests_schedule_idx
on public.library_room_requests (room_slug, starts_at, ends_at)
where status in ('pending','approved');
create index if not exists library_room_requests_fingerprint_idx
on public.library_room_requests (request_fingerprint, created_at desc);

create or replace function public.library_room_request_guard()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
declare attempts int;
begin
  -- Authoritative timezone conversion happens in Postgres, not a visitor browser.
  if new.local_date is null or new.local_start is null or new.local_end is null then
    raise exception 'Missing date or time' using errcode='22023';
  end if;
  if new.local_end <= new.local_start then
    raise exception 'Invalid time interval' using errcode='22023';
  end if;
  new.starts_at := ((new.local_date + new.local_start) at time zone 'America/New_York');
  new.ends_at := ((new.local_date + new.local_end) at time zone 'America/New_York');
  if new.ends_at <= new.starts_at then
    raise exception 'Invalid timezone-adjusted interval' using errcode='22023';
  end if;
  -- Reject gap times that do not exist in the New York DST transition.
  if (new.starts_at at time zone 'America/New_York') <> (new.local_date + new.local_start)
     or (new.ends_at at time zone 'America/New_York') <> (new.local_date + new.local_end) then
    raise exception 'Invalid local time for America/New_York' using errcode='22023';
  end if;
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then raise exception 'New requests must be pending' using errcode='22023'; end if;
    if new.starts_at < now() + interval '15 minutes'
      or new.starts_at > now() + interval '370 days' then
      raise exception 'Room request must be within the booking window' using errcode='22023';
    end if;
    -- Serialize booking attempts for one daily HMAC fingerprint to enforce a rolling quota.
    perform pg_advisory_xact_lock(hashtext(new.request_fingerprint));
    select count(*) into attempts from public.library_room_requests
      where request_fingerprint = new.request_fingerprint and created_at >= now() - interval '1 hour';
    if attempts >= 3 then raise exception 'Request limit reached' using errcode='P0001'; end if;
  else
    -- Do not allow staff-side edits to silently change who requested the room.
    if (new.requester_name,new.requester_email,new.requester_phone,new.request_fingerprint,new.created_at)
        is distinct from
       (old.requester_name,old.requester_email,old.requester_phone,old.request_fingerprint,old.created_at) then
      raise exception 'Requester identity is immutable' using errcode='22023';
    end if;
  end if;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.library_room_request_guard() from public, anon, authenticated;
drop trigger if exists library_room_request_guard_trg on public.library_room_requests;
create trigger library_room_request_guard_trg
before insert or update on public.library_room_requests
for each row execute function public.library_room_request_guard();

create table if not exists public.library_room_audit (
 id bigint generated always as identity primary key,
 request_id uuid not null references public.library_room_requests(id) on delete cascade,
 old_status text,
 new_status text not null,
 actor uuid,
 changed_at timestamptz not null default now()
);
create or replace function public.library_room_audit_change()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
 if tg_op = 'INSERT' then
   insert into public.library_room_audit (request_id,new_status) values (new.id,new.status);
 elsif old.status is distinct from new.status then
   insert into public.library_room_audit(request_id,old_status,new_status,actor)
   values (new.id,old.status,new.status,new.reviewed_by);
 end if;
 return new;
end; $$;
revoke all on function public.library_room_audit_change() from public, anon, authenticated;
drop trigger if exists library_room_audit_trg on public.library_room_requests;
create trigger library_room_audit_trg after insert or update on public.library_room_requests
for each row execute function public.library_room_audit_change();

-- Defense in depth. No public policies. Only the server-side secret role can access booking data.
alter table public.library_rooms enable row level security;
alter table public.library_room_requests enable row level security;
alter table public.library_room_audit enable row level security;
revoke all on public.library_rooms, public.library_room_requests, public.library_room_audit from anon, authenticated, public;
revoke all on sequence public.library_room_audit_id_seq from anon, authenticated, public;
grant select, insert, update, delete on public.library_rooms,public.library_room_requests,public.library_room_audit to service_role;
grant usage, select on sequence public.library_room_audit_id_seq to service_role;

comment on table public.library_room_requests is
 'Sensitive patron data. Never expose via frontend keys or public select policies. Retention/deletion schedule required.';
