import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('gf_theme') || 'classic';
    } catch {
      return 'classic';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gf_theme', theme);
    } catch {
      // Fallback if localStorage is disabled
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => t === 'classic' ? 'editorial' : 'classic');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
