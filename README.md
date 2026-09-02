# 🔥 Habit Tracker

A full-stack habit tracking app that helps users build consistency by tracking daily habits and calculating streaks.

Project LINK 
 http://localhost:5173

## Live Features

- Add and delete habits
- Mark habits complete for the day
- Automatic streak calculation (consecutive days)
- Visual dashboard showing completion overview (pie chart)

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, SQLite
**Frontend:** React, Axios, Recharts

## Architecture

## Key Design Decisions

- **Two tables (Habit, HabitLog):** Separates habit definitions from daily completion records, making streak calculation and history tracking straightforward.
- **Streak calculation:** Walks backward day-by-day from today through completion logs; breaks the streak the moment a gap in dates is found.
- **SQLite over Postgres:** Chosen for zero-config local development, suitable for this project's scale.

## Running Locally

**Backend:**