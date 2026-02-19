'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Menu, X, PlusCircle, LogIn, Search, ShieldCheck, MapPin } from 'lucide-react';

export default function TrackApplicationPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [verifyingApp, setVerifyingApp] = useState<any | null>(null);
  const [inputVerifyCode, setInputVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lscs')
        .select(`applicationCode, id, lsc_name, status, districts ( name ), blocks ( name )`)
        .not('applicationCode', 'is', null) 
        .order('lsc_name', { ascending: true });

      if (error) throw error;
      setAllApplications(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return allApplications;
    return allApplications.filter((app) => {
      const name = app.lsc_name?.toLowerCase() || '';
      const district = app.districts?.name?.toLowerCase() || '';
      const block = app.blocks?.name?.toLowerCase() || '';
      return name.includes(term) || district.includes(term) || block.includes(term);
    });
  }, [searchQuery, allApplications]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedData = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[60]">
        <div className="max-w-6xl mx-auto h-20 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo1.jpg" alt="Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">LSC Portal</h1>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/public/lscregistration" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">New Application</Link>
            <Link href="/login" className="bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-blue-800 transition-all shadow-md">Sign In</Link>
          </nav>

          {/* Hamburger Toggle Button */}
          <button 
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* MOBILE MENU OVERLAY */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full h-screen bg-white z-[70] border-t border-slate-100 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col p-6 gap-4">
              <Link 
                href="/public/lscregistration" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 border border-slate-100"
              >
                <PlusCircle size={20} className="text-blue-600" /> New Application
              </Link>
              <Link 
                href="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-4 bg-blue-700 rounded-xl text-sm font-bold text-white shadow-lg"
              >
                <LogIn size={20} /> Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto w-full py-8 px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Track My Application</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Search by Center Name, District, or Block</p>
        </div>

        {/* SEARCH SECTION */}
        <div className="mb-10 flex flex-col md:flex-row items-stretch gap-3 max-w-3xl">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search name, district, or block..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-md border border-slate-300 pl-11 pr-4 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
          <button className="bg-blue-700 text-white px-8 py-3 rounded-md font-bold text-sm hover:bg-blue-800 shadow-md uppercase tracking-wide">Search Now</button>
        </div>

        {/* REGISTRY CONTAINER */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-8">LSC Name / Address</th>
                  <th className="py-4 px-8 text-center">Status</th>
                  <th className="py-4 px-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="p-16 text-center text-slate-400 text-sm font-medium animate-pulse">Loading...</td></tr>
                ) : paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8">
                      <p className="font-bold text-slate-800">{app.lsc_name}</p>
                      <div className="flex items-center gap-1 text-slate-500 mt-1">
                        <MapPin size={12} className="text-slate-400" />
                        <p className="text-xs font-medium">{app.districts?.name} • {app.blocks?.name}</p>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-center">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-md ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      {app.status === 'APPROVED' && (
                        <button onClick={() => { setVerifyingApp(app); setInputVerifyCode(''); }} className="bg-slate-900 text-white px-5 py-2 rounded-md text-[10px] font-bold uppercase hover:bg-blue-700 transition-all">Setup Center</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-sm font-medium animate-pulse">Loading...</div>
            ) : paginatedData.map((app) => (
              <div key={app.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 text-lg leading-tight">{app.lsc_name}</p>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{app.districts?.name}, {app.blocks?.name}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md shrink-0 ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {app.status}
                  </span>
                </div>
                {app.status === 'APPROVED' && (
                  <button onClick={() => { setVerifyingApp(app); setInputVerifyCode(''); }} className="w-full bg-slate-900 text-white py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest active:bg-blue-700 shadow-sm transition-all">Setup Center Account</button>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-5 flex justify-between items-center border-t border-slate-100 bg-slate-50/50">
             <p className="text-xs font-bold text-slate-500">Results: {filteredApplications.length}</p>
             <div className="flex gap-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="text-xs font-bold text-slate-400 hover:text-slate-800 disabled:opacity-30 uppercase tracking-widest">Prev</button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="text-xs font-bold text-slate-400 hover:text-slate-800 disabled:opacity-30 uppercase tracking-widest">Next</button>
             </div>
          </div>
        </div>

        <p className="mt-12 text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.2em]">
          © MSRLS • Government of Meghalaya
        </p>
      </main>

      {/* VERIFY MODAL */}
      {verifyingApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-200 p-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setVerifyingApp(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-1">Verify Access</h3>
            <p className="text-xs text-center text-slate-500 mb-6 font-medium">Authorized setup for: {verifyingApp.lsc_name}</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Application Code</label>
                <input 
                  type="text" inputMode="numeric" placeholder="Enter Code" value={inputVerifyCode} 
                  onChange={(e) => { setInputVerifyCode(e.target.value); setVerifyError(false); }}
                  className={`w-full rounded-md border px-4 py-3 text-center text-lg font-bold tracking-widest focus:ring-2 focus:ring-blue-100 ${verifyError ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-600'}`}
                />
              </div>
              {verifyError && <p className="text-[10px] font-bold text-red-600 text-center uppercase">Incorrect code for this center.</p>}
              <button 
                onClick={() => {
                   if (inputVerifyCode.trim() === String(verifyingApp.applicationCode)) { /* success */ } else { setVerifyError(true); }
                }} 
                className="w-full bg-blue-700 text-white py-3 rounded-md font-bold text-sm hover:bg-blue-800 shadow-md transition-all active:scale-95 uppercase tracking-widest"
              >
                VERIFY & CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}