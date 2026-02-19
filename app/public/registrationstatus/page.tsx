'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrackApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Inline Search Error State
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pagination & List states
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 7;

  // Verification & Credential Modals
  const [verifyingApp, setVerifyingApp] = useState<any | null>(null);
  const [inputVerifyCode, setInputVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  const fetchApplications = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      const { data, count, error } = await supabase
        .from('lscs')
        .select(`applicationCode, id, lsc_name, status, districts ( name ), blocks ( name )`, { count: 'exact' })
        .not('applicationCode', 'is', null) 
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setAllApplications(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAction = async () => {
    const term = searchQuery.trim();
    if (!term) return;

    setIsSearching(true);
    setSearchError(null); // Clear previous errors

    try {
      const { data, error } = await supabase
        .from('lscs')
        .select(`applicationCode, id, lsc_name, status`)
        .eq('applicationCode', term)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSearchError("No application found with this code.");
      } else if (data.status !== 'APPROVED') {
        setSearchError(`Center "${data.lsc_name}" is currently ${data.status}. Setup is only for APPROVED centers.`);
      } else {
        setVerifyingApp(data);
        setInputVerifyCode('');
        setVerifyError(false);
      }
    } catch (err) {
      setSearchError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifyAndOpen = () => {
    if (inputVerifyCode.trim() === String(verifyingApp.applicationCode)) {
      setVerifyError(false);
      setShowCredentialModal(true);
    } else {
      setVerifyError(true);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo1.jpg" alt="Logo" className="h-8 w-auto" />
          <h1 className="text-lg font-black uppercase tracking-tight">LSC Portal</h1>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto w-full py-6 px-4 md:px-6">
        
        {/* SEARCH BAR SECTION */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <input 
              type="text" 
              inputMode="numeric"
              placeholder="ENTER APPLICATION CODE..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null); // Clear error when typing
              }}
              className={`flex-1 bg-white border-2 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest outline-none transition-all shadow-sm ${searchError ? 'border-red-200 focus:border-red-400' : 'border-slate-200 focus:border-blue-600'}`}
            />
            <button 
              onClick={handleSearchAction}
              disabled={isSearching}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-blue-100"
            >
              {isSearching ? 'SEARCHING...' : 'VERIFY & SETUP'}
            </button>
          </div>
          
          {/* INLINE ERROR MESSAGE INSTEAD OF ALERT */}
          {searchError && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-tight">
                {searchError}
              </p>
              <button onClick={() => setSearchError(null)} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-2xl font-black uppercase text-slate-900 leading-none">Center Registry</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time status tracking</p>
          </div>

          <div className="p-0">
            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Center Info</th>
                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="p-20 text-center animate-pulse font-black text-slate-300">LOADING...</td></tr>
                  ) : allApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 px-8">
                        <p className="font-bold text-slate-800">{app.lsc_name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{app.districts?.name} / {app.blocks?.name}</p>
                      </td>
                      <td className="py-6 px-8">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-right">
                        {app.status === 'APPROVED' && (
                          <button onClick={() => { setVerifyingApp(app); setInputVerifyCode(''); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all active:scale-95">Setup</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-10 text-center animate-pulse font-black text-slate-300">LOADING...</div>
              ) : allApplications.map((app) => (
                <div key={app.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{app.lsc_name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{app.districts?.name} / {app.blocks?.name}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded border ${app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {app.status}
                    </span>
                  </div>
                  {app.status === 'APPROVED' && (
                    <button 
                      onClick={() => { setVerifyingApp(app); setInputVerifyCode(''); }}
                      className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:bg-blue-600 transition-all"
                    >
                      Setup Account
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 flex justify-between items-center border-t border-slate-50 bg-slate-50/30">
             <p className="text-[10px] font-black text-slate-400 uppercase">Page {currentPage} of {totalPages || 1}</p>
             <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 border bg-white rounded-xl text-[10px] font-black disabled:opacity-30 active:scale-95">PREV</button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 border bg-white rounded-xl text-[10px] font-black disabled:opacity-30 active:scale-95">NEXT</button>
             </div>
          </div>
        </div>
      </main>

      {/* VERIFY MODAL */}
      {verifyingApp && !showCredentialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black uppercase text-center mb-2">Security Check</h3>
            <p className="text-[9px] font-bold text-slate-400 text-center uppercase mb-8 tracking-widest">Confirm code for {verifyingApp.lsc_name}</p>
            <input 
              type="text" inputMode="numeric" placeholder="ENTER CODE" value={inputVerifyCode} 
              onChange={(e) => setInputVerifyCode(e.target.value)}
              className={`w-full bg-slate-50 border-2 rounded-2xl py-5 text-center text-2xl font-black outline-none transition-all ${verifyError ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-100 focus:border-blue-600'}`}
            />
            {verifyError && <p className="text-[9px] font-black text-red-500 uppercase text-center mt-3 tracking-widest">Incorrect verification code</p>}
            <button onClick={handleVerifyAndOpen} className="w-full bg-slate-900 text-white py-5 rounded-2xl mt-6 font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all">Verify & Continue</button>
            <button onClick={() => setVerifyingApp(null)} className="w-full mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}