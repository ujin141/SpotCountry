import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const addAvatarColumn = async () => {
  const sql = `
    -- Add author_avatar_url to reports table
    do $$ 
    begin 
      if not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'author_avatar_url') then
        alter table reports add column author_avatar_url text;
      end if;
    end $$;
  `;

  console.log("Updating reports schema...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error updating schema:", error);
  } else {
    console.log("Schema updated! 'author_avatar_url' column added.");
  }
};

addAvatarColumn();
