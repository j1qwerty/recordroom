import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar, type Theme } from './Topbar';
import { ScrollTop } from '../components/ScrollTop';
import { PageTransition } from '../components/PageTransition';
import { CommandPalette } from '../components/CommandPalette';

function initialTheme(): Theme {
  const saved = localStorage.getItem('rr-theme');
  if (saved === 'light' || saved === 'blue' || saved === 'dark') return saved;
  return localStorage.getItem('rr-dark') === '1' ? 'dark' : 'light';
}

export function AppShell() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const openPalette = () => setPaletteOpen(true);
    window.addEventListener('rr:open-command-palette', openPalette);
    return () => window.removeEventListener('rr:open-command-palette', openPalette);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('rr-theme', theme);
    localStorage.setItem('rr-dark', theme === 'dark' ? '1' : '0');
  }, [theme]);

  return (
    <div className="min-h-dvh bg-[var(--rr-bg)] text-[var(--rr-text)]">
      <div className="flex min-h-dvh">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <Topbar
            theme={theme}
            setTheme={setTheme}
            onMenu={() => setMobileOpen(true)}
            onCommandPalette={() => window.dispatchEvent(new CustomEvent('rr:open-command-palette'))}
          />
          <main className="relative min-w-0">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56 page-grid opacity-25" />
            <div className="relative mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-7">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ScrollTop />
    </div>
  );
}
