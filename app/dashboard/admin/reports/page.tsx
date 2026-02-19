'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Option = {
  id: string;
  name: string;
};

type ReportRow = {
  service_start_date: string;
  beneficiary_name: string;
  amount_collected: number;
  lscs: { lsc_name: string }[];
  service_items: { name: string }[];
};

export default function AdminReportsPage() {
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [lscs, setLscs] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    districtId: '',
    blockId: '',
    lscId: '',
    serviceId: '',
  });

  /* Load master filters */
  useEffect(() => {
    const loadMasters = async () => {
      const { data: d } = await supabase.from('districts').select('id, name');
      const { data: s } = await supabase.from('service_items').select('id, name');

      setDistricts(d || []);
      setServices(s || []);
    };

    loadMasters();
  }, []);

  /* Load blocks when district changes */
  useEffect(() => {
    if (!filters.districtId) {
      setBlocks([]);
      return;
    }

    supabase
      .from('blocks')
      .select('id, name')
      .eq('district_id', filters.districtId)
      .then(({ data }) => setBlocks(data || []));
  }, [filters.districtId]);

  /* Load LSCs when block changes */
  useEffect(() => {
    if (!filters.blockId) {
      setLscs([]);
      return;
    }

    supabase
      .from('lscs')
      .select('id, lsc_name')
      .eq('block_id', filters.blockId)
      .then(({ data }) =>
        setLscs(
          (data || []).map((l) => ({
            id: l.id,
            name: l.lsc_name,
          }))
        )
      );
  }, [filters.blockId]);

  /* Apply report filters */
  const generateReport = async () => {
    setLoading(true);

    let query = supabase
      .from('service_transactions')
      .select(`
        service_start_date,
        beneficiary_name,
        amount_collected,
        lscs ( lsc_name ),
        service_items ( name )
      `)
      .order('service_start_date', { ascending: false });

    if (filters.fromDate)
      query = query.gte('service_start_date', filters.fromDate);
    if (filters.toDate)
      query = query.lte('service_start_date', filters.toDate);
    if (filters.lscId) query = query.eq('lsc_id', filters.lscId);
    if (filters.serviceId)
      query = query.eq('service_item_id', filters.serviceId);

    const { data } = await query;
    setRows(data || []);
    setLoading(false);
  };

  /* Export CSV */
  const exportCSV = () => {
    const header = [
      'Date',
      'LSC',
      'Service',
      'Beneficiary',
      'Amount',
    ];

    const csv = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.service_start_date,
          r.lscs?.[0]?.lsc_name,
          r.service_items?.[0]?.name,
          r.beneficiary_name,
          r.amount_collected,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'service_report.csv';
    a.click();
  };

  const totalCollection = rows.reduce(
    (sum, r) => sum + r.amount_collected,
    0
  );

  const beneficiaries = new Set(
    rows.map((r) => r.beneficiary_name)
  ).size;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold">Reports & Analytics</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) =>
            setFilters({ ...filters, fromDate: e.target.value })
          }
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) =>
            setFilters({ ...filters, toDate: e.target.value })
          }
          className="border rounded px-2 py-1"
        />

        <select
          value={filters.districtId}
          onChange={(e) =>
            setFilters({
              ...filters,
              districtId: e.target.value,
              blockId: '',
              lscId: '',
            })
          }
          className="border rounded px-2 py-1"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={filters.blockId}
          onChange={(e) =>
            setFilters({ ...filters, blockId: e.target.value })
          }
          className="border rounded px-2 py-1"
        >
          <option value="">All Blocks</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={filters.lscId}
          onChange={(e) =>
            setFilters({ ...filters, lscId: e.target.value })
          }
          className="border rounded px-2 py-1"
        >
          <option value="">All LSCs</option>
          {lscs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={filters.serviceId}
          onChange={(e) =>
            setFilters({ ...filters, serviceId: e.target.value })
          }
          className="border rounded px-2 py-1"
        >
          <option value="">All Services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={generateReport}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Generate Report
        </button>

        {rows.length > 0 && (
          <button
            onClick={exportCSV}
            className="border px-4 py-2 rounded"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Summary */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Summary label="Transactions" value={rows.length} />
          <Summary label="Beneficiaries" value={beneficiaries} />
          <Summary
            label="Total Collection (₹)"
            value={totalCollection}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">LSC</th>
              <th className="px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-left">Beneficiary</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">
                  {r.service_start_date}
                </td>
                <td className="px-3 py-2">
                  {r.lscs?.[0]?.lsc_name}
                </td>
                <td className="px-3 py-2">
                  {r.service_items?.[0]?.name}
                </td>
                <td className="px-3 py-2">
                  {r.beneficiary_name}
                </td>
                <td className="px-3 py-2 text-right">
                  ₹{r.amount_collected}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No data. Apply filters and generate report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
