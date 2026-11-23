import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidIanaTimezone } from '@/lib/utils';
import { SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET } from '@/lib/constants';

function avatarFromMeta(meta: unknown) {
  if (!meta || typeof meta !== 'object') return null;
  const record = meta as Record<string, unknown>;
  const url = record.avatar_url || record.picture || record.image;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

function resolveProfileImage(relativeOrUrl?: string | null) {
  if (!relativeOrUrl) return null;
  if (relativeOrUrl.startsWith('http') || relativeOrUrl.startsWith('/')) {
    return relativeOrUrl;
  }
  return `${SUPABASE_BUCKET_URL}/${USER_IMAGES_BUCKET}/${relativeOrUrl}`;
}

async function findAccountabilityUser(session: { user?: { id?: string; email?: string | null } }) {
  if (session.user?.id) {
    const byId = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (byId) return byId;
  }

  if (session.user?.email) {
    return prisma.user.findUnique({
      where: { email: session.user.email },
    });
  }

  return null;
}

async function lookupAvatar(email?: string | null) {
  if (!email) return null;
  try {
    const authUser = await prisma.users.findUnique({
      where: { email },
      select: { raw_app_meta_data: true, raw_user_meta_data: true },
    });
    return avatarFromMeta(authUser?.raw_app_meta_data) || avatarFromMeta(authUser?.raw_user_meta_data);
  } catch (error) {
    console.error('Avatar lookup failed:', error);
    return null;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await findAccountabilityUser(session);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const image = await lookupAvatar(session.user.email);

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role: profile.role,
        subscription_status: profile.subscription_status,
        created_at: profile.created_at,
        timezone: profile.timezone,
        text_message_time: profile.text_message_time,
        image,
      },
    });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, phone, timezone, text_message_time, image } = body;

    if (text_message_time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(text_message_time)) {
      return NextResponse.json({ error: 'Invalid time format. Must be HH:mm (00:00-23:59)' }, { status: 400 });
    }

    if (timezone && !isValidIanaTimezone(timezone)) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const existing = await findAccountabilityUser(session);
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(first_name !== undefined ? { first_name } : {}),
        ...(last_name !== undefined ? { last_name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
        ...(text_message_time !== undefined ? { text_message_time } : {}),
        updated_at: new Date(),
      },
    });

    if (image && session.user.email) {
      try {
        const authUser = await prisma.users.findUnique({
          where: { email: session.user.email },
          select: { id: true, raw_app_meta_data: true },
        });
        if (authUser) {
          const currentMeta = (authUser.raw_app_meta_data as Record<string, unknown>) || {};
          await prisma.users.update({
            where: { id: authUser.id },
            data: {
              raw_app_meta_data: {
                ...currentMeta,
                avatar_url: resolveProfileImage(image) || image,
              },
            },
          });
        }
      } catch (error) {
        console.error('Avatar update skipped:', error);
      }
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
