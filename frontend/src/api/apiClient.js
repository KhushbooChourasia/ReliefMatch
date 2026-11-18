import axios from 'axios';

// All backend calls go through this one axios instance so the base URL,
// timeout, and error shape are consistent everywhere in the app.
// Point VITE_API_BASE_URL (in .env) at wherever Member 2's FastAPI server runs.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Normalizes axios errors into something components can display directly.
function unwrap(promise) {
  return promise
    .then((res) => res.data)
    .catch((err) => {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Request failed';
      throw new Error(message);
    });
}

/* ----------------------------- Tasks ----------------------------- */

// Expected task shape (matches what the backend / AI module expects):
// { id, location, type, severity, population_affected }
export function getTasks() {
  return unwrap(http.get('/tasks'));
}

export function createTask(task) {
  return unwrap(http.post('/tasks', task));
}

export function updateTask(taskId, updates) {
  return unwrap(http.put(`/tasks/${taskId}`, updates));
}

export function deleteTask(taskId) {
  return unwrap(http.delete(`/tasks/${taskId}`));
}

/* --------------------------- Volunteers --------------------------- */

// Expected volunteer shape:
// { id, name, skills: [...], location, availability }
export function getVolunteers() {
  return unwrap(http.get('/volunteers'));
}

export function createVolunteer(volunteer) {
  return unwrap(http.post('/volunteers', volunteer));
}

export function updateVolunteer(volunteerId, updates) {
  return unwrap(http.put(`/volunteers/${volunteerId}`, updates));
}

export function deleteVolunteer(volunteerId) {
  return unwrap(http.delete(`/volunteers/${volunteerId}`));
}

/* --------------------------- Assignment ---------------------------- */

// Triggers the full pipeline on the backend: AI urgency scoring -> fit-score
// matrix -> QAOA (quantum) solve + Hungarian (classical) solve.
// Expected response shape:
// {
//   assignments: [{ volunteer_id, volunteer_name, task_id, task_location, fit_score, method }],
//   comparison: {
//     quantum:   { fit_score_total, tasks_covered, solve_time_ms },
//     classical: { fit_score_total, tasks_covered, solve_time_ms }
//   }
// }
export function generateAssignment() {
  // QAOA simulation can take a while, so this call gets a longer timeout.
  return unwrap(http.post('/assignments/generate', null, { timeout: 120000 }));
}

/* -------------------------------- Auth -------------------------------- */

// Expected user shape returned by both login and signup:
// { id, name, email }  (never include the password in the response)
export function login(credentials) {
  // credentials: { email, password }
  return unwrap(http.post('/auth/login', credentials));
}

export function signup(userData) {
  // userData: { name, email, password }
  return unwrap(http.post('/auth/signup', userData));
}

export function logout() {
  return unwrap(http.post('/auth/logout'));
}

export default {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  generateAssignment,
  login,
  signup,
  logout,
};
