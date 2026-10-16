import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/common';
import AuthLayout from '../components/auth/AuthLayout';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signUp(email, password);

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          'Account created! Please check your email to confirm your account before signing in.'
        );
        setLoading(false);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.error || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your finances with FinanceFlow"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success message */}
        {successMessage && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

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
          autoComplete="new-password"
          helperText="Must be at least 6 characters"
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
          icon={UserPlus}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>

        {/* Terms */}
        <p className="text-xs text-surface-500 text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
