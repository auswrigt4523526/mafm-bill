import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// FIX: Import html2canvas to resolve 'Cannot find name' error.
import html2canvas from 'html2canvas';
import { BillData, BillItem } from './types';
import { PlusIcon, TrashIcon, DownloadIcon, ShareIcon } from './components/icons';
import Modal from './components/Modal';
import BillPreview from './components/BillPreview';
import { formatIndianCurrency, formatIndianNumber } from './utils/formatting';
import { DatabaseProvider, useDatabase } from './contexts/DatabaseContext';

// Hoisted FormInput to module scope to avoid remounts on each render
interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  align?: 'left' | 'center';
  formatAsIndianNumber?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', placeholder = '', align = 'left', formatAsIndianNumber = false }) => {
  const alignmentClass = align === 'center' ? 'text-center' : '';
  const isNumeric = type === 'number';
  const isCustomerName = label === 'Customer Name';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumeric && formatAsIndianNumber) {
      const rawValue = e.target.value.replace(/,/g, '');
      if (/^\d*\.?\d*$/.test(rawValue) || rawValue === '') {
        onChange({ target: { value: rawValue } } as any);
      }
    } else {
      onChange(e);
    }
  };
  
  const displayValue = isNumeric
    ? (Number(value) === 0 ? '' : (formatAsIndianNumber ? formatIndianNumber(Number(value)) : value))
    : value;

  return (
    <div className="flex-1 min-w-[120px]">
      <label className={`block text-sm font-medium text-gray-700 mb-1 font-bold ${alignmentClass}`}>{label}</label>
      <input
        type={isNumeric ? 'text' : type}
        inputMode={isNumeric ? 'decimal' : (isCustomerName ? 'text' : undefined)}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={isCustomerName ? 'name' : undefined}
        autoCorrect={isCustomerName ? 'off' : undefined}
        autoCapitalize={isCustomerName ? 'words' : undefined}
        spellCheck={isCustomerName ? 'false' : undefined}
        className={`w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black font-bold ${alignmentClass}`}
      />
    </div>
  );
};

const getInitialBillState = (nextSNo: string = '0001'): BillData => ({
  sNo: nextSNo,
  date: new Date().toISOString().split('T')[0],
  customerName: '',
  items: [{ id: Date.now().toString(), name: '', quantity: 0, rate: 0 }],
  basket: 0,
  luggage: 0,
  oldBalance: 0,
  paidAmount: 0,
});

function AppContent() {
  const { bills: savedBills, loading, error, connected, saveBill, deleteBill, loadBills, getNextBillNumber, getBillsByCustomer } = useDatabase();
  const [billData, setBillData] = useState<BillData>(getInitialBillState());
  const [modal, setModal] = useState<'none' | 'load' | 'share'>('none');
  const [toast, setToast] = useState('');
  const billPreviewRef = useRef<HTMLDivElement>(null);
  const [localStorageBills, setLocalStorageBills] = useState<BillData[]>([]);

  // Load bills from localStorage when database is not connected
  useEffect(() => {
    if (!connected) {
      try {
        const bills = localStorage.getItem('savedBills');
        const parsedBills = bills ? JSON.parse(bills) : [];
        setLocalStorageBills(parsedBills);
      } catch (error) {
        console.error('Could not parse saved bills from localStorage', error);
        setLocalStorageBills([]);
      }
    }
  }, [connected]);

  // Initialize with the first bill number
  useEffect(() => {
    const initializeBillNumber = async () => {
      try {
        const nextSNo = await getNextBillNumber();
        setBillData(getInitialBillState(nextSNo));
      } catch (err) {
        console.error('Error getting next bill number:', err);
        // Fallback to localStorage-based bill number
        let nextSNo = '0001';
        const allBills = connected ? savedBills : localStorageBills;
        if (allBills.length > 0) {
          const maxSNo = Math.max(...allBills.map(bill => parseInt(bill.sNo, 10)));
          nextSNo = String(maxSNo + 1).padStart(4, '0');
        }
        setBillData(getInitialBillState(nextSNo));
      }
    };
    
    const allBills = connected ? savedBills : localStorageBills;
    if (allBills.length === 0) {
      initializeBillNumber();
    }
  }, [savedBills.length, localStorageBills.length, connected]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleBillDataChange = useCallback(<K extends keyof BillData>(field: K, value: BillData[K]) => {
    // If customer name is being changed, look for previous bills from this customer
    if (field === 'customerName') {
      setBillData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Only auto-fill old balance if it's currently 0
        if (prev.oldBalance === 0 && typeof value === 'string' && value.trim() !== '') {
          // Find the most recent bill for this customer
          if (connected) {
            getBillsByCustomer(value).then(customerBills => {
              if (customerBills.length > 0) {
                // Sort by date to get the most recent bill
                customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const mostRecentBill = customerBills[0];
                
                // Calculate balance due from the most recent bill
                const subTotal = mostRecentBill.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
                const total = subTotal + Number(mostRecentBill.luggage);
                const balanceDue = total + Number(mostRecentBill.oldBalance) - Number(mostRecentBill.paidAmount);
                
                // Set the old balance to the previous bill's balance due
                setBillData(prevData => ({
                  ...prevData,
                  oldBalance: balanceDue
                }));
              }
            }).catch(err => {
              console.error('Error fetching customer bills:', err);
            });
          } else {
            // Fallback to localStorage
            const customerBills = localStorageBills.filter(bill => 
              bill.customerName.toLowerCase() === value.toLowerCase()
            );
            
            if (customerBills.length > 0) {
              // Sort by date to get the most recent bill
              customerBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const mostRecentBill = customerBills[0];
              
              // Calculate balance due from the most recent bill
              const subTotal = mostRecentBill.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
              const total = subTotal + Number(mostRecentBill.luggage);
              const balanceDue = total + Number(mostRecentBill.oldBalance) - Number(mostRecentBill.paidAmount);
              
              // Set the old balance to the previous bill's balance due
              setBillData(prevData => ({
                ...prevData,
                oldBalance: balanceDue
              }));
            }
          }
        }
        
        return newData;
      });
    } else {
      setBillData(prev => ({ ...prev, [field]: value }));
    }
  }, [getBillsByCustomer, connected, localStorageBills]);

  const handleItemChange = useCallback((id: string, field: keyof Omit<BillItem, 'id'>, value: string | number) => {
    setBillData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const addItem = useCallback(() => {
    setBillData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), name: '', quantity: 0, rate: 0 }],
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setBillData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  }, []);

  const calculations = useMemo(() => {
    const subTotal = billData.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const total = subTotal + Number(billData.luggage);
    const balanceDue = total + Number(billData.oldBalance) - Number(billData.paidAmount);
    return { subTotal, total, balanceDue };
  }, [billData]);

  const handleNewBill = () => {
    if (connected) {
      // Get the next bill number from the database
      getNextBillNumber().then(nextSNo => {
        setBillData(getInitialBillState(nextSNo));
        showToast('New bill created.');
      }).catch(err => {
        console.error('Error getting next bill number:', err);
        setBillData(getInitialBillState());
        showToast('New bill created.');
      });
    } else {
      // Fallback to localStorage-based bill number
      let nextSNo = '0001';
      if (localStorageBills.length > 0) {
        const maxSNo = Math.max(...localStorageBills.map(bill => parseInt(bill.sNo, 10)));
        nextSNo = String(maxSNo + 1).padStart(4, '0');
      }
      setBillData(getInitialBillState(nextSNo));
      showToast('New bill created.');
    }
  };

  const handleSaveBill = () => {
    if (connected) {
      saveBill(billData)
        .then(() => {
          showToast(`Bill ${billData.sNo} saved!`);
        })
        .catch(err => {
          console.error('Error saving bill:', err);
          showToast('Error saving bill.');
        });
    } else {
      // Fallback to localStorage
      try {
        const existingIndex = localStorageBills.findIndex(b => b.sNo === billData.sNo);
        let newSavedBills;
        if (existingIndex > -1) {
          newSavedBills = [...localStorageBills];
          newSavedBills[existingIndex] = billData;
        } else {
          newSavedBills = [...localStorageBills, billData];
        }
        setLocalStorageBills(newSavedBills);
        localStorage.setItem('savedBills', JSON.stringify(newSavedBills));
        showToast(`Bill ${billData.sNo} saved!`);
      } catch (err) {
        console.error('Error saving bill to localStorage:', err);
        showToast('Error saving bill.');
      }
    }
  };

  const handleLoadBill = (bill: BillData) => {
    setBillData(bill);
    setModal('none');
    showToast(`Bill ${bill.sNo} loaded.`);
  };

  const deleteSavedBill = (sNo: string) => {
    if (connected) {
      deleteBill(sNo)
        .then(() => {
          showToast(`Bill ${sNo} deleted.`);
        })
        .catch(err => {
          console.error('Error deleting bill:', err);
          showToast('Error deleting bill.');
        });
    } else {
      // Fallback to localStorage
      try {
        const newSavedBills = localStorageBills.filter(b => b.sNo !== sNo);
        setLocalStorageBills(newSavedBills);
        localStorage.setItem('savedBills', JSON.stringify(newSavedBills));
        showToast(`Bill ${sNo} deleted.`);
      } catch (err) {
        console.error('Error deleting bill from localStorage:', err);
        showToast('Error deleting bill.');
      }
    }
  }

  const generateImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (!billPreviewRef.current) return null;
    const canvas = await html2canvas(billPreviewRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    return canvas.toDataURL(`image/${format}`, 0.9);
  };
  
  const handleDownloadImage = async () => {
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `bill-${billData.sNo}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleShareImage = async () => {
    const dataUrl = await generateImage();
    if (dataUrl && navigator.share) {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `bill-${billData.sNo}.png`, { type: 'image/png' });

            await navigator.share({
                title: `Bill ${billData.sNo}`,
                text: `Bill for ${billData.customerName}`,
                files: [file],
            });
        } catch (error) {
            console.error('Error sharing:', error);
            showToast('Could not share image.');
        }
    } else {
        showToast('Web Share API not supported in your browser.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen font-sans text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bills...</p>
        </div>
      </div>
    );
  }

  // Use either database bills or localStorage bills
  const allBills = connected ? savedBills : localStorageBills;

  if (error) {
    return (
      <div className="bg-gray-100 min-h-screen font-sans text-gray-800 flex items-center justify-center">
        <div className="text-center p-4 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto max-w-2xl p-4 pb-28">
        <header className="text-center my-4">
          <h1 className="text-3xl font-bold text-gray-900">Quick Bill Generator</h1>
          <p className="text-gray-600">Create and share bills on the go.</p>
          <div className="mt-2 text-sm text-gray-500">
            Bills: {allBills.length} | Status: {connected ? 'Connected to database' : 'Using localStorage'}
          </div>
        </header>

        <main className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="S No" value={billData.sNo} onChange={e => handleBillDataChange('sNo', e.target.value)} />
            <div className="flex justify-end">
              <FormInput label="Date" type="date" value={billData.date} onChange={e => handleBillDataChange('date', e.target.value)} />
            </div>
          </div>
          <div>
            <FormInput label="Customer Name" value={billData.customerName} onChange={e => handleBillDataChange('customerName', e.target.value)} placeholder="Enter customer name" />
          </div>
          
          <div className="space-y-2">
            {billData.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-5 text-center">
                  {index === 0 && <label className="text-sm font-medium text-gray-700 font-bold">Items</label>}
                  <input type="text" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Items" className="w-full p-2 border border-gray-300 rounded-md bg-white text-black font-bold text-center" />
                </div>
                <div className="col-span-4 sm:col-span-2 text-center">
                  {index === 0 && <label className="text-sm font-medium text-gray-700 font-bold">Qty</label>}
                  <input type="text" inputMode="decimal" value={item.quantity === 0 ? '' : item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} placeholder="Qty" className="w-full p-2 border border-gray-300 rounded-md bg-white text-black font-bold text-center" />
                </div>
                <div className="col-span-4 sm:col-span-2 text-center">
                  {index === 0 && <label className="text-sm font-medium text-gray-700 font-bold">Rate</label>}
                  <input type="text" inputMode="decimal" value={item.rate === 0 ? '' : item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} placeholder="Rate" className="w-full p-2 border border-gray-300 rounded-md bg-white text-black font-bold text-center" />
                </div>
                <div className="col-span-4 sm:col-span-2 text-center sm:text-right">
                  {index === 0 && <label className="text-sm font-medium text-gray-700 font-bold">Amount</label>}
                  <p className="p-2 font-bold">{formatIndianCurrency(item.quantity * item.rate)}</p>
                </div>
              </div>
            ))}
            <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors">
                <PlusIcon /> Add Item
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t">
            <div className="space-y-2">
              <FormInput label="Basket" type="number" value={billData.basket} onChange={e => handleBillDataChange('basket', Number(e.target.value))} align="center" />
              <FormInput label="Luggage" type="number" value={billData.luggage} onChange={e => handleBillDataChange('luggage', Number(e.target.value))} align="center" formatAsIndianNumber />
              <FormInput label="Old Balance" type="number" value={billData.oldBalance} onChange={e => handleBillDataChange('oldBalance', Number(e.target.value))} align="center" formatAsIndianNumber />
              <FormInput label="Paid Amount" type="number" value={billData.paidAmount} onChange={e => handleBillDataChange('paidAmount', Number(e.target.value))} align="center" formatAsIndianNumber />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-baseline"><span className="text-gray-600">Sub Total:</span> <span className="font-semibold">{formatIndianCurrency(calculations.subTotal)}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-gray-600">Total:</span> <span className="font-semibold">{formatIndianCurrency(calculations.total)}</span></div>
              <div className="flex justify-between items-baseline text-xl font-bold text-indigo-600 pt-2 border-t"><span className="">Balance Due:</span> <span>{formatIndianCurrency(calculations.balanceDue)}</span></div>
            </div>
          </div>
        </main>
      </div>
      
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300">
            {toast}
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-2">
        <div className="container mx-auto max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <button onClick={handleNewBill} className="p-2 rounded-md bg-green-500 text-white font-semibold hover:bg-green-600">New Bill</button>
            <button onClick={handleSaveBill} className="p-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600">Save Bill</button>
            <button onClick={() => setModal('share')} className="p-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700">Share Bill</button>
            <button onClick={() => setModal('load')} className="p-2 rounded-md bg-orange-500 text-white font-semibold hover:bg-orange-600">Load Bill</button>
        </div>
      </footer>

      <Modal isOpen={modal === 'load'} onClose={() => setModal('none')} title="Load a Saved Bill">
        <div className="space-y-2">
          {allBills.length > 0 ? (
            allBills.map(bill => (
              <div key={bill.sNo} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                <div>
                  <p className="font-semibold">{bill.sNo} - {bill.customerName}</p>
                  <p className="text-sm text-gray-500">{bill.date}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleLoadBill(bill)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Load</button>
                  <button onClick={() => deleteSavedBill(bill.sNo)} className="p-2 text-red-500 hover:text-red-700" aria-label="Delete saved bill"><TrashIcon /></button>
                </div>
              </div>
            ))
          ) : (
            <p>No saved bills found.</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={modal === 'share'} onClose={() => setModal('none')} title="Share or Download Bill">
        <div className="space-y-4">
          <BillPreview ref={billPreviewRef} billData={billData} calculations={calculations} />
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
             <button onClick={handleDownloadImage} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                <DownloadIcon /> Download
            </button>
            {navigator.share && (
              <button onClick={handleShareImage} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                  <ShareIcon /> Share
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}

export default App;
