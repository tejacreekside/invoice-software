import { useEffect, useMemo, useState } from 'react';
import { customerApi, invoiceApi, productApi } from '../api';
import { Customer, Product, InvoiceItem } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

const initialItem = { productId: '', quantity: 1, unitPrice: 0 };

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default function CreateInvoicePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState('0.08');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ ...initialItem }]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.list().then((response) => setCustomers(response.data)).catch(() => setError('Could not load customers'));
    productApi.list().then((response) => setProducts(response.data)).catch(() => setError('Could not load products'));
  }, []);

  const validLineItems = useMemo(
    () => items.filter((item) => item.productId.trim().length > 0 && item.quantity > 0),
    [items]
  );

  const lineItemTotals = useMemo(
    () => validLineItems.map((item) => roundToTwo(item.quantity * item.unitPrice)),
    [validLineItems]
  );

  const subtotal = useMemo(
    () => roundToTwo(lineItemTotals.reduce((sum, value) => sum + value, 0)),
    [lineItemTotals]
  );

  const taxAmount = useMemo(() => roundToTwo(subtotal * Number(taxRate)), [subtotal, taxRate]);
  const total = useMemo(() => roundToTwo(subtotal + taxAmount - Number(discountAmount)), [subtotal, taxAmount, discountAmount]);
  const balanceDue = useMemo(() => Math.max(0, total), [total]);

  const canSubmit = customers.length > 0 && products.length > 0 && customerId !== '' && validLineItems.length === items.length;

  const handleItemChange = (index: number, data: Partial<InvoiceItem>) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...data } : item)));
  };

  const handleAddItem = () => setItems((current) => [...current, { ...initialItem }]);

  const handleRemoveItem = (index: number) => setItems((current) => current.filter((_, i) => i !== index));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const payload = {
        customerId,
        issueDate,
        dueDate,
        items: validLineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
        taxRate: Number(taxRate),
        discountAmount: Number(discountAmount),
        notes: notes || undefined,
      };

      await invoiceApi.create(payload);
      setSuccess('Invoice created successfully.');
      setCustomerId('');
      setItems([{ ...initialItem }]);
      setNotes('');
      setDiscountAmount('0');
      setTaxRate('0.08');
    } catch (caught) {
      setError('Failed to create invoice. Please verify required fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Create Invoice</h1>
          <p>Build a new invoice with customers, line items, tax, and discounts.</p>
        </div>
      </div>
      <Card className="panel full-width">
        <form onSubmit={handleSubmit} className="form-grid invoice-form">
          <div className="grid-two-columns">
            <FormField label="Customer">
              <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Issue date">
              <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
            </FormField>
            <FormField label="Due date">
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
            </FormField>
          </div>
          <div className="line-items">
            <div className="section-heading">
              <div>
                <h2>Line items</h2>
                <p>Add products and quantities for this invoice.</p>
              </div>
              <Button type="button" variant="secondary" onClick={handleAddItem}>
                Add line item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="line-item-row">
                <FormField label="Product">
                  <select
                    value={item.productId}
                    onChange={(event) => {
                      const selected = products.find((product) => product.id === event.target.value);
                      handleItemChange(index, {
                        productId: event.target.value,
                        unitPrice: selected?.unitPrice || 0,
                      });
                    }}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => handleItemChange(index, { quantity: Math.max(1, Number(event.target.value)) })}
                    required
                  />
                </FormField>
                <FormField label="Unit price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => handleItemChange(index, { unitPrice: Math.max(0, Number(event.target.value)) })}
                    required
                  />
                </FormField>
                <div className="line-item-total">
                  <span>Total</span>
                  <strong>${roundToTwo(item.quantity * item.unitPrice).toFixed(2)}</strong>
                </div>
                <Button type="button" variant="ghost" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="grid-two-columns">
            <FormField label="Tax rate">
              <input type="number" min="0" max="1" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} required />
            </FormField>
            <FormField label="Discount amount">
              <input type="number" min="0" step="0.01" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} required />
            </FormField>
          </div>
          <FormField label="Notes" optional>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </FormField>
          <div className="invoice-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span>${Number(discountAmount).toFixed(2)}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <div className="summary-row balance-row">
              <span>Balance due</span>
              <strong>${balanceDue.toFixed(2)}</strong>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <Button type="submit" variant="primary" disabled={saving || !canSubmit}>
            {saving ? 'Creating...' : 'Create Invoice'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
