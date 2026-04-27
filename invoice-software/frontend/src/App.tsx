import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CustomersPage from './pages/Customers';
import ProductsPage from './pages/Products';
import InvoicesPage from './pages/Invoices';
import CreateInvoicePage from './pages/CreateInvoice';
import InvoiceDetailPage from './pages/InvoiceDetail';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import PicturedInvoicesPage from './pages/PicturedInvoices';
import ProfilePage from './pages/Profile';
import { AuthProvider, useAuth } from './auth';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/invoices" replace />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="invoices/create" element={<CreateInvoicePage />} />
          <Route path="pictured-invoices" element={<PicturedInvoicesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
