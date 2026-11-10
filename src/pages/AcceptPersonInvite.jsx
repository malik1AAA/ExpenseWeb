import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useFinance } from '../hooks/useFinance';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/common';

export default function AcceptPersonInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshData } = useFinance();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    const accept = async () => {
      if (!token) {
        setError('This invitation link is missing its token.');
        return;
      }
      setIsAccepting(true);
      const { error: invokeError } = await supabase.functions.invoke('invite-person', {
        body: { action: 'accept', token },
      });
      if (!active) return;
      if (invokeError) {
        setError(invokeError.message || 'This invitation could not be accepted.');
        setIsAccepting(false);
        return;
      }
      await refreshData();
      if (!active) return;
      navigate('/debts', { replace: true });
    };
    accept();
    return () => { active = false; };
  }, [navigate, refreshData, token]);

  return (
    <AuthLayout title="Link ExpenseWeb account" subtitle="Confirm the invitation using the verified email it was sent to.">
      {isAccepting && <p className="text-sm text-surface-600">Confirming invitation…</p>}
      {error && (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <p className="text-sm text-surface-600">If you are not signed in, sign in with the invited, verified email and reopen this invitation link.</p>
          <Button type="button" variant="secondary" className="w-full" onClick={() => navigate('/login', { state: { from: { pathname: '/link-person', search: `?token=${encodeURIComponent(token || '')}` } } })}>
            Go to sign in
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
