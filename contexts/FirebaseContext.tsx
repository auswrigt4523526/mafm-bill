import React, { createContext, useContext, useEffect, useState } from 'react';
import { BillData } from '../types';
import { 
  saveBillToFirebase, 
  getBillFromFirebase, 
  getAllBillsFromFirebase, 
  deleteBillFromFirebase, 
  getNextBillNumberFromFirebase, 
  getBillsByCustomerFromFirebase,
  testFirebaseConnection
} from '../services/firebase';

interface FirebaseContextType {
  bills: BillData[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  initialize: () => Promise<void>;
  saveBill: (bill: BillData) => Promise<void>;
  deleteBill: (sNo: string) => Promise<void>;
  loadBills: () => Promise<void>;
  getNextBillNumber: () => Promise<string>;
  getBillsByCustomer: (customerName: string) => Promise<BillData[]>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [localStorageBills, setLocalStorageBills] = useState<BillData[]>([]);

  // Load bills from localStorage as fallback
  useEffect(() => {
    try {
      const bills = localStorage.getItem('savedBills');
      const parsedBills = bills ? JSON.parse(bills) : [];
      setLocalStorageBills(parsedBills);
      console.log('Loaded bills from localStorage:', parsedBills.length);
    } catch (error) {
      console.error('Could not parse saved bills from localStorage', error);
      setLocalStorageBills([]);
    }
  }, []);

  // Test Firebase connection
  const testConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      const isConnected = await testFirebaseConnection();
      console.log('Firebase connection test result:', isConnected);
      return isConnected;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  };

  // Initialize by loading bills
  const initialize = async () => {
    try {
      setLoading(true);
      console.log('Initializing Firebase storage...');
      
      // Test connection first
      const isConnected = await testConnection();
      console.log('Connection test result:', isConnected);
      
      if (isConnected) {
        console.log('Connected to Firebase, loading bills...');
        setConnected(true);
        await loadBills();
      } else {
        console.log('Not connected to Firebase, using localStorage');
        // Fallback to localStorage
        setBills(localStorageBills);
        setConnected(false);
      }
      setError(null);
    } catch (err) {
      console.error('Storage initialization error:', err);
      setError('Failed to initialize storage');
      // Fallback to localStorage on error
      setBills(localStorageBills);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Load all bills from Firebase or localStorage
  const loadBills = async () => {
    try {
      setLoading(true);
      if (connected) {
        console.log('Attempting to load bills from Firebase');
        const billsData = await getAllBillsFromFirebase();
        console.log('Bills data from Firebase:', billsData);
        console.log('Number of bills loaded:', billsData.length);
        
        setBills(billsData);
        console.log('Connected to Firebase and loaded bills into state');
        console.log('Current bills state:', billsData);
      } else {
        // Fallback to localStorage
        console.log('Using localStorage for bills');
        setBills(localStorageBills);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading bills:', err);
      // Fallback to localStorage on error
      setBills(localStorageBills);
      setConnected(false);
      setError(null); // Don't show error for fallback
    } finally {
      setLoading(false);
    }
  };

  // Save a bill to Firebase or localStorage
  const saveBillToStorage = async (bill: BillData) => {
    try {
      if (connected) {
        console.log('Saving bill to Firebase');
        await saveBillToFirebase(bill);
      } else {
        console.log('Saving bill to localStorage');
        // Save to localStorage
        const existingIndex = localStorageBills.findIndex(b => b.sNo === bill.sNo);
        let newSavedBills;
        if (existingIndex > -1) {
          newSavedBills = [...localStorageBills];
          newSavedBills[existingIndex] = bill;
        } else {
          newSavedBills = [...localStorageBills, bill];
        }
        setLocalStorageBills(newSavedBills);
        localStorage.setItem('savedBills', JSON.stringify(newSavedBills));
      }
      await loadBills(); // Refresh the bills list
      setError(null);
    } catch (err) {
      setError('Failed to save bill');
      console.error('Save bill error:', err);
      throw err;
    }
  };

  // Delete a bill from Firebase or localStorage
  const deleteBillFromStorage = async (sNo: string) => {
    try {
      if (connected) {
        await deleteBillFromFirebase(sNo);
      } else {
        // Delete from localStorage
        const newSavedBills = localStorageBills.filter(b => b.sNo !== sNo);
        setLocalStorageBills(newSavedBills);
        localStorage.setItem('savedBills', JSON.stringify(newSavedBills));
      }
      await loadBills(); // Refresh the bills list
      setError(null);
    } catch (err) {
      setError('Failed to delete bill');
      console.error('Delete bill error:', err);
      throw err;
    }
  };

  // Get next bill number
  const getNextBillNumberFromStorage = async (): Promise<string> => {
    try {
      if (connected) {
        const nextNumber = await getNextBillNumberFromFirebase();
        setError(null);
        return nextNumber;
      } else {
        // Fallback to localStorage-based bill number
        let nextSNo = '0001';
        if (localStorageBills.length > 0) {
          const maxSNo = Math.max(...localStorageBills.map(bill => parseInt(bill.sNo, 10)));
          nextSNo = String(maxSNo + 1).padStart(4, '0');
        }
        setError(null);
        return nextSNo;
      }
    } catch (err) {
      setError('Failed to get next bill number');
      console.error('Get next bill number error:', err);
      // Return default if there's an error
      return '0001';
    }
  };

  // Get bills by customer
  const getBillsByCustomerFromStorage = async (customerName: string): Promise<BillData[]> => {
    try {
      if (connected) {
        const customerBills = await getBillsByCustomerFromFirebase(customerName);
        setError(null);
        return customerBills;
      } else {
        // Fallback to localStorage
        const customerBills = localStorageBills.filter(bill => 
          bill.customerName.toLowerCase() === customerName.toLowerCase()
        );
        setError(null);
        return customerBills;
      }
    } catch (err) {
      setError('Failed to get bills for customer');
      console.error('Get bills by customer error:', err);
      return [];
    }
  };

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  // Log bills when they change
  useEffect(() => {
    console.log('Bills state updated:', bills);
    console.log('Number of bills in state:', bills.length);
  }, [bills]);

  return (
    <FirebaseContext.Provider
      value={{
        bills,
        loading,
        error,
        connected,
        initialize,
        saveBill: saveBillToStorage,
        deleteBill: deleteBillFromStorage,
        loadBills,
        getNextBillNumber: getNextBillNumberFromStorage,
        getBillsByCustomer: getBillsByCustomerFromStorage
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use the Firebase context
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};