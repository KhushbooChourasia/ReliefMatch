import { useState } from 'react';

const AVAILABILITY_META = {
  Available: { emoji: '🟢', cls: 'available' },
  Assigned: { emoji: '🔵', cls: 'assigned' },
  Unavailable: { emoji: '⚪', cls: 'unavailable' },
};

function AvailabilityBadge({ status }) {
  const meta = AVAILABILITY_META[status] || AVAILABILITY_META.Unavailable;
  return (
    <span className={`availability-tag ${meta.cls}`}>
      {meta.emoji} {status}
    </span>
  );
}

// Table view of every volunteer, with a local search filter and edit/delete
// actions per row.
export default function VolunteerList({ volunteers, onEdit, onDelete }) {
  const [query, setQuery] = useState('');

  const filtered = volunteers.filter((v) => {
    if (!query.trim()) return true;
    const haystack = [v.id, v.name, v.location, ...(v.skills || [])].join(' ').toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search volunteers by name, location, or skill…"
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
              <th>Name</th>
              <th>Location</th>
              <th>Skills</th>
              <th>Availability</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={6}>
                  {volunteers.length === 0
                    ? 'No volunteers registered yet — add one on the left.'
                    : 'No volunteers match your search.'}
                </td>
              </tr>
            )}
            {filtered.map((v) => (
              <tr key={v.id}>
                <td className="mono">{v.id}</td>
                <td>{v.name}</td>
                <td>{v.location}</td>
                <td>
                  {v.skills.map((skill) => (
                    <span className="skill-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </td>
                <td>
                  <AvailabilityBadge status={v.availability} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="icon-btn edit" title="Edit volunteer" onClick={() => onEdit(v)}>
                    ✎
                  </button>
                  <button className="icon-btn" title="Remove volunteer" onClick={() => onDelete(v.id)}>
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
