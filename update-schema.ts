import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const updateSchema = async () => {
  const sql = `
    -- Add columns to reports table if they don't exist (Check again)
    do $$ 
    begin 
      if not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'likes') then
        alter table reports add column likes int default 0;
      end if;

      if not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'parent_id') then
        alter table reports add column parent_id bigint;
      end if;

      if not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'comments_count') then
        alter table reports add column comments_count int default 0;
      end if;
    end $$;

    -- Add columns to profiles table
    do $$
    begin
      if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'bio') then
        alter table profiles add column bio text;
      end if;
      if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'avatar_url') then
        alter table profiles add column avatar_url text;
      end if;
      if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'updated_at') then
        alter table profiles add column updated_at timestamp with time zone;
      end if;
    end $$;

    -- Create site_settings table if not exists (Safety check)
    create table if not exists site_settings (
      key text primary key,
      value text
    );
    alter table site_settings disable row level security;
    
    -- Insert default settings if empty
    insert into site_settings (key, value) values 
    ('header_btn_1_text', 'Booking.com'),
    ('header_btn_1_link', 'https://www.booking.com'),
    ('header_btn_2_text', 'Klook'),
    ('header_btn_2_link', 'https://www.klook.com'),
    ('essential_1_title', 'eSIM & Data'),
    ('essential_1_desc', 'Get connected instantly'),
    ('essential_1_link', '#'),
    ('essential_2_title', 'Travel Insurance'),
    ('essential_2_desc', 'Safety from $1.50/day'),
    ('essential_2_link', '#'),
    ('essential_3_title', 'Transport Pass'),
    ('essential_3_desc', 'Save on trains & buses'),
    ('essential_3_link', '#')
    on conflict (key) do nothing;
  `;

  console.log("Updating schema...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error updating schema:", error);
  } else {
    console.log("Schema updated successfully!");
  }
};

updateSchema();
