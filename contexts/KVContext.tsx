import React, { createContext, useContext, useEffect, useState } from 'react';
import { BillData } from '../types';
import { 
  saveBillToKV, 
  getBillFromKV, 
  getAllBillsFromKV, 
  deleteBillFromKV, 
  getNextBillNumberFromKV, 
  getBillsByCustomerFromKV 
} from '../services/kv';

interface KVContextType {
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

const KVContext = createContext<KVContextType | undefined>(undefined);

export const KVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false); // Will be set to true if KV works
  const [localStorageBills, setLocalStorageBills] = useState<BillData[]>([]);

  // Load bills from localStorage as fallback
  useEffect(() => {
    try {
      const bills = localStorage.getItem('savedBills');
      const parsedBills = bills ? JSON.parse(bills) : [];
      setLocalStorageBills(parsedBills);
    } catch (error) {
      console.error('Could not parse saved bills from localStorage', error);
      setLocalStorageBills([]);
    }
  }, []);

  // Initialize by loading bills
  const initialize = async () => {
    try {
      setLoading(true);
      await loadBills();
      setError(null);
    } catch (err) {
      setError('Failed to initialize storage');
      console.error('Storage initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load all bills from KV or localStorage
  const loadBills = async () => {
    try {
      setLoading(true);
      const billsData = await getAllBillsFromKV();
      if (billsData.length > 0) {
        setBills(billsData);
        setConnected(true);
      } else {
        // Fallback to localStorage
        setBills(localStorageBills);
        setConnected(false);
      }
      setError(null);
    } catch (err) {
      // Fallback to localStorage on error
      setBills(localStorageBills);
      setConnected(false);
      setError(null); // Don't show error for fallback
    } finally {
      setLoading(false);
    }
  };

  // Save a bill to KV or localStorage
  const saveBillToStorage = async (bill: BillData) => {
    try {
      if (connected) {
        await saveBillToKV(bill);
      } else {
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

  // Delete a bill from KV or localStorage
  const deleteBillFromStorage = async (sNo: string) => {
    try {
      if (connected) {
        await deleteBillFromKV(sNo);
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
        const nextNumber = await getNextBillNumberFromKV();
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
        const customerBills = await getBillsByCustomerFromKV(customerName);
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

  return (
    <KVContext.Provider
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
    </KVContext.Provider>
  );
};

// Custom hook to use the KV context
export const useKV = (): KVContextType => {
  const context = useContext(KVContext);
  if (context === undefined) {
    throw new Error('useKV must be used within a KVProvider');
  }
  return context;
};