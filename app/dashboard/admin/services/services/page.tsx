'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* ---------------- TYPES ---------------- */

type Category = {
  id: string;
  name: string;
};

type ServiceItem = {
  id: string;
  name: string;
  category_id: string;
  service_categories: {
    name: string;
  } | null;
};

/* ---------------- PAGE ---------------- */

export default function ServicesOnlyPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* SERVICE FORM STATES */
  const [newService, setNewService] = useState({ name: '', category_id: '' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceName, setEditingServiceName] = useState('');

  /* ---------------- LOAD DATA ---------------- */

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [{ data: catData }, { data: svcData }] = await Promise.all([
      supabase
        .from('service_categories')
        .select('id, name')
        .order('name'),

      supabase
        .from('service_items')
        .select(`
          id,
          name,
          category_id,
          service_categories:service_categories!service_items_category_id_fkey (
            name
          )
        `)
        .order('name')
    ]);

    setCategories(catData || []);

    const normalizedServices: ServiceItem[] = (svcData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      category_id: s.category_id,
      service_categories: Array.isArray(s.service_categories)
        ? s.service_categories[0] ?? null
        : s.service_categories ?? null,
    }));

    setServices(normalizedServices);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- SERVICE CRUD ---------------- */

  const addService = async () => {
    if (!newService.name.trim() || !newService.category_id) {
      alert("Please provide a service name and select a category.");
      return;
    }

    const { error } = await supabase
      .from('service_items')
      .insert({
        name: newService.name.trim(),
        category_id: newService.category_id,
      });

    if (error) setError(error.message);
    else {
      setNewService({ name: '', category_id: '' });
      loadData();
    }
  };

  const updateService = async (id: string) => {
    if (!editingServiceName.trim()) return;

    const { error } = await supabase
      .from('service_items')
      .update({ name: editingServiceName.trim() })
      .eq('id', id);

    if (error) setError(error.message);
    else {
      setEditingServiceId(null);
      setEditingServiceName('');
      loadData();
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const { error } = await supabase.from('service_items').delete().eq('id', id);
    if (error) setError(error.message);
    else loadData();
  };

  if (loading) return <p className="p-6 text-slate-600">Loading services...</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Services List</h1>
        <p className="text-sm text-slate-600">
          Create and manage specific service items provided by centers.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">
          {error}
        </p>
      )}

      {/* ================== ADD NEW SERVICE ================== */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Add New Service
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          
          <select
            value={newService.category_id}
            onChange={(e) =>
              setNewService({
                ...newService,
                category_id: e.target.value,
              })
            }
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm bg-white outline-none"
          >
            <option value="">Assign to Category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={newService.name}
            onChange={(e) =>
              setNewService({ ...newService, name: e.target.value })
            }
            placeholder="Service Name (e.g. Soil Testing)"
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
          />

          <button
            onClick={addService}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
          >
            Create Service
          </button>
        </div>
      </section>

      {/* ================== SERVICES TABLE ================== */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Category</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Service Item</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                 <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold uppercase tracking-tight">
                    {s.service_categories?.name || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingServiceId === s.id ? (
                    <input
                      autoFocus
                      value={editingServiceName}
                      onChange={(e) => setEditingServiceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateService(s.id)}
                      className="border border-blue-300 px-3 py-1.5 rounded-md focus:ring-2 focus:ring-blue-100 outline-none w-full max-w-xs"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{s.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  {editingServiceId === s.id ? (
                    <>
                      <button
                        onClick={() => updateService(s.id)}
                        className="text-blue-700 font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingServiceId(null)}
                        className="text-slate-500 font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingServiceId(s.id);
                          setEditingServiceName(s.name);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteService(s.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {services.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                  No services found. Add one above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}