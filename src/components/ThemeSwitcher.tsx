import { useEffect, useState } from 'react';
import './ThemeSwitcher.css';

type Theme = 'auto' | 'light' | 'dark';
const THEME_COLORS: Record<'light' | 'dark', string> = {
  light: '#ffffff',
  dark: '#1a1a1c'
};

function updateThemeColorMeta(activeTheme: 'light' | 'dark') {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', THEME_COLORS[activeTheme]);
  }
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'auto';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const root = document.documentElement;
    const applyTheme = (activeTheme: 'light' | 'dark') => {
      root.setAttribute('data-theme', activeTheme);
      updateThemeColorMeta(activeTheme);
    };

    if (theme === 'auto') {
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      applyTheme(theme);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        applyTheme(e.matches ? 'dark' : 'light');
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