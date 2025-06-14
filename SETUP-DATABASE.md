# Database Setup Instructions

## 1. Create Environment File

Create a `.env.local` file in your project root with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Project Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Next Auth Configuration
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration (optional)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="[YOUR-RESEND-API-KEY]"
EMAIL_FROM="noreply@yourdomain.com"
```

## 2. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** and replace `[YOUR-PASSWORD]` with your actual database password
5. Go to **Settings** → **API** to get your API keys

## 3. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (if needed)
npx prisma db push

# Check database connection
npx prisma db pull
```

## 4. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Check the console for database connection status
3. Try the registration at `http://localhost:3001/auth/signup`

## 5. Troubleshooting

### Connection Issues
- Verify your DATABASE_URL is correct
- Check your Supabase project is running
- Ensure your IP is allowed (if you have IP restrictions)

### Authentication Issues
- Double-check your database password
- Try resetting your database password in Supabase
- Verify the database user has proper permissions

### Foreign Key Constraint Issues
- Run the cleanup script: `psql $DATABASE_URL -f scripts/cleanup-orphaned-records.sql`
- Check for orphaned records in your database
- Ensure all related tables exist and have proper relationships 