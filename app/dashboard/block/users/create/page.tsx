'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type District = { id: string; name: string };
type Block = { id: string; name: string; district_id: string };

export default function CreateAdminUserPage() {
  const router = useRouter();

  const [role, setRole] = useState<'DISTRICT' | 'BLOCK' | 'ANCHOR'>('ANCHOR');
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch Profile (including block_id) and all Blocks in parallel
      const [profileRes, allBlocksRes] = await Promise.all([
        supabase.from('profiles').select('district_id, block_id').eq('user_id', user.id).single(),
        supabase.from('blocks').select('id, name, district_id').order('name')
      ]);

      const userDistId = profileRes.data?.district_id;
      const userBlockId = profileRes.data?.block_id;

      if (userDistId) {
        // 2. Fetch District name
        const { data: d } = await supabase
          .from('districts')
          .select('id, name')
          .eq('id', userDistId)
          .single();

        setDistricts(d ? [d] : []);
        setDistrictId(userDistId);
        
        // 3. FILTER LOGIC: 
        // Only show the block that matches the logged-in user's block_id
        const filteredBlocks = (allBlocksRes.data || []).filter(b => b.id === userBlockId);
        
        setBlocks(filteredBlocks);

        // 4. Auto-select that block since it's the only option
        if (filteredBlocks.length === 1) {
          setBlockId(filteredBlocks[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createUser = async () => {
    setError(null);
    setSuccess(false);
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (role === 'BLOCK' && (!districtId || !blockId)) { setError('Please select district and block.'); return; }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/block/create-user', {
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
        setEmail(''); setPassword(''); 
        // We don't clear blockId because it's fixed for this user
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
      <div className="flex items-start justify-between mt-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create User</h1>
          <p className="text-sm text-slate-600">Assign users to your specific jurisdiction</p>
        </div>
        <button onClick={() => router.back()} className="border px-4 py-2 rounded text-sm hover:bg-slate-50 transition-colors">
          Back ←
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">User created successfully.</p>}

        <div>
          <label className="text-sm font-medium">Role</label>
          <select disabled value={role} className="w-full border rounded px-3 py-2 mt-1 bg-slate-50 cursor-not-allowed">
             <option value="ANCHOR">LSC ANCHOR</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2 mt-1 outline-none focus:border-blue-500" placeholder="user@example.com" />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2 mt-1 outline-none focus:border-blue-500" placeholder="••••••••" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 uppercase text-[10px]">Your Assigned District</label>
          <select disabled value={districtId} className="w-full border rounded px-3 py-2 mt-1 bg-slate-50 cursor-not-allowed">
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 uppercase text-[10px]">Your Assigned Block</label>
          <select 
            disabled 
            value={blockId} 
            className="w-full border rounded px-3 py-2 mt-1 bg-slate-50 cursor-not-allowed appearance-none"
          >
            {blocks.length === 0 && <option value="">No block assigned</option>}
            {blocks.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1 italic">Note: You can only create users within your assigned block.</p>
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={() => router.back()} className="border px-4 py-2 rounded hover:bg-slate-50 transition-colors text-sm">Cancel</button>
          <button
            onClick={createUser}
            disabled={saving || !districtId || !blockId}
            className="bg-slate-800 text-white px-8 py-2 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}