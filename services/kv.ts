import { kv } from '@vercel/kv';

// Check if we have KV credentials
const hasKVCredentials = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Save a bill to KV storage
export async function saveBillToKV(billData: any) {
  // If no KV credentials, throw an error
  if (!hasKVCredentials) {
    throw new Error('KV not configured');
  }
  
  try {
    const key = `bill:${billData.sNo}`;
    await kv.set(key, JSON.stringify(billData));
    // Also add to a list of all bills for easy retrieval
    await kv.sadd('all-bills', billData.sNo);
    return true;
  } catch (error) {
    console.error('Error saving bill to KV:', error);
    throw error;
  }
}

// Get a bill by S.No
export async function getBillFromKV(sNo: string) {
  // If no KV credentials, return null
  if (!hasKVCredentials) {
    return null;
  }
  
  try {
    const key = `bill:${sNo}`;
    const bill = await kv.get(key);
    return bill ? JSON.parse(bill as string) : null;
  } catch (error) {
    console.error('Error getting bill from KV:', error);
    throw error;
  }
}

// Get all bills
export async function getAllBillsFromKV() {
  // If no KV credentials, return empty array
  if (!hasKVCredentials) {
    return [];
  }
  
  try {
    const sNos = await kv.smembers('all-bills');
    const bills = [];
    
    for (const sNo of sNos) {
      const bill = await getBillFromKV(sNo);
      if (bill) {
        bills.push(bill);
      }
    }
    
    // Sort by date descending
    bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return bills;
  } catch (error) {
    console.error('Error getting all bills from KV:', error);
    throw error;
  }
}

// Delete a bill
export async function deleteBillFromKV(sNo: string) {
  // If no KV credentials, throw an error
  if (!hasKVCredentials) {
    throw new Error('KV not configured');
  }
  
  try {
    const key = `bill:${sNo}`;
    await kv.del(key);
    await kv.srem('all-bills', sNo);
    return true;
  } catch (error) {
    console.error('Error deleting bill from KV:', error);
    throw error;
  }
}

// Get bills for a specific customer
export async function getBillsByCustomerFromKV(customerName: string) {
  // If no KV credentials, return empty array
  if (!hasKVCredentials) {
    return [];
  }
  
  try {
    const allBills = await getAllBillsFromKV();
    return allBills.filter(bill => 
      bill.customerName.toLowerCase() === customerName.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting bills by customer from KV:', error);
    throw error;
  }
}

// Get the next bill number
export async function getNextBillNumberFromKV() {
  // If no KV credentials, return default
  if (!hasKVCredentials) {
    return '0001';
  }
  
  try {
    // Use a counter for bill numbers
    const nextNumber = await kv.incr('bill-counter');
    return String(nextNumber).padStart(4, '0');
  } catch (error) {
    console.error('Error getting next bill number from KV:', error);
    // Fallback to simple increment
    return '0001';
  }
}