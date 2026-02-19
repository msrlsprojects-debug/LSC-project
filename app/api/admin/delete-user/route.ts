import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔒 REQUIRED
);

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    /* ----------------------------------------
       1️⃣ Check if profile exists
       ---------------------------------------- */
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    /* ----------------------------------------
       2️⃣ Delete profile FIRST (FK safety)
       ---------------------------------------- */
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user_id);

    if (profileDeleteError) {
      return NextResponse.json(
        { error: profileDeleteError.message },
        { status: 400 }
      );
    }

    /* ----------------------------------------
       3️⃣ Delete auth user
       ---------------------------------------- */
    const { error: authDeleteError } =
      await supabase.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      return NextResponse.json(
        { error: authDeleteError.message },
        { status: 400 }
      );
    }

    /* ----------------------------------------
       ✅ SUCCESS
       ---------------------------------------- */
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (err) {
    console.error('Delete user API error:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
