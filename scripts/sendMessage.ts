import { Twilio } from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

async function sendMessage(to: string, body: string) {
  try {
    const message = await twilioClient.messages.create({
      body,
      to,
      messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
    })

    console.log('Message sent successfully:', message.sid)
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Example usage
const phoneNumber = '+1234567890' // Replace with recipient's phone number
const messageBody = 'Hello from your Twilio messaging service!'

sendMessage(phoneNumber, messageBody) 