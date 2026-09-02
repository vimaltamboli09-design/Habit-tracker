from pydantic import BaseModel
from datetime import date
from typing import List

class HabitCreate(BaseModel):
    name: str
    target: str = "daily"

class HabitResponse(BaseModel):
    id: int
    name: str
    target: str

    class Config:
        from_attributes = True

class HabitLogResponse(BaseModel):
    id: int
    date: date

    class Config:
        from_attributes = True

class StreakResponse(BaseModel):
    habit_id: int
    current_streak: int
    total_completions: int
    longest_streak: int

class WeeklyViewResponse(BaseModel):
    habit_id: int
    days: List[dict]  # [{"date": "2026-08-25", "completed": True}, ...]    