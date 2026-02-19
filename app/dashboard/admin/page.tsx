'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    districts: 0,
    blocks: 0,
    totalLSCs: 0,
    activeLSCs: 0,
    inactiveLSCs: 0,
    services: 0,
    transactions: 0,
    beneficiaries: 0,
    collection: 0,
  });

  const [health, setHealth] = useState({
    lscWithoutServices: 0,
    lscWithoutTransactions: 0,
    unusedServices: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: districts } = await supabase.from('districts').select('id');
      const { data: blocks } = await supabase.from('blocks').select('id');
      const { data: lscs } = await supabase.from('lscs').select('id,is_active');
      const { data: services } = await supabase.from('service_items').select('id');
      const { data: lscServices } = await supabase.from('lsc_services').select('lsc_id,service_item_id');
      const { data: txns } = await supabase.from('service_transactions').select('lsc_id,beneficiary_name,amount_collected');

      const activeLSCs = lscs?.filter(l => l.is_active).length || 0;
      const inactiveLSCs = (lscs?.length || 0) - activeLSCs;
      const totalCollection = txns?.reduce((s, t) => s + t.amount_collected, 0) || 0;
      const beneficiaries = new Set((txns || []).map(t => t.beneficiary_name)).size;

      const lscWithServices = new Set((lscServices || []).map(ls => ls.lsc_id));
      const lscWithTxns = new Set((txns || []).map(t => t.lsc_id));
      const serviceUsed = new Set((lscServices || []).map(ls => ls.service_item_id));

      setStats({
        districts: districts?.length || 0,
        blocks: blocks?.length || 0,
        totalLSCs: lscs?.length || 0,
        activeLSCs,
        inactiveLSCs,
        services: services?.length || 0,
        transactions: txns?.length || 0,
        beneficiaries,
        collection: totalCollection,
      });

      setHealth({
        lscWithoutServices: (lscs || []).filter(l => !lscWithServices.has(l.id)).length,
        lscWithoutTransactions: (lscs || []).filter(l => !lscWithTxns.has(l.id)).length,
        unusedServices: (services || []).filter(s => !serviceUsed.has(s.id)).length,
      });

      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="text-slate-700">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          System overview and governance summary
        </p>
      </div>

      {/* CORE STATS */}
      <section>
        <h2 className="text-xs font-semibold text-slate-600 uppercase mb-3">
          Core Statistics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Stat label="Districts" value={stats.districts} />
          <Stat label="Blocks" value={stats.blocks} />
          <Stat label="Total LSCs" value={stats.totalLSCs} />
          <Stat label="Active LSCs" value={stats.activeLSCs} />
          <Stat label="Inactive LSCs" value={stats.inactiveLSCs} />
          <Stat label="Services" value={stats.services} />
        </div>
      </section>

      {/* PERFORMANCE */}
      <section>
        <h2 className="text-xs font-semibold text-slate-600 uppercase mb-3">
          Performance Snapshot
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat label="Transactions" value={stats.transactions} />
          <Stat label="Beneficiaries" value={stats.beneficiaries} />
          <Stat label="Collection (₹)" value={stats.collection} />
        </div>
      </section>

      {/* ADMINISTRATION */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Administration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminCard
            title="User Management"
            description="Create and manage District & Block administrators."
            primaryAction={{
              label: 'Create User',
              onClick: () => router.push('/dashboard/admin/users/create'),
            }}
            secondaryAction={{
              label: 'View Users',
              onClick: () => router.push('/dashboard/admin/users'),
            }}
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-xs text-slate-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AdminCard({
  title,
  description,
  primaryAction,
  secondaryAction,
}: any) {
  return (
    <div className="border rounded-lg p-5 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={primaryAction.onClick}
          className="bg-slate-800 text-white px-4 py-2 rounded"
        >
          {primaryAction.label}
        </button>

        <button
          onClick={secondaryAction.onClick}
          className="border px-4 py-2 rounded"
        >
          {secondaryAction.label}
        </button>
      </div>
    </div>
  );
}
