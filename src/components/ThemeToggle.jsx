'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ width: 40, height: 40 }}></div>;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="btn btn-secondary"
      style={{ borderRadius: '50%', padding: '0.5rem' }}
      aria-label="Changer de thème"
    >
      {theme === 'dark' ? (
        <Sun size={24} color="#fbbf24" />
      ) : (
        <Moon size={24} color="#374151" />
      )}
    </button>
  );
}