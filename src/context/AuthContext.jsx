import { createContext, useContext, useEffect, useState } from 'react';
import { hashPassword, isPasswordHash, verifyPassword } from '../utils/crypto';

const AuthContext = createContext(null);
const SESSION_HOURS = 8;

function readLocalUsers() {
  const saved = localStorage.getItem('gf_users');
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function readCurrentUser() {
  const saved = localStorage.getItem('gf_current_user');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (_error) {
    return null;
  }
}

function normalizeUser(user) {
  return {
    id: user.id || `user-${Date.now()}`,
    username: user.username,
    password: user.password || '',
    role: user.role || 'Administrator',
    isDefault: !!user.isDefault
  };
}

function mergeUsers(primaryUsers, secondaryUsers) {
  const merged = [];
  const seen = new Set();
  [...(primaryUsers || []), ...(secondaryUsers || [])].forEach(user => {
    if (!user || !user.username) return;
    const key = user.username.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalizeUser(user));
  });
  return merged;
}

function getSessionToken() {
  return localStorage.getItem('gf_session_token') || '';
}

function authHeaders(extra = {}) {
  const token = getSessionToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function fetchCloudState() {
  try {
    const response = await fetch('/api/state', { method: 'GET' });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load cloud state.');
    return result.state || {};
  } catch (error) {
    console.warn('fetchCloudState failed; using empty cloud state fallback:', error);
    return {};
  }
}

async function saveUsersToCloud(nextUsers) {
  try {
    const state = await fetchCloudState();
    const response = await fetch('/api/state', {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ state: { ...state, users: nextUsers } })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to save cloud users.');
    return result;
  } catch (error) {
    console.warn('User cloud sync failed; local cache remains available:', error);
    return null;
  }
}

async function createCloudUser(userPayload, token = '') {
  try {
    const headers = token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
    const response = await fetch('/api/users', { method: 'POST', headers, body: JSON.stringify(userPayload) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to create user.');
    return result.user;
  } catch (error) {
    console.warn('createCloudUser failed; falling back to local user creation:', error);
    const id = userPayload.id || `user-${Date.now()}`;
    return {
      id,
      username: userPayload.username,
      password: userPayload.password, // already hashed
      role: userPayload.role || 'Administrator',
      isDefault: !!userPayload.isDefault
    };
  }
}

async function createCloudSession(username, password) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, hours: SESSION_HOURS })
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to create secure session.');
  return result;
}

async function deleteCloudSession(token) {
  if (!token) return;
  try {
    await fetch('/api/sessions/current', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    console.warn('Session revoke failed; local session cleared:', error);
  }
}

function FirstRunSetup({ onCreated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!username.trim()) return setError('Username is required.');
    if (password.length < 8) return setError('Use at least 8 characters for the initial admin password.');

    setBusy(true);
    try {
      const hashedPassword = await hashPassword(password);
      const user = await createCloudUser({ username, password: hashedPassword, role: 'Administrator' });
      localStorage.setItem('gf_users', JSON.stringify([user]));
      onCreated([user]);
    } catch (err) {
      setError(err.message || 'Unable to create initial administrator.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-[#E5DFD8] rounded p-6 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#C9A84C] mb-2">First-run security setup</p>
          <h1 className="font-display text-2xl text-stone-900 font-normal">Create Admin Account</h1>
          <p className="text-sm text-stone-500 mt-1">No administrator exists yet. Create the first account before launching the admin panel.</p>
        </div>
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
        <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-600">Username</label><input className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></div>
        <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-stone-600">Password</label><input className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></div>
        <button disabled={busy} className="w-full bg-stone-900 text-white rounded py-2.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-50">{busy ? 'Creating...' : 'Create Admin Account'}</button>
      </form>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => readLocalUsers());
  const [currentUser, setCurrentUser] = useState(() => readCurrentUser());
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('gf_is_admin') === 'true' && Boolean(getSessionToken()));
  const [loginError, setLoginError] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [needsFirstRunSetup, setNeedsFirstRunSetup] = useState(false);

  useEffect(() => { localStorage.setItem('gf_users', JSON.stringify(users)); }, [users]);

  useEffect(() => {
    let cancelled = false;
    const hydrateUsers = async () => {
      const localUsers = readLocalUsers();
      try {
        const state = await fetchCloudState();
        const cloudUsers = Array.isArray(state.users) ? state.users : [];
        const mergedUsers = mergeUsers(cloudUsers, localUsers);
        if (!cancelled) {
          setUsers(mergedUsers);
          localStorage.setItem('gf_users', JSON.stringify(mergedUsers));
          setNeedsFirstRunSetup(mergedUsers.length === 0);
          const localCurrentUser = readCurrentUser();
          if (localCurrentUser) {
            const refreshedCurrentUser = mergedUsers.find(u => u.id === localCurrentUser.id || u.username === localCurrentUser.username);
            if (refreshedCurrentUser) {
              setCurrentUser(refreshedCurrentUser);
              localStorage.setItem('gf_current_user', JSON.stringify(refreshedCurrentUser));
            }
          }
        }
      } catch (error) {
        console.warn('User cloud hydration failed; using local cache:', error);
        if (!cancelled) setNeedsFirstRunSetup(localUsers.length === 0);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    hydrateUsers();
    return () => { cancelled = true; };
  }, []);

  const migratePlaintextPassword = async (user, plaintextPassword) => {
    const hashedPassword = await hashPassword(plaintextPassword);
    const nextUsers = users.map(u => u.id === user.id ? { ...u, password: hashedPassword } : u);
    setUsers(nextUsers);
    localStorage.setItem('gf_users', JSON.stringify(nextUsers));
    await saveUsersToCloud(nextUsers);
    return { ...user, password: hashedPassword };
  };

  const login = async (usernameInput, passwordInput) => {
    const foundUser = users.find(u => u.username.toLowerCase() === usernameInput.trim().toLowerCase());
    if (!foundUser) {
      setLoginError('Invalid username or password.');
      return false;
    }

    let verified = false;
    let sessionUser = foundUser;
    if (isPasswordHash(foundUser.password)) verified = await verifyPassword(passwordInput, foundUser.password);
    else {
      verified = foundUser.password === passwordInput;
      if (verified) sessionUser = await migratePlaintextPassword(foundUser, passwordInput);
    }

    if (!verified) {
      setLoginError('Invalid username or password.');
      return false;
    }

    try {
      let loginResult;
      try {
        loginResult = await createCloudSession(sessionUser.username, sessionUser.password);
      } catch (sessionError) {
        const state = await fetchCloudState();
        const cloudUsers = Array.isArray(state.users) ? state.users : [];
        if (cloudUsers.length === 0) {
          const seededUser = await createCloudUser({ username: sessionUser.username, password: sessionUser.password, role: sessionUser.role || 'Administrator', id: sessionUser.id });
          const nextUsers = mergeUsers([seededUser], users);
          setUsers(nextUsers);
          localStorage.setItem('gf_users', JSON.stringify(nextUsers));
          sessionUser = seededUser;
          loginResult = await createCloudSession(sessionUser.username, sessionUser.password);
        } else {
          throw sessionError;
        }
      }

      const session = loginResult.session;
      sessionUser = loginResult.user || sessionUser;
      localStorage.setItem('gf_session_token', session.token);
      localStorage.setItem('gf_session_expires_at', session.expiresAt);
    } catch (error) {
      setLoginError(error.message || 'Unable to create secure session.');
      return false;
    }

    setIsAdmin(true);
    setCurrentUser(sessionUser);
    localStorage.setItem('gf_is_admin', 'true');
    localStorage.setItem('gf_current_user', JSON.stringify(sessionUser));
    setLoginError('');
    return true;
  };

  const logout = () => {
    const token = getSessionToken();
    void deleteCloudSession(token);
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('gf_is_admin');
    localStorage.removeItem('gf_current_user');
    localStorage.removeItem('gf_session_token');
    localStorage.removeItem('gf_session_expires_at');
  };

  const createUser = async (username, password, role = 'Administrator') => {
    if (!username.trim() || !password) throw new Error('Username and password are required.');
    const exists = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) throw new Error('Username already exists.');
    const hashedPassword = await hashPassword(password);
    const userFromCloud = await createCloudUser({ username: username.trim(), password: hashedPassword, role }, getSessionToken());
    const nextUsers = [...users, userFromCloud];
    setUsers(nextUsers);
    localStorage.setItem('gf_users', JSON.stringify(nextUsers));
    return userFromCloud;
  };

  const deleteUser = async (userId) => {
    if (users.length <= 1) throw new Error('Cannot delete the last user. You must keep at least one active user.');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE', headers: authHeaders() });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Failed to delete user.');
      const nextUsers = Array.isArray(result.data) ? result.data : users.filter(u => u.id !== userId);
      setUsers(nextUsers);
      localStorage.setItem('gf_users', JSON.stringify(nextUsers));
    } catch (error) {
      console.warn('deleteUser failed; deleting user locally:', error);
      const nextUsers = users.filter(u => u.id !== userId);
      setUsers(nextUsers);
      localStorage.setItem('gf_users', JSON.stringify(nextUsers));
    }
    if (currentUser && currentUser.id === userId) logout();
  };

  if (!authReady) return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-[#E5DFD8] border-t-[#C9A84C] animate-spin" /></div>;
  if (needsFirstRunSetup) return <FirstRunSetup onCreated={(nextUsers) => { setUsers(nextUsers); setNeedsFirstRunSetup(false); }} />;

  return (
    <AuthContext.Provider value={{ users, currentUser, isAdmin, login, logout, loginError, setLoginError, createUser, deleteUser, authReady, sessionToken: getSessionToken() }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
