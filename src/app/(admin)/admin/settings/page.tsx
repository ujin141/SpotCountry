"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle, Database, Users, FileText, Map, Loader2, RotateCcw, Wrench, Trash, Link as LinkIcon, Wifi, ShieldCheck, Ticket, ExternalLink, MousePointerClick } from "lucide-react";
import { generateUsers, generateReports, generateTours, resetAndSeed, initializeDB, clearAllData } from "@/lib/generator";
import { supabase } from "@/lib/supabase";

export default function SettingsAdminPage() {
  const [siteName, setSiteName] = useState("SpotCountry");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPostMode, setAutoPostMode] = useState(false);
  const [lastAutoPost, setLastAutoPost] = useState<string | null>(null);

  // Auto-Post Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoPostMode) {
        const runAutoPost = async () => {
            await generateReports(1, true); // Generate 1 live post
            setLastAutoPost(new Date().toLocaleTimeString());
        };
        
        // Initial run delayed by 2s to show it's working? No, wait for interval.
        interval = setInterval(runAutoPost, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoPostMode]);
  
  // Affiliate Settings
  const [affiliates, setAffiliates] = useState({
    header_btn_1_text: "Booking.com",
    header_btn_1_link: "https://www.booking.com",
    header_btn_2_text: "Klook",
    header_btn_2_link: "https://www.klook.com",
    essential_1_title: "eSIM & Data",
    essential_1_desc: "Get connected instantly",
    essential_1_link: "#",
    essential_2_title: "Travel Insurance",
    essential_2_desc: "Safety from $1.50/day",
    essential_2_link: "#",
    essential_3_title: "Transport Pass",
    essential_3_desc: "Save on trains & buses",
    essential_3_link: "#",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
        const newSettings = { ...affiliates };
        data.forEach((item: any) => {
            if (newSettings.hasOwnProperty(item.key)) {
                // @ts-ignore
                newSettings[item.key] = item.value;
            }
        });
        setAffiliates(newSettings);
    }
  };

  const handleSave = async () => {
    const updates = Object.entries(affiliates).map(([key, value]) => ({
        key, value
    }));
    
    await supabase.from('site_settings').upsert(updates);
    alert("설정이 저장되었습니다.");
  };

  const handleInitializeDB = async () => {
    if (!confirm("모든 테이블(profiles, reports, tours, ads)을 생성하고 초기 설정을 진행하시겠습니까?")) return;
    
    setIsGenerating(true);
    const result = await initializeDB();
    if (result.success) {
      alert("DB 테이블이 성공적으로 생성되었습니다! 🎉");
    } else {
      alert(`생성 실패: ${result.error?.message || "알 수 없는 오류"}`);
    }
    setIsGenerating(false);
  };

  const handleClearAll = async () => {
    if (!confirm("⚠️ 정말로 모든 데이터를 영구 삭제하시겠습니까?")) return;

    setIsGenerating(true);
    await clearAllData();
    alert("모든 데이터가 삭제되었습니다. ✨");
    setIsGenerating(false);
  };

  const handleGenerate = async (type: 'users' | 'reports' | 'tours') => {
    setIsGenerating(true);
    let result;
    if (type === 'users') result = await generateUsers(5);
    if (type === 'reports') result = await generateReports(5);
    if (type === 'tours') result = await generateTours(3);

    if (result?.success) {
      alert(`${result.count}개의 데이터가 추가되었습니다! 🎉`);
    } else {
      alert("생성 실패! DB 연결을 확인해주세요.");
    }
    setIsGenerating(false);
  };

  const handleResetAndSeed = async () => {
    if (!confirm("⚠️ 경고: 모든 데이터가 삭제되고 초기화됩니다. 계속하시겠습니까?")) return;
    
    setIsGenerating(true);
    const result = await resetAndSeed();
    if (result.success) {
      alert("모든 데이터가 초기화되고, 시뮬레이션 데이터가 생성되었습니다! 🚀");
    }
    setIsGenerating(false);
  };

  const handleAffiliateChange = (key: string, value: string) => {
    setAffiliates(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">환경 설정</h2>
          <p className="text-sm text-gray-500 mt-1">사이트의 수익화 링크, 배너, 데이터베이스를 관리합니다.</p>
        </div>
        <button
            onClick={handleSave}
            className="w-full sm:w-auto flex justify-center items-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none transition-all"
        >
            <Save className="w-4 h-4 mr-2" />
            변경사항 저장
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column: Revenue & Banner Settings */}
        <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white font-bold text-green-800 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-green-600" />
                    수익화 & 배너 관리
                </div>
                
                <div className="p-6 space-y-8">
                    {/* Header Buttons Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <MousePointerClick className="w-4 h-4 text-blue-500" />
                            상단 고정 버튼 (Header Actions)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Button 1 */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative group transition-all hover:shadow-md">
                                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-blue-600"></div>
                                <label className="block text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Button 1 (Left)</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Label</label>
                                        <input type="text" value={affiliates.header_btn_1_text} onChange={(e) => handleAffiliateChange('header_btn_1_text', e.target.value)} className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Link URL</label>
                                        <input type="text" value={affiliates.header_btn_1_link} onChange={(e) => handleAffiliateChange('header_btn_1_link', e.target.value)} className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Button 2 */}
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 relative group transition-all hover:shadow-md">
                                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-orange-500"></div>
                                <label className="block text-xs font-bold text-orange-800 mb-2 uppercase tracking-wide">Button 2 (Right)</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Label</label>
                                        <input type="text" value={affiliates.header_btn_2_text} onChange={(e) => handleAffiliateChange('header_btn_2_text', e.target.value)} className="w-full rounded-md border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Link URL</label>
                                        <input type="text" value={affiliates.header_btn_2_link} onChange={(e) => handleAffiliateChange('header_btn_2_link', e.target.value)} className="w-full rounded-md border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Essentials Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-purple-500" />
                            필수 정보 카드 (Essentials Grid)
                        </h3>
                        <div className="space-y-4">
                            {/* Card 1 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                                    <Wifi className="w-5 h-5" />
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 block mb-1">Card 1: Connectivity (eSIM)</label>
                                    </div>
                                    <input type="text" placeholder="Title" value={affiliates.essential_1_title} onChange={(e) => handleAffiliateChange('essential_1_title', e.target.value)} className="rounded-md border-gray-300 text-sm w-full" />
                                    <input type="text" placeholder="Description" value={affiliates.essential_1_desc} onChange={(e) => handleAffiliateChange('essential_1_desc', e.target.value)} className="rounded-md border-gray-300 text-sm w-full" />
                                    <input type="text" placeholder="https://..." value={affiliates.essential_1_link} onChange={(e) => handleAffiliateChange('essential_1_link', e.target.value)} className="sm:col-span-2 rounded-md border-gray-300 text-sm w-full font-mono text-gray-600" />
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-300 transition-colors">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-green-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 block mb-1">Card 2: Safety (Insurance)</label>
                                    </div>
                                    <input type="text" placeholder="Title" value={affiliates.essential_2_title} onChange={(e) => handleAffiliateChange('essential_2_title', e.target.value)} className="rounded-md border-gray-300 text-sm w-full" />
                                    <input type="text" placeholder="Description" value={affiliates.essential_2_desc} onChange={(e) => handleAffiliateChange('essential_2_desc', e.target.value)} className="rounded-md border-gray-300 text-sm w-full" />
                                    <input type="text" placeholder="https://..." value={affiliates.essential_2_link} onChange={(e) => handleAffiliateChange('essential_2_link', e.target.value)} className="sm:col-span-2 rounded-md border-gray-300 text-sm w-full font-mono text-gray-600" />
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-purple-600">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 block mb-1">Card 3: Transport (Pass)</label>
                                    </div>
                                    <input type="text" placeholder="Title" value={affiliates.essential_3_title} onChange={(e) => handleAffiliateChange('essential_3_title', e.target.value)} className="rounded-md border-gray-300 text-sm w-full" />
                                    <input type="text" placeholder="Description" value={affiliates.essential_3_desc} onChange={(e) => handleAffiliateChange('essential_3_desc', e.target.value)} className="rounded-md border-gray-300 text-sm w-full" />
                                    <input type="text" placeholder="https://..." value={affiliates.essential_3_link} onChange={(e) => handleAffiliateChange('essential_3_link', e.target.value)} className="sm:col-span-2 rounded-md border-gray-300 text-sm w-full font-mono text-gray-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Database & Operations */}
        <div className="space-y-6">
          {/* 데이터 생성기 */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white font-bold text-blue-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              데이터 자동 생성 (Development)
            </div>
            <div className="p-6 grid gap-4">
              <button 
                onClick={handleInitializeDB}
                disabled={isGenerating}
                className="flex items-center justify-center gap-3 w-full px-4 py-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition-all font-bold shadow-sm hover:shadow"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
                <div>
                    <span className="block text-sm">DB 테이블 자동 생성</span>
                    <span className="block text-[10px] font-normal opacity-70">테이블이 없을 때 최초 1회 실행</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <button 
                  onClick={handleResetAndSeed}
                  disabled={isGenerating}
                  className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-all font-bold hover:shadow-md"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <RotateCcw className="w-6 h-6" />}
                  <span className="text-sm">리셋 & 데이터 주입</span>
                </button>

                <button 
                  onClick={handleClearAll}
                  disabled={isGenerating}
                  className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl transition-all font-bold hover:shadow-md"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash className="w-6 h-6" />}
                  <span className="text-sm">데이터 전체 삭제</span>
                </button>
              </div>

              {/* AI Auto-Post */}
              <div className={`mt-2 p-4 rounded-xl border flex justify-between items-center transition-all ${autoPostMode ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${autoPostMode ? 'text-green-800' : 'text-gray-700'}`}>
                        {autoPostMode && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                        AI 자동 포스팅 (30초 간격)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {autoPostMode ? `활성화됨. ${lastAutoPost ? `마지막 생성: ${lastAutoPost}` : '다음 생성 대기중...'}` : '관리자 페이지가 열려있는 동안 자동으로 글을 작성합니다.'}
                    </p>
                </div>
                <button
                    onClick={() => setAutoPostMode(!autoPostMode)}
                    className={`${
                        autoPostMode ? 'bg-green-600' : 'bg-gray-300'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2`}
                >
                    <span className={`${autoPostMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                </button>
              </div>

              <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-medium">Quick Actions</span></div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => handleGenerate('users')}
                    disabled={isGenerating}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                    <Users className="w-4 h-4 text-gray-600 mb-1" />
                    <span className="text-xs font-medium text-gray-600">회원 +5</span>
                </button>
                <button 
                    onClick={() => handleGenerate('reports')}
                    disabled={isGenerating}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                    <FileText className="w-4 h-4 text-gray-600 mb-1" />
                    <span className="text-xs font-medium text-gray-600">글 +5</span>
                </button>
                <button 
                    onClick={() => handleGenerate('tours')}
                    disabled={isGenerating}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                    <Map className="w-4 h-4 text-gray-600 mb-1" />
                    <span className="text-xs font-medium text-gray-600">투어 +3</span>
                </button>
              </div>
            </div>
          </div>

          {/* 운영 설정 */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 border-l-4 border-l-yellow-500">
            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50 font-bold text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              운영 설정
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">점검 모드 (Maintenance)</h3>
                <p className="text-xs text-gray-500 mt-1">활성화 시 일반 사용자의 접속을 차단합니다.</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`${
                  maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2`}
              >
                <span className={`${maintenanceMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
