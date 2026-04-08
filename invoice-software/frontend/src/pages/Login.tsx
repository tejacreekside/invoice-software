import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, profileApi, setAuthToken } from '../api';
import { useAuth } from '../auth';
import Card from '../components/ui/Card';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await authApi.login(email, password);
      const token = response.data.token;
      setAuthToken(token);
      setToken(token);

      // Fetch user profile
      const profileResponse = await profileApi.getProfile();
      setUser(profileResponse.data.user);

      navigate('/invoices');
    } catch {
      setError('Login failed. Please check your email and password.');
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-card-copy">
          <span className="eyebrow">Secure access</span>
          <h1>Sign in to InvoicePro</h1>
          <p>Access your invoices, customers, and product catalog from one intuitive dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <FormField label="Email">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </FormField>
          <FormField label="Password">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </FormField>
          {error && <div className="error-message">{error}</div>}
          <Button type="submit" variant="primary" fullWidth>
            Sign in
          </Button>
        </form>
        <p className="hint">Don't have an account? <Link to="/signup">Sign up here</Link></p>
      </Card>
    </div>
  );
}
