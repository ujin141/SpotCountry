"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, Image as ImageIcon, X, Save } from "lucide-react";
import { useAds } from "@/context/AdContext"; // 전역 상태 사용

// 위치 미리보기 컴포넌트
function PositionPreview({ position }: { position: string }) {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500 mb-2 font-medium">위치 미리보기</p>
      <div className="flex flex-col gap-1 w-full max-w-[200px] mx-auto bg-white border border-gray-300 p-1 rounded aspect-[3/4] shadow-sm">
        {/* Header */}
        <div className="h-3 bg-gray-200 w-full rounded-sm"></div>
        
        {/* Main Top Ad */}
        {position === "main-hero" || position === "country-header" ? (
          <div className="h-8 bg-red-100 border-2 border-red-400 w-full rounded-sm flex items-center justify-center text-[10px] text-red-600 font-bold animate-pulse">
            여기에 노출됨
          </div>
        ) : (
          <div className="h-8 bg-gray-100 w-full rounded-sm"></div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-2 bg-gray-100 w-full rounded-sm"></div>
          <div className="h-2 bg-gray-100 w-3/4 rounded-sm"></div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div className="h-10 bg-gray-100 rounded-sm"></div>
            <div className="h-10 bg-gray-100 rounded-sm"></div>
          </div>
        </div>

        {/* Main Bottom Ad */}
        {position === "main-bottom" || position === "country-bottom" || position === "about-bottom" ? (
          <div className="h-6 bg-red-100 border-2 border-red-400 w-full rounded-sm flex items-center justify-center text-[10px] text-red-600 font-bold animate-pulse mt-auto">
            여기에 노출됨
          </div>
        ) : null}
      </div>
      <p className="text-xs text-center text-gray-500 mt-2">
        {position.includes("hero") || position.includes("header") ? "상단 헤더 바로 아래에 큼지막하게 뜹니다." : "콘텐츠를 다 보고 난 하단에 뜹니다."}
      </p>
    </div>
  );
}

export default function AdsAdminPage() {
  const { ads, addAd, toggleAd, deleteAd } = useAds(); // 컨텍스트에서 데이터와 함수 가져오기
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAd, setNewAd] = useState({
    title: "",
    position: "main-hero",
    imageUrl: "",
    link: "",
  });

  const handleAddAd = async () => {
    if (!newAd.title || !newAd.imageUrl || !newAd.link) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    let positionLabel = "";
    switch(newAd.position) {
      case "main-hero": positionLabel = "메인 홈 > 상단"; break;
      case "main-bottom": positionLabel = "메인 홈 > 하단"; break;
      case "country-header": positionLabel = "국가 상세 > 상단"; break;
      case "country-bottom": positionLabel = "국가 상세 > 하단"; break;
      case "about-bottom": positionLabel = "소개 페이지 > 하단"; break;
      default: positionLabel = "기타";
    }

    // DB 연동 (비동기)
    await addAd({
      title: newAd.title,
      position: newAd.position,
      positionLabel,
      imageUrl: newAd.imageUrl,
      link: newAd.link,
    });

    setIsModalOpen(false);
    setNewAd({ title: "", position: "main-hero", imageUrl: "", link: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">광고 관리</h2>
          <p className="text-sm text-gray-500">
            사이트 내 광고 배너({ads.length}개)를 실시간으로 관리합니다.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          새 광고 등록
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
            <div className="h-40 bg-gray-100 relative overflow-hidden">
              <img 
                src={ad.imageUrl} 
                alt={ad.title} 
                className={`w-full h-full object-cover transition-opacity ${ad.status === 'inactive' ? 'opacity-50 grayscale' : ''}`}
              />
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 text-xs font-bold rounded-full shadow-sm ${
                  ad.status === 'active' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  {ad.status === 'active' ? '노출중' : '중지됨'}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 truncate pr-2">{ad.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium border border-gray-200">
                      ID: {ad.position}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-primary font-medium">
                      {ad.positionLabel}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <a 
                  href={ad.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs truncate max-w-[150px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  링크 확인
                </a>
                <span className="text-gray-400 text-xs font-medium">
                  {ad.clicks?.toLocaleString() || 0} 클릭
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => toggleAd(ad.id, ad.status)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    ad.status === 'active'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {ad.status === 'active' ? '광고 중지' : '광고 시작'}
                </button>
                <button
                  onClick={() => deleteAd(ad.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 hover:border-primary hover:bg-primary/5 transition-all group h-full min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-600 group-hover:text-primary">
            새 광고 배너 추가하기
          </span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-gray-900">새 광고 등록</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">광고 제목</label>
                <input 
                  type="text" 
                  value={newAd.title}
                  onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="예: 여름 휴가 특가"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">노출 위치</label>
                <select 
                  value={newAd.position}
                  onChange={(e) => setNewAd({...newAd, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                >
                  <option value="main-hero">메인 홈 &gt; 상단</option>
                  <option value="main-bottom">메인 홈 &gt; 하단</option>
                  <option value="country-header">국가 상세 &gt; 상단</option>
                  <option value="country-bottom">국가 상세 &gt; 하단</option>
                  <option value="about-bottom">소개 페이지 &gt; 하단</option>
                </select>
                {/* 미니맵 컴포넌트 추가 */}
                <PositionPreview position={newAd.position} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
                <input 
                  type="text" 
                  value={newAd.imageUrl}
                  onChange={(e) => setNewAd({...newAd, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
                <input 
                  type="text" 
                  value={newAd.link}
                  onChange={(e) => setNewAd({...newAd, link: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10 border-t border-gray-100">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleAddAd}
                className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
