import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, push, update, query, orderByChild, equalTo, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string
};

// Debug logging
console.log('Firebase config:', firebaseConfig);

// Check if all required config values are present
const missingConfig = Object.entries(firebaseConfig).filter(([key, value]) => !value);
if (missingConfig.length > 0) {
  console.warn('Missing Firebase config values:', missingConfig);
} else {
  console.log('All Firebase config values are present');
}

// Initialize Firebase
console.log('Initializing Firebase app...');
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app);

const database = getDatabase(app);
console.log('Firebase database initialized:', database);

// Test Firebase connection
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    // Simple test - try to read from a non-existent path
    const testRef = ref(database, 'test-connection');
    await get(testRef);
    console.log('Firebase connection test successful');
    return true;
  } catch (error: any) {
    // If we get a permission denied error, it actually means we're connected
    if (error && error.message && error.message.includes('Permission denied')) {
      console.log('Firebase connection test successful (permission denied means connected)');
      return true;
    }
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

// Save a bill to Firebase
export async function saveBillToFirebase(billData: any) {
  try {
    console.log('Saving bill to Firebase:', billData);
    const billRef = ref(database, `bills/${billData.sNo}`);
    await set(billRef, billData);
    console.log('Bill saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving bill to Firebase:', error);
    throw error;
  }
}

// Get a bill by S.No
export async function getBillFromFirebase(sNo: string) {
  try {
    const billRef = ref(database, `bills/${sNo}`);
    const snapshot = await get(billRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting bill from Firebase:', error);
    throw error;
  }
}

// Get all bills
export async function getAllBillsFromFirebase() {
  try {
    console.log('Fetching all bills from Firebase');
    const billsRef = ref(database, 'bills');
    const snapshot = await get(billsRef);
    
    console.log('Firebase response snapshot:', snapshot);
    console.log('Does snapshot exist?', snapshot.exists());
    
    if (snapshot.exists()) {
      const rawData = snapshot.val();
      console.log('Raw data from Firebase:', rawData);
      
      const bills = Object.values(rawData);
      console.log('Bills array:', bills);
      
      // Sort by date descending
      bills.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('Bills fetched and sorted:', bills);
      console.log('Number of bills:', bills.length);
      
      // Log customer names for debugging
      bills.forEach((bill: any, index) => {
        console.log(`Bill ${index + 1}: S.No=${bill.sNo}, Customer="${bill.customerName}", Date=${bill.date}`);
      });
      
      return bills;
    }
    
    console.log('No bills found in Firebase');
    return [];
  } catch (error) {
    console.error('Error getting all bills from Firebase:', error);
    throw error;
  }
}

// Delete a bill
export async function deleteBillFromFirebase(sNo: string) {
  try {
    const billRef = ref(database, `bills/${sNo}`);
    await remove(billRef);
    return true;
  } catch (error) {
    console.error('Error deleting bill from Firebase:', error);
    throw error;
  }
}

// Get bills for a specific customer
export async function getBillsByCustomerFromFirebase(customerName: string) {
  try {
    const billsRef = ref(database, 'bills');
    const snapshot = await get(billsRef);
    
    if (snapshot.exists()) {
      const allBills: any[] = Object.values(snapshot.val());
      return allBills.filter(bill => 
        bill.customerName.toLowerCase() === customerName.toLowerCase()
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error getting bills by customer from Firebase:', error);
    throw error;
  }
}

// Get the next bill number
export async function getNextBillNumberFromFirebase() {
  try {
    // First, get all existing bills to find the highest number
    const billsRef = ref(database, 'bills');
    const snapshot = await get(billsRef);
    
    let nextNumber = 1;
    if (snapshot.exists()) {
      const bills: any[] = Object.values(snapshot.val());
      if (bills.length > 0) {
        // Find the highest bill number
        const billNumbers = bills.map(bill => parseInt(bill.sNo, 10));
        const maxBillNumber = Math.max(...billNumbers);
        nextNumber = maxBillNumber + 1;
      }
    }
    
    return String(nextNumber).padStart(4, '0');
  } catch (error) {
    console.error('Error getting next bill number from Firebase:', error);
    // Fallback to simple increment
    return '0001';
  }
}