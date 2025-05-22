// run this script to setup the vercel environment variables
// run this script in the root of the project
// to run: node setup-vercel-env.js

const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Read .env.local file
  const envFile = fs.readFileSync('.env.local', 'utf8');
  
  // Parse environment variables
  const envVars = envFile
    .split('\n')
    .filter(line => 
      line.trim() && 
      !line.startsWith('#') && 
      line.includes('=')
    )
    .map(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      return { key: key.trim(), value };
    });

  // Add each environment variable to all environments
  const environments = ['production', 'preview', 'development'];
  
  for (const env of environments) {
    console.log(`\nAdding variables to ${env} environment...`);
    
    for (const { key, value } of envVars) {
      try {
        // Remove any comments from the value
        const cleanValue = value.split('#')[0].trim();
        
        // Escape special characters in the value
        const escapedValue = cleanValue.replace(/"/g, '\\"');
        
        // Create a temporary file with the value
        const tmpFile = `.env-${key}-${Date.now()}`;
        fs.writeFileSync(tmpFile, escapedValue);
        
        // Add to environment using input redirection
        const command = `vercel env add "${key}" ${env} < "${tmpFile}"`;
        console.log(`Adding ${key}...`);
        execSync(command, { stdio: 'inherit' });
        
        // Clean up temp file
        fs.unlinkSync(tmpFile);
        
      } catch (error) {
        console.error(`Failed to add ${key}: ${error.message}`);
      }
    }
  }
  
  console.log('\nEnvironment variables successfully added to Vercel!');
} catch (error) {
  console.error('Error:', error.message);
} 