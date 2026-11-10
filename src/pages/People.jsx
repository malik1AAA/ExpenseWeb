import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Pencil, Plus, Search, UserRound, UserRoundPlus } from 'lucide-react';
import { Button, Input, PageHeader, Select } from '../components/common';
import PersonFormModal from '../components/people/PersonFormModal';
import { createPerson, fetchPeople, invitePerson, updatePerson } from '../services/peopleService';

export default function People() {
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingPerson, setEditingPerson] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionPersonId, setActionPersonId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      setPeople(await fetchPeople());
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Could not load people.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const visiblePeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    return people.filter(person => {
      const matchesSearch = !query ||
        person.name.toLowerCase().includes(query) ||
        (person.email || '').toLowerCase().includes(query) ||
        (person.contact || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? person.is_active : !person.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [people, search, statusFilter]);

  const handleSavePerson = async (personData) => {
    try {
      const savedPerson = editingPerson
        ? await updatePerson(editingPerson.id, personData)
        : await createPerson(personData);
      setPeople(current => editingPerson
        ? current.map(person => person.id === savedPerson.id ? savedPerson : person)
        : [...current, savedPerson].sort((a, b) => a.name.localeCompare(b.name)));
      setIsFormOpen(false);
      setEditingPerson(null);
      setMessage(editingPerson ? 'Person updated.' : 'Person added.');
      setError('');
      return savedPerson;
    } catch (saveError) {
      setError(saveError.message || 'Could not save person.');
      throw saveError;
    }
  };

  const handleInvite = async (person) => {
    setActionPersonId(person.id);
    setError('');
    setMessage('');
    try {
      await invitePerson(person.id);
      setMessage(`A secure linking invitation was sent to ${person.email}.`);
    } catch (inviteError) {
      setError(inviteError.message || 'Could not send invitation.');
    } finally {
      setActionPersonId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="People" description="Manage the people connected to your debt records">
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingPerson(null);
            setIsFormOpen(true);
          }}
        >
          Add Person
        </Button>
      </PageHeader>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

      <section className="rounded-xl border border-surface-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              aria-label="Search people"
              className="pl-9"
              placeholder="Search name, email, or contact"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <Select
            aria-label="Filter people by status"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-surface-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-sm text-surface-500">Loading people…</p>
        ) : visiblePeople.length === 0 ? (
          <div className="p-10 text-center">
            <UserRoundPlus className="mx-auto mb-3 h-8 w-8 text-surface-400" />
            <p className="font-medium text-surface-800">{people.length ? 'No people match these filters.' : 'No people added yet.'}</p>
            {!people.length && <p className="mt-1 text-sm text-surface-500">Add a person before creating a debt.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-surface-50 text-xs uppercase text-surface-600">
                <tr>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Account link</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {visiblePeople.map(person => (
                  <tr key={person.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-surface-900">
                        <UserRound className="h-4 w-4 text-surface-400" />
                        {person.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-600">
                      <div>{person.email || 'No email'}</div>
                      {person.contact && <div className="text-xs">{person.contact}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {person.has_linked_account
                        ? <span className="text-green-700">Linked account</span>
                        : <span className="text-surface-500">Not linked</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${person.is_active ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-600'}`}>
                        {person.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {person.email && !person.has_linked_account && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={Mail}
                            loading={actionPersonId === person.id}
                            disabled={Boolean(actionPersonId)}
                            onClick={() => handleInvite(person)}
                          >
                            Invite
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon={Pencil}
                          aria-label={`Edit ${person.name}`}
                          onClick={() => {
                            setEditingPerson(person);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PersonFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPerson(null);
        }}
        onSubmit={handleSavePerson}
        person={editingPerson}
      />
    </div>
  );
}
