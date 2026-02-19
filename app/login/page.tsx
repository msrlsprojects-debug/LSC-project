'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Fix hydration issue */
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // prevents hydration mismatch
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 items-center justify-center px-12">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-slate-800">
            MSRLS – Livelihood Service Centres
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Monitoring Information System for tracking services,
            performance, and outreach of Livelihood Service Centres
            under MKSP–IFC initiatives.
          </p>
          <p className="text-sm text-slate-500">
            Government of Meghalaya
          </p>


          <Link
            href="/public/lscregistration"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors underline">
            New Application
          </Link>

          <Link
            href="/public/registrationstatus"
            className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors p-2">
            Track My Applocation
          </Link>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-8"
        >
          <h2 className="text-xl font-semibold text-center text-slate-800 mb-1">
            Login
          </h2>
          <p className="text-sm text-center text-slate-500 mb-6">
            Authorized access only
          </p>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-blue-700 text-white py-2.5 font-medium hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="mt-6 text-xs text-center text-slate-400">
            © MSRLS • Internal MIS
          </p>
        </form>
      </div>
    </div>
  );
}
