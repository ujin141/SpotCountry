"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Shield, Ban, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 회원 목록 불러오기
  const fetchUsers = async () => {
    setLoading(true);
    // Use RPC to get all user data securely (including email which is hidden from public)
    const { data, error } = await supabase.rpc('get_admin_profiles');

    if (error) {
        console.error("Error fetching users:", error);
        // Fallback to regular select if RPC fails (might miss email)
        const { data: fallbackData } = await supabase
            .from('profiles')
            .select('id, name, role, status, is_verified, created_at')
            .order('created_at', { ascending: false });
        if (fallbackData) setUsers(fallbackData);
    } else if (data) {
        setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 상태 변경 (정지/해제)
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setUsers(users.map(user => 
        user.id === id ? { ...user, status: newStatus } : user
      ));
    }
  };

  // 인증 상태 토글
  const toggleVerified = async (id: string, isVerified: boolean) => {
    const newVerified = !isVerified;
    const { error } = await supabase
        .from('profiles')
        .update({ is_verified: newVerified })
        .eq('id', id);
    
    if (!error) {
        setUsers(users.map(user => 
            user.id === id ? { ...user, is_verified: newVerified } : user
        ));
    }
  };

  // 검색 필터링
  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(search.toLowerCase()) || 
     user.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
          <p className="text-sm text-gray-500">전체 회원 목록을 조회하고 관리합니다.</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자 정보</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인증</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
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
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  회원이 없습니다. (Supabase profiles 테이블을 확인하세요)
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'partner' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '관리자' : user.role === 'partner' ? '파트너' : '일반'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                        onClick={() => toggleVerified(user.id, user.is_verified)} 
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-colors ${user.is_verified ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        {user.is_verified ? <CheckCircle className="w-3 h-3"/> : <Shield className="w-3 h-3"/>}
                        {user.is_verified ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? '활동중' : '정지됨'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => toggleStatus(user.id, user.status)}
                      className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                        user.status === 'active' 
                          ? 'text-red-600 hover:bg-red-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {user.status === 'active' ? '정지' : '해제'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
