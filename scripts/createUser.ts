import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import readline from 'readline'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer)
    })
  })
}

// Define types for auth user response
interface AuthUser {
  id: string
  email: string
  phone: string
  user_metadata: {
    first_name: string
    last_name: string
  }
  app_metadata: {
    provider: string
  }
}

// Initialize Supabase client with service_role key
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Assuming you want to use Prisma instead of Supabase Auth
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

// Function to create a user in the database
async function createUserInDB(
  email: string,
  password: string,
  phoneNumber: string,
  firstName: string,
  lastName: string
) {
  try {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.error('User already exists')
      return
    }

    const hashedPassword = await hash(password, 12)
    const confirmationToken = crypto.randomUUID()

    const user = await prisma.users.create({
      data: {
        email,
        encrypted_password: hashedPassword,
        phone: phoneNumber,
        confirmation_token: confirmationToken,
        user: {
          create: {
            email,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
            role: 'USER',
            subscription_status: 'TRIAL',
          }
        }
      },
      include: {
        user: true,
      },
    })

    console.log('User created successfully:', user)
  } catch (error) {
    console.error('Error creating user:', (error as Error).message)
  }
}

async function main() {
  try {
    console.log('Starting user creation process...')

    const email = await prompt('Enter email: ')
    const password = await prompt('Enter password: ')
    const phoneNumber = await prompt('Enter phone number (e.g., +1234567890): ')
    const firstName = await prompt('Enter first name: ')
    const lastName = await prompt('Enter last name: ')

    console.log('\nVerifying connection to Prisma...')
    const test = await prisma.$queryRaw`SELECT 1`
    console.log('Connection verified successfully')

    await createUserInDB(email, password, phoneNumber, firstName, lastName)
    console.log('\nUser creation completed successfully!')
  } catch (error) {
    console.error('\nError in main:', (error as Error).message)
  } finally {
    rl.close()
  }
}

main() 