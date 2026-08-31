import { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";
const COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0"];

function App() {
  const [habits, setHabits] = useState([]);
  const [name, setName] = useState("");
  const [streaks, setStreaks] = useState({});

  // Fetch habits on load
  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const res = await axios.get(`${API}/habits`);
    setHabits(res.data);
    res.data.forEach((h) => fetchStreak(h.id));
  };

  const fetchStreak = async (habitId) => {
    const res = await axios.get(`${API}/habits/${habitId}/streak`);
    setStreaks((prev) => ({ ...prev, [habitId]: res.data }));
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await axios.post(`${API}/habits`, { name, target: "daily" });
    setName("");
    fetchHabits();
  };

  const markComplete = async (habitId) => {
    try {
      await axios.post(`${API}/habits/${habitId}/complete`);
      fetchStreak(habitId);
    } catch (err) {
      alert(err.response?.data?.detail || "Error marking complete");
    }
  };

  const deleteHabit = async (habitId) => {
    await axios.delete(`${API}/habits/${habitId}`);
    fetchHabits();
  };

  const chartData = habits.map((h) => ({
    name: h.name,
    value: streaks[h.id]?.total_completions || 0,
  }));

  return (
    <div className="container">
      <h1>🔥 Habit Tracker</h1>

      <form onSubmit={addHabit} className="habit-form">
        <input
          type="text"
          placeholder="New habit (e.g. Exercise)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add Habit</button>
      </form>

      <div className="habit-list">
        {habits.map((h) => (
          <div key={h.id} className="habit-card">
            <div className="habit-info">
              <h3>{h.name}</h3>
              <p>🔥 Streak: {streaks[h.id]?.current_streak ?? 0} days</p>
              <p>✅ Total: {streaks[h.id]?.total_completions ?? 0} completions</p>
            </div>
            <div className="habit-actions">
              <button onClick={() => markComplete(h.id)}>Mark Done</button>
              <button onClick={() => deleteHabit(h.id)} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {habits.length > 0 && (
        <div className="chart-section">
          <h2>Completion Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;