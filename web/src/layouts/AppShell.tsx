import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileTabBar } from './MobileTabBar';
import { ScrollTop } from '../components/ScrollTop';
import { PageTransition } from '../components/PageTransition';

export function AppShell() {
  const [dark, setDark] = useState(() => localStorage.getItem('rr-dark') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('rr-dark', dark ? '1' : '0');
  }, [dark]);

  // A new page should start at the top, not wherever the last one was scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-[var(--rr-bg)] text-[var(--rr-text)]">
      <div className="flex min-h-dvh">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <Topbar dark={dark} setDark={setDark} onMenu={() => setMobileOpen(true)} />
          <main className="mx-auto max-w-[1400px] px-3 pb-28 pt-5 sm:px-5 md:px-6 lg:px-8 lg:pb-10 lg:pt-7">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
      <MobileTabBar onMore={() => setMobileOpen(true)} />
      <ScrollTop />
    </div>
  );
}
