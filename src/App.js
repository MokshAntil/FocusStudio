import React, { useState, useEffect } from 'react';
import './styles.css';
import Dashboard from './components/Dashboard';
import Timer from './components/Timer';
import Expenses from './components/Expenses';
import Planner from './components/Planner';
import Notes from './components/Notes';
import FocusLock from './components/FocusLock';

import {
  LayoutDashboard,
  Timer as TimerIcon,
  Wallet,
  CalendarDays,
  FileText,
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'timer', label: 'Focus Timer', icon: TimerIcon },
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'notes', label: 'Notes', icon: FileText },
];

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Your productivity at a glance' },
  timer: { title: 'Focus Timer', sub: 'Pomodoro & deep work sessions' },
  planner: { title: 'Planner', sub: 'Schedule and manage your tasks' },
  expenses: { title: 'Expenses', sub: 'Track your income and spending' },
  notes: { title: 'Quick Notes', sub: 'Capture thoughts and ideas' },
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { title, sub } = PAGE_TITLES[page] || PAGE_TITLES.dashboard;

  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAY_SHORT = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Focus<br />Studio</h1>
          <span>Productivity Suite</span>
        </div>

        <div className="nav-section-label">Workspace</div>

        {NAV.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <Icon size={16} />
            {label}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="date-display">
            <span className="day">{time.getDate()}</span>
            {MONTH_SHORT[time.getMonth()]} {time.getFullYear()}
            <br />
            <span style={{ fontSize: 10, display: 'block', marginTop: 2 }}>{DAY_SHORT[time.getDay()]}</span>
            <span style={{ display: 'block', marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-2)' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{title}</div>
            <div className="page-subtitle">{sub}</div>
          </div>
        </div>

        <div className="page-body">
          {page === 'dashboard' && <Dashboard setPage={setPage} />}
          {page === 'timer' && <Timer />}
          {page === 'expenses' && <Expenses />}
          {page === 'planner' && <Planner />}
          {page === 'notes' && <Notes />}
        </div>
      </main>
      <FocusLock />
    </div>
  );
}
