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
  lsc_name: string | { name: string };
  address: string;
  block_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  district_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  state_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  email: string;
  district: string | { name: string } | null;
  block: string | { name: string } | null;
  block_remarks: string | null;
  district_remarks: string | null;
  state_remarks: string | null;
};

export default function UserManagementPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // SAFE RENDER HELPER: Prevents "Objects are not valid as React child"
  const renderCell = (value: any) => {
    if (value && typeof value === 'object') {
      return value.name || JSON.stringify(value);
    }
    return value || '--';
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/anchor/getlsc', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      console.log('Fetched LSCs:', data);
      setAllUsers(data.users || data || []);
    } catch (err) {
      console.error('Error loading LSCs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allUsers.filter((u) => {
      const name = typeof u.lsc_name === 'object' ? u.lsc_name?.name : u.lsc_name;
      return name?.toLowerCase().includes(query);
    });
  }, [allUsers, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <button
          onClick={() => router.push('/dashboard/anchor/lsc/new')}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm w-fit sm:ml-auto"
        >
          + Add New LSC
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">LSC Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">{filteredUsers.length} Centres Found</p>
        </div>


        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search centres..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">LSC Details</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Location</th>
                {/* <th className="px-6 py-4 font-semibold text-slate-700">Block Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">District Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">State Status</th> */}
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400 animate-pulse">Loading...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-medium">No results found</td></tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {renderCell(u.lsc_name)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-700 font-semibold">{renderCell(u.district)}</div>
                      <div className="text-[10px] uppercase text-slate-500">{renderCell(u.block)}</div>
                    </td>
                    {/* <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyles(u.block_status)}`}>
                        {u.block_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{u.block_remarks || '--'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyles(u.district_status)}`}>
                        {u.district_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{u.district_remarks || '--'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyles(u.state_status)}`}>
                        {u.state_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{u.state_remarks || '--'}</div>
                    </td> */}
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