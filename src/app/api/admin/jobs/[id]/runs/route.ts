// src/app/api/admin/jobs/[id]/runs/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = parseInt(params.id);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const runDetails = await prisma.job_run_details.findMany({
      where: {
        jobid: BigInt(jobId)
      },
      orderBy: {
        start_time: 'desc'
      }
    });

    // Convert BigInt to string to make it serializable
    const serializedRunDetails = runDetails.map(detail => ({
      ...detail,
      jobid: detail.jobid?.toString(),
      runid: detail.runid.toString()
    }));

    return NextResponse.json(serializedRunDetails);
  } catch (error) {
    console.error('Error fetching job run details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job run details' },
      { status: 500 }
    );
  }
} 