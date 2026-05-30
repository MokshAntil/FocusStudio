import React, { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const CATEGORIES = {
  expense: ['Food & Dining', 'Transport', 'Study', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'],
  income: ['Allowance', 'Part-time Job', 'Freelance', 'Scholarship', 'Gift', 'Other'],
};

const CATEGORY_COLORS = {
  'Food & Dining': '#c8a97e', 'Transport': '#7eb5c8', 'Study': '#7ec89a',
  'Entertainment': '#c87ec8', 'Health': '#c87e7e', 'Shopping': '#c8b07e',
  'Bills': '#9a7ec8', 'Allowance': '#7ec89a', 'Part-time Job': '#7eb5c8',
  'Freelance': '#c8a97e', 'Scholarship': '#7ec89a', 'Gift': '#c87ec8', Other: '#5c5a57',
};

const empty = { type: 'expense', amount: '', category: 'Food & Dining', note: '', date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5) };

export default function Expenses() {
  const [transactions, setTransactions] = useLocalStorage('transactions', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('all');
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filter !== 'all') list = list.filter(t => t.type === filter);
    if (search) list = list.filter(t =>
      t.note?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'date') list.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
    if (sortBy === 'amount') list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [transactions, filter, search, sortBy]);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // Category breakdown
    const catMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return { income, expense, balance: income - expense, topCategories };
  }, [transactions]);

  const openAdd = () => { setForm({ ...empty, date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5) }); setEditId(null); setShowModal(true); };
  const openEdit = (t) => { setForm({ ...t }); setEditId(t.id); setShowModal(true); };

  const save = () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return;
    if (editId) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...form, id: editId, amount: Number(form.amount) } : t));
    } else {
      setTransactions(prev => [{ ...form, id: Date.now(), amount: Number(form.amount) }, ...prev]);
    }
    setShowModal(false);
  };

  const del = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fade-in">
      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Balance', value: stats.balance, icon: <DollarSign size={18} />, color: stats.balance >= 0 ? 'var(--green)' : 'var(--red)', dimColor: stats.balance >= 0 ? 'var(--green-dim)' : 'var(--red-dim)' },
          { label: 'Total Income', value: stats.income, icon: <TrendingUp size={18} />, color: 'var(--green)', dimColor: 'var(--green-dim)' },
          { label: 'Total Expense', value: stats.expense, icon: <TrendingDown size={18} />, color: 'var(--red)', dimColor: 'var(--red-dim)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.dimColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: s.color, lineHeight: 1.2, marginTop: 2 }}>
                {s.label === 'Balance' && stats.balance < 0 ? '-' : ''}{formatCurrency(s.value)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* Transactions */}
        <div className="card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="card-title" style={{ margin: 0, flex: 1 }}>Transactions</div>
            <input className="input" style={{ width: 160 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="select" style={{ width: 110 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className="select" style={{ width: 110 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">By Date</option>
              <option value="amount">By Amount</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add</button>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                <DollarSign size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>No transactions yet</div>
              </div>
            ) : filtered.map(t => (
              <div
                key={t.id}
                onClick={() => openEdit(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  background: 'var(--bg-3)', border: '1px solid var(--border-soft)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: t.type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.type === 'income' ? 'var(--green)' : 'var(--red)',
                }}>
                  {t.type === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t.category}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)',
                      background: `${CATEGORY_COLORS[t.category] || '#888'}22`,
                      color: CATEGORY_COLORS[t.category] || 'var(--text-3)',
                    }}>{t.category}</span>
                  </div>
                  {t.note && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 500, color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {t.date} {t.time}
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={e => { e.stopPropagation(); del(t.id); }}
                  style={{ flexShrink: 0, color: 'var(--red)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">Spending by Category</div>
            {stats.topCategories.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Add expenses to see breakdown</div>
            ) : stats.topCategories.map(([cat, amt]) => {
              const pct = stats.expense > 0 ? (amt / stats.expense) * 100 : 0;
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)' }}>{cat}</span>
                    <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(amt)}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-4)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: CATEGORY_COLORS[cat] || 'var(--accent)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-title">This Month</div>
            {(() => {
              const now = new Date();
              const thisMonth = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              });
              const mIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
              const mExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-3)' }}>Income</span>
                    <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>+{formatCurrency(mIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-3)' }}>Expenses</span>
                    <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>-{formatCurrency(mExpense)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Net</span>
                    <span style={{ color: mIncome - mExpense >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {mIncome - mExpense >= 0 ? '+' : '-'}{formatCurrency(Math.abs(mIncome - mExpense))}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Edit Transaction' : 'New Transaction'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><span style={{ fontSize: 18 }}>×</span></button>
            </div>
            <div className="modal-body">
              {/* Type Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
                {['expense', 'income'].map(type => (
                  <button key={type} onClick={() => setForm(f => ({ ...f, type, category: CATEGORIES[type][0] }))} style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: form.type === type ? (type === 'income' ? 'var(--green)' : 'var(--red)') : 'transparent',
                    color: form.type === type ? 'var(--bg)' : 'var(--text-3)',
                    fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
                    textTransform: 'capitalize', transition: 'all 0.2s',
                  }}>{type}</button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="0" step="0.01" />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="input" placeholder="Add a note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              {editId && <button className="btn btn-danger btn-sm" onClick={() => { del(editId); setShowModal(false); }}>Delete</button>}
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Save Changes' : 'Add Transaction'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
