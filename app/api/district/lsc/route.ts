import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* -----------------------------------
    Updated Explicit DB row typing
----------------------------------- */
type ProfileRow = {
  user_id: string;
  role: string;
  // Add your specific lscs table columns here so TypeScript recognizes them
  id: string;
  full_name?: string; 
  phone?: string;
  status?: string;
  // ... any other fields from your 'lscs' table
  district: { name: string } | null;
  block: { name: string } | null;
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 }); 
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    }

    /* -----------------------------------
        Get the scope of the logged-in Admin
    ----------------------------------- */
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('district_id')
      .eq('user_id', authUser.id)
      .single();

    if (adminError || !adminProfile?.district_id) {
      return NextResponse.json({ error: "Admin context not found" }, { status: 404 }); 
    }
    
    /* -----------------------------------
        Fetch LSC details 
    ----------------------------------- */
    const { data: profiles, error } = await supabase
      .from('lscs')
      .select(`
        id,lsc_name,district_id,block_id,block_status,block_remarks,district_status,district_remarks,state_status,state_remarks,
        district:district_id ( name ),
        block:block_id ( name )
      `)
      .eq('district_id', adminProfile.district_id) 
      .eq('block_status', 'APPROVED')
      .returns<ProfileRow[]>();

    if (error) {
      console.error("LSC fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* -----------------------------------
        Fetch auth users for emails
    ----------------------------------- */
    // const { data: authUsers, error: authErrorList } = await supabase.auth.admin.listUsers();

    /* -----------------------------------
        Merge and Return ALL details
    ----------------------------------- */
    const users = (profiles || []).map((p) => {
      // const authUserMatch = authUsers?.users.find((u) => u.id === p.user_id);

      return {
        // Spread all properties from the 'lscs' table row (id, name, phone, etc.)
        ...p,
        district: p.district?.name || null,
        block: p.block?.name || null,
        // email: authUserMatch?.email || '—',

      };
    });

    return NextResponse.json(users);

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 }); 
  }
}