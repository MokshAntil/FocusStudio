import React, { useState } from 'react';
import { Plus, Trash2, Search, Pin, PinOff, FileText } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const COLORS = ['#1e1e21', '#1e2121', '#211e21', '#1e211e', '#21211e'];
const COLOR_LABELS = ['Default', 'Teal', 'Purple', 'Green', 'Amber'];
const COLOR_ACCENTS = ['var(--text-3)', '#7eb5c8', '#c87ec8', '#7ec89a', '#c8a97e'];

export default function Notes() {
  const [notes, setNotes] = useLocalStorage('quick-notes', []);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);

  const filtered = notes.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const addNote = () => {
    const note = {
      id: Date.now(),
      title: 'Untitled',
      content: '',
      color: 0,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    openNote(note);
  };

  const openNote = (note) => { setActiveId(note.id); setActiveNote({ ...note }); };

  const saveNote = () => {
    if (!activeNote) return;
    setNotes(prev => prev.map(n => n.id === activeId ? { ...activeNote, updatedAt: new Date().toISOString() } : n));
  };

  const delNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeId === id) { setActiveId(null); setActiveNote(null); }
  };

  const togglePin = (id) => setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const wordCount = (activeNote?.content || '').trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 30 }} placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ padding: '9px 12px' }} onClick={addNote}><Plus size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)' }}>
              <FileText size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div style={{ fontSize: 12 }}>No notes yet</div>
            </div>
          ) : filtered.map(note => (
            <div
              key={note.id}
              onClick={() => openNote(note)}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                background: activeId === note.id ? 'var(--accent-dim)' : 'var(--bg-2)',
                border: `1px solid ${activeId === note.id ? 'var(--accent)44' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {note.title || 'Untitled'}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {note.pinned && <Pin size={11} style={{ color: 'var(--accent)' }} />}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {note.content || 'Empty note'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      {activeNote ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button className="btn-icon" onClick={() => { togglePin(activeId); setActiveNote(prev => ({ ...prev, pinned: !prev.pinned })); }} data-tooltip={activeNote.pinned ? 'Unpin' : 'Pin'}>
              {activeNote.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
            {COLOR_ACCENTS.map((c, i) => (
              <button key={i} onClick={() => setActiveNote(prev => ({ ...prev, color: i }))} style={{
                width: 16, height: 16, borderRadius: '50%', border: `2px solid ${activeNote.color === i ? c : 'transparent'}`,
                background: c, cursor: 'pointer', transition: 'all 0.2s', padding: 0,
              }} />
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {wordCount} words
            </div>
            <button className="btn btn-ghost btn-sm" onClick={saveNote}>Save</button>
            <button className="btn-icon" onClick={() => delNote(activeId)} style={{ color: 'var(--red)' }} data-tooltip="Delete">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Note content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '20px 28px' }}>
            <input
              value={activeNote.title}
              onChange={e => setActiveNote(prev => ({ ...prev, title: e.target.value }))}
              onBlur={saveNote}
              placeholder="Title"
              style={{
                background: 'none', border: 'none', outline: 'none', fontSize: 26,
                fontFamily: 'var(--font-display)', color: 'var(--text)', width: '100%',
                marginBottom: 16, padding: 0,
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
              {new Date(activeNote.updatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <textarea
              value={activeNote.content}
              onChange={e => setActiveNote(prev => ({ ...prev, content: e.target.value }))}
              onBlur={saveNote}
              placeholder="Start writing..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                fontSize: 14, color: 'var(--text-2)', fontFamily: 'var(--font-body)',
                lineHeight: 1.8, width: '100%', padding: 0,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <FileText size={48} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>Select a note or create a new one</div>
          <button className="btn btn-primary" onClick={addNote}><Plus size={14} /> New Note</button>
        </div>
      )}
    </div>
  );
}
