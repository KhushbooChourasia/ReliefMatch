# Clears all tasks and volunteers from the ReliefMatch database.
# Run from the backend folder:  python reset_db.py
# Works even while the backend is running (no need to delete the .db file).
from database import SessionLocal, Base, engine
from models.task import Task
from models.volunteer import Volunteer

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    tasks = db.query(Task).delete()
    volunteers = db.query(Volunteer).delete()
    db.commit()
    print(f"Deleted {tasks} tasks and {volunteers} volunteers. Refresh the dashboard.")
finally:
    db.close()
