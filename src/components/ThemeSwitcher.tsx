import { useEffect, useState } from 'react';
import './ThemeSwitcher.css';

type Theme = 'auto' | 'light' | 'dark';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'auto';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const root = document.documentElement;
    if (theme === 'auto') {
      root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'auto';
    });
  };

  const getIcon = () => {
    if (theme === 'auto') return <i className="bx bx-laptop"></i>;
    if (theme === 'light') return <i className="bx bx-sun"></i>;
    return <i className="bx bx-moon"></i>;
  };

  const getTooltip = () => {
    if (theme === 'auto') return '시스템 설정';
    if (theme === 'light') return '라이트 모드';
    return '다크 모드';
  };

  return (
    <button 
      className="theme-switcher" 
      onClick={cycleTheme}
      title={getTooltip()}
      aria-label="테마 변경"
    >
      {getIcon()}
    </button>
  );
}