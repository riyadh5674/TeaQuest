-- =========================================================
--  TEAQUEST — SUPABASE SCHEMA (Phase 1)
--  Paste this whole file into: SQL Editor → New query → Run
-- =========================================================


-- ---------------------------------------------------------
-- 1. PROFILES — one row per player, linked to auth user
-- ---------------------------------------------------------

create table public.profiles (

    id uuid primary key references auth.users (id) on delete cascade,

    name text not null default 'New Brewer',

    email text not null,

    role text not null default 'player'
        check (role in ('player', 'admin')),

    xp integer not null default 0,

    discoveries jsonb not null default '[]',

    achievements jsonb not null default '[]',

    roulette_spins integer not null default 0,

    created_at timestamptz not null default now()

);


-- ---------------------------------------------------------
-- 2. PRODUCTS — same ids as the current site (tea-001…)
-- ---------------------------------------------------------

create table public.products (

    id text primary key,

    name text not null,

    category text not null,

    price numeric(10, 2) not null,

    icon text not null default '🍵',

    rating numeric(2, 1) not null default 5.0,

    rarity text not null default 'common',

    origin text not null default '',

    flavor_notes text not null default '',

    moods jsonb not null default '[]',

    flavor_profile jsonb not null default '[]',

    strength text not null default 'medium',

    description text not null default '',

    stock integer not null default 50,

    created_at timestamptz not null default now()

);


-- ---------------------------------------------------------
-- 3. ORDERS + ORDER ITEMS
-- ---------------------------------------------------------

create table public.orders (

    id uuid primary key default gen_random_uuid (),

    user_id uuid not null
        references public.profiles (id) on delete cascade,

    customer text not null,

    address text not null,

    phone text not null default '',

    payment text not null default 'card',

    total numeric(10, 2) not null,

    status text not null default 'PROCESSING'
        check (status in ('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),

    created_at timestamptz not null default now()

);


create table public.order_items (

    id bigint generated always as identity primary key,

    order_id uuid not null
        references public.orders (id) on delete cascade,

    product_id text
        references public.products (id) on delete set null,

    name text not null,

    price numeric(10, 2) not null,

    quantity integer not null

);


-- ---------------------------------------------------------
-- 4. FAVORITES
-- ---------------------------------------------------------

create table public.favorites (

    user_id uuid not null
        references public.profiles (id) on delete cascade,

    product_id text not null
        references public.products (id) on delete cascade,

    primary key (user_id, product_id)

);


-- =========================================================
--  SECURITY — ROW LEVEL SECURITY
--  The database itself enforces who may do what.
-- =========================================================


alter table public.profiles enable row level security;

alter table public.products enable row level security;

alter table public.orders enable row level security;

alter table public.order_items enable row level security;

alter table public.favorites enable row level security;


-- Helper: is the current logged-in user an admin?

create function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid ()
          and role = 'admin'
    );
$$;


-- PROFILES: you see/edit yourself, admins see everyone

create policy "profiles_select"
    on public.profiles for select
    using (id = auth.uid () or public.is_admin ());

create policy "profiles_insert"
    on public.profiles for insert
    with check (id = auth.uid ());

create policy "profiles_update"
    on public.profiles for update
    using (id = auth.uid () or public.is_admin ())
    with check (id = auth.uid () or public.is_admin ());


-- Block players from promoting themselves to admin

create function public.prevent_role_escalation ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.role is distinct from old.role
       and not public.is_admin () then
        raise exception 'Only admins can change roles';
    end if;
    return new;
end;
$$;

create trigger protect_profile_role
    before update on public.profiles
    for each row
    execute function public.prevent_role_escalation ();


-- PRODUCTS: everyone reads, only admins write

create policy "products_select"
    on public.products for select
    using (true);

create policy "products_insert"
    on public.products for insert
    with check (public.is_admin ());

create policy "products_update"
    on public.products for update
    using (public.is_admin ());

create policy "products_delete"
    on public.products for delete
    using (public.is_admin ());


-- ORDERS: you see yours, admins see all; only admins change status

create policy "orders_select"
    on public.orders for select
    using (user_id = auth.uid () or public.is_admin ());

create policy "orders_insert"
    on public.orders for insert
    with check (user_id = auth.uid ());

create policy "orders_update"
    on public.orders for update
    using (user_id = auth.uid () or public.is_admin ());

create policy "orders_delete"
    on public.orders for delete
    using (public.is_admin ());


-- ORDER ITEMS: visible if the parent order is visible

create policy "order_items_select"
    on public.order_items for select
    using (
        exists (
            select 1 from public.orders o
            where o.id = order_id
              and (o.user_id = auth.uid () or public.is_admin ())
        )
    );

create policy "order_items_insert"
    on public.order_items for insert
    with check (
        exists (
            select 1 from public.orders o
            where o.id = order_id
              and o.user_id = auth.uid ()
        )
    );


-- FAVORITES: private to each player

create policy "favorites_all"
    on public.favorites for all
    using (user_id = auth.uid ())
    with check (user_id = auth.uid ());


-- ---------------------------------------------------------
-- AUTO-CREATE PROFILE when someone signs up
-- ---------------------------------------------------------

create function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, name)
    values (
        new.id,
        new.email,
        coalesce (
            new.raw_user_meta_data ->> 'name',
            split_part (new.email, '@', 1)
        )
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user ();


-- ---------------------------------------------------------
-- SEED — your 8 teas (safe to re-run)
-- ---------------------------------------------------------

insert into public.products
    (id, name, category, price, icon, rating, rarity, origin,
     flavor_notes, moods, flavor_profile, strength, description)
values
    ('tea-001', 'Forest Mint', 'green', 12, '🌿', 4.9, 'common',
     'Misty Highland Slopes', 'Cool, Grassy, Bright',
     '["calm","focused"]', '["fresh"]', 'light',
     'Fresh mountain green tea with cool mint leaves.'),

    ('tea-002', 'Dragon Ember', 'black', 15, '🔥', 4.8, 'uncommon',
     'Ember Valley Roasteries', 'Smoky, Caramel, Bold',
     '["energetic","adventurous"]', '["spicy","earthy"]', 'bold',
     'A powerful roasted black tea with smoky caramel notes.'),

    ('tea-003', 'Moon Blossom', 'herbal', 14, '🌸', 5.0, 'uncommon',
     'Moon Garden Terraces', 'Floral, Calming, Light',
     '["calm","cozy"]', '["floral"]', 'light',
     'A calming floral infusion for quiet nights.'),

    ('tea-004', 'Emerald Mist', 'green', 18, '🍃', 4.9, 'rare',
     'Cloudpeak Highlands', 'Silky, Clean, Delicate',
     '["focused","calm"]', '["fresh","floral"]', 'medium',
     'Rare highland leaves with a clean, silky finish.'),

    ('tea-005', 'Sunset Chai', 'special', 17, '☀️', 4.7, 'rare',
     'Golden Highlands Market', 'Spiced, Warm, Vanilla',
     '["cozy","adventurous"]', '["spicy","fruity"]', 'medium',
     'Warm spices, black tea and golden vanilla.'),

    ('tea-006', 'Wizard''s Berry', 'herbal', 16, '🫐', 4.8, 'rare',
     'Moon Garden Thicket', 'Berry, Tart, Magical',
     '["cozy","adventurous"]', '["fruity"]', 'light',
     'Wild berry herbs blended into a magical crimson brew.'),

    ('tea-007', 'Iron Leaf', 'black', 19, '⚔️', 4.6, 'epic',
     'Ember Valley Forge', 'Deep, Malty, Robust',
     '["energetic","adventurous"]', '["earthy","spicy"]', 'bold',
     'Bold, deep and powerful enough for an early quest.'),

    ('tea-008', 'Golden Phoenix', 'special', 25, '🐉', 5.0, 'legendary',
     'The Golden Highlands Summit', 'Rare, Radiant, Complex',
     '["adventurous","energetic"]', '["spicy","fruity"]', 'bold',
     'Our legendary limited-edition tea for elite brewers.')

on conflict (id) do nothing;


-- =========================================================
--  FINAL STEP (run AFTER you sign up on the site):
--  Make yourself the Guild Master — replace the email below
--  with the account you will log in with, then run:
--
--  update public.profiles
--  set role = 'admin'
--  where email = 'your-email@example.com';
-- =========================================================
