// run this script to remove all vercel environment variables
// run this script in the root of the project
// to run: node remove-vercel-env.js

const { execSync } = require('child_process');

try {
  // Get list of all environment variables
  console.log('Getting list of environment variables...');
  const result = execSync('vercel env ls', { encoding: 'utf8' });
  
  // Parse the output to get variable names
  const variables = result
    .split('\n')
    .filter(line => line.includes('●'))
    .map(line => line.split(' ')[1]);
  
  // Remove each variable from all environments
  const environments = ['production', 'preview', 'development'];
  
  for (const variable of variables) {
    console.log(`\nRemoving ${variable}...`);
    try {
      execSync(`vercel env rm ${variable} --yes`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to remove ${variable}: ${error.message}`);
    }
  }
  
  console.log('\nAll environment variables have been removed!');
} catch (error) {
  console.error('Error:', error.message);
} 