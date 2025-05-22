const { Client } = require('pg');
const { setIntervalAsync } = require('set-interval-async/dynamic');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

async function processJobs() {
  try {
    await client.query('SELECT scheduler.process_jobs()');
    console.log('Jobs processed successfully at:', new Date().toISOString());
  } catch (error) {
    console.error('Error processing jobs:', error);
  }
}

async function startWorker() {
  try {
    await client.connect();
    console.log('Scheduler worker connected to database at:', new Date().toISOString());
    
    // Process jobs every minute
    setIntervalAsync(processJobs, 60000);
    
    // Process immediately on startup
    await processJobs();

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM signal, shutting down...');
      await client.end();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT signal, shutting down...');
      await client.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start scheduler worker:', error);
    process.exit(1);
  }
}

startWorker(); 