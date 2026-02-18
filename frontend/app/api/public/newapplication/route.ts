import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Destructuring based on the frontend payload
    const { lsc, services, servicecategories } = body;

    /*  Get current row count for application code generation */
    const { count, error: countError } = await supabaseAdmin
      .from('lscs')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    /*  Generate a UNIQUE 5-Digit Integer Code */
    let applicationCode: number = 0;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!isUnique && attempts < maxAttempts) {
      const randomBase = Math.floor(10000 + Math.random() * 80000); 
      const candidate = randomBase + (count || 0);

      const { data: existing } = await supabaseAdmin
        .from('lscs')
        .select('applicationCode')
        .eq('applicationCode', candidate)
        .maybeSingle();

      if (!existing) {
        applicationCode = candidate;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Could not generate a unique 5-digit code. Please try again." },
        { status: 500 }
      );
    }

    /*  Insert the LSC Record */
    const { data: lscRow, error: lscError } = await supabaseAdmin
      .from('lscs')
      .insert({
        ...lsc,
        applicationCode: applicationCode,
        is_active: false,
        status: 'PENDING'
      })
      .select('id')
      .single();

    if (lscError || !lscRow) {
      return NextResponse.json(
        { error: lscError?.message || 'Failed to create LSC record' },
        { status: 400 }
      );
    }

    const newLscId = lscRow.id;

    try {
      /*  Insert into lsc_service_categories first */
      if (servicecategories && Array.isArray(servicecategories) && servicecategories.length > 0) {
        const categoryRows = servicecategories.map((catId: string) => ({
          lsc_id: newLscId,
          service_categories_item_id: catId,
        }));

        const { error: catError } = await supabaseAdmin
          .from('lsc_services_categories')
          .insert(categoryRows);

        if (catError) throw new Error(`Category mapping failed: ${catError.message}`);
      }

      /*  Insert into lsc_services next */
      if (services && Array.isArray(services) && services.length > 0) {
        const serviceRows = services.map((serviceId: string) => ({
          lsc_id: newLscId,
          service_item_id: serviceId,
        }));

        const { error: serviceError } = await supabaseAdmin
          .from('lsc_services')
          .insert(serviceRows);

        if (serviceError) throw new Error(`Service mapping failed: ${serviceError.message}`);
      }

    } catch (mappingError: any) {
      /* ROLLBACK: Delete the LSC record if mapping fails to prevent orphan records */
      await supabaseAdmin.from('lscs').delete().eq('id', newLscId);
      
      return NextResponse.json(
        { error: mappingError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      applicationCode: applicationCode,
    });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}