import { Bell, List, MagnifyingGlass, Moon, Sun } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

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
          Search file no., RF ID, subject, department or OCR text…
        </span>
        <kbd className="ml-auto hidden rounded border border-base px-1.5 py-0.5 text-[10px] muted md:block">
          /
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => setDark(!dark)}
          className="focus-ring rounded-lg p-2.5 hover:bg-[var(--rr-surface-2)]"
          aria-label={dark ? 'Use light mode' : 'Use dark mode'}
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          className="focus-ring relative rounded-lg p-2.5 hover:bg-[var(--rr-surface-2)]"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--rr-danger)]" />
        </button>
      </div>
    </header>
  );
}
