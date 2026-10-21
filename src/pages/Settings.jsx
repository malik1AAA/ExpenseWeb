import {
  Settings as SettingsIcon,
  FileSpreadsheet,
  Palette,
  Globe,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
} from "lucide-react";
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SequentialImportManager, CategoryManager, DataIntegrityChecker, MigrationManager } from '../components/settings';

function Settings() {
  const { theme, setTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(false);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'Export All Data':
        // Scroll to ExcelManager section where export is available
        const excelSection = document.getElementById('excel-manager-section');
        if (excelSection) {
          excelSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'Import from Excel':
        // Scroll to ExcelManager section
        const importSection = document.getElementById('excel-manager-section');
        if (importSection) {
          importSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'Privacy Settings':
        // TODO: Implement privacy settings modal
        alert('Privacy Settings: This feature is coming soon. Your data is stored securely in Supabase with row-level security.');
        break;
      case 'Notifications':
        // TODO: Implement notification settings
        alert('Notification Settings: This feature is coming soon. You will be able to configure alerts for overdue debts and other events.');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Settings</h2>
        <p className="text-surface-500 mt-1">
          Configure your finance manager preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Excel Data Management */}
          <div id="excel-manager-section">
            <SequentialImportManager />
          </div>

          {/* Category Management */}
          <CategoryManager />

          {/* Data Integrity Checker */}
          <DataIntegrityChecker />

          {/* Migration Manager */}
          <MigrationManager />

          {/* Appearance */}
          <div className="bg-white rounded-xl border border-surface-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-50">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-800">
                  Appearance
                </h3>
                <p className="text-sm text-surface-500">
                  Customize the look and feel
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-700">Theme</span>
                <select 
                  value={theme}
                  onChange={handleThemeChange}
                  className="px-3 py-1.5 border border-surface-200 rounded-lg text-sm text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-700">Compact Mode</span>
                <button 
                  onClick={() => setCompactMode(!compactMode)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    compactMode ? 'bg-primary-500' : 'bg-surface-200'
                  }`}
                >
                  <span 
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      compactMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-800 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { icon: Download, label: "Export All Data", color: "text-blue-600" },
                { icon: Upload, label: "Import from Excel", color: "text-green-600" },
                { icon: Shield, label: "Privacy Settings", color: "text-purple-600" },
                { icon: Bell, label: "Notifications", color: "text-amber-600" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-surface-700 hover:bg-surface-50 transition-colors text-left"
                >
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-800 mb-3">
              About
            </h3>
            <div className="space-y-2 text-sm text-surface-500">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-medium text-surface-700">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Data Source</span>
                <span className="font-medium text-surface-700">Excel</span>
              </div>
              <div className="flex justify-between">
                <span>Storage</span>
                <span className="font-medium text-surface-700">Local</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <SettingsIcon className="w-5 h-5 text-surface-400 mt-0.5" />
              <div>
                <p className="text-sm text-surface-600">
                  Settings are saved locally in your browser. Excel is the
                  primary data source for this application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
