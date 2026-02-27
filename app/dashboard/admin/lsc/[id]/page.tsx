'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

type District = { id: string; name: string };
type Block = { id: string; name: string };
type MasterItem = { id: string; name: string };

const tabs = [
  'Basic Profile',
  'Services',
  'Bank',
  'Contacts & Geo',
];

export default function ApprovalLSCPage() {
  const { id } = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allServices, setAllServices] = useState<MasterItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<MasterItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [remarks, setRemarks] = useState('');

  const [form, setForm] = useState<any>({
    lsc_name: '', date_of_establishment: '', district_id: '', block_id: '',
    village: '', gp: '', clf_code: '', clf_name: '', clf_formation_date: '',
    operator_name: '', staff_count: '', bank_name: '', account_no: '',
    ifsc: '', branch: '', has_building: false, has_furniture: false,
    contact_details: '', latitude: '', longitude: '', is_active: true,
    block_status: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [distRes, servRes, catRes, lscServRes, lscCatRes, lscRes] = await Promise.all([
        supabase.from('districts').select('id,name').order('name'),
        supabase.from('service_items').select('id, name').order('name'),
        supabase.from('service_categories').select('id, name').order('name'),
        supabase.from('lsc_services').select('service_item_id').eq('lsc_id', id),
        supabase.from('lsc_services_categories').select('service_categories_item_id').eq('lsc_id', id),
        supabase.from('lscs').select('*').eq('id', id).single()
      ]);

      if (lscRes.error) throw new Error('LSC record not found');

      const lscData = lscRes.data;

      setDistricts(distRes.data || []);
      setAllServices(servRes.data || []);
      setAllCategories(catRes.data || []);
      setSelectedServices((lscServRes.data || []).map(s => s.service_item_id));
      setSelectedCategories((lscCatRes.data || []).map(c => c.service_categories_item_id));

      // Load existing remarks from DB into the text area
      setRemarks(lscData.state_remarks || '');

      setForm({
        ...lscData,
        staff_count: lscData.staff_count?.toString() || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!form.district_id) return;
    supabase.from('blocks').select('id,name').eq('district_id', form.district_id).order('name')
      .then(({ data }) => setBlocks(data || []));
  }, [form.district_id]);


  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !remarks.trim()) {
      alert("Please provide remarks for rejection.");
      return;
    }

    if (!confirm(`Are you sure you want to set status to ${status}?`)) return;

    setProcessing(true);
    try {
      const { error } = await supabase.from('lscs').update({
        state_status: status,
        state_remarks: remarks,
        is_active: status === 'APPROVED'
      }).eq('id', id);

      if (error) throw error;
      router.push('/dashboard/admin/lsc');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-sm text-slate-500">Loading LSC profile details...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white border rounded p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-slate-800">Livelihood Service Centre - Approval Details</h1>
      </div>

      <div className="flex border-b mb-6 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm transition-colors ${activeTab === i ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 0 && (
          <>
            <Input label="CLF Code" value={form.clf_code} readOnly />
            <Input label="CLF Name" value={form.clf_name} readOnly />
            <Input label="CLF Formation Date" value={form.clf_formation_date} readOnly />
            <Input label="Operator Name" value={form.operator_name} readOnly />
             <Input label="Contact Number" value={form.contact_details} readOnly />
            <Input label="Staff Count" value={form.staff_count} readOnly />
            <Input label="LSC Name" value={form.lsc_name} readOnly />
            <Input label="Date of Establishment" value={form.date_of_establishment} readOnly />
            <Select label="District" value={form.district_id} options={districts} disabled />
            <Select label="Block" value={form.block_id} options={blocks} disabled />
            <Input label="Village" value={form.village || ''} readOnly />
            <Input label="Gram Panchayat" value={form.gp || ''} readOnly />
            <Checkbox label="Centre is Active" checked={form.is_active} disabled />
          </>
        )}

        {activeTab === 1 && (
          <>
            <div className="md:col-span-2 mt-4">
              <label className="block text-sm mb-2 text-slate-600">Categories Selected</label>
              <div className="grid grid-cols-3 gap-2 border rounded p-3 bg-slate-50">
                {allCategories.map(cat => (
                  <div key={cat.id} className={`text-sm ${selectedCategories.includes(cat.id) ? 'text-slate-900' : 'text-slate-400'}`}>
                    {selectedCategories.includes(cat.id) ? '● ' : '○ '}{cat.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 mt-2">
              <label className="block text-sm mb-2 text-slate-600">Services Offered</label>
              <div className="grid grid-cols-3 gap-2 border rounded p-3 bg-slate-50">
                {allServices.map(s => (
                  <div key={s.id} className={`text-sm ${selectedServices.includes(s.id) ? 'text-slate-900' : 'text-slate-400'}`}>
                    {selectedServices.includes(s.id) ? '● ' : '○ '}{s.name}
                  </div>
                ))}
              </div>
            </div>

            <Checkbox label="Functional Building Available" checked={form.has_building} disabled />
            <Checkbox label="Essential Furniture Available" checked={form.has_furniture} disabled />
          </>
        )}

        {activeTab === 2 && (
          <>
            <Input label="Bank Name" value={form.bank_name} readOnly />
            <Input label="Account Number" value={form.account_no} readOnly />
            <Input label="IFSC Code" value={form.ifsc} readOnly />
            <Input label="Branch Name" value={form.branch} readOnly />
            
          </>
        )}

        {activeTab === 3 && (
          <>
            <Input label="Latitude" value={form.latitude} readOnly />
            <Input label="Longitude" value={form.longitude} readOnly />
          </>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100">
        <label className="block text-sm mb-2 text-slate-700 font-normal">Officer Remarks</label>
        <textarea
          className="w-full border rounded p-3 text-sm outline-none focus:border-blue-400 bg-white min-h-[100px]"
          placeholder="Please enter observations or reasons for approval/rejection..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => router.back()}
          className="border border-slate-300 px-6 py-2 rounded text-sm text-slate-600 hover:bg-slate-50"
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('REJECTED')}
            disabled={processing}
            className="border border-red-500 text-red-500 px-6 py-2 rounded text-sm hover:bg-red-50 disabled:opacity-50"
          >
            Reject Application
          </button>
          <button
            onClick={() => handleAction('APPROVED')}
            disabled={processing}
            className="bg-green-700 text-white px-8 py-2 rounded text-sm hover:bg-green-800 shadow-sm disabled:opacity-50"
          >
            {processing ? 'Saving...' : 'APPROVE'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Common UI Components */

function Input({ label, ...props }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</label>
      <input {...props} className="w-full border rounded px-3 py-2 text-sm bg-slate-50 text-slate-700 outline-none cursor-default" />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</label>
      <select {...props} className="w-full border rounded px-3 py-2 text-sm bg-slate-50 text-slate-700 outline-none appearance-none cursor-not-allowed">
        <option value="">--</option>
        {options.map((o: any) => (<option key={o.id} value={o.id}>{o.name}</option>))}
      </select>
    </div>
  );
}

function Checkbox({ label, ...props }: any) {
  return (
    <label className="flex items-center gap-3 mt-4 text-sm text-slate-600 cursor-not-allowed">
      <input type="checkbox" {...props} className="w-4 h-4 rounded border-slate-300" />
      {label}
    </label>
  );
}