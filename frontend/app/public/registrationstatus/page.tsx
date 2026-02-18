'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrackApplicationPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pagination & List states
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 7;

  // Credential states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load the registry on mount and page change
  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  const fetchApplications = async () => {
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, count, error } = await supabase
      .from('lscs')
      .select(`
        *,
        districts ( name ),
        blocks ( name )
      `, { count: 'exact' })
      // .eq('isPublic', true)
      .in('status', ['PENDING', 'APPROVED', 'REJECTED'])
      //  .not('applicationCode', 'is', null)
      //  .neq('applicationCode', '')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setAllApplications(data);
      setTotalCount(count || 0);
    }
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      setSearchError("Please enter a code");
      return;
    }

    setLoading(true);
    setSearchError(null);
    setApplication(null);

    const { data, error } = await supabase
      .from('lscs')
      .select(`
        *,
        districts ( name ),
        blocks ( name )
      `)
      .eq('applicationCode', searchCode.toUpperCase().trim())
      .maybeSingle(); // Safe fetch

    if (error) {
      setSearchError("Connection error. Please try again.");
    } else if (!data) {
      setSearchError("No application found with that code.");
    } else {
      setApplication(data);
    }
    setLoading(false);
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
          lsc_id: application.id,
          applicationCode: application.applicationCode,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      alert("Credentials created successfully!");
      router.push('/login');
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">

      {/* RESPONSIVE HEADER */}
      <header className="sticky top-0 z-[100] w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo1.jpg" alt="Logo" className="h-10 w-auto object-contain" />
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-slate-900 leading-none uppercase">LSC Portal</h1>
              <p className="hidden sm:block text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Odisha Desk</p>
            </div>
          </Link>

          <div className="hidden md:flex gap-6">
            <Link href="/login" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 tracking-widest transition-all">Portal Login</Link>
          </div>
        </div>
      </header>

      <main className="flex-grow py-10 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden p-6 sm:p-10">

            {/* SEARCH SECTION - Hides if Approved is being processed */}
            {(!application || application.status !== 'APPROVED') && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Track Your Application</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Enter your unique application code below</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-600 outline-none transition-all uppercase"
                      placeholder="e.g. LSC-12345"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Searching...' : 'Verify Status'}
                    </button>
                  </div>
                  {searchError && <p className="text-red-500 text-[10px] font-black mt-2 uppercase">{searchError}</p>}
                </div>

                {/* Individual Status Result (Pending/Rejected) */}
                {application && application.status !== 'APPROVED' && (
                  <div className={`p-4 rounded-xl border-2 border-dashed ${application.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <p className="text-xs font-bold uppercase tracking-tight">Status: {application.status}</p>
                    <p className="text-sm">For Center: {application.centerName}</p>
                  </div>
                )}

                {/* REGISTRY TABLE */}
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Recent Applications</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {/* <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase">Code</th> */}
                          <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase">LSC Name</th>
                          <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase">Address Details</th>

                          <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allApplications.map((app) => (
                          <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            {/* <td className="py-4 px-2 text-xs font-mono font-bold text-blue-600 uppercase">{app.applicationCode}</td> */}
                            <td className="py-4 px-2 text-xs font-mono font-bold text-blue-600 uppercase">{app.lsc_name}</td>
                            <td className="py-4 px-2">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">{app.centerName}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                  {app.districts?.name || 'N/A'} • {app.blocks?.name || 'N/A'} • {app.village || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase border ${app.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' :
                                  app.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TABLE PAGINATION */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-20 hover:bg-slate-50 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                      </button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-20 hover:bg-slate-50 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVED FLOW - Setting up Credentials */}
            {application && application.status === 'APPROVED' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-green-50 border-2 border-green-100 p-8 rounded-[2rem] text-center mb-8">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-lg shadow-green-200">✓</div>
                  <h3 className="text-2xl font-black text-green-900 uppercase tracking-tight">Application Approved</h3>
                  <p className="text-sm font-bold text-green-700 mt-1">Code: {application.applicationCode}</p>
                  <button onClick={() => setApplication(null)} className="text-[9px] font-black uppercase text-green-600 underline mt-4 hover:text-green-800">Check another status</button>
                </div>

                <form onSubmit={handleCreateCredentials} className="space-y-6 max-w-md mx-auto">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Official Email Address</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-600 outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Create Account Password</label>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-600 outline-none transition-all" />
                    </div>
                  </div>

                  {submitError && <p className="text-[10px] font-black text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 uppercase">{submitError}</p>}

                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all disabled:opacity-50">
                    {isSubmitting ? 'Finalizing...' : 'Create Account & Proceed'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}