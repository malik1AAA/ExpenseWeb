import { Modal, Button } from '../common';
import { AlertTriangle } from 'lucide-react';

/**
 * DeleteConfirmation - Confirmation dialog for deletion
 */
export default function DeleteConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.'
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-surface-600">{message}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="flex-1">
          Delete
        </Button>
      </div>
    </Modal>
  );
}
