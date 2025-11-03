import { sql } from '@vercel/postgres';

// Check if we have database credentials
const hasDatabaseCredentials = process.env.POSTGRES_URL || (
  process.env.POSTGRES_USER && 
  process.env.POSTGRES_HOST && 
  process.env.POSTGRES_PASSWORD && 
  process.env.POSTGRES_DATABASE
);

// Initialize the database tables
export async function initializeDatabase() {
  // If no database credentials, skip initialization
  if (!hasDatabaseCredentials) {
    console.log('No database credentials found, skipping database initialization');
    return;
  }
  
  try {
    // Create bills table if it doesn't exist
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
    
    // Create an index on customer_name for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_customer_name ON bills(customer_name)
    `;
    
    // Create an index on date for faster sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date)
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Save a bill to the database
export async function saveBill(billData: any) {
  // If no database credentials, throw an error
  if (!hasDatabaseCredentials) {
    throw new Error('Database not configured');
  }
  
  try {
    const { sNo, date, customerName, items, basket, luggage, oldBalance, paidAmount } = billData;
    
    // Convert items to JSON string for storage
    const itemsJson = JSON.stringify(items);
    
    // Use upsert (insert or update) to handle both new and existing bills
    const result = await sql`
      INSERT INTO bills (s_no, date, customer_name, items, basket, luggage, old_balance, paid_amount)
      VALUES (${sNo}, ${date}, ${customerName}, ${itemsJson}, ${basket}, ${luggage}, ${oldBalance}, ${paidAmount})
      ON CONFLICT (s_no) 
      DO UPDATE SET
        date = EXCLUDED.date,
        customer_name = EXCLUDED.customer_name,
        items = EXCLUDED.items,
        basket = EXCLUDED.basket,
        luggage = EXCLUDED.luggage,
        old_balance = EXCLUDED.old_balance,
        paid_amount = EXCLUDED.paid_amount,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Error saving bill:', error);
    throw error;
  }
}

// Get all bills from the database
export async function getAllBills() {
  // If no database credentials, return empty array
  if (!hasDatabaseCredentials) {
    return [];
  }
  
  try {
    const result = await sql`
      SELECT * FROM bills ORDER BY date DESC, s_no DESC
    `;
    
    // Parse the items JSON back to objects
    return result.rows.map(bill => ({
      ...bill,
      items: typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items,
      sNo: bill.s_no,
      date: bill.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      customerName: bill.customer_name,
      oldBalance: Number(bill.old_balance),
      paidAmount: Number(bill.paid_amount),
      basket: Number(bill.basket),
      luggage: Number(bill.luggage)
    }));
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
}

// Get bills for a specific customer
export async function getBillsByCustomer(customerName: string) {
  // If no database credentials, return empty array
  if (!hasDatabaseCredentials) {
    return [];
  }
  
  try {
    const result = await sql`
      SELECT * FROM bills 
      WHERE customer_name ILIKE ${customerName}
      ORDER BY date DESC
    `;
    
    // Parse the items JSON back to objects
    return result.rows.map(bill => ({
      ...bill,
      items: typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items,
      sNo: bill.s_no,
      date: bill.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      customerName: bill.customer_name,
      oldBalance: Number(bill.old_balance),
      paidAmount: Number(bill.paid_amount),
      basket: Number(bill.basket),
      luggage: Number(bill.luggage)
    }));
  } catch (error) {
    console.error('Error fetching bills for customer:', error);
    throw error;
  }
}

// Delete a bill by S.No
export async function deleteBill(sNo: string) {
  // If no database credentials, throw an error
  if (!hasDatabaseCredentials) {
    throw new Error('Database not configured');
  }
  
  try {
    const result = await sql`
      DELETE FROM bills WHERE s_no = ${sNo}
    `;
    
    return result.rowCount;
  } catch (error) {
    console.error('Error deleting bill:', error);
    throw error;
  }
}

// Get the next bill number
export async function getNextBillNumber() {
  // If no database credentials, return default
  if (!hasDatabaseCredentials) {
    return '0001';
  }
  
  try {
    const result = await sql`
      SELECT MAX(CAST(s_no AS INTEGER)) as max_s_no FROM bills WHERE s_no ~ '^[0-9]+$'
    `;
    
    const maxSNo = result.rows[0]?.max_s_no || 0;
    return String(maxSNo + 1).padStart(4, '0');
  } catch (error) {
    console.error('Error getting next bill number:', error);
    throw error;
  }
}