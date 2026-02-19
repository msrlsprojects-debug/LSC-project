'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ---------- TYPES ---------- */
type MasterItem = { id: string; name: string; };

export default function LSCProfileManagement() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [lscId, setLscId] = useState<string | null>(null);
  const [masterServices, setMasterServices] = useState<MasterItem[]>([]);
  const [masterCategories, setMasterCategories] = useState<MasterItem[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [form, setForm] = useState<any>({
    lsc_name: '', district_id: '', block_id: '', village: '', gp: '', address: '',
    clf_code: '', clf_name: '', operator_name: '', staff_count: '',
    bank_name: '', branch_name: '', account_no: '', ifsc: '', has_building: false,
    has_furniture: false, contact_details: '', latitude: '', longitude: '',
    date_of_establishment: '', clf_formation_date: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('lsc_id').eq('user_id', session.user.id).single();
      if (!profile?.lsc_id) throw new Error("No LSC assigned.");

      const id = profile.lsc_id;
      setLscId(id);

      const [servRes, lscServRes, catRes, lscCatRes, lscRes, distRes] = await Promise.all([
        supabase.from('service_items').select('id, name').order('name'),
        supabase.from('lsc_services').select('service_item_id').eq('lsc_id', id),
        supabase.from('service_categories').select('id, name').order('name'),
        supabase.from('lsc_services_categories').select('service_categories_item_id').eq('lsc_id', id),
        supabase.from('lscs').select('*').eq('id', id).single(),
        supabase.from('districts').select('id, name').order('name')
      ]);

      setMasterServices(servRes.data || []);
      setMasterCategories(catRes.data || []);
      setDistricts(distRes.data || []);
      setSelectedServices((lscServRes.data || []).map(s => s.service_item_id));
      setSelectedCategories((lscCatRes.data || []).map(c => c.service_categories_item_id));
      if (lscRes.data) setForm(lscRes.data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!form.district_id) return;
    supabase.from('blocks').select('id, name').eq('district_id', form.district_id).order('name')
      .then(({ data }) => setBlocks(data || []));
  }, [form.district_id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...form,
        staff_count: form.staff_count ? Number(form.staff_count) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };

      await supabase.from('lscs').update(updateData).eq('id', lscId);
      await supabase.from('lsc_services').delete().eq('lsc_id', lscId);
      if (selectedServices.length > 0) {
        await supabase.from('lsc_services').insert(selectedServices.map(sid => ({ lsc_id: lscId, service_item_id: sid })));
      }
      await supabase.from('lsc_services_categories').delete().eq('lsc_id', lscId);
      if (selectedCategories.length > 0) {
        await supabase.from('lsc_services_categories').insert(selectedCategories.map(cid => ({ lsc_id: lscId, service_categories_item_id: cid })));
      }

      setSuccess(true);
      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-700 font-medium">Syncing Profile...</p>;

  return (
    <>
      {/* ACTION BAR (Sub-Header) */}
      {/* <div className="bg-white border-b shadow-sm sticky top-[53px] z-40">
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-end gap-3">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors">
              EDIT PROFILE
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-1.5 rounded-md text-xs font-bold transition-colors">
                CANCEL
              </button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-1.5 rounded-md text-xs font-bold shadow-sm disabled:opacity-50 transition-colors">
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </>
          )}
        </div>
      </div> */}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {success && (
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-bold text-center shadow-lg animate-in fade-in slide-in-from-top-4">
            ✓ PROFILE UPDATED SUCCESSFULLY
          </div>
        )}

        {/* SECTION A: BASIC DETAILS */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden border-t-4 border-blue-600">
          <div className="max-w-6xl mx-auto px-4 py-2 flex justify-end gap-3">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors">
              EDIT PROFILE
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-1.5 rounded-md text-xs font-bold transition-colors">
                CANCEL
              </button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-1.5 rounded-md text-xs font-bold shadow-sm disabled:opacity-50 transition-colors">
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </>
          )}
        </div>
          <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-widest">A. Basic Details</h2>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isEditing ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isEditing ? 'EDITING MODE' : 'LOCKED'}
            </span>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormInput label="CLF Code" value={form.clf_code || ''} disabled onChange={(val: any) => setForm({ ...form, clf_code: val })} />
              <FormInput label="CLF Name" value={form.clf_name || ''} disabled onChange={(val: any) => setForm({ ...form, clf_name: val })} />
              <FormInput label="CLF Formation Date" type="date" value={form.clf_formation_date || ''} disabled onChange={(val: any) => setForm({ ...form, clf_formation_date: val })} />
              <FormInput label="LSC Name" value={form.lsc_name} disabled onChange={(val: any) => setForm({ ...form, lsc_name: val })} />
              <FormInput label="LSC Establishment Date" type="date" value={form.date_of_establishment || ''} disabled onChange={(val: any) => setForm({ ...form, date_of_establishment: val })} />
              <FormInput label="Operator Name" value={form.operator_name || ''} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, operator_name: val })} />
              <FormInput label="Staff Count" type="number" value={form.staff_count || ''} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, staff_count: val })} />
            </div>

            <div className="border-t pt-6">
              <p className="text-[10px] font-black uppercase mb-4 tracking-widest text-gray-400">Address Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormSelect label="District" value={form.district_id} options={districts} disabled onChange={(val: any) => setForm({ ...form, district_id: val })} />
                <FormSelect label="Block" value={form.block_id} options={blocks} disabled onChange={(val: any) => setForm({ ...form, block_id: val })} />
                <FormInput label="Gram Panchayat" value={form.gp || ''} disabled onChange={(val: any) => setForm({ ...form, gp: val })} />
                <FormInput label="Village" value={form.village || ''} disabled onChange={(val: any) => setForm({ ...form, village: val })} />
                <FormInput label="Landmark" value={form.address || ''} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, address: val })} />
                <FormInput label="Latitude" value={form.latitude || ''} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, latitude: val })} />
                <FormInput label="Longitude" value={form.longitude || ''} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, longitude: val })} />
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-[10px] font-black uppercase mb-4 tracking-widest text-gray-400">Banking Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormInput label="Bank Name" value={form.bank_name || ''} disabled onChange={(val: any) => setForm({ ...form, bank_name: val })} />
                <FormInput label="Branch Name" value={form.branch_name || ''} disabled onChange={(val: any) => setForm({ ...form, branch_name: val })} />
                <FormInput label="Account Number" value={form.account_no || ''} disabled onChange={(val: any) => setForm({ ...form, account_no: val })} />
                <FormInput label="IFSC Code" value={form.ifsc || ''} disabled onChange={(val: any) => setForm({ ...form, ifsc: val })} />
              </div>
            </div>

            <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Infrastructure</p>
                <div className="flex gap-6 pt-2">
                  <FormCheckbox label="Has Building" checked={form.has_building} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, has_building: val })} />
                  <FormCheckbox label="Has Furniture" checked={form.has_furniture} disabled={!isEditing} onChange={(val: any) => setForm({ ...form, has_furniture: val })} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTOR & SERVICES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50"><h2 className="font-bold text-gray-800 text-xs uppercase">B. Services</h2></div>
            <div className="p-5 grid grid-cols-1 gap-3">
              {masterCategories.map(cat => (
                <label key={cat.id} className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${selectedCategories.includes(cat.id) ? 'bg-blue-50 border-blue-500' : 'border-gray-100'} ${!isEditing && 'opacity-60 cursor-not-allowed'}`}>
                  <span className="text-xs font-bold uppercase">{cat.name}</span>
                  <input type="checkbox" disabled={!isEditing} checked={selectedCategories.includes(cat.id)} onChange={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])} />
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50"><h2 className="font-bold text-gray-800 text-xs uppercase">C. Service Catalog</h2></div>
            <div className="p-5 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
              {masterServices.map(service => (
                <button key={service.id} disabled={!isEditing} onClick={() => setSelectedServices(prev => prev.includes(service.id) ? prev.filter(i => i !== service.id) : [...prev, service.id])}
                  className={`text-left p-2.5 rounded-lg text-[10px] border-2 uppercase font-bold transition-all ${selectedServices.includes(service.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-transparent text-gray-400'} ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function FormInput({ label, value, onChange, type = "text", disabled }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type} disabled={disabled}
        className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm transition-all outline-none ${disabled ? 'bg-gray-100 border-gray-100 text-gray-400' : 'bg-gray-50 border-gray-100 focus:bg-white focus:border-blue-500 text-gray-800'}`}
        value={value} onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FormSelect({ label, value, options, onChange, disabled }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <select
        disabled={disabled}
        className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm transition-all outline-none appearance-none ${disabled ? 'bg-gray-100 border-gray-100 text-gray-400' : 'bg-gray-50 border-gray-100 focus:bg-white focus:border-blue-500 text-gray-800'}`}
        value={value} onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— SELECT —</option>
        {options.map((o: any) => (<option key={o.id} value={o.id}>{o.name}</option>))}
      </select>
    </div>
  );
}

function FormCheckbox({ label, checked, onChange, disabled }: any) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-0" />
      <span className={`text-xs font-black uppercase tracking-tighter ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    </label>
  );
}