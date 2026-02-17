-- 1. Enable RLS on all tables
alter table profiles enable row level security;
alter table reports enable row level security;
alter table tours enable row level security;
alter table ads enable row level security;
alter table bookings enable row level security;
alter table traffic enable row level security;
alter table post_likes enable row level security;

-- 2. Helper function for admin check (Used in policies)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 3. Profiles Policies (Row Level Security)
-- Everyone can read public profiles (but not all columns due to column privileges below)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 4. Column Level Security for Profiles (Hide Email)
-- Revoke default access
revoke select on table profiles from anon, authenticated;
-- Grant access to safe columns only
grant select (id, name, avatar_url, bio, role, is_verified, status, created_at) on table profiles to anon, authenticated;
-- Allow service_role (server-side) full access
grant all on table profiles to service_role;

-- 5. Admin Access Function (Bypasses Column Security)
create or replace function public.get_admin_profiles()
returns setof profiles as $$
begin
  -- Only allow admins to call this
  if not public.is_admin() then
    raise exception 'Access Denied';
  end if;
  
  return query select * from profiles order by created_at desc;
end;
$$ language plpgsql security definer;

-- 6. Reports (Posts/Comments) Policies
create policy "Reports are viewable by everyone"
  on reports for select
  using ( true );

create policy "Authenticated users can create reports"
  on reports for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update own reports"
  on reports for update
  using ( auth.uid() = user_id or public.is_admin() );

create policy "Users can delete own reports"
  on reports for delete
  using ( auth.uid() = user_id or public.is_admin() );

-- 7. Tours Policies
create policy "Tours are viewable by everyone"
  on tours for select
  using ( true );

create policy "Only admins/partners can insert tours"
  on tours for insert
  with check ( public.is_admin() or exists (select 1 from profiles where id = auth.uid() and role = 'partner') );

create policy "Only admins/partners can update tours"
  on tours for update
  using ( public.is_admin() or exists (select 1 from profiles where id = auth.uid() and role = 'partner') );

-- 8. Ads Policies
create policy "Ads are viewable by everyone"
  on ads for select
  using ( status = 'active' or public.is_admin() );

create policy "Admins can manage ads"
  on ads for all
  using ( public.is_admin() );

-- 9. Bookings Policies (Sensitive Data)
create policy "Users can view own bookings"
  on bookings for select
  using ( auth.uid() = user_id or public.is_admin() );

create policy "Authenticated users can create bookings"
  on bookings for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update bookings"
  on bookings for update
  using ( public.is_admin() );

-- 10. Traffic Policies (Analytics)
create policy "Traffic is insertable by everyone (anon)"
  on traffic for insert
  with check ( true );

create policy "Traffic is viewable by admins only"
  on traffic for select
  using ( public.is_admin() );

-- 11. Post Likes Policies
create policy "Likes are viewable by everyone"
  on post_likes for select
  using ( true );

create policy "Users can toggle likes"
  on post_likes for all
  using ( auth.uid() = user_id );

-- 12. Storage Policies (Avatars)
-- Note: You must create 'avatars' bucket first in Storage settings
-- These policies apply to storage.objects table
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );

-- 13. Storage Policies (Posts)
-- Note: You must create 'posts' bucket first
create policy "Post images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'posts' );

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );

create policy "Users can update their own post images"
  on storage.objects for update
  using ( bucket_id = 'posts' and auth.uid() = owner );

create policy "Users can delete their own post images"
  on storage.objects for delete
  using ( bucket_id = 'posts' and auth.uid() = owner );

-- 14. Trigger for New User Profile Creation (Sync Auth to Public Profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Sync email and metadata changes
  if (tg_op = 'UPDATE') then
    update public.profiles
    set
      email = new.email,
      name = coalesce(new.raw_user_meta_data->>'full_name', name),
      avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url)
    where id = new.id;
    return new;
  end if;

  insert into public.profiles (id, email, name, role, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();
