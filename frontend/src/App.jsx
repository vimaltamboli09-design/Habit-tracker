import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState("");
  const [streaks, setStreaks] = useState({});
  const [weekly, setWeekly] = useState({});
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await axios.get(`${API}/habits`);
      setHabits(res.data);
      res.data.forEach((h) => {
        fetchStreak(h.id);
        fetchWeekly(h.id);
        fetchHeatmap(h.id);
      });
    } catch (err) {
      console.error("Failed to fetch habits:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreak = async (habitId) => {
    const res = await axios.get(`${API}/habits/${habitId}/streak`);
    setStreaks((prev) => ({ ...prev, [habitId]: res.data }));
  };

  const fetchWeekly = async (habitId) => {
    const res = await axios.get(`${API}/habits/${habitId}/weekly`);
    setWeekly((prev) => ({ ...prev, [habitId]: res.data.days }));
  };

  const fetchHeatmap = async (habitId) => {
    const res = await axios.get(`${API}/habits/${habitId}/heatmap`);
    setHeatmap((prev) => ({ ...prev, [habitId]: res.data.days }));
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await axios.post(`${API}/habits`, { name: name.trim(), target: "daily" });
      setName("");
      fetchHabits();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add habit");
    }
  };

  const markComplete = async (habitId) => {
    try {
      await axios.post(`${API}/habits/${habitId}/complete`);
      fetchStreak(habitId);
      fetchWeekly(habitId);
      fetchHeatmap(habitId);
    } catch (err) {
      alert(err.response?.data?.detail || "Error marking complete");
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await axios.delete(`${API}/habits/${habitId}`);
      fetchHabits();
    } catch (err) {
      alert("Failed to delete habit");
    }
  };

  const totalCompletions = Object.values(streaks).reduce(
    (sum, s) => sum + (s?.total_completions || 0), 0
  );
  const bestStreak = Object.values(streaks).reduce(
    (max, s) => Math.max(max, s?.current_streak || 0), 0
  );
  const avgStreak = habits.length
    ? Math.round(Object.values(streaks).reduce((s, x) => s + (x?.current_streak || 0), 0) / habits.length)
    : 0;

  const chartData = habits.map((h) => ({
    name: h.name,
    completions: streaks[h.id]?.total_completions || 0,
  }));

  const dayLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading your habits...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div className="header-left">
          <h1>Habit Tracker</h1>
          <p>Track consistency, one day at a time</p>
        </div>
        <form onSubmit={addHabit} className="habit-form">
          <input
            type="text"
            placeholder="Add a new habit..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" disabled={!name.trim()}>Add</button>
        </form>
      </header>

      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Active Habits</span>
          <span className="stat-number">{habits.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Best Current Streak</span>
          <span className="stat-number">{bestStreak}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. Streak</span>
          <span className="stat-number">{avgStreak}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Completions</span>
          <span className="stat-number">{totalCompletions}</span>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel habit-panel">
          <div className="panel-header">
            <h2>Habits</h2>
          </div>

          {habits.length === 0 ? (
            <div className="empty-state">No habits yet — add your first one above.</div>
          ) : (
            <div className="habit-list-detailed">
              {habits.map((h) => (
                <div className="habit-row" key={h.id}>
                  <div className="habit-row-top">
                    <div className="habit-row-left">
                      <span className="habit-name">{h.name}</span>
                      <span className="streak-pill">
                        {streaks[h.id]?.current_streak ?? 0}d streak
                      </span>
                      <span className="best-pill">
                        best: {streaks[h.id]?.longest_streak ?? 0}d
                      </span>
                    </div>
                    <div className="habit-row-actions">
                      <button className="btn-primary" onClick={() => markComplete(h.id)}>
                        Mark Done
                      </button>
                      <button className="btn-ghost" onClick={() => deleteHabit(h.id)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="week-grid">
                    {(weekly[h.id] || []).map((day) => (
                      <div
                        key={day.date}
                        className={`week-cell ${day.completed ? "week-cell-done" : ""}`}
                        title={day.date}
                      >
                        {dayLabel(day.date)}
                      </div>
                    ))}
                  </div>

                  <div className="heatmap-grid">
                    {(heatmap[h.id] || []).map((day) => (
                      <div
                        key={day.date}
                        className={`heatmap-cell ${day.completed ? "heatmap-cell-done" : ""}`}
                        title={day.date}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <h2>Completions Overview</h2>
          </div>
          {habits.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #334155", background: "#1e293b", fontSize: 13, color: "#e2e8f0" }}
                />
                <Bar dataKey="completions" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">Add habits to see analytics.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;