import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fixTraffic = async () => {
  const sql = `
    -- 1. Add session_id column to traffic table
    do $$ 
    begin 
      if not exists (select 1 from information_schema.columns where table_name = 'traffic' and column_name = 'session_id') then
        alter table traffic add column session_id text;
      end if;
    end $$;

    -- 2. Clear existing inaccurate traffic data (Optional, but good for clean start)
    truncate table traffic;
  `;

  console.log("Updating traffic schema and resetting data...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error updating schema:", error);
  } else {
    console.log("Traffic schema updated & data reset!");
  }
};

fixTraffic();
