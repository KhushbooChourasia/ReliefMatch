import { useState } from 'react';
import { severityMeta } from './TaskForm.jsx';

const STATUS_CLASS = {
  Pending: 'status-pending',
  Assigned: 'status-assigned',
  Completed: 'status-completed',
};

function SeverityBadge({ value }) {
  const meta = severityMeta(value);
  return (
    <span className={`severity-chip ${meta.cls}`}>
      <span className="dot" />
      {meta.emoji} {value} · {meta.label}
    </span>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-tag ${STATUS_CLASS[status] || 'status-pending'}`}>{status}</span>;
}

// Table view of every task, with a local search filter and edit/delete
// actions per row. urgencyScores is an optional { [taskId]: percent } map,
// populated once "Generate Assignment" (Step 2) has run — until then every
// row just shows "—" in that column.
export default function TaskList({ tasks, urgencyScores = {}, onEdit, onDelete }) {
  const [query, setQuery] = useState('');

  const filtered = tasks.filter((task) => {
    if (!query.trim()) return true;
    const haystack = [task.id, task.location, task.type, task.description, ...(task.required_skills || [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search tasks by location, type, or skill…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
        className="search-input"
      />

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Required skills</th>
              <th>Population</th>
              <th>Status</th>
              <th>Urgency</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={9}>
                  {tasks.length === 0
                    ? 'No tasks logged yet — add one on the left.'
                    : 'No tasks match your search.'}
                </td>
              </tr>
            )}
            {filtered.map((task) => (
              <tr key={task.id}>
                <td className="mono">{task.id}</td>
                <td>{task.location}</td>
                <td>{task.type}</td>
                <td>
                  <SeverityBadge value={task.severity} />
                </td>
                <td>
                  {(task.required_skills || []).length === 0 ? (
                    <span className="mono">—</span>
                  ) : (
                    task.required_skills.map((skill) => (
                      <span className="skill-tag" key={skill}>
                        {skill}
                      </span>
                    ))
                  )}
                </td>
                <td className="mono">{task.population_affected}</td>
                <td>
                  <StatusBadge status={task.status || 'Pending'} />
                </td>
                <td className="mono">
                  {urgencyScores[task.id] != null ? `${urgencyScores[task.id]}%` : '—'}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="icon-btn edit" title="Edit task" onClick={() => onEdit(task)}>
                    ✎
                  </button>
                  <button className="icon-btn" title="Delete task" onClick={() => onDelete(task.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
