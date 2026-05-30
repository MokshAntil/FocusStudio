import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, Unlock, Eye, EyeOff, AlertTriangle, Shield, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function FocusLock() {
  const [password, setPassword] = useLocalStorage('focuslock-password', '');
  const [isLocked, setIsLocked] = useLocalStorage('focuslock-active', false);
  const [violations, setViolations] = useLocalStorage('focuslock-violations', 0);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showPenaltyOverlay, setShowPenaltyOverlay] = useState(false);

  const [setupStep, setSetupStep] = useState(1); // 1=set password, 2=confirm
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockInput, setUnlockInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [escapeAttempts, setEscapeAttempts] = useState(0);

  const penaltyRef = useRef(null);
  const returnTimeRef = useRef(null);
  const leaveTimeRef = useRef(null);

  // ── Visibility change handler ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveTimeRef.current = Date.now();
      } else {
        // Returned to tab
        const timeAway = leaveTimeRef.current
          ? Math.floor((Date.now() - leaveTimeRef.current) / 1000)
          : 0;
        leaveTimeRef.current = null;

        setViolations(v => v + 1);
        const penalty = Math.min(10 + timeAway * 2, 120); // scales with time away, max 2 min
        setPenaltySeconds(penalty);
        setPenaltyActive(true);
        setShowPenaltyOverlay(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLocked, setViolations]);

  // ── Penalty countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!penaltyActive || penaltySeconds <= 0) return;

    penaltyRef.current = setInterval(() => {
      setPenaltySeconds(prev => {
        if (prev <= 1) {
          clearInterval(penaltyRef.current);
          setPenaltyActive(false);
          setShowPenaltyOverlay(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(penaltyRef.current);
  }, [penaltyActive]);

  // ── Fullscreen management ───────────────────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  }, []);

  const exitFullscreen = useCallback(() => {
  try {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    }
  } catch (e) {
    // Document not in fullscreen, safe to ignore
  }
}, []);

  // Detect Escape from fullscreen while locked
  useEffect(() => {
    if (!isLocked) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isLocked) {
        setEscapeAttempts(a => a + 1);
        // Re-enter fullscreen after brief delay
        setTimeout(() => enterFullscreen(), 300);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isLocked, enterFullscreen]);

  // Block common keyboard shortcuts while locked
  useEffect(() => {
    if (!isLocked) return;
    const block = (e) => {
      // Block Ctrl+W, Ctrl+T, Ctrl+N, Alt+F4
      if ((e.ctrlKey && ['w', 't', 'n'].includes(e.key.toLowerCase())) ||
          (e.altKey && e.key === 'F4') ||
          (e.metaKey && ['w', 't', 'n'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        setEscapeAttempts(a => a + 1);
      }
    };
    document.addEventListener('keydown', block);
    return () => document.removeEventListener('keydown', block);
  }, [isLocked]);

  // ── Activate lock ───────────────────────────────────────────────────────────
  const activateLock = () => {
    setIsLocked(true);
    setViolations(0);
    setEscapeAttempts(0);
    enterFullscreen();
  };

  // ── Unlock ──────────────────────────────────────────────────────────────────
  const attemptUnlock = () => {
    if (unlockInput === password) {
      setIsLocked(false);
      setShowUnlockModal(false);
      setUnlockInput('');
      setError('');
      exitFullscreen();
    } else {
      setError('Incorrect password. Stay focused!');
      setUnlockInput('');
    }
  };

  // ── Setup password ──────────────────────────────────────────────────────────
  const handleSetupNext = () => {
    if (newPassword.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setError('');
    setSetupStep(2);
  };

  const handleSetupConfirm = () => {
    if (confirmPassword !== newPassword) { setError('Passwords do not match.'); return; }
    setPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setSetupStep(1);
    setShowSetupModal(false);
    setError('');
  };

  const totalSessions = violations;

  return (
    <>
      {/* ── Floating Lock Button ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      }}>
        {/* Status badge */}
        {isLocked && (
          <div style={{
            background: 'var(--red)', color: 'var(--bg)', padding: '4px 12px',
            borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em', fontWeight: 600,
            boxShadow: '0 0 16px var(--red)66',
            animation: 'pulse 2s infinite',
          }}>
            🔴 FOCUS LOCK ON
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Setup password */}
          {!isLocked && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setShowSetupModal(true); setSetupStep(password ? 0 : 1); setError(''); setNewPassword(''); setConfirmPassword(''); setUnlockInput(''); }}
              data-tooltip={password ? 'Change password' : 'Set password'}
            >
              <Shield size={14} />
              {password ? 'Change PIN' : 'Set PIN'}
            </button>
          )}

          {/* Main lock/unlock button */}
          <button
            onClick={() => {
              if (isLocked) { setShowUnlockModal(true); setUnlockInput(''); setError(''); }
              else {
                if (!password) { setShowSetupModal(true); setSetupStep(1); }
                else activateLock();
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: isLocked ? 'var(--red)' : 'var(--accent)',
              color: 'var(--bg)', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              boxShadow: isLocked ? '0 0 20px var(--red)44' : '0 0 20px var(--accent)44',
              transition: 'all 0.2s',
            }}
          >
            {isLocked ? <><Unlock size={15} /> Unlock</> : <><Lock size={15} /> Focus Lock</>}
          </button>
        </div>

        {/* Violation counter */}
        {isLocked && violations > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            ⚠ {violations} tab switch{violations !== 1 ? 'es' : ''} detected
          </div>
        )}
      </div>

      {/* ── Penalty Overlay ──────────────────────────────────────────────── */}
      {showPenaltyOverlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.96)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--red)', marginBottom: 12 }}>
              Tab Switch Detected
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 40, lineHeight: 1.7 }}>
              You left this tab. You must wait before you can continue.
              <br />
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Total violations this session: {violations}</span>
            </div>

            {/* Countdown ring */}
            <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 40px' }}>
              <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="68" fill="none" stroke="var(--bg-3)" strokeWidth="6" />
                <circle
                  cx="80" cy="80" r="68" fill="none" stroke="var(--red)" strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - penaltySeconds / (10 + violations * 2))}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 42, color: 'var(--red)', lineHeight: 1 }}>{penaltySeconds}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>seconds</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
              "Discipline is choosing between what you want now<br />and what you want most."
            </div>
          </div>
        </div>
      )}

      {/* ── Unlock Modal ─────────────────────────────────────────────────── */}
      {showUnlockModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Lock size={18} style={{ color: 'var(--accent)' }} />
                Unlock Focus Mode
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
                Enter your password to exit Focus Lock.
                {escapeAttempts > 0 && (
                  <span style={{ display: 'block', color: 'var(--red)', marginTop: 6, fontSize: 12 }}>
                    ⚠ {escapeAttempts} escape attempt{escapeAttempts !== 1 ? 's' : ''} detected.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter your password"
                    value={unlockInput}
                    onChange={e => { setUnlockInput(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && attemptUnlock()}
                    autoFocus
                    style={{ paddingRight: 40 }}
                  />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUnlockModal(false)}>Stay Focused</button>
              <button className="btn btn-primary" onClick={attemptUnlock}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Setup Password Modal ──────────────────────────────────────────── */}
      {showSetupModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSetupModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={18} style={{ color: 'var(--accent)' }} />
                {password ? 'Change Password' : 'Set Focus Password'}
              </div>
              <button className="btn-icon" onClick={() => setShowSetupModal(false)}><X size={16} /></button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[0, 1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: setupStep >= s ? 'var(--accent)' : 'var(--bg-4)', transition: 'background 0.3s' }} />
              ))}
            </div>

            {setupStep === 0 ? (
  <>
    <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
      Enter your current password to continue.
    </div>
    <div className="form-group" style={{ marginBottom: 16 }}>
      <label className="form-label">Current Password</label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPw ? 'text' : 'password'}
          className="input"
          placeholder="Enter current password"
          value={unlockInput}
          onChange={e => { setUnlockInput(e.target.value); setError(''); }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (unlockInput === password) { setSetupStep(1); setUnlockInput(''); setError(''); }
              else { setError('Incorrect password.'); setUnlockInput(''); }
            }
          }}
          autoFocus
          style={{ paddingRight: 40 }}
        />
        <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
    <div className="modal-footer">
      <button className="btn btn-ghost" onClick={() => setShowSetupModal(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={() => {
        if (unlockInput === password) { setSetupStep(1); setUnlockInput(''); setError(''); }
        else { setError('Incorrect password.'); setUnlockInput(''); }
      }}>Verify →</button>
    </div>
  </>
) : setupStep === 1 ? (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                  This password will be required to exit Focus Lock mode. Choose something you'll remember.
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">New Password (min. 4 characters)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      placeholder="Enter a password"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSetupNext()}
                      autoFocus
                      style={{ paddingRight: 40 }}
                    />
                    <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setShowSetupModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSetupNext}>Next →</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                  Confirm your password to make sure you typed it correctly.
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSetupConfirm()}
                    autoFocus
                  />
                  {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => { setSetupStep(1); setError(''); }}>← Back</button>
                  <button className="btn btn-primary" onClick={handleSetupConfirm}>Save Password</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}