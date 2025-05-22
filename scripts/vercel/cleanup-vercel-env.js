// run this script to remove all vercel environment variables before setting them up again
// run this script in the root of the project
// to run: node cleanup-vercel-env.js
// then run: node setup-vercel-env.js

const { execSync } = require('child_process');

try {
  // Get list of all environment variables
  console.log('Getting list of environment variables...');
  const result = execSync('vercel env ls --debug', { encoding: 'utf8' });
  
  // Parse the output to get variable names
  const variables = result
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('>') && !line.startsWith('Vercel CLI'))
    .map(line => {
      const match = line.match(/[A-Z_]+/);
      return match ? match[0] : null;
    })
    .filter(Boolean) // Remove any null values
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  if (variables.length === 0) {
    console.log('No environment variables found to remove.');
    process.exit(0);
  }

  console.log('\nFound these environment variables:');
  variables.forEach(v => console.log(`- ${v}`));
  
  console.log('\nRemoving all environment variables...');
  
  // Remove each variable from each environment using -y flag
  const environments = ['production', 'preview', 'development'];
  
  // Create a shell script with all the commands
  const commands = variables.flatMap(variable => 
    environments.map(env => 
      `echo "y" | vercel env rm ${variable} ${env} || true`
    )
  ).join('\n');
  
  // Execute all commands in one shell session
  execSync(commands, { 
    stdio: 'inherit',
    shell: '/bin/bash'
  });
  
  // Clean up any temporary .env files
  console.log('\nCleaning up temporary files...');
  execSync('rm -f .env-*', { stdio: 'inherit' });
  
  console.log('\nAll environment variables have been removed!');
  console.log('You can now run setup-vercel-env.js to add them back.');
} catch (error) {
  console.error('Error:', error.message);
  // Clean up any temporary files even if there was an error
  try {
    execSync('rm -f .env-*', { stdio: 'inherit' });
  } catch (cleanupError) {
    console.error('Error during cleanup:', cleanupError.message);
  }
} 