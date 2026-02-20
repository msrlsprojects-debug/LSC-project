'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UserProfile = {
  user_id: string;
  role: 'DISTRICT' | 'BLOCK';
  email: string;
  district: string | null;
  block: string | null;
};

export default function UserManagementPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/district/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetPassword = async (user_id: string) => {
    if (!newPassword) return alert('Enter a password');
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    // send to admin route
    await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify({ user_id, password: newPassword }),
    });

    setResetFor(null);
    setNewPassword('');
    setSaving(false);
    loadUsers();
  };

  const deleteUser = async (user_id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    const { data: { session } } = await supabase.auth.getSession();

    // for now send to admin route
    await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify({ user_id }),
    });
    loadUsers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER: Responsive flex-col for small screens */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            District & Block Administrator Accounts
          </p>
        </div>
        <Link
          href="/dashboard/district/users/create" 
          className="w-full sm:w-auto justify-center bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center shadow-sm"
        >
          Create User + 
        </Link>
      </div>

      {/* DESKTOP TABLE: Stays hidden on small screens */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">Email</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">Role</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">District</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">Block</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-500">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-900 font-medium">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${u.role === 'DISTRICT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.district || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{u.block || '—'}</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    {resetFor === u.user_id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border border-slate-300 px-3 py-1 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="New password"
                        />
                        <button onClick={() => resetPassword(u.user_id)} disabled={saving} className="text-blue-600 font-semibold hover:underline">
                          {saving ? '...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setResetFor(u.user_id)} className="text-blue-600 font-medium hover:text-blue-800 transition-colors">Reset</button>
                        <button onClick={() => deleteUser(u.user_id)} className="text-red-500 font-medium hover:text-red-700 transition-colors">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST: Visible only on small screens */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center p-10 text-slate-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center p-10 bg-white border rounded-lg text-slate-500">No users found</div>
        ) : (
          users.map((u) => (
            <div key={u.user_id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 break-all">{u.email}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${u.role === 'DISTRICT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-medium">District</p>
                  <p className="text-slate-700 font-medium">{u.district || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium">Block</p>
                  <p className="text-slate-700 font-medium">{u.block || '—'}</p>
                </div>
              </div>

              {resetFor === u.user_id ? (
                <div className="space-y-3 pt-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-300 px-4 py-2 rounded-lg text-sm"
                    placeholder="Type new password"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => resetPassword(u.user_id)} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">
                      {saving ? 'Saving...' : 'Confirm New Password'}
                    </button>
                    <button onClick={() => setResetFor(null)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setResetFor(u.user_id)}
                    className="flex-1 bg-slate-50 text-blue-700 border border-blue-100 py-2.5 rounded-lg text-sm font-bold active:bg-blue-100 transition-colors"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => deleteUser(u.user_id)}
                    className="flex-1 bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-lg text-sm font-bold active:bg-red-100 transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}