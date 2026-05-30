import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Coffee, Brain, Zap, CheckCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MODES = {
  pomodoro: { label: 'Pomodoro', minutes: 25, color: 'var(--accent)' },
  short: { label: 'Short Break', minutes: 5, color: 'var(--green)' },
  long: { label: 'Long Break', minutes: 15, color: 'var(--accent-2)' },
  custom: { label: 'Custom', minutes: 45, color: 'var(--amber)' },
};

export default function Timer() {
  const [settings, setSettings] = useLocalStorage('timer-settings', {
    pomodoro: 25, short: 5, long: 15, custom: 45, autoStart: false, soundEnabled: true
  });
  const [mode, setMode] = useLocalStorage('timer-mode', 'pomodoro');
  const [sessions, setSessionData] = useLocalStorage('pomodoro-sessions', []);
  const [pomodoroCount, setPomodoroCount] = useLocalStorage('pomodoro-count-today', { count: 0, date: '' });

  const [timeLeft, setTimeLeft] = useState(settings[mode] * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const intervalRef = useRef(null);
  const totalTime = settings[mode] * 60;

  // Reset timer on mode change
  useEffect(() => {
    setTimeLeft(settings[mode] * 60);
    setIsRunning(false);
  }, [mode, settings]);

  // Reset pomodoro count daily
  useEffect(() => {
    const today = new Date().toDateString();
    if (pomodoroCount.date !== today) {
      setPomodoroCount({ count: 0, date: today });
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleComplete = useCallback(() => {
    if (mode === 'pomodoro') {
      const today = new Date().toDateString();
      setPomodoroCount(prev => ({
        count: prev.date === today ? prev.count + 1 : 1,
        date: today
      }));
      const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        mode,
        duration: settings[mode],
      };
      setSessionData(prev => [session, ...prev].slice(0, 100));
    }
    // Sound notification
    if (settings.soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const times = [0, 0.3, 0.6];
        times.forEach(t => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = mode === 'pomodoro' ? 880 : 440;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.3);
        });
      } catch (e) {}
    }
  }, [mode, settings, setSessionData, setPomodoroCount]);

  const reset = () => { setTimeLeft(settings[mode] * 60); setIsRunning(false); };
  const skip = () => {
    setIsRunning(false);
    const modes = ['pomodoro', 'short', 'long', 'custom'];
    const next = modes[(modes.indexOf(mode) + 1) % modes.length];
    setMode(next);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = 1 - timeLeft / totalTime;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);
  const modeColor = MODES[mode]?.color || 'var(--accent)';

  const todayCount = pomodoroCount.date === new Date().toDateString() ? pomodoroCount.count : 0;
  const todayMinutes = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.duration, 0);

  const saveSettings = () => {
    setSettings(tempSettings);
    setShowSettings(false);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

        {/* Main Timer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 40, background: 'var(--bg-3)', padding: '4px', borderRadius: 10, border: '1px solid var(--border)' }}>
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: mode === key ? val.color : 'transparent',
                  color: mode === key ? 'var(--bg)' : 'var(--text-3)',
                  fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500,
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >{val.label}</button>
            ))}
          </div>

          {/* Ring Timer */}
          <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 36 }}>
            <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="140" cy="140" r="120" fill="none" stroke="var(--bg-3)" strokeWidth="8" />
              <circle
                cx="140" cy="140" r="120" fill="none"
                stroke={modeColor} strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 56, fontWeight: 400, letterSpacing: '-2px',
                color: 'var(--text)', lineHeight: 1
              }}>
                {minutes}<span style={{ color: 'var(--text-3)' }}>:</span>{seconds}
              </div>
              <div style={{ fontSize: 11, color: modeColor, fontFamily: 'var(--font-mono)', marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {MODES[mode]?.label}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-icon" onClick={reset} data-tooltip="Reset">
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                width: 60, height: 60, borderRadius: '50%', border: 'none',
                background: modeColor, color: 'var(--bg)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 24px ${modeColor}44`,
                transition: 'all 0.2s',
              }}
            >
              {isRunning ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
            </button>
            <button className="btn-icon" onClick={skip} data-tooltip="Skip">
              <SkipForward size={16} />
            </button>
            <button className="btn-icon" onClick={() => { setShowSettings(true); setTempSettings(settings); }} data-tooltip="Settings">
              <Settings size={16} />
            </button>
          </div>

          {/* Pomodoro dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 28 }}>
            {Array.from({ length: Math.min(todayCount + 1, 12) }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < todayCount ? modeColor : 'var(--bg-4)',
                border: '1px solid var(--border)',
              }} />
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {todayCount} pomodoros today
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats */}
          <div className="card">
            <div className="card-title">Today's Focus</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: <CheckCircle size={16} />, label: 'Sessions', value: todayCount, color: 'var(--accent)' },
                { icon: <Brain size={16} />, label: 'Focus Time', value: `${todayMinutes}m`, color: 'var(--accent-2)' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--bg-3)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ color: stat.color, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Technique Guide */}
          <div className="card">
            <div className="card-title">Technique</div>
            {[
              { icon: <Brain size={14} />, title: 'Pomodoro — 25 min', desc: 'Deep focus work session', active: mode === 'pomodoro' },
              { icon: <Coffee size={14} />, title: 'Short Break — 5 min', desc: 'Rest and recharge', active: mode === 'short' },
              { icon: <Zap size={14} />, title: 'Long Break — 15 min', desc: 'After 4 pomodoros', active: mode === 'long' },
            ].map(item => (
              <div key={item.title} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0',
                borderBottom: '1px solid var(--border-soft)', opacity: item.active ? 1 : 0.5,
              }}>
                <div style={{ color: item.active ? 'var(--accent)' : 'var(--text-3)', marginTop: 1 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.desc}</div>
                </div>
                {item.active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 4, flexShrink: 0 }} />}
              </div>
            ))}
          </div>

          {/* Recent Sessions */}
          <div className="card" style={{ flex: 1, overflow: 'hidden' }}>
            <div className="card-title">Recent Sessions</div>
            <div style={{ overflowY: 'auto', maxHeight: 180 }}>
              {sessions.length === 0 ? (
                <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  No sessions yet. Start a timer!
                </div>
              ) : sessions.slice(0, 10).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>{MODES[s.mode]?.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 11 }}>
                    {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="badge badge-accent">{s.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Timer Settings</div>
              <button className="btn-icon" onClick={() => setShowSettings(false)}><span style={{ fontSize: 18 }}>×</span></button>
            </div>
            <div className="modal-body">
              {['pomodoro', 'short', 'long', 'custom'].map(key => (
                <div className="form-group" key={key}>
                  <label className="form-label">{MODES[key].label} (minutes)</label>
                  <input
                    type="number" className="input" min="1" max="120"
                    value={tempSettings[key]}
                    onChange={e => setTempSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Sound Notifications</span>
                <button
                  onClick={() => setTempSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: tempSettings.soundEnabled ? 'var(--accent)' : 'var(--bg-4)',
                    position: 'relative', transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3, transition: 'left 0.2s',
                    left: tempSettings.soundEnabled ? 21 : 3,
                  }} />
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
