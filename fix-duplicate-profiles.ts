import { createClient } from '@supabase/supabase-js';

// Load Env
const supabaseUrl = 'https://kfqnxmxgwhazmzbbvbbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcW54bXhnd2hhem16YmJ2YmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjI1NjcsImV4cCI6MjA4Njg5ODU2N30.VXIGgl5wCyTC6s5jj61PzqbsDr2ezbX-M5ljJVl7bnY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fixDuplicates = async () => {
  const sql = `
    -- 1. 중복 제거 (가장 최근에 생성된 것 하나만 유지)
    delete from profiles
    where id in (
      select id from (
        select id, row_number() over (partition by email order by created_at desc) as rnum
        from profiles
      ) t
      where t.rnum > 1
    );

    -- 2. 이메일 중복 방지 제약조건 추가 (이미 존재하면 무시)
    do $$
    begin
      if not exists (select 1 from pg_constraint where conname = 'profiles_email_unique') then
        alter table profiles add constraint profiles_email_unique unique (email);
      end if;
    end $$;
  `;

  console.log("Fixing duplicate profiles...");
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("Error fixing duplicates:", error);
  } else {
    console.log("Success! Duplicates removed and unique constraint added.");
  }
};

fixDuplicates();
