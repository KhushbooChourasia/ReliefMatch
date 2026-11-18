import { useState } from 'react';

const TASK_TYPES = ['Medical', 'Food', 'Water & Sanitation', 'Shelter', 'Rescue', 'Other'];
const SKILL_OPTIONS = [
  'Medical',
  'Search & Rescue',
  'Food Distribution',
  'Water & Sanitation',
  'Logistics',
  'Shelter Setup',
];
const STATUS_OPTIONS = ['Pending', 'Assigned', 'Completed'];

// Maps a 1-10 severity value to a label/color-class/emoji band.
// Exported so TaskList can render the same badge from stored task data.
export function severityMeta(value) {
  const n = Number(value);
  if (n <= 3) return { label: 'Low', cls: 'severity-low', emoji: '🟢' };
  if (n <= 6) return { label: 'Medium', cls: 'severity-medium', emoji: '🟡' };
  if (n <= 8) return { label: 'High', cls: 'severity-high', emoji: '🟠' };
  return { label: 'Critical', cls: 'severity-critical', emoji: '🔴' };
}

function emptyForm() {
  return {
    location: '',
    type: TASK_TYPES[0],
    severity: 5,
    disaster_datetime: '',
    population_affected: '',
    description: '',
    status: 'Pending',
  };
}

function formFromTask(task) {
  return {
    location: task.location,
    type: task.type,
    severity: task.severity,
    disaster_datetime: task.disaster_datetime || '',
    population_affected: task.population_affected,
    description: task.description || '',
    status: task.status || 'Pending',
  };
}

// Add/edit form for a relief task. Parent renders this with
// key={editingTask?.id ?? 'new-task'} so the form fully resets whenever
// a different task is opened for editing (or editing is cancelled).
export default function TaskForm({ onAdd, onUpdate, editingTask, onCancelEdit, submitting }) {
  const isEditing = Boolean(editingTask);
  const [form, setForm] = useState(() => (editingTask ? formFromTask(editingTask) : emptyForm()));
  const [skills, setSkills] = useState(editingTask?.required_skills || []);
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

    if (!form.location.trim()) {
      setError('Location is required.');
      return;
    }
    const population = Number(form.population_affected);
    if (!form.population_affected || Number.isNaN(population) || population < 0) {
      setError('Enter a valid population-affected count.');
      return;
    }

    setError('');
    const payload = {
      location: form.location.trim(),
      type: form.type,
      severity: Number(form.severity),
      disaster_datetime: form.disaster_datetime,
      required_skills: skills,
      population_affected: population,
      description: form.description.trim(),
      status: form.status,
    };

    if (isEditing) {
      onUpdate(editingTask.id, payload);
    } else {
      onAdd(payload);
      setForm(emptyForm());
      setSkills([]);
    }
  }

  const sevMeta = severityMeta(form.severity);

  return (
    <form className="panel" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field-row">
        <label htmlFor="task-location">Location</label>
        <input
          id="task-location"
          type="text"
          placeholder="e.g. Sector 4, Riverside Colony"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
        />
      </div>

      <div className="field-row two-up">
        <div className="field-row">
          <label htmlFor="task-type">Task type</label>
          <select id="task-type" value={form.type} onChange={(e) => update('type', e.target.value)}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <label htmlFor="task-status">Status</label>
          <select id="task-status" value={form.status} onChange={(e) => update('status', e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-row">
        <label htmlFor="task-severity">
          Severity{' '}
          <span className={`severity-chip ${sevMeta.cls}`}>
            <span className="dot" />
            {sevMeta.emoji} {form.severity} · {sevMeta.label}
          </span>
        </label>
        <input
          id="task-severity"
          type="range"
          min="1"
          max="10"
          step="1"
          value={form.severity}
          onChange={(e) => update('severity', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label htmlFor="task-datetime">Disaster date &amp; time</label>
        <input
          id="task-datetime"
          type="datetime-local"
          value={form.disaster_datetime}
          onChange={(e) => update('disaster_datetime', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label>Required skills</label>
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
        <span className="hint">Optional — leave empty if any skill works for this task.</span>
      </div>

      <div className="field-row">
        <label htmlFor="task-population">Population affected</label>
        <input
          id="task-population"
          type="number"
          min="0"
          placeholder="e.g. 250"
          value={form.population_affected}
          onChange={(e) => update('population_affected', e.target.value)}
        />
      </div>

      <div className="field-row">
        <label htmlFor="task-description">Description (optional)</label>
        <textarea
          id="task-description"
          rows={3}
          placeholder="Any extra context a volunteer or coordinator should know"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Update task' : 'Add task'}
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
