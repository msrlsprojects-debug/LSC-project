'use client';

import Link from 'next/link';
import { useState, memo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import { 
  LayoutDashboard, PlusCircle, List, Layers, Settings, Wallet, 
  FileText, Users, BarChart3, LogOut, Menu, ChevronDown, UserCircle, X 
} from 'lucide-react';

// Memoized NavItem to prevent unnecessary re-renders (Performance)
const NavItem = memo(({ href, children, icon: Icon, active, onClick }: any) => (
  <Link 
    href={href} 
    prefetch={true} 
    onClick={onClick} 
    className={`
      flex items-center gap-3 rounded-lg px-4 py-3 md:py-2.5 text-[14px] md:text-[13px] transition-all duration-150
      ${active 
        ? 'bg-blue-600 text-white font-semibold shadow-md md:translate-x-1' 
        : 'text-slate-500 hover:text-slate-900 font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'}
    `}
  >
    {Icon && <Icon size={18} strokeWidth={active ? 2.5 : 2} />}
    <span className="truncate tracking-wide">{children}</span>
  </Link>
));
NavItem.displayName = 'NavItem';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Ensures client-side logic only runs after mount to prevent hydration lag
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!mounted) return <div className="bg-white h-screen w-full" />;

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-800 flex font-sans antialiased">
      
      {/* MOBILE OVERLAY */}
      {open && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300" 
          onClick={() => setOpen(false)} 
        />
      )}

      {/* SIDEBAR - Optimized for Desktop & Mobile Drawer */}
      <aside className={`
        fixed md:static z-[70] inset-y-0 left-0 w-[280px] md:w-72 bg-slate-50 border-r border-slate-200
        transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col overflow-hidden
      `}>
        
        {/* BRANDING AREA - No more blank space */}
        <div className="h-20 md:h-24 flex items-center px-6 md:px-8 border-b border-slate-200 bg-white shrink-0">
          <div className="flex flex-col relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600 rounded-full" />
            <h1 className="text-[14px] md:text-[15px] font-black tracking-tight text-slate-900 uppercase leading-none">
              MSRLS – LSC
            </h1>
            <p className="text-[9px] md:text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-2">
              Admin Portal
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden ml-auto p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION - scrollbar-hide applied here */}
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto pt-6 scrollbar-hide">
          <NavItem href="/dashboard/admin" icon={LayoutDashboard} active={pathname === '/dashboard/admin'} onClick={() => setOpen(false)}>
            Dashboard Overview
          </NavItem>

          <NavSection title="LSC Management">
            <NavItem href="/dashboard/admin/lsc/new" icon={PlusCircle} active={pathname === '/dashboard/admin/lsc/new'} onClick={() => setOpen(false)}>Add New +</NavItem>
            <NavItem href="/dashboard/admin/lsc" icon={List} active={pathname === '/dashboard/admin/lsc'} onClick={() => setOpen(false)}>LSC List</NavItem>
          </NavSection>

          <NavSection title="Services Management">
            <NavItem href="/dashboard/admin/services/categories" icon={Layers} active={pathname.includes('categories')} onClick={() => setOpen(false)}>Categories</NavItem>
            <NavItem href="/dashboard/admin/services/services" icon={Settings} active={pathname.includes('services')} onClick={() => setOpen(false)}>All Services</NavItem>
          </NavSection>

          <NavSection title="Finance & Accounting">
            <NavItem href="/dashboard/admin/finance" icon={Wallet} active={pathname.includes('finance')} onClick={() => setOpen(false)}>Financial Management</NavItem>
            {/* <NavItem href="/dashboard/admin/finance/expenditure" icon={FileText} active={pathname.includes('expenditure')} onClick={() => setOpen(false)}>Income & Expenditure</NavItem> */}
          </NavSection>

          <NavSection title="User Management">
            <NavItem href="/dashboard/admin/users" icon={Users} active={pathname === '/dashboard/admin/users'} onClick={() => setOpen(false)}>Users List</NavItem>
          </NavSection>

          <NavSection title="Intelligence">
            <NavItem href="/dashboard/admin/reports" icon={BarChart3} active={pathname === '/dashboard/admin/reports'} onClick={() => setOpen(false)}>Reports & Analytics</NavItem>
          </NavSection>
        </nav>

        {/* LOGOUT AREA */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all text-[11px] font-bold uppercase tracking-widest active:scale-95">
            <LogOut size={15} /> Logout Session
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
        
        {/* HEADER - Increased Logo & Alignment */}
        <header className="h-20 md:h-24 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-12 shrink-0 z-50">
          <div className="flex items-center gap-3 md:gap-8">
            <button onClick={() => setOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"><Menu size={24} /></button>
            
            <div className="hidden md:block h-8 w-[1px] bg-slate-200" />

            <img 
              src="/logo1.jpg" 
              alt="Logo" 
              className="h-9 md:h-16 w-auto object-contain transition-transform hover:scale-105" 
            />
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden xs:flex flex-col items-end border-r border-slate-200 pr-4 md:pr-6">
              <p className="text-[11px] md:text-[12px] font-bold text-slate-900 uppercase tracking-tight leading-none">Admin</p>
              <div className="flex items-center gap-1 mt-1.5 md:mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[8px] md:text-[9px] font-semibold text-emerald-600 uppercase tracking-widest">Verified</p>
              </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-sm ring-1 ring-slate-200">
              <UserCircle size={24} className="md:w-[30px] md:h-[30px]" />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT - scrollbar-hide applied here too */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavSection({ title, children }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors">
        <span>{title}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}