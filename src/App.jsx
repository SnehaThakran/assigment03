import { useState } from "react";
import "./App.css";

const PASS_SCORE = 50;

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function Badge({ score }) {
  const pass = score >= PASS_SCORE;
  return (
    <span className={`badge ${pass ? "badge-pass" : "badge-fail"}`}>
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function StudentRow({ student, index, onRemove }) {
  return (
    <tr className="student-row" style={{ animationDelay: `${index * 0.04}s` }}>
      <td className="td-num">{index + 1}</td>
      <td className="td-name">{student.name}</td>
      <td className="td-score">{student.score}</td>
      <td>
        <Badge score={student.score} />
      </td>
      <td>
        <button
          className="del-btn"
          onClick={() => onRemove(student.id)}
          aria-label="Remove student"
        >
          ×
        </button>
      </td>
    </tr>
  );
}

let _nextId = 4;

const INITIAL = [
  { id: 1, name: "Aisha Kumar", score: 88 },
  { id: 2, name: "Ben Carter", score: 54 },
  { id: 3, name: "Celia Ramos", score: 73 },
];

export default function App() {
  const [students, setStudents] = useState(INITIAL);
  const [name, setName] = useState("");
  const [score, setScore] = useState("");
  const [error, setError] = useState("");

  const total = students.length;
  const avg =
    total === 0
      ? "—"
      : (students.reduce((s, r) => s + r.score, 0) / total).toFixed(1);

  function addStudent() {
    const trimmed = name.trim();
    const num = Number(score);
    if (!trimmed) {
      setError("Please enter a student name.");
      return;
    }
    if (score === "" || isNaN(num) || num < 0 || num > 100) {
      setError("Score must be a number between 0 and 100.");
      return;
    }
    setError("");
    setStudents((prev) => [...prev, { id: _nextId++, name: trimmed, score: num }]);
    setName("");
    setScore("");
  }

  function removeStudent(id) {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") addStudent();
  }

  return (
    <div className="sb-root">
      <div className="sb-grid-overlay" aria-hidden="true" />

      <main className="sb-container">
        {/* Header */}
        <header className="sb-header">
          <h1 className="sb-title">Student Scoreboard</h1>
          <p className="sb-subtitle">Track student performance at a glance</p>
        </header>

        {/* Stats */}
        <section className="sb-stats" aria-label="Summary statistics">
          <StatCard label="Total Students" value={total} accent="accent-indigo" />
          <StatCard label="Average Score" value={avg} accent="accent-pink" />
        </section>

        {/* Form */}
        <section className="sb-form-section" aria-label="Add student">
          <p className="form-title">Add student</p>
          <div className="sb-form">
            <input
              className="sb-input"
              type="text"
              placeholder="Student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Student name"
            />
            <input
              className="sb-input"
              type="number"
              placeholder="Score (0–100)"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Score"
            />
            <button className="sb-btn" onClick={addStudent}>
              Add
            </button>
          </div>
          {error && <p className="error-msg" role="alert">{error}</p>}
        </section>

        {/* Table */}
        <section className="table-wrap" aria-label="Student list">
          <table className="sb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-msg">
                    No students yet — add one above.
                  </td>
                </tr>
              ) : (
                students.map((s, i) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    index={i}
                    onRemove={removeStudent}
                  />
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}