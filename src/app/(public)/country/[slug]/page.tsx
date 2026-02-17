import { notFound } from "next/navigation";
import CountryTabs from "@/components/CountryTabs";
import AdBanner from "@/components/AdBanner";
import { ExternalLink, Wifi, ShieldCheck, Ticket, Users, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const COUNTRY_CONFIG = {
  korea: { name: "Korea", flag: "🇰🇷", color: "bg-blue-600" },
  japan: { name: "Japan", flag: "🇯🇵", color: "bg-red-500" },
  thailand: { name: "Thailand", flag: "🇹🇭", color: "bg-yellow-500" },
  vietnam: { name: "Vietnam", flag: "🇻🇳", color: "bg-red-600" },
  taiwan: { name: "Taiwan", flag: "🇹🇼", color: "bg-blue-600" },
  usa: { name: "USA", flag: "🇺🇸", color: "bg-blue-500" },
  france: { name: "France", flag: "🇫🇷", color: "bg-blue-700" },
  italy: { name: "Italy", flag: "🇮🇹", color: "bg-green-600" },
  spain: { name: "Spain", flag: "🇪🇸", color: "bg-yellow-600" },
  uk: { name: "UK", flag: "🇬🇧", color: "bg-blue-800" },
  germany: { name: "Germany", flag: "🇩🇪", color: "bg-yellow-400" },
  australia: { name: "Australia", flag: "🇦🇺", color: "bg-blue-400" },
  canada: { name: "Canada", flag: "🇨🇦", color: "bg-red-400" },
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const countryKey = slug.toLowerCase();
  const config = COUNTRY_CONFIG[countryKey as keyof typeof COUNTRY_CONFIG];

  // 1. 기본 국가 정보 설정
  const countryName = config ? config.name : (slug.charAt(0).toUpperCase() + slug.slice(1));
  const countryFlag = config ? config.flag : "🌍";
  
  // 2. Fetch Settings
  const { data: settingsData } = await supabase.from('site_settings').select('*');
  const settings: any = {};
  if (settingsData) {
    settingsData.forEach((item: any) => {
        settings[item.key] = item.value;
    });
  }

  // Defaults
  const getSetting = (key: string, def: string) => settings[key] || def;

  // 3. 실제 데이터 가져오기 (Server Side)
  const { count: postCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('country', countryName);

  const { data: latestPost } = await supabase
    .from('reports')
    .select('created_at')
    .eq('country', countryName)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  const onlineCount = totalUsers ? Math.ceil(totalUsers / 10) : 0; 
  const planningCount = onlineCount * 5 + 12;

  let updatedTimeText = "Updated recently";
  if (latestPost) {
    const diff = Date.now() - new Date(latestPost.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) updatedTimeText = `Updated ${mins} mins ago`;
    else if (mins < 1440) updatedTimeText = `Updated ${Math.floor(mins/60)} hours ago`;
    else updatedTimeText = `Updated ${Math.floor(mins/1440)} days ago`;
  }

  const displayStats = {
    online: onlineCount,
    planning: planningCount,
    posts: postCount || 0,
    updated: updatedTimeText
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-6xl">{countryFlag}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {countryName}
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Hub
                  </span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  {displayStats.online} Online
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <Activity className="w-3 h-3 mr-1.5" />
                  {displayStats.planning} Planning TODAY
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  • {displayStats.updated}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
             <a 
               href={getSetting('header_btn_1_link', 'https://www.booking.com')}
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 bg-[#003580] text-white rounded-lg text-sm font-bold hover:bg-[#00224f] transition-colors shadow-sm"
             >
               {getSetting('header_btn_1_text', 'Booking.com')} <ExternalLink className="w-4 h-4" />
             </a>
             <a 
               href={getSetting('header_btn_2_link', 'https://www.klook.com')}
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 bg-[#FF5B00] text-white rounded-lg text-sm font-bold hover:bg-[#e65200] transition-colors shadow-sm"
             >
               {getSetting('header_btn_2_text', 'Klook')} <ExternalLink className="w-4 h-4" />
             </a>
          </div>
        </div>
      </div>

      {/* 🟢 광고: 국가별 상단 */}
      <AdBanner position="country-header" className="my-6" />

      {/* Essentials Section (Dynamic from Settings) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href={getSetting('essential_1_link', '#')} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/50 transition-colors group shadow-sm hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{getSetting('essential_1_title', 'eSIM & Data')}</h3>
            <p className="text-xs text-gray-500">{getSetting('essential_1_desc', 'Get connected instantly')}</p>
          </div>
          <ExternalLink className="w-4 h-4 ml-auto text-gray-300 group-hover:text-primary transition-colors" />
        </a>
        
        <a href={getSetting('essential_2_link', '#')} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/50 transition-colors group shadow-sm hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{getSetting('essential_2_title', 'Travel Insurance')}</h3>
            <p className="text-xs text-gray-500">{getSetting('essential_2_desc', 'Safety from $1.50/day')}</p>
          </div>
          <ExternalLink className="w-4 h-4 ml-auto text-gray-300 group-hover:text-primary transition-colors" />
        </a>

        <a href={getSetting('essential_3_link', '#')} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/50 transition-colors group shadow-sm hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{getSetting('essential_3_title', 'Transport Pass')}</h3>
            <p className="text-xs text-gray-500">{getSetting('essential_3_desc', 'Save on trains & buses')}</p>
          </div>
          <ExternalLink className="w-4 h-4 ml-auto text-gray-300 group-hover:text-primary transition-colors" />
        </a>
      </div>

      <CountryTabs countryName={countryName} />

      {/* 🟢 광고: 국가별 하단 (New) */}
      <AdBanner position="country-bottom" className="mt-8" />
    </div>
  );
}
