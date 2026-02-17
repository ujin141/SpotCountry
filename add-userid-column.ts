import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const addUserColumn = async () => {
  const sql = `
    -- Add user_id to reports table
    do $$ 
    begin 
      if not exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'user_id') then
        alter table reports add column user_id uuid;
      end if;
    end $$;
  `;

  console.log("Updating reports schema...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error updating schema:", error);
  } else {
    console.log("Schema updated! 'user_id' column added.");
  }
};

addUserColumn();
