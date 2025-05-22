export interface VideoSDKSessionOptions {
  sessionName: string;
  role?: 0 | 1; // 0 = attendee, 1 = host
  sessionKey?: string;
  userIdentity?: string;
}

export async function getVideoSDKToken(options: VideoSDKSessionOptions): Promise<string> {
  try {
    const response = await fetch('/api/zoom/video-sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get Video SDK token');
    }

    return data.token;
  } catch (error) {
    console.error('Error getting Video SDK token:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to get Video SDK token');
  }
}

export async function initializeVideoSDK(token: string, container: HTMLElement) {
  try {
    // This is where you'll initialize the Zoom Video SDK client
    // You'll need to include the Zoom Video SDK library in your project
    // and follow their initialization process
    console.log('Initializing Video SDK with token:', token);
    
    // Example initialization (you'll need to adapt this to your needs):
    // const client = ZoomVideo.createClient();
    // await client.init('en-US', container);
    // await client.join(token);
    
    return {
      // Return the initialized client and any other necessary objects
      // client,
      // stream,
      // etc.
    };
  } catch (error) {
    console.error('Error initializing Video SDK:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to initialize Video SDK');
  }
} 