import time
import numpy as np
from scipy.optimize import linear_sum_assignment


def classical_assignment(fit_matrix):
    """
    Solve the volunteer-task assignment problem
    using the classical Hungarian algorithm.
    """

    fit_matrix = np.asarray(fit_matrix, dtype=float)

    if fit_matrix.ndim != 2:
        raise ValueError("fit_matrix must be a 2D matrix")

    if fit_matrix.size == 0:
        raise ValueError("fit_matrix cannot be empty")

    cost_matrix = -fit_matrix

    start_time = time.perf_counter()

    volunteer_indices, task_indices = linear_sum_assignment(
        cost_matrix
    )

    solve_time = time.perf_counter() - start_time

    assignments = []

    for volunteer, task in zip(
        volunteer_indices,
        task_indices
    ):
        assignments.append({
            "volunteer": int(volunteer),
            "task": int(task),
            "fit_score": float(fit_matrix[volunteer, task])
        })

    total_fit_score = sum(
        assignment["fit_score"]
        for assignment in assignments
    )

    return {
        "assignments": assignments,
        "total_fit_score": float(total_fit_score),
        "tasks_covered": len(assignments),
        "solve_time": solve_time
    }