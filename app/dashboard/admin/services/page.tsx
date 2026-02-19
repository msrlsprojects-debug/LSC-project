'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* ---------------- TYPES ---------------- */

type Category = {
  id: string;
  name: string;
  service_count?: number;
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

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* CATEGORY FORM */
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  /* SERVICE FORM */
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
        .select(`
          id,
          name,
          service_items(count)
        `)
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

    setCategories(
      (catData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        service_count: c.service_items?.[0]?.count || 0,
      }))
    );

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

  /* ---------------- CATEGORY CRUD ---------------- */

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const { error } = await supabase
      .from('service_categories')
      .insert({ name: newCategory.trim() });

    if (error) setError(error.message);
    else {
      setNewCategory('');
      loadData();
    }
  };

  const updateCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;

    await supabase
      .from('service_categories')
      .update({ name: editingCategoryName.trim() })
      .eq('id', id);

    setEditingCategoryId(null);
    setEditingCategoryName('');
    loadData();
  };

  const deleteCategory = async (cat: Category) => {
    if ((cat.service_count || 0) > 0) {
      alert('Cannot delete category. Services are assigned.');
      return;
    }

    if (!confirm('Delete this category?')) return;

    await supabase
      .from('service_categories')
      .delete()
      .eq('id', cat.id);

    loadData();
  };

  /* ---------------- SERVICE CRUD ---------------- */

  const addService = async () => {
    if (!newService.name || !newService.category_id) return;

    await supabase
      .from('service_items')
      .insert({
        name: newService.name.trim(),
        category_id: newService.category_id,
      });

    setNewService({ name: '', category_id: '' });
    loadData();
  };

  const updateService = async (id: string) => {
    if (!editingServiceName.trim()) return;

    await supabase
      .from('service_items')
      .update({ name: editingServiceName.trim() })
      .eq('id', id);

    setEditingServiceId(null);
    setEditingServiceName('');
    loadData();
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;

    await supabase.from('service_items').delete().eq('id', id);
    loadData();
  };

  if (loading) return <p className="p-6">Loading services…</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Service Management
        </h1>
        <p className="text-sm text-slate-600">
          Manage service categories and services
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">
          {error}
        </p>
      )}

      {/* ================== CATEGORIES ================== */}
      <section className="max-w-3xl mx-auto bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Service Categories
        </h2>

        <div className="flex gap-2 mb-4">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={addCategory}
            className="bg-slate-800 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="text-slate-600 border-b">
            <tr>
              <th className="py-2 text-left">Category</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2">
                  {editingCategoryId === c.id ? (
                    <input
                      value={editingCategoryName}
                      onChange={(e) =>
                        setEditingCategoryName(e.target.value)
                      }
                      className="border px-2 py-1 rounded"
                    />
                  ) : (
                    <span>{c.name}</span>
                  )}
                </td>

                <td className="py-2 text-right space-x-3">
                  {editingCategoryId === c.id ? (
                    <>
                      <button
                        onClick={() => updateCategory(c.id)}
                        className="text-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategoryId(null)}
                        className="text-slate-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setEditingCategoryName(c.name);
                        }}
                        className="text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(c)}
                        className={`${
                          c.service_count ? 'text-slate-400' : 'text-red-600'
                        }`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ================== SERVICES ================== */}
      <section className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            value={newService.name}
            onChange={(e) =>
              setNewService({ ...newService, name: e.target.value })
            }
            placeholder="Service name"
            className="border px-3 py-2 rounded"
          />

          <select
            value={newService.category_id}
            onChange={(e) =>
              setNewService({
                ...newService,
                category_id: e.target.value,
              })
            }
            className="border px-3 py-2 rounded"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={addService}
            className="bg-slate-800 text-white px-4 py-2 rounded"
          >
            Add Service
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b text-slate-600">
            <tr>
              <th className="py-2 text-left">Service</th>
              <th className="py-2 text-left">Category</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2">
                  {editingServiceId === s.id ? (
                    <input
                      value={editingServiceName}
                      onChange={(e) =>
                        setEditingServiceName(e.target.value)
                      }
                      className="border px-2 py-1 rounded"
                    />
                  ) : (
                    <span>{s.name}</span>
                  )}
                </td>

                <td className="py-2 text-slate-600">
                  {s.service_categories?.name || '-'}
                </td>

                <td className="py-2 text-right space-x-3">
                  {editingServiceId === s.id ? (
                    <>
                      <button
                        onClick={() => updateService(s.id)}
                        className="text-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingServiceId(null)}
                        className="text-slate-500"
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
                        className="text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteService(s.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
