import React from 'react';
import { Timer, DollarSign, Calendar, FileText, TrendingUp, CheckCircle2, Clock, Target } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Dashboard({ setPage }) {
  const [sessions] = useLocalStorage('pomodoro-sessions', []);
  const [pomodoroCount] = useLocalStorage('pomodoro-count-today', { count: 0, date: '' });
  const [transactions] = useLocalStorage('transactions', []);
  const [tasks] = useLocalStorage('planner-tasks', []);
  const [notes] = useLocalStorage('quick-notes', []);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = pomodoroCount.date === new Date().toDateString() ? pomodoroCount.count : 0;

  const todayTasks = tasks.filter(t => t.date === today);
  const doneTasks = todayTasks.filter(t => t.completed).length;

  const thisMonth = new Date();
  const monthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  }).reduce((s, t) => s + Number(t.amount), 0);

  const balance = transactions.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);

  const upcomingTasks = tasks.filter(t => t.date >= today && !t.completed).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 5);

  const recentNotes = notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);

  const PRIORITY_COLOR = { high: 'var(--red)', medium: 'var(--accent)', low: 'var(--accent-2)' };

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>
          {getGreeting()}, Scholar 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: <Timer size={18} />, label: 'Pomodoros Today', value: todayCount, color: 'var(--accent)', action: 'timer' },
          { icon: <CheckCircle2 size={18} />, label: "Today's Tasks", value: `${doneTasks}/${todayTasks.length}`, color: 'var(--green)', action: 'planner' },
          { icon: <DollarSign size={18} />, label: 'This Month', value: `₹${monthExpenses.toLocaleString('en-IN')}`, color: 'var(--red)', action: 'expenses' },
          { icon: <FileText size={18} />, label: 'Notes', value: notes.length, color: 'var(--accent-2)', action: 'notes' },
        ].map(s => (
          <div key={s.label} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setPage(s.action)}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color + '66'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming Tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="card-title" style={{ margin: 0 }}>Upcoming Tasks</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('planner')}>View all</button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
              All caught up! No upcoming tasks.
            </div>
          ) : upcomingTasks.map(task => (
            <div key={task.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ width: 3, height: '100%', borderRadius: 2, background: PRIORITY_COLOR[task.priority], minHeight: 36, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', alignItems: 'center' }}>
                  <Calendar size={10} />
                  {task.date === today ? 'Today' : new Date(task.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <Clock size={10} />
                  {task.startTime}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Snapshot + Recent Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="card-title" style={{ margin: 0 }}>Balance</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('expenses')}>Manage</button>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: balance >= 0 ? 'var(--green)' : 'var(--red)', lineHeight: 1 }}>
              {balance < 0 ? '-' : ''}₹{Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
              {[
                { label: 'Income', value: transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), color: 'var(--green)' },
                { label: 'Expenses', value: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), color: 'var(--red)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 15, color: s.color, fontFamily: 'var(--font-mono)' }}>₹{s.value.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="card-title" style={{ margin: 0 }}>Recent Notes</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('notes')}>View all</button>
            </div>
            {recentNotes.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No notes yet</div>
            ) : recentNotes.map(note => (
              <div key={note.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => setPage('notes')}>
                <FileText size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title || 'Untitled'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
