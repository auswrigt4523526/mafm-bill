import { sql } from '@vercel/postgres';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test query
    const result = await sql`SELECT version()`;
    console.log('Database connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test table creation
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Test table created successfully');
    
    // Insert test data
    const insertResult = await sql`
      INSERT INTO test_table (name) 
      VALUES ('Test Entry') 
      RETURNING *
    `;
    
    console.log('Test data inserted:', insertResult.rows[0]);
    
    // Query test data
    const queryResult = await sql`SELECT * FROM test_table`;
    console.log('Test data retrieved:', queryResult.rows);
    
    // Clean up
    await sql`DROP TABLE IF EXISTS test_table`;
    console.log('Test table dropped');
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testDatabase();