// frontend/app/dashboard/block/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type LSC = {
  id: string;
  lsc_name: string;
};

type ServiceTxn = {
  lsc_id: string;
  amount_collected: number;
  beneficiary_name: string;
};

export default function BlockDashboard() {
    const router = useRouter();
  const [blockInfo, setBlockInfo] = useState<{
    blockName: string;
    districtName: string;
  } | null>(null);

  const [lscs, setLscs] = useState<LSC[]>([]);
  const [transactions, setTransactions] = useState<ServiceTxn[]>([]);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    totalLSCs: 0,
    totalServices: 0,
    totalBeneficiaries: 0,
    totalCollection: 0,
  });
    /* -
    --------- LOGOUT ---------- */
    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
    };

  useEffect(() => {
    const loadData = async () => {
      /* 0. Auth */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setLoading(false);
        return;
      }

      /* 1. Profile */
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, role, block_id, district_id')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile?.block_id) {
        setLoading(false);
        return;
      }

      /* 2. Fetch block name */
      const { data: block } = await supabase
        .from('blocks')
        .select('name')
        .eq('id', profile.block_id)
        .single();

      /* 3. Fetch district name (safe even if null) */
      let districtName = 'Unknown District';

      if (profile.district_id) {
        const { data: district } = await supabase
          .from('districts')
          .select('name')
          .eq('id', profile.district_id)
          .single();

        districtName = district?.name || districtName;
      }

      setBlockInfo({
        blockName: block?.name || 'Unknown Block',
        districtName,
      });

      /* 4. Fetch LSCs under block */
      const { data: lscData, error: lscError } = await supabase
        .from('lscs')
        .select('id, lsc_name')
        .eq('block_id', profile.block_id)
        .eq('is_active', true);

      if (lscError) {
        setLoading(false);
        return;
      }

      setLscs(lscData || []);

      /* 5. Fetch service transactions */
      const lscIds = (lscData || []).map((l) => l.id);
      let txnData: ServiceTxn[] = [];

      if (lscIds.length > 0) {
        const { data } = await supabase
          .from('service_transactions')
          .select('lsc_id, amount_collected, beneficiary_name')
          .in('lsc_id', lscIds);

        txnData = data || [];
      }

      setTransactions(txnData);

      /* 6. Summary */
      const totalCollection = txnData.reduce(
        (sum, t) => sum + (t.amount_collected || 0),
        0
      );

      const totalBeneficiaries = new Set(
        txnData.map((t) => t.beneficiary_name)
      ).size;

      setSummary({
        totalLSCs: lscData?.length || 0,
        totalServices: txnData.length,
        totalBeneficiaries,
        totalCollection,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading || !blockInfo) {
    return <p className="p-6">Loading block dashboard…</p>;
  }

  return (
  <div className="min-h-screen bg-gray-100">

    {/* ================= NAV ================= */}
    <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between">
        <div>
          <p className="text-xs opacity-90">MSRLS – Block MIS</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm opacity-90 hover:underline"
        >
          Logout
        </button>
      </div>
    </header>

    {/* ================= MAIN ================= */}
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      {/* ===== Block Identity ===== */}
      <section className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-blue-600 text-center bg-gradient-to-r from-blue-50 to-white">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          Block Dashboard
        </p>
        <h1 className="text-xl md:text-2xl font-semibold text-blue-800">
          {blockInfo.blockName} Block
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {blockInfo.districtName} District
        </p>
      </section>

      {/* ===== KPI CARDS ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total LSCs" value={summary.totalLSCs} />
        <KpiCard label="Services Delivered" value={summary.totalServices} />
        <KpiCard
          label="Beneficiaries Served"
          value={summary.totalBeneficiaries}
        />
        <KpiCard
          label="Total Collection"
          value={`₹${summary.totalCollection}`}
        />
      </section>

      {/* ===== LSC PERFORMANCE ===== */}
      <section className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">
            LSC Performance Overview
          </h2>
          <p className="text-sm text-gray-500">
            Performance summary of LSCs under this block
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">LSC</th>
                <th className="px-4 py-3 text-right">Services</th>
                <th className="px-4 py-3 text-right">Beneficiaries</th>
                <th className="px-4 py-3 text-right">
                  Collection (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {lscs.map((lsc) => {
                const lscTxns = transactions.filter(
                  (t) => t.lsc_id === lsc.id
                );

                const collection = lscTxns.reduce(
                  (sum, t) => sum + (t.amount_collected || 0),
                  0
                );

                const beneficiaries = new Set(
                  lscTxns.map((t) => t.beneficiary_name)
                ).size;

                return (
                  <tr key={lsc.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-500">
                      {lsc.lsc_name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {lscTxns.length}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {beneficiaries}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-500">
                      ₹{collection}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {lscs.map((lsc) => {
            const lscTxns = transactions.filter(
              (t) => t.lsc_id === lsc.id
            );
            const collection = lscTxns.reduce(
              (s, t) => s + (t.amount_collected || 0),
              0
            );

            return (
              <div key={lsc.id} className="p-4 text-sm space-y-1">
                <p className="font-semibold">{lsc.lsc_name}</p>
                <p className="text-gray-600">
                  Services: {lscTxns.length}
                </p>
                <p className="text-gray-600">
                  Collection: ₹{collection}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-4 my-6">
  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
    Detailed Transactions
  </h3>
  <div className="flex-1 h-px bg-gray-300" />
</div>


      {/* ===== SERVICE TRANSACTIONS ===== */}
      <ServiceTransactionsTable
        transactions={transactions}
        lscs={lscs}
      />

    </main>
  </div>
);

}

/* Reusable stat card */
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm text-center">
      <p className="text-xs uppercase text-gray-500">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-800">
        {value}
      </p>
    </div>
  );
}

function ServiceTransactionsTable({
  transactions,
  lscs,
}: {
  transactions: ServiceTxn[];
  lscs: LSC[];
}) {
  const [selectedLsc, setSelectedLsc] = useState<string>('ALL');

  const filteredTxns =
    selectedLsc === 'ALL'
      ? transactions
      : transactions.filter(
          (t) => t.lsc_id === selectedLsc
        );

  return (
    <section className="bg-white rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:justify-between gap-4">
        <h2 className="font-semibold text-gray-800">
          Service Transactions
        </h2>

        <select
          value={selectedLsc}
          onChange={(e) => setSelectedLsc(e.target.value)}
          className="border rounded px-3 py-2 text-sm text-gray-500"
        >
          <option value="ALL">All LSCs</option>
          {lscs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.lsc_name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Beneficiary</th>
              <th className="px-4 py-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxns.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No transactions found
                </td>
              </tr>
            )}

            {filteredTxns.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3 text-gray-500">
                  {t.beneficiary_name}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-500">
                  ₹{t.amount_collected}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
