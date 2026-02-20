'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, User, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';

export default function LSCProfileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard/block', icon: LayoutDashboard },
    { name: 'LSCs', href: '/dashboard/block/lsc', icon: User },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER - Solid Professional Navy */}
      <header className="bg-[#1e40af] text-white sticky top-0 z-[100] border-b border-blue-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 md:h-20 flex justify-between items-center">
          
          {/* BRANDING */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/lsc" className="transition-transform active:scale-95">
              <img 
                src="/logo1.jpg" 
                alt="Logo" 
                className="h-10 md:h-12 w-auto object-contain rounded brightness-110" 
              />
            </Link>
            <div className="hidden sm:block border-l border-white/20 pl-4">
              <h1 className="text-xs font-bold uppercase tracking-widest text-white">LSC Portal</h1>
              <p className="text-[9px] text-blue-200 font-medium uppercase mt-0.5 tracking-[0.2em]">Block Login</p>
            </div>
          </div>

          {/* DESKTOP MENU - Standard Professional Design */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-md ${
                  pathname === link.href 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'text-blue-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout} 
              className="hidden md:flex items-center gap-2 text-[10px] font-bold border border-white/20 px-4 py-2 rounded-md hover:bg-white/10 transition-all uppercase tracking-widest"
            >
              <LogOut size={14} />
              Logout
            </button>

            {/* MOBILE MENU TOGGLE */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN - Consistent with Desktop Style */}
        <div 
          className={`md:hidden absolute w-full left-0 bg-[#1e3a8a] border-b border-blue-900 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
            isMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  pathname === link.href ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <link.icon size={18} strokeWidth={2.5} />
                  <span className="text-xs font-bold uppercase tracking-widest">{link.name}</span>
                </div>
                <ChevronRight size={14} className="opacity-40" />
              </Link>
            ))}
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-4 p-4 w-full text-red-300 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full min-h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
}