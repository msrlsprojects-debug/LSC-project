import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  try {

    // TODO
    // check that only anchor can use this API route

    const body = await req.json();
    const { lsc, services,categories } = body;

    // check for categories also
     if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'No Categories were selected' },
        { status: 400 }
      );
    }

    // check for services
    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'No services selected' },
        { status: 400 }
      );
    }

    /*  Create LSC */
    const { data: lscRow, error: lscError } =
      await supabaseAdmin
        .from('lscs')
        .insert(lsc)
        .select('id')
        .single();

    if (lscError || !lscRow) {
      return NextResponse.json(
        { error: lscError?.message || 'LSC creation failed' },
        { status: 400 }
      );
    }

    // mapped category with the lscs
    const categoriesRows = categories.map((categoryId: string) => ({
      lsc_id: lscRow.id,
      service_categories_item_id: categoryId,
    }));

    const { error: categoryError } =
      await supabaseAdmin.from('lsc_services_categories').insert(categoriesRows);

    if (categoryError) {
      await supabaseAdmin.from('lscs').delete().eq('id', lscRow.id);
      return NextResponse.json(
        { error: categoryError.message },
        { status: 400 }
      );
    }

    // mapp services to lsc_services table
    const serviceRows = services.map((serviceId: string) => ({
      lsc_id: lscRow.id,
      service_item_id: serviceId,
    }));

    const { error: serviceError } =
      await supabaseAdmin.from('lsc_services').insert(serviceRows);

    if (serviceError) {
      await supabaseAdmin.from('lscs').delete().eq('id', lscRow.id); //delete lsc
      await supabaseAdmin.from('lsc_services_categories').delete().eq('lsc_id', lscRow.id); // delete category mapping

      return NextResponse.json(
        { error: serviceError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
