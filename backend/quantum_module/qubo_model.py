import numpy as np
from qiskit_optimization import QuadraticProgram


def create_assignment_qubo(fit_matrix):
    """
    Create a volunteer-task assignment optimization problem.

    Rows    = volunteers
    Columns = tasks
    Values  = fit scores

    Returns:
        QuadraticProgram
    """

    fit_matrix = np.asarray(fit_matrix, dtype=float)

    if fit_matrix.ndim != 2:
        raise ValueError("fit_matrix must be a 2D matrix")

    num_volunteers, num_tasks = fit_matrix.shape

    if num_volunteers == 0 or num_tasks == 0:
        raise ValueError("fit_matrix cannot be empty")

    qp = QuadraticProgram("ReliefMatch_Assignment")

    # --------------------------------------------------
    # Create binary variables
    # x_i_j = 1 means volunteer i is assigned to task j
    # --------------------------------------------------

    for i in range(num_volunteers):
        for j in range(num_tasks):
            qp.binary_var(name=f"x_{i}_{j}")

    # --------------------------------------------------
    # Objective
    #
    # We want to MAXIMIZE total fit score.
    # Qiskit optimization uses minimization here,
    # so we minimize the negative fit score.
    # --------------------------------------------------

    linear = {}

    for i in range(num_volunteers):
        for j in range(num_tasks):
            linear[f"x_{i}_{j}"] = -float(fit_matrix[i, j])

    qp.minimize(linear=linear)

    # --------------------------------------------------
    # Constraint 1:
    # Each volunteer can receive at most one task.
    # --------------------------------------------------

    for i in range(num_volunteers):

        constraint = {
            f"x_{i}_{j}": 1
            for j in range(num_tasks)
        }

        qp.linear_constraint(
            linear=constraint,
            sense="<=",
            rhs=1,
            name=f"volunteer_{i}_at_most_one_task"
        )

    # --------------------------------------------------
    # Constraint 2:
    # Each task can receive at most one volunteer.
    # --------------------------------------------------

    for j in range(num_tasks):

        constraint = {
            f"x_{i}_{j}": 1
            for i in range(num_volunteers)
        }

        qp.linear_constraint(
            linear=constraint,
            sense="<=",
            rhs=1,
            name=f"task_{j}_at_most_one_volunteer"
        )

    return qp