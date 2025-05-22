import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: dbError } = await supabase
      .from('user')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'ADMIN') {
      console.error('Role check error:', dbError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute the sync function
    const { error: syncError } = await supabase.rpc('copy_subscription_to_family_member');
    if (syncError) {
      console.error('Sync error:', syncError);
      return NextResponse.json(
        { error: 'Failed to sync family subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Successfully synced family subscriptions' });
  } catch (error) {
    console.error('Error syncing family subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to sync family subscriptions' },
      { status: 500 }
    );
  }
} 