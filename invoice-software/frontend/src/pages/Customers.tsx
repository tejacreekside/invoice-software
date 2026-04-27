import { useEffect, useState } from 'react';
import { customerApi } from '../api';
import { Customer } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.list().then((response) => setCustomers(response.data)).catch(() => setError('Could not load customers'));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await customerApi.create({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        country: form.country || undefined,
      });
      setCustomers((current) => [response.data, ...current]);
      setForm(initialForm);
      setSuccess('Customer added successfully.');
      setError(null);
    } catch {
      setError('Failed to create customer');
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage customer records for invoices and billing.</p>
        </div>
      </div>
      <div className="panel-grid">
        <Card title="Create customer" description="Add a new client profile to your billing workspace." className="panel">
          <form onSubmit={handleSubmit} className="form-grid">
            <FormField label="Name">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </FormField>
            <FormField label="Email" optional>
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </FormField>
            <FormField label="Phone" optional>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </FormField>
            <FormField label="Address" optional>
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </FormField>
            <FormField label="City" optional>
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </FormField>
            <FormField label="State" optional>
              <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
            </FormField>
            <FormField label="ZIP" optional>
              <input value={form.zipCode} onChange={(event) => setForm({ ...form, zipCode: event.target.value })} />
            </FormField>
            <FormField label="Country" optional>
              <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            </FormField>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save customer'}
            </Button>
          </form>
        </Card>
        <Card title="Customer list" className="panel full-width">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No customers yet.</td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.email || '—'}</td>
                      <td>{customer.phone || '—'}</td>
                      <td>{[customer.address, customer.city, customer.state, customer.zipCode, customer.country].filter(Boolean).join(', ') || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
