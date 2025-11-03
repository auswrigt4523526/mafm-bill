import React from 'react';
import { BillData, BillItem } from '../types';
import { formatIndianCurrency, formatIndianNumber } from '../utils/formatting';

interface BillPreviewProps {
  billData: BillData;
  calculations: {
    subTotal: number;
    total: number;
    balanceDue: number;
  }
}

const BillPreview = React.forwardRef<HTMLDivElement, BillPreviewProps>(({ billData, calculations }, ref) => {
  const minRows = 8;
  const itemsToRender: BillItem[] = [...billData.items];

  while (itemsToRender.length < minRows) {
    itemsToRender.push({
      id: `empty-${itemsToRender.length}`,
      name: '',
      quantity: 0,
      rate: 0
    });
  }

  return (
    <div ref={ref} className="bg-white p-4 text-black w-full text-sm">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-red-700 font-dancing-script">Baba Flower Mart</h1>
        <p className="text-xs text-green-800">S No 4 Guddi Malkapur Hyderabad Telangana</p>
        <p className="text-xs text-green-800">5-2-22/A/38/36 New Osmangunj Hyderabad Telai</p>
        <p className="text-xs text-green-800">Phone No: 9849078633</p>
      </div>

      <table className="w-full border-collapse border border-black mb-2">
        <tbody>
          <tr>
            <td className="border border-black border-r-0 p-3 font-bold">
              <div className="flex items-center h-8"><strong>S No:</strong> {billData.sNo}</div>
            </td>
            <td className="border border-black border-l-0 p-1 text-right font-bold">
              <div className="flex items-center justify-end h-8"><strong>Date:</strong> {billData.date}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-black p-1">
              <div className="flex items-center gap-2 h-8"><strong>To:</strong> <span className="font-bold">{billData.customerName}</span></div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black mb-2">
        <thead>
          <tr className="bg-white text-black">
            <th className="border border-black p-1 font-bold">
              <div className="flex items-center justify-center h-8">Items</div>
            </th>
            <th className="border border-black p-1 font-bold">
              <div className="flex items-center justify-center h-8">Qty</div>
            </th>
            <th className="border border-black p-1 font-bold">
              <div className="flex items-center justify-center h-8">Rate</div>
            </th>
            <th className="border border-black p-1 font-bold">
              <div className="flex items-center justify-center h-8">Amount</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {itemsToRender.map((item) => (
            <tr key={item.id}>
              <td className="border border-black p-1 h-10">
                <div className="flex items-center justify-center h-8 font-bold">{item.name || '\u00A0'}</div>
              </td>
              <td className="border border-black p-1">
                <div className="flex items-center justify-center h-8 font-bold">{item.quantity ? formatIndianNumber(item.quantity) : ''}</div>
              </td>
              <td className="border border-black p-1">
                <div className="flex items-center justify-center h-8 font-bold">{item.rate ? formatIndianCurrency(item.rate) : ''}</div>
              </td>
              <td className="border border-black p-1">
                <div className="flex items-center justify-center h-8 font-bold">{(item.quantity && item.rate) ? formatIndianCurrency(item.quantity * item.rate) : ''}</div>
              </td>
            </tr>
          ))}
      </tbody>
      </table>
      
      <div className="flex justify-end">
        <table className="w-1/2 border-collapse border border-black">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold">
                <div className="flex items-center justify-center h-8">Sub Total</div>
              </td>
              <td className="border border-black p-1 text-right font-bold">
                <div className="flex items-center justify-end h-8">{formatIndianCurrency(calculations.subTotal)}</div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">
                <div className="flex items-center justify-center h-8">Luggage</div>
              </td>
              <td className="border border-black p-1 text-right font-bold">
                <div className="flex items-center justify-end h-8">{formatIndianCurrency(billData.luggage)}</div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold bg-white text-black">
                <div className="flex items-center justify-center h-8">Total Rs</div>
              </td>
              <td className="border border-black p-1 text-right font-bold">
                <div className="flex items-center justify-end h-8">{formatIndianCurrency(calculations.total)}</div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">
                <div className="flex items-center justify-center h-8">Old Balance</div>
              </td>
              <td className="border border-black p-1 text-right font-bold">
                <div className="flex items-center justify-end h-8">{formatIndianCurrency(billData.oldBalance)}</div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">
                <div className="flex items-center justify-center h-8">Paid Amount</div>
              </td>
              <td className="border border-black p-1 text-right font-bold">
                <div className="flex items-center justify-end h-8">{formatIndianCurrency(billData.paidAmount)}</div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold bg-white text-black">
                <div className="flex items-center justify-center h-8">Balance Due</div>
              </td>
              <td className="border border-black p-1 text-right font-bold">
                <div className="flex items-center justify-end h-8">{formatIndianCurrency(calculations.balanceDue)}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-12 flex justify-between text-xs">
          <p className="border-t border-black pt-1">Receiver Signature</p>
          <p className="border-t border-black pt-1">Authorized Signature</p>
      </div>

    </div>
  );
});

export default BillPreview;
