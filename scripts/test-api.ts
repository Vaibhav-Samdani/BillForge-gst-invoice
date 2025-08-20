/**
 * Simple script to test the database API endpoint
 */

async function testHealthEndpoint() {
  try {
    console.log('🔍 Testing health endpoint...');
    
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health endpoint working:');
      console.log('   Status:', data.status);
      console.log('   Message:', data.message);
      console.log('   Stats:', data.stats);
    } else {
      console.error('❌ Health endpoint failed:');
      console.error('   Status:', response.status);
      console.error('   Data:', data);
    }
  } catch (error) {
    console.error('❌ Failed to test health endpoint:', error);
    console.log('💡 Make sure the development server is running: npm run dev');
  }
}

testHealthEndpoint();