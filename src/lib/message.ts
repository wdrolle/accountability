// This is the file for sending messages
// It is used to send messages to a user
// Handles sending messages
// Gets the user's ID from the database
// Saves the message to daily_devotionals with:
//  message_type: 'AI Generated Prayer'
//  delivery_status: 'SENT_SMS'

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  throw new Error('Missing Twilio configuration. Please check your environment variables.');
}

const client = twilio(accountSid, authToken);

export async function sendMessage({ to, body }: { to: string; body: string }) {
  try {
    // Format the phone number to E.164 format if it's not already
    const formattedTo = to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`;
    
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo
    });
    
    console.log('Message sent successfully:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
} 