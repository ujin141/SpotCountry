import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkSchema = async () => {
  // Try to select image_url from reports
  const { data, error } = await supabase.from('reports').select('image_url').limit(1);
  
  if (error) {
    console.error("Column check failed:", error.message);
    if (error.message.includes("does not exist")) {
        console.log("Verdict: 'image_url' column is MISSING.");
    }
  } else {
    console.log("Column check passed. 'image_url' exists.");
  }
};

checkSchema();
