'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans">
      
      {/* ===== MOBILE OVERLAY ===== */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed md:static z-[70]
          inset-y-0 left-0
          w-72 bg-slate-900
          text-white
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
          overflow-hidden
          shadow-2xl
        `}
      >
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-950/20">
          <div className="flex items-center gap-4">
            {/* <div className="bg-white p-1 rounded-lg shrink-0">
              <img src="/logo1.jpg" alt="Logo" className="h-8 w-30 object-contain" />
            </div> */}
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-widest uppercase">MSRLS – LSC</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div>
             <NavItem href="/dashboard/admin" onClick={() => setOpen(false)}>
               <span className="flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                 Dashboard Overview
               </span>
             </NavItem>
          </div>

          <NavSection title="LSC Management">
            <NavItem href="/dashboard/admin/lsc/new" onClick={() => setOpen(false)}>Add New + </NavItem>
            <NavItem href="/dashboard/admin/lsc" onClick={() => setOpen(false)}>LSC List</NavItem>
            {/* <NavItem href="/dashboard/admin/lsc/pending" onClick={() => setOpen(false)}>Pending List</NavItem>
            <NavItem href="/dashboard/admin/lsc/rejected" onClick={() => setOpen(false)}>Rejected List</NavItem> */}
          </NavSection>

          <NavSection title="Services Management">
            <NavItem href="/dashboard/admin/services/categories" onClick={() => setOpen(false)}>Categories</NavItem>
            <NavItem href="/dashboard/admin/services/services" onClick={() => setOpen(false)}>All Services</NavItem>
          </NavSection>

          <NavSection title="Finance & Accounting">
            <NavItem href="/dashboard/admin/finance" onClick={() => setOpen(false)}>Financial Management</NavItem>
            <NavItem href="/dashboard/admin/finance/expenditure" onClick={() => setOpen(false)}>Income & Expenditure</NavItem>
          </NavSection>

          <NavSection title="User Management">
            <NavItem href="/dashboard/admin/users" onClick={() => setOpen(false)}>Users List</NavItem>
          </NavSection>

          <NavSection title="Intelligence">
            <NavItem href="/dashboard/admin/reports" onClick={() => setOpen(false)}>Reports & Analytics</NavItem>
          </NavSection>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
          >
            Logout Session
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* HEADER */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm shrink-0">
          <div className="px-4 md:px-8 h-16 flex items-center justify-between">
            
            {/* Mobile Toggle + Brand */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2.5 text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                aria-label="Open Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
              
              <div className="flex items-center gap-2">
                <img src="/logo1.jpg" alt="Logo" className="h-25 w-70 object-contain md:h-10" />
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden xs:flex flex-col items-end mr-1">
                <span className="text-xs font-black text-slate-900 uppercase">Administrator</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">System Online</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function NavItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false); // Default to open for better desktop visibility

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 mb-1 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors group"
      >
        <span>{title}</span>
        <svg 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}