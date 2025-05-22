import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadGroupFile } from '@/lib/supabase-storage';

export async function POST(request: Request) {
  // console.log('\n[DEBUG] ====== Upload Process Started ======');
  // console.log('[DEBUG] Request headers:', {
  //   contentType: request.headers.get('content-type'),
  //   authorization: request.headers.get('authorization')?.substring(0, 20) + '...',
  // });
  
  try {
    // Get session
    const session = await getServerSession(authOptions);
    // console.log('\n[DEBUG] Session Info:', {
    //   email: session?.user?.email,
    //   userId: session?.user?.id,
    //   isAuthenticated: !!session?.user
    // });

    if (!session?.user) {
      // console.error('[DEBUG] Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and validate form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string;
    
    // console.log('\n[DEBUG] Form Data Details:', {
    //   file: {
    //     name: file?.name,
    //     type: file?.type,
    //     size: file?.size,
    //     lastModified: file?.lastModified,
    //   },
    //   groupId,
    //   userId: session.user.id,
    //   formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
    //     key,
    //     value: value instanceof File ? {
    //       name: value.name,
    //       type: value.type,
    //       size: value.size
    //     } : value
    //   }))
    // });

    // Validate required fields
    if (!file || !groupId) {
      console.error('\n[DEBUG] Validation Failed:', { 
        hasFile: !!file, 
        hasGroupId: !!groupId,
        fileDetails: file ? {
          name: file.name,
          type: file.type,
          size: file.size
        } : 'No file'
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine file type based on MIME type
    let type = 'application';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('video/')) type = 'media';
    if (file.type.startsWith('audio/')) type = 'media';

    // console.log('\n[DEBUG] File Classification:', {
    //   originalType: file.type,
    //   classifiedAs: type,
    //   extension: file.name.split('.').pop()
    // });

    // Prepare upload
    // console.log('\n[DEBUG] Preparing Upload:', {
    //   bucket: 'study-group-chat-messages',
    //   userId: session.user.id,
    //   groupId,
    //   type,
    //   fileName: file.name
    // });

    // Upload file
    const result = await uploadGroupFile(file, session.user.id, groupId, type);
    // console.log('\n[DEBUG] Upload Result:', {
    //   success: !!result,
    //   publicUrl: result.publicUrl,
    //   path: result.path,
    //   fullDetails: result
    // });
    
    // Format response for TinyMCE
    const response = {
      location: result.publicUrl,
      file: {
        url: result.publicUrl,
        file_url: result.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        path: result.path
      },
      alt: file.name,
      title: file.name,
      width: null,
      height: null,
      message: 'File uploaded successfully'
    };

    // console.log('\n[DEBUG] Formatted Response:', response);
    // console.log('[DEBUG] ====== Upload Process Completed ======\n');

    return NextResponse.json(response);
  } catch (error: any) {
    // console.error('\n[DEBUG] ====== Upload Error Details ======');
    
    // Create a structured error object
    const errorDetails = {
      type: error?.constructor?.name || typeof error,
      message: error?.message || (typeof error === 'string' ? error : 'Unknown error'),
      statusCode: error?.statusCode || error?.status || 500,
      error: error?.error,
      data: error?.data,
      stringified: JSON.stringify(error, null, 2)
    };
    
    // console.error('[DEBUG] Error Details:', errorDetails);
    // console.error('[DEBUG] ====== End Error Details ======\n');
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: errorDetails.message,
        details: errorDetails
      },
      { status: errorDetails.statusCode }
    );
  }
}