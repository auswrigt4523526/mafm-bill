import React, { createContext, useContext, useEffect, useState } from 'react';
import { BillData } from '../types';
import { initializeDatabase, getAllBills, saveBill, deleteBill, getNextBillNumber, getBillsByCustomer } from '../services/database';

interface DatabaseContextType {
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

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // Initialize the database
  const initialize = async () => {
    try {
      setLoading(true);
      await initializeDatabase();
      setConnected(true);
      await loadBills();
      setError(null);
    } catch (err) {
      setError('Failed to initialize database');
      console.error('Database initialization error:', err);
      // Still set loading to false even if there's an error
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  // Load all bills from database
  const loadBills = async () => {
    try {
      setLoading(true);
      const billsData = await getAllBills();
      setBills(billsData);
      setError(null);
    } catch (err) {
      setError('Failed to load bills');
      console.error('Load bills error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save a bill to database
  const saveBillToDB = async (bill: BillData) => {
    try {
      await saveBill(bill);
      await loadBills(); // Refresh the bills list
      setError(null);
    } catch (err) {
      setError('Failed to save bill');
      console.error('Save bill error:', err);
      throw err;
    }
  };

  // Delete a bill from database
  const deleteBillFromDB = async (sNo: string) => {
    try {
      await deleteBill(sNo);
      await loadBills(); // Refresh the bills list
      setError(null);
    } catch (err) {
      setError('Failed to delete bill');
      console.error('Delete bill error:', err);
      throw err;
    }
  };

  // Get next bill number
  const getNextBillNumberFromDB = async (): Promise<string> => {
    try {
      const nextNumber = await getNextBillNumber();
      setError(null);
      return nextNumber;
    } catch (err) {
      setError('Failed to get next bill number');
      console.error('Get next bill number error:', err);
      // Return default if there's an error
      return '0001';
    }
  };

  // Get bills by customer
  const getBillsByCustomerFromDB = async (customerName: string): Promise<BillData[]> => {
    try {
      const customerBills = await getBillsByCustomer(customerName);
      setError(null);
      return customerBills;
    } catch (err) {
      setError('Failed to get bills for customer');
      console.error('Get bills by customer error:', err);
      return [];
    }
  };

  // Initialize database on mount
  useEffect(() => {
    initialize();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        bills,
        loading,
        error,
        connected,
        initialize,
        saveBill: saveBillToDB,
        deleteBill: deleteBillFromDB,
        loadBills,
        getNextBillNumber: getNextBillNumberFromDB,
        getBillsByCustomer: getBillsByCustomerFromDB
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

// Custom hook to use the database context
export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};