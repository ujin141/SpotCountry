import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const addClickFunction = async () => {
  const sql = `
    create or replace function increment_ad_clicks(row_id bigint)
    returns void as $$
    begin
      update ads
      set clicks = coalesce(clicks, 0) + 1
      where id = row_id;
    end;
    $$ language plpgsql;
  `;

  console.log("Creating increment_ad_clicks function...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error creating function:", error);
  } else {
    console.log("Function created successfully!");
  }
};

addClickFunction();
