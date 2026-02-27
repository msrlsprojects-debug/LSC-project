'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

type MasterItem = { id: string; name: string };

const tabs = [
  'Basic Profile',
  'Services',
  'Bank',
  'Contacts & Geo',
];

export default function EditLSCPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [districts, setDistricts] = useState<MasterItem[]>([]);
  const [blocks, setBlocks] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [allServices, setAllServices] = useState<MasterItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<MasterItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [form, setForm] = useState<any>({
    lsc_name: '', date_of_establishment: '', district_id: '', block_id: '',
    village: '', gp: '', clf_code: '', clf_name: '', clf_formation_date: '',
    operator_name: '', staff_count: '', bank_name: '', account_no: '',
    ifsc: '', branch: '', has_building: false, has_furniture: false,
    contact_details: '', latitude: '', longitude: '', is_active: true,
  });

  const loadData = useCallback(async () => {
    if (!id) return;
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

      if (lscRes.data) {
        setForm({ ...lscRes.data, staff_count: lscRes.data.staff_count?.toString() || '' });
        setDistricts(distRes.data || []);
        setAllServices(servRes.data || []);
        setAllCategories(catRes.data || []);
        setSelectedServices((lscServRes.data || []).map(s => s.service_item_id));
        setSelectedCategories((lscCatRes.data || []).map(c => c.service_categories_item_id));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle Dynamic Block Loading
  useEffect(() => {
    if (!form.district_id) return;
    supabase.from('blocks').select('id,name').eq('district_id', form.district_id).order('name')
      .then(({ data }) => setBlocks(data || []));
  }, [form.district_id]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {


    setProcessing(true);
    try {

      const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("You must be logged in to save changes.");
      return;
    }

      // 1. Update Main LSC Record
      const { error: lscError } = await supabase.from('lscs').update({
        ...form,
        // staff_count: parseInt(form.staff_count) || 0,
        updatedDateTime: new Date(),
        updated_by: user.id
      }).eq('id', id);

      if (lscError) throw lscError;

 console.log(id);
       console.log(selectedCategories);
      console.log(selectedServices);


       // 3. Sync Categories (Delete then Insert)
      await supabase.from('lsc_services_categories').delete().eq('lsc_id', id);
      if (selectedCategories.length > 0) {
        await supabase.from('lsc_services_categories').insert(
          selectedCategories.map(cid => ({ lsc_id: id, service_categories_item_id: cid }))
        );
      }

      // 2. Sync Services (Delete then Insert)
      await supabase.from('lsc_services').delete().eq('lsc_id', id);
      if (selectedServices.length > 0) {
        await supabase.from('lsc_services').insert(
          selectedServices.map(sid => ({ lsc_id: id, service_item_id: sid }))
        );
      }


      //  console.log(selectedCategories);
      // 3. Sync Categories (Delete then Insert)
      // await supabase.from('lsc_services_categories').delete().eq('lsc_id', id);
      // if (selectedCategories.length > 0) {
      //   await supabase.from('lsc_services_categories').insert(
      //     selectedCategories.map(cid => ({ lsc_id: id, service_categories_item_id: cid }))
      //   );
      // }

      alert("Changes saved successfully!");
      router.refresh();
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-sm text-slate-500">Loading LSC profile details...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white border rounded p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-slate-800 font-medium">Livelihood Service Centre</h1>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm border rounded text-slate-600 hover:bg-slate-50">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={processing}
            className="bg-slate-800 text-white px-6 py-2 rounded text-sm hover:bg-black transition-all disabled:opacity-50"
          >
            {processing ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      <div className="flex border-b mb-6 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm transition-colors ${activeTab === i ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 0 && (
          <>
            <Input label="CLF Code" name="clf_code" value={form.clf_code} onChange={handleChange} />
            <Input label="CLF Name" name="clf_name" value={form.clf_name} onChange={handleChange} />
            <Input label="CLF Formation Date" name="clf_formation_date" type="date" value={form.clf_formation_date} onChange={handleChange} />
            <Input label="Operator Name" name="operator_name" value={form.operator_name} onChange={handleChange} />
            <Input label="Contact Number" name="contact_details" value={form.contact_details} onChange={handleChange} />
            <Input label="Staff Count" name="staff_count" type="number" value={form.staff_count} onChange={handleChange} />
            <Input label="LSC Name" name="lsc_name" value={form.lsc_name} onChange={handleChange} />
            <Input label="Date of Establishment" name="date_of_establishment" type="date" value={form.date_of_establishment} onChange={handleChange} />
            <Select label="District" name="district_id" value={form.district_id} options={districts} onChange={handleChange} />
            <Select label="Block" name="block_id" value={form.block_id} options={blocks} onChange={handleChange} />
            <Input label="Village" name="village" value={form.village || ''} onChange={handleChange} />
            <Input label="Gram Panchayat" name="gp" value={form.gp || ''} onChange={handleChange} />
            <Checkbox label="Centre is Active" name="is_active" checked={form.is_active} onChange={handleChange} />
          </>
        )}

        {activeTab === 1 && (
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-3">Categories Selection</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id]);
                    }}
                    className={`text-left p-3 rounded border text-xs transition-all ${selectedCategories.includes(cat.id) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    {selectedCategories.includes(cat.id) ? '✓ ' : '+ '}{cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-wide mb-3">Services Offered</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedServices(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]);
                    }}
                    className={`text-left p-3 rounded border text-xs transition-all ${selectedServices.includes(s.id) ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    {selectedServices.includes(s.id) ? '✓ ' : '+ '}{s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6 pt-4 border-t border-slate-100">
              <Checkbox label="Functional Building" name="has_building" checked={form.has_building} onChange={handleChange} />
              <Checkbox label="Essential Furniture" name="has_furniture" checked={form.has_furniture} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <>
            <Input label="Bank Name" name="bank_name" value={form.bank_name} onChange={handleChange} />
            <Input label="Account Number" name="account_no" value={form.account_no} onChange={handleChange} />
            <Input label="IFSC Code" name="ifsc" value={form.ifsc} onChange={handleChange} />
            <Input label="Branch Name" name="branch" value={form.branch} onChange={handleChange} />
          </>
        )}

        {activeTab === 3 && (
          <>
            <Input label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} />
            <Input label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} />
          </>
        )}
      </div>
    </div>
  );
}

/* UI Helper Components */
function Input({ label, name, onChange, ...props }: any) { 
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{label}</label>
     
     
      <input 
        name={name}
        onChange={onChange}
        {...props} 
        className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-700 outline-none focus:border-blue-500 transition-colors" 
      />
    </div>
  );
}

function Select({ label, name, options, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{label}</label>
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="">Select Option</option>
        {options.map((o: any) => (<option key={o.id} value={o.id}>{o.name}</option>))}
      </select>
    </div>
  );
}

function Checkbox({ label, name, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-3 mt-2 text-sm text-slate-600 cursor-pointer select-none">
      <input 
        type="checkbox" 
        name={name} 
        checked={checked} 
        onChange={onChange} 
        className="w-4 h-4 rounded border-slate-300 text-blue-600" 
      />
      {label}
    </label>
  );
}