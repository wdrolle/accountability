// src/app/api/admin/jobs/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Our DB schema now includes a `payload` JSONB column in cron.job, for example:
//   ALTER TABLE cron.job ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';
//   (See below explanation for why we need it.)
// Fields: jobid, jobname, schedule, command, nodename, database, username, active, nodeport, payload

// For reference:
type JobRecord = {
  jobid: bigint;
  jobname: string | null;
  schedule: string;
  command: string;
  nodename: string;
  database: string;
  username: string;
  active: boolean;
  nodeport: number;
  payload: any; // we'll store JSON here
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Provide the standard OPTIONS route:
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
    },
  });
}

export async function POST(
  request: Request,
  context: { params: { id?: string } }
) {
  // console.log('[DEBUG] 1: Starting POST request');
  try {
    // [DEBUG] 2: Checking authentication
    // console.log('[DEBUG] 2: Checking authentication');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // console.log('[DEBUG] 2.1: Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // [DEBUG] 3: Validating job ID
    // console.log('[DEBUG] 3: Validating job ID');
    const { id } = context.params; 
    // console.log('[DEBUG] 3.1: Received ID from context.params:', id);

    if (!id) {
      // console.log('[DEBUG] 3.2: Missing job ID');
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
    }

    let jobId: number;
    try {
      jobId = parseInt(id, 10);
      if (isNaN(jobId)) {
        // console.log('[DEBUG] 3.3: Invalid job ID format');
        return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 });
      }
      // console.log('[DEBUG] 3.4: Parsed Job ID:', jobId, 'Type:', typeof jobId);
    } catch (parseError) {
      // console.error('[DEBUG] 3.5: parseError:', parseError);
      return NextResponse.json({
        error: 'Invalid job ID',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 400 });
    }

    // [DEBUG] 4: Parsing request data
    // console.log('[DEBUG] 4: Parsing request data');
    const data = await request.json();
    // console.log('[DEBUG] 4.1: Received data:', data);

    if (!data || typeof data !== 'object') {
      // console.log('[DEBUG] 4.2: Invalid data format');
      return NextResponse.json({
        error: 'Invalid request data: Expected an object'
      }, { status: 400 });
    }

    // [DEBUG] 5: Validating required fields
    // console.log('[DEBUG] 5: Validating required fields');
    const requiredFields = ['schedule', 'command', 'nodename', 'database', 'username'];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      // console.log('[DEBUG] 5.1: Missing fields:', missingFields);
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // If the DB has a column "payload JSONB",
    // we pass a valid JSON string, never null or an object directly
    const payloadObj =
      data.payload && typeof data.payload === 'object' ? data.payload : {};
    const payloadJson = JSON.stringify(payloadObj);

    // Provide a default nodeport if no nodeport is sent
    const nodeportValue =
      typeof data.nodeport === 'number' ? data.nodeport : 5432;

    // [DEBUG] 6: Checking if job exists
    // console.log('[DEBUG] 6: Checking if job exists');
    let existingJobResult: Pick<JobRecord, 'jobid'>[] = [];
    try {
      existingJobResult = await prisma.$queryRawUnsafe<Pick<JobRecord, 'jobid'>[]>(
        'SELECT jobid FROM cron.job WHERE jobid = $1',
        jobId
      );
      // console.log('[DEBUG] 6.1: Existing job check result:', existingJobResult);
    } catch (checkErr) {
      // console.error('[DEBUG] 6.2: Checking existing job failed:', checkErr);
      return NextResponse.json({
        error: 'Database operation failed',
        details: checkErr instanceof Error ? checkErr.message : 'Unknown error'
      }, { status: 500 });
    }

    const isExisting = Array.isArray(existingJobResult) && existingJobResult.length > 0;

    if (isExisting) {
      // [DEBUG] 7: Updating existing job
      // console.log('[DEBUG] 7: Updating existing job');
      const updateQuery = `
        UPDATE cron.job 
        SET
          jobname  = COALESCE($1, jobname),
          schedule = $2,
          command  = $3,
          nodename = COALESCE($4, 'localhost'),
          database = COALESCE($5, current_database()),
          username = COALESCE($6, current_user),
          active   = $7,
          nodeport = $8,
          payload  = $9::jsonb
        WHERE jobid = $10
        RETURNING
          jobid,
          jobname,
          schedule,
          command,
          nodename,
          database,
          username,
          active,
          nodeport,
          payload
      `;
      const paramsArray = [
        data.jobname ?? null, // $1
        data.schedule,        // $2
        data.command,         // $3
        data.nodename ?? null,// $4
        data.database ?? null,// $5
        data.username ?? null,// $6
        true,                 // $7
        nodeportValue,        // $8
        payloadJson,          // $9 (as JSON string)
        jobId                 // $10
      ];
      // console.log('[DEBUG] 7.1: Update parameters:', {
      //   jobname: data.jobname ?? null,
      //   schedule: data.schedule,
      //   command: data.command,
      //   nodename: data.nodename ?? null,
      //   database: data.database ?? null,
      //   username: data.username ?? null,
      //   active: true,
      //   nodeport: nodeportValue,
      //   payload: payloadObj,
      //   jobId,
      // });
      // console.log('[DEBUG] 7.2: Update query:', updateQuery);
      // console.log('[DEBUG] 7.2.2: Attempting database operation with params:', paramsArray);

      try {
        const updateResult = await prisma.$queryRawUnsafe<JobRecord[]>(
          updateQuery,
          paramsArray
        );
        // console.log('[DEBUG] 7.3: Update result:', updateResult);

        if (!updateResult || updateResult.length === 0) {
          // console.log('[DEBUG] 7.4: No rows returned after update');
          return NextResponse.json({ error: 'Failed to update job' }, { status: 404 });
        }

        const updated = {
          ...updateResult[0],
          jobid: Number(updateResult[0].jobid),
        };
        // console.log('[DEBUG] 7.5: Processed job after update:', updated);

        return NextResponse.json({
          ...updated,
          // convert jobid to string for JSON if you prefer
          jobid: updated.jobid.toString(),
        });
      } catch (updateError) {
        console.error('[DEBUG] 7.6: Update error:', updateError);
        return NextResponse.json({
          error: 'Database operation failed',
          details: updateError instanceof Error ? updateError.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      // [DEBUG] 7: Creating new job
      // console.log('[DEBUG] 7: Creating new job');
      const insertQuery = `
        INSERT INTO cron.job (
          jobid,
          jobname,
          schedule,
          command,
          nodename,
          database,
          username,
          active,
          nodeport,
          payload
        )
        VALUES (
          $1,
          COALESCE($2, jobname),
          $3,
          $4,
          COALESCE($5, 'localhost'),
          COALESCE($6, current_database()),
          COALESCE($7, current_user),
          $8,
          $9,
          $10::jsonb
        )
        RETURNING
          jobid,
          jobname,
          schedule,
          command,
          nodename,
          database,
          username,
          active,
          nodeport,
          payload
      `;
      const paramsArray = [
        jobId,                  // $1
        data.jobname ?? null,   // $2
        data.schedule,          // $3
        data.command,           // $4
        data.nodename ?? null,  // $5
        data.database ?? null,  // $6
        data.username ?? null,  // $7
        true,                   // $8
        nodeportValue,          // $9
        payloadJson,            // $10
      ];
      // console.log('[DEBUG] 7.1: Insert parameters:', {
      //   jobId,
      //   jobname: data.jobname ?? null,
      //   schedule: data.schedule,
      //   command: data.command,
      //   nodename: data.nodename ?? null,
      //   database: data.database ?? null,
      //   username: data.username ?? null,
      //   active: true,
      //   nodeport: nodeportValue,
      //   payload: payloadObj,
      // });
      // console.log('[DEBUG] 7.2: Insert query:', insertQuery);
      // console.log('[DEBUG] 7.2.2: Attempting database operation with params:', paramsArray);

      try {
        const insertResult = await prisma.$queryRawUnsafe<JobRecord[]>(insertQuery, paramsArray);
        // console.log('[DEBUG] 7.3: Insert result:', insertResult);

        if (!insertResult || insertResult.length === 0) {
          // console.log('[DEBUG] 7.4: No rows returned after insert');
          return NextResponse.json({ error: 'Failed to create job' }, { status: 404 });
        }

        const created = {
          ...insertResult[0],
          jobid: Number(insertResult[0].jobid),
        };
        // console.log('[DEBUG] 7.5: Processed job after create:', created);

        return NextResponse.json({
          ...created,
          jobid: created.jobid.toString(),
        });
      } catch (insertError) {
        // console.error('[DEBUG] 7.6: Insert error:', insertError);
        return NextResponse.json({
          error: 'Database operation failed',
          details: insertError instanceof Error ? insertError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
  } catch (error) {
    // console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
