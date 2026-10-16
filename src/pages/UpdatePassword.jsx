import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/common';
import AuthLayout from '../components/auth/AuthLayout';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user has a recovery session
  useEffect(() => {
    // If there's no user, they might not have a valid recovery token
    // Supabase will have set the session from the URL hash
    if (!user) {
      // Give it a moment to load
      const timer = setTimeout(() => {
        if (!user) {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

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

    const result = await updatePassword(password);

    if (result.success) {
      setSuccessMessage('Password updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } else {
      setError(result.error || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Update your password"
      subtitle="Enter your new password below"
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

        {/* New Password */}
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          helperText="Must be at least 6 characters"
        />

        {/* Confirm New Password */}
        <Input
          label="Confirm New Password"
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
          disabled={loading || !user}
          icon={KeyRound}
        >
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
