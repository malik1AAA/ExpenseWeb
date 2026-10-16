import { Menu, Bell, Search, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../common/ThemeToggle";

function Header({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 bg-surface-100 border-b border-surface-200 shadow-sm transition-colors">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-surface-200 transition-colors mr-3"
      >
        <Menu className="w-5 h-5 text-surface-600" />
      </button>

      {/* Page title area */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-surface-800 hidden sm:block">
          Personal Finance Manager
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Search */}
        <button className="p-2 rounded-lg hover:bg-surface-200 transition-colors text-surface-500 hover:text-surface-700">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-200 transition-colors text-surface-500 hover:text-surface-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {getUserInitials()}
              </span>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-surface-900 rounded-lg shadow-lg border border-surface-200 z-50">
                {/* User info */}
                <div className="p-4 border-b border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {user?.email || "User"}
                      </p>
                      <p className="text-xs text-surface-500">
                        Signed in
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
