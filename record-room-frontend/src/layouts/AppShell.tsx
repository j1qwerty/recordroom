import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ScrollTop } from '../components/ScrollTop';
import { PageTransition } from '../components/PageTransition';

export function AppShell() {
  const [dark, setDark] = useState(() => localStorage.getItem('rr-dark') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('rr-dark', dark ? '1' : '0');
  }, [dark]);

  return (
    <div className="min-h-dvh bg-[var(--rr-bg)] text-[var(--rr-text)]">
      <div className="flex min-h-dvh">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <Topbar dark={dark} setDark={setDark} onMenu={() => setMobileOpen(true)} />
          <main className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 page-grid opacity-30" />
            <div className="relative mx-auto max-w-[1500px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
      <ScrollTop />
    </div>
  );
}
