import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/common';
import AuthLayout from '../components/auth/AuthLayout';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your FinanceFlow account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Email */}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        {/* Password */}
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {/* Forgot password link */}
        <div className="text-right">
          <Link
            to="/reset-password"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
          icon={LogIn}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
