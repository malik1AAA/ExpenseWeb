import { Link, useLocation } from 'react-router-dom';
import { Wallet } from 'lucide-react';

/**
 * AuthLayout - Layout for authentication pages (login, signup, etc.)
 * Provides a centered card layout without sidebar
 */
export default function AuthLayout({ children, title, subtitle }) {
  const location = useLocation();
  
  // Determine which links to show based on current page
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const isResetPassword = location.pathname === '/reset-password';

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 transition-colors">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900">FinanceFlow</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 p-8">
            {title && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-surface-500 mt-2">{subtitle}</p>
                )}
              </div>
            )}
            
            {children}
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-surface-600">
            {isLogin && (
              <>
                <p>
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign up
                  </Link>
                </p>
                <p className="mt-2">
                  <Link to="/reset-password" className="text-surface-500 hover:text-surface-700">
                    Forgot your password?
                  </Link>
                </p>
              </>
            )}

            {isSignup && (
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            )}

            {isResetPassword && (
              <p>
                Remember your password?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 text-center text-xs text-surface-500">
        <p>© 2024 FinanceFlow. Secure personal finance management.</p>
      </footer>
    </div>
  );
}
