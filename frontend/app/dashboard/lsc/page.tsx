//frontend\app\dashboard\lsc\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ---------- TYPES ---------- */

type LSC = {
  id: string;
  lsc_name: string;
  village: string | null;
  gp: string | null;
  clf_name: string | null;
  block_name: string;
  district_name: string;
};

type Stats = {
  services: number;
  beneficiaries: number;
  collection: number;
};

type ServiceItem = {
  id: string;
  name: string;
};

type RecentTxn = {
  id: string;
  service_start_date: string;
  beneficiary_name: string;
  amount_collected: number;
};

/* ---------- PAGE ---------- */

export default function LSCDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lsc, setLsc] = useState<LSC | null>(null);
  const [lscId, setLscId] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    services: 0,
    beneficiaries: 0,
    collection: 0,
  });

  const [recentTxns, setRecentTxns] = useState<RecentTxn[]>([]);

  /* ---------- MODAL ---------- */
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    service_item_id: '',
    service_start_date: '',
    beneficiary_name: '',
    beneficiary_address: '',
    beneficiary_phone: '',
    amount_collected: '',
  });

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  

  /* ---------- LOAD DASHBOARD ---------- */
  const loadDashboard = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('lsc_id')
      .eq('user_id', session.user.id)
      .single();

    if (!profile?.lsc_id) {
      setLoading(false);
      return;
    }

    setLscId(profile.lsc_id);

    const { data: lscBase } = await supabase
      .from('lscs')
      .select('id,lsc_name,village,gp,clf_name,block_id,district_id')
      .eq('id', profile.lsc_id)
      .single();

    if (!lscBase) {
      setLoading(false);
      return;
    }

    const [{ data: block }, { data: district }] = await Promise.all([
      supabase.from('blocks').select('name').eq('id', lscBase.block_id).single(),
      supabase.from('districts').select('name').eq('id', lscBase.district_id).single(),
    ]);

    setLsc({
      id: lscBase.id,
      lsc_name: lscBase.lsc_name,
      village: lscBase.village,
      gp: lscBase.gp,
      clf_name: lscBase.clf_name,
      block_name: block?.name || '—',
      district_name: district?.name || '—',
    });

    /* ---------- LOAD STATS ---------- */
    const { data: txns } = await supabase
      .from('service_transactions')
      .select('amount_collected, beneficiary_name')
      .eq('lsc_id', profile.lsc_id);

    if (txns) {
      setStats({
        services: txns.length,
        beneficiaries: new Set(txns.map(t => t.beneficiary_name)).size,
        collection: txns.reduce((s, t) => s + Number(t.amount_collected), 0),
      });
    }

    /* ---------- LOAD RECENT TRANSACTIONS (TOP 10) ---------- */
    const { data: recent, error: recentError } = await supabase
      .from('service_transactions')
      .select(
        'id, service_start_date, beneficiary_name, amount_collected'
      )
      .eq('lsc_id', profile.lsc_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Error loading recent transactions:', recentError);
      setRecentTxns([]);
    } else {
      setRecentTxns(recent || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ---------- DELETE TRANSACTION ---------- */
  const deleteTxn = async (txnId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction? This action cannot be undone.'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('service_transactions')
      .delete()
      .eq('id', txnId);

    if (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction. Please try again.');
      return;
    }

    // Refresh dashboard stats & recent transactions
    loadDashboard();
  };  

  /* ---------- OPEN MODAL & LOAD SERVICES ---------- */
  const openAddServiceModal = async () => {
    setShowModal(true);
    setError(null);
    setServices([]);

    if (!lscId) {
      setError('LSC not found');
      return;
    }

    const { data: lscServices } = await supabase
      .from('lsc_services')
      .select('service_item_id')
      .eq('lsc_id', lscId)
      .eq('is_available', true);

    if (!lscServices || lscServices.length === 0) {
      setError('No services configured for this LSC');
      return;
    }

    const ids = lscServices.map(s => s.service_item_id);

    const { data: items } = await supabase
      .from('service_items')
      .select('id, name')
      .in('id', ids)
      .order('name');

    setServices(items || []);
  };

  

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lscId) return;

    if (!form.service_item_id || !form.service_start_date || !form.beneficiary_name || !form.amount_collected) {
      setError('Please fill all required fields');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('service_transactions')
      .insert({
        lsc_id: lscId,
        service_item_id: form.service_item_id,
        service_start_date: form.service_start_date,
        beneficiary_name: form.beneficiary_name,
        beneficiary_address: form.beneficiary_address || null,
        beneficiary_phone: form.beneficiary_phone || null,
        amount_collected: Number(form.amount_collected),
      });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setForm({
      service_item_id: '',
      service_start_date: '',
      beneficiary_name: '',
      beneficiary_address: '',
      beneficiary_phone: '',
      amount_collected: '',
    });

    setShowModal(false);
    loadDashboard();
  };

  if (loading || !lsc) {
    return <p className="p-6 text-gray-700">Loading dashboard…</p>;
  }

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAV */}
      {/* <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between">
          <div>
            <p className="text-xs opacity-90">MSRLS – LSC MIS</p>
          </div>
          <button onClick={handleLogout} className="text-sm opacity-90">
            Logout
          </button>
        </div>
      </header> */}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      <section className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-blue-600 text-center bg-gradient-to-r from-blue-50 to-white">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          Livelihood Service Centre
        </p>
        <h1 className="text-xl md:text-2xl font-semibold text-blue-800">
          {lsc.lsc_name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {lsc.block_name} Block, {lsc.district_name}
        </p>
        
        <Link
          href="/dashboard/lsc/profile"
          className="w-full sm:w-auto  text-blue-600 px-6 py-3 font-semibold text-center"
        >
         More...
        </Link>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Services" value={stats.services} />
        <Stat label="Beneficiaries" value={stats.beneficiaries} />
        <Stat label="Collection" value={`₹${stats.collection}`} />
      </section>

      {/* ACTIONS */}
      <section className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <button
          onClick={openAddServiceModal}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-center"
        >
          + Add Service Entry
        </button>

        <Link
          href="/dashboard/lsc/services"
          className="w-full sm:w-auto border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold text-center"
        >
          View Service History
        </Link>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">
            Recent Service Transactions
          </h2>
        </div>

        {/* TABLE (DESKTOP) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Beneficiary</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.map(t => (
                <tr key={t.id} className="border-t text-gray-700">
                  <td className="px-4 py-3">
                    {new Date(t.service_start_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{t.beneficiary_name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₹{t.amount_collected}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button className="text-blue-600 text-sm hover:underline">
                      View
                    </button>
                    <button
                      onClick={() => deleteTxn(t.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {recentTxns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y">
          {recentTxns.map(t => (
            <div key={t.id} className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{new Date(t.service_start_date).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Beneficiary</span>
                <span className="font-medium">{t.beneficiary_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">₹{t.amount_collected}</span>
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button className="text-blue-600 text-sm">View</button>
                <button
                  onClick={() => deleteTxn(t.id)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {recentTxns.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No transactions found
            </div>
          )}
        </div>
      </section>

    </main>


      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">

            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Add Service Entry
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2 rounded mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">

              <select
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.service_item_id}
                onChange={(e) => setForm({ ...form, service_item_id: e.target.value })}
              >
                <option value="">Select service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <input
                type="date"
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.service_start_date}
                onChange={(e) => setForm({ ...form, service_start_date: e.target.value })}
              />

              <input
                type="text"
                placeholder="Beneficiary name"
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.beneficiary_name}
                onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })}
              />

              <input
                type="text"
                placeholder="Address (optional)"
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.beneficiary_address}
                onChange={(e) => setForm({ ...form, beneficiary_address: e.target.value })}
              />

              <input
                type="tel"
                placeholder="Phone (optional)"
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.beneficiary_phone}
                onChange={(e) => setForm({ ...form, beneficiary_phone: e.target.value })}
              />

              <input
                type="number"
                placeholder="Amount collected (₹)"
                className="w-full border rounded px-3 py-2 bg-white"
                value={form.amount_collected}
                onChange={(e) => setForm({ ...form, amount_collected: e.target.value })}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------- COMPONENT ---------- */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
