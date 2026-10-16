import { Menu, Bell, Search } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";

function Header({ onMenuClick }) {
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

        {/* User avatar */}
        <div className="ml-2 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary-700">U</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
