from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, timedelta
from typing import List

import models, schemas
from database import engine, SessionLocal, Base

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow React (localhost:3000) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/habits", response_model=schemas.HabitResponse)
def create_habit(habit: schemas.HabitCreate, db: Session = Depends(get_db)):
    new_habit = models.Habit(name=habit.name, target=habit.target)
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return new_habit


@app.get("/habits", response_model=List[schemas.HabitResponse])
def get_habits(db: Session = Depends(get_db)):
    return db.query(models.Habit).all()


@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return {"message": "Habit deleted"}


@app.post("/habits/{habit_id}/complete")
def mark_complete(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today = date.today()
    already_done = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id == habit_id,
        models.HabitLog.date == today
    ).first()

    if already_done:
        raise HTTPException(status_code=400, detail="Already marked complete today")

    log = models.HabitLog(habit_id=habit_id, date=today)
    db.add(log)
    db.commit()
    return {"message": "Marked complete"}


@app.get("/habits/{habit_id}/streak", response_model=schemas.StreakResponse)
def get_streak(habit_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id == habit_id
    ).order_by(desc(models.HabitLog.date)).all()

    if not logs:
        return schemas.StreakResponse(habit_id=habit_id, current_streak=0, total_completions=0)

    dates = [log.date for log in logs]
    streak = 0
    expected_date = date.today()

    for d in dates:
        if d == expected_date:
            streak += 1
            expected_date -= timedelta(days=1)
        elif d == expected_date + timedelta(days=1):
            continue
        else:
            break

    return schemas.StreakResponse(
        habit_id=habit_id,
        current_streak=streak,
        total_completions=len(dates)
    )