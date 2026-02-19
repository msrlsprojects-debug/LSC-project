//frontend\app\dashboard\lsc\services\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ---------- TYPES ---------- */

type ServiceItem = {
  id: string;
  name: string;
};

type ServiceTxn = {
  id: string;
  service_start_date: string;
  service_end_date: string | null;
  beneficiary_name: string;
  beneficiary_address: string | null;
  amount_collected: number;
  service_name: string;
};

export default function LSCServiceHistory() {
    const router = useRouter();
  const [lscId, setLscId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [transactions, setTransactions] = useState<ServiceTxn[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    serviceId: '',
  });

  /* ---------- LOAD INITIAL DATA ---------- */
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('lsc_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.lsc_id) return;

      setLscId(profile.lsc_id);

      const { data: lscServiceRows } = await supabase
        .from('lsc_services')
        .select('service_item_id')
        .eq('lsc_id', profile.lsc_id)
        .eq('is_available', true);

      const serviceIds =
        lscServiceRows?.map((r) => r.service_item_id) || [];

      if (serviceIds.length > 0) {
        const { data: serviceItems } = await supabase
          .from('service_items')
          .select('id, name')
          .in('id', serviceIds);

        setServices(serviceItems || []);
      }

      await fetchTransactions(profile.lsc_id, filters);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- FETCH TRANSACTIONS ---------- */
  const fetchTransactions = async (
    lscId: string,
    f: typeof filters
  ) => {
    let query = supabase
      .from('service_transactions')
      .select(`
        id,
        service_item_id,
        service_start_date,
        service_end_date,
        beneficiary_name,
        beneficiary_address,
        amount_collected
      `)
      .eq('lsc_id', lscId)
      .order('service_start_date', { ascending: false });

    if (f.fromDate) query = query.gte('service_start_date', f.fromDate);
    if (f.toDate) query = query.lte('service_start_date', f.toDate);
    if (f.serviceId) query = query.eq('service_item_id', f.serviceId);

    const { data: txnData } = await query;

    if (!txnData || txnData.length === 0) {
      setTransactions([]);
      return;
    }

    const serviceIds = Array.from(
      new Set(txnData.map((t) => t.service_item_id))
    );

    const { data: serviceItems } = await supabase
      .from('service_items')
      .select('id, name')
      .in('id', serviceIds);

    const serviceMap = new Map(
      (serviceItems || []).map((s) => [s.id, s.name])
    );

    setTransactions(
      txnData.map((t) => ({
        id: t.id,
        service_start_date: t.service_start_date,
        service_end_date: t.service_end_date,
        beneficiary_name: t.beneficiary_name,
        beneficiary_address: t.beneficiary_address,
        amount_collected: t.amount_collected,
        service_name:
          serviceMap.get(t.service_item_id) || 'Unknown',
      }))
    );
  };

  /* ---------- FILTER HANDLERS ---------- */
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    if (lscId) fetchTransactions(lscId, filters);
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Loading service records…</p>;
  }

  
    /* ---------- LOGOUT ---------- */
    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
    };
  

  return (
    <div className="min-h-screen bg-gray-100">
            {/* NAV */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between">
          <div>
            <p className="text-xs opacity-90">MSRLS – LSC MIS</p>
          </div>
          <button onClick={handleLogout} className="text-sm opacity-90">
            Logout
          </button>
        </div>
      </header>
    
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">

      {/* HEADER */}
      <section className="bg-white rounded-xl p-6 shadow-sm border-t-4 border-blue-600 text-center bg-gradient-to-r from-blue-50 to-white">
        <h1 className="text-xl md:text-2xl font-semibold text-blue-800">
           Service History
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Livelihood Service Centre – Transaction Records
        </p>
      </section>

      {/* FILTERS */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1 ">
              From Date
            </label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full border rounded px-3 py-2 text-gray-600"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              To Date
            </label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full border rounded px-3 py-2 text-gray-600"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Service
            </label>
            <select
              name="serviceId"
              value={filters.serviceId}
              onChange={handleFilterChange}
              className="w-full border rounded px-3 py-2 text-gray-600"
            >
              <option value="">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </section>

      {/* TRANSACTIONS */}
      <section className="bg-white rounded-xl shadow-sm">

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Beneficiary</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(t.service_start_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.service_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.beneficiary_name}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-600">
                    ₹{t.amount_collected}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No service records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y">
          {transactions.map((t) => (
            <div key={t.id} className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{new Date(t.service_start_date).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium">{t.service_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Beneficiary</span>
                <span>{t.beneficiary_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">₹{t.amount_collected}</span>
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No service records found
            </div>
          )}
        </div>

      </section>
    </main>
    </div>
  );
}
