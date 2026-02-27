'use client';

import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ---------- TYPES & INTERFACES ---------- */
type MasterItem = { id: string; name: string };

interface LSCFormState {
  lsc_name: string;
  date_of_establishment: string;
  district_id: string;
  block_id: string;
  village: string;
  gp: string;
  clf_code: string;
  clf_name: string;
  clf_formation_date: string;
  operator_name: string;
  address: string;
  staff_count: string | number;
  bank_name: string;
  account_no: string;
  ifsc: string;
  branch: string;
  has_building: boolean;
  has_furniture: boolean;
  contact_details: string;
  latitude: string | number;
  longitude: string | number;
  is_active: boolean;
  anchor_id: string;
}

const tabs = ['Basic Details', 'Services', 'Bank Details', 'Geo location'];

/* ---------- PAGE ---------- */
export default function AddLSCPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const [districts, setDistricts] = useState<MasterItem[]>([]);
  const [blocks, setBlocks] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [services, setServices] = useState<MasterItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingJurisdiction, setLoadingJurisdiction] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<LSCFormState>({
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
    anchor_id: '',
  });

  /* ---------- DATA LOADING ---------- */
  const loadInitialData = useCallback(async () => {
    try {
      setLoadingJurisdiction(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const [profileRes, catRes] = await Promise.all([
        supabase.from('profiles').select('district_id, block_id').eq('user_id', session.user.id).single(),
        supabase.from('service_categories').select('id,name').order('name')
      ]);

      setCategories(catRes.data || []);

      if (profileRes.data) {
        const { district_id, block_id } = profileRes.data;
        const [distName, blockName] = await Promise.all([
          supabase.from('districts').select('id, name').eq('id', district_id).single(),
          supabase.from('blocks').select('id, name').eq('id', block_id).single()
        ]);

        setDistricts(distName.data ? [distName.data] : []);
        setBlocks(blockName.data ? [blockName.data] : []);

        setForm(prev => ({
          ...prev,
          district_id: district_id || '',
          block_id: block_id || '',
          anchor_id: session.user.id
        }));
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
    } finally {
      setLoadingJurisdiction(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setServices([]);
      setSelectedServices([]);
      return;
    }

    supabase.from('service_items')
      .select('id, name')
      .in('category_id', selectedCategories)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setServices(data || []);
        const validIds = (data || []).map(d => d.id);
        setSelectedServices(prev => prev.filter(id => validIds.includes(id)));
      });
  }, [selectedCategories]);

  /* ---------- HANDLERS ---------- */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setForm(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateCurrentTab = () => {
    if (activeTab === 0) {
      if (!form.lsc_name || !form.district_id || !form.block_id || !form.clf_name || !form.clf_code || !form.clf_formation_date) {
        return 'LSC Name, District, Block, CLF Name, Code and Formation Date are mandatory.';
      }
      if (!/^\d{10,}$/.test(form.contact_details || '')) {
        return 'Contact number must be at least 10 digits.';
      }
    }
    if (activeTab === 1) {
      if (selectedCategories.length === 0) return 'Select at least one Category.';
      if (selectedServices.length === 0) return 'Select at least one Service.';
    }
    if (activeTab === 2) {
      if (!form.bank_name || !form.ifsc || !form.account_no) {
        return 'Bank Name, IFSC and Account Number are mandatory.';
      }
    }
    return null;
  };

  const nextTab = () => {
    const err = validateCurrentTab();
    if (err) { setError(err); return; }
    setError(null);
    setActiveTab(prev => prev + 1);
  };

  const prevTab = () => {
    setError(null);
    setActiveTab(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expired. Please login again.");

      const res = await fetch('/api/anchor/create-lsc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categories: selectedCategories,
          services: selectedServices,
          lsc: {
            ...form,
            staff_count: form.staff_count ? Number(form.staff_count) : null,
            latitude: form.latitude ? Number(form.latitude) : null,
            longitude: form.longitude ? Number(form.longitude) : null,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create LSC');

      setSuccess('LSC created successfully.');
      setTimeout(() => router.push('/dashboard/anchor'), 1200);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingJurisdiction) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white border rounded-lg p-6 space-y-4 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-800">Add Livelihood Service Centre</h1>

      <div className="flex flex-wrap border-b">
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            disabled={saving}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === i ? 'border-b-2 border-blue-700 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="bg-red-50 text-red-700 p-3 rounded text-sm border border-red-100">{error}</p>}
      {success && <p className="bg-green-50 text-green-700 p-3 rounded text-sm border border-green-100">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
        {activeTab === 0 && (
          <>
            <Input label="CLF Code *" name="clf_code" value={form.clf_code} onChange={handleChange} />
            <Input label="CLF Name *" name="clf_name" value={form.clf_name} onChange={handleChange} />
            <Input label="CLF Formation Date *" type="date" name="clf_formation_date" value={form.clf_formation_date} onChange={handleChange} />
            <Input label="Operator Name" name="operator_name" value={form.operator_name} onChange={handleChange} />
            <Input label="Staff Count" type="number" name="staff_count" value={form.staff_count} onChange={handleChange} />
            <Input label="LSC Name *" name="lsc_name" value={form.lsc_name} onChange={handleChange} />
            <Input label="Date of Establishment *" type="date" name="date_of_establishment" value={form.date_of_establishment} onChange={handleChange} />
            <Select label="District" name="district_id" value={form.district_id} options={districts} disabled onChange={handleChange} />
            <Select label="Block" name="block_id" value={form.block_id} options={blocks} disabled onChange={handleChange} />
            <Input label="Village" name="village" value={form.village} onChange={handleChange} />
            <Input label="GP" name="gp" value={form.gp} onChange={handleChange} />
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <Input label="Contact Number *" name="contact_details" value={form.contact_details} onChange={handleChange} />
            <Checkbox label="Active Status" name="is_active" checked={form.is_active} onChange={handleChange} />
          </>
        )}

        {activeTab === 1 && (
          <>
            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Categories *</label>
              <div className="flex flex-wrap gap-2 border rounded p-3 bg-slate-50">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border ${selectedCategories.includes(cat.id) ? 'bg-blue-700 text-white' : 'bg-white text-slate-600'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <label className="block text-sm font-semibold text-slate-700">Services *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded p-3 max-h-48 overflow-y-auto">
                {services.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm p-1">
                    <input type="checkbox" checked={selectedServices.includes(s.id)} onChange={(e) => setSelectedServices(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))} />
                    {s.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-4">
                <Checkbox label="Has Building" name="has_building" checked={form.has_building} onChange={handleChange} />
                <Checkbox label="Has Furniture" name="has_furniture" checked={form.has_furniture} onChange={handleChange} />
              </div>
            </div>
          </>
        )}

        {activeTab === 2 && (
          <>
            <Input label="Bank Name" name="bank_name" value={form.bank_name} onChange={handleChange} />
            <Input label="Account No" name="account_no" value={form.account_no} onChange={handleChange} />
            <Input label="IFSC" name="ifsc" value={form.ifsc} onChange={handleChange} />
            <Input label="Branch" name="branch" value={form.branch} onChange={handleChange} />
          </>
        )}

        {activeTab === 3 && (
          <>
            <Input label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} />
            <Input label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} />
          </>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t">
        <button type="button" disabled={saving} onClick={activeTab === 0 ? () => router.back() : prevTab} className="border px-6 py-2 rounded text-slate-600">
          {activeTab === 0 ? 'Cancel' : 'Back'}
        </button>
        {activeTab < tabs.length - 1 ? (
          <button type="button" onClick={nextTab} className="bg-blue-700 text-white px-8 py-2 rounded">Next</button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={saving} className="bg-green-700 text-white px-10 py-2 rounded">
            {saving ? 'Creating…' : 'Create LSC'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- TYPED UI HELPERS ---------- */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Input({ label, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-500 uppercase">{label}</label>
      <input {...props} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-50" />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: MasterItem[];
}

function Select({ label, options, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-500 uppercase">{label}</label>
      <select {...props} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none disabled:bg-slate-50">
        <option value="">Select Option</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" {...props} className="w-4 h-4 text-blue-600 rounded" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}