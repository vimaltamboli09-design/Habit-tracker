from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    target = Column(String, default="daily")  # daily or weekly

    logs = relationship("HabitLog", back_populates="habit")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"))
    date = Column(Date, default=datetime.date.today)

    habit = relationship("Habit", back_populates="logs")