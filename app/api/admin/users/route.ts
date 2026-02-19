import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* -----------------------------------
   Explicit DB row typing (IMPORTANT)
----------------------------------- */
type ProfileRow = {
  user_id: string;
  role: 'DISTRICT' | 'BLOCK';
  district: { name: string } | null;
  block: { name: string } | null;
};

export async function GET() {
  try {
    /* -----------------------------------
       1️⃣ Fetch profiles with FK aliasing
    ----------------------------------- */
const { data: profiles, error } = await supabase
  .from('profiles')
  .select(`
    user_id,
    role,
    district:district_id ( name ),
    block:block_id ( name )
  `)
  .in('role', ['DISTRICT', 'BLOCK'])
  .returns<ProfileRow[]>();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    /* -----------------------------------
       2️⃣ Fetch auth users (emails)
    ----------------------------------- */
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    /* -----------------------------------
       3️⃣ Merge profiles + emails
    ----------------------------------- */
    const users = (profiles || []).map((p) => {
      const authUser = authUsers.users.find(
        (u) => u.id === p.user_id
      );

      const merged = {
        user_id: p.user_id,
        role: p.role,
        email: authUser?.email || '—',
        district: p.district,
        block: p.block,
      };

      return {
        user_id: p.user_id,
        role: p.role,
        email: authUser?.email || '—',
        district: p.district?.name || null,
        block: p.block?.name || null,
      };
    });

    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
