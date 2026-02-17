"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Map, 
  Settings, 
  LogOut,
  Bell,
  Megaphone,
  Calendar,
  Loader2
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        router.push('/login?redirect=/admin');
        return;
    }

    // Check if user has admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.role === 'admin') {
        setIsAdmin(true);
        setLoading(false);
    } else {
        alert("접근 권한이 없습니다. (관리자 계정 필요)");
        router.push('/');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-gray-500 font-medium">관리자 권한 확인 중...</p>
            </div>
        </div>
    );
  }

  const navigation = [
    { name: "대시보드", href: "/admin", icon: LayoutDashboard },
    { name: "회원 관리", href: "/admin/users", icon: Users },
    { name: "콘텐츠 관리", href: "/admin/content", icon: FileText },
    { name: "투어 관리", href: "/admin/tours", icon: Map },
    { name: "예약 관리", href: "/admin/bookings", icon: Calendar },
    { name: "광고 관리", href: "/admin/ads", icon: Megaphone },
    { name: "설정", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center p-1">
              <Image 
                src="/logo.png" 
                alt="SpotAdmin Logo" 
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Spot Admin</span>
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 md:px-8">
          <h1 className="text-lg font-semibold text-gray-800">
            {navigation.find((n) => n.href === pathname)?.name || "대시보드"}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
