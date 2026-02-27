'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';


export default function EditLSCPage() {
  const params = useParams();
  const id = params?.id as string; // Get the ID from the URL parameters
  console.log('LSC ID from URL:', id);
  // const router = useRouter();

  // view page
  return (
    <div className="max-w-5xl mx-auto bg-white border rounded p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-slate-800 font-medium">Funds Management</h1>
      </div>
    </div>
  );
}
