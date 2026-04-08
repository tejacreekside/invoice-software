import { useEffect, useState, useRef } from 'react';
import { picturedInvoicesApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';

interface PicturedInvoice {
  id: string;
  fileName: string;
  filePath: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  status: string;
  createdAt: string;
}

export default function PicturedInvoicesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picturedInvoices, setPicturedInvoices] = useState<PicturedInvoice[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPicturedInvoices();
  }, []);

  const loadPicturedInvoices = async () => {
    try {
      const response = await picturedInvoicesApi.list();
      setPicturedInvoices(response.data.picturedInvoices);
    } catch (error) {
      setError('Failed to load pictured invoices');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG or PNG)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('invoice', file);

      await picturedInvoicesApi.upload(formData);
      setSuccess('Invoice uploaded successfully! Processing will begin shortly.');
      loadPicturedInvoices(); // Refresh the list
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to upload invoice');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `$${amount.toFixed(2)}` : '—';
  };

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : '—';
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Pictured Invoices</h1>
          <p>Upload invoice images and automatically extract key information using OCR.</p>
        </div>
      </div>

      <div className="panel-grid">
        <Card title="Upload invoice image" description="Select a clear photo of your invoice for automatic data extraction." className="panel">
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            <button
              type="button"
              className="upload-button-trigger"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose invoice image'}
            </button>
            <p className="upload-hint">Supported formats: JPEG, PNG (max 10MB)</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </Card>

        <Card title="Processed invoices" className="panel full-width">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>File Name</th>
                  <th>Vendor</th>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {picturedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No pictured invoices yet. Upload your first invoice image above.</td>
                  </tr>
                ) : (
                  picturedInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <img
                          src={`http://localhost:3000${invoice.filePath}`}
                          alt="Invoice"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      </td>
                      <td>{invoice.fileName}</td>
                      <td>{invoice.vendorName || '—'}</td>
                      <td>{invoice.invoiceNumber || '—'}</td>
                      <td>{formatDate(invoice.invoiceDate)}</td>
                      <td>{formatCurrency(invoice.totalAmount)}</td>
                      <td>
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
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