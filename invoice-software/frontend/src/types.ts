export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  quantity: number;
  sku?: string | null;
}

export interface InvoiceItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  user?: {
    id: string;
    email: string;
    name: string;
    businessName?: string | null;
    businessEmail?: string | null;
    businessPhone?: string | null;
    businessAddress?: string | null;
  };
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string | null;
  items: InvoiceItem[];
}
