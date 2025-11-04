import { kv } from '@vercel/kv';

async function testKV() {
  try {
    console.log('Testing KV connection...');
    
    // Test set operation
    await kv.set('test-key', 'test-value');
    console.log('Set operation successful');
    
    // Test get operation
    const value = await kv.get('test-key');
    console.log('Get operation successful:', value);
    
    // Test delete operation
    await kv.del('test-key');
    console.log('Delete operation successful');
    
    // Test set with expiration
    await kv.set('expiring-key', 'expiring-value', { ex: 1 }); // Expire in 1 second
    console.log('Set with expiration successful');
    
    // Test list operations
    await kv.sadd('test-set', 'item1', 'item2', 'item3');
    console.log('Set add operation successful');
    
    const members = await kv.smembers('test-set');
    console.log('Set members:', members);
    
    await kv.del('test-set');
    console.log('Set delete operation successful');
    
    console.log('All KV tests passed!');
  } catch (error) {
    console.error('KV test failed:', error);
    process.exit(1);
  }
}

testKV();