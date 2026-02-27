import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  let createdUserId: string | null = null; // Track ID for rollback

  try {
    const body = await req.json();
    const { email, password, role, district_id, block_id } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    //  Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message || 'User creation failed' },
        { status: 400 }
      );
    }

    createdUserId = authData.user.id;

    //  Insert Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: createdUserId,
        role,
        district_id: district_id || null,
        block_id: block_id || null,
        lsc_id: null,
      });

    // ROLLBACK LOGIC
    if (profileError) {
      console.error('Profile insertion failed. Rolling back Auth user:', createdUserId);
      
      // Delete the Auth user we just created to keep data clean
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);

      return NextResponse.json(
        { error: `Database Error: ${profileError.message}. Auth user rolled back.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    // Catch-all rollback for unexpected server crashes
    if (createdUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }
    console.error('CREATE USER ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}