import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all public groups and groups where the user is a member
    const groups = await prisma.agents_group.findMany({
      where: {
        OR: [
          { visibility: 'PUBLIC' },
          {
            agents_group_member: {
              some: {
                user: {
                  email: session.user.email
                }
              }
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        agents_group_member: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching agents study groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const {
      name,
      description,
      location,
      current_topic,
      visibility,
      date,
      start_time,
      end_time
    } = data;

    // Create the agents study group
    const group = await prisma.agents_group.create({
      data: {
        name,
        description,
        location,
        current_topic,
        visibility,
        leader_id: user.id,
        meeting_schedule: `${date} ${start_time}-${end_time}`,
        created_at: new Date(),
        last_active_at: new Date()
      }
    });

    // Add the creator as a member with OWNER role
    await prisma.agents_group_member.create({
      data: {
        group_id: group.id,
        user_id: user.id,
        role: 'OWNER'
      }
    });

    // Send email notification to the group creator
    // TODO: Implement email notification

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error creating agents study group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 