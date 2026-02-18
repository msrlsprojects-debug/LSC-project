'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 

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
    const res = await fetch('/api/admin/users');
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
    await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, password: newPassword }),
    });

    setResetFor(null);
    setNewPassword('');
    setSaving(false);
    loadUsers();
  };

  const deleteUser = async (user_id: string) => {
    if (!confirm('Delete this user permanently?')) return;

    await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });

    loadUsers();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-600">
            District & Block Administrator Accounts
          </p>
        </div>
        {/* <button
          onClick={() => router.back()}
          className="border px-4 py-2 rounded text-sm hover:bg-slate-50"
        >
          ← Back
        </button> */}
        <Link
          href="/dashboard/admin/users/create" 
          className="border px-4 py-2 rounded text-sm hover:bg-slate-50 inline-flex items-center"
        >
          Create User + 
        </Link>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">District</th>
              <th className="px-4 py-3 text-left">Block</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-t">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${u.role === 'DISTRICT'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.district || '—'}</td>
                  <td className="px-4 py-3">{u.block || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {resetFor === u.user_id ? (
                      <>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border px-2 py-1 rounded text-sm"
                          placeholder="New password"
                        />
                        <button
                          onClick={() => resetPassword(u.user_id)}
                          className="text-blue-700 text-sm"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setResetFor(u.user_id)}
                          className="text-blue-700 text-sm"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => deleteUser(u.user_id)}
                          className="text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="md:hidden space-y-4">
        {users.map((u) => (
          <div key={u.user_id} className="bg-white border rounded-lg p-4 space-y-1">
            <p className="font-medium">{u.email}</p>
            <p className="text-sm text-slate-600">{u.role}</p>
            <p className="text-sm">District: {u.district || '—'}</p>
            {u.block && <p className="text-sm">Block: {u.block}</p>}

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setResetFor(u.user_id)}
                className="text-blue-700 text-sm"
              >
                Reset
              </button>
              <button
                onClick={() => deleteUser(u.user_id)}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
