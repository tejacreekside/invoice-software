import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, profileApi, setAuthToken } from '../api';
import { useAuth } from '../auth';
import Card from '../components/ui/Card';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await authApi.signup(email, password, name);
      const token = response.data.token;
      setAuthToken(token);
      setToken(token);

      // Fetch user profile
      const profileResponse = await profileApi.getProfile();
      setUser(profileResponse.data.user);

      navigate('/invoices');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-card-copy">
          <span className="eyebrow">Get started</span>
          <h1>Create your account</h1>
          <p>Join InvoicePro to manage your invoices, customers, and products from one intuitive dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <FormField label="Full name">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </FormField>
          {error && <div className="error-message">{error}</div>}
          <Button type="submit" variant="primary" fullWidth>
            Create account
          </Button>
        </form>
        <p className="hint">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}