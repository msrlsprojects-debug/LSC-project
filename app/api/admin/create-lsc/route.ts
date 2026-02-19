//frontend\app\api\admin\create-lsc\route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, password, lsc, services } = body;


    if (!email || !password || !lsc?.lsc_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'No services selected' },
        { status: 400 }
      );
    }

    /* 1️⃣ Create Auth User */
    const { data: auth, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !auth.user) {
      return NextResponse.json(
        { error: authError?.message || 'Auth creation failed' },
        { status: 400 }
      );
    }

    /* 2️⃣ Create LSC */
    const { data: lscRow, error: lscError } =
      await supabaseAdmin
        .from('lscs')
        .insert(lsc)
        .select('id')
        .single();

    if (lscError || !lscRow) {
      // rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(auth.user.id);
      return NextResponse.json(
        { error: lscError?.message || 'LSC creation failed' },
        { status: 400 }
      );
    }

    /* 3️⃣ Create Profile */
    const { error: profileError } =
      await supabaseAdmin.from('profiles').insert({
        user_id: auth.user.id,
        role: 'LSC',
        lsc_id: lscRow.id,
      });

      const serviceRows = services.map((serviceId: string) => ({
        lsc_id: lscRow.id,
        service_item_id: serviceId,
      }));

      const { error: serviceError } =
        await supabaseAdmin.from('lsc_services').insert(serviceRows);

      if (serviceError) {
        await supabaseAdmin.auth.admin.deleteUser(auth.user.id);
        await supabaseAdmin.from('lscs').delete().eq('id', lscRow.id);

        return NextResponse.json(
          { error: serviceError.message },
          { status: 400 }
        );
      }


    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(auth.user.id);
      return NextResponse.json(
        { error: profileError.message },
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
