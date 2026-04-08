import { useEffect, useState } from 'react';
import { productApi } from '../api';
import { Product } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

const initialForm = {
  name: '',
  description: '',
  unitPrice: '0',
  quantity: '0',
  sku: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productApi.list().then((response) => setProducts(response.data)).catch(() => setError('Could not load products'));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await productApi.create({
        name: form.name,
        description: form.description || undefined,
        unitPrice: Number(form.unitPrice),
        quantity: Number(form.quantity),
        sku: form.sku || undefined,
      });
      setProducts((current) => [response.data, ...current]);
      setForm(initialForm);
      setSuccess('Product added successfully.');
      setError(null);
    } catch {
      setError('Failed to create product');
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage items or services available for invoicing.</p>
        </div>
      </div>
      <div className="panel-grid">
        <Card title="Create product" description="Add a new product or service for billing." className="panel">
          <form onSubmit={handleSubmit} className="form-grid">
            <FormField label="Name">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </FormField>
            <FormField label="SKU" optional>
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
            </FormField>
            <FormField label="Unit price">
              <input type="number" min="0" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} required />
            </FormField>
            <FormField label="Quantity">
              <input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            </FormField>
            <FormField label="Description" optional className="full-width">
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </FormField>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save product'}
            </Button>
          </form>
        </Card>
        <Card title="Product list" className="panel full-width">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No products yet.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku || '—'}</td>
                      <td>${product.unitPrice.toFixed(2)}</td>
                      <td>{product.quantity}</td>
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
