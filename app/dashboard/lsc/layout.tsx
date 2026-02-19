'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LSCProfileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white sticky top-0 z-50 shadow-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center gap-2">
          
          {/* LEFT SIDE */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            {/* Logo: The main identifier on mobile */}
            <Link href="/dashboard/lsc" className="shrink-0">
              <img 
                src="/logo1.jpg" 
                alt="Logo" 
                className="h-12 w-auto md:h-16 object-contain" 
              />
            </Link>
            
            {/* BRAND TEXT: Hidden on mobile (hidden), visible from 'sm' (sm:flex) upwards */}
            <div className="hidden sm:flex flex-col border-l border-white/30 pl-3 md:pl-4 overflow-hidden">
              <span className="font-bold tracking-tight text-base md:text-xl uppercase whitespace-nowrap">
                LSC Portal
              </span>
              <span className="hidden md:block text-[10px] opacity-70 font-medium tracking-widest uppercase">
                Management System
              </span>
            </div>

            {/* Dashboard Link: Also hidden on mobile/tablet, only for large screens */}
            {/* <nav className="hidden lg:block ml-2">
              <Link 
                href="/dashboard/lsc" 
                className="text-[10px] font-bold opacity-70 hover:opacity-100 transition-all uppercase"
              >
                ← Dashboard
              </Link>
            </nav> */}
          </div>

          {/* RIGHT SIDE: Actions & Logout */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Container for Edit/Save buttons */}
            <div id="header-actions" className="flex items-center gap-2">
              {/* Buttons from page.tsx inject here */}
            </div>

            {/* Logout Button: Slightly smaller on mobile to save space */}
            <button 
              onClick={handleLogout} 
              className="text-[10px] md:text-sm font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded border border-white/20 transition-all uppercase whitespace-nowrap"
            >
              Logout
            </button>
          </div>
          
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}