import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

const QUANTUM = '#6c5ce7';
const CLASSICAL = '#c9822a';

function MetricChart({ title, unit, data }) {
  return (
    <div className="panel" style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>
        {title} {unit && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({unit})</span>}
      </h3>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.name === 'Quantum' ? QUANTUM : CLASSICAL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Side-by-side quantum (QAOA) vs classical (Hungarian) results from the
// last "Generate Assignment" run (comes from Dashboard state).
export default function ComparisonChart({ result }) {
  if (!result) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>
          No results yet - go to the Assignment page and click "Generate Assignment" first.
        </p>
      </div>
    );
  }

  const { quantum: q, classical: c } = result.comparison;
  const pair = (key) => [
    { name: 'Quantum', value: q[key] },
    { name: 'Classical', value: c[key] },
  ];

  return (
    <div>
      {result.note && <div className="pipeline-note" style={{ marginBottom: 16 }}>{result.note}</div>}
      <div className="grid-two" style={{ gap: 16 }}>
        <MetricChart title="Total fit score" data={pair('fit_score_total')} />
        <MetricChart title="Tasks covered" data={pair('tasks_covered')} />
        <MetricChart title="Solve time" unit="ms" data={pair('solve_time_ms')} />
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Both methods solved the same {result.solved_tasks} tasks x {result.solved_volunteers} volunteers.
        Quantum runs on a simulator, so it is expected to be slower - the point is comparing solution quality.
      </p>
    </div>
  );
}
