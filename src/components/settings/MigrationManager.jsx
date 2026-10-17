import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../hooks/useFinance';
import { 
  checkMigrationStatus, 
  getLocalDataSummary, 
  getLocalData,
  validateLocalData, 
  migrateToSupabase, 
  clearLocalData,
  exportLocalData 
} from '../../services/migrationService';
import { Download, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function MigrationManager() {
  const { user } = useAuth();
  const { refreshData } = useFinance();
  
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadMigrationStatus();
    }
  }, [user]);

  const loadMigrationStatus = async () => {
    const status = await checkMigrationStatus();
    setMigrationStatus(status);
  };

  const handleValidate = () => {
    const result = validateLocalData();
    setValidationResult(result);
  };

  const handleMigrate = async () => {
    if (!validationResult?.valid) {
      alert('Please fix validation errors before migrating');
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const localData = getLocalData();
      const result = await migrateToSupabase(localData);
      
      setMigrationResult(result);
      
      if (result.success) {
        // Refresh data from Supabase
        await refreshData();
        await loadMigrationStatus();
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        errors: [`Migration failed: ${error.message}`],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearLocalData = () => {
    const success = clearLocalData(true);
    if (success) {
      setShowClearConfirm(false);
      loadMigrationStatus();
      setValidationResult(null);
      setMigrationResult(null);
    }
  };

  const handleExportBackup = () => {
    const jsonData = exportLocalData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 text-surface-600">
          <Info className="w-5 h-5" />
          <p>Please sign in to access migration tools</p>
        </div>
      </div>
    );
  }

  if (!migrationStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 text-surface-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <p>Checking migration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">
          Data Migration
        </h2>
        <p className="text-surface-600">
          Migrate your local data to Supabase cloud storage
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg p-4 border ${
        migrationStatus.needsMigration 
          ? 'bg-blue-50 border-blue-200' 
          : migrationStatus.hasSupabaseData
          ? 'bg-green-50 border-green-200'
          : 'bg-surface-50 border-surface-200'
      }`}>
        <div className="flex items-start gap-3">
          {migrationStatus.needsMigration ? (
            <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
          ) : migrationStatus.hasSupabaseData ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-surface-600 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold mb-1 ${
              migrationStatus.needsMigration 
                ? 'text-blue-900' 
                : migrationStatus.hasSupabaseData
                ? 'text-green-900'
                : 'text-surface-900'
            }`}>
              {migrationStatus.message}
            </h3>
            {migrationStatus.hasLocalData && (
              <div className="text-sm text-surface-600 space-y-1">
                <p>Local data summary:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>{migrationStatus.localDataSummary.expenses} expenses</li>
                  <li>{migrationStatus.localDataSummary.debts} debts</li>
                  <li>{migrationStatus.localDataSummary.debtReturns} debt returns</li>
                  <li>{migrationStatus.localDataSummary.categories} categories</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Migration Actions */}
      {migrationStatus.needsMigration && (
        <div className="space-y-4">
          <div className="border-t border-surface-200 pt-4">
            <h3 className="text-lg font-semibold text-surface-900 mb-3">
              Migration Steps
            </h3>
            
            <div className="space-y-3">
              {/* Step 1: Export Backup */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-surface-900 mb-1">
                    Export Backup (Recommended)
                  </h4>
                  <p className="text-sm text-surface-600 mb-2">
                    Create a backup of your local data before migration
                  </p>
                  <button
                    onClick={handleExportBackup}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Local Data
                  </button>
                </div>
              </div>

              {/* Step 2: Validate */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-surface-900 mb-1">
                    Validate Data
                  </h4>
                  <p className="text-sm text-surface-600 mb-2">
                    Check your data for errors before migration
                  </p>
                  <button
                    onClick={handleValidate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 transition-colors"
                  >
                    Validate Data
                  </button>
                </div>
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div className={`rounded-lg p-4 border ${
                  validationResult.valid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {validationResult.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        validationResult.valid ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                      </h4>
                      
                      {validationResult.errors.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {validationResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.warnings.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-amber-800 mb-1">Warnings:</p>
                          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                            {validationResult.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Migrate */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-surface-900 mb-1">
                    Migrate to Cloud
                  </h4>
                  <p className="text-sm text-surface-600 mb-2">
                    Upload your data to Supabase cloud storage
                  </p>
                  <button
                    onClick={handleMigrate}
                    disabled={isMigrating || !validationResult?.valid}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMigrating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Migrate to Cloud
                      </>
                    )}
                  </button>
                  {!validationResult?.valid && validationResult && (
                    <p className="text-sm text-red-600 mt-2">
                      Please fix validation errors before migrating
                    </p>
                  )}
                </div>
              </div>

              {/* Migration Result */}
              {migrationResult && (
                <div className={`rounded-lg p-4 border ${
                  migrationResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {migrationResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        migrationResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {migrationResult.success ? 'Migration Successful' : 'Migration Failed'}
                      </h4>
                      
                      {migrationResult.success && (
                        <div className="text-sm text-green-800 space-y-1">
                          <p>Successfully migrated:</p>
                          <ul className="list-disc list-inside ml-2">
                            <li>{migrationResult.migrated.expenses} expenses</li>
                            <li>{migrationResult.migrated.debts} debts</li>
                            <li>{migrationResult.migrated.debtReturns} debt returns</li>
                            <li>{migrationResult.migrated.categories} categories</li>
                          </ul>
                        </div>
                      )}
                      
                      {migrationResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {migrationResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Clear Local Data */}
              {migrationResult?.success && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-surface-900 mb-1">
                      Clear Local Data (Optional)
                    </h4>
                    <p className="text-sm text-surface-600 mb-2">
                      Remove local data after successful migration
                    </p>
                    {!showClearConfirm ? (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Clear Local Data
                      </button>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 mb-3">
                          Are you sure you want to clear all local data? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleClearLocalData}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Yes, Clear Data
                          </button>
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already Migrated */}
      {migrationStatus.hasSupabaseData && !migrationStatus.needsMigration && (
        <div className="border-t border-surface-200 pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">
                Data Already in Cloud
              </h3>
              <p className="text-sm text-surface-600">
                Your data is already stored in Supabase cloud storage. No migration needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Data */}
      {!migrationStatus.hasLocalData && !migrationStatus.hasSupabaseData && (
        <div className="border-t border-surface-200 pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-surface-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-surface-900 mb-1">
                No Data Found
              </h3>
              <p className="text-sm text-surface-600">
                No local or cloud data found. Start by adding expenses, debts, or importing from Excel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
