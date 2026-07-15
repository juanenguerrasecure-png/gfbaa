import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLogin.module.css';

export function AdminLogin({ onBack, onSuccess }) {
  const { login, loginError, setLoginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ok = await login(username, password);
      if (ok && onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.lockIcon}>
          <Lock size={24} strokeWidth={1.5} color="var(--gold)" />
        </div>
        <h1 className={styles.title}>Admin</h1>
        <p className={styles.sub}>Good Finds by AA Dashboard</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              className={styles.input}
              value={username}
              onChange={e => { setUsername(e.target.value); setLoginError(''); }}
              placeholder="Username"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.pwWrap}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className={styles.input}
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {loginError && <p className={styles.error} role="alert">{loginError}</p>}

          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className={styles.hint}>
          Use your administrator account credentials to log in.
        </p>

        <button className={styles.backLink} onClick={onBack}>
          ← Back to store
        </button>
      </div>
    </div>
  );
}
