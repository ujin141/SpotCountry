import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkSchema = async () => {
    // Try to select cols from reports
    const { error: error1 } = await supabase.from('reports').select('user_id').limit(1);
    const { error: error2 } = await supabase.from('reports').select('author_avatar_url').limit(1);
    const { error: error3 } = await supabase.from('reports').select('image_url').limit(1);

    if (error1) console.log("user_id: MISSING (" + error1.message + ")"); else console.log("user_id: OK");
    if (error2) console.log("author_avatar_url: MISSING (" + error2.message + ")"); else console.log("author_avatar_url: OK");
    if (error3) console.log("image_url: MISSING (" + error3.message + ")"); else console.log("image_url: OK");

    const { error: error4 } = await supabase.from('post_likes').select('*').limit(1);
    if (error4) console.log("post_likes table: MISSING (" + error4.message + ")"); else console.log("post_likes table: OK");
};

checkSchema();
