"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, MessageSquare, Loader2, Globe } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";

const INITIAL_COUNTRIES = [
  { slug: "korea", name: "Korea", flag: "🇰🇷", color: "bg-blue-600" },
  { slug: "japan", name: "Japan", flag: "🇯🇵", color: "bg-red-500" },
  { slug: "thailand", name: "Thailand", flag: "🇹🇭", color: "bg-yellow-500" },
  { slug: "vietnam", name: "Vietnam", flag: "🇻🇳", color: "bg-red-600" },
  { slug: "taiwan", name: "Taiwan", flag: "🇹🇼", color: "bg-blue-600" },
  { slug: "usa", name: "USA", flag: "🇺🇸", color: "bg-blue-500" },
  { slug: "france", name: "France", flag: "🇫🇷", color: "bg-blue-700" },
  { slug: "italy", name: "Italy", flag: "🇮🇹", color: "bg-green-600" },
  { slug: "spain", name: "Spain", flag: "🇪🇸", color: "bg-yellow-600" },
  { slug: "uk", name: "UK", flag: "🇬🇧", color: "bg-blue-800" },
  { slug: "germany", name: "Germany", flag: "🇩🇪", color: "bg-yellow-400" },
  { slug: "australia", name: "Australia", flag: "🇦🇺", color: "bg-blue-400" },
  { slug: "canada", name: "Canada", flag: "🇨🇦", color: "bg-red-400" },
];

export default function Home() {
  const [countries, setCountries] = useState(INITIAL_COUNTRIES.map(c => ({ ...c, online: 0, posts: 0 })));
  const [totalOnline, setTotalOnline] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchLiveStats();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchLiveStats = async () => {
    setLoading(true);

    // 1. 실시간 접속자 수 (최근 15분 트래픽 기준)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: activeTraffic } = await supabase
        .from('traffic')
        .select('session_id, path')
        .gte('created_at', fifteenMinsAgo);

    // 1-1. 전체 온라인 유저 (중복 제거)
    const activeSessions = new Set(activeTraffic?.map(t => t.session_id).filter(Boolean));
    setTotalOnline(activeSessions.size);

    // 1-2. 국가별 온라인 유저 집계
    const countryOnlineCounts: Record<string, Set<string>> = {};
    activeTraffic?.forEach(t => {
        if (!t.path || !t.session_id) return;
        // Check if path matches /country/[slug]
        const match = t.path.match(/^\/country\/([^/]+)/);
        if (match && match[1]) {
            const slug = match[1].toLowerCase();
            if (!countryOnlineCounts[slug]) {
                countryOnlineCounts[slug] = new Set();
            }
            countryOnlineCounts[slug].add(t.session_id);
        }
    });

    // 2. 국가별 게시글 수 카운트 (댓글 제외)
    const { data: reports } = await supabase
      .from('reports')
      .select('country')
      .in('type', ['post', 'qna', 'buddy', 'tip']); // Only count main posts

    const postCounts: Record<string, number> = {};
    if (reports) {
      reports.forEach(r => {
        if (r.country) {
          // Normalize country name just in case
          const key = r.country.toLowerCase();
          postCounts[key] = (postCounts[key] || 0) + 1;
        }
      });
    }

    // 3. 최신 글로벌 포스트 6개 가져오기
    const { data: globalPosts } = await supabase
      .from('reports')
      .select('*')
      .in('type', ['post', 'qna', 'buddy', 'tip']) // Include all types
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (globalPosts) setRecentPosts(globalPosts);

    // 4. 데이터 합치기
    const updatedCountries = INITIAL_COUNTRIES.map(c => {
      // Get online count from traffic logic
      const onlineCount = countryOnlineCounts[c.slug]?.size || 0;
      
      return {
        ...c,
        online: onlineCount,
        posts: postCounts[c.name.toLowerCase()] || postCounts[c.slug] || 0 // Try matching by Name or Slug
      };
    });

    setCountries(updatedCountries);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Where is everyone going?
          <br />
          <span className="text-primary">Spot the trend.</span>
        </h1>
        <p className="max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Join thousands of travelers sharing real-time info, finding buddies, and exploring the world together.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            {user ? (
                <Link
                href="#countries"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-900 md:py-4 md:text-lg md:px-10 transition-colors"
                >
                Explore Now
                </Link>
            ) : (
                <Link
                href="/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-900 md:py-4 md:text-lg md:px-10 transition-colors"
                >
                Get Started
                </Link>
            )}
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link
              href="/about"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* 🟢 광고: 메인 상단 */}
      <AdBanner position="main-hero" className="mb-6" />

      {/* Live Status Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-700">
            <span className="font-bold text-gray-900">{totalOnline}</span> people online
          </span>
        </div>
        <span className="text-xs text-gray-400">Real-time stats</span>
      </div>

      {/* Country Grid */}
      <div id="countries" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 scroll-mt-20">
        {countries.map((country) => (
          <Link 
            key={country.slug} 
            href={`/country/${country.slug}`}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-2 w-full ${country.color}`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{country.flag}</span>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  View
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                {country.name}
              </h3>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{loading ? "-" : country.online}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{loading ? "-" : country.posts}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Global Feed Section (New) */}
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-6">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Now Trending</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentPosts.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-10 bg-white rounded-lg border border-gray-100">
                    No posts yet. Be the first to share your journey!
                </div>
            ) : (
                recentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))
            )}
        </div>
        <div className="mt-6 text-center">
            <Link href="#countries" className="text-sm font-medium text-primary hover:text-blue-700">
                View all countries &rarr;
            </Link>
        </div>
      </section>

      {/* 🟢 광고: 메인 하단 (New) */}
      <AdBanner position="main-bottom" className="mt-8" />
    </div>
  );
}
