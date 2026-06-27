import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USERS = [
  { id: 'user-default', username: 'admin', password: 'maison2024', role: 'Administrator', isDefault: true }
];

function readLocalUsers() {
  const saved = localStorage.getItem('gf_users');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_USERS;
    } catch (_error) {
      return DEFAULT_USERS;
    }
  }
  return DEFAULT_USERS;
}

function mergeUsers(primaryUsers, secondaryUsers) {
  const merged = [];
  const seen = new Set();

  [...(primaryUsers || []), ...(secondaryUsers || [])].forEach(user => {
    if (!user || !user.username) return;
    const key = user.username.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({
      id: user.id || `user-${Date.now()}-${merged.length}`,
      username: user.username,
      password: user.password || '',
      role: user.role || 'Administrator',
      isDefault: !!user.isDefault
    });
  });

  return merged.length ? merged : DEFAULT_USERS;
}

async function fetchCloudState() {
  const response = await fetch('/api/state', { method: 'GET' });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || 'Unable to load cloud state.');
  }
  return result.state || {};
}

async function saveUsersToCloud(nextUsers) {
  try {
    const state = await fetchCloudState();
    const nextState = {
      ...state,
      // SECURITY NOTE: This preserves the existing plaintext password format for compatibility.
      // Do not treat this as production-grade authentication. Password hashing should be added in a separate approved change.
      users: nextUsers
    };

    const response = await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: nextState })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Unable to save cloud users.');
    }
    return result;
  } catch (error) {
    console.warn('User cloud sync failed; local cache remains available:', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => readLocalUsers());

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gf_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_error) {
        return null;
      }
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('gf_is_admin') === 'true');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem('gf_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    let cancelled = false;

    const hydrateUsers = async () => {
      const localUsers = readLocalUsers();
      try {
        const state = await fetchCloudState();
        const cloudUsers = Array.isArray(state.users) ? state.users : [];
        const mergedUsers = cloudUsers.length ? mergeUsers(cloudUsers, localUsers) : localUsers;

        if (!cancelled) {
          setUsers(mergedUsers);
          localStorage.setItem('gf_users', JSON.stringify(mergedUsers));

          if (currentUser) {
            const refreshedCurrentUser = mergedUsers.find(u => u.id === currentUser.id || u.username === currentUser.username);
            if (refreshedCurrentUser) {
              setCurrentUser(refreshedCurrentUser);
              localStorage.setItem('gf_current_user', JSON.stringify(refreshedCurrentUser));
            }
          }
        }

        if (!cloudUsers.length || mergedUsers.length !== cloudUsers.length) {
          await saveUsersToCloud(mergedUsers);
        }
      } catch (error) {
        console.warn('User cloud hydration failed; using local cache:', error);
      }
    };

    hydrateUsers();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (usernameInput, passwordInput) => {
    const foundUser = users.find(
      u => u.username.toLowerCase() === usernameInput.trim().toLowerCase() && u.password === passwordInput
    );
    if (foundUser) {
      setIsAdmin(true);
      setCurrentUser(foundUser);
      localStorage.setItem('gf_is_admin', 'true');
      localStorage.setItem('gf_current_user', JSON.stringify(foundUser));
      setLoginError('');
      return true;
    }

    setLoginError('Invalid username or password.');
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('gf_is_admin');
    localStorage.removeItem('gf_current_user');
  };

  const createUser = (username, password, role = 'Administrator') => {
    if (!username.trim() || !password) {
      throw new Error('Username and password are required.');
    }
    const exists = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      throw new Error('Username already exists.');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username: username.trim(),
      // SECURITY NOTE: Plaintext is retained only to preserve the current login flow.
      password: password,
      role: role,
      isDefault: false
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    localStorage.setItem('gf_users', JSON.stringify(nextUsers));
    void saveUsersToCloud(nextUsers);
    return newUser;
  };

  const deleteUser = (userId) => {
    if (users.length <= 1) {
      throw new Error('Cannot delete the last user. You must keep at least one active user.');
    }

    const nextUsers = users.filter(u => u.id !== userId);
    setUsers(nextUsers);
    localStorage.setItem('gf_users', JSON.stringify(nextUsers));
    void saveUsersToCloud(nextUsers);

    if (currentUser && currentUser.id === userId) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      users,
      currentUser,
      isAdmin,
      login,
      logout,
      loginError,
      setLoginError,
      createUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
