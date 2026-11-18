import time
import numpy as np

from qiskit.primitives import StatevectorSampler
from qiskit_optimization.algorithms import MinimumEigenOptimizer
from qiskit_optimization.minimum_eigensolvers import QAOA
from qiskit_optimization.optimizers import COBYLA

from quantum_module.qubo_model import create_assignment_qubo


def quantum_assignment(fit_matrix):
    """
    Solve the volunteer-task assignment problem using QAOA.
    """

    fit_matrix = np.asarray(fit_matrix, dtype=float)

    if fit_matrix.ndim != 2:
        raise ValueError("fit_matrix must be a 2D matrix")

    if fit_matrix.size == 0:
        raise ValueError("fit_matrix cannot be empty")

    qp = create_assignment_qubo(fit_matrix)

    sampler = StatevectorSampler(
        seed=123
    )

    classical_optimizer = COBYLA(
        maxiter=100
    )

    qaoa = QAOA(
        sampler=sampler,
        optimizer=classical_optimizer,
        reps=1
    )

    quantum_optimizer = MinimumEigenOptimizer(
        qaoa
    )

    start_time = time.perf_counter()

    result = quantum_optimizer.solve(qp)

    solve_time = time.perf_counter() - start_time

    assignments = []

    num_volunteers, num_tasks = fit_matrix.shape

    for i in range(num_volunteers):

      for j in range(num_tasks):

        variable_index = i * num_tasks + j

        value = result.x[variable_index]

        if value > 0.5:

            assignments.append({
                "volunteer": int(i),
                "task": int(j),
                "fit_score": float(
                    fit_matrix[i, j]
                )
            })

    total_fit_score = sum(
        assignment["fit_score"]
        for assignment in assignments
    )

    return {
     "assignments": assignments,
     "total_fit_score": float(total_fit_score),
     "tasks_covered": len(assignments),
     "solve_time": solve_time,
     "objective_value": float(result.fval)
}