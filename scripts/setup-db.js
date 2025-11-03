import { sql } from '@vercel/postgres';

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create bills table
    await sql`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        s_no VARCHAR(10) UNIQUE NOT NULL,
        date DATE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        basket DECIMAL(10, 2) DEFAULT 0,
        luggage DECIMAL(10, 2) DEFAULT 0,
        old_balance DECIMAL(10, 2) DEFAULT 0,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Bills table created successfully');
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_customer_name ON bills(customer_name)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date)
    `;
    
    console.log('Indexes created successfully');
    console.log('Database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupDatabase();