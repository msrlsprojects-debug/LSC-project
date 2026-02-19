'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ---------- TYPES ---------- */
type District = { id: string; name: string };
type Block = { id: string; name: string };
type ServiceCategory = { id: string; name: string };
type ServiceItem = { id: string; name: string; category_id: string };

const tabs = ['Basic', 'Banking', 'Services', 'Contact'];

const initialFormState = {
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
};

export default function AddLSCPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Category & Service States
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [form, setForm] = useState<any>(initialFormState);

  /* ---------- DATA FETCHING ---------- */
  useEffect(() => {
    const fetchData = async () => {
      const { data: d } = await supabase.from('districts').select('id,name').order('name');
      setDistricts(d || []);
      const { data: cat } = await supabase.from('service_categories').select('id, name').order('name');
      setCategories(cat || []);
      const { data: s } = await supabase.from('service_items').select('id, name, category_id').order('name');
      setAllServices(s || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!form.district_id) { setBlocks([]); return; }
    supabase.from('blocks').select('id,name').eq('district_id', form.district_id).order('name').then(({ data }) => setBlocks(data || []));
  }, [form.district_id]);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredServices([]);
    } else {
      const filtered = allServices.filter(s => selectedCategories.includes(s.category_id));
      setFilteredServices(filtered);
    }
  }, [selectedCategories, allServices]);

  /* ---------- HANDLERS ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateCurrentTab = () => {
    if (activeTab === 0) {
      if (!form.clf_code || !form.clf_name || !form.lsc_name || !form.district_id || !form.block_id) return 'Please fill all required basic fields.';
    }
    if (activeTab === 1) {
      if (!form.bank_name || !form.account_no || !form.ifsc) return 'Banking details are mandatory.';
    }
    if (activeTab === 2) {
      if (selectedServices.length === 0) return 'Please select at least one service.';
    }
    if (activeTab === 3) {
      if (!form.contact_details || form.contact_details.length < 10) return 'Valid mobile number is required.';
    }
    return null;
  };

  const nextTab = () => {
    const err = validateCurrentTab();
    if (err) { setError(err); return; }
    setError(null);
    if (!completedSteps.includes(activeTab)) setCompletedSteps([...completedSteps, activeTab]);
    setActiveTab(activeTab + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (saving) return;
    const finalErr = validateCurrentTab();
    if (finalErr) { setError(finalErr); return; }

    setError(null);
    setSaving(true);

    try {
      const payload = {
        servicecategories: selectedCategories,
        services: selectedServices,
        lsc: {
          ...form,
          staff_count: form.staff_count ? Number(form.staff_count) : 0,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        },
      };

      const res = await fetch('/api/public/newapplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit application');

      setGeneratedCode(result.applicationCode);
      setShowSuccessModal(true);
      setCompletedSteps([0, 1, 2, 3]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-[100] w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo1.jpg" alt="Logo" className="h-25 w-70 object-contain" />
            <div className="flex flex-col">
              {/* <h1 className="text-sm font-black text-slate-900 leading-none">LSC Portal</h1> */}
              <p className="hidden xs:block text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registration Desk</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6">
             <Link href="/public/registrationstatus" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 self-center tracking-widest transition-all">Track Application</Link>
             <Link href="/login" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 self-center tracking-widest transition-all">Login</Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-4 gap-2">
              <Link href="/public/registrationstatus" onClick={() => setIsMenuOpen(false)} className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-50 rounded-2xl active:scale-95 transition-all">Track Application</Link>
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="p-4 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 rounded-2xl active:scale-95 transition-all">Login to Portal</Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow py-6 sm:py-10 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* HEADER SECTION WITH RIGHT-ALIGNED BACK BUTTON */}
          <div className="flex items-start justify-between mb-10 px-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Application Form</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Livelihood Service Center</p>
            </div>
            <button 
              onClick={() => router.back()}
              className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </div>
              <span>Back</span>
            </button>
          </div>

          {/* STEPPER */}
          <div className="flex items-center justify-between max-w-xl mx-auto mb-10">
            {tabs.map((t, i) => (
              <div key={t} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center relative">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold border-2 transition-all 
                    ${activeTab === i ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' : 
                      completedSteps.includes(i) ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                    {completedSteps.includes(i) ? '✓' : (i + 1)}
                  </div>
                  <span className={`absolute -bottom-6 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${activeTab === i ? 'text-blue-700' : 'text-slate-400'}`}>
                    {t}
                  </span>
                </div>
                {i < tabs.length - 1 && ( <div className={`flex-1 h-[2px] mx-1 sm:mx-2 ${completedSteps.includes(i) ? 'bg-green-500' : 'bg-slate-200'}`} /> )}
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden mt-8 transition-all">
            <div className="p-6 sm:p-12">
              {error && <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-[10px] font-black uppercase border border-red-100 animate-in fade-in">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTab === 0 && (
                  <>
                    <Input label="CLF Code *" name="clf_code" value={form.clf_code} onChange={handleChange} />
                    <Input label="CLF Name *" name="clf_name" value={form.clf_name} onChange={handleChange} />
                    <Input label="CLF Formation Date *" type="date" name="clf_formation_date" value={form.clf_formation_date} onChange={handleChange} />
                    <Input label="LSC Name *" name="lsc_name" value={form.lsc_name} onChange={handleChange} />
                    <Input label="LSC Est. Date *" type="date" name="date_of_establishment" value={form.date_of_establishment} onChange={handleChange} />
                    <Select label="District *" name="district_id" value={form.district_id} onChange={handleChange} options={districts} />
                    <Select label="Block *" name="block_id" value={form.block_id} onChange={handleChange} options={blocks} />
                    <Input label="Village *" name="village" value={form.village} onChange={handleChange} />
                    <Input label="GP *" name="gp" value={form.gp} onChange={handleChange} />
                    <Input label="Full Address / Landmarks" name="address" value={form.address} onChange={handleChange} />
                    <Input label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} placeholder="e.g. 25.1234" />
                    <Input label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} placeholder="e.g. 91.5678" />
                  </>
                )}

                {activeTab === 1 && (
                  <>
                    <Input label="Bank Name *" name="bank_name" value={form.bank_name} onChange={handleChange} />
                    <Input label="Branch Name *" name="branch" value={form.branch} onChange={handleChange} />
                    <Input label="Account No *" name="account_no" value={form.account_no} onChange={handleChange} />
                    <Input label="IFSC Code *" name="ifsc" value={form.ifsc} onChange={handleChange} />
                  </>
                )}

                {activeTab === 2 && (
                  <div className="md:col-span-2 space-y-8">
                    <div className="flex flex-col gap-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">1. Select Service Categories</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((cat) => (
                          <button key={cat.id} type="button" onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                            className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${selectedCategories.includes(cat.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">2. Choose Specific Services *</label>
                      {selectedCategories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl animate-in zoom-in-95 duration-200">
                          {filteredServices.map((s) => (
                            <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedServices.includes(s.id) ? 'bg-white border-blue-600 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}>
                              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600" checked={selectedServices.includes(s.id)} onChange={(e) => setSelectedServices(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))} />
                              <span className="text-[10px] font-black uppercase text-slate-700">{s.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center font-black text-[10px] text-slate-400 uppercase">Select categories to see services</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <Checkbox label="Has Dedicated Building" name="has_building" checked={form.has_building} onChange={handleChange} />
                      <Checkbox label="Has Basic Furniture" name="has_furniture" checked={form.has_furniture} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {activeTab === 3 && (
                  <>
                    <Input label="LSC Operator Name" name="operator_name" value={form.operator_name} onChange={handleChange} />
                    <Input label="Total Staff Count" type="number" name="staff_count" value={form.staff_count} onChange={handleChange} />
                    <Input label="Primary Mobile Number *" name="contact_details" value={form.contact_details} onChange={handleChange} placeholder="10 Digits" />
                  </>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-12 pt-8 border-t border-slate-100">
                <button type="button" onClick={() => activeTab === 0 ? router.back() : setActiveTab(activeTab - 1)} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"> 
                  {activeTab === 0 ? 'Cancel' : 'Previous Step'} 
                </button>
                <button type="button" onClick={activeTab === 3 ? handleSubmit : nextTab} disabled={saving} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all disabled:opacity-50">
                  {saving ? 'Processing...' : activeTab === 3 ? 'Finalize Application' : 'Next Step →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 p-6 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-green-200">✓</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Registration Complete</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Your unique application code is:</p>
            <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-dashed border-blue-200 mb-8">
              <span className="text-5xl font-mono font-black text-blue-600 tracking-tighter">{generatedCode}</span>
            </div>
            <button onClick={() => router.push('/login')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Go to Login</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* REUSABLE UI COMPONENTS */
function Input({ label, ...props }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input {...props} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-600 outline-none transition-all placeholder:text-slate-300" />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select {...props} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-600 outline-none transition-all">
        <option value="">Select Option</option>
        {options.map((o: any) => (<option key={o.id} value={o.id}>{o.name}</option>))}
      </select>
    </div>
  );
}

function Checkbox({ label, ...props }: any) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
      <input type="checkbox" {...props} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
    </label>
  );
}