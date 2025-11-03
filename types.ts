export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
}

export interface BillData {
  sNo: string;
  date: string;
  customerName: string;
  items: BillItem[];
  basket: number;
  luggage: number;
  oldBalance: number;
  paidAmount: number;
}
