'use client';

import Link from 'next/link';
import { useState, memo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import {
  LayoutDashboard, PlusCircle, List, Layers, Wallet,
  BarChart3, LogOut, Menu, ChevronDown, UserCircle, X
} from 'lucide-react';

// NavItem definition
const NavItem = memo(({ href, children, icon: Icon, active, onClick }: any) => (
  <Link
    href={href}
    prefetch={true}
    onClick={onClick}
    className={`
      flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-all duration-150
      ${active
        ? 'bg-slate-800 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
    `}
  >
    {Icon && <Icon size={18} strokeWidth={active ? 2 : 1.5} />}
    <span className="truncate">{children}</span>
  </Link>
));
NavItem.displayName = 'NavItem';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [lscs, setLscs] = useState<any[]>([]);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    fetchLSCs();
  }, []);

  const fetchLSCs = async () => {
    try {

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;


      const response = await fetch('/api/anchor/getlsc', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLscs(data); // Simple loop handles this in the JSX
      } else {
        console.error("Failed to fetch LSCs via API");
      }
    } catch (error) {
      console.error("Network error calling API:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!mounted) return <div className="bg-white h-screen w-full" />;

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-800 flex font-sans antialiased">
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static z-[70] inset-y-0 left-0 w-72 bg-slate-50 border-r border-slate-200
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col overflow-hidden
      `}>

        <div className="h-20 flex items-center px-8 border-b border-slate-200 bg-white shrink-0">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900">MSRLS – LSC</h1>
            <p className="text-xs text-slate-500">Anchor Portal</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden ml-auto p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="p-4 space-y-4 flex-1 overflow-y-auto pt-6 scrollbar-hide">
          <NavItem href="/dashboard/anchor" icon={LayoutDashboard} active={pathname === '/dashboard/anchor'} onClick={() => setOpen(false)}>
            Dashboard Overview
          </NavItem>

          {/* LSC MANAGEMENT */}
          <NavSection title="LSC Management">
            <NavItem href="/dashboard/anchor/lsc" icon={List} active={pathname === '/dashboard/anchor/lsc'} onClick={() => setOpen(false)}>Manage</NavItem>
          </NavSection>


          {/*FUNDS MANAGEMENT */}
          <NavSection title="Funds">
            {lscs.map((item) => (
              <NavItem
                key={`fund-${item.id}`}
                href={`/dashboard/anchor/funds/${item.id}`}
                icon={Layers}
                active={pathname.includes(`/funds/${item.id}`)}
                onClick={() => setOpen(false)}
              >
                {item.lsc_name}
              </NavItem>
            ))}
          </NavSection>

          {/* TRANSACTION MANAGEMENT */}
          <NavSection title="Transaction">
            {lscs.map((item) => (
              <NavItem
                key={item.id}
                href={`/dashboard/anchor/transaction/${item.id}`}
                icon={List}
                active={pathname === `/dashboard/anchor/transaction/${item.id}`}
                onClick={() => setOpen(false)}
              >
                {item.lsc_name}
              </NavItem>
            ))}
          </NavSection>

          <NavSection title="Reports">
            <NavItem href="/dashboard/anchor/reports" icon={BarChart3} active={pathname.includes('reports')} onClick={() => setOpen(false)}>Reports & Analytics</NavItem>
          </NavSection>
        </nav>

        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium">
            <LogOut size={16} /> Logout Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="md:hidden p-2 text-slate-600"><Menu size={24} /></button>
            <img src="/logo1.jpg" alt="Logo" className="h-12 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-slate-900">Anchor</p>
              <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Portal Active</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
              <UserCircle size={24} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavSection({ title, children }: any) {
  // Initialized to true so the lists are visible by default
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 mb-1 text-xs text-slate-500 uppercase tracking-tight">
        <span>{title}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}