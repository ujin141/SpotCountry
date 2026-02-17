"use client";

import { useState, useEffect } from "react";
import { Check, X, Search, MoreHorizontal, Eye, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ToursAdminPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 투어 목록 불러오기
  const fetchTours = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tours')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTours(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // 상태 변경 (DB 업데이트)
  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('tours')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setTours(tours.map(tour => 
        tour.id === id ? { ...tour, status: newStatus } : tour
      ));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">승인됨</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">거절됨</span>;
      default: return <span className="bg-yellow-100 text-yellow-800 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">대기중</span>;
    }
  };

  const filteredTours = tours.filter(tour => {
    const matchesFilter = filter === "all" || tour.status === filter;
    const matchesSearch = tour.title?.toLowerCase().includes(search.toLowerCase()) || 
                          tour.host?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">투어 상품 관리</h2>
          <p className="text-sm text-gray-500">등록된 투어 상품을 검수하고 승인합니다.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="상품명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거절됨</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품 정보
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  호스트
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가격
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      데이터 불러오는 중...
                    </div>
                  </td>
                </tr>
              ) : filteredTours.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    데이터가 없습니다. (Supabase tours 테이블을 확인하세요)
                  </td>
                </tr>
              ) : (
                filteredTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 font-bold overflow-hidden">
                          {tour.image_url ? (
                            <img src={tour.image_url} alt="" className="w-full h-full object-cover" />
                          ) : "IMG"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{tour.title}</div>
                          <div className="text-sm text-gray-500">{tour.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tour.host}</div>
                      <div className="text-xs text-gray-500">{new Date(tour.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {tour.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tour.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-gray-600 p-1" title="상세보기">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {tour.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(tour.id, 'approved')}
                              className="bg-green-50 text-green-600 hover:bg-green-100 p-1 rounded transition-colors"
                              title="승인"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(tour.id, 'rejected')}
                              className="bg-red-50 text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                              title="거절"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {tour.status !== 'pending' && (
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
