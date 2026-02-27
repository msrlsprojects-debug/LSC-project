import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 }); 
    }

    // Identify the user from the token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    }

    // 1. Fetch the LSC data
    const { data: adminProfile, error: adminError } = await supabase
      .from('lscs')
      .select(`
        id,
        lsc_name, village, gp, clf_code,
        clf_name, operator_name, bank_name,
        account_no, ifsc, branch, contact_details,
        latitude, longitude, is_active,
        anchor_id,
        district:district_id ( name ),
        block:block_id ( name )
      `)
      .eq('anchor_id', authUser.id)
      .eq('block_status', 'APPROVED')
      .eq('district_status', 'APPROVED')
      .eq('state_status', 'APPROVED'); 

    if (adminError) {
      console.error("Database error:", adminError);
      return NextResponse.json({ error: adminError.message }, { status: 500 }); 
    }

    // 2. Fetch all Auth Users to match emails
    // NOTE: admin.listUsers() requires the Service Role Key
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Auth List error:", listError);
      // We can continue even if this fails, just without emails
    }

    /* -----------------------------------
        Merge DB data with Auth Emails
    ----------------------------------- */
    const users = (adminProfile || []).map((p) => {
      // Find the email from the auth list based on anchor_id
      const emailMatch = authUsers?.users.find((u) => u.id === p.anchor_id)?.email;

      return {
        ...p, // This returns ALL the data from your query (lsc_name, village, etc.)
        // email: emailMatch || '—',
        // district: p.district?.name || null, // Flattens the object to just the name string
        // block: p.block?.name || null,       // Flattens the object to just the name string
      };
    });

    return NextResponse.json(users);

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 }); 
  }
}