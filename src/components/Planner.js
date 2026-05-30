import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Tag, CheckCircle2, Circle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const PRIORITIES = { high: { color: '#c87e7e', label: 'High' }, medium: { color: '#c8a97e', label: 'Medium' }, low: { color: '#7eb5c8', label: 'Low' } };
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const emptyTask = { title: '', note: '', priority: 'medium', tag: '', startTime: '09:00', endTime: '10:00', completed: false };

function pad(n) { return String(n).padStart(2, '0'); }

export default function Planner() {
  const [tasks, setTasks] = useLocalStorage('planner-tasks', []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [view, setView] = useState('week'); // week | day | month
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyTask, date: selectedDate });
  const [editId, setEditId] = useState(null);

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const tasksForDate = (dateStr) => tasks.filter(t => t.date === dateStr);
  const tasksForSelected = tasksForDate(selectedDate);

  const openAdd = (date = selectedDate, time = '09:00') => {
    setForm({ ...emptyTask, date, startTime: time, endTime: pad(Number(time.split(':')[0]) + 1) + ':00' });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (task) => { setForm({ ...task }); setEditId(task.id); setShowModal(true); };

  const save = () => {
    if (!form.title.trim()) return;
    if (editId) {
      setTasks(prev => prev.map(t => t.id === editId ? { ...form, id: editId } : t));
    } else {
      setTasks(prev => [...prev, { ...form, id: Date.now() }]);
    }
    setShowModal(false);
  };

  const del = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const toggleDone = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const dateStr = (d) => d.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-icon" onClick={() => navigate(-1)}><ChevronLeft size={16} /></button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, minWidth: 200, textAlign: 'center' }}>
            {view === 'month'
              ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `${DAY_NAMES[weekStart.getDay()]} ${weekStart.getDate()} — ${DAY_NAMES[weekDays[6].getDay()]} ${weekDays[6].getDate()} ${MONTH_NAMES[weekDays[6].getMonth()]}`
            }
          </span>
          <button className="btn-icon" onClick={() => navigate(1)}><ChevronRight size={16} /></button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(today); }}>Today</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, background: 'var(--bg-3)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
          {['week', 'month'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: view === v ? 'var(--accent)' : 'transparent',
              color: view === v ? 'var(--bg)' : 'var(--text-3)',
              fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500, textTransform: 'capitalize',
            }}>{v}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openAdd()}><Plus size={14} /> Add Task</button>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
        {/* Calendar */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
          {view === 'week' ? (
            <>
              {/* Week header */}
              <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
                <div />
                {weekDays.map(d => {
                  const ds = dateStr(d);
                  const isToday = ds === today;
                  const isSelected = ds === selectedDate;
                  const count = tasksForDate(ds).length;
                  return (
                    <div
                      key={ds}
                      onClick={() => setSelectedDate(ds)}
                      style={{ padding: '14px 8px', textAlign: 'center', cursor: 'pointer', borderRight: '1px solid var(--border-soft)', background: isSelected ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.2s' }}
                    >
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{DAY_NAMES[d.getDay()]}</div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? 'var(--bg)' : 'var(--text)', fontSize: 14, fontWeight: isToday ? 600 : 400 }}>{d.getDate()}</div>
                      {count > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', margin: '4px auto 0' }} />}
                    </div>
                  );
                })}
              </div>
              {/* Time grid */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {HOURS.map(h => (
                  <div key={h} style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', minHeight: 56, borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'right', paddingTop: 8, flexShrink: 0 }}>{pad(h)}:00</div>
                    {weekDays.map(d => {
                      const ds = dateStr(d);
                      const hourTasks = tasksForDate(ds).filter(t => parseInt(t.startTime) === h);
                      const isSelected = ds === selectedDate;
                      return (
                        <div
                          key={ds}
                          style={{ borderRight: '1px solid var(--border-soft)', padding: '4px', background: isSelected ? 'var(--accent-dim)' : 'transparent', position: 'relative', cursor: 'pointer' }}
                          onClick={() => { setSelectedDate(ds); openAdd(ds, `${pad(h)}:00`); }}
                        >
                          {hourTasks.map(task => (
                            <div key={task.id} onClick={e => { e.stopPropagation(); openEdit(task); }} style={{
                              background: `${PRIORITIES[task.priority]?.color || 'var(--accent)'}22`,
                              borderLeft: `2px solid ${PRIORITIES[task.priority]?.color || 'var(--accent)'}`,
                              borderRadius: 4, padding: '2px 6px', fontSize: 10, marginBottom: 2,
                              color: PRIORITIES[task.priority]?.color || 'var(--accent)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.5 : 1,
                              cursor: 'pointer',
                            }}>{task.title}</div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Month view */
            <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {DAY_NAMES.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {monthDays.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const ds = dateStr(d);
                  const isToday = ds === today;
                  const isSelected = ds === selectedDate;
                  const dayTasks = tasksForDate(ds);
                  return (
                    <div key={ds} onClick={() => setSelectedDate(ds)} style={{
                      minHeight: 72, padding: '6px', borderRadius: 8, cursor: 'pointer',
                      background: isSelected ? 'var(--accent-dim)' : isToday ? 'var(--bg-3)' : 'var(--bg-3)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--accent)44' : 'var(--border-soft)'}`,
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ fontSize: 12, color: isToday ? 'var(--accent)' : 'var(--text-2)', fontWeight: isToday ? 600 : 400, marginBottom: 4 }}>{d.getDate()}</div>
                      {dayTasks.slice(0, 2).map(t => (
                        <div key={t.id} style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, marginBottom: 2, background: `${PRIORITIES[t.priority]?.color || 'var(--accent)'}22`, color: PRIORITIES[t.priority]?.color || 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }}>{t.title}</div>
                      ))}
                      {dayTasks.length > 2 && <div style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>+{dayTasks.length - 2}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Day Tasks */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div className="card" style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="card-title" style={{ margin: 0 }}>
                  {new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)', marginTop: 2 }}>
                  {new Date(selectedDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <button className="btn-icon" onClick={() => openAdd()}><Plus size={14} /></button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {tasksForSelected.length} tasks · {tasksForSelected.filter(t => t.completed).length} done
            </div>
          </div>

          {tasksForSelected.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 12 }}>No tasks. Click + to add one.</div>
            </div>
          ) : tasksForSelected.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(task => (
            <div key={task.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer', borderLeft: `3px solid ${PRIORITIES[task.priority]?.color || 'var(--accent)'}`, opacity: task.completed ? 0.6 : 1 }} onClick={() => openEdit(task)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <button onClick={e => { e.stopPropagation(); toggleDone(task.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--green)' : 'var(--text-3)', marginTop: 1, flexShrink: 0, padding: 0 }}>
                  {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</div>
                  {task.note && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{task.note}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {task.startTime}–{task.endTime}
                    </span>
                    {task.tag && <span style={{ fontSize: 10, padding: '1px 6px', background: 'var(--bg-4)', borderRadius: 4, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>#{task.tag}</span>}
                    <span style={{ fontSize: 10, padding: '1px 6px', background: `${PRIORITIES[task.priority]?.color}22`, borderRadius: 4, color: PRIORITIES[task.priority]?.color, fontFamily: 'var(--font-mono)' }}>{PRIORITIES[task.priority]?.label}</span>
                  </div>
                </div>
                <button className="btn-icon" onClick={e => { e.stopPropagation(); del(task.id); }} style={{ flexShrink: 0, color: 'var(--red)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Edit Task' : 'New Task'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><span style={{ fontSize: 18 }}>×</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <textarea className="textarea" placeholder="Add details..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ minHeight: 60 }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tag</label>
                <input className="input" placeholder="e.g. study, project, health" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              {editId && <button className="btn btn-danger btn-sm" onClick={() => { del(editId); setShowModal(false); }}>Delete</button>}
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Save' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
