"use client";

import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. 초기 세션 확인
    checkUser();

    // 2. 로그인/로그아웃 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (profile) {
                setUser({
                    ...session.user,
                    user_metadata: {
                        ...session.user.user_metadata,
                        full_name: profile.name,
                        avatar_url: profile.avatar_url,
                    }
                });
            } else {
                setUser(session.user);
            }
        } else {
            setUser(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    // 서버 세션 API 사용 (쿠키 기반 - OAuth 콜백 직후에도 동작)
    const { user } = await fetch('/api/auth/session').then(r => r.json()).catch(() => ({ user: null }));
    setUser(user ?? null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh(); // 페이지 새로고침하여 상태 반영
  };

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image 
              src="/logo.png" 
              alt="SpotCountry Logo" 
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            SpotCountry
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-full pr-3 py-1 transition-colors">
                    {user.user_metadata?.avatar_url ? (
                        <Image 
                            src={user.user_metadata.avatar_url} 
                            alt="Profile" 
                            width={32}
                            height={32}
                            className="rounded-full border border-gray-200 object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                </Link>
                <Link 
                    href="/my-bookings"
                    className="text-sm font-medium text-gray-500 hover:text-primary transition-colors px-2"
                >
                    My Bookings
                </Link>
                <button 
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors p-1"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
          ) : (
            <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
            >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
