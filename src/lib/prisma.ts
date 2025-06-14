import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!')
    console.error('Please create a .env.local file in your project root with:')
    console.error('DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"')
    console.error('DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"')
    
    throw new Error(`
DATABASE_URL environment variable is not set!

Please create a .env.local file in your project root with your Supabase database credentials:

DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

You can find these values in your Supabase project dashboard under Settings > Database.
    `)
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error', 'warn'],
    errorFormat: 'pretty'
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Enhanced connection handling with better error messages
prisma.$connect().then(() => {
  console.log('✅ Database connected successfully')
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error.message)
  
  if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
    console.error('\n💡 Connection troubleshooting:')
    console.error('1. Check your DATABASE_URL in .env.local')
    console.error('2. Verify your Supabase project is running')
    console.error('3. Check your internet connection')
    console.error('4. Ensure your IP is whitelisted in Supabase (if applicable)')
  }
  
  if (error.message.includes('password authentication failed')) {
    console.error('\n💡 Authentication troubleshooting:')
    console.error('1. Check your database password in .env.local')
    console.error('2. Verify the database user has proper permissions')
    console.error('3. Try resetting your database password in Supabase dashboard')
  }
})

export default prisma 