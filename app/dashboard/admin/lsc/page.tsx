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
  block_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  district_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  state_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  email: string;
  district: string | null;
  block: string | null;
  block_remarks: string | null;
  district_remarks: string | null;
  state_remarks: string | null;
};

export default function UserManagementPage() {
  const router = useRouter();

  // Data States
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/lsc', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
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
      DERIVED DATA (DISTRICTS & BLOCKS)
  ----------------------------------- */
  
  // Get unique districts for the dropdown
  const districtOptions = useMemo(() => {
    const districts = allUsers.map(u => u.district).filter(Boolean) as string[];
    return ['ALL', ...Array.from(new Set(districts))].sort();
  }, [allUsers]);

  // Get unique blocks based on the selected district
  const blockOptions = useMemo(() => {
    const filteredForBlocks = selectedDistrict === 'ALL' 
      ? allUsers 
      : allUsers.filter(u => u.district === selectedDistrict);
    
    const blocks = filteredForBlocks.map(u => u.block).filter(Boolean) as string[];
    return ['ALL', ...Array.from(new Set(blocks))].sort();
  }, [allUsers, selectedDistrict]);

  /* -----------------------------------
      FRONTEND FILTERING & PAGINATION
  ----------------------------------- */

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchesSearch = u.lsc_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistrict = selectedDistrict === 'ALL' || u.district === selectedDistrict;
      const matchesBlock = selectedBlock === 'ALL' || u.block === selectedBlock;
      
      return matchesSearch && matchesDistrict && matchesBlock;
    });
  }, [allUsers, searchQuery, selectedDistrict, selectedBlock]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDistrict, selectedBlock]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">LSC Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {filteredUsers.length} Centres Found
          </p>
        </div>

        {/* FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* SEARCH INPUT */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by centre name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>

          {/* DISTRICT FILTER */}
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedBlock('ALL'); // Reset block when district changes
            }}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          >
            <option value="ALL">All Districts</option>
            {districtOptions.filter(d => d !== 'ALL').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* BLOCK FILTER */}
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          >
            <option value="ALL">All Blocks</option>
            {blockOptions.filter(b => b !== 'ALL').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
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
                <th className="px-6 py-4 font-semibold text-slate-700">Block Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">District Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">State Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400 animate-pulse">Loading...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-medium">No results match your filters</td></tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium">{u.lsc_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold">{u.district}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{u.block}</div>
                    </td>
                    
                    {/* Block Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${u.block_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {u.block_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 italic">{u.block_remarks || 'No remarks'}</div>
                    </td>

                    {/* District Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${u.district_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {u.district_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 italic">{u.district_remarks || 'No remarks'}</div>
                    </td>

                    {/* State Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${u.state_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {u.state_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 italic">{u.state_remarks || 'No remarks'}</div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/dashboard/admin/lsc/${u.id}`)}
                        className="text-blue-600 font-bold text-[11px] hover:bg-blue-50 px-3 py-1 rounded-md transition-all"
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
                className="px-4 py-1.5 text-xs  border rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 shadow-sm transition-all"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-1.5 text-xs  border rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 shadow-sm transition-all"
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