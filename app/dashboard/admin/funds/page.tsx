'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* ---------------- TYPES ---------------- */

type Fund = {
  id: string;
  fundtype: string;
  created_at?: string;
};

/* ---------------- PAGE ---------------- */

export default function FundsManagementPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* FORM STATES */
  const [newFundType, setNewFundType] = useState('');
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [editingFundName, setEditingFundName] = useState('');

  /* ---------------- LOAD DATA ---------------- */

  const loadFunds = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('funds')
      .select('id, fundtype')
      .order('fundtype', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setFunds(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFunds();
  }, []);

  /* ---------------- CRUD ACTIONS ---------------- */

  const addFund = async () => {
    if (!newFundType.trim()) return;

    const { error: insertError } = await supabase
      .from('funds')
      .insert({ fundtype: newFundType.trim() });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewFundType('');
      loadFunds();
    }
  };

  const updateFund = async (id: string) => {
    if (!editingFundName.trim()) return;

    const { error: updateError } = await supabase
      .from('funds')
      .update({ fundtype: editingFundName.trim() })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEditingFundId(null);
      setEditingFundName('');
      loadFunds();
    }
  };

  const deleteFund = async (id: string) => {
    if (!confirm('Are you sure you want to remove this fund source?')) return;

    const { error: deleteError } = await supabase
      .from('funds')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      loadFunds();
    }
  };

  if (loading && funds.length === 0) return <p className="p-6 text-slate-600 animate-pulse">Loading funds...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fund Sources</h1>
        <p className="text-sm text-slate-600">
          Manage the various types of funding sources available for your LSCs.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* ADD NEW FUND SECTION */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-3">
            <input
              value={newFundType}
              onChange={(e) => setNewFundType(e.target.value)}
              placeholder="e.g. MGNREGA, NRLM, State Fund"
              className="flex-1 border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={addFund}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Add Fund
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 bg-slate-50 border-b border-slate-100 uppercase text-[11px] font-bold tracking-wider">
                <th className="px-6 py-4 text-left">Fund Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funds.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingFundId === f.id ? (
                      <input
                        autoFocus
                        value={editingFundName}
                        onChange={(e) => setEditingFundName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateFund(f.id)}
                        className="border border-blue-400 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 w-full max-w-xs text-sm"
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{f.fundtype}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right space-x-4">
                    {editingFundId === f.id ? (
                      <>
                        <button
                          onClick={() => updateFund(f.id)}
                          className="text-green-600 font-bold hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFundId(null)}
                          className="text-slate-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingFundId(f.id);
                            setEditingFundName(f.fundtype);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteFund(f.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {funds.length === 0 && !loading && (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-slate-400 italic">
                    No funds found. Add a new fund source to get started.
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