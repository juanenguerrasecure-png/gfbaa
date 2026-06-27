import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USERS = [
  { id: 'user-default', username: 'admin', password: 'maison2024', role: 'Administrator', isDefault: true }
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('gf_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gf_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('gf_is_admin') === 'true';
  });
  
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem('gf_users', JSON.stringify(users));
  }, [users]);

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
    } else {
      setLoginError('Invalid username or password.');
      return false;
    }
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
      password: password,
      role: role,
      isDefault: false
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const deleteUser = (userId) => {
    if (users.length <= 1) {
      throw new Error('Cannot delete the last user. You must keep at least one active user.');
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
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
