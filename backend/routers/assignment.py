"""
routers/assignment.py
The orchestration endpoint: POST /assignments/generate

Pipeline:
  1. Load unresolved tasks + available volunteers from the DB.
  2. AI urgency scoring        -> ai_urgency_score(task)            [Member 3]
  3. Build the fit-score matrix -> compute_fit_score(volunteer, task) [Member 3]
  4. Quantum optimization       -> quantum_optimize(...)             [Member 4]
  5. Classical baseline         -> classical_optimize(...)           [Member 4]
  6. Return a combined list of assignments + comparison metrics, shaped
     to match the frontend's apiClient.js.

Everything marked PLACEHOLDER is a stand-in until Member 3 (AI) and
Member 4 (Quantum) hand over their real functions - see the comments
below for exactly how to swap them in.
"""

import time
from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.task import Task
from models.volunteer import Volunteer
from schemas.schemas import AssignmentEntry, AssignmentResponse, ComparisonBlock, SolverSummary

from ai_module.fit_score import calculate_fit_score
from ai_module.urgency_model import predict_urgency

from quantum_module.quantum_solver import quantum_assignment
from quantum_module.classical_solver import classical_assignment

router = APIRouter(tags=["Assignment"])

# QAOA on a statevector simulator needs roughly (volunteers x tasks) + slack
# qubits, so runtime explodes past ~3x3 (4x4 already takes ~20 s; 5x5 runs out
# of memory). Both solvers therefore get the same capped sub-problem, which
# also keeps the quantum-vs-classical comparison fair. Override with the
# MAX_QUANTUM_SIZE environment variable.
import os
MAX_QUANTUM_SIZE = int(os.getenv("MAX_QUANTUM_SIZE", "3"))


# ==============================================================================
# PLACEHOLDER 1 - AI urgency scoring (Member 3 will replace this)
# ==============================================================================

from datetime import datetime

def ai_urgency_score(task: Task) -> float:
    if task.disaster_datetime:
        hours = max((datetime.utcnow() - task.disaster_datetime).total_seconds() / 3600, 0)
    else:
        hours = 0
    task_dict = {
        "severity": task.severity,
        "population_affected": task.population_affected,
        "hours_since_reported": hours,
    }
    return predict_urgency(task_dict)


# ==============================================================================
# PLACEHOLDER 2 - Volunteer-task fit score (Member 3 will replace this)
# ==============================================================================

def compute_fit_score(volunteer: Volunteer, task: Task, urgency_score: float) -> float:
    volunteer_skills = [s.strip() for s in volunteer.skills.split(",") if s.strip()]
    required_skills = [s.strip() for s in (task.required_skills or "").split(",") if s.strip()]

    if not required_skills:
        chosen_skill = volunteer_skills[0] if volunteer_skills else "any"
        required_skill_for_calc = chosen_skill  # no requirement -> force full skill match
    else:
        overlap = [s for s in volunteer_skills if s in required_skills]
        if overlap:
            chosen_skill = required_skill_for_calc = overlap[0]
        else:
            chosen_skill = volunteer_skills[0] if volunteer_skills else ""
            required_skill_for_calc = required_skills[0]

    volunteer_dict = {
        "id": volunteer.id,
        "skill": chosen_skill,
        "latitude": volunteer.latitude or 0.0,
        "longitude": volunteer.longitude or 0.0,
        "available": volunteer.availability == "Available",
    }
    task_dict = {
        "task_id": task.id,
        "required_skill": required_skill_for_calc,
        "latitude": task.latitude or 0.0,
        "longitude": task.longitude or 0.0,
        "urgency_score": urgency_score,
    }
    return calculate_fit_score(volunteer_dict, task_dict)


# ==============================================================================
# PLACEHOLDER 3 - Quantum optimizer (Member 4 will replace this)
# ==============================================================================

def _build_index_matrix(fit_matrix, task_ids, volunteer_ids):
    matrix = [
        [fit_matrix[(task_id, volunteer_id)] for task_id in task_ids]
        for volunteer_id in volunteer_ids
    ]
    return matrix


def quantum_optimize(fit_matrix, task_ids, volunteer_ids):
    matrix = _build_index_matrix(fit_matrix, task_ids, volunteer_ids)
    result = quantum_assignment(matrix)
    assignments = [
        (task_ids[a["task"]], volunteer_ids[a["volunteer"]], a["fit_score"])
        for a in result["assignments"]
    ]
    metadata = {"objective_value": result.get("objective_value"), "solve_time_s": result["solve_time"]}
    return assignments, metadata


def classical_optimize(fit_matrix, task_ids, volunteer_ids):
    matrix = _build_index_matrix(fit_matrix, task_ids, volunteer_ids)
    result = classical_assignment(matrix)
    assignments = [
        (task_ids[a["task"]], volunteer_ids[a["volunteer"]], a["fit_score"])
        for a in result["assignments"]
    ]
    metadata = {"solve_time_s": result["solve_time"]}
    return assignments, metadata


# ==============================================================================
# Orchestration endpoint - matches frontend's generateAssignment() call
# ==============================================================================
@router.post("/assignments/generate", response_model=AssignmentResponse)
def generate_assignment(db: Session = Depends(get_db)):
    tasks: List[Task] = db.query(Task).filter(Task.status != "Completed").all()
    volunteers: List[Volunteer] = db.query(Volunteer).filter(Volunteer.availability == "Available").all()

    if not tasks:
        raise HTTPException(status_code=400, detail="No unresolved tasks to assign.")
    if not volunteers:
        raise HTTPException(status_code=400, detail="No available volunteers to assign.")

    # lookups for building readable output later
    task_lookup = {t.id: t for t in tasks}
    volunteer_lookup = {v.id: v for v in volunteers}

    # --- AI urgency scoring ---
    urgency_scores: Dict[int, float] = {}
    for task in tasks:
        score = ai_urgency_score(task)
        task.urgency_score = score
        urgency_scores[task.id] = score
    db.commit()

    # --- fit-score matrix ---
    fit_matrix: Dict[Tuple[int, int], float] = {}
    for task in tasks:
        for volunteer in volunteers:
            fit_matrix[(task.id, volunteer.id)] = compute_fit_score(volunteer, task, urgency_scores[task.id])

    # --- shrink to what the quantum simulator can handle ---
    # Keep the most urgent tasks, then the volunteers who fit those tasks best.
    total_tasks, total_volunteers = len(tasks), len(volunteers)
    top_tasks = sorted(tasks, key=lambda t: urgency_scores[t.id], reverse=True)[:MAX_QUANTUM_SIZE]
    task_ids = [t.id for t in top_tasks]
    best_fit = {
        v.id: max(fit_matrix[(tid, v.id)] for tid in task_ids) for v in volunteers
    }
    top_vols = sorted(volunteers, key=lambda v: best_fit[v.id], reverse=True)[:MAX_QUANTUM_SIZE]
    volunteer_ids = [v.id for v in top_vols]
    capped = total_tasks > len(task_ids) or total_volunteers > len(volunteer_ids)

    # --- quantum ---
    q_start = time.perf_counter()
    quantum_assignments, _ = quantum_optimize(fit_matrix, task_ids, volunteer_ids)
    quantum_ms = (time.perf_counter() - q_start) * 1000

    # --- classical (same sub-problem, for a fair comparison) ---
    c_start = time.perf_counter()
    classical_assignments, _ = classical_optimize(fit_matrix, task_ids, volunteer_ids)
    classical_ms = (time.perf_counter() - c_start) * 1000

    def build_entries(assignments, method: str) -> List[AssignmentEntry]:
        entries = []
        for task_id, volunteer_id, score in assignments:
            entries.append(AssignmentEntry(
                volunteer_id=volunteer_id,
                volunteer_name=volunteer_lookup[volunteer_id].name,
                task_id=task_id,
                task_location=task_lookup[task_id].location,
                fit_score=score,
                method=method,
            ))
        return entries

    quantum_entries = build_entries(quantum_assignments, "quantum")
    classical_entries = build_entries(classical_assignments, "classical")

    comparison = ComparisonBlock(
        quantum=SolverSummary(
            fit_score_total=round(sum(e.fit_score for e in quantum_entries), 2),
            tasks_covered=len(quantum_entries),
            solve_time_ms=round(quantum_ms, 3),
        ),
        classical=SolverSummary(
            fit_score_total=round(sum(e.fit_score for e in classical_entries), 2),
            tasks_covered=len(classical_entries),
            solve_time_ms=round(classical_ms, 3),
        ),
    )

    return AssignmentResponse(
        assignments=quantum_entries + classical_entries,
        comparison=comparison,
        urgency_scores=urgency_scores,
        total_tasks=total_tasks,
        total_volunteers=total_volunteers,
        solved_tasks=len(task_ids),
        solved_volunteers=len(volunteer_ids),
        capped=capped,
        note=(
            f"Quantum simulation is limited to {MAX_QUANTUM_SIZE}x{MAX_QUANTUM_SIZE}, so the "
            f"{len(task_ids)} most urgent tasks and best-fitting {len(volunteer_ids)} volunteers "
            f"were solved by both methods."
        ) if capped else None,
    )