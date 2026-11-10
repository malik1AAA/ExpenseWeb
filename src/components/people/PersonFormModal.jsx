import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from '../common';

const EMPTY_PERSON = { name: '', email: '', contact: '', is_active: true };

export default function PersonFormModal({ isOpen, onClose, onSubmit, person = null }) {
  const [formData, setFormData] = useState(EMPTY_PERSON);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(person ? {
      name: person.name || '',
      email: person.email || '',
      contact: person.contact || '',
      is_active: person.is_active !== false,
    } : EMPTY_PERSON);
    setError('');
  }, [person, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await onSubmit(formData);
    } catch (submitError) {
      setError(submitError.message || 'Could not save person.');
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field, value) => setFormData(current => ({ ...current, [field]: value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={person ? 'Edit Person' : 'Add Person'} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Person Name"
          value={formData.name}
          onChange={event => update('name', event.target.value)}
          required
          maxLength={120}
          autoComplete="name"
        />
        <Input
          label="Email (optional)"
          type="email"
          value={formData.email}
          onChange={event => update('email', event.target.value)}
          autoComplete="email"
        />
        <Input
          label="Contact (optional)"
          value={formData.contact}
          onChange={event => update('contact', event.target.value)}
          maxLength={80}
        />
        <Select
          label="Status"
          value={formData.is_active ? 'active' : 'inactive'}
          onChange={event => update('is_active', event.target.value === 'active')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving} className="flex-1">
            {person ? 'Save Changes' : 'Add Person'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
