//frontend\app\api\admin\create-lsc\route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  try {

    const { email, password, lsc_id, applicationCode } = await req.json();

    // const body = await req.json();
    // const { email, password, lsc, services } = body;

    // checkkign fro missing fileds
    if (!email || !password || !lsc_id || !applicationCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

   
    /*  Create Auth User */
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

    /* 3️⃣ Create Profile */
    const { error: profileError } =
      await supabaseAdmin.from('profiles').insert({
        user_id: auth.user.id,
        role: 'LSC',
        lsc_id: lsc_id,
      });

    // if fail delete created user
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(auth.user.id);
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    //update the status of the application to APPROVED
    const { error: updateError } = await supabaseAdmin
      .from('lscs')
      .update({
        is_active: true,
        applicationCode: null 
      })
      .eq('id', lsc_id)
      .eq('applicationCode', applicationCode);

    if (updateError) {
      // Rollback user and profile if update fails
      await supabaseAdmin.auth.admin.deleteUser(auth.user.id);

      return NextResponse.json(
        { error: 'Failed to update application status' },
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
