'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react'; // Import the X icon

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
  const [searchTerm, setSearchTerm] = useState('');

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
        id, lsc_name, status, is_active,
        district:district_id ( name ),
        block:block_id ( name )
      `)
      .order('lsc_name');

    if (!error) setLscs((data as unknown as LSC[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadLSCs(); }, []);

  const filteredLscs = useMemo(() => {
    return lscs.filter((item) => {
      const matchesFilter = filter === 'ALL' || item.status === filter;
      const matchesSearch = item.lsc_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [lscs, filter, searchTerm]);

  const totalPages = Math.ceil(filteredLscs.length / itemsPerPage);
  const paginatedLscs = filteredLscs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!selectedLsc) return;
    setIsUpdating(true);
    const { error } = await supabase
      .from('lscs')
      .update({ status: newStatus })
      .eq('id', selectedLsc.id);

    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      await loadLSCs();
      setSelectedLsc(null);
    }
    setIsUpdating(false);
  };

  if (loading) return <div className="p-8 text-slate-500 text-sm font-medium">Loading LSC profiles...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">LSC Management</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">Verification and Registration Console</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/lsc/new')}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm w-fit"
        >
          + Add New LSC
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <input 
          type="text"
          placeholder="Search center name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all"
        />
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-600 text-xs">LSC Name</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-600 text-xs">Location</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-600 text-xs">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-600 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLscs.map((lsc) => (
                <tr key={lsc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{lsc.lsc_name}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-700">{lsc.district?.name || '—'}</div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">{lsc.block?.name || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      lsc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      lsc.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {lsc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => router.push(`/dashboard/admin/lsc/${lsc.id}`)}
                        className="text-slate-400 hover:text-blue-600 font-bold text-[11px] uppercase"
                      >
                        View
                      </button>
                      {lsc.status === 'PENDING' && (
                        <button
                          onClick={() => setSelectedLsc(lsc)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[11px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
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
      </div>

      {/* Verification Modal */}
      {selectedLsc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => setSelectedLsc(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Close (X) Button */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verify Center</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Reviewing {selectedLsc.lsc_name}</p>
              </div>
              <button 
                onClick={() => setSelectedLsc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
               Once you approve this center, they will be granted system access. If details are invalid, reject the application.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate('APPROVED')}
                  className="py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-bold text-[11px] uppercase tracking-wider"
                >
                  Approve
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate('REJECTED')}
                  className="py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all font-bold text-[11px] uppercase tracking-wider"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}