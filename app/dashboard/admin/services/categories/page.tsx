'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* ---------------- TYPES ---------------- */

type Category = {
  id: string;
  name: string;
  service_count?: number;
};

/* ---------------- PAGE ---------------- */

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* CATEGORY FORM STATES */
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  /* ---------------- LOAD DATA ---------------- */

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const { data, error: catError } = await supabase
      .from('service_categories')
      .select(`
        id,
        name,
        service_items(count)
      `)
      .order('name');

    if (catError) {
      setError(catError.message);
    } else {
      setCategories(
        (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          service_count: c.service_items?.[0]?.count || 0,
        }))
      );
    }

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

    if (error) {
      setError(error.message);
    } else {
      setNewCategory('');
      loadData();
    }
  };

  const updateCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;

    const { error } = await supabase
      .from('service_categories')
      .update({ name: editingCategoryName.trim() })
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      setEditingCategoryId(null);
      setEditingCategoryName('');
      loadData();
    }
  };

  const deleteCategory = async (cat: Category) => {
    if ((cat.service_count || 0) > 0) {
      alert(`Cannot delete "${cat.name}". There are ${cat.service_count} services assigned to this category.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', cat.id);

    if (error) setError(error.message);
    else loadData();
  };

  if (loading) return <p className="p-6 text-slate-600">Loading categories...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Service Categories
        </h1>
        <p className="text-sm text-slate-600">
          Add, edit, or remove categories for your livelihood services.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">
          {error}
        </p>
      )}

      {/* ================== CATEGORIES SECTION ================== */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-3">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name (e.g., Agriculture, Education)"
              className="flex-1 border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            />
            <button
              onClick={addCategory}
              className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
            >
              Add Category
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 bg-slate-50 border-b border-slate-100 uppercase text-[11px] font-bold tracking-wider">
                <th className="px-6 py-4 text-left">Category Name</th>
                <th className="px-6 py-4 text-center">Active Services</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingCategoryId === c.id ? (
                      <input
                        autoFocus
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateCategory(c.id)}
                        className="border border-blue-300 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 w-full max-w-xs"
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{c.name}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${c.service_count ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      {c.service_count || 0}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right space-x-4">
                    {editingCategoryId === c.id ? (
                      <>
                        <button
                          onClick={() => updateCategory(c.id)}
                          className="text-blue-700 font-bold hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCategoryId(null)}
                          className="text-slate-500 hover:underline"
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
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(c)}
                          className={`${
                            c.service_count 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-red-500 hover:text-red-700'
                          } font-medium`}
                          title={c.service_count ? "Cannot delete category with services" : "Delete Category"}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">
                    No categories found. Start by adding one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}