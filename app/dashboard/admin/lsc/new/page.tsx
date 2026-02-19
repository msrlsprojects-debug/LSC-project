//frontend\app\dashboard\admin\lsc\new\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ---------- TYPES ---------- */
type District = { id: string; name: string };
type Block = { id: string; name: string };

const tabs = [
  'Basic & Location',
  'CLF & Operations',
  'Bank & Infrastructure',
  'Contacts & Geo',
  'Login Credentials',
];

type ServiceItem = {
  id: string;
  name: string;
};

/* ---------- PAGE ---------- */
export default function AddLSCPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);  

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);


  /* Auth */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* LSC FORM */
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
    address: '',
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

  /* ---------- LOAD MASTER DATA ---------- */
  useEffect(() => {
    supabase.from('districts')
      .select('id,name')
      .order('name')
      .then(({ data }) => setDistricts(data || []));
  }, []);

  useEffect(() => {
    if (!form.district_id) return;
    supabase.from('blocks')
      .select('id,name')
      .eq('district_id', form.district_id)
      .order('name')
      .then(({ data }) => setBlocks(data || []));
  }, [form.district_id]);

  useEffect(() => {
    supabase
      .from('service_items')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setServices(data || []);
      });
  }, []);


  /* ---------- HANDLERS ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    setForm({
      ...form,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const validateCurrentTab = () => {
    if (activeTab === 0) {
      if (!form.lsc_name || !form.district_id || !form.block_id) {
        return 'LSC Name, District and Block are mandatory.';
      }

      if (selectedServices.length === 0) {
        return 'Select at least one service.';
      }
    }
    if (activeTab === 3) {
      if (!/^\d{10,}$/.test(form.contact_details || '')) {
        return 'Contact number must be at least 10 digits.';
      }
    }
    if (activeTab === 4) {
      if (!email || !password || password.length < 6) {
        return 'Valid email and password (min 6 chars) required.';
      }
    }
    return null;
  };

  const nextTab = () => {
    const err = validateCurrentTab();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setActiveTab(activeTab + 1);
  };

  const prevTab = () => {
    setError(null);
    setActiveTab(activeTab - 1);
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    const res = await fetch('/api/admin/create-lsc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        services: selectedServices,
        lsc: {
          ...form,
          staff_count: form.staff_count ? Number(form.staff_count) : null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          date_of_establishment: form.date_of_establishment || null,
          clf_formation_date: form.clf_formation_date || null,
        },
      }),
    });

    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(result.error || 'Failed to create LSC');
      return;
    }

    setSuccess('LSC created successfully.');
    setTimeout(() => router.push('/dashboard/admin/lsc'), 1200);
  };

  /* ---------- UI ---------- */
  return (
    <div className="max-w-5xl mx-auto bg-white border rounded-lg p-6 space-y-4">

      <h1 className="text-2xl font-bold">
        Add Livelihood Service Centre
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap border-b">
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

      {error && <p className="bg-red-50 text-red-700 p-3 rounded">{error}</p>}
      {success && <p className="bg-green-50 text-green-700 p-3 rounded">{success}</p>}

      {/* TAB CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">

        {/* BASIC */}
        {activeTab === 0 && (
          <>
            <Input label="LSC Name *" name="lsc_name" value={form.lsc_name} onChange={handleChange} />
            <Input label="Date of Establishment" type="date" name="date_of_establishment" value={form.date_of_establishment} onChange={handleChange} />
            <Select label="District *" name="district_id" value={form.district_id} onChange={handleChange} options={districts} />
            <Select label="Block *" name="block_id" value={form.block_id} onChange={handleChange} options={blocks} />
            <Input label="Village" name="village" value={form.village} onChange={handleChange} />
            <Input label="GP" name="gp" value={form.gp} onChange={handleChange} />
            {/* SERVICES (MULTI SELECT) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Services Offered *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded p-3 max-h-48 overflow-y-auto">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.id)}
                      onChange={(e) => {
                        setSelectedServices((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id)
                        );
                      }}
                    />
                    {s.name}
                  </label>
                ))}

                {services.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No services available.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* CLF */}
        {activeTab === 1 && (
          <>
            <Input label="CLF Code" name="clf_code" value={form.clf_code} onChange={handleChange} />
            <Input label="CLF Name" name="clf_name" value={form.clf_name} onChange={handleChange} />
            <Input label="CLF Formation Date" type="date" name="clf_formation_date" value={form.clf_formation_date} onChange={handleChange} />
            <Input label="Operator Name" name="operator_name" value={form.operator_name} onChange={handleChange} />
            <Input label="Staff Count" type="number" name="staff_count" value={form.staff_count} onChange={handleChange} />
          </>
        )}

        {/* BANK */}
        {activeTab === 2 && (
          <>
            <Input label="Bank Name" name="bank_name" value={form.bank_name} onChange={handleChange} />
            <Input label="Account No" name="account_no" value={form.account_no} onChange={handleChange} />
            <Input label="IFSC" name="ifsc" value={form.ifsc} onChange={handleChange} />
            <Input label="Branch" name="branch" value={form.branch} onChange={handleChange} />
            <Checkbox label="Has Building" name="has_building" checked={form.has_building} onChange={handleChange} />
            <Checkbox label="Has Furniture" name="has_furniture" checked={form.has_furniture} onChange={handleChange} />
          </>
        )}

        {/* CONTACT */}
        {activeTab === 3 && (
          <>
            <Input label="Contact Number *" name="contact_details" value={form.contact_details} onChange={handleChange} />
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <Input label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} />
            <Input label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} />
            <Checkbox label="Active" name="is_active" checked={form.is_active} onChange={handleChange} />
          </>
        )}

        {/* CREDENTIALS */}
        {activeTab === 4 && (
          <>
            <Input label="Login Email *" value={email} onChange={(e:any)=>setEmail(e.target.value)} />
            <Input label="Password *" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} />
          </>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between mt-6">
        <button
          onClick={activeTab === 0 ? () => router.back() : prevTab}
          className="border px-4 py-2 rounded"
        >
          {activeTab === 0 ? 'Cancel' : 'Back'}
        </button>

        {activeTab < tabs.length - 1 ? (
          <button onClick={nextTab} className="bg-blue-700 text-white px-4 py-2 rounded">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving} className="bg-blue-700 text-white px-6 py-2 rounded">
            {saving ? 'Creating…' : 'Create LSC'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- UI HELPERS ---------- */
function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...props} className="w-full border rounded px-3 py-2" />
    </div>
  );
}
type SelectOption = {
  id: string;
  name: string;
};

type SelectProps = {
  label: string;
  options: SelectOption[];
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

function Select({
  label,
  options,
  name,
  value,
  onChange,
}: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select</option>

        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
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
