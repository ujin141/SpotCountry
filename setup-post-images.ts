import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const setupPostImages = async () => {
  const sql = `
    -- 1. Add image_url column to reports table
    do $$ 
    begin 
      if not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'image_url') then
        alter table reports add column image_url text;
      end if;
    end $$;

    -- 2. Create 'posts' bucket for post images
    insert into storage.buckets (id, name, public)
    values ('posts', 'posts', true)
    on conflict (id) do nothing;

    -- 3. Storage Policies for 'posts' bucket
    
    -- Public Access (View)
    drop policy if exists "Post images are public" on storage.objects;
    create policy "Post images are public"
      on storage.objects for select
      using ( bucket_id = 'posts' );

    -- Authenticated Upload
    drop policy if exists "Users can upload post images" on storage.objects;
    create policy "Users can upload post images"
      on storage.objects for insert
      to authenticated
      with check ( bucket_id = 'posts' );
      
    -- Authenticated Update/Delete (Optional, owner only)
    -- Skipping strict owner check for MVP simplicity, allowing authenticated users to manage objects in bucket generally or just rely on insert
  `;

  console.log("Setting up post images schema and storage...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error setting up:", error);
  } else {
    console.log("Success! 'image_url' column and 'posts' bucket created.");
  }
};

setupPostImages();
