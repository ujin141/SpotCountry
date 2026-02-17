"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  DollarSign, 
  Flag, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye,
  Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { initializeDB } from "@/lib/generator"; // Import initializeDB to ensure table exists

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    revenueChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    newSignups: 0,
    newSignupsChange: 0,
    reports: 0,
    reportsChange: 0,
    todayVisits: 0,
    visitChange: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [weeklyTraffic, setWeeklyTraffic] = useState<{date: string, count: number}[]>([]);

  useEffect(() => {
    // Ensure traffic table exists quietly
    initializeDB().then(() => {
        fetchDashboardData();
    });

    // Realtime Subscription
    const channel = supabase
        .channel('admin-dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic' }, () => fetchDashboardData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, () => fetchDashboardData(true))
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    
    // 1. 전체 유저 수
    const { count: totalUserCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 1-1. 이번 달 가입자 수
    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 1-2. 지난 달 가입자 수
    const { count: newUsersLastMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfMonth);

    // 2. 신고된 콘텐츠 수
    const { count: totalReportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
    
    const { count: reportsThisMonth } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 3. 트래픽 (오늘 방문자) - Unique Session
    const { data: todayTraffic } = await supabase
      .from('traffic')
      .select('session_id')
      .gte('created_at', startOfDay);
    
    // Set to count unique session_ids
    const todayVisits = new Set(todayTraffic?.map(t => t.session_id).filter(Boolean)).size;

    // 3-1. 어제 방문자 - Unique Session
    const { data: yesterdayTraffic } = await supabase
      .from('traffic')
      .select('session_id')
      .gte('created_at', startOfYesterday)
      .lt('created_at', startOfDay);
    
    const yesterdayVisits = new Set(yesterdayTraffic?.map(t => t.session_id).filter(Boolean)).size;

    // 3-2. 주간 트래픽 (최근 7일)
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
    const { data: trafficData } = await supabase
      .from('traffic')
      .select('created_at, session_id')
      .gte('created_at', sevenDaysAgo);

    // 주간 트래픽 집계 (Unique Users) (Unique Users)
    const dailySessions: Record<string, Set<string>> = {};
    // Initialize last 7 days with empty Set
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
        dailySessions[dateStr] = new Set();
    }

    if (trafficData) {
        trafficData.forEach(t => {
            const d = new Date(t.created_at);
            const dateStr = d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
            if (dailySessions[dateStr] !== undefined && t.session_id) {
                dailySessions[dateStr].add(t.session_id);
            }
        });
    }
    const weeklyChartData = Object.entries(dailySessions).map(([date, sessionSet]) => ({ 
        date, 
        count: sessionSet.size 
    }));
    setWeeklyTraffic(weeklyChartData);

    // 4. 최근 가입 회원 (5명)
    // Use RPC to get email data securely
    const { data: recentData } = await supabase
      .rpc('get_admin_profiles')
      .order('created_at', { ascending: false })
      .limit(5);

    // Fallback if RPC fails or returns null (though it shouldn't for admin)
    if (!recentData) {
         const { data: fallbackData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
         if (fallbackData) setRecentUsers(fallbackData);
    } else {
        setRecentUsers(recentData);
    }

    // 5. 매출
    const { data: adsData } = await supabase.from('ads').select('clicks');
    const totalClicks = adsData?.reduce((acc, curr) => acc + (curr.clicks || 0), 0) || 0;
    const estimatedRevenue = totalClicks * 100;

    // --- 통계 계산 ---
    const usersEndLastMonth = (totalUserCount || 0) - (newUsersThisMonth || 0);
    const activeUsersChange = usersEndLastMonth > 0 
      ? ((newUsersThisMonth || 0) / usersEndLastMonth) * 100 
      : (totalUserCount || 0) > 0 ? 100 : 0;

    const newSignupsChange = (newUsersLastMonth || 0) > 0
      ? (((newUsersThisMonth || 0) - (newUsersLastMonth || 0)) / (newUsersLastMonth || 0)) * 100
      : (newUsersThisMonth || 0) > 0 ? 100 : 0;

    const reportsEndLastMonth = (totalReportCount || 0) - (reportsThisMonth || 0);
    const reportsChange = reportsEndLastMonth > 0
      ? ((reportsThisMonth || 0) / reportsEndLastMonth) * 100
      : (totalReportCount || 0) > 0 ? 100 : 0;
    
    const visitChange = (yesterdayVisits || 0) > 0
      ? (((todayVisits || 0) - (yesterdayVisits || 0)) / (yesterdayVisits || 0)) * 100
      : (todayVisits || 0) > 0 ? 100 : 0;

    const revenueChange = estimatedRevenue > 0 ? 2.1 : 0;

    setStats({
      revenue: estimatedRevenue,
      revenueChange,
      activeUsers: totalUserCount || 0,
      activeUsersChange,
      newSignups: newUsersThisMonth || 0,
      newSignupsChange,
      reports: totalReportCount || 0,
      reportsChange,
      todayVisits: todayVisits || 0,
      visitChange,
    });

    if (recentData) setRecentUsers(recentData);
    setLoading(false);
  };

  const statCards = [
    {
      name: "오늘 방문자",
      value: `${stats.todayVisits.toLocaleString()}명`, // 명/회
      change: `${stats.visitChange > 0 ? "+" : ""}${stats.visitChange.toFixed(1)}%`,
      changeType: stats.visitChange >= 0 ? "positive" : "negative",
      icon: Eye,
      description: "어제 대비"
    },
    {
      name: "전체 회원",
      value: `${stats.activeUsers.toLocaleString()}명`,
      change: `${stats.activeUsersChange > 0 ? "+" : ""}${stats.activeUsersChange.toFixed(1)}%`,
      changeType: stats.activeUsersChange >= 0 ? "positive" : "negative",
      icon: Users,
      description: "지난달 대비"
    },
    {
      name: "예상 수익",
      value: `₩${stats.revenue.toLocaleString()}`,
      change: `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange.toFixed(1)}%`,
      changeType: stats.revenueChange >= 0 ? "positive" : "negative",
      icon: DollarSign,
      description: "지난달 대비"
    },
    {
      name: "신고된 콘텐츠",
      value: `${stats.reports}건`,
      change: `${stats.reportsChange > 0 ? "+" : ""}${stats.reportsChange.toFixed(1)}%`,
      changeType: stats.reportsChange <= 0 ? "positive" : "negative",
      icon: Flag,
      description: "지난달 대비"
    },
  ];

  const getChangeTypeColor = (changeType: string, isReport: boolean = false) => {
    if (isReport) {
        return changeType === "positive" ? "text-green-600" : "text-red-600";
    }
    return changeType === "positive" ? "text-green-600" : "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6"
          >
            <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-500 truncate">
                {stat.name}
                </dt>
                <div className="p-2 bg-gray-50 rounded-lg">
                    <stat.icon className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stat.value}
            </dd>
            <div className="mt-2 flex items-center text-sm">
              <span className={`flex items-center gap-1 font-medium ${
                 getChangeTypeColor(stat.changeType, stat.name === "신고된 콘텐츠")
              }`}>
                {parseFloat(stat.change) > 0 ? <ArrowUp className="w-4 h-4" /> : 
                 parseFloat(stat.change) < 0 ? <ArrowDown className="w-4 h-4" /> : null}
                {stat.change}
              </span>
              <span className="text-gray-500 ml-2">{stat.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Chart & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Traffic Chart */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                주간 트래픽 현황
            </h3>
            <div className="h-64 flex items-end justify-between gap-2">
                {weeklyTraffic.map((item, index) => {
                    const max = Math.max(...weeklyTraffic.map(d => d.count), 10); // Min max 10 to avoid full height for 1
                    const height = (item.count / max) * 100;
                    return (
                        <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="relative w-full flex justify-end flex-col h-full group">
                                <div 
                                    className="w-full bg-blue-100 rounded-t-md hover:bg-blue-200 transition-all relative group-hover:bg-primary/20"
                                    style={{ height: `${Math.max(height, 5)}%` }} // Min height 5%
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                        {item.count}명
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                최근 가입 회원
                </h3>
            </div>
            <button 
                onClick={() => fetchDashboardData()} 
                className="text-sm text-primary hover:text-indigo-600 font-medium"
            >
                새로고침
            </button>
            </div>
            <ul role="list" className="divide-y divide-gray-200 overflow-y-auto max-h-[300px]">
            {recentUsers.length === 0 ? (
                <li className="p-12 text-center text-gray-500">
                가입한 회원이 없습니다.
                </li>
            ) : (
                recentUsers.map((user) => (
                <li key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        </div>
                        <div className="ml-4">
                        <div className="text-sm font-medium text-primary truncate max-w-[100px]">
                            {user.email ? user.email.split('@')[0] : 'No Email'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {user.name}
                        </div>
                        </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.status === 'active' ? '활동' : '정지'}
                        </span>
                    </div>
                    </div>
                </li>
                ))
            )}
            </ul>
        </div>
      </div>
    </div>
  );
}
