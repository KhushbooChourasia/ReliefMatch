import { useState } from 'react';

const SKILL_OPTIONS = [
  'Medical',
  'Search & Rescue',
  'Food Distribution',
  'Water & Sanitation',
  'Logistics',
  'Shelter Setup',
];

const AVAILABILITY_OPTIONS = ['Available', 'Assigned', 'Unavailable'];

function emptyForm() {
  return { name: '', location: '', availability: 'Available' };
}

function formFromVolunteer(volunteer) {
  return {
    name: volunteer.name,
    location: volunteer.location,
    availability: volunteer.availability || 'Available',
  };
}

// Add/edit form for a volunteer. Parent renders this with
// key={editingVolunteer?.id ?? 'new-volunteer'} so the form fully resets
// whenever a different volunteer is opened for editing.
export default function VolunteerForm({ onAdd, onUpdate, editingVolunteer, onCancelEdit, submitting }) {
  const isEditing = Boolean(editingVolunteer);
  const [form, setForm] = useState(() =>
    editingVolunteer ? formFromVolunteer(editingVolunteer) : emptyForm()
  );
  const [skills, setSkills] = useState(editingVolunteer?.skills || []);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSkill(skill) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.location.trim()) {
      setError('Location is required.');
      return;
    }
    if (skills.length === 0) {
      setError('Select at least one skill.');
      return;
    }

    setError('');
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      skills,
      availability: form.availability,
    };

    if (isEditing) {
      onUpdate(editingVolunteer.id, payload);
    } else {
      onAdd(payload);
      setForm(emptyForm());
      setSkills([]);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field-row">
        <label htmlFor="vol-name">Name</label>
        <input
          id="vol-name"
          type="text"
          placeholder="e.g. Asha Patil"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label htmlFor="vol-location">Location</label>
        <input
          id="vol-location"
          type="text"
          placeholder="e.g. Sector 2, near bus depot"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label>Skills</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SKILL_OPTIONS.map((skill) => {
            const active = skills.includes(skill);
            return (
              <button
                type="button"
                key={skill}
                onClick={() => toggleSkill(skill)}
                className="btn"
                style={{
                  padding: '6px 11px',
                  fontSize: '12px',
                  background: active ? 'var(--navy-700)' : 'var(--bg-panel-raised)',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'var(--navy-700)' : 'var(--border)'}`,
                }}
              >
                {skill}
              </button>
            );
          })}
        </div>
        <span className="hint">Used to compute the volunteer-task fit score.</span>
      </div>

      <div className="field-row">
        <label htmlFor="vol-availability">Availability</label>
        <select
          id="vol-availability"
          value={form.availability}
          onChange={(e) => update('availability', e.target.value)}
        >
          {AVAILABILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Update volunteer' : 'Add volunteer'}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
