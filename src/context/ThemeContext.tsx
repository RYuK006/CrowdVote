import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    const isAppearanceTransition =
      typeof (document as any).startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
      return;
    }

    const rect = event?.currentTarget instanceof HTMLElement
      ? event.currentTarget.getBoundingClientRect()
      : null;
    const x = rect ? rect.left + rect.width / 2 : (event?.clientX ?? window.innerWidth / 2);
    const y = rect ? rect.top + rect.height / 2 : (event?.clientY ?? window.innerHeight);

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setTheme(prev => {
          const next = prev === 'light' ? 'dark' : 'light';
          const root = window.document.documentElement;
          if (next === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
            root.style.colorScheme = 'dark';
          } else {
            root.classList.remove('dark');
            root.classList.add('light');
            root.style.colorScheme = 'light';
          }
          localStorage.setItem('theme', next);
          return next;
        });
      });
    });

    transition.ready
      .then(() => {
        try {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 550,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        } catch (e) {
          console.warn('View transition animation fallback:', e);
        }
      })
      .catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
