// frontend/app/api/admin/update-lsc/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lsc_id, lsc, services } = body;

    if (!lsc_id || !lsc || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    /* 1️⃣ Update LSC details */
    const { error: lscError } = await supabaseAdmin
      .from('lscs')
      .update(lsc)
      .eq('id', lsc_id);

    if (lscError) {
      return NextResponse.json(
        { error: lscError.message },
        { status: 400 }
      );
    }

    /* 2️⃣ Remove existing services */
    const { error: deleteError } = await supabaseAdmin
      .from('lsc_services')
      .delete()
      .eq('lsc_id', lsc_id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    /* 3️⃣ Insert updated services */
    if (services.length > 0) {
      const inserts = services.map((serviceId: string) => ({
        lsc_id,
        service_item_id: serviceId,
        is_available: true,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('lsc_services')
        .insert(inserts);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
