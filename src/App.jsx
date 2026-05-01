import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const PASS_SCORE = 50;
const MEDALS = ["🥇", "🥈", "🥉"];

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#6366f1", "#ec4899", "#22d3ee", "#f59e0b",
  "#34d399", "#f472b6", "#818cf8", "#fbbf24",
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const pieces    = useRef([]);

  const launch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    pieces.current = Array.from({ length: 90 }, () => ({
      x:     randomBetween(W * 0.3, W * 0.7),
      y:     randomBetween(H * 0.35, H * 0.55),
      vx:    randomBetween(-5, 5),
      vy:    randomBetween(-9, -2),
      r:     randomBetween(4, 8),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot:   randomBetween(0, Math.PI * 2),
      spin:  randomBetween(-0.15, 0.15),
      shape: Math.random() > 0.5 ? "rect" : "circle",
      alpha: 1,
      life:  randomBetween(60, 110),
      age:   0,
    }));

    const ctx = canvas.getContext("2d");

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let alive = 0;

      pieces.current.forEach((p) => {
        p.age++;
        if (p.age > p.life) return;
        alive++;
        p.x  += p.vx;
        p.vy += 0.25;
        p.y  += p.vy;
        p.rot += p.spin;
        p.alpha = Math.max(0, 1 - p.age / p.life);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (alive > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
        onDone?.();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [onDone]);

  useEffect(() => {
    if (active) launch();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, launch]);

  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      aria-hidden="true"
    />
  );
}

// ── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = score >= 75 ? "#22c55e"
              : score >= 50 ? "#6366f1"
              : "#f43f5e";
  return (
    <div className="score-bar-track" title={`${score}/100`}>
      <div
        className="score-bar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Rank medals ───────────────────────────────────────────────────────────────
function getMedalMap(students) {
  if (students.length === 0) return {};
  const sorted = [...students].sort((a, b) => b.score - a.score);
  const map    = {};
  let rank = 0;
  let last = null;
  sorted.forEach((s) => {
    if (s.score !== last) rank++;
    if (rank <= 3) map[s.id] = MEDALS[rank - 1];
    last = s.score;
  });
  return map;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ score }) {
  const pass = score >= PASS_SCORE;
  return (
    <span className={`badge ${pass ? "badge-pass" : "badge-fail"}`}>
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ── Student Row ───────────────────────────────────────────────────────────────
function StudentRow({ student, displayIndex, medal, onRemove }) {
  return (
    <tr className="student-row" style={{ animationDelay: `${displayIndex * 0.04}s` }}>
      <td className="td-num">
        {medal
          ? <span className="medal">{medal}</span>
          : <span className="td-rank-num">{displayIndex + 1}</span>
        }
      </td>
      <td className="td-name">{student.name}</td>
      <td className="td-score-cell">
        <span className="td-score-num">{student.score}</span>
        <ScoreBar score={student.score} />
      </td>
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

// ── App ───────────────────────────────────────────────────────────────────────
let _nextId = 4;

const INITIAL = [
  { id: 1, name: "Aisha Kumar", score: 88 },
  { id: 2, name: "Ben Carter",  score: 54 },
  { id: 3, name: "Celia Ramos", score: 73 },
];

export default function App() {
  const [students, setStudents] = useState(INITIAL);
  const [name,     setName]     = useState("");
  const [score,    setScore]    = useState("");
  const [error,    setError]    = useState("");
  const [confetti, setConfetti] = useState(false);

  const total  = students.length;
  const avg    = total === 0
    ? "—"
    : (students.reduce((s, r) => s + r.score, 0) / total).toFixed(1);
  const medals = getMedalMap(students);

  function addStudent() {
    const trimmed = name.trim();
    const num     = Number(score);
    if (!trimmed)                                     { setError("Please enter a student name."); return; }
    if (score === "" || isNaN(num) || num < 0 || num > 100) { setError("Score must be between 0 and 100."); return; }

    setError("");
    setStudents((prev) => [...prev, { id: _nextId++, name: trimmed, score: num }]);
    setName("");
    setScore("");
    if (num >= PASS_SCORE) setConfetti(true);
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

      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      <main className="sb-container">
        {/* Header */}
        <header className="sb-header">
          <h1 className="sb-title">Student Scoreboard</h1>
          <p className="sb-subtitle">Track student performance at a glance</p>
        </header>

        {/* Stats */}
        <section className="sb-stats" aria-label="Summary statistics">
          <StatCard label="Total Students" value={total} accent="accent-indigo" />
          <StatCard label="Average Score"  value={avg}   accent="accent-pink"   />
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
                <th style={{ width: 42 }}>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Status</th>
                <th style={{ width: 36 }} />
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
                    displayIndex={i}
                    medal={medals[s.id]}
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