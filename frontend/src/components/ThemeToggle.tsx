import { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../App';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="btn-icon theme-toggle-btn tooltip-bottom"
      id="btn-theme-toggle"
      data-tooltip={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
