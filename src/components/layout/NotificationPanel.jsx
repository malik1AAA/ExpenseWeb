import { useState, useEffect } from 'react';
import { Bell, X, Check, CreditCard, AlertCircle } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { COLUMNS } from '../../config/excelSchema';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate, getDaysBetween } from '../../utils/dateUtils';

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const { debts, debtReturns } = useFinance();

  useEffect(() => {
    if (isOpen) {
      generateNotifications();
    }
  }, [isOpen, debts, debtReturns]);

  const generateNotifications = () => {
    const notifs = [];
    const now = new Date();

    debts.forEach(debt => {
      const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
      const dueDate = debt[COLUMNS.DEBTS.DUE_DATE];
      const originalAmount = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
      
      // Calculate remaining amount
      const returns = debtReturns.filter(r => r[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId);
      const totalReturned = returns.reduce((sum, r) => sum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
      const remaining = originalAmount - totalReturned;

      if (dueDate && remaining > 0) {
        const due = new Date(dueDate);
        const daysUntilDue = getDaysBetween(now, due);

        // Overdue debt
        if (daysUntilDue < 0) {
          notifs.push({
            id: `overdue-${debtId}`,
            type: 'overdue',
            title: 'Overdue Debt',
            message: `${debt[COLUMNS.DEBTS.PERSON]} - ${formatCurrency(remaining)} was due on ${formatDate(dueDate)}`,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            debtId,
            priority: 1,
          });
        }
        // Due within 7 days
        else if (daysUntilDue <= 7) {
          notifs.push({
            id: `due-soon-${debtId}`,
            type: 'due-soon',
            title: 'Payment Due Soon',
            message: `${debt[COLUMNS.DEBTS.PERSON]} - ${formatCurrency(remaining)} due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
            icon: CreditCard,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            debtId,
            priority: 2,
          });
        }
      }
    });

    // Sort by priority (overdue first, then due soon)
    notifs.sort((a, b) => a.priority - b.priority);
    setNotifications(notifs);
  };

  const markAsRead = (notificationId) => {
    // For now, just remove from list
    // In a full implementation, this would persist to database
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 z-50 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-surface-600" />
            <h3 className="font-semibold text-surface-900">Notifications</h3>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-surface-500" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 text-sm">No notifications</p>
              <p className="text-surface-400 text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-surface-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${notification.bgColor} flex-shrink-0`}>
                    <notification.icon className={`w-4 h-4 ${notification.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-surface-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-surface-600 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 hover:bg-surface-100 rounded transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3 text-surface-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-surface-200 bg-surface-50 text-xs text-surface-500 text-center">
            Showing debt payment reminders
          </div>
        )}
      </div>
    </>
  );
}
