import { WebSocketServer, WebSocket } from 'ws';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IncomingMessage } from 'http';

declare global {
  var wss: WebSocketServer;
}

// Store WebSocket clients for each group
const groupClients = new Map<string, Set<WebSocket>>();

// Initialize WebSocket server only once
if (!global.wss) {
  global.wss = new WebSocketServer({ 
    noServer: true,
    perMessageDeflate: false, // Disable compression for better compatibility
    skipUTF8Validation: true, // Skip UTF8 validation for better performance
    handleProtocols: (protocols: Set<string>, request: IncomingMessage) => {
      if (!protocols || protocols.size === 0) {
        return '';
      }
      return Array.from(protocols)[0] || '';
    }
  });

  // Set up error handler for the WebSocket server
  global.wss.on('error', (error) => {
    console.error('WebSocket Server Error:', {
      error,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    });
  });
}

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const groupId = context.params.id;
    const url = new URL(request.url);
    const godV2UserId = url.searchParams.get('x-god-v2-user-id');
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    console.log('WebSocket connection attempt:', {
      groupId,
      godV2UserId,
      origin,
      host,
      headers: Object.fromEntries(request.headers),
      searchParams: Object.fromEntries(url.searchParams)
    });

    // Allow connections from both development and production ports
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'ws://localhost:3000',
      'ws://localhost:3001',
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_APP_URL?.replace('https', 'ws')
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      console.error('Invalid origin:', { origin, allowedOrigins });
      return new Response('Invalid origin', { status: 403 });
    }

    if (!godV2UserId) {
      console.error('Missing godV2UserId in query parameters');
      return new Response('Unauthorized - Missing godV2UserId', { status: 401 });
    }

    // Verify user is a member of the group
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId,
        status: 'ACCEPTED'
      },
    });

    if (!membership) {
      console.error('User not a member:', { godV2UserId, groupId });
      return new Response('Forbidden - Not a member of this group', { status: 403 });
    }

    // Handle WebSocket upgrade
    const upgrade = request.headers.get('upgrade');
    if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
      console.error('Not a WebSocket upgrade request:', { upgrade });
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    try {
      const { socket, response } = await new Promise<{ socket: WebSocket; response: Response }>((resolve, reject) => {
        const upgradeHeader = Object.fromEntries(request.headers);
        //@ts-ignore - we need to access the socket
        const clientSocket = request.socket;

        if (!clientSocket) {
          console.error('No client socket available');
          reject(new Error('No client socket available'));
          return;
        }

        console.log('Attempting WebSocket upgrade with headers:', upgradeHeader);

        global.wss.handleUpgrade(
          { 
            headers: upgradeHeader, 
            method: 'GET', 
            url: request.url 
          } as any,
          clientSocket,
          Buffer.from([]),
          (ws: WebSocket) => {
            console.log('WebSocket upgrade successful');
            
            // Store user ID with the socket
            (ws as any).userId = godV2UserId;
            
            // Set up error handler for this connection
            ws.on('error', (error) => {
              console.error('WebSocket Connection Error:', {
                error,
                userId: godV2UserId,
                groupId
              });
            });

            resolve({ 
              socket: ws, 
              response: new Response(null, { 
                status: 101,
                headers: {
                  'Upgrade': 'websocket',
                  'Connection': 'Upgrade',
                  'Sec-WebSocket-Accept': upgradeHeader['sec-websocket-key'],
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-god-v2-user-id',
                  'Access-Control-Allow-Credentials': 'true'
                }
              }) 
            });
          }
        );
      });

      // Add client to group's client set
      if (!groupClients.has(groupId)) {
        groupClients.set(groupId, new Set());
      }
      groupClients.get(groupId)?.add(socket);

      // Handle client disconnect
      socket.on('close', (code, reason) => {
        console.log('Client disconnected:', {
          userId: godV2UserId,
          groupId,
          code,
          reason: reason.toString()
        });
        groupClients.get(groupId)?.delete(socket);
        if (groupClients.get(groupId)?.size === 0) {
          groupClients.delete(groupId);
        }
      });

      // Handle messages
      socket.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received message:', {
            type: message.type,
            userId: message.userId,
            groupId
          });
          
          // Handle different message types
          switch (message.type) {
            case 'CONNECT':
              console.log('Client connected:', message.userId);
              // Send confirmation back to the client
              socket.send(JSON.stringify({ 
                type: 'CONNECTED', 
                userId: message.userId,
                timestamp: new Date().toISOString()
              }));
              break;
            case 'MESSAGE':
              // Broadcast message to all clients in the group
              const clients = groupClients.get(groupId);
              if (clients) {
                const messageData = JSON.stringify({
                  ...message,
                  timestamp: new Date().toISOString()
                });
                clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(messageData);
                  }
                });
              }
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', {
            error,
            userId: godV2UserId,
            groupId
          });
        }
      });

      return response;
    } catch (error) {
      console.error('WebSocket upgrade error:', {
        error,
        userId: godV2UserId,
        groupId
      });
      throw error;
    }
  } catch (error) {
    console.error('WebSocket setup error:', {
      error,
      stack: (error as Error).stack
    });
    return new Response('WebSocket setup failed', { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 