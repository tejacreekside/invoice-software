import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { invoiceApi } from '../api';
import { Invoice } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';

function formatCurrency(value: number | undefined): string {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function formatAddress(invoice: Invoice): string {
  const parts = [
    invoice.customer.address,
    invoice.customer.city,
    invoice.customer.state,
    invoice.customer.zipCode,
    invoice.customer.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address not provided';
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Invoice ID is missing.');
      setLoading(false);
      return;
    }

    invoiceApi
      .get(id)
      .then((response) => setInvoice(response.data))
      .catch(() => setError('Could not load this invoice.'))
      .finally(() => setLoading(false));
  }, [id]);

  const paymentLabel = useMemo(() => {
    if (!invoice) return '';
    if (invoice.balanceDue <= 0) return 'Paid in full';
    return `Due by ${formatDate(invoice.dueDate)}`;
  }, [invoice]);

  const refreshInvoice = async () => {
    if (!id) return;
    const response = await invoiceApi.get(id);
    setInvoice(response.data);
  };

  const handleStatusChange = async (status: string) => {
    if (!invoice) return;
    setSavingAction(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await invoiceApi.updateStatus(invoice.id, status);
      setInvoice(response.data);
      await refreshInvoice();
      setSuccess(`Invoice marked ${status}.`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Could not update invoice status.');
    } finally {
      setSavingAction(false);
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoice) return;
    setSavingAction(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await invoiceApi.addPayment(invoice.id, Number(paymentAmount));
      setInvoice(response.data);
      await refreshInvoice();
      setPaymentAmount('');
      setSuccess('Payment recorded.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Could not record payment.');
    } finally {
      setSavingAction(false);
    }
  };

  if (loading) {
    return <div className="page-shell">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="page-shell">
        <div className="error-message">{error || 'Invoice not found.'}</div>
        <Link to="/invoices" className="button button-secondary">
          Back to invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell invoice-detail-page">
      <div className="page-header invoice-screen-actions">
        <div>
          <h1>{invoice.invoiceNumber}</h1>
          <p>Review the full bill, then print or save it as a PDF.</p>
        </div>
        <div className="invoice-action-row">
          <Link to="/invoices" className="button button-secondary">
            Back
          </Link>
          <Button type="button" variant="primary" onClick={() => window.print()}>
            Print invoice
          </Button>
        </div>
      </div>

      <section className="invoice-management-panel invoice-screen-actions">
        <div>
          <h2>Invoice controls</h2>
          <p>Update status or record a customer payment.</p>
        </div>
        <div className="invoice-control-grid">
          <div className="invoice-status-actions">
            <Button type="button" variant="secondary" disabled={savingAction || invoice.status !== 'draft'} onClick={() => handleStatusChange('sent')}>
              Mark sent
            </Button>
            <Button type="button" variant="ghost" disabled={savingAction || invoice.status === 'cancelled' || invoice.status === 'paid'} onClick={() => handleStatusChange('cancelled')}>
              Cancel invoice
            </Button>
          </div>
          <form onSubmit={handlePaymentSubmit} className="invoice-payment-form">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Payment amount"
              disabled={savingAction || invoice.balanceDue <= 0 || invoice.status === 'cancelled'}
              required
            />
            <Button type="submit" variant="primary" disabled={savingAction || invoice.balanceDue <= 0 || invoice.status === 'cancelled'}>
              Record payment
            </Button>
          </form>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </section>

      <article className="invoice-document" aria-label={`Invoice ${invoice.invoiceNumber}`}>
        <header className="invoice-document-header">
          <div>
            <div className="invoice-brand-name">InvoicePro</div>
            <div className="invoice-muted">Professional invoice</div>
          </div>
          <div className="invoice-title-block">
            <div className="invoice-title">Invoice</div>
            <div className="invoice-number">{invoice.invoiceNumber}</div>
            <StatusBadge status={invoice.status} />
          </div>
        </header>

        <section className="invoice-meta-grid">
          <div className="invoice-party">
            <span>Bill from</span>
            <strong>{invoice.user?.businessName || invoice.user?.name || 'InvoicePro User'}</strong>
            <p>{invoice.user?.businessEmail || invoice.user?.email || 'Email not provided'}</p>
            {invoice.user?.businessPhone && <p>{invoice.user.businessPhone}</p>}
            {invoice.user?.businessAddress && <p>{invoice.user.businessAddress}</p>}
          </div>
          <div className="invoice-party">
            <span>Bill to</span>
            <strong>{invoice.customer.name}</strong>
            <p>{invoice.customer.email || 'Email not provided'}</p>
            <p>{invoice.customer.phone || 'Phone not provided'}</p>
            <p>{formatAddress(invoice)}</p>
          </div>
          <div className="invoice-dates">
            <div>
              <span>Issued</span>
              <strong>{formatDate(invoice.issueDate)}</strong>
            </div>
            <div>
              <span>Due</span>
              <strong>{formatDate(invoice.dueDate)}</strong>
            </div>
          </div>
        </section>

        <section className="invoice-items-section">
          <table className="invoice-print-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id || `${item.productId}-${item.quantity}-${item.unitPrice}`}>
                  <td>{item.product?.name || 'Invoice item'}</td>
                  <td>{item.product?.description || item.product?.sku || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.lineTotal || item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="invoice-bottom-grid">
          <div className="invoice-notes">
            <span>Notes</span>
            <p>{invoice.notes || 'Thank you for your business.'}</p>
          </div>
          <div className="invoice-totals-card">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(invoice.subtotal)}</strong>
            </div>
            <div>
              <span>Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
              <strong>{formatCurrency(invoice.taxAmount)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>{formatCurrency(invoice.discountAmount)}</strong>
            </div>
            <div>
              <span>Amount paid</span>
              <strong>{formatCurrency(invoice.amountPaid)}</strong>
            </div>
            <div className="invoice-grand-total">
              <span>Balance due</span>
              <strong>{formatCurrency(invoice.balanceDue)}</strong>
            </div>
          </div>
        </section>

        <footer className="invoice-document-footer">
          <strong>{paymentLabel}</strong>
          <span>Generated by InvoicePro</span>
        </footer>
      </article>
    </div>
  );
}
