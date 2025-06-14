import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check auth.users
    const authUsers = await prisma.$queryRaw`
      SELECT id, email, created_at, raw_user_meta_data FROM auth.users 
      WHERE LOWER(TRIM(email)) = ${normalizedEmail}
    `;
    
    // Check accountability.user
    const accountabilityUsers = await prisma.$queryRaw`
      SELECT id, email, first_name, last_name, created_at FROM accountability."user" 
      WHERE LOWER(TRIM(email)) = ${normalizedEmail}
    `;
    
    // If there are auth users, check for their accountability records
    let linkedAccountabilityUsers = [];
    if (Array.isArray(authUsers) && authUsers.length > 0) {
      for (const authUser of authUsers) {
        const linked = await prisma.$queryRaw`
          SELECT id, email, first_name, last_name, created_at FROM accountability."user" 
          WHERE id = ${(authUser as any).id}::uuid
        `;
        linkedAccountabilityUsers.push(...(Array.isArray(linked) ? linked : []));
      }
    }

    return NextResponse.json({
      email: normalizedEmail,
      authUsers: authUsers,
      accountabilityUsers: accountabilityUsers,
      linkedAccountabilityUsers: linkedAccountabilityUsers,
      summary: {
        authCount: Array.isArray(authUsers) ? authUsers.length : 0,
        accountabilityCount: Array.isArray(accountabilityUsers) ? accountabilityUsers.length : 0,
        linkedCount: linkedAccountabilityUsers.length
      }
    });

  } catch (error: any) {
    console.error('Check user error:', error);
    return NextResponse.json({
      error: "Failed to check user",
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
} 