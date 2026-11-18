import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import VolunteerForm from '../components/VolunteerForm.jsx';
import VolunteerList from '../components/VolunteerList.jsx';
import AssignmentResults from '../components/AssignmentResults.jsx';
import ComparisonChart from '../components/ComparisonChart.jsx';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  login,
  signup,
  logout,
} from '../api/apiClient.js';

// Everything for the dashboard lives in this one file, matching the
// original project structure (pages/Dashboard.jsx is the only page file):
// - top nav bar (inline JSX, not a separate component)
// - all task/volunteer state, auto-ID generation, and edit/delete handlers
// - one <Routes> block that swaps which section renders below the nav

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/tasks', label: 'Tasks' },
  { to: '/volunteers', label: 'Volunteers' },
  { to: '/assignment', label: 'Assignment' },
  { to: '/comparison', label: 'Comparison' },
];

// Small synthetic dataset for demoing/testing without typing everything by
// hand each time. Not real disaster or volunteer data — made-up but
// realistic, same as everything else entered through this dashboard.
const SAMPLE_TASKS = [
  {
    location: 'Riverside Colony, Sector 4',
    type: 'Rescue',
    severity: 9,
    disaster_datetime: '',
    required_skills: ['Search & Rescue', 'Medical'],
    population_affected: 340,
    description: 'Flash flood cut off the colony; several families stranded on rooftops.',
    status: 'Pending',
  },
  {
    location: 'Green Valley School Camp',
    type: 'Food',
    severity: 5,
    disaster_datetime: '',
    required_skills: ['Food Distribution', 'Logistics'],
    population_affected: 210,
    description: 'Temporary shelter camp needs a daily food distribution route.',
    status: 'Pending',
  },
  {
    location: 'Old Town Market Road',
    type: 'Medical',
    severity: 8,
    disaster_datetime: '',
    required_skills: ['Medical'],
    population_affected: 75,
    description: 'Building collapse — injuries reported, first-aid station needed on site.',
    status: 'Assigned',
  },
  {
    location: 'Lakeside Ward 7',
    type: 'Water & Sanitation',
    severity: 4,
    disaster_datetime: '',
    required_skills: ['Water & Sanitation'],
    population_affected: 500,
    description: 'Water supply contaminated after the flooding; needs purification setup.',
    status: 'Pending',
  },
  {
    location: 'Hillcrest Relief Center',
    type: 'Shelter',
    severity: 3,
    disaster_datetime: '',
    required_skills: ['Shelter Setup', 'Logistics'],
    population_affected: 150,
    description: 'Additional tents and bedding needed for overflow from the main shelter.',
    status: 'Completed',
  },
];

// Mirrors the task types offered in TaskForm.jsx — used only for the small
// decorative icon strip on the Home page, tied to real form options.
const TASK_TYPE_ICONS = [
  { label: 'Medical', emoji: '🚑' },
  { label: 'Food', emoji: '🍲' },
  { label: 'Water & Sanitation', emoji: '💧' },
  { label: 'Shelter', emoji: '🏠' },
  { label: 'Rescue', emoji: '🚨' },
  { label: 'Other', emoji: '📦' },
];

// Small hand-coded line icons for the hero visual — no external image
// dependencies, so nothing to host or break. Each blends into the dark
// navy hero via currentColor + the CSS added for .hero-visual below.
function FloodIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 9c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M2 14c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M2 19c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
    </svg>
  );
}

function EarthquakeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 17h4l2-5 3 9 2.5-11 2 7h4.5" />
      <path d="M3 20h18" opacity="0.5" />
    </svg>
  );
}

function CycloneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3a5 5 0 1 0 5 5" />
      <path d="M12 8a3.2 3.2 0 1 0 3.2 3.2" />
      <path d="M12 12.6a1.4 1.4 0 1 0 1.4 1.4" />
    </svg>
  );
}

function WildfireIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.5c1 3 3.6 4 3.6 7.3a3.6 3.6 0 1 1-7.2 0c0-1 .4-1.7 1-2.4-.1 1 .2 1.7.9 2 .1-2.3-1.8-3.4-1.8-5.6 0-1 .5-1.9 1.5-2.6-.1.6 0 1.1.4 1.3.3-.9 1-1.6 1.6-2z" />
      <path d="M8.5 15.5c0 2.2 1.6 4 3.5 4s3.5-1.8 3.5-4" opacity="0.6" />
    </svg>
  );
}

function LandslideIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 18l6-10 4 6 2-3 8 7z" />
      <circle cx="5" cy="20" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="20" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="20" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RescueIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
    </svg>
  );
}

const DISASTER_BADGES = [
  { label: 'Flood', Icon: FloodIcon },
  { label: 'Earthquake', Icon: EarthquakeIcon },
  { label: 'Cyclone', Icon: CycloneIcon },
  { label: 'Wildfire', Icon: WildfireIcon },
  { label: 'Landslide', Icon: LandslideIcon },
];

// The hero's right-side visual: a large, very low-opacity rescue/life-ring
// icon glowing behind a cluster of glassy disaster-type badges. Pure SVG,
// so it blends straight into the dark navy hero with no image to host.
function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual-glow" />
      <RescueIcon className="hero-visual-rescue" width={220} height={220} />
      <div className="disaster-badge-grid">
        {DISASTER_BADGES.map(({ label, Icon }) => (
          <div className="disaster-badge" key={label}>
            <span className="disaster-badge-icon">
              <Icon />
            </span>
            <span className="disaster-badge-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SAMPLE_VOLUNTEERS = [
  {
    name: 'Asha Patil',
    location: 'Sector 4, near bus depot',
    skills: ['Medical', 'Search & Rescue'],
    availability: 'Available',
  },
  {
    name: 'Ravi Kumar',
    location: 'Old Town, Market Road',
    skills: ['Medical'],
    availability: 'Assigned',
  },
  {
    name: 'Meera Joshi',
    location: 'Green Valley',
    skills: ['Food Distribution', 'Logistics'],
    availability: 'Available',
  },
  {
    name: 'Sameer Shaikh',
    location: 'Lakeside Ward 6',
    skills: ['Water & Sanitation', 'Logistics'],
    availability: 'Available',
  },
  {
    name: 'Priya Nair',
    location: 'Hillcrest',
    skills: ['Shelter Setup'],
    availability: 'Unavailable',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [backendNotice, setBackendNotice] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingVolunteer, setEditingVolunteer] = useState(null);

  // Signed-in user, restored from localStorage on load so a refresh doesn't
  // log you out. { name, email } or null when logged out.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('reliefmatch_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Task-id -> urgency % once "Generate Assignment" (a later step) runs.
  const [urgencyScores, setUrgencyScores] = useState({});
  const [assignmentResult, setAssignmentResult] = useState(null);

  // Called when "Generate Assignment" finishes: keep the result for the
  // Assignment/Comparison pages, show urgency scores in the task list, and
  // refresh tasks so the saved urgency_score is up to date.
  function handleAssignmentResult(data) {
    setAssignmentResult(data);
    setUrgencyScores(data.urgency_scores || {});
    getTasks().then(setTasks).catch(() => {});
  }

  // Monotonically increasing counters for TASK-001 / VOL-001 style ids —
  // refs (not state) so deleting an item never causes an id to be reused.
  const taskCounter = useRef(1);
  const volunteerCounter = useRef(1);

  function nextTaskId() {
    return `TASK-${String(taskCounter.current++).padStart(3, '0')}`;
  }
  function nextVolunteerId() {
    return `VOL-${String(volunteerCounter.current++).padStart(3, '0')}`;
  }

  useEffect(() => {
    getTasks()
      .then((data) => {
        setTasks(data);
        taskCounter.current = data.length + 1;
      })
      .catch(() => setBackendNotice('Backend not reachable yet — working in local-only mode.'));

    getVolunteers()
      .then((data) => {
        setVolunteers(data);
        volunteerCounter.current = data.length + 1;
      })
      .catch(() => {});
  }, []);

  /* ---------------------------------- Auth ---------------------------------- */

  function persistUser(nextUser) {
    setUser(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem('reliefmatch_user', JSON.stringify(nextUser));
      } else {
        localStorage.removeItem('reliefmatch_user');
      }
    } catch {
      // localStorage unavailable (e.g. private browsing) — session just
      // won't survive a refresh, which is fine, not worth blocking on.
    }
  }

  // Tries the real backend first; if it's not up yet, falls back to a
  // working local session so login/signup/logout are demoable right away.
  async function handleLogin({ email, password }) {
    setAuthSubmitting(true);
    try {
      const result = await login({ email, password });
      persistUser(result.user || result);
    } catch {
      persistUser({ name: email.split('@')[0], email });
      setBackendNotice('Backend not reachable — signed in locally only.');
    } finally {
      setAuthSubmitting(false);
      navigate('/');
    }
  }

  async function handleSignup({ name, email, password }) {
    setAuthSubmitting(true);
    try {
      const result = await signup({ name, email, password });
      persistUser(result.user || result);
    } catch {
      persistUser({ name, email });
      setBackendNotice('Backend not reachable — account created locally only.');
    } finally {
      setAuthSubmitting(false);
      navigate('/');
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Nothing to do — logging out locally is enough either way.
    }
    persistUser(null);
    navigate('/');
  }

  /* --------------------------------- Tasks --------------------------------- */

  async function handleAddTask(taskData) {
    setTaskSubmitting(true);
    const task = { id: nextTaskId(), ...taskData };
    setTasks((prev) => [...prev, task]);
    try {
      await createTask(task);
    } catch {
      setBackendNotice('Backend not reachable — task saved locally only.');
    } finally {
      setTaskSubmitting(false);
    }
  }

  async function handleUpdateTask(id, updates) {
    setTaskSubmitting(true);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setEditingTask(null);
    try {
      await updateTask(id, updates);
    } catch {
      setBackendNotice('Backend not reachable — change saved locally only.');
    } finally {
      setTaskSubmitting(false);
    }
  }

  async function handleDeleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingTask?.id === id) setEditingTask(null);
    try {
      await deleteTask(id);
    } catch {
      setBackendNotice('Backend not reachable — task removed locally only.');
    }
  }

  /* ------------------------------- Volunteers ------------------------------- */

  async function handleAddVolunteer(volunteerData) {
    setVolunteerSubmitting(true);
    const volunteer = { id: nextVolunteerId(), ...volunteerData };
    setVolunteers((prev) => [...prev, volunteer]);
    try {
      await createVolunteer(volunteer);
    } catch {
      setBackendNotice('Backend not reachable — volunteer saved locally only.');
    } finally {
      setVolunteerSubmitting(false);
    }
  }

  async function handleUpdateVolunteer(id, updates) {
    setVolunteerSubmitting(true);
    setVolunteers((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    setEditingVolunteer(null);
    try {
      await updateVolunteer(id, updates);
    } catch {
      setBackendNotice('Backend not reachable — change saved locally only.');
    } finally {
      setVolunteerSubmitting(false);
    }
  }

  async function handleDeleteVolunteer(id) {
    setVolunteers((prev) => prev.filter((v) => v.id !== id));
    if (editingVolunteer?.id === id) setEditingVolunteer(null);
    try {
      await deleteVolunteer(id);
    } catch {
      setBackendNotice('Backend not reachable — volunteer removed locally only.');
    }
  }

  /* ----------------------------- Sample data ----------------------------- */

  function handleLoadSampleData() {
    const newTasks = SAMPLE_TASKS.map((t) => ({ id: nextTaskId(), ...t }));
    const newVolunteers = SAMPLE_VOLUNTEERS.map((v) => ({ id: nextVolunteerId(), ...v }));

    setTasks((prev) => [...prev, ...newTasks]);
    setVolunteers((prev) => [...prev, ...newVolunteers]);

    // Best-effort: also try saving each to the backend if it's up, without
    // blocking the UI or spamming the notice banner more than once.
    Promise.all([
      ...newTasks.map((t) => createTask(t).catch(() => {})),
      ...newVolunteers.map((v) => createVolunteer(v).catch(() => {})),
    ]);
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" />
            <span className="brand-name">ReliefMatch</span>
            <span className="brand-tagline">coordination console</span>
          </NavLink>
          <div className="navbar-links">
            {user &&
              NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
          </div>
          <div className="navbar-auth">
            {user ? (
              <>
                <span className="navbar-user">Hi, {user.name || user.email}</span>
                <button type="button" className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                >
                  Login
                </NavLink>
                <NavLink to="/signup" className="navbar-signup">
                  Sign up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        {user ? (
          <>
            <Route
              path="/"
              element={
                <HomeSection tasks={tasks} volunteers={volunteers} onLoadSample={handleLoadSampleData} />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksSection
                  tasks={tasks}
                  urgencyScores={urgencyScores}
                  onAdd={handleAddTask}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  editingTask={editingTask}
                  onEdit={setEditingTask}
                  onCancelEdit={() => setEditingTask(null)}
                  submitting={taskSubmitting}
                  backendNotice={backendNotice}
                  onLoadSample={handleLoadSampleData}
                />
              }
            />
            <Route
              path="/volunteers"
              element={
                <VolunteersSection
                  volunteers={volunteers}
                  onAdd={handleAddVolunteer}
                  onUpdate={handleUpdateVolunteer}
                  onDelete={handleDeleteVolunteer}
                  editingVolunteer={editingVolunteer}
                  onEdit={setEditingVolunteer}
                  onCancelEdit={() => setEditingVolunteer(null)}
                  submitting={volunteerSubmitting}
                  backendNotice={backendNotice}
                  onLoadSample={handleLoadSampleData}
                />
              }
            />
            <Route
              path="/assignment"
              element={
                <AssignmentSection
                  tasks={tasks}
                  volunteers={volunteers}
                  result={assignmentResult}
                  onResult={handleAssignmentResult}
                />
              }
            />
            <Route path="/comparison" element={<ComparisonSection result={assignmentResult} />} />
            {/* Already signed in — /login and /signup just bounce back home. */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/login"
              element={<LoginSection onSubmit={handleLogin} submitting={authSubmitting} />}
            />
            <Route
              path="/signup"
              element={<SignupSection onSubmit={handleSignup} submitting={authSubmitting} />}
            />
            {/* Not signed in — every other URL redirects to /login. */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </>
  );
}

/* ------------------------------ Sections ------------------------------ */
/* Kept in this same file (rather than separate page files) to match the
   original project structure, which only lists pages/Dashboard.jsx. */

function HomeSection({ tasks, volunteers, onLoadSample }) {
  return (
    <div className="console">
      <div className="hero">
        <div className="hero-content">
          <h1>AI + quantum-assisted volunteer-to-task allocation for disaster relief.</h1>
          <p>
            A coordinator logs relief tasks and available volunteers. The backend scores
            urgency with AI, then solves the same assignment problem two ways — QAOA on a
            quantum simulator and the Hungarian algorithm classically — so the dashboard can
            show an honest, side-by-side comparison of both.
          </p>
          <div className="hero-actions">
            <Link to="/tasks" className="btn btn-primary">
              Start logging tasks
            </Link>
            <Link
              to="/comparison"
              className="btn btn-ghost"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              View comparison
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={onLoadSample}
            >
              Load sample data
            </button>
          </div>
        </div>
        <HeroVisual />
      </div>

      <div className="why-section">
        <div className="why-header">
          <div className="eyebrow-dark">The problem</div>
          <h2>Why ReliefMatch?</h2>
        </div>

        <div className="compare-grid">
          <div className="compare-col negative">
            <h3>Traditional manual allocation</h3>
            <div className="compare-step">Coordinator matches by memory and phone calls</div>
            <div className="compare-arrow">↓</div>
            <div className="compare-step">Slow &amp; error-prone</div>
            <div className="compare-arrow">↓</div>
            <div className="compare-step">Difficult at scale</div>
          </div>

          <div className="compare-divider">
            <span>VS</span>
          </div>

          <div className="compare-col positive">
            <h3>ReliefMatch</h3>
            <div className="compare-step">AI urgency scoring</div>
            <div className="compare-arrow">↓</div>
            <div className="compare-step">Intelligent skill-based matching</div>
            <div className="compare-arrow">↓</div>
            <div className="compare-step">Quantum + classical comparison</div>
          </div>
        </div>

        <div className="impact-grid">
          <div className="impact-card">
            <span className="impact-index">Problem</span>
            <h4>Manual coordination breaks down under pressure</h4>
            <p>
              During a real disaster, coordinators match volunteers to tasks by memory and
              phone calls — slow, inconsistent, and hard to scale past a handful of tasks.
            </p>
          </div>
          <div className="impact-card">
            <span className="impact-index">Our solution</span>
            <h4>Log once, match automatically</h4>
            <p>
              A coordinator logs tasks and volunteers here; the system scores urgency and
              proposes a best-fit assignment instead of leaving it to memory.
            </p>
          </div>
          <div className="impact-card">
            <span className="impact-index">Technology</span>
            <h4>AI scoring + two independent solvers</h4>
            <p>
              An AI module scores task urgency. The assignment is then solved two separate
              ways — QAOA on a quantum simulator, and the Hungarian algorithm classically.
            </p>
          </div>
          <div className="impact-card">
            <span className="impact-index">Expected impact</span>
            <h4>Faster, more consistent deployment</h4>
            <p>
              More consistent volunteer deployment at scale, plus a real, practical
              comparison of quantum vs. classical optimization on the same problem.
            </p>
          </div>
        </div>
      </div>

      <div className="type-strip">
        {TASK_TYPE_ICONS.map((t) => (
          <span className="type-chip" key={t.label}>
            <span>{t.emoji}</span> {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TasksSection({
  tasks,
  urgencyScores,
  onAdd,
  onUpdate,
  onDelete,
  editingTask,
  onEdit,
  onCancelEdit,
  submitting,
  backendNotice,
  onLoadSample,
}) {
  return (
    <div className="console">
      <header className="page-header">
        <div>
          <h1>Relief tasks</h1>
          <div className="subtitle">Log each task a coordinator needs covered.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onLoadSample}>
            Load sample data
          </button>
          <span className="status-pill">{tasks.length} logged</span>
        </div>
      </header>

      {backendNotice && <div className="error-banner">{backendNotice}</div>}

      <div className="grid-two">
        <TaskForm
          key={editingTask?.id ?? 'new-task'}
          onAdd={onAdd}
          onUpdate={onUpdate}
          editingTask={editingTask}
          onCancelEdit={onCancelEdit}
          submitting={submitting}
        />
        <TaskList tasks={tasks} urgencyScores={urgencyScores} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function VolunteersSection({
  volunteers,
  onAdd,
  onUpdate,
  onDelete,
  editingVolunteer,
  onEdit,
  onCancelEdit,
  submitting,
  backendNotice,
  onLoadSample,
}) {
  return (
    <div className="console">
      <header className="page-header">
        <div>
          <h1>Volunteers</h1>
          <div className="subtitle">Register who's available to help, and with what skills.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onLoadSample}>
            Load sample data
          </button>
          <span className="status-pill">{volunteers.length} registered</span>
        </div>
      </header>

      {backendNotice && <div className="error-banner">{backendNotice}</div>}

      <div className="grid-two">
        <VolunteerForm
          key={editingVolunteer?.id ?? 'new-volunteer'}
          onAdd={onAdd}
          onUpdate={onUpdate}
          editingVolunteer={editingVolunteer}
          onCancelEdit={onCancelEdit}
          submitting={submitting}
        />
        <VolunteerList volunteers={volunteers} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function AssignmentSection({ tasks, volunteers, result, onResult }) {
  const availableCount = volunteers.filter((v) => v.availability === 'Available').length;
  return (
    <div className="console">
      <header className="page-header">
        <div>
          <h1>Generate assignment</h1>
          <div className="subtitle">Runs the AI + quantum + classical pipeline on the backend.</div>
        </div>
        <span className="status-pill">
          {tasks.length} tasks · {volunteers.length} volunteers ready
        </span>
      </header>
      <AssignmentResults
        result={result}
        onResult={onResult}
        canGenerate={tasks.length > 0 && availableCount > 0}
      />
    </div>
  );
}

function ComparisonSection({ result }) {
  return (
    <div className="console">
      <header className="page-header">
        <div>
          <h1>Quantum vs classical</h1>
          <div className="subtitle">Fit score, tasks covered, and solve time — side by side.</div>
        </div>
      </header>
      <ComparisonChart result={result} />
    </div>
  );
}

function LoginSection({ onSubmit, submitting }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    onSubmit({ email: email.trim(), password });
  }

  return (
    <div className="console">
      <div className="auth-wrap">
        <h1>Welcome back</h1>
        <div className="subtitle" style={{ textAlign: 'center', marginBottom: 20 }}>
          Sign in to your ReliefMatch coordinator account.
        </div>

        <form className="panel" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <div className="field-row">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-row">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function SignupSection({ onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in every field.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    onSubmit({ name: name.trim(), email: email.trim(), password });
  }

  return (
    <div className="console">
      <div className="auth-wrap">
        <h1>Create your account</h1>
        <div className="subtitle" style={{ textAlign: 'center', marginBottom: 20 }}>
          Set up coordinator access to ReliefMatch.
        </div>

        <form className="panel" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <div className="field-row">
            <label htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="e.g. Asha Patil"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field-row">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-row two-up">
            <div className="field-row">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field-row">
              <label htmlFor="signup-confirm">Confirm password</label>
              <input
                id="signup-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
