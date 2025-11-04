/**
 * Script to help set up Vercel KV for the Quick Bill Generator
 */

console.log('Setting up Vercel KV for Quick Bill Generator');
console.log('=============================================');
console.log('');
console.log('To use Vercel KV with your app:');
console.log('');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Select your project or create a new one');
console.log('3. Go to the "Storage" tab');
console.log('4. Click "Create Database"');
console.log('5. Select "KV"');
console.log('6. Choose a region and create the KV store');
console.log('');
console.log('After creating the KV store, Vercel will provide you with:');
console.log('- KV_REST_API_URL');
console.log('- KV_REST_API_TOKEN');
console.log('');
console.log('Add these to your environment variables:');
console.log('- In Vercel: Project Settings → Environment Variables');
console.log('- Locally: Create a .env.local file with these variables');
console.log('');
console.log('Example .env.local file:');
console.log('KV_REST_API_URL=https://your-kv-url.vercel-kv.com');
console.log('KV_REST_API_TOKEN=your-kv-token');
console.log('');
console.log('After setting up the environment variables, your app will:');
console.log('- Automatically use KV for data storage');
console.log('- Fall back to localStorage if KV is not configured');
console.log('- Work seamlessly in both environments');