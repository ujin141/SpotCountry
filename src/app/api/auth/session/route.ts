import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // 프로필 정보 병합 (서버에서 조회 - RLS/권한 정상 동작)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const userWithProfile = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        full_name: profile?.name ?? user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url,
      },
    };

    return NextResponse.json({ user: userWithProfile });
  } catch {
    return NextResponse.json({ user: null });
  }
}
