import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const setupStorage = async () => {
  const sql = `
    -- 1. Create 'avatars' bucket if not exists
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do nothing;

    -- 2. Enable RLS (Should be enabled by default, but ensuring policies works)
    -- alter table storage.objects enable row level security;

    -- 3. Create Policies (Drop first to avoid conflicts if re-running)
    
    -- Public Access
    drop policy if exists "Avatar images are publicly accessible." on storage.objects;
    create policy "Avatar images are publicly accessible."
      on storage.objects for select
      using ( bucket_id = 'avatars' );

    -- Authenticated Upload
    drop policy if exists "Anyone can upload an avatar." on storage.objects;
    create policy "Anyone can upload an avatar."
      on storage.objects for insert
      with check ( bucket_id = 'avatars' );
      
    -- Update (Users can replace images)
    drop policy if exists "Anyone can update their own avatar." on storage.objects;
    create policy "Anyone can update their own avatar."
      on storage.objects for update
      using ( bucket_id = 'avatars' );
  `;

  console.log("Setting up storage...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error setting up storage:", error);
  } else {
    console.log("Storage 'avatars' bucket ready!");
  }
};

setupStorage();
