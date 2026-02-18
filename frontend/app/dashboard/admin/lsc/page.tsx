'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ✅ Types */
type LSC = {
  id: string;
  lsc_name: string;
  status: string;
  is_active: boolean;
  district: { name: string } | null;
  block: { name: string } | null;
};

export default function LSCListPage() {
  const router = useRouter();
  const [lscs, setLscs] = useState<LSC[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination State
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [selectedLsc, setSelectedLsc] = useState<LSC | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadLSCs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lscs')
      .select(`
        id,
        lsc_name,
        status,
        is_active,
        district:district_id ( name ),
        block:block_id ( name )
      `)
      .order('lsc_name');

    if (!error) {
      setLscs((data as unknown as LSC[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLSCs();
  }, []);

  /* --- Logic for Filtering and Pagination --- */
  const filteredLscs = useMemo(() => {
    if (filter === 'ALL') return lscs;
    return lscs.filter((item) => item.status === filter);
  }, [lscs, filter]);

  const totalPages = Math.ceil(filteredLscs.length / itemsPerPage);
  const paginatedLscs = filteredLscs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!selectedLsc) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from('lscs')
      .update({ status: newStatus })
      .eq('id', selectedLsc.id);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      await loadLSCs();
      setSelectedLsc(null);
    }
    setIsUpdating(false);
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading LSC profiles...</div>;

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">LSC Management</h1>
          
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/lsc/new')}
          className="bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-sm w-fit"
        >
          + Add New LSC
        </button>
      </div>

      {/* --- Filter Tabs --- */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
              filter === f 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase tracking-widest text-[10px]">LSC Name</th>
                <th className="px-6 py-4 text-left font-bold text-slate-700 uppercase tracking-widest text-[10px]">Location</th>
                <th className="px-6 py-4 text-center font-bold text-slate-700 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 text-right font-bold text-slate-700 uppercase tracking-widest text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLscs.map((lsc) => (
                <tr key={lsc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{lsc.lsc_name}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-700">{lsc.district?.name || '—'}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">{lsc.block?.name || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${
                      lsc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      lsc.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {lsc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => router.push(`/dashboard/admin/lsc/${lsc.id}`)}
                        className="text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-tighter"
                      >
                        View Profile
                      </button>
                      {lsc.status === 'PENDING' && (
                        <button
                          onClick={() => setSelectedLsc(lsc)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-black text-[10px] uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DIALOG (Same as before) --- */}
      {selectedLsc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLsc(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Verify LSC Application</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Reviewing: <span className="text-blue-600 font-black">{selectedLsc.lsc_name}</span></p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Approve this LSC to grant operational access, or reject if the details provided are insufficient.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate('APPROVED')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-500 transition-all font-black text-xs uppercase tracking-widest"
                >
                  <span className="text-2xl mb-2">✅</span> Approve
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate('REJECTED')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-red-100 bg-red-50 text-red-700 hover:border-red-500 transition-all font-black text-xs uppercase tracking-widest"
                >
                  <span className="text-2xl mb-2">❌</span> Reject
                </button>
              </div>
            </div>
            <div className="p-4 flex justify-center border-t border-slate-100">
              <button onClick={() => setSelectedLsc(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}