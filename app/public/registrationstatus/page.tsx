'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrackApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

// 
  // test adding push data
  // Pagination & List states
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 7;

  // Verification State
  const [verifyingApp, setVerifyingApp] = useState<any | null>(null);
  const [inputVerifyCode, setInputVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState(false);

  // Final Modal states
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  const fetchApplications = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, count, error } = await supabase
      .from('lscs')
      .select(`applicationCode,id,district_id,block_id,lsc_name,village,clf_name,address,status, districts ( name ), blocks ( name )`, { count: 'exact' })
      .filter('applicationCode', 'not.is', null) 
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setAllApplications(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleInitiateSetup = (app: any) => {
    setVerifyingApp(app);
    setInputVerifyCode('');
    setVerifyError(false);
  };

  const handleVerifyAndOpen = () => {
    if (!verifyingApp) return;
    const actualCode = String(verifyingApp.applicationCode || "").toUpperCase().trim();
    const inputCode = inputVerifyCode.toUpperCase().trim();

    if (inputCode === actualCode && actualCode !== "") {
      setVerifyError(false);
      setShowCredentialModal(true);
    } else {
      setVerifyError(true);
    }
  };

  const handleCreateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/public/createlcsccredential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          lsc_id: verifyingApp.id,
          applicationCode: verifyingApp.applicationCode,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      router.push('/login?registered=true');
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* HEADER - Restored to your original format */}
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-4">
          <img src="/logo1.jpg" alt="Logo" className="h-10 w-auto" />
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">LSC Portal</h1>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto w-full py-6 md:py-12 px-4 md:px-6">
        <div className="flex items-start justify-between mb-10 px-2">
            <div>
              {/* <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Application Form</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Livelihood Service Center</p> */}
            </div>
            <button 
              onClick={() => router.back()}
              className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </div>
              <span>Back</span>
            </button>
          </div>
        <div className="bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
          
          <div className="p-6 md:p-12 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-1 md:mb-2 text-slate-900">Registration Status</h2>
            <p className="text-slate-500 font-bold uppercase text-[9px] md:text-xs tracking-widest">Center Application Registry</p>
          </div>
          

          <div className="p-0 md:p-8">
            {/* MOBILE LIST VIEW */}
            <div className="block md:hidden divide-y divide-slate-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 animate-pulse space-y-3">
                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    <div className="h-3 w-1/2 bg-slate-50 rounded" />
                    <div className="h-10 w-full bg-slate-100 rounded-xl" />
                  </div>
                ))
              ) : allApplications.map((app) => (
                <div key={app.id} className="p-6 space-y-4">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="text-base font-bold text-slate-800 leading-tight">{app.lsc_name}</p>
                      <span className={`shrink-0 text-[8px] font-black px-2 py-1 rounded-full uppercase border ${
                        app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {app.districts?.name} • {app.blocks?.name}
                    </p>
                  </div>
                  {app.status === 'APPROVED' && (
                    <button 
                      onClick={() => handleInitiateSetup(app)}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Setup Account
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Center Information</th>
                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-8 px-8"><div className="h-5 w-48 bg-slate-100 rounded mb-2"/><div className="h-3 w-32 bg-slate-50 rounded"/></td>
                        <td className="py-8 px-8"><div className="h-6 w-20 bg-slate-100 rounded-full"/></td>
                        <td className="py-8 px-8"><div className="h-10 w-32 bg-slate-100 rounded-xl ml-auto"/></td>
                      </tr>
                    ))
                  ) : allApplications.map((app) => (
                    <tr key={app.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-8 px-8">
                        <p className="text-lg font-bold text-slate-800 leading-tight">{app.lsc_name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1.5 flex items-center gap-2 tracking-wider">
                          {app.districts?.name} / {app.blocks?.name}
                        </p>
                      </td>
                      <td className="py-8 px-8">
                        <span className={`inline-flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full uppercase border ${
                          app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-8 px-8 text-right">
                        {app.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleInitiateSetup(app)}
                            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-600 transition-all active:scale-95"
                          >
                            Setup Account
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="px-6 md:px-8 pb-8 md:pb-12 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Page {currentPage} of {totalPages || 1}</p>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="flex-1 md:flex-none px-5 py-4 md:py-3 border border-slate-200 rounded-xl md:rounded-2xl disabled:opacity-30 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50"
              >
                ← Prev
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="flex-1 md:flex-none px-5 py-4 md:py-3 border border-slate-200 rounded-xl md:rounded-2xl disabled:opacity-30 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {verifyingApp && !showCredentialModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative animate-in slide-in-from-bottom duration-500 md:slide-in-from-bottom-0">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 md:hidden" />
            <button onClick={() => setVerifyingApp(null)} className="hidden md:block absolute top-8 right-8 text-slate-400 hover:text-slate-900 text-xl font-black">✕</button>
            
            <div className="text-center mb-8">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-800">Security Check</h3>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest leading-relaxed">Confirm code for <br/><span className="text-blue-600">{verifyingApp.lsc_name}</span></p>
            </div>
            
            <input 
              type="text" 
              value={inputVerifyCode}
              onChange={(e) => setInputVerifyCode(e.target.value)}
              placeholder="ENTER CODE"
              className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 md:py-5 text-center text-lg md:text-xl font-black uppercase outline-none transition-all ${
                verifyError ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-100 focus:border-blue-600'
              }`}
            />
            
             <button onClick={handleVerifyAndOpen} className="w-full bg-slate-900 text-white py-5 md:py-6 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.25em] mt-6 hover:bg-blue-600 transition-all active:scale-95">
              Verify & Continue
            </button> 
            <button onClick={() => setVerifyingApp(null)} className="w-full mt-4 text-[10px] font-black uppercase text-slate-400 md:hidden pb-4">Cancel</button>
          </div>
        </div>
      )}

      {showCredentialModal && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/70 backdrop-blur-xl">
          <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 md:hidden" />
            
            <div className="text-center mb-8 md:mb-10">
              <h3 className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tight">Create Account</h3>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
                LSC Code: {verifyingApp?.applicationCode}
              </p>
            </div>

            <form onSubmit={handleCreateCredentials} className="space-y-4 md:space-y-6">
              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-bold focus:border-blue-600 outline-none transition-all" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-bold focus:border-blue-600 outline-none transition-all" />
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-5 md:py-6 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.25em] hover:bg-slate-900 transition-all active:scale-95">
                {isSubmitting ? 'Submitting...' : 'Complete Registration'}
              </button>
              <button type="button" onClick={() => {setShowCredentialModal(false); setVerifyingApp(null);}} className="w-full text-[10px] font-black uppercase text-slate-400 md:hidden pb-4">Back</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}