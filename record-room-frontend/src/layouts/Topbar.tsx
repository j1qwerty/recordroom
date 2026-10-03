import { List, MagnifyingGlass, Moon, SignOut, Sun } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useService';

export function Topbar({
  dark,
  setDark,
  onMenu,
}: {
  dark: boolean;
  setDark: (value: boolean) => void;
  onMenu: () => void;
}) {
  const navigate = useNavigate();
  const { user, signOut } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-base bg-[color-mix(in_srgb,var(--rr-surface)_88%,transparent)] px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onMenu}
        className="focus-ring rounded-lg p-2 lg:hidden"
        aria-label="Open navigation"
      >
        <List size={22} />
      </button>
      <button
        onClick={() => navigate('/search')}
        className="focus-ring hidden min-w-0 flex-1 items-center gap-3 rounded-lg border border-base bg-[var(--rr-bg)] px-4 py-2.5 text-left sm:flex md:max-w-xl"
      >
        <MagnifyingGlass size={18} className="muted" />
        <span className="muted truncate text-sm">
          Search file no., barcode, subject, department or area…
        </span>
        <kbd className="ml-auto hidden rounded border border-base px-1.5 py-0.5 text-[10px] muted md:block">
          /
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 hidden rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-semibold text-accent md:inline">
          {user?.role ?? 'Signed out'}
        </span>
        <button
          onClick={() => setDark(!dark)}
          className="focus-ring rounded-lg p-2.5 hover:bg-[var(--rr-surface-2)]"
          aria-label={dark ? 'Use light mode' : 'Use dark mode'}
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          onClick={signOut}
          className="focus-ring rounded-lg p-2.5 hover:bg-[var(--rr-surface-2)]"
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOut size={19} />
        </button>
      </div>
    </header>
  );
}
