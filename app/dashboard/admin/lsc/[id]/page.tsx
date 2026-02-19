//frontend\app\dashboard\admin\lsc\[id]\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

type District = { id: string; name: string };
type Block = { id: string; name: string };

const tabs = [
  'Basic & Location',
  'CLF & Operations',
  'Bank & Infrastructure',
  'Contacts & Geo',
];
type ServiceItem = {
  id: string;
  name: string;
};

export default function EditLSCPage() {
  const { id } = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [form, setForm] = useState<any>({
    lsc_name: '',
    date_of_establishment: '',
    district_id: '',
    block_id: '',
    village: '',
    gp: '',
    clf_code: '',
    clf_name: '',
    clf_formation_date: '',
    operator_name: '',
    staff_count: '',
    bank_name: '',
    account_no: '',
    ifsc: '',
    branch: '',
    has_building: false,
    has_furniture: false,
    contact_details: '',
    latitude: '',
    longitude: '',
    is_active: true,
  });

  /* Load master + LSC */
  useEffect(() => {
    const loadData = async () => {
      const { data: d } = await supabase.from('districts').select('id,name').order('name');
      setDistricts(d || []);

      const { data: services } = await supabase
      .from('service_items')
      .select('id, name')
      .order('name');

      const { data: lscServices } = await supabase
      .from('lsc_services')
      .select('service_item_id')
      .eq('lsc_id', id);

      const { data: lsc, error } = await supabase.from('lscs').select('*').eq('id', id).single();
      if (error || !lsc) {
        setError('LSC not found');
        setLoading(false);
        return;
      }

      setAllServices(services || []);
      setSelectedServices(
        (lscServices || []).map(s => s.service_item_id)
      );


      setForm({
        ...lsc,
        staff_count: lsc.staff_count?.toString() || '',
        latitude: lsc.latitude?.toString() || '',
        longitude: lsc.longitude?.toString() || '',
        date_of_establishment: lsc.date_of_establishment || '',
        clf_formation_date: lsc.clf_formation_date || '',
      });

      setLoading(false);
    };

    loadData();
  }, [id]);

  

  /* Load blocks */
  useEffect(() => {
    if (!form.district_id) return;
    supabase
      .from('blocks')
      .select('id,name')
      .eq('district_id', form.district_id)
      .order('name')
      .then(({ data }) => setBlocks(data || []));
  }, [form.district_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target;
    const value =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setForm({ ...form, [name]: value });
  };

  const handleCancel = () => {
    router.push('/dashboard/admin/lsc');
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    if (!form.lsc_name || !form.district_id || !form.block_id) {
      setError('LSC Name, District and Block are mandatory.');
      setSaving(false);
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one service.');
      setSaving(false);
      return;
    }

    if (!/^\d{10,}$/.test(form.contact_details || '')) {
      setError('Contact number must be at least 10 digits.');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/admin/update-lsc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lsc_id: id,
        lsc: {
          ...form,
          staff_count: form.staff_count ? Number(form.staff_count) : null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          date_of_establishment: form.date_of_establishment || null,
          clf_formation_date: form.clf_formation_date || null,
        },
        services: selectedServices,
      }),
    });
    
    setSaving(false);
    router.push('/dashboard/admin/lsc');
  };

  if (loading) {
    return <p className="text-slate-700">Loading LSC profile…</p>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white border rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4">
        Edit Livelihood Service Centre
      </h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === i
                ? 'border-b-2 border-blue-700 text-blue-700'
                : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-red-700 bg-red-50 border p-3 rounded">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">

        {activeTab === 0 && (
          <>
            <Input label="LSC Name *" name="lsc_name" value={form.lsc_name} onChange={handleChange} />
            <Input label="Date of Establishment" type="date" name="date_of_establishment" value={form.date_of_establishment} onChange={handleChange} />
            <Select label="District *" name="district_id" value={form.district_id} onChange={handleChange} options={districts} />
            <Select label="Block *" name="block_id" value={form.block_id} onChange={handleChange} options={blocks} />
            <Input label="Village" name="village" value={form.village || ''} onChange={handleChange} />
            <Input label="GP" name="gp" value={form.gp || ''} onChange={handleChange} />
            <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Services Offered *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded p-3 max-h-48 overflow-y-auto">
              {allServices.map(service => (
                <label key={service.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => {
                      setSelectedServices(prev =>
                        prev.includes(service.id)
                          ? prev.filter(id => id !== service.id)
                          : [...prev, service.id]
                      );
                    }}
                  />
                  {service.name}
                </label>
              ))}
            </div>
          </div>
          </>
        )}

        {activeTab === 1 && (
          <>
            <Input label="CLF Code" name="clf_code" value={form.clf_code || ''} onChange={handleChange} />
            <Input label="CLF Name" name="clf_name" value={form.clf_name || ''} onChange={handleChange} />
            <Input label="CLF Formation Date" type="date" name="clf_formation_date" value={form.clf_formation_date || ''} onChange={handleChange} />
            <Input label="Operator Name" name="operator_name" value={form.operator_name || ''} onChange={handleChange} />
            <Input label="Staff Count" type="number" name="staff_count" value={form.staff_count} onChange={handleChange} />
          </>
        )}

        {activeTab === 2 && (
          <>
            <Input label="Bank Name" name="bank_name" value={form.bank_name || ''} onChange={handleChange} />
            <Input label="Account No" name="account_no" value={form.account_no || ''} onChange={handleChange} />
            <Input label="IFSC" name="ifsc" value={form.ifsc || ''} onChange={handleChange} />
            <Input label="Branch" name="branch" value={form.branch || ''} onChange={handleChange} />
            <Checkbox label="Has Building" name="has_building" checked={form.has_building} onChange={handleChange} />
            <Checkbox label="Has Furniture" name="has_furniture" checked={form.has_furniture} onChange={handleChange} />
          </>
        )}

        {activeTab === 3 && (
          <>
            <Input label="Contact Number *" name="contact_details" value={form.contact_details || ''} onChange={handleChange} />
            <Input label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} />
            <Input label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} />
            <Checkbox label="Active" name="is_active" checked={form.is_active} onChange={handleChange} />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            className="border px-4 py-2 rounded"
          >
            Back
          </button>

          <button
            onClick={handleCancel}
            className="border px-4 py-2 rounded text-red-600"
          >
            Cancel
          </button>
        </div>

        {activeTab < tabs.length - 1 ? (
          <button
            onClick={() => setActiveTab(activeTab + 1)}
            className="bg-blue-700 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-700 text-white px-6 py-2 rounded"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- UI Helpers ---- */
function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...props} className="w-full border rounded px-3 py-2" />
    </div>
  );
}
function Select({ label, options, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select {...props} className="w-full border rounded px-3 py-2">
        <option value="">Select</option>
        {options.map((o: any) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}
function Checkbox({ label, ...props }: any) {
  return (
    <label className="flex items-center gap-2 mt-2">
      <input type="checkbox" {...props} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
