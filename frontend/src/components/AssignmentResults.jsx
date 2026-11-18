import { useState } from 'react';
import { generateAssignment } from '../api/apiClient.js';

// Runs POST /assignments/generate and shows the suggested volunteer-task
// assignments. The coordinator can flip between the quantum (QAOA) and
// classical (Hungarian) suggestions. The result lives in Dashboard state
// (passed in as `result`) so the Comparison page can use it too.
export default function AssignmentResults({ result, onResult, canGenerate = true }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('quantum');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const data = await generateAssignment();
      onResult(data);
    } catch (err) {
      setError(err.message || 'Could not generate an assignment.');
    } finally {
      setLoading(false);
    }
  }

  const rows = (result?.assignments || []).filter((a) => a.method === method);

  return (
    <div className="panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading || !canGenerate}
        >
          {loading ? 'Running AI + quantum + classical…' : 'Generate Assignment'}
        </button>
        {!canGenerate && (
          <span className="hint">Add at least one task and one available volunteer first.</span>
        )}
        {loading && (
          <span className="hint">The quantum simulation can take a few seconds.</span>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <>
          {result.note && <div className="pipeline-note" style={{ marginBottom: 16 }}>{result.note}</div>}

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className={`btn ${method === 'quantum' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMethod('quantum')}
            >
              Quantum (QAOA)
            </button>
            <button
              className={`btn ${method === 'classical' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMethod('classical')}
            >
              Classical (Hungarian)
            </button>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Location</th>
                  <th>Volunteer</th>
                  <th>Fit score</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-row">
                      This method did not assign anyone.
                    </td>
                  </tr>
                )}
                {rows.map((a) => (
                  <tr key={`${a.method}-${a.task_id}-${a.volunteer_id}`}>
                    <td className="mono">TASK-{String(a.task_id).padStart(3, '0')}</td>
                    <td>{a.task_location}</td>
                    <td>{a.volunteer_name}</td>
                    <td className="mono">{a.fit_score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            These are suggestions - a coordinator should review them before anyone is dispatched.
          </p>
        </>
      )}
    </div>
  );
}
