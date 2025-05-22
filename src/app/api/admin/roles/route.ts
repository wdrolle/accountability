import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // First get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) throw rolesError;

    // Then get user counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', role.id);
        
        if (countError) {
          console.warn(`Error getting user count for role ${role.id}:`, countError);
          return { ...role, user_count: 0 };
        }
        
        return { ...role, user_count: count || 0 };
      })
    );

    return NextResponse.json(rolesWithCounts);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();

    const { data, error } = await supabase
      .from('roles')
      .insert([{
        name: body.name,
        description: body.description,
        permissions: body.permissions
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, user_count: 0 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}