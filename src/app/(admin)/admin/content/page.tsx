"use client";

import { useState, useEffect } from "react";
import { Flag, Trash2, XCircle, Search, Bot, Loader2, Check, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ContentAdminPage() {
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("All"); // 국가 필터

  const COUNTRIES = ["Korea", "Japan", "Thailand", "Vietnam", "Taiwan", "USA", "France"];

  // 신고 목록 불러오기
  const fetchReports = async () => {
    setLoading(true);
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    // DB단에서 필터링 (선택 사항) 혹은 클라이언트 필터링
    // 여기서는 전체 가져와서 클라이언트 필터링으로 처리 (데이터 양이 적으므로)
    
    const { data } = await query;
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 삭제 (DB 삭제)
  const handleDelete = async (id: number) => {
    if (confirm("정말 이 콘텐츠를 삭제하시겠습니까? (DB에서 영구 삭제됩니다)")) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (!error) {
        setReports(reports.filter(r => r.id !== id));
      } else {
        alert("삭제 실패! DB 에러를 확인하세요.");
      }
    }
  };

  // 무시
  const handleDismiss = async (id: number) => {
    setReports(reports.filter(r => r.id !== id));
  };

  // AI 자동 검사
  const runAiModeration = async () => {
    setIsAiRunning(true);
    setAiMessage("AI가 DB 데이터를 분석 중입니다...");

    await new Promise(resolve => setTimeout(resolve, 2000));

    const spamKeywords = ["spam", "scam", "illegal", "stupid", "바카라", "도박"];
    const spamIds = reports
      .filter(r => spamKeywords.some(keyword => r.content.toLowerCase().includes(keyword)))
      .map(r => r.id);

    if (spamIds.length > 0) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .in('id', spamIds);

      if (!error) {
        setReports(prev => prev.filter(r => !spamIds.includes(r.id)));
        setAiMessage(`AI가 ${spamIds.length}건의 스팸을 DB에서 영구 삭제했습니다. 🛡️`);
      }
    } else {
      setAiMessage("삭제할 스팸 콘텐츠가 발견되지 않았습니다. ✅");
    }
    setIsAiRunning(false);
  };

  // 클라이언트 필터링 적용
  const filteredReports = countryFilter === "All" 
    ? reports 
    : reports.filter(r => r.country === countryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h2>
          <p className="text-sm text-gray-500">신고된 게시글 및 댓글을 검토하고 처리합니다.</p>
        </div>
        
        <div className="flex gap-2">
          {/* 국가 필터 */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="All">전체 국가</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={runAiModeration}
            disabled={isAiRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
              isAiRunning 
                ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isAiRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                AI 자동 검사
              </>
            )}
          </button>
        </div>
      </div>

      {aiMessage && (
        <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          aiMessage.includes("삭제") ? "bg-green-50 text-green-700 border border-green-100" : "bg-blue-50 text-blue-700 border border-blue-100"
        }`}>
          <Bot className="w-4 h-4" />
          {aiMessage}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {loading ? (
            <li className="p-12 text-center text-gray-500 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </li>
          ) : filteredReports.length === 0 ? (
            <li className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-medium text-gray-900">
                {countryFilter === "All" ? "신고된 콘텐츠가 없습니다." : `${countryFilter} 관련 콘텐츠가 없습니다.`}
              </p>
            </li>
          ) : (
            filteredReports.map((report) => (
              <li key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        report.type === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.type === 'post' ? '게시글' : '댓글'}
                      </span>
                      {/* 국가 배지 표시 */}
                      {report.country && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          <MapPin className="w-3 h-3" />
                          {report.country}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">• {new Date(report.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                        <Flag className="w-3 h-3" />
                        {report.flag_reason}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium text-sm mb-2 p-3 bg-gray-50 rounded border border-gray-100">
                      "{report.content}"
                    </p>
                    <div className="text-xs text-gray-500">
                      신고자: <span className="font-medium text-gray-700">{report.reporter}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleDelete(report.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                    <button 
                      onClick={() => handleDismiss(report.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      무시
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
