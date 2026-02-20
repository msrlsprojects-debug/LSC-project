'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UserProfile = {
  user_id: string;
  id: string;
  lsc_name: string;
  address: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  email: string;
  district: string | null;
  block: string | null;
};

export default function UserManagementPage() {
  const router = useRouter();
  
  // Data States
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/block/lsc', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      
      // Handle both object {users:[]} and array [] responses for safety
      const fetchedData = data.users || data || [];
      setAllUsers(fetchedData);
    } catch (err) {
      console.error('Error loading LSCs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  /* -----------------------------------
      FRONTEND FILTERING & PAGINATION
  ----------------------------------- */
  
  // 1. Filter the data based on search
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) =>
      u.lsc_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUsers, searchQuery]);

  // 2. Calculate pagination values
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  
  // 3. Slice the data for the current page
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  // Reset to page 1 when user types in search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">LSC Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {filteredUsers.length} Centres Found
          </p>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search centres..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <span className="absolute right-3 top-2.5 text-slate-400"></span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">LSC Details</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Location</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400 animate-pulse">Loading...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-500 font-medium">No results match your search</td></tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.lsc_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold">{u.district}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{u.block}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/dashboard/block/lsc/${u.id}`)}
                        className="text-blue-600 font-bold text-[11px] hover:underline"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-3 py-1 text-xs font-bold border rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1 text-xs font-bold border rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}