const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting deployment process...');

try {
  // First, build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Then deploy to Cloudflare Pages
  console.log('🌐 Deploying to Cloudflare Pages...');
  execSync('npx wrangler pages deploy build --project-name=portfolio-frontend', { 
    stdio: 'inherit',
    env: {
      ...process.env
    }
  });
  
  console.log('✅ Deployment completed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
