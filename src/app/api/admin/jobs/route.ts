// src/app/api/admin/jobs/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  // console.log('[DEBUG] 1: Starting GET request');
  try {
    // console.log('[DEBUG] 2: Checking authentication');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // console.log('[DEBUG] 2.1: Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // console.log('[DEBUG] 3: Fetching jobs from database');
    const jobs = await prisma.job.findMany({
      orderBy: {
        jobid: 'asc'
      }
    });
    // console.log('[DEBUG] 3.1: Found jobs:', jobs.length);

    // console.log('[DEBUG] 4: Serializing jobs');
    const serializedJobs = jobs.map(job => ({
      ...job,
      jobid: job.jobid.toString()
    }));

    // console.log('[DEBUG] 5: Sending response');
    return NextResponse.json(serializedJobs);
  } catch (error) {
    // console.log('[DEBUG] 6: Error in GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // console.log('[DEBUG] 1: Starting POST request');
  try {
    // console.log('[DEBUG] 2: Checking authentication');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // console.log('[DEBUG] 2.1: Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // console.log('[DEBUG] 3: Parsing request data');
    let data;
    try {
      data = await request.json();
      // console.log('[DEBUG] 3.1: Received data:', data);
    } catch (parseError) {
      // console.log('[DEBUG] 3.2: JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request data: Failed to parse JSON' 
      }, { status: 400 });
    }

    if (!data || typeof data !== 'object') {
      // console.log('[DEBUG] 3.3: Invalid data format');
      return NextResponse.json({ 
        error: 'Invalid request data: Expected an object' 
      }, { status: 400 });
    }

    // console.log('[DEBUG] 4: Validating required fields');
    const requiredFields = ['schedule', 'command', 'nodename', 'database', 'username'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      // console.log('[DEBUG] 4.1: Missing fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    try {
      // console.log('[DEBUG] 5: Getting next job ID');
      const maxJobResult = await prisma.job.aggregate({
        _max: {
          jobid: true
        }
      });
      // console.log('[DEBUG] 5.1: Current max job ID:', maxJobResult._max.jobid);
      
      const nextJobId = maxJobResult._max.jobid ? BigInt(maxJobResult._max.jobid.toString()) + BigInt(1) : BigInt(1);
      // console.log('[DEBUG] 5.2: Next job ID:', nextJobId.toString());

      // console.log('[DEBUG] 6: Creating new job');
      const newJob = await prisma.job.create({
        data: {
          jobid: nextJobId,
          jobname: data.jobname ?? null,
          schedule: data.schedule,
          command: data.command,
          nodename: data.nodename,
          database: data.database,
          username: data.username,
          active: true,
          nodeport: 5432 // default port
        }
      });
      // console.log('[DEBUG] 6.1: Job created:', newJob);

      // console.log('[DEBUG] 7: Formatting response');
      const response = {
        jobid: newJob.jobid.toString(),
        jobname: newJob.jobname,
        schedule: newJob.schedule,
        command: newJob.command,
        nodename: newJob.nodename,
        database: newJob.database,
        username: newJob.username,
        active: newJob.active
      };

      // console.log('[DEBUG] 8: Sending successful response');
      return NextResponse.json(response);
    } catch (dbError: any) {
      // console.log('[DEBUG] 6.2: Database error:', dbError);
      return NextResponse.json(
        { error: dbError.message || 'Database operation failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // console.log('[DEBUG] 9: Unhandled error in api/admin/jobs/route.ts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
} 