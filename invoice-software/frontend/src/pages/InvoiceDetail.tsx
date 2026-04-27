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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
            <strong>{invoice.user?.name || 'InvoicePro User'}</strong>
            <p>{invoice.user?.email || 'Email not provided'}</p>
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
