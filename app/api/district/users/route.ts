import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* -----------------------------------
   Explicit DB row typing
----------------------------------- */
type ProfileRow = {
  user_id: string;
  role: 'DISTRICT' | 'BLOCK';
  district: { name: string } | null;
  block: { name: string } | null;
};

export async function GET(req: NextRequest) {
  try {
    /* -----------------------------------
        Get the Login User's ID from Token
    ----------------------------------- */
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.error("No token provided in headers");
      return NextResponse.json([]); 
    }

    // Identify the user from the token passed from frontend
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error("Auth error or user not found:", authError);
      return NextResponse.json([]); 
    }

    /* -----------------------------------
        Get the District of that User
    ----------------------------------- */
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('district_id')
      .eq('user_id', authUser.id) // Using the ID from the validated token
      .single();

    if (adminError || !adminProfile?.district_id) {
      console.error("Admin profile or district not found");
      return NextResponse.json([]); 
    }
    
    /* -----------------------------------
        Fetch profiles based on that district
    ----------------------------------- */
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        role,
        district:district_id ( name ),
        block:block_id ( name )
      `)
      .eq('district_id', adminProfile.district_id) 
      .in('role', ['BLOCK'])
      .returns<ProfileRow[]>();

    if (error) {
      console.error("Profile fetch error:", error);
      return NextResponse.json([]);
    }

    /* -----------------------------------
        Fetch auth users (emails)
    ----------------------------------- */
    // Using service role here is fine as it's initialized at the top
    const { data: authUsers, error: authErrorList } = await supabase.auth.admin.listUsers();

    if (authErrorList) {
      console.error("Error listing auth users:", authErrorList);
      return NextResponse.json([]);
    }

    /* -----------------------------------
        Merge profiles + emails
    ----------------------------------- */
    const users = (profiles || []).map((p) => {
      const authUserMatch = authUsers.users.find((u) => u.id === p.user_id);

      return {
        user_id: p.user_id,
        role: p.role,
        email: authUserMatch?.email || '—',
        district: p.district?.name || null,
        block: p.block?.name || null,
      };
    });

    // Final result returned to frontend
    return NextResponse.json(users);

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json([]); 
  }
}