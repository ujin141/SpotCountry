import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const createLikesTable = async () => {
  const sql = `
    -- Create post_likes table to track user likes
    create table if not exists post_likes (
      user_id uuid, -- Link to auth user
      post_id bigint, -- Link to reports table
      created_at timestamp with time zone default timezone('utc'::text, now()),
      primary key (user_id, post_id)
    );
    
    -- Disable RLS for now (development)
    alter table post_likes disable row level security;
  `;

  console.log("Creating post_likes table...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error updating schema:", error);
  } else {
    console.log("Schema updated! 'post_likes' table created.");
  }
};

createLikesTable();
