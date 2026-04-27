import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoiceApi } from '../api';
import { Invoice } from '../types';
import Card from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoiceApi.list().then((response: any) => setInvoices(response.data)).catch(() => setError('Could not load invoices'));
  }, []);

  const summary = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((invoice) => invoice.status.toLowerCase() === 'paid').length;
    const overdue = invoices.filter((invoice) => invoice.status.toLowerCase() === 'overdue').length;
    const amountDue = invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);
    return { total, paid, overdue, amountDue };
  }, [invoices]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>Review invoice summaries, status, and amounts due.</p>
        </div>
        <Link to="/invoices/create" className="button button-primary create-invoice-button">
          Create Invoice
        </Link>
      </div>
      <div className="dashboard-grid">
        <Card className="metric-card">
          <span>Total invoices</span>
          <strong>{summary.total}</strong>
        </Card>
        <Card className="metric-card">
          <span>Paid</span>
          <strong>{summary.paid}</strong>
        </Card>
        <Card className="metric-card">
          <span>Overdue</span>
          <strong>{summary.overdue}</strong>
        </Card>
        <Card className="metric-card">
          <span>Balance due</span>
          <strong>${summary.amountDue.toFixed(2)}</strong>
        </Card>
      </div>
      <Card className="panel full-width">
        {error && <div className="error-message">{error}</div>}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Due</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>No invoices found.</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.customer.name}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td>${invoice.total.toFixed(2)}</td>
                    <td>${invoice.balanceDue.toFixed(2)}</td>
                    <td>
                      <Link to={`/invoices/${invoice.id}`} className="table-action-link">
                        View bill
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
