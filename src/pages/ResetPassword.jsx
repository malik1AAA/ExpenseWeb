import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/common';
import AuthLayout from '../components/auth/AuthLayout';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const result = await resetPassword(email);

    if (result.success) {
      setSuccessMessage(
        'Password reset link sent! Please check your email for instructions to reset your password.'
      );
      setLoading(false);
    } else {
      setError(result.error || 'Failed to send reset email. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
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

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
          icon={Mail}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
