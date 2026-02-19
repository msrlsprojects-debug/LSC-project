// frontend/app/dashboard/district/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ---------- TYPES ---------- */

type Block = {
  id: string;
  name: string;
};

type LSC = {
  id: string;
  lsc_name: string;
  block_id: string;
};


type ServiceTxn = {
  lsc_id: string;
  amount_collected: number;
  beneficiary_name: string;
};

/* ---------- PAGE ---------- */

export default function DistrictDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState('');

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [lscs, setLscs] = useState<LSC[]>([]);
  const [transactions, setTransactions] = useState<ServiceTxn[]>([]);

  const [summary, setSummary] = useState({
    totalBlocks: 0,
    totalLSCs: 0,
    totalServices: 0,
    totalBeneficiaries: 0,
    totalCollection: 0,
  });

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* ---------- LOAD DASHBOARD ---------- */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      /* Profile */
      const { data: profile } = await supabase
        .from('profiles')
        .select('district_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.district_id) {
        setLoading(false);
        return;
      }

      /* District */
      const { data: district } = await supabase
        .from('districts')
        .select('name')
        .eq('id', profile.district_id)
        .single();

      setDistrictName(district?.name || '—');

      /* Blocks */
      const { data: blockData } = await supabase
        .from('blocks')
        .select('id, name')
        .eq('district_id', profile.district_id)
        .order('name');

      setBlocks(blockData || []);

      const blockIds = (blockData || []).map((b) => b.id);

      /* LSCs */
      const { data: lscData } = await supabase
        .from('lscs')
        .select('id, lsc_name, block_id')
        .in('block_id', blockIds)
        .eq('is_active', true);

      setLscs(lscData || []);

      const lscIds = (lscData || []).map((l) => l.id);

      /* Transactions */
      const { data: txnData } = await supabase
        .from('service_transactions')
        .select('lsc_id, amount_collected, beneficiary_name')
        .in('lsc_id', lscIds);

      setTransactions(txnData || []);

      /* Summary */
      const totalCollection = (txnData || []).reduce(
        (sum, t) => sum + Number(t.amount_collected),
        0
      );

      const beneficiaries = new Set(
        (txnData || []).map((t) => t.beneficiary_name)
      ).size;

      setSummary({
        totalBlocks: blockData?.length || 0,
        totalLSCs: lscData?.length || 0,
        totalServices: txnData?.length || 0,
        totalBeneficiaries: beneficiaries,
        totalCollection,
      });

      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading) {
    return <p className="p-6">Loading district dashboard…</p>;
  }

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAV */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between">
          <p className="text-xs opacity-90">MSRLS – District MIS</p>
          <button onClick={handleLogout} className="text-sm opacity-90 hover:underline">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Identity */}
        <section className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-blue-600 text-center bg-gradient-to-r from-blue-50 to-white">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            District Dashboard
          </p>
          <h1 className="text-xl md:text-2xl font-semibold text-blue-800">
            {districtName} District
          </h1>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Blocks" value={summary.totalBlocks} />
          <Stat label="LSCs" value={summary.totalLSCs} />
          <Stat label="Services" value={summary.totalServices} />
          <Stat label="Beneficiaries" value={summary.totalBeneficiaries} />
          <Stat label="Collection" value={`₹${summary.totalCollection}`} />
        </section>

        {/* Block Performance */}
        <section className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">
              Block-wise Performance
            </h2>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Block</th>
                  <th className="px-4 py-3 text-right">LSCs</th>
                  <th className="px-4 py-3 text-right">Services</th>
                  <th className="px-4 py-3 text-right">Beneficiaries</th>
                  <th className="px-4 py-3 text-right">Collection (₹)</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => {
                  const blockLscs = lscs.filter(
                    (l) => l.block_id === block.id
                  );
                  const blockTxn = transactions.filter((t) =>
                    blockLscs.map((l) => l.id).includes(t.lsc_id)
                  );

                  const collection = blockTxn.reduce(
                    (s, t) => s + Number(t.amount_collected),
                    0
                  );

                  const beneficiaries = new Set(
                    blockTxn.map((t) => t.beneficiary_name)
                  ).size;

                  return (
                    <tr key={block.id} className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-500">{block.name}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{blockLscs.length}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{blockTxn.length}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{beneficiaries}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-500">
                        ₹{collection}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y">
            {blocks.map((block) => {
              const blockLscs = lscs.filter((l) => l.block_id === block.id);
              const blockTxn = transactions.filter((t) =>
                blockLscs.map((l) => l.id).includes(t.lsc_id)
              );
              const collection = blockTxn.reduce(
                (s, t) => s + Number(t.amount_collected),
                0
              );

              return (
                <div key={block.id} className="p-4 text-sm space-y-1">
                  <p className="font-semibold">{block.name}</p>
                  <p className="text-gray-600">LSCs: {blockLscs.length}</p>
                  <p className="text-gray-600">Services: {blockTxn.length}</p>
                  <p className="text-gray-600">Collection: ₹{collection}</p>
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
<DistrictServiceTransactionsTable
  transactions={transactions}
  blocks={blocks}
  lscs={lscs}
/>

      </main>
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

function DistrictServiceTransactionsTable({
  transactions,
  blocks,
  lscs,
}: {
  transactions: ServiceTxn[];
  blocks: Block[];
  lscs: LSC[];
}) {
  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');
  const [selectedLsc, setSelectedLsc] = useState<string>('ALL');

  /* LSCs filtered by selected block */
  const filteredLscs =
    selectedBlock === 'ALL'
      ? lscs
      : lscs.filter((l) => l.block_id === selectedBlock);

  /* Transactions filtered by block + lsc */
  const filteredTxns = transactions.filter((t) => {
    if (selectedBlock !== 'ALL') {
      const lsc = lscs.find((l) => l.id === t.lsc_id);
      if (!lsc || lsc.block_id !== selectedBlock) return false;
    }

    if (selectedLsc !== 'ALL' && t.lsc_id !== selectedLsc) {
      return false;
    }

    return true;
  });

  return (
    <section className="bg-white rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="font-semibold text-gray-800">
          Service Transactions
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Block filter */}
          <select
            value={selectedBlock}
            onChange={(e) => {
              setSelectedBlock(e.target.value);
              setSelectedLsc('ALL');
            }}
            className="border rounded px-3 py-2 text-sm text-gray-500"
          >
            <option value="ALL">All Blocks</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* LSC filter */}
          <select
            value={selectedLsc}
            onChange={(e) => setSelectedLsc(e.target.value)}
            className="border rounded px-3 py-2 text-sm text-gray-500"
          >
            <option value="ALL">All LSCs</option>
            {filteredLscs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.lsc_name}
            </option>

            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
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
