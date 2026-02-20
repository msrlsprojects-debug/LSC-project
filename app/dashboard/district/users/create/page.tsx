'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type District = { id: string; name: string };
type Block = { id: string; name: string; district_id: string };

export default function CreateAdminUserPage() {
  const router = useRouter();

  const [role, setRole] = useState<'DISTRICT' | 'BLOCK'>('BLOCK');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [blockId, setBlockId] = useState('');

  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // 1. Get user quickly from local session if available
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Optimized: Fetch Profile and Blocks in PARALLEL
      // This saves one full round-trip to the server
      const [profileRes, allBlocksRes] = await Promise.all([
        supabase.from('profiles').select('district_id').eq('user_id', user.id).single(),
        supabase.from('blocks').select('id, name, district_id').order('name')
      ]);

      const distId = profileRes.data?.district_id;

      if (distId) {
        // 3. Fetch specific district name
        const { data: d } = await supabase
          .from('districts')
          .select('id, name')
          .eq('id', distId)
          .single();

        setDistricts(d ? [d] : []);
        setDistrictId(distId);
        
        // Filter blocks locally instead of making another DB call
        const filteredBlocks = (allBlocksRes.data || []).filter(b => b.district_id === distId);
        setBlocks(filteredBlocks);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  /* ... rest of your createUser function stays exactly the same ... */
  const createUser = async () => {
    setError(null);
    setSuccess(false);
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (role === 'BLOCK' && (!districtId || !blockId)) { setError('Please select district and block.'); return; }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email, password, role, district_id: districtId, block_id: blockId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'User creation failed');
      } else {
        setSuccess(true);
        setEmail(''); setPassword(''); setBlockId('');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 text-center animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-32 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* HEADER WITH BACK BUTTON ON THE RIGHT */}
      <div className="flex items-start justify-between mt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Admin User
          </h1>
          <p className="text-sm text-slate-600">
            Create Block level administrators for your district
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="border px-4 py-2 rounded text-sm hover:bg-slate-50 transition-colors"
        >
          Back ←
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
            User created successfully.
          </p>
        )}

        {/* ROLE */}
        <div>
          <label className="text-sm font-medium">Role</label>
          <select
            disabled
            value={role}
            className="w-full border rounded px-3 py-2 mt-1 bg-slate-50 cursor-not-allowed"
          >
            <option value="BLOCK">Block Admin</option>
          </select>
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* DISTRICT */}
        <div>
          <label className="text-sm font-medium text-slate-500">Your District</label>
          <select
            disabled
            value={districtId}
            className="w-full border rounded px-3 py-2 mt-1 bg-slate-50 cursor-not-allowed"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* BLOCK */}
        <div>
          <label className="text-sm font-medium">Block</label>
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="">Select block</option>
            {blocks.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={() => router.back()}
            className="border px-4 py-2 rounded hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={createUser}
            disabled={saving || !districtId}
            className="bg-slate-800 text-white px-5 py-2 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}