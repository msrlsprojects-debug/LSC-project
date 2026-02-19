import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1️⃣ Fetch profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        role,
        districts ( name ),
        blocks ( name )
      `)
      .in('role', ['DISTRICT', 'BLOCK']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2️⃣ Fetch auth users (emails)
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 3️⃣ Merge email into profiles
    const users = profiles.map((p) => {
      const auth = authUsers.users.find(u => u.id === p.user_id);
      return {
        user_id: p.user_id,
        role: p.role,
        email: auth?.email || '—',
        district: p.districts?.[0]?.name || null,
        block: p.blocks?.[0]?.name || null,
      };
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
