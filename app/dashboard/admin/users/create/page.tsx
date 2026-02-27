'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type District = { id: string; name: string };
type Block = { id: string; name: string; district_id: string };

export default function CreateAdminUserPage() {
  const router = useRouter();

  const [role, setRole] = useState<'DISTRICT' | 'BLOCK'>('DISTRICT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [blockId, setBlockId] = useState('');

  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* Load districts & blocks */
  useEffect(() => {
    const loadRefs = async () => {
      const { data: d } = await supabase
        .from('districts')
        .select('id, name')
        .order('name');

      const { data: b } = await supabase
        .from('blocks')
        .select('id, name, district_id')
        .order('name');

      setDistricts(d || []);
      setBlocks(b || []);
    };

    loadRefs();
  }, []);

  /* Create User */
  const createUser = async () => {
    setError(null);
    setSuccess(false);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (role === 'DISTRICT' && !districtId) {
      setError('Please select a district.');
      return;
    }

    if (role === 'BLOCK' && (!districtId || !blockId)) {
      setError('Please select district and block.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          district_id: districtId,
          block_id: blockId,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        setError(data.error || 'User creation failed');
        setSaving(false);
        return;
      }

      setSuccess(true);
      setEmail('');
      setPassword('');
      setDistrictId('');
      setBlockId('');
      setRole('DISTRICT');
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* HEADER WITH BACK BUTTON ON THE RIGHT */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Admin User
          </h1>
          <p className="text-sm text-slate-600">
            Create District or Block level administrators
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
            value={role}
            onChange={(e) => {
              setRole(e.target.value as any);
              setBlockId('');
            }}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="DISTRICT">District Admin</option>
            {/* <option value="BLOCK">Block Admin</option> */}
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
          <label className="text-sm font-medium">District</label>
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* BLOCK */}
        {role === 'BLOCK' && (
          <div>
            <label className="text-sm font-medium">Block</label>
            <select
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Select block</option>
              {blocks
                .filter(b => b.district_id === districtId)
                .map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            onClick={() => router.back()}
            className="border px-4 py-2 rounded hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={createUser}
            disabled={saving}
            className="bg-slate-800 text-white px-5 py-2 rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}